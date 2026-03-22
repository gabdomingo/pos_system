import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import WebSocket from '../mobile/node_modules/ws/index.js';

const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9222;
const FIGURES_DIR = '/Users/celmargalindez/GABRIEL DOMINGO/pos_system/docs/figures';
const WEB_URL = 'http://127.0.0.1:5173';
const MOBILE_URL = process.env.MOBILE_CAPTURE_URL || 'http://127.0.0.1:4173';
const API_URL = 'http://localhost:5001';
const MOBILE_STORAGE_KEY = '@pos_mobile_auth';
const INCLUDE_WEB = process.env.INCLUDE_WEB !== '0';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function waitForHttp(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (error) {
      // Server might still be starting.
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function login(email, password, role) {
  const res = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${await res.text()}`);
  }
  return res.json();
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.socket = null;
    this.nextId = 0;
    this.pending = new Map();
    this.eventWaiters = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (pending) {
          this.pending.delete(message.id);
          if (message.error) pending.reject(new Error(message.error.message));
          else pending.resolve(message.result);
        }
        return;
      }
      if (!message.method) return;
      const waiters = this.eventWaiters.get(message.method) || [];
      while (waiters.length) {
        const resolve = waiters.shift();
        resolve(message.params || {});
      }
    });
  }

  async close() {
    if (this.socket) this.socket.close();
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(payload);
    });
  }

  waitFor(method, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs);
      const wrappedResolve = (params) => {
        clearTimeout(timeout);
        resolve(params);
      };
      const waiters = this.eventWaiters.get(method) || [];
      waiters.push(wrappedResolve);
      this.eventWaiters.set(method, waiters);
    });
  }
}

async function launchChrome() {
  const userDataDir = path.join('/tmp', 'charlie-pc-doc-capture');
  await fs.rm(userDataDir, { recursive: true, force: true });
  const chrome = spawn(CHROME_BIN, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], {
    stdio: 'ignore'
  });

  const versionUrl = `http://127.0.0.1:${DEBUG_PORT}/json/version`;
  await waitForHttp(versionUrl, 20000);
  return chrome;
}

async function openDevtoolsPage() {
  const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
  const pages = await res.json();
  const page = pages.find((entry) => entry.type === 'page');
  if (!page?.webSocketDebuggerUrl) {
    throw new Error('Could not find a debuggable Chrome page');
  }
  const client = new CDPClient(page.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Network.enable');
  return client;
}

async function navigate(client, url) {
  const loadEvent = client.waitFor('Page.loadEventFired');
  await client.send('Page.navigate', { url });
  await loadEvent;
  await sleep(1800);
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  return result.result?.value;
}

async function waitForText(client, text, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const bodyText = await evaluate(client, 'document.body ? document.body.innerText : ""');
    if (String(bodyText || '').includes(text)) return;
    await sleep(500);
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

async function setViewport(client, { width, height, mobile = false, scale = 1 }) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    mobile,
    deviceScaleFactor: scale
  });
}

async function capture(client, outputPath) {
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false
  });
  await fs.writeFile(outputPath, Buffer.from(screenshot.data, 'base64'));
}

async function setWebAuth(client, authPayload) {
  await evaluate(client, `
    localStorage.setItem('token', ${JSON.stringify(authPayload.token)});
    localStorage.setItem('user', JSON.stringify(${JSON.stringify(authPayload.user)}));
    true;
  `);
}

async function clearWebAuth(client) {
  await evaluate(client, `
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    true;
  `);
}

async function setMobileAuth(client, authPayload) {
  await evaluate(client, `
    localStorage.setItem(${JSON.stringify(MOBILE_STORAGE_KEY)}, JSON.stringify(${JSON.stringify({
      token: authPayload.token,
      user: authPayload.user
    })}));
    true;
  `);
}

async function clearMobileAuth(client) {
  await evaluate(client, `
    localStorage.removeItem(${JSON.stringify(MOBILE_STORAGE_KEY)});
    true;
  `);
}

async function main() {
  await ensureDir(FIGURES_DIR);
  await waitForHttp(`${API_URL}/products`, 30000);
  if (INCLUDE_WEB) {
    await waitForHttp(WEB_URL, 30000);
  }
  await waitForHttp(MOBILE_URL, 30000);

  const adminAuth = await login('admin@charliepc.ph', 'admin123', 'admin');
  const customerAuth = await login('customer@charliepc.ph', 'cust123', 'customer');

  const chrome = await launchChrome();
  const client = await openDevtoolsPage();

  try {
    if (INCLUDE_WEB) {
      await setViewport(client, { width: 1600, height: 1200, mobile: false });
      await navigate(client, `${WEB_URL}/`);
      await waitForText(client, 'Charlie PC');
      await capture(client, path.join(FIGURES_DIR, 'web-customer-storefront.png'));

      await navigate(client, `${WEB_URL}/`);
      await setWebAuth(client, adminAuth);
      await navigate(client, `${WEB_URL}/admin-dashboard`);
      await waitForText(client, 'Charlie PC Operations Dashboard');
      await capture(client, path.join(FIGURES_DIR, 'web-admin-dashboard.png'));
      await clearWebAuth(client);
    }

    await setViewport(client, { width: 430, height: 932, mobile: true, scale: 2 });
    await navigate(client, MOBILE_URL);
    await waitForText(client, 'Sign in to the right PC shop workspace.');
    await capture(client, path.join(FIGURES_DIR, 'mobile-login-screen.png'));

    await setMobileAuth(client, customerAuth);
    await navigate(client, MOBILE_URL);
    await waitForText(client, 'Shop parts with live stock and quick add-to-cart access');
    await capture(client, path.join(FIGURES_DIR, 'mobile-customer-shop.png'));

    await setMobileAuth(client, adminAuth);
    await navigate(client, MOBILE_URL);
    await waitForText(client, 'Track Charlie PC activity in one place');
    await capture(client, path.join(FIGURES_DIR, 'mobile-admin-dashboard.png'));

    await clearMobileAuth(client);
    console.log(`Saved figures to ${FIGURES_DIR}`);
  } finally {
    await client.close();
    chrome.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
