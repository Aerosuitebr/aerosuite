/**
 * Run all estoque CDP steps via Puppeteer connected to Chrome remote debugging.
 * Usage: node run-estoque-cdp.mjs [debugUrl] [viewId-hint]
 * Default debugUrl: http://127.0.0.1:9222
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const dir = path.dirname(fileURLToPath(import.meta.url));
const debugUrl = process.argv[2] || 'http://127.0.0.1:9222';
const targetHint = process.argv[3] || 'post=21';

const steps = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));

const browser = await puppeteer.connect({ browserURL: debugUrl, defaultViewport: null });
const pages = await browser.pages();
let page = pages.find((p) => p.url().includes(targetHint)) || pages.find((p) => p.url().includes('wp-admin'));
if (!page) page = pages[0];
if (!page) throw new Error('No page found');

console.log('TARGET', page.url());

const results = [];
for (let i = 0; i < steps.length; i++) {
  const step = steps[i];
  const expression = step.awaitPromise ? step.expression : `(function(){${fs.readFileSync(path.join(dir, step.name), 'utf8').trim()}})()`;
  const value = await page.evaluate(async (expr, awaitPromise) => {
    const fn = new Function(`return (${expr})`);
    const r = fn();
    return awaitPromise ? await r : r;
  }, step.awaitPromise ? step.expression : expression.replace(/^\(function\(\)\{/,'').replace(/\}\)\(\)$/,''), step.awaitPromise);
  results.push({ index: i, name: step.name, value });
  console.log('STEP', i, step.name, JSON.stringify(value).slice(0, 120));
}

fs.writeFileSync(path.join(dir, '_results.json'), JSON.stringify(results, null, 2));
console.log('FINAL', JSON.stringify(results[results.length - 1]?.value));
await browser.disconnect();
