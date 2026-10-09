#!/usr/bin/env node
// Drives a private Helium for job applications over the DevTools protocol.
// The browser runs on a copy of the user's main Helium profile, so it carries their
// logins without touching the running browser. It runs in a real window on a virtual
// X display, since sites' captchas reject headless browsers. Every command prints one JSON line.
//
//   start                 sync the profile copy (if stopped) and launch the browser
//   stop                  quit the browser
//   open <url>            open a new tab and make it current
//   goto <url>            navigate the current tab
//   tabs                  list open tabs; use <id> makes one current
//   snapshot [--all]      text plus numbered form elements, scoped to an open dialog unless --all
//   click <ref>           real mouse click on an element from the last snapshot; reports whether a dialog is open
//   fill <ref> <text>     replace an input or textarea's text
//   select <ref> <label>  choose a native <select> option by its visible label
//   upload <ref> <file>   set a file input's file
//   press <key>           Enter, Tab, Escape, ArrowDown, ArrowUp or Backspace
//   eval <js>             evaluate an expression in the page, return its value
//   shot                  save a screenshot, print its path
//   close                 close the current tab
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BROWSER = process.env.JOB_BROWSER ?? '/opt/helium/helium';
const SOURCE = process.env.JOB_BROWSER_SOURCE ?? join(homedir(), '.config/net.imput.helium');
const STATE = join(homedir(), '.local/state/job-apply');
const PROFILE = join(STATE, 'helium-profile');
const TAB_FILE = join(STATE, 'tab');
const SHOTS = join(STATE, 'shots');

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
    const timer = setTimeout(() => reject(new Error('connect timeout')), 3000);
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

function endpoint() {
  const file = join(PROFILE, 'DevToolsActivePort');
  if (!existsSync(file)) return null;
  const [port, path] = readFileSync(file, 'utf8').split('\n');
  return `ws://127.0.0.1:${port.trim()}${path.trim()}`;
}

async function browser() {
  const url = endpoint();
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

/** Copies the main profile's Default folder, minus caches and history, into the private copy. */
function syncProfile() {
  mkdirSync(join(PROFILE, 'Default'), { recursive: true });
  for (const name of ['SingletonLock', 'SingletonSocket', 'SingletonCookie', 'DevToolsActivePort']) {
    rmSync(join(PROFILE, name), { force: true });
  }
  writeFileSync(join(PROFILE, 'Local State'), readFileSync(join(SOURCE, 'Local State')));
  const exclude = ['IndexedDB', 'Service Worker', '*Cache*', 'blob_storage', 'File System', 'Extensions', 'History*', 'Favicons*', 'LOCK', 'Sessions'];
  const rsync = spawnSync('rsync', ['-a', '--delete', ...exclude.flatMap((e) => ['--exclude', e]), `${SOURCE}/Default/`, `${PROFILE}/Default/`]);
  if (rsync.status !== 0) fail(`Profile sync failed: ${rsync.stderr}`);
}

const element = (ref) => `document.querySelector('[data-ja-ref="${Number(ref)}"]')`;

/** Runs in the page: numbers visible form elements and returns them with readable text. */
const SNAPSHOT = (all) => `(() => {
  const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const dialogs = ${DIALOGS};
  const root = ${all} || dialogs.length === 0 ? document.body : dialogs.at(-1);
  const clean = (s) => (s ?? '').replace(/\\s+/g, ' ').trim();
  const choice = (el) => el.type === 'radio' || el.type === 'checkbox';
  const labelOf = (el) => clean(
    (choice(el) && [...(el.labels ?? [])].map((l) => l.innerText).join(' ')) ||
    el.getAttribute('aria-label') ||
    [...(el.labels ?? [])].map((l) => l.innerText).join(' ') ||
    (el.getAttribute('aria-labelledby') ?? '').split(' ').map((id) => document.getElementById(id)?.innerText ?? '').join(' ') ||
    el.placeholder || el.innerText || el.value || el.name || el.title
  ).slice(0, 160);
  document.querySelectorAll('[data-ja-ref]').forEach((el) => el.removeAttribute('data-ja-ref'));
  const selector = 'input, textarea, select, button, a[href], [role=button], [role=checkbox], [role=radio], [role=combobox], [role=option], [role=link], [role=switch], [contenteditable=true]';
  const elements = [];
  // File inputs often sit outside the modal that uses them, so they are always included.
  const candidates = new Set([...root.querySelectorAll(selector), ...document.querySelectorAll('input[type=file]')]);
  for (const el of candidates) {
    const file = el.type === 'file';
    if (el.type === 'hidden' || (!file && !visible(el))) continue;
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
    const url = endpoint();
    if (url && (await connect(url).then((c) => (c.close(), true)).catch(() => false))) {
      return out({ ok: true, running: true });
    }
    if (spawnSync('which', ['xvfb-run']).status !== 0) fail('xvfb-run not found. Install Xvfb.');
    syncProfile();
    // Without WAYLAND_DISPLAY and with ozone on x11, the window opens on Xvfb, never on the user's screen.
    const { WAYLAND_DISPLAY, ...env } = process.env;
    const child = spawn(
      'xvfb-run',
      ['-a', '-s', '-screen 0 1280x900x24', BROWSER, `--user-data-dir=${PROFILE}`, '--ozone-platform=x11', '--disable-blink-features=AutomationControlled', '--remote-debugging-port=0', '--window-size=1280,900', '--no-first-run', '--no-default-browser-check', 'about:blank'],
      { detached: true, stdio: 'ignore', env },
    );
    child.unref();
    for (let i = 0; i < 60 && !endpoint(); i++) await sleep(250);
    if (!endpoint()) fail('Browser did not start.');
    out({ ok: true, running: true, synced: true });
  },

  async stop() {
    const url = endpoint();
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
      el.scrollIntoView({ block: 'center' });
      el.focus();
      if (el.isContentEditable) document.execCommand('selectAll');
      else el.select?.();
      return true;
    })()`);
    if (!found) fail(`No element ${ref}. Take a new snapshot.`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...KEYS.Backspace });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...KEYS.Backspace });
    if (text) await send('Input.insertText', { text });
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
    await send('DOM.setFileInputFiles', { files: [file], objectId: result.objectId });
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
