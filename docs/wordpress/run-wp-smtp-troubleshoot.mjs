/**
 * Diagnóstico SMTP Locaweb: salva senha com evaluate, testa 587/TLS e 465/SSL, captura debug.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const PASS = process.env.AEROSUITE_CONTATO_SMTP_PASSWORD || process.env.WP_SMTP_PASSWORD || '';

if (!PASS) {
  console.error('Defina AEROSUITE_CONTATO_SMTP_PASSWORD');
  process.exit(2);
}

const CONFIGS = [
  { label: '587-tls', port: '587', enc: 'tls' },
  { label: '465-ssl', port: '465', enc: 'ssl' },
];

const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await ctx.newPage();

const dismiss = () =>
  admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));

async function saveSmtp({ port, enc }) {
  await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await dismiss();

  await admin.locator('#wp-mail-smtp-setting-mailer-smtp').check({ force: true });
  await admin.fill('#wp-mail-smtp-setting-smtp-host', 'email-ssl.com.br');
  await admin.fill('#wp-mail-smtp-setting-smtp-port', port);
  await admin.locator(`#wp-mail-smtp-setting-smtp-enc-${enc}`).check({ force: true });
  await admin.locator('#wp-mail-smtp-setting-smtp-auth').check({ force: true });
  await admin.fill('#wp-mail-smtp-setting-smtp-user', 'contato@aerosuite.com.br');

  await admin.evaluate((password) => {
    const pass = document.getElementById('wp-mail-smtp-setting-smtp-pass');
    if (pass) {
      pass.value = password;
      pass.dispatchEvent(new Event('input', { bubbles: true }));
      pass.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, PASS);

  await admin.fill('#wp-mail-smtp-setting-from_email', 'contato@aerosuite.com.br');
  await admin.fill('#wp-mail-smtp-setting-from_name', 'Aero Suite');
  await admin.locator('#wp-mail-smtp-setting-from_email_force').check({ force: true }).catch(() => {});
  await admin.locator('#wp-mail-smtp-setting-return_path').check({ force: true }).catch(() => {});

  if (enc === 'ssl') {
    await admin.locator('#wp-mail-smtp-setting-smtp-autotls').uncheck({ force: true }).catch(() => {});
  } else {
    await admin.locator('#wp-mail-smtp-setting-smtp-autotls').check({ force: true }).catch(() => {});
  }

  const save = admin.locator('button.wp-mail-smtp-btn-orange:has-text("Salvar"), button:has-text("Save Settings")').last();
  await save.scrollIntoViewIfNeeded().catch(() => {});
  await save.click({ timeout: 15000 });
  await admin.waitForTimeout(5000);

  const notice = await admin.evaluate(() => {
    const n = document.querySelector('.notice-success, .notice-error, .wp-mail-smtp-notice');
    return n?.innerText?.slice(0, 300);
  });

  const passStored = await admin.evaluate(() => {
    const p = document.getElementById('wp-mail-smtp-setting-smtp-pass');
    return { len: p?.value?.length || 0, placeholder: p?.placeholder || null };
  });

  return { notice, passStored };
}

async function testEmail() {
  await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp-tools&tab=test`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await dismiss();
  await admin.fill('#wp-mail-smtp-setting-test_email', 'contato@aerosuite.com.br');
  await Promise.all([
    admin.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {}),
    admin.locator('input[type="submit"][value*="Enviar"]').first().click({ timeout: 10000 }),
  ]);
  await admin.waitForTimeout(2000);

  return admin.evaluate(() => {
    const text = document.body.innerText;
    const success = /e-mail de teste foi enviado|test email was sent|enviado com sucesso|was sent successfully/i.test(text);
    const fail = /problema ao enviar|não foi possível|could not be sent|failed/i.test(text);
    const notice = document.querySelector('.notice-success, .notice-error');
    const debugBlocks = [...document.querySelectorAll('.wp-mail-smtp-debug-event-preview, .wp-mail-smtp-debug-event-error, pre, code')]
      .map((el) => el.innerText?.slice(0, 1500))
      .filter(Boolean);
    return {
      success,
      fail,
      notice: notice?.innerText?.slice(0, 1200),
      debug: debugBlocks.slice(0, 5),
      smtpError: text.match(/SMTP Error:[^\n]+|535[^\n]+|authentication[^\n]+/gi)?.slice(0, 5),
    };
  });
}

const results = [];
for (const cfg of CONFIGS) {
  const saved = await saveSmtp(cfg);
  const test = await testEmail();
  results.push({ cfg: cfg.label, saved, test });
  if (test.success && !test.fail) break;
}

fs.writeFileSync(path.join(dir, 'wp-smtp-troubleshoot.json'), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify({ results }, null, 2));
await browser.close();
process.exit(results.some((r) => r.test.success && !r.test.fail) ? 0 : 1);
