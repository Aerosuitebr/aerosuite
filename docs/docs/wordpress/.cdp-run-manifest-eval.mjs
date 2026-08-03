/**
 * Run .cdp-step-manifest.json steps via page.evaluate (same as Runtime.evaluate).
 * Usage: node .cdp-run-manifest-eval.mjs <viewIdNote> <activeViewId> [start] [end]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const requestedViewId = process.argv[2] || 'a9930e';
const activeViewId = process.argv[3] || '4a20d1';
const start = Number(process.argv[4] ?? 1);
const end = Number(process.argv[5] ?? 29);
const skip0 = process.argv.includes('--skip0');

const manifest = JSON.parse(
  fs.readFileSync(path.join(dir, '.cdp-step-manifest.json'), 'utf8')
);

const summary = {
  viewId: requestedViewId,
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
  errors: [],
};

const cdpUrl = process.env.CHROME_WS || process.env.CURSOR_CDP_URL || 'http://127.0.0.1:9222';
let pw;
try {
  pw = require('playwright-core');
} catch {
  pw = require('playwright');
}

async function evalStep(page, args) {
  const { expression, awaitPromise } = args.params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      const fn = (0, eval)(expression.startsWith('(') ? expression : `(${expression})`);
      return awaitPromise ? await fn() : fn();
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

const browser = await pw.chromium.connectOverCDP(cdpUrl, { timeout: 8000 });
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.log(JSON.stringify({ error: 'NO_PAGE', summary }));
  process.exit(3);
}

for (const item of manifest) {
  if (item.i < start || item.i > end) continue;
  if (skip0 && item.i === 0) continue;
  const ready = path.join(dir, `.cdp-step-${item.i}.mcp-ready.json`);
  const argsPath = fs.existsSync(ready) ? ready : item.argsPath;
  const args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
  args.viewId = activeViewId;
  try {
    const value = await evalStep(page, args);
    if (item.i === 4) summary.cssFullRun = value;
    else if (item.i === 5) summary.cssVerify = value;
    else if (item.i === 6) summary.cssFinalize = value;
    else if (item.i === 7) summary.encInit = value;
    else if (item.i === 13) summary.enc0 = value;
    else if (item.i === 19) summary.enc1 = value;
    else if (item.i === 25) summary.enc2 = value;
    else if (item.i === 28) summary.enc3 = value;
    else if (item.i === 29) summary.encRun = value;
    console.error(`OK step ${item.i} ${item.step}`, JSON.stringify(value).slice(0, 100));
    if (item.i === 4 && (!value?.ok || value?.len !== 34708)) {
      summary.errors.push({ step: item.step, i: item.i, value });
      break;
    }
    if (item.i === 5 && (!value?.hasGrid)) {
      summary.errors.push({ step: item.step, i: item.i, value });
      break;
    }
    if (item.i === 6 && !value?.ok) {
      summary.errors.push({ step: item.step, i: item.i, value });
      break;
    }
    if (item.i === 29 && (!value?.ok || !value?.hasHeroV2)) {
      summary.errors.push({ step: item.step, i: item.i, value });
      break;
    }
  } catch (e) {
    summary.errors.push({ step: item.step, i: item.i, error: String(e) });
    break;
  }
}

await browser.close();
fs.writeFileSync(path.join(dir, '.cdp-manifest-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
