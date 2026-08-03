import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const ORIGIN = 'https://aerosuite.com.br';

async function submit(page) {
  await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.click('#as-consent-accept-all', { timeout: 3000 }).catch(() => {});
  await page.waitForSelector('#wpforms-form-12');
  await page.fill('#wpforms-12-field_1', 'Teste TRP');
  await page.fill('#wpforms-12-field_2', `trp.${Date.now()}@aerosuite.com.br`);
  await page.fill('#wpforms-12-field_8', 'msg');
  const trap = await page.$('#wpforms-12-field_3');
  if (trap) await trap.evaluate((el) => { el.value = ''; });
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST'),
    page.click('#wpforms-submit-12'),
  ]);
  const body = await res.text();
  return { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 250) };
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();
await admin.goto(`${ORIGIN}/wp-admin/post.php?post=21&action=edit`, { waitUntil: 'domcontentloaded' });
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const baseline = await submit(front);
await admin.evaluate(async () => {
  await wp.apiFetch({ path: '/wp/v2/plugins/' + encodeURIComponent('translatepress-multilingual/index'), method: 'POST', data: { status: 'inactive' } });
});
await admin.waitForTimeout(2000);
const trpOff = await submit(front);
await admin.evaluate(async () => {
  await wp.apiFetch({ path: '/wp/v2/plugins/' + encodeURIComponent('translatepress-multilingual/index'), method: 'POST', data: { status: 'active' } });
});
console.log(JSON.stringify({ baseline, trpOff }, null, 2));
await browser.close();
