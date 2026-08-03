/**
 * Run all hero-tight steps via Playwright connectOverCDP.
 * CURSOR_CDP_URL default http://127.0.0.1:9222
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));
const cdpUrl = process.env.CHROME_WS || process.env.CURSOR_CDP_URL || 'http://127.0.0.1:9222';

const pw = require(path.join(dir, '..', 'node_modules', 'playwright-core'));
let browser;
try {
  browser = await pw.chromium.connectOverCDP(cdpUrl);
} catch (e) {
  console.error('connectOverCDP failed:', e.message);
  process.exit(2);
}

const page =
  browser
    .contexts()[0]
    ?.pages()
    .find((p) => p.url().includes('aerosuite.com.br/wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.error('no wp-admin page');
  process.exit(3);
}

const results = [];
for (const name of order) {
  const content = fs.readFileSync(path.join(dir, `${name}.js`), 'utf8').trim();
  const awaitPromise = name === 'upload-apply';
  const expression = awaitPromise
    ? content
    : `new Function(${JSON.stringify(content)})()`;
  const value = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise }
  );
  results.push({ step: name, value });
  console.log('STEP', name, JSON.stringify(value).slice(0, 200));
}

const apply = results.find((r) => r.step === 'upload-apply')?.value;
fs.writeFileSync(
  path.join(dir, 'cdp-results.json'),
  JSON.stringify({ results, hero: apply?.hero, apply }, null, 2)
);
console.log('HERO_RESULT', JSON.stringify(apply));
await browser.close();
