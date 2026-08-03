/**
 * Reconstrói WPForms #12 via import JSON + confirma envio.
 * Uso: node run-wpforms-rebuild-form.mjs
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
const formJson = JSON.parse(fs.readFileSync(path.join(dir, 'aerosuite-wpforms-form12.json'), 'utf8'));

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  process.exit(2);
}

async function dismissAdminOverlays(admin) {
  await admin.evaluate(() => {
    document.querySelectorAll('#extendify-agent-popout-modal, .extendify-agent').forEach((el) => el.remove());
  });
}

async function submitForm(page) {
  await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.click('#as-consent-accept-all', { timeout: 4000 }).catch(() => {});
  await page.waitForSelector('#wpforms-form-12', { timeout: 45000 });
  await page.fill('#wpforms-12-field_1', 'Rebuild Test');
  await page.fill('#wpforms-12-field_2', `rebuild.${Date.now()}@aerosuite.com.br`);
  await page.fill('#wpforms-12-field_5', 'Aero Suite QA');
  await page.fill('#wpforms-12-field_7', '(21) 99999-0001');
  await page.fill('#wpforms-12-field_8', 'Teste pos-rebuild formulario');
  const trap = await page.$('#wpforms-12-field_3');
  if (trap) await trap.evaluate((el) => { el.value = ''; });
  const capture = page.waitForResponse(
    (r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST',
    { timeout: 30000 }
  );
  await page.click('#wpforms-submit-12');
  const res = await capture;
  const body = await res.text().catch(() => '');
  return {
    status: res.status(),
    ok: res.ok(),
    success: body.includes('"success":true'),
    bodyPreview: body.slice(0, 800),
  };
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/post.php?post=21&action=edit`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (admin.url().includes('wp-login')) {
  console.error('SESSION_EXPIRED');
  process.exit(3);
}
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const result = { at: new Date().toISOString(), import: null, save: null, submit: null };

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-builder&view=fields&form_id=12`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await dismissAdminOverlays(admin);
await admin.waitForTimeout(5000);

result.save = await admin.evaluate(async (formData) => {
  const nonce =
    window.wpforms_builder?.nonce ||
    document.querySelector('#wpforms-builder-form input[name="_wpnonce"]')?.value ||
    window.wpforms?.nonce ||
    '';
  const body = new URLSearchParams();
  body.set('action', 'wpforms_save_form');
  body.set('id', '12');
  body.set('title', formData.settings.form_title || 'Formulário de Contato Simples');
  body.set('form', JSON.stringify(formData));
  if (nonce) body.set('nonce', nonce);
  const res = await fetch(window.ajaxurl, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: body.toString(),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, json, nonceUsed: !!nonce };
}, formJson);

await admin.waitForTimeout(2000);
result.submit = await submitForm(front).catch((e) => ({ error: String(e.message || e) }));

const outPath = path.join(dir, 'wpforms-rebuild-result.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('REBUILD', JSON.stringify({ save: result.save, submit: result.submit }, null, 2));
await browser.close();
process.exit(result.submit?.success ? 0 : 1);
