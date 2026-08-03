import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();
const logUrl = `${ORIGIN}/wp-content/uploads/aerosuite-wpforms-debug.log?${Date.now()}`;
const before = await page.goto(logUrl).then(() => page.textContent('body')).catch(() => '');

await page.goto(`${ORIGIN}/contato/?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await page.waitForSelector('#wpforms-form-12', { timeout: 60000 });
await page.fill('#wpforms-12-field_1', 'Fatal Hunt');
await page.fill('#wpforms-12-field_2', `fatal.${Date.now()}@aerosuite.com.br`);
await page.fill('#wpforms-12-field_8', 'x');
await page.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});
const res = await Promise.all([
  page.waitForResponse((r) => r.url().includes('admin-ajax.php'), { timeout: 60000 }),
  page.click('#wpforms-submit-12'),
]).then(([r]) => r);
const body = await res.text();

await page.waitForTimeout(1000);
const after = await page.goto(`${ORIGIN}/wp-content/uploads/aerosuite-wpforms-debug.log?${Date.now()}`).then(() => page.textContent('body'));

const newLines = String(after).slice(String(before).length).trim();
console.log(JSON.stringify({
  status: res.status(),
  success: body.includes('"success":true'),
  bodyStart: body.slice(0, 120),
  newLogLines: newLines.split(/\n/).slice(-15),
}, null, 2));

await browser.close();
