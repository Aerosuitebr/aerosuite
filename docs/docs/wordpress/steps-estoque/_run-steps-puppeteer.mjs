/**
 * Run steps start..end in order via puppeteer-core (npx).
 * Usage: node _run-steps-puppeteer.mjs <hint> <start> <end>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const hint = process.argv[2] || 'post=21';
const start = Number(process.argv[3] ?? 2);
const end = Number(process.argv[4] ?? 14);

let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  console.error('NO_PUPPETEER');
  process.exit(2);
}

const steps = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));
const debugUrl = process.env.CDP_DEBUG_URL || 'http://127.0.0.1:9222';

let browser;
try {
  browser = await puppeteer.connect({ browserURL: debugUrl, defaultViewport: null });
} catch (e) {
  console.error('CONNECT_FAILED', e.message);
  process.exit(3);
}

const pages = await browser.pages();
const page =
  pages.find((p) => p.url().includes(hint)) ||
  pages.find((p) => p.url().includes('wp-admin')) ||
  pages[0];
if (!page) {
  console.error('NO_PAGE');
  process.exit(4);
}

const log = [];
for (let i = start; i <= end && i < steps.length; i++) {
  const step = steps[i];
  const raw = fs.readFileSync(path.join(dir, step.name), 'utf8').trim();
  const expression = step.awaitPromise ? raw : `new Function(${JSON.stringify(raw)})()`;
  let value;
  try {
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
  } catch (err) {
    console.error('STEP', i, 'ERROR', err.message);
    log.push({ step: i, name: step.name, error: err.message });
    break;
  }
  log.push({ step: i, name: step.name, value });
  console.log('STEP', i, '=>', JSON.stringify(value));
  if (value && typeof value === 'object' && value.error) break;
}

fs.writeFileSync(path.join(dir, '_run-log.json'), JSON.stringify(log, null, 2));
await browser.disconnect();
