/**
 * Run all invoke steps via Playwright page.evaluate on wp-admin tab.
 * Connect using CURSOR_CDP_URL or pass ws endpoint as argv[2].
 * Falls back to reading invoke files and printing instructions.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require('playwright-core');

const STEPS = [
  'css-q1', 'css-q2', 'css-q3', 'css-q4',
  'css-verify', 'css-finalize',
  'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
];

const cdpUrl = process.argv[2] || process.env.CURSOR_CDP_URL || process.env.CHROME_WS;
if (!cdpUrl) {
  console.error(JSON.stringify({ error: 'NO_CDP', hint: 'Pass CDP URL or set CURSOR_CDP_URL' }));
  process.exit(2);
}

let browser;
try {
  browser = await pw.chromium.connectOverCDP(cdpUrl);
} catch (e) {
  console.error(JSON.stringify({ error: 'CONNECT_FAILED', message: e.message }));
  process.exit(2);
}

const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages().find((p) => p.url().includes('aerosuite.com.br')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.error(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const summary = {
  viewIdRequested: '8f0e3d',
  viewIdUsed: '258c93',
  tab: page.url(),
  cssVerify: null,
  cssFinalize: null,
  encRun: null,
  errors: [],
  steps: {},
};

async function runStep(name) {
  const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${name}.json`), 'utf8'));
  const value = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression: params.expression, awaitPromise: !!params.awaitPromise }
  );
  return value;
}

for (const name of STEPS) {
  try {
    const value = await runStep(name);
    summary.steps[name] = value;
    if (name === 'css-verify') summary.cssVerify = value;
    if (name === 'css-finalize') summary.cssFinalize = value;
    if (name === 'enc-run') summary.encRun = value;
    console.error('OK', name, JSON.stringify(value).slice(0, 200));
  } catch (e) {
    summary.errors.push({ step: name, message: String(e) });
    console.error('FAIL', name, String(e));
    break;
  }
}

fs.writeFileSync(path.join(dir, 'deploy-remaining-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
await browser.close();
