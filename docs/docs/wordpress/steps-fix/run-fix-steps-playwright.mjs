/**
 * Run steps-fix via Playwright CDP (fallback when MCP batching is slow).
 * Usage: node run-fix-steps-playwright.mjs [cdpUrl]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cdpUrl = process.argv[2] || process.env.CHROME_WS || process.env.CURSOR_CDP_URL || 'http://127.0.0.1:9222';
const inv = JSON.parse(fs.readFileSync(path.join(dir, 'all-invocations.json'), 'utf8'));

let browser;
try {
  browser = await chromium.connectOverCDP(cdpUrl);
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
for (let i = 0; i < inv.length; i++) {
  const step = inv[i];
  const value = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression: step.expression, awaitPromise: step.awaitPromise }
  );
  results.push({ name: step.name, value });
  console.log(`[${i + 1}/${inv.length}] ${step.name}`, JSON.stringify(value).slice(0, 200));
}

const apply = results.find((r) => r.name === 'apply-pages-footer')?.value;
fs.writeFileSync(path.join(dir, 'fix-steps-results.json'), JSON.stringify({ results, apply }, null, 2));
console.log('APPLY_RESULT', JSON.stringify(apply));
await browser.close();
