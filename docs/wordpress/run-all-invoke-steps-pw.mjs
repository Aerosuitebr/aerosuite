/**
 * Run invoke steps 0..29 via Playwright CDP; writes .cdp-mcp-result.json per step and records.
 * Equivalent to browser_cdp Runtime.evaluate on the active wp-admin tab.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const viewId = process.argv[2] || '807f76';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);
const resultPath = path.join(dir, '.cdp-mcp-result.json');

const summaryKeys = {
  4: 'cssFullRun',
  5: 'cssVerify',
  6: 'cssFinalize',
  7: 'encInit',
  13: 'enc0',
  19: 'enc1',
  25: 'enc2',
  28: 'enc3',
  29: 'encRun',
};

function loadCall(n) {
  const mcp = path.join(dir, `.mcp-step-${n}-payload.json`);
  const inv = path.join(dir, `.invoke-step-${n}.json`);
  let payload = fs.existsSync(mcp)
    ? JSON.parse(fs.readFileSync(mcp, 'utf8'))
    : JSON.parse(fs.readFileSync(inv, 'utf8'));
  payload.viewId = viewId;
  return payload;
}

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return 'step5 verify';
  if (n === 6 && !value?.ok) return 'step6';
  if (n === 7 && !value?.ok) return 'step7 enc-init';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29';
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
  console.error(JSON.stringify({ error: 'NO_CDP', hint: 'use CallMcpTool browser_cdp' }));
  process.exit(2);
}

const { browser, page } = conn;
const summary = {};
const errors = [];

for (let n = start; n <= end; n++) {
  const call = loadCall(n);
  try {
    const value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        const fn = eval(expression);
        return awaitPromise ? await fn : fn;
      },
      { expression: call.params.expression, awaitPromise: !!call.params.awaitPromise },
    );
    const mcpResult = { result: { type: 'object', value } };
    fs.writeFileSync(resultPath, JSON.stringify(mcpResult));
    if (summaryKeys[n]) summary[summaryKeys[n]] = value;
    const fail = checkStep(n, value);
    try {
      execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, stdio: 'pipe' });
    } catch (e) {
      errors.push({ step: n, record: String(e) });
      break;
    }
    process.stderr.write(`OK ${n} ${JSON.stringify(value).slice(0, 120)}\n`);
    if (fail) {
      errors.push({ step: n, reason: fail, value });
      break;
    }
  } catch (e) {
    errors.push({ step: n, error: String(e.message || e) });
    break;
  }
}

await browser.close();
const out = {
  viewId,
  cssFullRun: summary.cssFullRun ?? null,
  cssVerify: summary.cssVerify ?? null,
  cssFinalize: summary.cssFinalize ?? null,
  encInit: summary.encInit ?? null,
  enc0: summary.enc0 ?? null,
  enc1: summary.enc1 ?? null,
  enc2: summary.enc2 ?? null,
  enc3: summary.enc3 ?? null,
  encRun: summary.encRun ?? null,
  errors,
};
fs.writeFileSync(path.join(dir, '.cdp-final-out.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
process.exit(errors.length ? 1 : 0);
