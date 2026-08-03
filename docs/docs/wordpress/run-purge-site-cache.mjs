/**
 * Purga cache LiteSpeed (e similares) via wp-admin após deploy.
 * Uso: node run-purge-site-cache.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const outPath = path.join(dir, 'site-cache-purge-result.json');
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: false });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : {}
);
const page = await context.newPage();
page.on('dialog', (d) => d.accept());

await page.goto(`${ORIGIN}/wp-admin/`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

if (page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN — faça login no wp-admin e rode de novo');
  await browser.close();
  process.exit(2);
}

await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, {
  timeout: 120000,
});

const result = { at: new Date().toISOString(), steps: {} };

const purgeCode = `(async () => {
  const out = {};
  try {
    await wp.apiFetch({ path: '/litespeed/v1/tool/purge_all', method: 'GET' });
    out.litespeedRest = { ok: true };
  } catch (e) {
    out.litespeedRest = { ok: false, error: String(e.message || e) };
  }
  return out;
})()`;
result.steps.api = await page.evaluate(async (code) => eval(code), purgeCode);

const litespeedUrls = [
  `${ORIGIN}/wp-admin/admin.php?page=litespeed-toolbox&LSCWP_CTRL=PURGE_ALL`,
  `${ORIGIN}/wp-admin/admin.php?page=litespeed`,
];
for (const url of litespeedUrls) {
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const purgeBtn = page.getByRole('button', { name: /purge all|limpar tudo|purge everything/i });
    const purgeLink = page.getByRole('link', { name: /purge all|limpar tudo|purge everything/i });
    if (await purgeBtn.count()) {
      await purgeBtn.first().click({ timeout: 8000 });
      result.steps[`ui-${url}`] = { ok: true, via: 'button' };
      break;
    }
    if (await purgeLink.count()) {
      await purgeLink.first().click({ timeout: 8000 });
      result.steps[`ui-${url}`] = { ok: true, via: 'link' };
      break;
    }
    result.steps[`ui-${url}`] = { ok: false, status: res?.status(), reason: 'no purge control' };
  } catch (e) {
    result.steps[`ui-${url}`] = { ok: false, error: String(e.message || e) };
  }
}

const adminBarPurge = page.locator('#wp-admin-bar-litespeed-purge-all a, #wp-admin-bar-litespeed-purge a');
if (await adminBarPurge.count()) {
  await adminBarPurge.first().click({ timeout: 8000 }).catch(() => {});
  result.steps.adminBar = { ok: true };
}

await page.waitForTimeout(2000);

try {
  const home = await page.request.get(`${ORIGIN}/?nocache=${Date.now()}`, {
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  const html = await home.text();
  result.verify = {
    hasPanel: html.includes('as-regulatory-panel'),
    hasAnchor: html.includes('id="prontidao-regulatoria"'),
    hasOld: html.includes('Conformidade não pode depender'),
    xCache: home.headers()['x-cache'],
    cfCache: home.headers()['cf-cache-status'],
  };
} catch (e) {
  result.verify = { error: String(e.message || e) };
}

fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('PURGE_OK', JSON.stringify(result));
await browser.close();
