#!/usr/bin/env node
// Drives a private Helium for job applications over the DevTools protocol.
// The browser runs on a copy of the user's main Helium profile, so it carries their
// logins without touching the running browser. It runs in a real window the user never sees,
// since sites' captchas reject headless browsers: on a virtual X display on Linux, and on WSL
// on a hidden Windows desktop (hidden-desktop.ps1). Every command prints one JSON line.
// With JOB_BROWSER_VISIBLE=1, every command drives a second copy whose window opens on the
// user's screen instead, so the user can finish a form by hand while runs keep the hidden one.
//
//   start                 sync the profile copy (if stopped) and launch the browser
//   stop                  quit the browser
//   open <url>            open a new tab and make it current
//   goto <url>            navigate the current tab
//   tabs                  list open tabs; use <id> makes one current
//   snapshot [--all]      text plus numbered visible form elements, scoped to an open dialog unless --all
//   click <ref>           real mouse click on an element from the last snapshot; reports whether a dialog is open
//   fill <ref> <text>     replace an input or textarea's text, or set a date-like input's value
//   select <ref> <label>  choose a native <select> option by its visible label
//   upload <ref> <file>   set a file input's file
//   press <key>           Enter, Tab, Escape, ArrowDown, ArrowUp or Backspace
//   eval <js>             evaluate an expression in the page, return its value
//   shot                  save a screenshot, print its path
//   close                 close the current tab
import { spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// On WSL the browser is Windows Helium, and Windows tools warn or fail when started from a WSL directory.
const WSL = Boolean(process.env.WSL_DISTRO_NAME);
const windows = (command, ...args) => spawnSync(command, args, { cwd: '/mnt/c', encoding: 'utf8' }).stdout.trim();
const toWindows = (path) => windows('wslpath', '-w', path);
const LOCAL_APP_DATA = WSL ? windows('wslpath', windows('cmd.exe', '/d', '/c', 'echo %LOCALAPPDATA%')) : null;

const BROWSER = process.env.JOB_BROWSER ?? (WSL ? join(LOCAL_APP_DATA, 'imput/Helium/Application/chrome.exe') : '/opt/helium/helium');
const SOURCE = process.env.JOB_BROWSER_SOURCE ?? (WSL ? join(LOCAL_APP_DATA, 'imput/Helium/User Data') : join(homedir(), '.config/net.imput.helium'));
const STATE = join(homedir(), '.local/state/job-apply');
const VISIBLE = process.env.JOB_BROWSER_VISIBLE === '1';
// Windows Helium cannot run a profile from the WSL filesystem, so on WSL the copies live on the Windows side.
const PROFILE = join(WSL ? join(LOCAL_APP_DATA, 'job-apply') : STATE, VISIBLE ? 'helium-visible' : 'helium-profile');
const TAB_FILE = join(STATE, VISIBLE ? 'tab-visible' : 'tab');
const SHOTS = join(STATE, 'shots');
mkdirSync(STATE, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = (value) => console.log(JSON.stringify(value));
const fail = (message) => {
  out({ ok: false, error: message });
  process.exit(1);
};

/** One DevTools WebSocket connection with request/response matching. */
async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('connect timeout')), 10000);
    ws.onopen = () => (clearTimeout(timer), resolve());
    ws.onerror = () => (clearTimeout(timer), reject(new Error('connect failed')));
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
  };
  return {
    send: (method, params = {}, sessionId) =>
      new Promise((resolve, reject) => {
        pending.set(++id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params, sessionId }));
      }),
    close: () => ws.close(),
  };
}

function activePort() {
  const file = join(PROFILE, 'DevToolsActivePort');
  if (!existsSync(file)) return null;
  const [port, path] = readFileSync(file, 'utf8').split('\n');
  return { port: port.trim(), path: path.trim() };
}

/** WSL cannot reach Windows 127.0.0.1, so a local port relays each connection through one powershell.exe. */
function tunnel(port) {
  const relay = `$client = [Net.Sockets.TcpClient]::new('127.0.0.1', ${Number(port)})
$stream = $client.GetStream()
$null = [Console]::OpenStandardInput().CopyToAsync($stream)
$stream.CopyTo([Console]::OpenStandardOutput())`;
  const encoded = Buffer.from(relay, 'utf16le').toString('base64');
  const server = createServer((socket) => {
    const shell = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { cwd: '/mnt/c', stdio: ['pipe', 'pipe', 'ignore'] });
    socket.pipe(shell.stdin);
    shell.stdout.pipe(socket);
    socket.on('error', () => shell.kill());
    socket.on('close', () => shell.kill());
    shell.on('exit', () => socket.destroy());
  });
  server.unref();
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}

