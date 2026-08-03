import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await context.newPage();
const front = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-builder&view=settings&form_id=12`, {
  waitUntil: 'domcontentloaded',
  timeout: 180000,
});
await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));
await admin.waitForTimeout(8000);

const save = await admin.evaluate(async () => {
  const toggle = document.querySelector('#wpforms-panel-field-notifications-1-enable, input[name*="notifications"][name*="enable"]');
  if (toggle && toggle.checked) toggle.click();
  const nonce = window.wpforms_builder?.nonce || '';
  const form = window.wpforms_builder?.form || {};
  if (form.settings?.notifications?.['1']) {
    form.settings.notifications['1'].enable = '0';
  }
  form.settings = form.settings || {};
  form.settings.notification_enable = '0';
  form.settings.notifications = form.settings.notifications || {};
  if (form.settings.notifications['1']) form.settings.notifications['1'].enable = '0';
  const body = new URLSearchParams();
  body.set('action', 'wpforms_save_form');
  body.set('id', '12');
  body.set('title', form.settings?.form_title || 'Formulario de Contato Simples');
  body.set('form', JSON.stringify(form));
  if (nonce) body.set('nonce', nonce);
  const res = await fetch(window.ajaxurl, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: body.toString(),
  });
  const text = await res.text();
  try {
    return { status: res.status, json: JSON.parse(text), hadBuilder: !!window.wpforms_builder };
  } catch {
    return { status: res.status, raw: text.slice(0, 500), hadBuilder: !!window.wpforms_builder };
  }
});

await front.goto(`${ORIGIN}/contato/?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });
await front.fill('#wpforms-12-field_1', 'Notify Off');
await front.fill('#wpforms-12-field_2', `notify.${Date.now()}@aerosuite.com.br`);
await front.fill('#wpforms-12-field_8', 'test');
await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});

const [res] = await Promise.all([
  front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  front.click('#wpforms-submit-12'),
]);
const body = await res.text();

console.log(JSON.stringify({ save, submit: { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 500) } }, null, 2));
await browser.close();
process.exit(body.includes('"success":true') ? 0 : 1);
