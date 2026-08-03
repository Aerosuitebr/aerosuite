/**
 * Aponta /contato/ para WPForms importado e testa envio.
 * Uso: node run-wpforms-switch-form.mjs [formId]
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
const FORM_ID = process.argv[2] || '327';

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/post.php?post=21&action=edit`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const page = await admin.evaluate(async (formId) => {
  const p = await wp.apiFetch({ path: '/wp/v2/pages/18?context=edit' });
  const content = (p.content?.raw || p.content?.rendered || '').replace(
    /\[wpforms id=\"12\"\]/g,
    `[wpforms id="${formId}"]`
  ).replace(
    /<!-- wp:wpforms\/form \{"formId":"12"\} \/-->/g,
    `<!-- wp:wpforms/form {"formId":"${formId}"} /-->`
  );
  const updated = await wp.apiFetch({
    path: '/wp/v2/pages/18',
    method: 'POST',
    data: { content },
  });
  return { id: updated.id, hasForm: content.includes(`id="${formId}"`) || content.includes(`formId":"${formId}"`) };
}, FORM_ID);

await front.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 3000 }).catch(() => {});
const selector = `#wpforms-form-${FORM_ID}`;
await front.waitForSelector(selector, { timeout: 45000 });

const fieldMap = await front.evaluate((fid) => {
  const form = document.querySelector(`#wpforms-form-${fid}`);
  return [...form.querySelectorAll('.wpforms-field')].map((w) => ({
    id: w.getAttribute('data-field-id'),
    input: w.querySelector('input,textarea')?.id,
    label: w.querySelector('label')?.textContent?.trim(),
  }));
}, FORM_ID);

await front.fill(`#wpforms-${FORM_ID}-field_1`, 'Switch Test');
await front.fill(`#wpforms-${FORM_ID}-field_2`, `switch.${Date.now()}@aerosuite.com.br`);
await front.fill(`#wpforms-${FORM_ID}-field_5`, 'Aero Suite');
await front.fill(`#wpforms-${FORM_ID}-field_8`, 'Teste form importado');
const trap = await front.$(`#wpforms-${FORM_ID}-field_3`);
if (trap) await trap.evaluate((el) => { el.value = ''; });

const [res] = await Promise.all([
  front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST'),
  front.click(`#wpforms-submit-${FORM_ID}`),
]);
const body = await res.text();
const submit = { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 500) };

const out = { formId: FORM_ID, page, fieldMap, submit };
fs.writeFileSync(path.join(dir, 'wpforms-switch-result.json'), JSON.stringify(out, null, 2));
console.log('SWITCH', JSON.stringify(out, null, 2));
await browser.close();
process.exit(submit.success ? 0 : 1);
