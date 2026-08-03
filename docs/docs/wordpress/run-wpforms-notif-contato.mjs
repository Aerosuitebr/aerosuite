/** Atualiza WPForms #12 notification para contato@aerosuite.com.br */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await ctx.newPage();
const front = await ctx.newPage();

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-builder&view=settings&form_id=12`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await admin.waitForTimeout(4000);
await admin.evaluate(() => {
  const n = document.querySelector('#wpforms-panel-notifications, [data-panel="notifications"], a[data-panel="notifications"]');
  if (n) n.click();
});
await admin.waitForTimeout(2000);

const before = await admin.evaluate(() => {
  const email = document.querySelector(
    'input[name*="notifications"][name*="email"], #wpforms-panel-field-notifications-1-email'
  );
  const enable = document.querySelector(
    'input[name*="notifications"][name*="enable"], #wpforms-panel-field-notifications-1-enable'
  );
  return { email: email?.value, enabled: enable?.checked };
});

const updated = await admin.evaluate(() => {
  const panel = document.querySelector('#wpforms-panel-notifications, [data-panel="notifications"]');
  if (panel) panel.classList.add('active');
  document.querySelectorAll('.wpforms-panel').forEach((p) => p.classList.remove('active'));
  const notifPanel = document.getElementById('wpforms-panel-notifications');
  if (notifPanel) {
    notifPanel.classList.add('active');
    notifPanel.style.display = 'block';
  }
  const email = document.getElementById('wpforms-panel-field-notifications-1-email');
  const enable = document.getElementById('wpforms-panel-field-notifications-1-enable');
  if (email) {
    email.value = 'contato@aerosuite.com.br';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    email.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (enable) {
    enable.checked = true;
    enable.dispatchEvent(new Event('change', { bubbles: true }));
  }
  return { email: email?.value, enabled: enable?.checked };
});

await admin.locator('.wpforms-btn-save, button:has-text("Salvar"), button:has-text("Save")').first().click({ timeout: 10000 });
await admin.waitForTimeout(4000);

const after = await admin.evaluate(() => {
  const email = document.querySelector(
    'input[name*="notifications"][name*="email"], #wpforms-panel-field-notifications-1-email'
  );
  const enable = document.querySelector(
    'input[name*="notifications"][name*="enable"], #wpforms-panel-field-notifications-1-enable'
  );
  return { email: email?.value, enabled: enable?.checked };
});

await front.goto(`${ORIGIN}/contato/?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });
await front.fill('#wpforms-12-field_1', 'Notif contato@');
await front.fill('#wpforms-12-field_2', `notif.${Date.now()}@aerosuite.com.br`);
await front.fill('#wpforms-12-field_8', 'Teste notificacao contato@');
await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});
const [res] = await Promise.all([
  front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  front.click('#wpforms-submit-12'),
]);
const body = await res.text();

console.log(JSON.stringify({
  updated,
  before,
  after,
  contato: { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 400) },
}, null, 2));

await browser.close();
process.exit(body.includes('"success":true') ? 0 : 1);
