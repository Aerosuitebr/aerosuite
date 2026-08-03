import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await context.newPage();
const front = await context.newPage();

// Bust cache: append invisible HTML comment to page 18
await admin.goto(`${ORIGIN}/wp-admin/post.php?post=18&action=edit`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });
const bump = await admin.evaluate(async () => {
  const p = await wp.apiFetch({ path: '/wp/v2/pages/18?context=edit' });
  let content = p.content?.raw || '';
  content = content.replace(/<!-- as-cache-bust \d+ -->/g, '');
  content += `\n<!-- as-cache-bust ${Date.now()} -->`;
  await wp.apiFetch({ path: '/wp/v2/pages/18', method: 'POST', data: { content } });
  return { ok: true };
});

// Test on preview (no page cache)
await front.goto(`${ORIGIN}/?wpforms_form_preview=12`, { waitUntil: 'domcontentloaded', timeout: 120000 });
const fieldIds = await front.evaluate(() =>
  [...document.querySelectorAll('.wpforms-field')].map((w) => w.getAttribute('data-field-id'))
);
await front.fill('#wpforms-12-field_1', 'Preview Test');
await front.fill('#wpforms-12-field_2', `preview.${Date.now()}@aerosuite.com.br`);
await front.fill('#wpforms-12-field_8', 'msg preview');
await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});

const [previewRes] = await Promise.all([
  front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  front.click('#wpforms-submit-12'),
]);
const previewBody = await previewRes.text();

// Test contato after bump
await front.goto(`${ORIGIN}/contato/?v=${Date.now()}`, { waitUntil: 'networkidle', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
const contatoFieldIds = await front.evaluate(() =>
  [...document.querySelectorAll('.wpforms-field')].map((w) => w.getAttribute('data-field-id'))
);
await front.fill('#wpforms-12-field_1', 'Contato Test');
await front.fill('#wpforms-12-field_2', `contato.${Date.now()}@aerosuite.com.br`);
await front.fill('#wpforms-12-field_8', 'msg contato');
await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});

const [contatoRes] = await Promise.all([
  front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  front.click('#wpforms-submit-12'),
]);
const contatoBody = await contatoRes.text();

console.log(JSON.stringify({
  bump,
  preview: { fieldIds, status: previewRes.status(), success: previewBody.includes('"success":true'), body: previewBody.slice(0, 400) },
  contato: { fieldIds: contatoFieldIds, status: contatoRes.status(), success: contatoBody.includes('"success":true'), body: contatoBody.slice(0, 400) },
}, null, 2));

await browser.close();
process.exit(previewBody.includes('"success":true') || contatoBody.includes('"success":true') ? 0 : 1);
