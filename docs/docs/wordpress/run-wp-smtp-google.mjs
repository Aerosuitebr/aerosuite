/**
 * Configura WP Mail SMTP para Google Workspace (smtp.gmail.com) com contato@.
 *
 * Senha: senha de app Google (conta contato@) em AEROSUITE_CONTATO_SMTP_PASSWORD ou WP_SMTP_PASSWORD.
 * Requer sessão WP em docs/wordpress/wp-storage.json (node docs/wordpress/save-wp-session.mjs).
 *
 * Uso:
 *   node docs/wordpress/run-wp-smtp-google.mjs --dry-run
 *   AEROSUITE_CONTATO_SMTP_PASSWORD=xxxx node docs/wordpress/run-wp-smtp-google.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const STORAGE = path.join(dir, 'wp-storage.json');
const PASS = process.env.AEROSUITE_CONTATO_SMTP_PASSWORD || process.env.WP_SMTP_PASSWORD || '';
const DRY = process.argv.includes('--dry-run');

if (!fs.existsSync(STORAGE)) {
  console.error('Sessão WP ausente. Rode: node docs/wordpress/save-wp-session.mjs');
  process.exit(1);
}
if (!PASS && !DRY) {
  console.error('Defina AEROSUITE_CONTATO_SMTP_PASSWORD (senha de app Google para contato@).');
  process.exit(1);
}

const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: STORAGE });
const admin = await ctx.newPage();

const dismiss = async (page) =>
  page.evaluate(() =>
    document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()),
  );

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await dismiss(admin);

await admin.locator('#wp-mail-smtp-setting-mailer-smtp').check({ force: true });
await admin.locator('#wp-mail-smtp-setting-smtp-enc-tls').check({ force: true });
await admin.fill('#wp-mail-smtp-setting-smtp-host', 'smtp.gmail.com');
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

const snapshot = await admin.evaluate(() => ({
  mailer: document.querySelector('#wp-mail-smtp-setting-mailer-smtp')?.checked,
  host: document.getElementById('wp-mail-smtp-setting-smtp-host')?.value,
  port: document.getElementById('wp-mail-smtp-setting-smtp-port')?.value,
  user: document.getElementById('wp-mail-smtp-setting-smtp-user')?.value,
  from: document.getElementById('wp-mail-smtp-setting-from_email')?.value,
}));

if (DRY) {
  console.log(JSON.stringify({ ok: true, dryRun: true, snapshot, hasPass: !!PASS }, null, 2));
  await browser.close();
  process.exit(0);
}

const saveBtn = admin.locator('button.wp-mail-smtp-btn-orange:has-text("Salvar"), button:has-text("Save Settings")').last();
await saveBtn.scrollIntoViewIfNeeded();
await saveBtn.click({ timeout: 15000 });
await admin.waitForTimeout(4000);

const saved = await admin.evaluate(() => {
  const ok = document.querySelector('.notice-success, .wp-mail-smtp-notice-success');
  const err = document.querySelector('.notice-error');
  return { ok: ok?.innerText?.slice(0, 300), err: err?.innerText?.slice(0, 300) };
});

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp-tools&tab=test`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await dismiss(admin);
await admin.fill('#wp-mail-smtp-setting-test_email', 'comercial@aerosuite.com.br');
await Promise.all([
  admin.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {}),
  admin.locator('input[type="submit"][value*="Enviar"], button:has-text("Enviar")').first().click({ timeout: 10000 }),
]);
await admin.waitForTimeout(2000);

const test = await admin.evaluate(() => {
  const text = document.body.innerText;
  return {
    success: /sucesso|foi enviado|was sent successfully/i.test(text),
    fail: /problema|falha|could not|não foi possível autenticar/i.test(text),
    excerpt: text.match(/(e-mail de teste|test email)[\s\S]{0,300}/i)?.[0]?.slice(0, 300),
  };
});

const out = path.join(dir, 'wp-smtp-google-result.json');
fs.writeFileSync(out, JSON.stringify({ snapshot, saved, test, at: new Date().toISOString() }, null, 2));
console.log(JSON.stringify({ ok: !test.fail, out, saved, test }, null, 2));
await browser.close();
