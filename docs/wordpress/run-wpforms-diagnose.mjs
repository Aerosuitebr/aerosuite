/**
 * Captura resposta de admin-ajax.php ao enviar WPForms #12 (diagnóstico 500).
 * Uso: node run-wpforms-diagnose.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(dir, 'wpforms-diagnose-result.json');

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

async function captureAjaxResponse() {
  const res = await page.waitForResponse(
    (r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST',
    { timeout: 20000 }
  );
  let body = '';
  try {
    body = await res.text();
  } catch {
    body = '(unreadable)';
  }
  return {
    url: res.url(),
    status: res.status(),
    statusText: res.statusText(),
    body: body.slice(0, 8000),
  };
}

await page.goto('https://aerosuite.com.br/contato/', {
  waitUntil: 'networkidle',
  timeout: 120000,
});

await page.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});

await page.waitForSelector('#wpforms-form-12', { timeout: 30000 });

await page.fill('#wpforms-12-field_1', 'Teste Diagnostico');
await page.fill('#wpforms-12-field_2', 'teste.wpforms@aerosuite.com.br');
await page.fill('#wpforms-12-field_5', 'Teste FW');
await page.fill('#wpforms-12-field_7', '(21) 99999-0000');
await page.fill('#wpforms-12-field_8', 'Teste automatizado diagnostico');

const honeypot = await page.$('#wpforms-12-field_3');
if (honeypot) await honeypot.evaluate((el) => { el.value = ''; });

let ajaxCapture = null;
try {
  const [captured] = await Promise.all([captureAjaxResponse(), page.click('#wpforms-submit-12')]);
  ajaxCapture = captured;
} catch (err) {
  ajaxCapture = { error: String(err.message || err) };
}
await page.waitForTimeout(2000);

const pageErrors = await page
  .$$eval('.wpforms-error, em.wpforms-error, .as-wpforms-submit-hint', (els) =>
    els.map((e) => e.textContent.trim()).filter(Boolean)
  )
  .catch(() => []);

const spinnerVisible = await page
  .locator('.wpforms-submit-spinner')
  .evaluate((el) => getComputedStyle(el).display !== 'none')
  .catch(() => false);

const result = {
  at: new Date().toISOString(),
  finalUrl: page.url(),
  ajax: ajaxCapture,
  pageErrors,
  spinnerVisible,
  consoleErrors,
};

fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('DIAGNOSE_OK', JSON.stringify(result, null, 2));
await browser.close();
