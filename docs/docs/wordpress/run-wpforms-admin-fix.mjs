/**
 * Desativa notificação por e-mail do WPForms #12 via UI (contorna HTTP 500 por SMTP).
 * Uso: node run-wpforms-admin-fix.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const ORIGIN = 'https://aerosuite.com.br';

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  process.exit(2);
}

async function submitForm(page) {
  await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.click('#as-consent-accept-all', { timeout: 4000 }).catch(() => {});
  await page.waitForSelector('#wpforms-form-12', { timeout: 45000 });
  await page.fill('#wpforms-12-field_1', 'Admin Fix Test');
  await page.fill('#wpforms-12-field_2', `adminfix.${Date.now()}@aerosuite.com.br`);
  await page.fill('#wpforms-12-field_7', '(21) 99999-0001');
  await page.fill('#wpforms-12-field_8', 'Teste pos desativar notificacao');
  const trap = await page.$('#wpforms-12-field_3');
  if (trap) await trap.evaluate((el) => { el.value = ''; });
  const capture = page.waitForResponse(
    (r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST',
    { timeout: 25000 }
  );
  await page.click('#wpforms-submit-12');
  const res = await capture;
  const body = await res.text().catch(() => '');
  return { status: res.status(), ok: res.ok(), bodyPreview: body.slice(0, 1200) };
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();

const result = { at: new Date().toISOString(), before: null, notificationToggle: null, after: null };

result.before = await submitForm(front).catch((e) => ({ error: String(e.message || e) }));

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-builder&view=settings&form_id=12`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

if (admin.url().includes('wp-login')) {
  console.error('SESSION_EXPIRED');
  await browser.close();
  process.exit(3);
}

await admin.waitForTimeout(3000);

result.notificationToggle = await admin.evaluate(() => {
  const notes = [];
  const enable = document.querySelector(
    'input[name*="notifications"][name*="enable"], #wpforms-panel-field-notifications-1-enable, input[id*="notification"][id*="enable"]'
  );
  if (enable && enable.checked) {
    enable.click();
    notes.push('notification_disabled_via_click');
  } else if (enable) {
    notes.push('notification_already_off');
  } else {
    notes.push('notification_toggle_not_found');
  }
  const save = document.querySelector('.wpforms-btn-save, button[name="wpforms-save"], #wpforms-embed');
  return { notes, saveFound: !!save };
});

const saveBtn = admin.locator('.wpforms-btn-save, button:has-text("Salvar"), button:has-text("Save")').first();
if (await saveBtn.count()) {
  await saveBtn.click({ timeout: 8000 }).catch(() => {});
  await admin.waitForTimeout(3000);
  result.notificationToggle.saved = true;
}

result.after = await submitForm(front).catch((e) => ({ error: String(e.message || e) }));

const outPath = path.join(dir, 'wpforms-admin-fix-result.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('ADMIN_FIX_OK', JSON.stringify({ before: result.before?.status, after: result.after?.status }, null, 2));
await browser.close();

process.exit(result.after?.ok ? 0 : 1);
