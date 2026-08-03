/**
 * Run one step N via page context using args from .cdp-mcp-b64-step-N.json
 * Uses playwright storage fallback when CDP ports unavailable.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '441704';

const args = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-mcp-b64-step-${n}.json`), 'utf8'));
args.viewId = viewId;

const storage = path.join(dir, 'wp-storage.json');
const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext(fs.existsSync(storage) ? { storageState: storage } : {});
const page = await context.newPage();
await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (page.url().includes('wp-login')) {
  console.error(JSON.stringify({ error: 'NOT_LOGGED_IN' }));
  process.exit(2);
}
const value = await page.evaluate(
  async ({ expression, awaitPromise }) => {
    let v = eval(expression);
    if (awaitPromise && v && typeof v.then === 'function') v = await v;
    return v;
  },
  { expression: args.params.expression, awaitPromise: !!args.params.awaitPromise },
);
const mcpOut = { result: { type: 'object', value } };
fs.writeFileSync(path.join(dir, '.cdp-mcp-results', `${n}.json`), JSON.stringify(mcpOut));
await browser.close();
console.log(JSON.stringify({ step: n, value }));
