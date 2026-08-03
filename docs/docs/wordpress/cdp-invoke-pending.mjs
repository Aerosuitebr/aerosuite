/**
 * Invoke .cdp-pending-args.json via Playwright when CURSOR_CDP_URL is set.
 * Usage: node cdp-invoke-pending.mjs [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const cdpUrl = process.env.CURSOR_CDP_URL || process.env.CHROME_WS;
if (!cdpUrl) {
  console.error(JSON.stringify({ error: 'NO_CDP_URL' }));
  process.exit(2);
}
const args = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-pending-args.json'), 'utf8'));
const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages().find((p) => p.url().includes('aerosuite.com.br')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.error(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}
const { expression, awaitPromise } = args.params;
const value = await page.evaluate(
  async ({ expression, awaitPromise }) => {
    let v = eval(expression);
    if (awaitPromise) v = await v;
    return v;
  },
  { expression, awaitPromise: !!awaitPromise }
);
console.log(JSON.stringify({ ok: true, tab: page.url(), value }));
await browser.close();
