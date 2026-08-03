/**
 * Configura WP Mail SMTP (Locaweb), teste e-mail, /contato/, confirma fix off.
 * Senha: AEROSUITE_CONTATO_SMTP_PASSWORD ou WP_SMTP_PASSWORD
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

const dismiss = async (page) =>
  page.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));

async function configureSmtp() {
  await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await dismiss(admin);

  await admin.locator('#wp-mail-smtp-setting-mailer-smtp').check({ force: true });
  await admin.locator('#wp-mail-smtp-setting-smtp-enc-tls').check({ force: true });
  await admin.fill('#wp-mail-smtp-setting-smtp-host', 'email-ssl.com.br');
  await admin.fill('#wp-mail-smtp-setting-smtp-port', '587');
  await admin.locator('#wp-mail-smtp-setting-smtp-auth').check({ force: true });
  await admin.fill('#wp-mail-smtp-setting-smtp-user', 'contato@aerosuite.com.br');
  await admin.fill('#wp-mail-smtp-setting-from_email', 'contato@aerosuite.com.br');
  await admin.fill('#wp-mail-smtp-setting-from_name', 'Aero Suite');
  await admin.locator('#wp-mail-smtp-setting-from_email_force').check({ force: true }).catch(() => {});
  await admin.locator('#wp-mail-smtp-setting-from_name_force').check({ force: true }).catch(() => {});
  await admin.locator('#wp-mail-smtp-setting-return_path').check({ force: true }).catch(() => {});

  if (PASS) {
    await admin.evaluate((password) => {
      const pass = document.getElementById('wp-mail-smtp-setting-smtp-pass');
      if (pass) {
        pass.value = password;
        pass.dispatchEvent(new Event('input', { bubbles: true }));
        pass.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, PASS);
  }

  const saveBtn = admin.locator('button.wp-mail-smtp-btn-orange:has-text("Salvar"), button:has-text("Save Settings")').last();
  await saveBtn.scrollIntoViewIfNeeded();
  await saveBtn.click({ timeout: 15000 });
  await admin.waitForTimeout(4000);

  const saved = await admin.evaluate(() => {
    const ok = document.querySelector('.notice-success, .wp-mail-smtp-notice-success');
    const err = document.querySelector('.notice-error');
    return { ok: ok?.innerText?.slice(0, 200), err: err?.innerText?.slice(0, 200) };
  });

  const mailerChecked = await admin.locator('#wp-mail-smtp-setting-mailer-smtp').isChecked();
  return { saved, mailerChecked, hasPassEnv: !!PASS };
}

async function sendTestEmail() {
  await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp-tools&tab=test`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await dismiss(admin);
  await admin.fill('#wp-mail-smtp-setting-test_email', 'contato@aerosuite.com.br');

  await Promise.all([
    admin.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {}),
    admin.locator('input[type="submit"][value*="Enviar"], button:has-text("Enviar")').first().click({ timeout: 10000 }),
  ]);
  await admin.waitForTimeout(2000);

  return admin.evaluate(() => {
    const text = document.body.innerText;
    const success = /sucesso!|e-mail de teste[\s\S]{0,30}foi enviado|test email was sent|enviado com sucesso|was sent successfully/i.test(text);
    const fail = /problema ao enviar|não foi possível|could not be sent|failed to send|falha ao enviar|não foi possível autenticar|ocorreu um problema/i.test(text);
    const notice = document.querySelector('.notice-success, .notice-error, .wp-mail-smtp-notice');
    const debug = [...document.querySelectorAll('.wp-mail-smtp-debug-event-preview, .wp-mail-smtp-debug-event-error')]
      .map((el) => el.innerText?.slice(0, 800))
      .filter(Boolean);
    return {
      success,
      fail,
      notice: notice?.innerText?.slice(0, 800),
      debug: debug.slice(0, 3),
      excerpt: text.match(/(e-mail de teste|test email)[\s\S]{0,400}/i)?.[0]?.slice(0, 400),
    };
  });
}

async function fixStatus() {
  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await dismiss(admin);
  const row = admin.locator(`tr[data-plugin="${FIX}"]`);
  return {
    found: (await row.count()) > 0,
    active: (await row.locator('.deactivate').count()) > 0,
  };
}

async function submitContato() {
  await front.goto(`${ORIGIN}/contato/?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
  await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });
  await front.fill('#wpforms-12-field_1', 'SMTP OK Test');
  await front.fill('#wpforms-12-field_2', `smtpok.${Date.now()}@aerosuite.com.br`);
  await front.fill('#wpforms-12-field_8', 'Teste automatico pos configuracao SMTP Locaweb');
  await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});
  const [res] = await Promise.all([
    front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
    front.click('#wpforms-submit-12'),
  ]);
  const body = await res.text();
  return { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 500) };
}

const result = {
  at: new Date().toISOString(),
  configure: await configureSmtp(),
  testEmail: await sendTestEmail(),
  fix: await fixStatus(),
  contato: await submitContato(),
};

// Desativar fix se ainda ativo e contato OK
if (result.fix.active && result.contato.success) {
  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
  await admin.locator(`tr[data-plugin="${FIX}"] .deactivate a`).click({ timeout: 8000 }).catch(() => {});
  await admin.waitForTimeout(2000);
  result.fix = await fixStatus();
  result.contatoAfterDeactivate = await submitContato();
}

fs.writeFileSync(path.join(dir, 'wp-smtp-setup-result.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();

const smtpOk = result.testEmail.success && !result.testEmail.fail;
const formOk = result.contato.success;
process.exit(smtpOk && formOk && !result.fix.active ? 0 : formOk && !result.fix.active ? 2 : 1);
