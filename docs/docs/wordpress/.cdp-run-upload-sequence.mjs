/**
 * Run all upload calls via Playwright when CHROME_WS/CURSOR_CDP_URL set,
 * else emit UPLOAD_STEP lines for agent CallMcpTool.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callsFile = path.resolve(process.argv[2] || path.join(dir, '.cdp-upload-0-4-calls.json'));
const start = Number(process.argv[3] || 0);
const { calls } = JSON.parse(fs.readFileSync(callsFile, 'utf8'));
const cdpUrl = process.env.CURSOR_CDP_URL || process.env.CHROME_WS;

if (!cdpUrl) {
  for (let i = start; i < calls.length; i++) {
    console.log(`UPLOAD_STEP ${i}`);
  }
  process.exit(0);
}

const require = createRequire(import.meta.url);
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
for (let i = start; i < calls.length; i++) {
  const { params } = calls[i];
  last = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise && v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expression: params.expression, awaitPromise: !!params.awaitPromise }
  );
}
fs.writeFileSync(path.join(dir, '.cdp-upload-final-result.json'), JSON.stringify({ result: { value: last } }));
console.log(JSON.stringify({ ok: true, last }));
await browser.close();
