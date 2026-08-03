/**
 * Completa SMTP (TLS, from name), teste real no plugin, confirma /contato/ e fix off.
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
const PASS = process.env.AEROSUITE_CONTATO_SMTP_PASSWORD || process.env.WP_SMTP_PASSWORD || '';

const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await ctx.newPage();
const front = await ctx.newPage();

const dismiss = () => admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));

async function configureSmtp() {
  await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp`, { waitUntil: 'networkidle', timeout: 120000 });
  await dismiss();
  await admin.selectOption('#wp-mail-smtp-setting-mailer-mailer', 'smtp').catch(() => {});
  await admin.fill('#wp-mail-smtp-setting-smtp-host', 'email-ssl.com.br');
  await admin.fill('#wp-mail-smtp-setting-smtp-port', '587');
  await admin.selectOption('#wp-mail-smtp-setting-smtp-encryption', 'tls').catch(() => {});
  await admin.locator('#wp-mail-smtp-setting-smtp-auth').check({ force: true }).catch(() => {});
  await admin.fill('#wp-mail-smtp-setting-smtp-user', 'contato@aerosuite.com.br');
  if (PASS) await admin.fill('#wp-mail-smtp-setting-smtp-pass', PASS);
  await admin.fill('#wp-mail-smtp-setting-from-email', 'contato@aerosuite.com.br');
  await admin.fill('#wp-mail-smtp-setting-from-name', 'Aero Suite');
  await admin.locator('#wp-mail-smtp-setting-save').click({ timeout: 10000 });
  await admin.waitForTimeout(4000);
  const saved = await admin.evaluate(() => {
    const notice = document.querySelector('.wp-mail-smtp-notice, .notice-success, .notice-error');
    return notice?.innerText?.slice(0, 300) || null;
  });
  return { saved, hasPass: !!PASS };
}

async function testSmtpEmail() {
  await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp-tools&tab=test`, { waitUntil: 'networkidle', timeout: 120000 });
  await dismiss();
  await admin.fill('#wp-mail-smtp-test-email', 'contato@aerosuite.com.br');
  await admin.locator('#wp-mail-smtp-test-submit').click({ timeout: 10000 });
  await admin.waitForTimeout(12000);
  return admin.evaluate(() => {
    const text = document.body.innerText;
    const success = /was sent successfully|foi enviado|email was sent|test email was sent|sucesso/i.test(text);
    const fail = /could not be sent|não foi possível|failed|erro|error sending/i.test(text);
    const notice = document.querySelector('.wp-mail-smtp-notice, .notice');
    const debug = document.querySelector('.wp-mail-smtp-debug-event-preview, #wp-mail-smtp-debug-output');
    return {
      success,
      fail,
      notice: notice?.innerText?.slice(0, 600),
      debug: debug?.innerText?.slice(0, 2000),
      snippet: text.match(/Test Email[\s\S]{0,800}/i)?.[0]?.slice(0, 800),
    };
  });
}

async function fixStatus() {
  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await dismiss();
  return admin.evaluate((fix) => {
    const row = document.querySelector(`tr[data-plugin="${fix}"]`);
    return {
      found: !!row,
      active: !!row?.querySelector('.deactivate'),
      version: row?.querySelector('.plugin-version-author-uri')?.innerText || row?.innerText?.match(/Version [\d.]+/)?.[0],
    };
  }, FIX);
}

async function submitContato() {
  await front.goto(`${ORIGIN}/contato/?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
  await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });
  await front.fill('#wpforms-12-field_1', 'Final SMTP Test');
  await front.fill('#wpforms-12-field_2', `final.${Date.now()}@aerosuite.com.br`);
  await front.fill('#wpforms-12-field_8', 'Teste final pos SMTP');
  await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});
  const [res] = await Promise.all([
    front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
    front.click('#wpforms-submit-12'),
  ]);
  const body = await res.text();
  return { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 400) };
}

const result = {
  at: new Date().toISOString(),
  configure: await configureSmtp(),
  testEmail: await testSmtpEmail(),
  fix: await fixStatus(),
  contato: await submitContato(),
};

fs.writeFileSync(path.join(dir, 'wp-smtp-setup-result.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();

const ok = result.contato.success && !result.fix.active;
process.exit(ok ? 0 : 1);
