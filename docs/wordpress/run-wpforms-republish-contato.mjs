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

await admin.goto(`${ORIGIN}/wp-admin/post.php?post=18&action=edit`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.evaluate(() =>
  document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove())
);

// Gutenberg save/update
const saved = await admin.evaluate(async () => {
  if (typeof wp?.data?.dispatch === 'function') {
    wp.data.dispatch('core/editor').savePost();
    return 'dispatched_savePost';
  }
  const btn = document.querySelector('.editor-post-publish-button, .editor-post-save-draft, button[aria-label="Atualizar"]');
  if (btn) {
    btn.click();
    return 'clicked_button';
  }
  return 'no_save';
});

await admin.waitForTimeout(8000);

await front.goto(`${ORIGIN}/contato/?nocache=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
const tokens = await front.evaluate(() => {
  const html = document.documentElement.outerHTML;
  const pick = (h) => h.match(/name="wpforms\[token\]" value="([^"]+)"/)?.[1] || null;
  return {
    contato: pick(html),
    contatoField1Type: html.match(/data-field-id="1"[^>]*data-field-type="([^"]+)"/)?.[1] || null,
  };
});
await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });

const liveToken = await front.$eval('[name="wpforms[token]"]', (el) => el.value).catch(() => null);
const fieldIds = await front.evaluate(() =>
  [...document.querySelectorAll('.wpforms-field')].map((w) => w.getAttribute('data-field-id'))
);

await front.fill('#wpforms-12-field_1', 'Republish Test');
await front.fill('#wpforms-12-field_2', `repub.${Date.now()}@aerosuite.com.br`);
await front.fill('#wpforms-12-field_8', 'Teste pos republicar pagina');
await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});

const [res] = await Promise.all([
  front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  front.click('#wpforms-submit-12'),
]);
const body = await res.text();

console.log(JSON.stringify({
  saved,
  tokens,
  liveToken,
  fieldIds,
  submit: { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 500) },
}, null, 2));

await browser.close();
process.exit(body.includes('"success":true') ? 0 : 1);