async function endpoint() {
  const active = activePort();
  if (!active) return null;
  return `ws://127.0.0.1:${WSL ? await tunnel(active.port) : active.port}${active.path}`;
}

async function browser() {
  const url = await endpoint();
  if (!url) fail('Browser not running. Run start first.');
  try {
    return await connect(url);
  } catch {
    fail('Browser not running. Run start first.');
  }
}

/** Attaches to the current tab and returns a page-scoped send. */
async function page() {
  const cdp = await browser();
  if (!existsSync(TAB_FILE)) fail('No current tab. Run open <url> first.');
  const targetId = readFileSync(TAB_FILE, 'utf8').trim();
  let sessionId;
  try {
    ({ sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true }));
  } catch {
    fail('Current tab is gone. Run tabs, then use <id> or open <url>.');
  }
  const send = (method, params) => cdp.send(method, params, sessionId);
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return result.value;
  };
  return { cdp, send, evaluate };
}

async function settle(evaluate) {
  for (let i = 0; i < 30; i++) {
    if ((await evaluate('document.readyState').catch(() => null)) === 'complete') break;
    await sleep(500);
  }
  await sleep(800);
}

/** Page JS for the open modal dialogs, last one on top. */
const DIALOGS = `(() => {
  const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const modal = (el) => el.tagName === 'DIALOG' || el.getAttribute('aria-modal') === 'true' || /modal/i.test(el.className);
  return [...document.querySelectorAll('[role=dialog], [role=alertdialog], dialog[open]')].filter((el) => visible(el) && modal(el));
})()`;

async function where(evaluate) {
  return evaluate(`({ url: location.href, title: document.title, dialog: ${DIALOGS}.length > 0 })`);
}

/** Whether a running browser holds the profile's cookie file locked, as Windows Helium does. */
function locked(profile) {
  try {
    closeSync(openSync(join(profile, 'Default/Network/Cookies'), 'r'));
    return false;
  } catch (error) {
    return error.code === 'EACCES' || error.code === 'EBUSY';
  }
}

/**
 * Copies the main profile's Default folder, minus caches and history, into the private copy, which starts with no restored tabs.
 * While the main browser locks its files, a copy that does not exist yet is made from the other private copy instead,
 * and an existing one is used as it is. Returns whether it copied from the main profile.
 */
function syncProfile() {
  mkdirSync(join(PROFILE, 'Default'), { recursive: true });
  for (const name of ['SingletonLock', 'SingletonSocket', 'SingletonCookie', 'lockfile', 'DevToolsActivePort', 'Default/Sessions', 'Default/Sessions_Encrypted']) {
    rmSync(join(PROFILE, name), { recursive: true, force: true });
  }
  let from = SOURCE;
  if (locked(SOURCE)) {
    if (existsSync(join(PROFILE, 'Local State'))) return false;
    from = join(dirname(PROFILE), VISIBLE ? 'helium-profile' : 'helium-visible');
    if (!existsSync(join(from, 'Local State')) || locked(from)) fail('Helium is open, so its profile cannot be copied yet. Ask the user to close Helium, then run start again.');
  }
  writeFileSync(join(PROFILE, 'Local State'), readFileSync(join(from, 'Local State')));
  const exclude = ['IndexedDB', 'Service Worker', '*Cache*', 'blob_storage', 'File System', 'Extensions', 'History*', 'Favicons*', 'LOCK', 'Sessions'];
  const rsync = spawnSync('rsync', ['-a', '--delete', ...exclude.flatMap((e) => ['--exclude', e]), `${from}/Default/`, `${PROFILE}/Default/`]);
  if (rsync.status !== 0) fail(`Profile sync failed: ${rsync.stderr}`);
  return from === SOURCE;
}

