/**
 * Salva form #12 via wpforms_save_form com JSON limpo (campo Nome = text).
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

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-builder&view=fields&form_id=12`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await admin.evaluate(() =>
  document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove())
);
await admin.waitForFunction(() => !!window.wpforms_builder?.nonce || !!window.wpforms?.nonce, null, { timeout: 60000 });

const before = await admin.evaluate(() => {
  const fields = window.wpforms_builder?.form?.fields;
  return fields
    ? Object.values(fields).map((f) => ({ id: f.id, type: f.type, label: f.label, required: f.required }))
    : null;
});

const save = await admin.evaluate(async (formData) => {
  const nonce =
    window.wpforms_builder?.nonce ||
    document.querySelector('#wpforms-builder-form input[name="_wpnonce"]')?.value ||
    window.wpforms?.nonce ||
    '';
  const body = new URLSearchParams();
  body.set('action', 'wpforms_save_form');
  body.set('id', '12');
  body.set('title', formData.settings?.form_title || 'Formulário de Contato Simples');
  body.set('form', JSON.stringify(formData));
  if (nonce) body.set('nonce', nonce);
  const res = await fetch(window.ajaxurl, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: body.toString(),
  });
  const text = await res.text();
  try {
    return { status: res.status, json: JSON.parse(text), nonceUsed: !!nonce };
  } catch {
    return { status: res.status, raw: text.slice(0, 800), nonceUsed: !!nonce };
  }
}, formJson);

await admin.waitForTimeout(2000);

const after = await admin.evaluate(() => {
  const fields = window.wpforms_builder?.form?.fields;
  return fields
    ? Object.values(fields).map((f) => ({ id: f.id, type: f.type, label: f.label, required: f.required }))
    : null;
});

await front.goto(`${ORIGIN}/?wpforms_form_preview=12`, { waitUntil: 'domcontentloaded', timeout: 120000 });
const previewType = await front.evaluate(() =>
  document.querySelector('[data-field-id="1"]')?.getAttribute('data-field-type')
);

await front.goto(`${ORIGIN}/contato/?v=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });
await front.fill('#wpforms-12-field_1', 'Save Test');
await front.fill('#wpforms-12-field_2', `save.${Date.now()}@aerosuite.com.br`);
await front.fill('#wpforms-12-field_8', 'Teste pos-save');
await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});

const [res] = await Promise.all([
  front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  front.click('#wpforms-submit-12'),
]);
const body = await res.text();
const submit = { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 800) };

const out = { before, save, after, previewType, submit };
fs.writeFileSync(path.join(dir, 'wpforms-save-result.json'), JSON.stringify(out, null, 2));
console.log('SAVE', JSON.stringify(out, null, 2));
await browser.close();
process.exit(submit.success ? 0 : 1);
