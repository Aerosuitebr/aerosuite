/**
 * Reads .cdp-current-mcp-args.json and runs Runtime.evaluate via Playwright.
 * Agent workflow: node emit-cdp-args.mjs <step> 165b2f && node run-12-from-args-files.mjs
 * Requires CURSOR_CDP_URL — if missing, exits 2 (use CallMcpTool instead).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const cdpUrl = process.env.CURSOR_CDP_URL || process.env.CHROME_WS;
if (!cdpUrl) process.exit(2);

const args = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-current-mcp-args.json'), 'utf8'));
const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('post.php')) ||
  browser.contexts()[0]?.pages()[0];
const { expression, awaitPromise } = args.params;
const value = await page.evaluate(
  async ({ expression, awaitPromise }) => {
    let v = eval(expression);
    if (awaitPromise) v = await v;
    return v;
  },
  { expression, awaitPromise: !!awaitPromise }
);
const out = { result: { type: 'object', value } };
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), JSON.stringify(out));
console.log(JSON.stringify(value));