/** The user's Wayland socket. Agent shells often lack WAYLAND_DISPLAY, so fall back to the runtime dir. */
function waylandDisplay() {
  if (process.env.WAYLAND_DISPLAY) return process.env.WAYLAND_DISPLAY;
  const runtime = process.env.XDG_RUNTIME_DIR ?? `/run/user/${process.getuid()}`;
  const socket = existsSync(runtime) && readdirSync(runtime).find((name) => /^wayland-\d+$/.test(name));
  if (!socket) fail('No Wayland display found for the visible browser.');
  return socket;
}

/** Page JS: querySelectorAll that also searches open shadow roots. */
const DEEP = `const deepAll = (root, selector) => {
  const found = [...root.querySelectorAll(selector)];
  for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deepAll(el.shadowRoot, selector));
  return found;
};`;

const element = (ref) => `(() => { ${DEEP} return deepAll(document, '[data-ja-ref="${Number(ref)}"]')[0] ?? null; })()`;

/** Runs in the page: numbers visible form elements, including those in open shadow roots, and returns them with readable text. */
const SNAPSHOT = (all) => `(() => {
  ${DEEP}
  const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const dialogs = ${DIALOGS};
  const root = ${all} || dialogs.length === 0 ? document.body : dialogs.at(-1);
  const clean = (s) => (s ?? '').replace(/\\s+/g, ' ').trim();
  const choice = (el) => el.type === 'radio' || el.type === 'checkbox';
  // A styled radio or checkbox often hides its input, so judge it by its label.
  const shown = (el) => {
    const box = choice(el) ? (el.labels?.[0] ?? el.parentElement ?? el) : el;
    if (!visible(box) || box.closest('[inert]')) return false;
    if (!box.checkVisibility({ opacityProperty: true, visibilityProperty: true, checkOpacity: true, checkVisibilityCSS: true })) return false;
    const r = box.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || r.right + scrollX <= 0 || r.bottom + scrollY <= 0) return false;
    for (let up = box.parentElement; up; up = up.parentElement) {
      const clip = up.getBoundingClientRect();
      if (getComputedStyle(up).overflow !== 'visible' && (clip.width === 0 || clip.height === 0)) return false;
    }
    return true;
  };
  const labelOf = (el) => clean(
    (choice(el) && [...(el.labels ?? [])].map((l) => l.innerText).join(' ')) ||
    el.getAttribute('aria-label') ||
    [...(el.labels ?? [])].map((l) => l.innerText).join(' ') ||
    (el.getAttribute('aria-labelledby') ?? '').split(' ').map((id) => (el.getRootNode().getElementById?.(id) ?? document.getElementById(id))?.innerText ?? '').join(' ') ||
    el.placeholder || el.innerText || el.value || el.name || el.title
  ).slice(0, 160);
  deepAll(document, '[data-ja-ref]').forEach((el) => el.removeAttribute('data-ja-ref'));
  const selector = 'input, textarea, select, button, a[href], [role=button], [role=checkbox], [role=radio], [role=combobox], [role=option], [role=link], [role=switch], [contenteditable=true]';
  const elements = [];
  // File inputs often sit outside the modal that uses them, so they are always included.
  const candidates = new Set([...deepAll(root, selector), ...deepAll(document, 'input[type=file]')]);
  for (const el of candidates) {
    const file = el.type === 'file';
    if (el.type === 'hidden' || (!file && !shown(el))) continue;
    const ref = elements.length + 1;
    el.setAttribute('data-ja-ref', ref);
    const item = { ref, tag: el.tagName.toLowerCase(), label: labelOf(el) };
    const role = el.getAttribute('role');
    if (role) item.role = role;
    const legend = choice(el) ? clean(el.closest('fieldset')?.querySelector('legend')?.innerText) : '';
    if (legend) item.group = legend.slice(0, 160);
    if (el.type && el.tagName !== 'BUTTON') item.type = el.type;
    if ('value' in el && el.value && !file && el.tagName !== 'BUTTON') item.value = String(el.value).slice(0, 200);
    if (el.checked || el.getAttribute('aria-checked') === 'true') item.checked = true;
    if (el.required || el.getAttribute('aria-required') === 'true') item.required = true;
    if (el.disabled) item.disabled = true;
    if (el.tagName === 'SELECT') item.options = [...el.options].map((o) => clean(o.text));
    if (el.tagName === 'A') item.href = el.href.slice(0, 200);
    elements.push(item);
  }
  return {
    url: location.href,
    title: document.title,
    scope: root === document.body ? 'page' : 'dialog',
    text: clean(root.innerText).slice(0, 6000),
    elements,
  };
})()`;

