/**
 * Execute .step-out-N.json (step 0 via .cdp-invoke-0.json) via Playwright CDP.
 * Usage: node .run-step-outs-cdp.mjs [viewId] [cdpUrl]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const viewId = process.argv[2] || '8e6349';
const cdpUrl = process.argv[3] || process.env.CURSOR_CDP_URL || process.env.CHROME_WS || 'http://127.0.0.1:9222';

function stepFile(n) {
  if (n === 0) return path.join(dir, '.cdp-invoke-0.json');
  return path.join(dir, `.step-out-${n}.json`);
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 expected {len:34708,ok:true} got ${JSON.stringify(value)}`;
  if (i === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return `step5 verify failed ${JSON.stringify(value)}`;
  if (i === 6 && !value?.ok) return `step6 ok false`;
  if (i === 7 && !value?.ok) return `step7 ok false`;
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return `step29 encRun failed ${JSON.stringify(value)}`;
  return null;
}

async function evalStep(page, n) {
  const raw = JSON.parse(fs.readFileSync(stepFile(n), 'utf8'));
  const { expression, awaitPromise } = raw.params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

const results = {};
const errors = [];

let browser;
try {
  browser = await pw.chromium.connectOverCDP(cdpUrl);
} catch (e) {
  console.log(JSON.stringify({ error: 'connectOverCDP', message: e.message, cdpUrl }));
  process.exit(2);
}

const pages = browser.contexts().flatMap((c) => c.pages());
const page =
  pages.find((p) => p.url().includes('wp-admin')) ||
  pages.find((p) => p.url().includes('aerosuite.com.br')) ||
  pages[0];

if (!page) {
  console.log(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

// Step 0 if CSS parts not loaded (fresh tab)
try {
  const hasParts = await page.evaluate(() => !!(window.__cssParts && window.__cssParts[4]));
  if (!hasParts) {
    const v0 = await evalStep(page, 0);
    results[0] = v0;
    const fail0 = checkStep(0, v0);
    if (fail0) errors.push({ step: 0, reason: fail0, value: v0 });
  }
} catch (e) {
  errors.push({ step: 0, error: String(e) });
}

for (let n = 1; n <= 29 && errors.length === 0; n++) {
  try {
    const value = await evalStep(page, n);
    results[n] = value;
    fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify({ result: { type: 'object', value } }));
    const fail = checkStep(n, value);
    if (fail) {
      errors.push({ step: n, reason: fail, value });
      break;
    }
    process.stderr.write(`OK step ${n}\n`);
  } catch (e) {
    errors.push({ step: n, error: String(e) });
    break;
  }
}

const out = {
  viewId: 'a9930e',
  activeViewId: viewId,
  cssFullRun: results[4] ?? null,
  cssVerify: results[5] ?? null,
  cssFinalize: results[6] ?? null,
  encInit: results[7] ?? null,
  enc0: results[13] ?? null,
  enc1: results[19] ?? null,
  enc2: results[25] ?? null,
  enc3: results[28] ?? null,
  encRun: results[29] ?? null,
  errors,
};
console.log(JSON.stringify(out));
process.exit(errors.length ? 1 : 0);
