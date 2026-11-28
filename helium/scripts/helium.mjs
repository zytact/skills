#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createConnection, createServer } from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WSL = Boolean(process.env.WSL_DISTRO_NAME);
const WINDOWS = WSL || process.platform === 'win32';
const CWD = WSL ? '/mnt/c' : undefined;
const run = (command, ...args) => spawnSync(command, args, { cwd: CWD, encoding: 'utf8' }).stdout.trim();
const browserPath = (path) => (WSL ? run('wslpath', '-w', path) : path);
const LOCAL_APP_DATA = WSL ? run('wslpath', run('cmd.exe', '/d', '/c', 'echo %LOCALAPPDATA%')) : process.env.LOCALAPPDATA;

const BROWSER = process.env.HELIUM_BROWSER ?? (WINDOWS ? join(LOCAL_APP_DATA, 'imput/Helium/Application/chrome.exe') : '/opt/helium/helium');
const USER_DATA = process.env.HELIUM_USER_DATA ?? (WINDOWS ? join(LOCAL_APP_DATA, 'imput/Helium/User Data') : join(homedir(), '.config/net.imput.helium'));
const STATE = join(homedir(), '.local/state/helium');
const DAEMON_FILE = join(STATE, 'browser.json');
const DAEMON_LOG = join(STATE, 'browser.log');
const SHOTS = join(STATE, 'shots');
const ATTACH_TIMEOUT_MS = 120000;
const REQUEST_TIMEOUT_MS = 60000;
mkdirSync(STATE, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const print = (value) => console.log(JSON.stringify(value));
const fail = (message) => {
  print({ ok: false, error: message });
  process.exit(1);
};

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
};

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

function request(port, message) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ port, host: '127.0.0.1' });
    let data = '';
    socket.on('connect', () => socket.write(JSON.stringify(message) + '\n'));
    socket.on('data', (chunk) => (data += chunk));
    socket.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('The browser daemon sent no reply.'));
      }
    });
    socket.on('error', reject);
  });
}

async function runningDaemon() {
  const info = readJson(DAEMON_FILE);
  if (!info?.port || !alive(info.pid)) return null;
  const reply = await request(info.port, { name: 'ping', args: [] }).catch(() => null);
  return reply?.ok ? info : null;
}

async function startCommand() {
  const running = await runningDaemon();
  if (running) return print({ ok: true, attached: true });
  rmSync(DAEMON_FILE, { force: true });
  const log = openSync(DAEMON_LOG, 'w');
  spawn(process.execPath, [fileURLToPath(import.meta.url), 'serve'], { detached: true, stdio: ['ignore', log, log] }).unref();
  const deadline = Date.now() + ATTACH_TIMEOUT_MS + 45000;
  while (Date.now() < deadline) {
    const info = readJson(DAEMON_FILE);
    if (info?.error) {
      rmSync(DAEMON_FILE, { force: true });
      fail(info.error);
    }
    if (info?.port) return print({ ok: true, attached: true });
    await sleep(250);
  }
  fail(`The browser daemon did not start. See ${DAEMON_LOG}.`);
}

async function clientCommand(name, args) {
  const info = await runningDaemon();
  if (!info) {
    if (name === 'stop') return print({ ok: true, attached: false });
    fail('Not attached to Helium. Run start first.');
  }
  const reply = await request(info.port, { name, args }).catch((error) => ({ ok: false, error: error.message }));
  print(reply);
  if (!reply.ok) process.exit(1);
}

function activePort() {
  const file = join(USER_DATA, 'DevToolsActivePort');
  if (!existsSync(file)) return null;
  const [port, path] = readFileSync(file, 'utf8').split('\n');
  return { port: port.trim(), path: path.trim(), written: statSync(file).mtimeMs };
}

