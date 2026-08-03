import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const front = await ctx.newPage();

await front.goto(`${ORIGIN}/contato/?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });

const testEmail = `contato-test.${Date.now()}@aerosuite.com.br`;
await front.fill('#wpforms-12-field_1', 'Teste SMTP Google');
await front.fill('#wpforms-12-field_2', testEmail);
await front.fill('#wpforms-12-field_8', 'Teste automatico apos migracao SMTP para Google Workspace.');
await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});

const [res] = await Promise.all([
  front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  front.click('#wpforms-submit-12'),
]);
const body = await res.text();
const ui = await front.evaluate(() => {
  const ok = document.querySelector('.wpforms-confirmation-container-full, .wpforms-confirmation');
  const err = document.querySelector('.wpforms-error-container, .wpforms-error');
  return {
    confirmation: ok?.innerText?.slice(0, 400) || null,
    error: err?.innerText?.slice(0, 400) || null,
  };
});

const result = {
  at: new Date().toISOString(),
  testEmail,
  status: res.status(),
  ajaxSuccess: body.includes('"success":true'),
  body: body.slice(0, 600),
  ui,
};

fs.writeFileSync(path.join(dir, 'wp-contato-test-result.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.ajaxSuccess ? 0 : 1);
