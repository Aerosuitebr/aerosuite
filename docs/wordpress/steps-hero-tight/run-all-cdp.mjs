/**
 * Run all steps-hero-tight via Playwright CDP when CHROME_WS is set.
 * Usage: CHROME_WS=ws://... node run-all-cdp.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));
const ws = process.env.CHROME_WS;

if (!ws) {
  console.error('CHROME_WS not set — use MCP browser_cdp per step');
  process.exit(2);
}

const pwPath = path.join(dir, '..', 'node_modules', 'playwright-core');
let pw;
try {
  pw = require(pwPath);
} catch {
  console.error('playwright-core missing at', pwPath);
  process.exit(3);
}

const browser = await pw.chromium.connectOverCDP(ws);
const page =
  browser
    .contexts()[0]
    ?.pages()
    .find((p) => p.url().includes('aerosuite.com.br/wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.error('No wp-admin page found');
  process.exit(4);
}

const results = [];
for (const name of order) {
  const content = fs.readFileSync(path.join(dir, `${name}.js`), 'utf8');
  const awaitPromise = name === 'upload-apply';
  const expression = awaitPromise
    ? content.trim()
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
