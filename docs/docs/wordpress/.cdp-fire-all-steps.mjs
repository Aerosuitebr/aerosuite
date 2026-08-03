/**
 * Execute steps start..end on wp-admin via Playwright, trying common CDP endpoints.
 * Writes .cdp-step-N.mcp-out.json and prints final summary JSON.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const activeViewId = process.argv[4] || '754d2e';

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

const cdpCandidates = [
  process.env.CURSOR_CDP_URL,
  process.env.CHROME_WS,
  'http://127.0.0.1:9222',
  'http://127.0.0.1:9223',
].filter(Boolean);

function loadArgs(n) {
  const ready = path.join(dir, `.cdp-step-${n}.mcp-ready.json`);
  const call = path.join(dir, `.cdp-call-${n}.json`);
  const live = path.join(dir, `.cdp-live-step-${n}.json`);
  const src = fs.existsSync(live) ? live : fs.existsSync(ready) ? ready : call;
  return JSON.parse(fs.readFileSync(src, 'utf8'));
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

async function evalOnPage(page, params) {
  const { expression, awaitPromise } = params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise && v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
let browser;
for (const url of cdpCandidates) {
  try {
    browser = await pw.chromium.connectOverCDP(url);
    break;
  } catch {
    /* next */
  }
}

const results = {};
const errors = [];

if (!browser) {
  const out = {
    viewId: 'a9930e',
    activeViewId: '4a20d1',
    cssFullRun: null,
    cssVerify: null,
    cssFinalize: null,
    encInit: null,
    enc0: null,
    enc1: null,
    enc2: null,
    enc3: null,
    encRun: null,
    errors: [{ error: 'NO_CDP' }],
  };
  console.log(JSON.stringify(out));
  process.exit(2);
}

const page =
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin/post.php')) ||
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  const out = {
    viewId: 'a9930e',
    activeViewId: '4a20d1',
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
    const args = loadArgs(n);
    const value = await evalOnPage(page, args.params);
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
const out = { viewId: 'a9930e', activeViewId: '4a20d1', ...s, errors };
console.log(JSON.stringify(out));
process.exit(errors.length ? 1 : 0);