function tunnel(port) {
  const relay = `$client = [Net.Sockets.TcpClient]::new('127.0.0.1', ${Number(port)})
$stream = $client.GetStream()
$null = [Console]::OpenStandardInput().CopyToAsync($stream)
$stream.CopyTo([Console]::OpenStandardOutput())`;
  const encoded = Buffer.from(relay, 'utf16le').toString('base64');
  const server = createServer((socket) => {
    const shell = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { cwd: CWD, stdio: ['pipe', 'pipe', 'ignore'] });
    socket.pipe(shell.stdin);
    shell.stdout.pipe(socket);
    socket.on('error', () => shell.kill());
    socket.on('close', () => shell.kill());
    shell.on('exit', () => socket.destroy());
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function endpoint(active) {
  if (!WSL) return `ws://127.0.0.1:${active.port}${active.path}`;
  const server = await tunnel(active.port);
  return `ws://127.0.0.1:${server.address().port}${active.path}`;
}

const APPROVAL_TITLE = 'Helium needs your approval';
const APPROVAL_TEXT = 'Allow the remote debugging connection so the agent can continue.';

function promptForApproval() {
  if (!WINDOWS) {
    spawn('notify-send', ['--urgency=critical', APPROVAL_TITLE, APPROVAL_TEXT], { stdio: 'ignore' }).on('error', () => {});
    return;
  }
  const script = `$browser = '${browserPath(BROWSER).replaceAll("'", "''")}'
$window = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $browser -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if ($window) { $null = (New-Object -ComObject WScript.Shell).AppActivate($window.Id) }
$null = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
$toast = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$lines = $toast.GetElementsByTagName('text')
$null = $lines.Item(0).AppendChild($toast.CreateTextNode('${APPROVAL_TITLE}'))
$null = $lines.Item(1).AppendChild($toast.CreateTextNode('${APPROVAL_TEXT}'))
$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe')
$notifier.Show([Windows.UI.Notifications.ToastNotification]::new($toast))`;
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { cwd: CWD, stdio: 'ignore' }).on('error', () => {});
}

async function connect(url, onEvent, onClose) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    const awaitingApproval = setTimeout(promptForApproval, 3000);
    const timer = setTimeout(() => reject(new Error('timeout')), ATTACH_TIMEOUT_MS);
    const settle = () => (clearTimeout(awaitingApproval), clearTimeout(timer));
    ws.onopen = () => (settle(), resolve());
    ws.onerror = () => (settle(), reject(new Error('refused')));
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id === undefined) return onEvent(message);
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    clearTimeout(entry.timer);
    message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
  };
  ws.onclose = onClose;
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error(`${method} got no answer within ${REQUEST_TIMEOUT_MS / 1000} seconds.`));
      }, REQUEST_TIMEOUT_MS);
      pending.set(requestId, { resolve, reject, timer, sessionId });
      ws.send(JSON.stringify({ id: requestId, method, params, sessionId }));
    });
  send.failSession = (sessionId, error) => {
    for (const [requestId, entry] of pending) {
      if (entry.sessionId !== sessionId) continue;
      pending.delete(requestId);
      clearTimeout(entry.timer);
      entry.reject(error);
    }
  };
  return send;
}

async function attach(onEvent, onClose) {
  const existing = activePort();
  if (existing) {
    const url = await endpoint(existing);
    const send = await connect(url, onEvent, onClose).catch((error) => error);
    if (!(send instanceof Error)) return send;
    if (send.message === 'timeout') throw new Error('Helium did not accept the DevTools connection. Approve the remote debugging prompt in Helium, then run start again.');
  }
  if (!existsSync(BROWSER)) throw new Error(`Helium is not running and there is no browser at ${BROWSER}. Set HELIUM_BROWSER.`);
  spawn(BROWSER, [], { cwd: CWD, detached: true, stdio: 'ignore' }).unref();
  const launched = Date.now();
  for (let i = 0; i < 120; i++) {
    await sleep(250);
    const active = activePort();
    if (active && active.written >= launched - 1000) return connect(await endpoint(active), onEvent, onClose);
  }
  throw new Error('Helium is running without remote debugging. Turn it on at chrome://inspect/#remote-debugging, then run start again.');
}

