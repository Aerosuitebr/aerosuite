import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const dir = path.dirname(fileURLToPath(import.meta.url));
const debugUrl = process.env.CDP_DEBUG_URL || 'http://127.0.0.1:9222';
const startIdx = Number(process.argv[2] ?? 0);
const endIdx = Number(process.argv[3] ?? 14);

const steps = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));

function wrap(content, awaitPromise) {
  if (awaitPromise) return content.trim();
  return `(function(){${content.trim()}})()`;
}

let browser;
try {
  browser = await puppeteer.connect({ browserURL: debugUrl, defaultViewport: null });
} catch (e) {
  console.error('PUPPETEER_CONNECT_FAILED', e.message);
  process.exit(2);
}

const pages = await browser.pages();
const page =
  pages.find((p) => p.url().includes('post=21&action=edit')) ||
  pages.find((p) => p.url().includes('wp-admin')) ||
  pages[0];
if (!page) {
  console.error('NO_PAGE');
  process.exit(3);
}
console.error('PAGE', page.url());

const results = [];
for (let i = startIdx; i <= endIdx && i < steps.length; i++) {
  const step = steps[i];
  const raw = fs.readFileSync(path.join(dir, step.name), 'utf8').trim();
  const expression = wrap(raw, step.awaitPromise);
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
}

const outPath = path.join(dir, '_results.json');
let all = [];
if (fs.existsSync(outPath)) all = JSON.parse(fs.readFileSync(outPath, 'utf8'));
for (const r of results) {
  const ix = all.findIndex((x) => x.index === r.index);
  if (ix >= 0) all[ix] = r;
  else all.push(r);
}
all.sort((a, b) => a.index - b.index);
fs.writeFileSync(outPath, JSON.stringify(all, null, 2));

if (endIdx >= steps.length - 1) {
  console.log('FINAL', JSON.stringify(all[all.length - 1]?.value));
}

await browser.disconnect();
