/**
 * Execute steps via browser_cdp args files using Playwright page.evaluate.
 * Reads .cdp-step-N.args-only.json for steps start..end.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const cdpUrl = process.argv[4] || process.env.CURSOR_CDP_URL || process.env.CHROME_WS;

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

const results = {};
const errors = [];

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return { fail: true, reason: `len=${value?.len}` };
  if (i === 5 && !value?.hasGrid) return { fail: true, reason: 'hasGrid' };
  if (i === 6 && !value?.ok) return { fail: true, reason: 'cssFinalize' };
  if (i === 7 && !value?.ok) return { fail: true, reason: 'encInit' };
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return { fail: true, reason: 'encRun' };
  return { fail: false };
}

async function evalStep(page, n) {
  const argsPath = path.join(dir, `.cdp-step-${n}.args-only.json`);
  const args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
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

if (!cdpUrl) {
  console.error(JSON.stringify({ error: 'NO_CDP_URL' }));
  process.exit(2);
}

const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.error(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

for (let n = start; n <= end; n++) {
  try {
    const value = await evalStep(page, n);
    results[n] = value;
    fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify({ result: { type: 'object', value } }));
    const chk = checkStep(n, value);
    if (chk.fail) {
      errors.push({ step: n, value, reason: chk.reason });
      break;
    }
    console.error(`OK step ${n}`, JSON.stringify(value).slice(0, 100));
  } catch (e) {
    errors.push({ step: n, error: String(e) });
    break;
  }
}

const s = {};
for (const [step, key] of Object.entries(summaryKeys)) s[key] = results[step] ?? null;
const out = { viewId: 'a9930e', activeViewId: '4a20d1', ...s, errors };
fs.writeFileSync(path.join(dir, '.cdp-final-summary.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
process.exit(errors.length ? 1 : 0);
