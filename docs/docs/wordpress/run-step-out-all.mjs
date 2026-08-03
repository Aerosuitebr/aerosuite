/**
 * Run steps 1..29 from .step-out-N.json via page.evaluate on wp-admin.
 * Connects Playwright to Cursor browser CDP when available.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const viewId = process.argv[2] || 'd79a58';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 29);

const summary = {
  viewId: 'a9930e',
  activeViewId: viewId,
  cssFullRun: null,
  cssVerify: null,
  cssFinalize: null,
  encInit: null,
  enc0: null,
  enc1: null,
  enc2: null,
  enc3: null,
  encRun: null,
  errors: [],
};

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return { step: 4, reason: 'cssFullRun', value };
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return { step: 5, reason: 'cssVerify', value };
  if (n === 6 && !value?.ok) return { step: 6, reason: 'cssFinalize', value };
  if (n === 7 && !value?.ok) return { step: 7, reason: 'encInit', value };
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return { step: 29, reason: 'encRun', value };
  return null;
}

async function connect() {
  const ports = [9222, 9223, 9333, 19222, 8315, 9229];
  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000) });
      const tabs = await res.json();
      const tab = tabs.find((t) => (t.url || '').includes('wp-admin/post.php')) || tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin/post.php')) ||
        browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page, port };
    } catch {
      /* next port */
    }
  }
  return null;
}

async function evalStep(page, n) {
  const file = path.join(dir, `.step-out-${n}.json`);
  const args = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { expression, awaitPromise } = args.params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

const conn = await connect();
if (!conn) {
  console.log(JSON.stringify({ error: 'NO_CDP', hint: 'use CallMcpTool per step', ...summary }));
  process.exit(2);
}

const { browser, page, port } = conn;
summary.cdpPort = port;

for (let n = start; n <= end; n++) {
  try {
    const value = await evalStep(page, n);
    if (n === 4) summary.cssFullRun = value;
    else if (n === 5) summary.cssVerify = value;
    else if (n === 6) summary.cssFinalize = value;
    else if (n === 7) summary.encInit = value;
    else if (n === 13) summary.enc0 = value;
    else if (n === 19) summary.enc1 = value;
    else if (n === 25) summary.enc2 = value;
    else if (n === 28) summary.enc3 = value;
    else if (n === 29) summary.encRun = value;

    const fail = checkStep(n, value);
    if (fail) {
      summary.errors.push(fail);
      break;
    }
    process.stderr.write(`OK ${n}\n`);
  } catch (e) {
    summary.errors.push({ step: n, error: String(e) });
    break;
  }
}

await browser.close().catch(() => {});
console.log(JSON.stringify(summary));
process.exit(summary.errors.length ? 1 : 0);
