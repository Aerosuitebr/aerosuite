/**
 * Run all hero-estoque2 steps via Playwright CDP when CHROME_WS is set.
 * Otherwise prints invoke index paths for agent MCP browser_cdp.
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
  console.error('CHROME_WS not set');
  process.exit(2);
}

const pw = require(path.join(dir, '..', 'node_modules', 'playwright-core'));
const browser = await pw.chromium.connectOverCDP(ws);
const page =
  browser
    .contexts()[0]
    ?.pages()
    .find((p) => p.url().includes('aerosuite.com.br/wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.error('No wp-admin page found');
  process.exit(3);
}

const results = [];
for (let i = 0; i < order.length; i++) {
  const invoke = JSON.parse(
    fs.readFileSync(path.join(dir, `_invoke-${i}.json`), 'utf8')
  );
  const { expression, awaitPromise, returnByValue } = invoke.params;
  const value = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise }
  );
  results.push({ step: order[i], index: i, value });
  console.log('STEP', i, order[i], JSON.stringify(value).slice(0, 120));
}

const apply = results.find((r) => r.step === 'apply')?.value;
fs.writeFileSync(
  path.join(dir, 'cdp-results.json'),
  JSON.stringify({ results, apply }, null, 2)
);
console.log('APPLY_RESULT', JSON.stringify(apply));
await browser.close();
