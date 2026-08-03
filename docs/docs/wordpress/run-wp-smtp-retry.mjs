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

const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await ctx.newPage();

const dismiss = () =>
  admin.evaluate(() =>
    document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()),
  );

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await dismiss();

const pageInfo = await admin.evaluate(() => {
  const links = [...document.querySelectorAll('a, button')]
    .filter((el) => /excluir|remover|remove|delete/i.test(el.innerText || ''))
    .map((el) => ({ tag: el.tagName, text: el.innerText?.trim(), id: el.id }));
  const pass = document.getElementById('wp-mail-smtp-setting-smtp-pass');
  return { links, passPlaceholder: pass?.placeholder, passValueLen: pass?.value?.length };
});

const del = admin
  .locator(
    'a:has-text("Excluir senha"), button:has-text("Excluir senha"), a:has-text("Remove Password"), button:has-text("Remove Password")',
  )
  .first();
if (await del.count()) {
  await del.click({ timeout: 5000 });
  await admin.waitForTimeout(1000);
}

await admin.locator('#wp-mail-smtp-setting-mailer-smtp').check({ force: true });
await admin.locator('#wp-mail-smtp-setting-smtp-enc-tls').check({ force: true });
await admin.fill('#wp-mail-smtp-setting-smtp-host', 'smtp.gmail.com');
await admin.fill('#wp-mail-smtp-setting-smtp-port', '587');
await admin.locator('#wp-mail-smtp-setting-smtp-auth').check({ force: true });
await admin.fill('#wp-mail-smtp-setting-smtp-user', 'contato@aerosuite.com.br');
await admin.fill('#wp-mail-smtp-setting-smtp-pass', PASS);
await admin.fill('#wp-mail-smtp-setting-from_email', 'contato@aerosuite.com.br');
await admin.fill('#wp-mail-smtp-setting-from_name', 'Aero Suite');
await admin.locator('#wp-mail-smtp-setting-from_email_force').check({ force: true }).catch(() => {});
await admin.locator('#wp-mail-smtp-setting-return_path').check({ force: true }).catch(() => {});

const passAfter = await admin.evaluate(() => document.getElementById('wp-mail-smtp-setting-smtp-pass')?.value?.length);

const saveBtn = admin.locator('button.wp-mail-smtp-btn-orange:has-text("Salvar"), button:has-text("Save Settings")').last();
await saveBtn.scrollIntoViewIfNeeded();
await saveBtn.click({ timeout: 15000 });
await admin.waitForTimeout(5000);

const saved = await admin.evaluate(() => ({
  ok: document.querySelector('.notice-success, .wp-mail-smtp-notice-success')?.innerText?.slice(0, 300),
  err: document.querySelector('.notice-error')?.innerText?.slice(0, 300),
}));

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp-tools&tab=test`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await dismiss();
await admin.fill('#wp-mail-smtp-setting-test_email', 'comercial@aerosuite.com.br');
await Promise.all([
  admin.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {}),
  admin.locator('input[type="submit"][value*="Enviar"], button:has-text("Enviar")').first().click({ timeout: 10000 }),
]);
await admin.waitForTimeout(3000);

const test = await admin.evaluate(() => {
  const text = document.body.innerText;
  const debug = [...document.querySelectorAll('.wp-mail-smtp-debug-event-preview, .wp-mail-smtp-debug-event-error')]
    .map((el) => el.innerText?.slice(0, 1500))
    .filter(Boolean);
  return {
    success: /foi enviado|was sent successfully/i.test(text),
    fail: /problema|não foi possível autenticar|could not/i.test(text),
    notice: document.querySelector('.notice-success, .notice-error')?.innerText?.slice(0, 800),
    debug,
    smtp: text.match(/535[^\n]+|SMTP Error[^\n]+|authentication[^\n]+/gi)?.slice(0, 5),
    excerpt: text.match(/(e-mail de teste|test email)[\s\S]{0,500}/i)?.[0]?.slice(0, 500),
  };
});

const out = { pageInfo, passAfter, saved, test, at: new Date().toISOString() };
fs.writeFileSync(path.join(dir, 'wp-smtp-retry-result.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
process.exit(test.success && !test.fail ? 0 : 1);
