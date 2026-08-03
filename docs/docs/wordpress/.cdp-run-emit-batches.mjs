/**
 * Run .cdp-emit-* batches via Playwright CDP (Runtime.evaluate equivalent to browser_cdp).
 * Usage: node .cdp-run-emit-batches.mjs [startBatchIndex]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const startIdx = Number(process.argv[2] || 0);

const batches = [
  '.cdp-emit-0.txt',
  '.cdp-emit-1-3.txt',
  '.cdp-emit-4.txt',
  '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt',
  '.cdp-emit-13-18.txt',
  '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt',
  '.cdp-emit-29.txt',
];

const cdpCandidates = [
  process.env.CURSOR_CDP_URL,
  process.env.CHROME_WS,
  'http://127.0.0.1:8080',
  'http://127.0.0.1:9222',
  'http://127.0.0.1:9223',
].filter(Boolean);

function extractSteps(value, stepResults) {
  if (!value || typeof value !== 'object') return;
  for (const [k, v] of Object.entries(value)) {
    if (/^\d+$/.test(k)) stepResults[Number(k)] = v;
  }
}

function checkpoint(stepResults) {
  const errors = [];
  const s = stepResults;
  if (s[4] && (s[4].len !== 34708 || !s[4].ok)) errors.push({ step: 4, value: s[4] });
  if (s[5] && (s[5].b64 !== 34708 || !s[5].hasGrid)) errors.push({ step: 5, value: s[5] });
  if (s[6] && !s[6].ok) errors.push({ step: 6, value: s[6] });
  if (s[7] && !s[7].ok) errors.push({ step: 7, value: s[7] });
  if (s[29] && (!s[29].ok || !s[29].hasHeroV2)) errors.push({ step: 29, value: s[29] });
  return errors;
}

async function evalArgs(page, args) {
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

let browser;
let lastErr;
for (const url of cdpCandidates) {
  try {
    browser = await pw.chromium.connectOverCDP(url);
    lastErr = null;
    break;
  } catch (e) {
    lastErr = e;
  }
}
if (!browser) {
  console.log(JSON.stringify({ error: 'CDP_CONNECT_FAILED', message: String(lastErr) }));
  process.exit(2);
}

const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin/post.php?post=21')) ||
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.log(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const stepResults = {};
const errors = [];

for (let i = startIdx; i < batches.length; i++) {
  const batchFile = batches[i];
  const args = JSON.parse(fs.readFileSync(path.join(dir, batchFile), 'utf8'));
  let value;
  try {
    value = await evalArgs(page, args);
  } catch (e) {
    errors.push({ batch: batchFile, error: String(e) });
    break;
  }
  extractSteps(value, stepResults);
  if (value && typeof value === 'object' && !Object.keys(value).some((k) => /^\d+$/.test(k))) {
    if (batchFile === '.cdp-emit-0.txt') Object.assign(stepResults, { batch0: value });
  }
  const cp = checkpoint(stepResults);
  if (cp.length) {
    errors.push(...cp);
    break;
  }
}

const out = {
  viewId: 'a9930e',
  activeViewId: '8e6349',
  cssFullRun: stepResults[4] ?? null,
  cssVerify: stepResults[5] ?? null,
  cssFinalize: stepResults[6] ?? null,
  encInit: stepResults[7] ?? null,
  enc0: stepResults[13] ?? null,
  enc1: stepResults[19] ?? null,
  enc2: stepResults[25] ?? null,
  enc3: stepResults[28] ?? null,
  encRun: stepResults[29] ?? null,
  errors,
  pageUrl: page.url(),
};

fs.writeFileSync(path.join(dir, '.cdp-run-emit-result.json'), JSON.stringify({ ...out, stepResults }, null, 2));
console.log(JSON.stringify(out));
