/**
 * Execute all split-invokes/*.json via puppeteer-core connectOverCDP.
 * Requires: npm i playwright-core (in docs/wordpress) and CHROME_WS or CURSOR_CDP_URL.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const splitDir = path.join(dir, 'split-invokes');
const manifest = JSON.parse(fs.readFileSync(path.join(splitDir, 'manifest.json'), 'utf8'));
const cdpUrl = process.env.CHROME_WS || process.env.CURSOR_CDP_URL || 'http://127.0.0.1:9222';

let pw;
try {
  pw = require(path.join(dir, '..', 'node_modules', 'playwright-core'));
} catch {
  try {
    pw = require('playwright-core');
  } catch (e) {
    console.error('playwright-core not found:', e.message);
    process.exit(2);
  }
}

const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser
    .contexts()[0]
    ?.pages()
    .find((p) => p.url().includes('aerosuite.com.br/wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.error('no wp-admin page');
  process.exit(3);
}

const results = [];
for (const file of manifest) {
  const inv = JSON.parse(fs.readFileSync(path.join(splitDir, file), 'utf8'));
  const { expression, awaitPromise, returnByValue } = inv.params;
  const value = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise }
  );
  results.push({ file, step: inv.step, value });
  console.log('OK', file, inv.step, JSON.stringify(value).slice(0, 100));
}

const apply = results.find((r) => r.step === 'upload-apply')?.value;
fs.writeFileSync(
  path.join(dir, 'cdp-results.json'),
  JSON.stringify({ results, hero: apply?.hero, apply }, null, 2)
);
console.log('HERO_RESULT', JSON.stringify(apply));
await browser.close();
