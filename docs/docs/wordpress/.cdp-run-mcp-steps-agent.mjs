/**
 * Run steps start..end via Playwright CDP on wp-admin tab (fallback when MCP tab missing).
 * Usage: node .cdp-run-mcp-steps-agent.mjs <start> <end> [viewIdLabel]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const activeViewId = process.argv[4] || '4a20d1';
const cdpUrl = process.env.CURSOR_CDP_URL || process.env.CHROME_WS;

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

function loadArgs(n, viewId) {
  const ready = path.join(dir, `.cdp-step-${n}.mcp-ready.json`);
  const call = path.join(dir, `.cdp-call-${n}.json`);
  const src = fs.existsSync(ready) ? ready : call;
  const a = JSON.parse(fs.readFileSync(src, 'utf8'));
  a.viewId = viewId;
  return a;
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

async function evalOnPage(page, args) {
  const { expression, awaitPromise, returnByValue } = args.params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise && v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise, returnByValue: !!returnByValue }
  );
}

const results = {};
const errors = [];

if (!cdpUrl) {
  const out = {
    viewId: 'a9930e',
    activeViewId,
    cssFullRun: null,
    cssVerify: null,
    cssFinalize: null,
    encInit: null,
    enc0: null,
    enc1: null,
    enc2: null,
    enc3: null,
    encRun: null,
    errors: [{ error: 'NO_CDP_URL' }],
  };
  console.log(JSON.stringify(out));
  process.exit(2);
}

const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin/post.php')) ||
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  const out = {
    viewId: 'a9930e',
    activeViewId,
    cssFullRun: null,
    cssVerify: null,
    cssFinalize: null,
    encInit: null,
    enc0: null,
    enc1: null,
    enc2: null,
    enc3: null,
    encRun: null,
    errors: [{ error: 'NO_PAGE' }],
  };
  console.log(JSON.stringify(out));
  process.exit(3);
}

for (let n = start; n <= end; n++) {
  try {
    const args = loadArgs(n, activeViewId);
    const value = await evalOnPage(page, args);
    results[n] = value;
    fs.writeFileSync(
      path.join(dir, `.cdp-step-${n}.mcp-out.json`),
      JSON.stringify({ result: { type: 'object', value } })
    );
    const fail = checkStep(n, value);
    if (fail) {
      errors.push({ step: n, value, reason: fail });
      break;
    }
    process.stderr.write(`OK ${n}\n`);
  } catch (e) {
    errors.push({ step: n, error: String(e) });
    break;
  }
}

const s = {};
for (const [step, key] of Object.entries(summaryKeys)) {
  s[key] = results[Number(step)] ?? null;
}
const out = { viewId: 'a9930e', activeViewId, ...s, errors };
fs.writeFileSync(path.join(dir, '.cdp-final-summary.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
process.exit(errors.length ? 1 : 0);
