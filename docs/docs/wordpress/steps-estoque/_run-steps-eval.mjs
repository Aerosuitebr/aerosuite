/**
 * Run estoque steps 1-14 via in-page evaluate (same expressions as MCP payloads).
 * Usage: node _run-steps-eval.mjs <viewId-hint> [start] [end]
 * Requires: puppeteer-core, Chrome at CDP_DEBUG_URL (default http://127.0.0.1:9222)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const dir = path.dirname(fileURLToPath(import.meta.url));
const debugUrl = process.env.CDP_DEBUG_URL || 'http://127.0.0.1:9222';
const hint = process.argv[2] || 'post=21';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 14);

const steps = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));

let browser;
try {
  browser = await puppeteer.connect({ browserURL: debugUrl, defaultViewport: null });
} catch (e) {
  console.error('CONNECT_FAILED', e.message);
  process.exit(2);
}

const pages = await browser.pages();
const page =
  pages.find((p) => p.url().includes(hint)) ||
  pages.find((p) => p.url().includes('wp-admin')) ||
  pages[0];
if (!page) {
  console.error('NO_PAGE');
  process.exit(3);
}
console.error('PAGE', page.url());

// init if needed
const initRaw = fs.readFileSync(path.join(dir, steps[0].name), 'utf8').trim();
const initVal = await page.evaluate((expr) => {
  // eslint-disable-next-line no-new-func
  return new Function(expr)();
}, initRaw);
console.log('STEP', 0, steps[0].name, JSON.stringify(initVal));

const results = [{ index: 0, name: steps[0].name, value: initVal }];

for (let i = start; i <= end && i < steps.length; i++) {
  const step = steps[i];
  const raw = fs.readFileSync(path.join(dir, step.name), 'utf8').trim();
  const expression = step.awaitPromise ? raw : `new Function(${JSON.stringify(raw)})()`;
  let value;
  if (step.awaitPromise) {
    value = await page.evaluate(async (expr) => {
      // eslint-disable-next-line no-eval
      return await eval(expr);
    }, expression);
  } else {
    value = await page.evaluate((expr) => {
      // eslint-disable-next-line no-eval
      return eval(expr);
    }, expression);
  }
  results.push({ index: i, name: step.name, value });
  console.log('STEP', i, step.name, JSON.stringify(value));
  if (value && typeof value === 'object' && value.error) {
    console.error('EXCEPTION', JSON.stringify(value));
    process.exit(1);
  }
}

fs.writeFileSync(path.join(dir, '_results-run.json'), JSON.stringify(results, null, 2));
console.log('FINAL', JSON.stringify(results[results.length - 1]?.value));
await browser.disconnect();
