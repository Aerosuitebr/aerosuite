import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cdpUrl = process.env.CURSOR_CDP_URL || process.env.CHROME_WS || 'http://127.0.0.1:9222';
const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node exec-css-chunks-playwright.mjs <expr.txt> ...');
  process.exit(1);
}

let pw;
try {
  pw = await import('playwright-core');
} catch {
  pw = await import('playwright');
}

const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) throw new Error('no wp-admin page on CDP browser');

const results = [];
for (const f of files) {
  const expression = fs.readFileSync(path.join(dir, f), 'utf8');
  const value = await page.evaluate(
    async ({ expression }) => {
      const fn = eval(expression.startsWith('(') ? expression : `(${expression})`);
      return await fn();
    },
    { expression }
  );
  results.push({ file: f, value });
  console.log(JSON.stringify({ file: f, value }));
}
await browser.close();
