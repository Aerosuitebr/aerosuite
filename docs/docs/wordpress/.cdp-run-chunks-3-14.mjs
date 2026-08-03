/**
 * Run manifest chunks 3-14 via puppeteer-core if CHROME_WS set,
 * else print chunk index + result path for agent MCP loop.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const base = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.env.CDP_VIEW_ID || 'c8a606';
const start = Number(process.env.START_CHUNK || 3);
const end = Number(process.env.END_CHUNK || 14);
const resultsPath = path.join(base, '.cdp-chunk-results.json');

let results = [];
if (fs.existsSync(resultsPath)) {
  results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
}

const ws = process.env.CHROME_WS;
if (!ws) {
  for (let i = start; i <= end; i++) {
    const invokePath = path.join(base, `.cdp-invoke-${i}.json`);
    if (!fs.existsSync(invokePath)) {
      console.error('missing', invokePath);
      process.exit(1);
    }
    console.log('NEED_MCP', i, invokePath);
  }
  process.exit(2);
}

const puppeteer = await import('puppeteer-core');
const browser = await puppeteer.default.connect({ browserWSEndpoint: ws });
const pages = await browser.pages();
const page = pages[0];
if (!page) {
  console.error('no page');
  process.exit(1);
}

for (let i = start; i <= end; i++) {
  const invoke = JSON.parse(
    fs.readFileSync(path.join(base, `.cdp-invoke-${i}.json`), 'utf8')
  );
  const r = await page.evaluate(async (expr) => {
    // eslint-disable-next-line no-eval
    return await eval(expr);
  }, invoke.params.expression);
  results.push({ chunk: i, result: r });
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log('OK', i, JSON.stringify(r));
}
await browser.disconnect();
console.log('DONE');
