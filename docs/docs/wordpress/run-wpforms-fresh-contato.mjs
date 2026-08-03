import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`${ORIGIN}/contato/?fresh=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await page.waitForSelector('#wpforms-form-12', { timeout: 60000 });

const token = await page.$eval('[name="wpforms[token]"]', (el) => el.value).catch(() => null);
await page.fill('#wpforms-12-field_1', 'Fresh Test');
await page.fill('#wpforms-12-field_2', `fresh.${Date.now()}@aerosuite.com.br`);
await page.fill('#wpforms-12-field_8', 'first submit only');
await page.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});

const [res] = await Promise.all([
  page.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  page.click('#wpforms-submit-12'),
]);
const body = await res.text();
console.log(JSON.stringify({ token, status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 400) }, null, 2));
await browser.close();
process.exit(body.includes('"success":true') ? 0 : 1);
