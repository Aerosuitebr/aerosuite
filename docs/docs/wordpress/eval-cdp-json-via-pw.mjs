/**
 * Evaluate cdp-call-<step>.json via Playwright if CDP URL in argv[3].
 * Usage: node eval-cdp-json-via-pw.mjs css-q2 <wsUrl> [outFile]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const cdpUrl = process.argv[3];
const outFile = process.argv[4] || path.join(dir, '.cdp-current-mcp-result.json');
if (!step || !cdpUrl) {
  console.error('Usage: node eval-cdp-json-via-pw.mjs <step> <wsUrl>');
  process.exit(2);
}
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const call = JSON.parse(fs.readFileSync(path.join(dir, `cdp-call-${step}.json`), 'utf8'));
const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('post.php')) ||
  browser.contexts()[0]?.pages()[0];
const { expression, awaitPromise } = call.params;
const value = await page.evaluate(
  async ({ expression, awaitPromise }) => {
    let v = eval(expression);
    if (awaitPromise) v = await v;
    return v;
  },
  { expression, awaitPromise: !!awaitPromise }
);
const out = { result: { type: 'object', value } };
fs.writeFileSync(outFile, JSON.stringify(out));
console.log(JSON.stringify(value));
