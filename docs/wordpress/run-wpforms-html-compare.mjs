import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();

async function inspect(url, label) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  if (label === 'contato') await page.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
  await page.waitForSelector('#wpforms-form-12', { timeout: 60000 });
  return page.evaluate(() => {
    const form = document.querySelector('#wpforms-form-12');
    return {
      fields: [...form.querySelectorAll('.wpforms-field')].map((w) => ({
        id: w.getAttribute('data-field-id'),
        type: w.getAttribute('data-field-type'),
        inputName: w.querySelector('input,textarea')?.name,
      })),
      htmlAge: form.outerHTML.length,
    };
  });
}

const preview = await inspect(`${ORIGIN}/?wpforms_form_preview=12`, 'preview');
const contato = await inspect(`${ORIGIN}/contato/?x=${Date.now()}`, 'contato');

console.log(JSON.stringify({ preview, contato }, null, 2));
await browser.close();
