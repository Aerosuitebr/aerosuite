import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`${ORIGIN}/?wpforms_form_preview=12`, { waitUntil: 'domcontentloaded', timeout: 120000 });

const fields = await page.evaluate(() =>
  [...document.querySelectorAll('.wpforms-field')].map((w) => ({
    id: w.getAttribute('data-field-id'),
    type: w.getAttribute('data-field-type') || w.className.match(/wpforms-field-(\w+)/)?.[1],
    inputs: [...w.querySelectorAll('input,textarea')].map((el) => ({
      id: el.id,
      name: el.name,
      type: el.type || el.tagName.toLowerCase(),
    })),
    label: w.querySelector('label')?.textContent?.trim(),
  }))
);

console.log(JSON.stringify({ fields }, null, 2));
await browser.close();
