/**
 * Run all steps in cdp-step-list.json via Playwright connectOverCDP.
 * Set CHROME_WS or CURSOR_CDP_URL (e.g. http://127.0.0.1:9222).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require(path.join(path.dirname(fileURLToPath(import.meta.url)), 'node_modules', 'playwright-core'));
const dir = path.dirname(fileURLToPath(import.meta.url));
const list = JSON.parse(fs.readFileSync(path.join(dir, 'cdp-step-list.json'), 'utf8'));
const cdpUrl = process.env.CHROME_WS || process.env.CURSOR_CDP_URL || 'http://127.0.0.1:9222';

let browser;
try {
  browser = await pw.chromium.connectOverCDP(cdpUrl);
} catch (e) {
  console.error('connectOverCDP failed:', e.message);
  process.exit(2);
}

const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('aerosuite.com.br')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.error('no page');
  process.exit(3);
}

const results = [];
for (let i = 0; i < list.length; i++) {
  const step = list[i];
  const value = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression: step.expression, awaitPromise: step.awaitPromise }
  );
  results.push({ name: step.name, value });
  const preview = JSON.stringify(value).slice(0, 120);
  console.log(`[${i + 1}/${list.length}] ${step.name} ${preview}`);
}

const final = results.find((r) => r.name === 'finalize.js')?.value;
fs.writeFileSync(path.join(dir, 'deploy-results.json'), JSON.stringify({ results, final }, null, 2));
console.log('FINAL_RESULT', JSON.stringify(final));
await browser.close();
