import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const base = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] || 3);
const end = Number(process.argv[3] || 14);
const cdpUrl = process.env.CURSOR_CDP_URL || process.env.CHROME_WS || 'http://127.0.0.1:9222';

let pw;
try {
  pw = await import('playwright-core');
} catch {
  pw = await import('playwright');
}

const browser = await pw.chromium.connectOverCDP(cdpUrl, { timeout: 5000 });
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) throw new Error('no page');

const results = [];
for (let i = start; i <= end; i++) {
  const invoke = JSON.parse(
    fs.readFileSync(path.join(base, `.cdp-invoke-${i}.json`), 'utf8')
  );
  const value = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      const fn = eval(expression.startsWith('(') ? expression : `(${expression})`);
      return awaitPromise ? await fn() : fn();
    },
    {
      expression: invoke.params.expression,
      awaitPromise: !!invoke.params.awaitPromise,
    }
  );
  results.push({ chunk: i, value });
  console.log(JSON.stringify({ chunk: i, value }));
}
fs.writeFileSync(
  path.join(base, '.cdp-chunk-results.json'),
  JSON.stringify(results, null, 2)
);
await browser.close();
