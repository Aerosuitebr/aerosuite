/**
 * Configura WP Mail SMTP (Locaweb), testa e-mail, form /contato/, desativa fix v1.1.0.
 *
 * Env opcional: AEROSUITE_CONTATO_SMTP_PASSWORD (senha da caixa contato@)
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
const FIX_PLUGIN = 'aerosuite-wpforms-fix-7/aerosuite-wpforms-fix.php';
const SMTP_PASS = process.env.AEROSUITE_CONTATO_SMTP_PASSWORD || process.env.WP_SMTP_PASSWORD || '';

const SMTP = {
  mailer: 'smtp',
  host: 'email-ssl.com.br',
  port: '587',
  encryption: 'tls',
  user: 'contato@aerosuite.com.br',
  from: 'contato@aerosuite.com.br',
  fromName: 'Aero Suite',
};

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  process.exit(2);
}

async function dismissOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll('#extendify-agent-popout-modal, .extendify-agent').forEach((e) => e.remove());
  });
}

async function readSmtpState(admin) {
  return admin.evaluate(async () => {
    try {
      const opt = await wp.apiFetch({ path: '/wp/v2/settings' }).catch(() => null);
      return { hasApiFetch: true, settingsError: opt?.code || null };
    } catch (e) {
      return { error: String(e.message || e) };
    }
  });
}

async function configureSmtpUi(admin) {
  await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await dismissOverlays(admin);

  if (admin.url().includes('wp-login')) {
    return { ok: false, error: 'session_expired' };
  }
  if (/sem permissão|not allowed/i.test(await admin.locator('body').innerText())) {
    return { ok: false, error: 'no_permission' };
  }

  // Wizard vs settings — try General settings tab
  const general = admin.locator('a[href*="wp-mail-smtp"], .wp-mail-smtp-tab, #wp-mail-smtp-tab-general').first();
  if (await general.count()) await general.click({ timeout: 3000 }).catch(() => {});

  // Mailer: Other SMTP
  await admin.selectOption('#wp-mail-smtp-setting-mailer-mailer, select[name="wp-mail-smtp[mail][mailer]"]', 'smtp').catch(async () => {
    await admin.locator('label:has-text("Other SMTP"), label:has-text("Outro SMTP")').first().click({ timeout: 5000 }).catch(() => {});
  });
  await admin.waitForTimeout(1500);

  const fill = async (selectors, value) => {
    for (const sel of selectors) {
      const el = admin.locator(sel).first();
      if (await el.count()) {
        await el.fill(value);
        return sel;
      }
    }
    return null;
  };

  const filled = {
    host: await fill(['#wp-mail-smtp-setting-smtp-host', 'input[name*="smtp_host"]'], SMTP.host),
    port: await fill(['#wp-mail-smtp-setting-smtp-port', 'input[name*="smtp_port"]'], SMTP.port),
    user: await fill(['#wp-mail-smtp-setting-smtp-user', 'input[name*="smtp_user"]'], SMTP.user),
    pass: SMTP_PASS
      ? await fill(['#wp-mail-smtp-setting-smtp-pass', 'input[name*="smtp_pass"]', 'input[type="password"]'], SMTP_PASS)
      : 'skipped_no_env',
    from: await fill(['#wp-mail-smtp-setting-from-email', 'input[name*="from_email"]'], SMTP.from),
    fromName: await fill(['#wp-mail-smtp-setting-from-name', 'input[name*="from_name"]'], SMTP.fromName),
  };

  // Encryption TLS
  await admin.selectOption('#wp-mail-smtp-setting-smtp-encryption, select[name*="smtp_encryption"]', 'tls').catch(() => {});
  await admin.locator('#wp-mail-smtp-setting-smtp-auth, input[name*="smtp_auth"]').check({ force: true }).catch(() => {});

  // Save
  const saveBtn = admin.locator('#wp-mail-smtp-setting-save, button:has-text("Save Settings"), button:has-text("Salvar")').first();
  if (await saveBtn.count()) {
    await saveBtn.click({ timeout: 10000 });
    await admin.waitForTimeout(3000);
  }

  return { ok: true, filled, url: admin.url() };
}

async function sendTestEmail(admin, toEmail) {
  await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp-tools&tab=test`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await dismissOverlays(admin);

  const to = admin.locator('#wp-mail-smtp-test-email, input[name="email"]');
  if (await to.count()) await to.fill(toEmail);

  const send = admin.locator('#wp-mail-smtp-test-submit, button:has-text("Send Email"), button:has-text("Enviar")').first();
  if (!(await send.count())) return { ok: false, error: 'test_button_missing' };

  await send.click({ timeout: 10000 });
  await admin.waitForTimeout(8000);

  const body = await admin.locator('body').innerText();
  return {
    ok: /success|sucesso|sent|enviado/i.test(body) && !/fail|erro|error/i.test(body.slice(0, 500)),
    snippet: body.slice(0, 1200).replace(/\s+/g, ' '),
  };
}

async function submitContato(front) {
  await front.goto(`${ORIGIN}/contato/?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
  await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });
  await front.fill('#wpforms-12-field_1', 'SMTP Setup Test');
  await front.fill('#wpforms-12-field_2', `smtp.setup.${Date.now()}@aerosuite.com.br`);
  await front.fill('#wpforms-12-field_8', 'Teste automatico pos configuracao SMTP');
  await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});
  const [res] = await Promise.all([
    front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
    front.click('#wpforms-submit-12'),
  ]);
  const body = await res.text();
  return { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 600) };
}

async function deactivateFix(admin) {
  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await dismissOverlays(admin);
  const row = admin.locator(`tr[data-plugin="${FIX_PLUGIN}"]`);
  if (!(await row.count())) return { ok: false, reason: 'not_found' };
  if (!row.locator('.deactivate').count()) return { ok: true, reason: 'already_inactive' };
  await row.locator('.deactivate a').click();
  await admin.waitForTimeout(2000);
  return { ok: true, reason: 'deactivated' };
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();

const result = {
  at: new Date().toISOString(),
  hasPassword: !!SMTP_PASS,
  configure: null,
  testEmail: null,
  contatoBeforeFix: null,
  fixDeactivated: null,
  contatoAfterFix: null,
};

if (!SMTP_PASS) {
  // Try reading if password already saved in WP — still run configure for non-pass fields
  result.configure = await configureSmtpUi(admin);
  result.testEmail = await sendTestEmail(admin, 'contato@aerosuite.com.br');
  if (!result.testEmail.ok) {
    result.contatoBeforeFix = await submitContato(front).catch((e) => ({ error: String(e.message || e) }));
    fs.writeFileSync(path.join(dir, 'wp-smtp-setup-result.json'), JSON.stringify(result, null, 2));
    console.log('NEED_PASSWORD', JSON.stringify(result, null, 2));
    await browser.close();
    process.exit(3);
  }
} else {
  result.configure = await configureSmtpUi(admin);
  result.testEmail = await sendTestEmail(admin, 'contato@aerosuite.com.br');
}

result.contatoBeforeFix = await submitContato(front).catch((e) => ({ error: String(e.message || e) }));

if (result.testEmail?.ok && result.contatoBeforeFix?.success) {
  result.fixDeactivated = await deactivateFix(admin);
  result.contatoAfterFix = await submitContato(front).catch((e) => ({ error: String(e.message || e) }));
}

fs.writeFileSync(path.join(dir, 'wp-smtp-setup-result.json'), JSON.stringify(result, null, 2));
console.log('SMTP_SETUP', JSON.stringify(result, null, 2));
await browser.close();

const ok = result.contatoAfterFix?.success || (result.contatoBeforeFix?.success && result.fixDeactivated?.ok);
process.exit(ok ? 0 : 1);