const DIALOGS = `(() => {
  const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const modal = (el) => el.tagName === 'DIALOG' || el.getAttribute('aria-modal') === 'true' || /modal/i.test(el.className);
  return [...document.querySelectorAll('[role=dialog], [role=alertdialog], dialog[open]')].filter((el) => visible(el) && modal(el));
})()`;

const DEEP = `const deepAll = (root, selector) => {
  const found = [...root.querySelectorAll(selector)];
  for (const el of root.querySelectorAll('*')) {
    if (el.shadowRoot) found.push(...deepAll(el.shadowRoot, selector));
    if (el.tagName === 'IFRAME') {
      let inner = null;
      try { inner = el.contentDocument; } catch {}
      if (inner?.body) found.push(...deepAll(inner, selector));
    }
  }
  return found;
};
const pageBox = (el) => {
  const r = el.getBoundingClientRect();
  let x = r.left + r.width / 2;
  let y = r.top + r.height / 2;
  for (let frame = el.ownerDocument.defaultView.frameElement; frame; frame = frame.ownerDocument.defaultView.frameElement) {
    const f = frame.getBoundingClientRect();
    x += f.left + frame.clientLeft;
    y += f.top + frame.clientTop;
  }
  return { x, y };
};`;

const element = (ref) => `(() => { ${DEEP} return deepAll(document, '[data-helium-ref="${Number(ref)}"]')[0] ?? null; })()`;

