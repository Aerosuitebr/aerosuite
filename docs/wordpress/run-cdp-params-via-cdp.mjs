/**
 * Run .params-*.json steps via Playwright connectOverCDP (Cursor browser tab).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const cdpUrl = process.env.CHROME_WS || process.env.CURSOR_CDP_URL || 'http://127.0.0.1:9222';

const steps = [
  { name: 'css-q1', file: '.mcp-step-css-q1.json', nested: true },
  { name: 'css-q2', file: '.params-css-q2.json' },
  { name: 'css-q3', file: '.params-css-q3.json' },
  { name: 'css-q4', file: '.params-css-q4.json' },
  { name: 'css-verify', file: '.params-css-verify.json', key: 'cssVerify' },
  { name: 'css-finalize', file: '.params-css-finalize.json', key: 'cssFinalize' },
  { name: 'enc-init', file: '.params-enc-init.json' },
  { name: 'enc-0', file: '.params-enc-0.json' },
  { name: 'enc-1', file: '.params-enc-1.json' },
  { name: 'enc-2', file: '.params-enc-2.json' },
  { name: 'enc-3', file: '.params-enc-3.json' },
  { name: 'enc-run', file: '.params-enc-run.json', key: 'encRun' },
];

function loadParams(step) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, step.file), 'utf8'));
  return step.nested ? raw.params : raw;
}

const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages().find((p) => p.url().includes('aerosuite.com.br')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.error(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const summary = { tab: page.url(), viewNote: 'original 8f0e3d tab lost; using CDP-connected tab', errors: [], steps: {} };
for (const step of steps) {
  try {
    const params = loadParams(step);
    const value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        // eslint-disable-next-line no-eval
        let v = eval(expression);
        if (awaitPromise) v = await v;
        return v;
      },
      { expression: params.expression, awaitPromise: !!params.awaitPromise }
    );
    summary.steps[step.name] = value;
    if (step.key) summary[step.key] = value;
    console.error('OK', step.name, JSON.stringify(value).slice(0, 200));
  } catch (e) {
    summary.errors.push({ step: step.name, message: String(e) });
    console.error('FAIL', step.name, e.message || e);
    break;
  }
}

console.log(JSON.stringify(summary, null, 2));
await browser.close();
