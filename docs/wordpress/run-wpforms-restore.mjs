/**
 * Restaura /contato/ para form #12, importa JSON limpo e testa envio.
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
const FORM_ID = '12';
const PAGE_ID = 18;
const jsonPath = path.join(dir, 'aerosuite-wpforms-form12.json');
const formJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-tools&view=import`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await admin.evaluate(() =>
  document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove())
);

const importResult = await admin.evaluate(
  async ({ formJson, formId }) => {
    const body = new URLSearchParams();
    body.set('action', 'wpforms_import_form');
    body.set('form', JSON.stringify(formJson));
    body.set('overwrite', formId);
    const res = await fetch(window.ajaxurl, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body.toString(),
    });
    const text = await res.text();
    try {
      return { status: res.status, json: JSON.parse(text) };
    } catch {
      return { status: res.status, raw: text.slice(0, 800) };
    }
  },
  { formJson, formId: FORM_ID }
);

await admin.goto(`${ORIGIN}/wp-admin/post.php?post=${PAGE_ID}&action=edit`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const pageUpdate = await admin.evaluate(
  async ({ pageId, formId }) => {
    const p = await wp.apiFetch({ path: `/wp/v2/pages/${pageId}?context=edit` });
    let content = p.content?.raw || '';
    content = content
      .replace(/\[wpforms id="\d+"\]/g, `[wpforms id="${formId}"]`)
      .replace(/<!-- wp:wpforms\/form \{"formId":"\d+"\} \/-->/g, `<!-- wp:wpforms/form {"formId":"${formId}"} /-->`);
    const updated = await wp.apiFetch({
      path: `/wp/v2/pages/${pageId}`,
      method: 'POST',
      data: { content, title: p.title?.raw || p.title?.rendered },
    });
    return { id: updated.id, modified: updated.modified, has12: content.includes(`id="${formId}"`) };
  },
  { pageId: PAGE_ID, formId: FORM_ID }
);

await front.goto(`${ORIGIN}/contato/?v=${Date.now()}`, { waitUntil: 'networkidle', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});

const visible = await front.waitForSelector(`#wpforms-form-${FORM_ID}`, { timeout: 60000 }).then(() => true).catch(() => false);

let submit = { skipped: !visible };
if (visible) {
  await front.fill(`#wpforms-${FORM_ID}-field_1`, 'Restore Test');
  await front.fill(`#wpforms-${FORM_ID}-field_2`, `restore.${Date.now()}@aerosuite.com.br`);
  await front.fill(`#wpforms-${FORM_ID}-field_5`, 'Aero Suite');
  await front.fill(`#wpforms-${FORM_ID}-field_8`, 'Teste pos-import form 12');
  const trap = await front.$(`#wpforms-${FORM_ID}-field_3`);
  if (trap) await trap.evaluate((el) => { el.value = ''; });

  const [res] = await Promise.all([
    front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
    front.click(`#wpforms-submit-${FORM_ID}`),
  ]);
  const body = await res.text();
  submit = {
    status: res.status(),
    success: body.includes('"success":true'),
    body: body.slice(0, 1000),
  };
}

const out = { importResult, pageUpdate, visible, submit };
fs.writeFileSync(path.join(dir, 'wpforms-restore-result.json'), JSON.stringify(out, null, 2));
console.log('RESTORE', JSON.stringify(out, null, 2));
await browser.close();
process.exit(submit.success ? 0 : 1);