const SNAPSHOT = (all) => `(() => {
  ${DEEP}
  const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const dialogs = ${DIALOGS};
  const root = ${all} || dialogs.length === 0 ? document.body : dialogs.at(-1);
  const clean = (s) => (s ?? '').replace(/\\s+/g, ' ').trim();
  const choice = (el) => el.type === 'radio' || el.type === 'checkbox';
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
  deepAll(document, '[data-helium-ref]').forEach((el) => el.removeAttribute('data-helium-ref'));
  const selector = 'input, textarea, select, button, a[href], [role=button], [role=checkbox], [role=radio], [role=combobox], [role=option], [role=link], [role=switch], [contenteditable=true]';
  const elements = [];
  const candidates = new Set([...deepAll(root, selector), ...deepAll(document, 'input[type=file]')]);
  for (const el of candidates) {
    const file = el.type === 'file';
    if (el.type === 'hidden' || (!file && !shown(el))) continue;
    const ref = elements.length + 1;
    el.setAttribute('data-helium-ref', ref);
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

async function serve() {
  const tabs = new Set();
  const sessions = new Map();
  const dialogs = new Map();
  let current = null;
  let send;
  const dialogError = ({ type, message }) => new Error(`The page opened a ${type} dialog: "${message}". Run dialog accept or dialog dismiss.`);
  let shuttingDown = false;
  const exit = (reason) => {
    console.error(`${new Date().toISOString()} exit: ${reason}`);
    if (readJson(DAEMON_FILE)?.pid === process.pid) rmSync(DAEMON_FILE, { force: true });
    process.exit(0);
  };
  const onEvent = ({ method, params, sessionId }) => {
    if (method === 'Page.javascriptDialogOpening') {
      dialogs.set(sessionId, params);
      send.failSession(sessionId, dialogError(params));
    }
    if (method === 'Page.javascriptDialogClosed') dialogs.delete(sessionId);
    if (method === 'Target.targetCreated' && params.targetInfo.type === 'page' && tabs.has(params.targetInfo.openerId)) tabs.add(params.targetInfo.targetId);
    if (method === 'Target.targetDestroyed') {
      tabs.delete(params.targetId);
      sessions.delete(params.targetId);
      if (current === params.targetId) current = null;
    }
  };

  try {
    send = await attach(onEvent, (event) => shuttingDown || exit(`Helium closed the DevTools connection (code ${event?.code})`));
  } catch (error) {
    writeFileSync(DAEMON_FILE, JSON.stringify({ error: error.message }));
    process.exit(1);
  }
  await send('Target.setDiscoverTargets', { discover: true });
  const windowOf = async (targetId) => (await send('Browser.getWindowForTarget', { targetId })).windowId;
  const setWindow = async (targetId, windowState) => send('Browser.setWindowBounds', { windowId: await windowOf(targetId), bounds: { windowState } });

  const page = async () => {
    if (!current) throw new Error('No current tab. Run open <url>, or tabs then use <id>.');
    let sessionId = sessions.get(current);
    if (!sessionId) {
      ({ sessionId } = await send('Target.attachToTarget', { targetId: current, flatten: true }));
      sessions.set(current, sessionId);
      await send('Page.enable', {}, sessionId);
      await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId).catch(() => {});
    }
    if (dialogs.has(sessionId)) throw dialogError(dialogs.get(sessionId));
    const pageSend = (method, params) => send(method, params, sessionId);
    const evaluate = async (expression) => {
      const { result, exceptionDetails } = await pageSend('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
      return result.value;
    };
    return { send: pageSend, evaluate };
  };

  const settle = async (evaluate) => {
    for (let i = 0; i < 30; i++) {
      if ((await evaluate('document.readyState').catch(() => null)) === 'complete') break;
      await sleep(500);
    }
    await sleep(800);
  };

  const where = (evaluate) => evaluate(`({ url: location.href, title: document.title, dialog: ${DIALOGS}.length > 0 })`);

  const commands = {
    async ping() {
      return {};
    },

    async open(url) {
      if (!url) throw new Error('Usage: open <url>');
      const { targetId } = await send('Target.createTarget', { url: 'about:blank', newWindow: true, background: true });
      tabs.add(targetId);
      await setWindow(targetId, 'minimized');
      current = targetId;
      const { send: pageSend, evaluate } = await page();
      await pageSend('Page.navigate', { url });
      await settle(evaluate);
      return { tab: targetId, ...(await where(evaluate)) };
    },

    async goto(url) {
      if (!url) throw new Error('Usage: goto <url>');
      const { send: pageSend, evaluate } = await page();
      await pageSend('Page.navigate', { url });
      await settle(evaluate);
      return where(evaluate);
    },

    async tabs() {
      const { targetInfos } = await send('Target.getTargets');
      return { tabs: targetInfos.filter((t) => tabs.has(t.targetId)).map((t) => ({ id: t.targetId, url: t.url, title: t.title, current: t.targetId === current })) };
    },

    async use(id) {
      if (!tabs.has(id)) throw new Error('No such tab. Run tabs.');
      current = id;
      const { evaluate } = await page();
      return { tab: id, ...(await where(evaluate)) };
    },

    async snapshot(flag) {
      const { evaluate } = await page();
      return evaluate(SNAPSHOT(flag === '--all'));
    },

    async click(ref) {
      const { send: pageSend, evaluate } = await page();
      const box = await evaluate(`(() => {
        ${DEEP}
        const el = deepAll(document, '[data-helium-ref="${Number(ref)}"]')[0];
        if (!el) return null;
        el.scrollIntoView({ block: 'center', inline: 'center' });
        return pageBox(el);
      })()`);
      if (!box) throw new Error(`No element ${ref}. Take a new snapshot.`);
      for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
        await pageSend('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
      }
      await settle(evaluate);
      return where(evaluate);
    },

    async fill(ref, ...words) {
      const text = words.join(' ');
      const { send: pageSend, evaluate } = await page();
      const found = await evaluate(`(() => {
        const el = ${element(ref)};
        if (!el) return false;
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
      if (!found) throw new Error(`No element ${ref}. Take a new snapshot.`);
      if (found !== 'set') {
        await pageSend('Input.dispatchKeyEvent', { type: 'keyDown', ...KEYS.Backspace });
        await pageSend('Input.dispatchKeyEvent', { type: 'keyUp', ...KEYS.Backspace });
        if (text) await pageSend('Input.insertText', { text });
      }
      await sleep(500);
      return { ref: Number(ref), value: await evaluate(`(${element(ref)}?.value ?? ${element(ref)}?.innerText ?? '')`) };
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
      if (result.error) throw new Error(result.error);
      return { ref: Number(ref), ...result };
    },

    async upload(ref, file) {
      if (!file || !existsSync(file)) throw new Error(`No such file: ${file}`);
      const { send: pageSend, evaluate } = await page();
      const { result } = await pageSend('Runtime.evaluate', { expression: element(ref) });
      if (!result.objectId) throw new Error(`No element ${ref}. Take a new snapshot.`);
      await pageSend('DOM.setFileInputFiles', { files: [browserPath(file)], objectId: result.objectId });
      await settle(evaluate);
      return { ref: Number(ref), file };
    },

    async press(name) {
      const key = KEYS[name];
      if (!key) throw new Error(`Unknown key. Use one of: ${Object.keys(KEYS).join(', ')}`);
      const { send: pageSend, evaluate } = await page();
      await pageSend('Input.dispatchKeyEvent', { type: 'keyDown', ...key });
      await pageSend('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
      await settle(evaluate);
      return where(evaluate);
    },

    async eval(...words) {
      const { evaluate } = await page();
      return { value: await evaluate(words.join(' ')) };
    },

    async shot() {
      const { send: pageSend } = await page();
      const { data } = await pageSend('Page.captureScreenshot', { format: 'png' });
      mkdirSync(SHOTS, { recursive: true });
      const path = join(SHOTS, `${new Date().toISOString().replace(/[:.]/g, '-')}.png`);
      writeFileSync(path, Buffer.from(data, 'base64'));
      return { path };
    },

    async dialog(action, ...words) {
      if (!['accept', 'dismiss'].includes(action)) throw new Error('Usage: dialog accept|dismiss [prompt text]');
      const sessionId = sessions.get(current);
      const open = dialogs.get(sessionId);
      if (!open) throw new Error('No dialog is open on the current tab.');
      await send('Page.handleJavaScriptDialog', { accept: action === 'accept', ...(words.length && { promptText: words.join(' ') }) }, sessionId);
      dialogs.delete(sessionId);
      return { dialog: open.type, message: open.message, action };
    },

    async show() {
      if (!current) throw new Error('No current tab. Run open <url>, or tabs then use <id>.');
      await setWindow(current, 'normal');
      await send('Target.activateTarget', { targetId: current });
      return { window: 'normal' };
    },

    async hide() {
      if (!current) throw new Error('No current tab. Run open <url>, or tabs then use <id>.');
      await setWindow(current, 'minimized');
      return { window: 'minimized' };
    },

    async close() {
      if (!current) return {};
      await send('Target.closeTarget', { targetId: current });
      tabs.delete(current);
      current = null;
      return {};
    },

    async stop() {
      shuttingDown = true;
      for (const targetId of tabs) await send('Target.closeTarget', { targetId }).catch(() => {});
      setTimeout(() => exit('stop'), 100);
      return { attached: false };
    },
  };

  let queue = Promise.resolve();
  const server = createServer((socket) => {
    let data = '';
    socket.on('data', (chunk) => {
      data += chunk;
      if (!data.includes('\n')) return;
      const { name, args } = JSON.parse(data);
      queue = queue.then(async () => {
        const command = commands[name];
        const reply = command
          ? await command(...args).then((result) => ({ ok: true, ...result }), (error) => ({ ok: false, error: error.message }))
          : { ok: false, error: `Unknown command. Use one of: start, ${Object.keys(commands).filter((c) => c !== 'ping').join(', ')}` };
        socket.end(JSON.stringify(reply));
      });
    });
  });
  server.listen(0, '127.0.0.1', () => writeFileSync(DAEMON_FILE, JSON.stringify({ port: server.address().port, pid: process.pid })));
}

const [name, ...args] = process.argv.slice(2);
if (name === 'serve') await serve();
else if (name === 'start') await startCommand();
else if (name) await clientCommand(name, args);
else fail('Usage: helium.mjs <command>');
