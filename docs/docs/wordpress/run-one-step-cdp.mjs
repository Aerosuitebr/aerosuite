import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const dir = path.dirname(fileURLToPath(import.meta.url));
const i = Number(process.argv[2]);
const cdpUrl = process.argv[3] || process.env.CURSOR_CDP_URL || 'http://127.0.0.1:9222';

const payloads = JSON.parse(fs.readFileSync(path.join(dir, 'step-payloads.json'), 'utf8'));
const step = payloads[i];
if (!step) {
  console.error('bad index', i);
  process.exit(1);
}

const browser = await chromium.connectOverCDP(cdpUrl);
const contexts = browser.contexts();
const page = contexts[0]?.pages().find((p) => p.url().includes('aerosuite.com.br')) || contexts[0]?.pages()[0];
if (!page) {
  console.error('no page');
  process.exit(2);
}

const value = await page.evaluate(
  async ({ expr, awaitPromise }) => {
    let v = eval(expr);
    if (awaitPromise) v = await v;
    return v;
  },
  { expr: step.expression, awaitPromise: step.awaitPromise }
);

console.log(JSON.stringify({ name: step.name, value }));
await browser.close();
