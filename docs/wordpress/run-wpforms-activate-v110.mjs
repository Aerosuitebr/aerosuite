import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const TARGET = 'aerosuite-wpforms-fix-7/aerosuite-wpforms-fix.php';

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await context.newPage();
const front = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));

const switchPlugin = await admin.evaluate((target) => {
  const rows = [...document.querySelectorAll('tr[data-plugin^="aerosuite-wpforms-fix"]')];
  for (const tr of rows) {
    if (tr.classList.contains('active')) tr.querySelector('.deactivate a')?.click();
  }
  const keep = document.querySelector(`tr[data-plugin="${target}"]`);
  if (!keep) return { ok: false, reason: 'target missing' };
  if (!keep.classList.contains('active')) keep.querySelector('.activate a')?.click();
  return { ok: true, target };
}, TARGET);

await admin.waitForTimeout(4000);
await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
const active = await admin.evaluate(() =>
  [...document.querySelectorAll('tr.active[data-plugin^="aerosuite-wpforms-fix"]')].map((tr) => ({
    plugin: tr.dataset.plugin,
    version: tr.querySelector('.plugin-version-author-uri')?.textContent?.trim(),
  }))
);

await front.goto(`${ORIGIN}/contato/?final=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });
await front.fill('#wpforms-12-field_1', 'Final Test');
await front.fill('#wpforms-12-field_2', `final.${Date.now()}@aerosuite.com.br`);
await front.fill('#wpforms-12-field_8', 'Teste final v1.1.0');
await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});

const [res] = await Promise.all([
  front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  front.click('#wpforms-submit-12'),
]);
const body = await res.text();

console.log(JSON.stringify({ switchPlugin, active, submit: { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 500) } }, null, 2));
await browser.close();
process.exit(body.includes('"success":true') ? 0 : 1);
