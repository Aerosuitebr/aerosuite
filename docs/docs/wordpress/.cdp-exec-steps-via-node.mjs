/**
 * Execute steps start..end on page via reading .cdp-invoke-N.json.
 * Requires CURSOR_CDP_URL. Writes .cdp-step-N.mcp-out.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const cdpUrl = process.argv[4] || process.env.CURSOR_CDP_URL || process.env.CHROME_WS;

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

async function evalInvoke(page, n) {
  const invoke = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-invoke-${n}.json`), 'utf8'));
  const { expression, awaitPromise } = invoke.params;
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
  console.log(JSON.stringify({ error: 'NO_CDP' }));
  process.exit(2);
}

const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page = browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin/post.php')) || browser.contexts()[0]?.pages()[0];
if (!page) {
  console.log(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const errors = [];
for (let n = start; n <= end; n++) {
  if (!fs.existsSync(path.join(dir, `.cdp-invoke-${n}.json`))) continue;
  try {
    const value = await evalInvoke(page, n);
    fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify({ result: { type: 'object', value } }));
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

const extract = (step) => {
  const p = path.join(dir, `.cdp-step-${step}.mcp-out.json`);
  if (!fs.existsSync(p)) return null;
  const r = JSON.parse(fs.readFileSync(p, 'utf8'));
  return r?.result?.value ?? r?.result?.result?.value ?? r?.value ?? null;
};
const out = {
  viewId: 'a9930e',
  activeViewId: '379d4b',
  cssFullRun: extract(4),
  cssVerify: extract(5),
  cssFinalize: extract(6),
  encInit: extract(7),
  enc0: extract(13),
  enc1: extract(19),
  enc2: extract(25),
  enc3: extract(28),
  encRun: extract(29),
  errors,
};
console.log(JSON.stringify(out));
process.exit(errors.length ? 1 : 0);
