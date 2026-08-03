/**
 * Instala LiteSpeed Cache, purga tudo e verifica a home pública.
 * Uso: node run-install-lscache-purge.mjs
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
const outPath = path.join(dir, 'lscache-purge-result.json');

const browser = await pw.chromium.launch({ headless: false });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : {}
);
const page = await context.newPage();
page.on('dialog', (d) => d.accept());

const result = { at: new Date().toISOString(), steps: {} };

await page.goto(`${ORIGIN}/wp-admin/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
if (page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN');
  await browser.close();
  process.exit(2);
}

await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const pluginSlug = 'litespeed-cache/litespeed-cache.php';
const activeRow = page.locator(`tr[data-plugin="${pluginSlug}"].active`);

if (!(await activeRow.count())) {
  await page.goto(`${ORIGIN}/wp-admin/plugin-install.php?s=litespeed+cache&tab=search`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  const installBtn = page.locator('[data-slug="litespeed-cache"] .install-now, .plugin-card-litespeed-cache .install-now');
  if (await installBtn.count()) {
    await installBtn.first().click({ timeout: 15000 });
    await page.waitForTimeout(8000);
    result.steps.install = { ok: true };
  } else {
    const activateLink = page.locator('a[href*="action=activate"][href*="litespeed-cache"]');
    if (await activateLink.count()) {
      await activateLink.first().click({ timeout: 10000 });
      await page.waitForTimeout(3000);
      result.steps.install = { ok: true, wasInstalled: true };
    } else {
      result.steps.install = { ok: false, reason: 'install button not found' };
    }
  }

  await page.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
  const activate = page.locator(`tr[data-plugin="${pluginSlug}"] .activate a`);
  if (await activate.count()) {
    await activate.first().click({ timeout: 10000 });
    await page.waitForTimeout(3000);
    result.steps.activate = { ok: true };
  }
} else {
  result.steps.install = { ok: true, alreadyActive: true };
}

await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

result.steps.purgeApi = await page.evaluate(async () => {
  try {
    await wp.apiFetch({ path: '/litespeed/v1/tool/purge_all', method: 'GET' });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
});

await page.goto(`${ORIGIN}/wp-admin/admin.php?page=litespeed-toolbox`, {
  waitUntil: 'domcontentloaded',
  timeout: 90000,
}).catch(() => {});

const purgeBtn = page.getByRole('button', { name: /purge all|limpar tudo|purge everything/i });
const purgeLink = page.getByRole('link', { name: /purge all|limpar tudo|purge everything/i });
if (await purgeBtn.count()) {
  await purgeBtn.first().click({ timeout: 10000 });
  result.steps.purgeUi = { ok: true, via: 'button' };
} else if (await purgeLink.count()) {
  await purgeLink.first().click({ timeout: 10000 });
  result.steps.purgeUi = { ok: true, via: 'link' };
} else {
  result.steps.purgeUi = { ok: false, url: page.url() };
}

await page.waitForTimeout(4000);

result.verify = {};
for (const url of [`${ORIGIN}/`, `${ORIGIN}/?v=${Date.now()}`]) {
  const res = await page.request.get(url, {
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  const html = await res.text();
  result.verify[url] = {
    hasPanel: html.includes('as-regulatory-panel'),
    hasOld: html.includes('Conformidade não pode depender'),
    xCache: res.headers()['x-cache'],
    len: html.length,
  };
}

fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('LSCACHE_PURGE', JSON.stringify(result));
await browser.close();
