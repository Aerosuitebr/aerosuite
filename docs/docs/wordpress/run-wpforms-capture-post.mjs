import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await page.waitForSelector('#wpforms-form-12', { timeout: 60000 });

await page.fill('#wpforms-12-field_1', 'Capture Test');
await page.fill('#wpforms-12-field_2', `capture.${Date.now()}@aerosuite.com.br`);
await page.fill('#wpforms-12-field_8', 'msg');
await page.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});

const reqPromise = page.waitForRequest((r) => r.url().includes('admin-ajax.php') && r.method() === 'POST');
const resPromise = page.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST');
await page.click('#wpforms-submit-12');

const req = await reqPromise;
const res = await resPromise;
const postData = req.postData() || '';
const body = await res.text();

const parsed = await page.evaluate(async (url) => {
  const form = document.querySelector('#wpforms-form-12');
  const fd = new FormData(form);
  const entries = {};
  for (const [k, v] of fd.entries()) entries[k] = v;
  return entries;
}, req.url());

console.log(JSON.stringify({
  status: res.status(),
  success: body.includes('"success":true'),
  postDataLen: postData.length,
  postDataPreview: postData.slice(0, 1200),
  formData: parsed,
  body: body.slice(0, 800),
}, null, 2));

await browser.close();