const KEYS = {
  Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
  Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
  Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 },
  ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38 },
  Backspace: { key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 },
};

const commands = {
  async start() {
    const url = await endpoint();
    if (url && (await connect(url).then((c) => (c.close(), true)).catch(() => false))) {
      return out({ ok: true, running: true });
    }
    if (!existsSync(BROWSER)) fail(`No browser at ${BROWSER}. Set JOB_BROWSER.`);
    if (!WSL && !VISIBLE && spawnSync('which', ['xvfb-run']).status !== 0) fail('xvfb-run not found. Install Xvfb.');
    const synced = syncProfile();
    const flags = [`--user-data-dir=${WSL ? toWindows(PROFILE) : PROFILE}`, '--disable-blink-features=AutomationControlled', '--remote-debugging-port=0', '--window-size=1280,900', '--no-first-run', '--no-default-browser-check', 'about:blank'];
    const launch = () => {
      if (WSL && VISIBLE) {
        spawn(BROWSER, flags, { cwd: '/mnt/c', detached: true, stdio: 'ignore' }).unref();
      } else if (WSL) {
        // A desktop nobody looks at counts as occluded, so keep Helium from pausing its rendering there.
        const hidden = [...flags, '--disable-features=CalculateNativeWinOcclusion', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'];
        const commandLine = [toWindows(BROWSER), ...hidden].map((arg) => `"${arg}"`).join(' ');
        const script = toWindows(join(dirname(fileURLToPath(import.meta.url)), 'hidden-desktop.ps1'));
        const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, Buffer.from(commandLine).toString('base64')], { cwd: '/mnt/c', encoding: 'utf8' });
        if (result.status !== 0) fail(`Hidden desktop launch failed: ${result.stderr.trim()}`);
      } else {
        // Without WAYLAND_DISPLAY and with ozone on x11, the hidden window opens on Xvfb, never on the user's screen.
        const { WAYLAND_DISPLAY, ...env } = process.env;
        const child = VISIBLE
          ? spawn(BROWSER, ['--ozone-platform=wayland', ...flags], { detached: true, stdio: 'ignore', env: { ...env, WAYLAND_DISPLAY: waylandDisplay() } })
          : spawn('xvfb-run', ['-a', '-s', '-screen 0 1280x900x24', BROWSER, '--ozone-platform=x11', ...flags], { detached: true, stdio: 'ignore', env });
        child.unref();
      }
    };
    // Windows Helium sometimes crashes during startup, so a launch that never opens its port gets one retry.
    for (let attempt = 0; attempt < 2 && !activePort(); attempt++) {
      launch();
      for (let i = 0; i < 120 && !activePort(); i++) await sleep(250);
    }
    if (!activePort()) fail('Browser did not start.');
    out({ ok: true, running: true, synced, ...(!synced && { note: 'Helium is open, so this run uses the profile copy from its last start.' }) });
  },

  async stop() {
    const url = await endpoint();
    if (url) {
      const cdp = await connect(url).catch(() => null);
      await cdp?.send('Browser.close').catch(() => {});
    }
    rmSync(join(PROFILE, 'DevToolsActivePort'), { force: true });
    rmSync(TAB_FILE, { force: true });
    out({ ok: true, running: false });
  },

  async open(url) {
    if (!url) fail('Usage: open <url>');
    const cdp = await browser();
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    writeFileSync(TAB_FILE, targetId);
    const { send, evaluate } = await page();
    await send('Page.navigate', { url });
    await settle(evaluate);
    out({ ok: true, tab: targetId, ...(await where(evaluate)) });
  },

  async goto(url) {
    if (!url) fail('Usage: goto <url>');
    const { send, evaluate } = await page();
    await send('Page.navigate', { url });
    await settle(evaluate);
    out({ ok: true, ...(await where(evaluate)) });
  },

  async tabs() {
    const cdp = await browser();
    const { targetInfos } = await cdp.send('Target.getTargets');
    const current = existsSync(TAB_FILE) ? readFileSync(TAB_FILE, 'utf8').trim() : null;
    const tabs = targetInfos
      .filter((t) => t.type === 'page')
      .map((t) => ({ id: t.targetId, url: t.url, title: t.title, current: t.targetId === current }));
    out({ ok: true, tabs });
  },

  async use(id) {
    if (!id) fail('Usage: use <id>');
    writeFileSync(TAB_FILE, id);
    const { evaluate } = await page();
    out({ ok: true, tab: id, ...(await where(evaluate)) });
  },

  async snapshot(flag) {
    const { evaluate } = await page();
    out({ ok: true, ...(await evaluate(SNAPSHOT(flag === '--all'))) });
  },

  async click(ref) {
    const { send, evaluate } = await page();
    const box = await evaluate(`(() => {
      const el = ${element(ref)};
      if (!el) return null;
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    if (!box) fail(`No element ${ref}. Take a new snapshot.`);
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
    }
    await settle(evaluate);
    out({ ok: true, ...(await where(evaluate)) });
  },

  async fill(ref, ...words) {
    const text = words.join(' ');
    const { send, evaluate } = await page();
    const found = await evaluate(`(() => {
      const el = ${element(ref)};
      if (!el) return false;
      // Date-like inputs take no typed text, so set their value directly, such as 2027-07 for a month.
      if (el.tagName === 'INPUT' && ['date', 'month', 'week', 'time', 'datetime-local', 'color', 'range'].includes(el.type)) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(text)});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return 'set';
      }
      el.scrollIntoView({ block: 'center' });
      el.focus();
      if (el.isContentEditable) document.execCommand('selectAll');
      else el.select?.();
      return true;
    })()`);
    if (!found) fail(`No element ${ref}. Take a new snapshot.`);
    if (found !== 'set') {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', ...KEYS.Backspace });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...KEYS.Backspace });
      if (text) await send('Input.insertText', { text });
    }
    await sleep(500);
    const value = await evaluate(`(${element(ref)}?.value ?? ${element(ref)}?.innerText ?? '')`);
    out({ ok: true, ref: Number(ref), value });
  },

  async select(ref, ...words) {
    const label = words.join(' ');
    const { evaluate } = await page();
    const result = await evaluate(`(() => {
      const el = ${element(ref)};
      if (!el || el.tagName !== 'SELECT') return { error: 'Not a native select. Click it and pick the option instead.' };
      const option = [...el.options].find((o) => o.text.trim() === ${JSON.stringify(label)});
      if (!option) return { error: 'No option labelled ' + ${JSON.stringify(label)} };
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, option.value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { value: option.text.trim() };
    })()`);
    if (result.error) fail(result.error);
    out({ ok: true, ref: Number(ref), ...result });
  },

  async upload(ref, file) {
    if (!file || !existsSync(file)) fail(`No such file: ${file}`);
    const { send, evaluate } = await page();
    const { result } = await send('Runtime.evaluate', { expression: element(ref) });
    if (!result.objectId) fail(`No element ${ref}. Take a new snapshot.`);
    await send('DOM.setFileInputFiles', { files: [WSL ? toWindows(file) : file], objectId: result.objectId });
    await settle(evaluate);
    out({ ok: true, ref: Number(ref), file });
  },

  async press(name) {
    const key = KEYS[name];
    if (!key) fail(`Unknown key. Use one of: ${Object.keys(KEYS).join(', ')}`);
    const { send, evaluate } = await page();
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...key });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
    await settle(evaluate);
    out({ ok: true, ...(await where(evaluate)) });
  },

  async eval(...words) {
    const { evaluate } = await page();
    out({ ok: true, value: await evaluate(words.join(' ')) });
  },

  async shot() {
    const { send } = await page();
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    mkdirSync(SHOTS, { recursive: true });
    const path = join(SHOTS, `${new Date().toISOString().replace(/[:.]/g, '-')}.png`);
    writeFileSync(path, Buffer.from(data, 'base64'));
    out({ ok: true, path });
  },

  async close() {
    const cdp = await browser();
    if (existsSync(TAB_FILE)) {
      await cdp.send('Target.closeTarget', { targetId: readFileSync(TAB_FILE, 'utf8').trim() }).catch(() => {});
      rmSync(TAB_FILE, { force: true });
    }
    out({ ok: true });
  },
};

const [name, ...args] = process.argv.slice(2);
const command = commands[name];
if (!command) fail(`Unknown command. Use one of: ${Object.keys(commands).join(', ')}`);
try {
  await command(...args);
} catch (error) {
  fail(error.message);
}
process.exit(0);
