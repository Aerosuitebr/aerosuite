/**
 * Run footer CDP chunks via playwright if CDP_URL is set.
 * Usage: set CDP_URL=ws://... node run-footer-cdp-chunks.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cdpUrl = process.env.CDP_URL;
if (!cdpUrl) {
  console.log('NO_CDP_URL');
  process.exit(2);
}

const { chromium } = await import('playwright-core');
const browser = await chromium.connectOverCDP(cdpUrl);
const page = browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) || browser.contexts()[0].pages()[0];

const chunks = JSON.parse(fs.readFileSync(path.join(dir, 'cdp-footer-chunks.json'), 'utf8'));
for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i];
  const r = await page.evaluate(({ expression }) => {
    // eslint-disable-next-line no-eval
    return eval(expression);
  }, { expression: c.expression });
  console.log('chunk', i, r);
}

const run = JSON.parse(fs.readFileSync(path.join(dir, 'cdp-footer-run.json'), 'utf8'));
const footerResult = await page.evaluate(async ({ expression }) => {
  // eslint-disable-next-line no-eval
  return await eval(expression);
}, { expression: run.expression });
console.log('FOOTER', JSON.stringify(footerResult));
await browser.close();
