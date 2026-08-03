/**
 * Run steps via page.evaluate in-process (same as browser_cdp Runtime.evaluate).
 * Uses Playwright connect to Cursor browser when CDP port available;
 * otherwise prints MCP_REQUIRED for each step.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const viewId = process.argv[2] || '87550c';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 29);

function flatCall(n) {
  const invoke = path.join(dir, `.cdp-step-${n}.invoke.json`);
  const argsFile = path.join(dir, `.cdp-args-${n}.json`);
  let raw;
  if (fs.existsSync(argsFile)) raw = JSON.parse(fs.readFileSync(argsFile, 'utf8'));
  else if (fs.existsSync(invoke)) raw = JSON.parse(fs.readFileSync(invoke, 'utf8'));
  else return null;
  const c = raw.arguments?.arguments || raw.arguments || raw;
  return { method: c.method, params: c.params, viewId };
}

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

async function connect() {
  for (const port of [9222, 9223, 9333, 19222, 8315, 9229]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) });
      const tabs = await res.json();
      const tab =
        tabs.find((t) => (t.url || '').includes('wp-admin/post.php?post=21')) ||
        tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page };
    } catch {
      /* next */
    }
  }
  return null;
}

const conn = await connect();
if (!conn) {
  for (let n = start; n <= end; n++) console.log(`MCP_REQUIRED ${n}`);
  process.exit(2);
}

const { browser, page } = conn;
const recorded = {};
const errors = [];

for (let n = start; n <= end; n++) {
  const call = flatCall(n);
  if (!call?.params?.expression) {
    errors.push({ step: n, error: 'missing-args' });
    break;
  }
  try {
    const value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        const fn = eval(expression);
        return awaitPromise ? await fn : fn;
      },
      { expression: call.params.expression, awaitPromise: !!call.params.awaitPromise },
    );
    fs.writeFileSync(
      path.join(dir, `.cdp-step-${n}.mcp-out.json`),
      JSON.stringify({ result: { type: 'object', value } }),
    );
    if (summaryKeys[n]) recorded[summaryKeys[n]] = value;
    const fail = checkStep(n, value);
    process.stderr.write(`OK ${n}\n`);
    if (fail) {
      errors.push({ step: n, reason: fail, value });
      if (n === 4) {
        await page.evaluate(() => {
          window.__cssParts = [];
          window.__cssb64 = '';
          return { cleared: true };
        });
        n = -1;
        continue;
      }
      break;
    }
  } catch (e) {
    errors.push({ step: n, error: String(e.message || e) });
    break;
  }
}

await browser.close();

const out = {
  viewId: 'a9930e',
  activeViewId: viewId,
  cssFullRun: recorded.cssFullRun ?? null,
  cssVerify: recorded.cssVerify ?? null,
  cssFinalize: recorded.cssFinalize ?? null,
  encInit: recorded.encInit ?? null,
  enc0: recorded.enc0 ?? null,
  enc1: recorded.enc1 ?? null,
  enc2: recorded.enc2 ?? null,
  enc3: recorded.enc3 ?? null,
  encRun: recorded.encRun ?? null,
  errors,
};
fs.writeFileSync(path.join(dir, '.cdp-final-out.json'), JSON.stringify(out, null, 2));
console.log(`FINAL ${JSON.stringify(out)}`);
process.exit(errors.length ? 1 : 0);
