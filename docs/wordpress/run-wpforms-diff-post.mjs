import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const ORIGIN = 'https://aerosuite.com.br';

async function capture(page, label) {
  await page.fill('#wpforms-12-field_1', 'Diff Test');
  await page.fill('#wpforms-12-field_2', `diff.${Date.now()}@aerosuite.com.br`);
  await page.fill('#wpforms-12-field_8', 'diff');
  await page.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});

  const reqP = page.waitForRequest((r) => r.url().includes('admin-ajax.php') && r.method() === 'POST');
  const resP = page.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST');
  await page.click('#wpforms-submit-12');
  const req = await reqP;
  const res = await resP;
  const body = await res.text();
  const fd = await page.evaluate(() => {
    const form = document.querySelector('#wpforms-form-12');
    const entries = {};
    for (const [k, v] of new FormData(form).entries()) entries[k] = v;
    return entries;
  });
  return { label, fd, status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 300) };
}

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(`${ORIGIN}/?wpforms_form_preview=12`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForSelector('#wpforms-form-12', { timeout: 60000 });
const preview = await capture(page, 'preview');

await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await page.waitForSelector('#wpforms-form-12', { timeout: 60000 });
const contato = await capture(page, 'contato');

console.log(JSON.stringify({ preview, contato }, null, 2));
await browser.close();
