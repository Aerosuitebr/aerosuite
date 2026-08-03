import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const ORIGIN = 'https://aerosuite.com.br';
const KEEP = new Set(['wpforms-lite/wpforms', 'aerosuite-wpforms-fix/aerosuite-wpforms-fix.php']);

async function submit(page) {
  await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.click('#as-consent-accept-all', { timeout: 3000 }).catch(() => {});
  await page.waitForSelector('#wpforms-form-12');
  await page.fill('#wpforms-12-field_1', 'Nuclear Test');
  await page.fill('#wpforms-12-field_2', `nuclear.${Date.now()}@aerosuite.com.br`);
  await page.fill('#wpforms-12-field_8', 'msg');
  const trap = await page.$('#wpforms-12-field_3');
  if (trap) await trap.evaluate((el) => { el.value = ''; });
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST'),
    page.click('#wpforms-submit-12'),
  ]);
  const body = await res.text();
  return { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 300) };
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();
await admin.goto(`${ORIGIN}/wp-admin/post.php?post=21&action=edit`, { waitUntil: 'domcontentloaded' });
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const plugins = await admin.evaluate(async () => {
  const all = await wp.apiFetch({ path: '/wp/v2/plugins?context=edit&per_page=100' });
  return all.filter((p) => p.status === 'active').map((p) => p.plugin);
});

const deactivated = [];
for (const plugin of plugins) {
  if (KEEP.has(plugin)) continue;
  await admin.evaluate(async (p) => {
    await wp.apiFetch({ path: '/wp/v2/plugins/' + encodeURIComponent(p), method: 'POST', data: { status: 'inactive' } });
  }, plugin);
  deactivated.push(plugin);
}
await admin.waitForTimeout(2000);
const result = await submit(front);
for (const plugin of deactivated) {
  await admin.evaluate(async (p) => {
    await wp.apiFetch({ path: '/wp/v2/plugins/' + encodeURIComponent(p), method: 'POST', data: { status: 'active' } });
  }, plugin);
}
console.log(JSON.stringify({ deactivated: deactivated.length, result }, null, 2));
await browser.close();
