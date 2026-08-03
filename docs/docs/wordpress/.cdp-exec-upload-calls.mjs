/**
 * Execute chunked upload calls via Playwright CDP when CURSOR_CDP_URL/CHROME_WS is set.
 * Usage: node .cdp-exec-upload-calls.mjs <calls.json>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const callsFile = path.resolve(process.argv[2] || path.join(dir, '.cdp-upload-0-4-calls.json'));
const cdpUrl = process.env.CURSOR_CDP_URL || process.env.CHROME_WS;

const { calls } = JSON.parse(fs.readFileSync(callsFile, 'utf8'));
if (!cdpUrl) {
  console.error(JSON.stringify({ error: 'NO_CDP_URL', hint: 'use CallMcpTool per .cdp-upload-call-N.json' }));
  process.exit(2);
}

const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.error(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

let last;
for (let i = 0; i < calls.length; i++) {
  const { params } = calls[i];
  last = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise && v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expression: params.expression, awaitPromise: !!params.awaitPromise }
  );
  console.error(`OK upload ${i}/${calls.length - 1}`, JSON.stringify(last).slice(0, 80));
}
fs.writeFileSync(path.join(dir, '.cdp-upload-final-result.json'), JSON.stringify({ result: { value: last } }));
console.log(JSON.stringify({ ok: true, last }));
await browser.close();
