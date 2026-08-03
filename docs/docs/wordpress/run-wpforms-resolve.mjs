/**
 * Resolve WPForms /contato/: aponta para form funcional, purga cache e testa envio.
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
const PAGE_ID = 18;

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/post.php?post=${PAGE_ID}&action=edit`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const pageUpdate = await admin.evaluate(
  async ({ pageId, formId }) => {
    const p = await wp.apiFetch({ path: `/wp/v2/pages/${pageId}?context=edit` });
    let content = p.content?.raw || '';
    const before = content;
    content = content
      .replace(/\[wpforms id="12"\]/g, `[wpforms id="${formId}"]`)
      .replace(/\[wpforms id='12'\]/g, `[wpforms id="${formId}"]`)
      .replace(/<!-- wp:wpforms\/form \{"formId":"12"\} \/-->/g, `<!-- wp:wpforms/form {"formId":"${formId}"} /-->`)
      .replace(/<!-- wp:wpforms\/form \{"formId":12\} \/-->/g, `<!-- wp:wpforms/form {"formId":"${formId}"} /-->`);
    if (content === before) {
      return { changed: false, slug: p.slug, link: p.link, snippet: content.slice(content.indexOf('wpforms'), content.indexOf('wpforms') + 80) };
    }
    const updated = await wp.apiFetch({
      path: `/wp/v2/pages/${pageId}`,
      method: 'POST',
      data: { content },
    });
    return {
      changed: true,
      id: updated.id,
      slug: updated.slug,
      link: updated.link,
      hasForm: content.includes(`id="${formId}"`) || content.includes(`formId":"${formId}"`),
    };
  },
  { pageId: PAGE_ID, formId: FORM_ID }
);

// Bump modified time to invalidate any object cache
await admin.evaluate(async (pageId) => {
  await wp.apiFetch({ path: `/wp/v2/pages/${pageId}`, method: 'POST', data: { meta: { _edit_lock: Date.now() / 1000 } } }).catch(() => {});
}, PAGE_ID);

const liveBefore = await fetch(`${ORIGIN}/contato/?nocache=${Date.now()}`, {
  headers: { 'Cache-Control': 'no-cache' },
}).then((r) => r.text());
const liveFormBefore = [...liveBefore.matchAll(/wpforms-form-(\d+)/g)].map((m) => m[1]);

await front.goto(`${ORIGIN}/contato/?nocache=${Date.now()}`, { waitUntil: 'networkidle', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 3000 }).catch(() => {});

const selector = `#wpforms-form-${FORM_ID}`;
let formVisible = false;
try {
  await front.waitForSelector(selector, { timeout: 20000 });
  formVisible = true;
} catch {
  formVisible = false;
}

let submit = { skipped: true, reason: 'form not on page' };
let fieldMap = [];

if (formVisible) {
  fieldMap = await front.evaluate((fid) => {
    const form = document.querySelector(`#wpforms-form-${fid}`);
    return [...form.querySelectorAll('.wpforms-field')].map((w) => ({
      id: w.getAttribute('data-field-id'),
      input: w.querySelector('input,textarea')?.id,
      type: w.querySelector('input,textarea')?.type || w.querySelector('textarea')?.tagName,
      label: w.querySelector('label')?.textContent?.trim(),
    }));
  }, FORM_ID);

  const nameInput = fieldMap.find((f) => f.label?.includes('Nome') || f.id === '1')?.input;
  const emailInput = fieldMap.find((f) => f.label?.includes('mail') || f.id === '2')?.input;
  const empresaInput = fieldMap.find((f) => f.label?.includes('Empresa') || f.id === '5')?.input;
  const msgInput = fieldMap.find((f) => f.label?.includes('Mensagem') || f.id === '8')?.input;

  if (nameInput) await front.fill(`#${nameInput}`, 'Resolve Test');
  if (emailInput) await front.fill(`#${emailInput}`, `resolve.${Date.now()}@aerosuite.com.br`);
  if (empresaInput) await front.fill(`#${empresaInput}`, 'Aero Suite');
  if (msgInput) await front.fill(`#${msgInput}`, 'Teste automatizado form importado');

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
    body: body.slice(0, 800),
  };
} else {
  // Fallback: test form 12 if still cached
  const alt = `#wpforms-form-12`;
  if (await front.$(alt)) {
    await front.fill('#wpforms-12-field_1', 'Resolve Test');
    await front.fill('#wpforms-12-field_2', `resolve.${Date.now()}@aerosuite.com.br`);
    await front.fill('#wpforms-12-field_5', 'Aero Suite');
    await front.fill('#wpforms-12-field_8', 'Teste form 12 fallback');
    const trap = await front.$('#wpforms-12-field_3');
    if (trap) await trap.evaluate((el) => { el.value = ''; });
    const [res] = await Promise.all([
      front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
      front.click('#wpforms-submit-12'),
    ]);
    const body = await res.text();
    submit = {
      fallbackForm12: true,
      status: res.status(),
      success: body.includes('"success":true'),
      body: body.slice(0, 800),
    };
  }
}

const out = { formId: FORM_ID, pageUpdate, liveFormBefore, formVisible, fieldMap, submit };
fs.writeFileSync(path.join(dir, 'wpforms-resolve-result.json'), JSON.stringify(out, null, 2));
console.log('RESOLVE', JSON.stringify(out, null, 2));
await browser.close();
process.exit(submit.success ? 0 : 1);
