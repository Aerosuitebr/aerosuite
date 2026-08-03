import { createRequire } from 'module';
const pw = createRequire(import.meta.url)('playwright-core');
const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('request', (req) => {
  if (req.url().includes('admin-ajax.php') && req.method() === 'POST') {
    console.log('POST DATA FULL:\n', req.postData());
  }
});
await page.goto('https://aerosuite.com.br/contato/', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.click('#as-consent-accept-all', { timeout: 3000 }).catch(() => {});
await page.waitForSelector('#wpforms-form-12');
await page.fill('#wpforms-12-field_1', 'Teste Manual');
await page.fill('#wpforms-12-field_2', 'teste.manual@aerosuite.com.br');
await page.fill('#wpforms-12-field_8', 'Mensagem teste');
const vals = await page.evaluate(() => ({
  f1: document.querySelector('#wpforms-12-field_1')?.value,
  f2: document.querySelector('#wpforms-12-field_2')?.value,
}));
console.log('VALUES BEFORE SUBMIT:', vals);
const trap = await page.$('#wpforms-12-field_3');
if (trap) await trap.evaluate((el) => { el.value = ''; });
const [res] = await Promise.all([
  page.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST'),
  page.click('#wpforms-submit-12'),
]);
console.log('STATUS:', res.status());
console.log('BODY:', (await res.text()).slice(0, 800));
await browser.close();
