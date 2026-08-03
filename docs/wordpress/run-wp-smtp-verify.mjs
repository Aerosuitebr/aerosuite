/**
 * Desativa fix plugin, inspeciona SMTP salvo, testa contato.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const FIX = 'aerosuite-wpforms-fix-7/aerosuite-wpforms-fix.php';

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await context.newPage();
const front = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));
const fixRow = admin.locator(`tr[data-plugin="${FIX}"]`);
if (await fixRow.locator('.deactivate a').count()) {
  await fixRow.locator('.deactivate a').click();
  await admin.waitForTimeout(2000);
}

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp`, { waitUntil: 'domcontentloaded', timeout: 120000 });
const smtpFields = await admin.evaluate(() => {
  const g = (id) => document.querySelector(id)?.value ?? null;
  const passEl = document.querySelector('#wp-mail-smtp-setting-smtp-pass, input[name*="smtp_pass"]');
  return {
    mailer: g('#wp-mail-smtp-setting-mailer-mailer') || g('select[name*="mailer"]'),
    host: g('#wp-mail-smtp-setting-smtp-host'),
    port: g('#wp-mail-smtp-setting-smtp-port'),
    user: g('#wp-mail-smtp-setting-smtp-user'),
    passPlaceholder: passEl?.placeholder || null,
    passLen: passEl?.value?.length || 0,
    from: g('#wp-mail-smtp-setting-from-email') || g('input[name*="from_email"]'),
    fromName: g('#wp-mail-smtp-setting-from-name'),
    encryption: g('#wp-mail-smtp-setting-smtp-encryption'),
  };
});

// Email test tab
await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp-tools&tab=test`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.fill('#wp-mail-smtp-test-email, input[name="email"]', 'contato@aerosuite.com.br').catch(() => {});
await admin.locator('#wp-mail-smtp-test-submit, button.wp-mail-smtp-btn-orange').first().click({ timeout: 8000 }).catch(() => {});
await admin.waitForTimeout(8000);
const testResult = await admin.evaluate(() => {
  const notice = document.querySelector('.wp-mail-smtp-notice, .notice, .wp-mail-smtp-setting-row-test-email');
  return {
    noticeText: notice?.innerText?.slice(0, 800) || document.body.innerText.match(/test email[\s\S]{0,400}/i)?.[0]?.slice(0, 400),
    debugLog: document.querySelector('#wp-mail-smtp-debug-output, .wp-mail-smtp-debug-event-preview')?.innerText?.slice(0, 1500),
  };
});

await front.goto(`${ORIGIN}/contato/?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });
await front.fill('#wpforms-12-field_1', 'Pos Fix Off');
await front.fill('#wpforms-12-field_2', `posfix.${Date.now()}@aerosuite.com.br`);
await front.fill('#wpforms-12-field_8', 'teste');
await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});
const [res] = await Promise.all([
  front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  front.click('#wpforms-submit-12'),
]);
const body = await res.text();
const submit = { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 600) };

const out = { smtpFields, testResult, submit, fixDeactivated: true };
fs.writeFileSync(path.join(dir, 'wp-smtp-setup-result.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
process.exit(submit.success ? 0 : 1);
