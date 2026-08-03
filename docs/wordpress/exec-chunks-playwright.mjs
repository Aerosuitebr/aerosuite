/**
 * Run chunked batch via Playwright connectOverCDP (fallback when MCP args too large).
 * Usage: CURSOR_CDP_URL=http://127.0.0.1:9222 node exec-chunks-playwright.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cdpUrl = process.env.CURSOR_CDP_URL || process.env.CHROME_WS || 'http://127.0.0.1:9222';
const chunks = fs
  .readdirSync(dir)
  .filter((f) => /^cdp-chunk-\d+\.json$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));

let pw;
try {
  pw = await import('playwright-core');
} catch {
  pw = await import('playwright');
}

const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page = browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) || browser.contexts()[0]?.pages()[0];
if (!page) throw new Error('no wp-admin page on CDP browser');

const results = [];
for (let i = 0; i < chunks.length; i++) {
  const { method, params } = chunks[i];
  if (method !== 'Runtime.evaluate') throw new Error('unsupported ' + method);
  const value = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      // eslint-disable-next-line no-eval
      const fn = eval(expression.startsWith('(') ? expression : `(${expression})`);
      return awaitPromise ? await fn() : fn();
    },
    { expression: params.expression, awaitPromise: !!params.awaitPromise }
  );
  results.push({ chunk: i, value });
  if (i === chunks.length - 1) {
    fs.writeFileSync(path.join(dir, 'cdp-batch-mcp-result.json'), JSON.stringify({ result: { type: 'object', value } }, null, 2));
    console.log(JSON.stringify({ result: { type: 'object', value } }, null, 2));
  }
}
await browser.close();
