import { createRequire } from 'module';
const pw = createRequire(import.meta.url)('playwright-core');
const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://aerosuite.com.br/contato/', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.click('#as-consent-accept-all', { timeout: 3000 }).catch(() => {});
const info = await page.evaluate(() => {
  return [...document.querySelectorAll('#wpforms-form-12 .wpforms-field')].map((wrap) => {
    const input = wrap.querySelector('input, textarea, select');
    const label = wrap.querySelector('label');
    const style = wrap.getAttribute('style') || '';
    const cls = wrap.className;
    return {
      fieldId: wrap.getAttribute('data-field-id') || wrap.id,
      label: label?.textContent?.trim(),
      inputId: input?.id,
      name: input?.name,
      type: input?.type,
      required: input?.required,
      hidden: wrap.offsetParent === null || style.includes('display:none') || cls.includes('wpforms-field-hidden'),
      cls,
    };
  });
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
