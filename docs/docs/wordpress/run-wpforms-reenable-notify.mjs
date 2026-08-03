/**
 * Reativa notificação por e-mail do WPForms #12 (após fix de memória).
 * Uso: node run-wpforms-reenable-notify.mjs
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

async function dismissAdminOverlays(admin) {
  await admin.evaluate(() => {
    document.querySelectorAll('#extendify-agent-popout-modal, .extendify-agent').forEach((el) => el.remove());
  });
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-builder&view=settings&form_id=12`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (admin.url().includes('wp-login')) {
  console.error('SESSION_EXPIRED');
  process.exit(3);
}
await dismissAdminOverlays(admin);
await admin.waitForTimeout(3000);

const notes = await admin.evaluate(() => {
  const out = [];
  document.querySelectorAll('input[type="checkbox"]').forEach((el) => {
    const ctx = (el.getAttribute('name') || '') + (el.id || '') + (el.closest('label')?.textContent || '');
    if (/notification.*enable|enable.*notification|notifica/i.test(ctx) && !el.checked) {
      el.click();
      out.push('enabled:' + (el.id || el.name));
    }
  });
  return out;
});

const save = admin.locator('.wpforms-btn-save, button:has-text("Salvar"), button:has-text("Save")').first();
if (await save.count()) {
  await admin.evaluate(() => {
    const b = document.querySelector('.wpforms-btn-save, button[name="wpforms-save"]');
    if (b) b.click();
  });
  await admin.waitForTimeout(2500);
}

console.log('NOTIFY_REENABLED', JSON.stringify({ notes, saved: true }));
await browser.close();
