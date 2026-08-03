/**
 * Run all deploy steps via Playwright CDP attach or direct evaluate.
 * Requires wp-admin session — uses storage state if present.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.env.CDP_VIEW_ID || process.argv[2] || '';
const order = [
  'deploy-step-0.js',
  'deploy-step-1.js',
  'deploy-step-2.js',
  'deploy-step-3.js',
  'deploy-css-step-0.js',
  'deploy-css-step-1.js',
  'deploy-css-step-2.js',
  'deploy-css-step-3.js',
  'deploy-css-step-4.js',
  'deploy-css-step-5.js',
  'deploy-upload-hero.js',
  'deploy-upload-phone.js',
  'deploy-upload-zoom.js',
  'deploy-finalize-v2.js',
];

const startAt = Number(process.env.START_AT || process.argv[3] || 0);
const ws = process.env.CHROME_WS;

async function getPage() {
  if (ws) {
    const browser = await chromium.connectOverCDP(ws);
    const ctx = browser.contexts()[0];
    const pages = ctx.pages();
    const page = pages.find((p) => p.url().includes('wp-admin')) || pages[0];
    return { browser, page, close: () => browser.close() };
  }
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://aerosuite.com.br/wp-admin/', { waitUntil: 'domcontentloaded' });
  return { browser, page, close: () => browser.close() };
}

const { browser, page, close } = await getPage();
if (!page.url().includes('wp-admin') || page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN', page.url());
  await close();
  process.exit(1);
}

const results = [];
for (let i = startAt; i < order.length; i++) {
  const name = order[i];
  const expression = fs.readFileSync(path.join(dir, name), 'utf8').trim();
  try {
    const value = await page.evaluate(async (expr) => {
      // eslint-disable-next-line no-eval
      return await eval(expr);
    }, expression);
    results.push({ step: i + 1, name, ok: true, value });
    console.log('OK', i + 1, name, JSON.stringify(value));
  } catch (e) {
    results.push({ step: i + 1, name, ok: false, error: String(e) });
    console.error('FAIL', i + 1, name, String(e));
    fs.writeFileSync(path.join(dir, 'deploy-cdp-results.json'), JSON.stringify(results, null, 2));
    await close();
    process.exit(1);
  }
}

fs.writeFileSync(path.join(dir, 'deploy-cdp-results.json'), JSON.stringify(results, null, 2));
console.log('ALL_DONE', JSON.stringify(results[results.length - 1]?.value));
await close();
