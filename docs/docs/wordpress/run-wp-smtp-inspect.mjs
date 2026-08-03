/**
 * Inspeciona UI WP Mail SMTP + teste AJAX + estado plugins/form.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await ctx.newPage();

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));

const ui = await admin.evaluate(() => {
  const inputs = [...document.querySelectorAll('input, select, textarea')]
    .filter((el) => el.name?.includes('wp-mail-smtp') || el.id?.includes('wp-mail-smtp'))
    .map((el) => ({
      id: el.id,
      name: el.name,
      type: el.type,
      tag: el.tagName,
      value: el.type === 'password' ? `[len=${el.value.length}]` : (el.value || '').slice(0, 80),
      visible: el.offsetParent !== null,
    }));
  return { url: location.href, title: document.title, inputs };
});

// Test email with network capture
await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp-tools&tab=test`, { waitUntil: 'domcontentloaded', timeout: 120000 });
const testInputs = await admin.evaluate(() =>
  [...document.querySelectorAll('input, button')].map((el) => ({ id: el.id, name: el.name, type: el.type, text: el.innerText?.slice(0, 40) }))
);

let ajaxResult = null;
admin.on('response', async (r) => {
  if (r.url().includes('admin-ajax.php') && r.request().method() === 'POST') {
    try {
      ajaxResult = { url: r.url(), status: r.status(), body: (await r.text()).slice(0, 2000) };
    } catch {}
  }
});

await admin.fill('#wp-mail-smtp-test-email', 'contato@aerosuite.com.br').catch(() => {});
await admin.locator('#wp-mail-smtp-test-submit, button.wp-mail-smtp-btn-orange').first().click({ timeout: 8000 }).catch(() => {});
await admin.waitForTimeout(15000);

const testPage = await admin.evaluate(() => ({
  notices: [...document.querySelectorAll('.notice, .wp-mail-smtp-notice, .swal2-popup, .wp-mail-smtp-setting-row-test-email')].map((n) => n.innerText?.slice(0, 500)),
  bodyMatch: document.body.innerText.match(/(success|sent|fail|error|erro|enviado)[^\n]{0,200}/gi)?.slice(0, 5),
}));

await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
const plugins = await admin.evaluate(() =>
  [...document.querySelectorAll('tr[data-plugin*="aerosuite-wpforms-fix"], tr[data-plugin*="wp-mail-smtp"]')].map((tr) => ({
    plugin: tr.getAttribute('data-plugin'),
    active: !!tr.querySelector('.deactivate'),
    text: tr.innerText?.slice(0, 120),
  }))
);

const out = { ui, testInputs, ajaxResult, testPage, plugins };
fs.writeFileSync(path.join(dir, 'wp-smtp-inspect.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
