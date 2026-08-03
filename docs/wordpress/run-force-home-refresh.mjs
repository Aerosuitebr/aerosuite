/**
 * Verifica conteúdo da home no WP, força purge de cache e confirma versão pública.
 * Uso: node run-force-home-refresh.mjs
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
const HOME_ID = 21;
const outPath = path.join(dir, 'force-home-refresh-result.json');

const adminCode = `(async () => {
  const result = { at: new Date().toISOString(), steps: {} };

  const page = await wp.apiFetch({
    path: '/wp/v2/pages/${HOME_ID}?context=edit',
  });
  const raw = page.content?.raw || '';
  result.steps.wpDb = {
    len: raw.length,
    hasPanel: raw.includes('as-regulatory-panel'),
    hasAnchor: raw.includes('id="prontidao-regulatoria"'),
    hasOld: raw.includes('Conformidade não pode depender'),
  };

  async function tryPurge(url, label) {
    try {
      const res = await fetch(url, { credentials: 'include', redirect: 'follow' });
      return { ok: res.ok, status: res.status, url: label };
    } catch (e) {
      return { ok: false, error: String(e.message || e), url: label };
    }
  }

  result.steps.purges = [];
  const purgeUrls = [
    ['litespeed-toolbox', 'https://aerosuite.com.br/wp-admin/admin.php?page=litespeed-toolbox&LSCWP_CTRL=PURGE_ALL'],
    ['litespeed', 'https://aerosuite.com.br/wp-admin/admin.php?page=litespeed&LSCWP_CTRL=PURGE_ALL'],
    ['hostinger-tools', 'https://aerosuite.com.br/wp-admin/admin.php?page=hostinger-tools'],
    ['public-lsc', 'https://aerosuite.com.br/?LSCWP_CTRL=PURGE_ALL'],
  ];
  for (const [label, url] of purgeUrls) {
    result.steps.purges.push({ label, ...(await tryPurge(url, label)) });
  }

  try {
    await wp.apiFetch({ path: '/wp/v2/pages/${HOME_ID}', method: 'POST', data: { status: 'publish' } });
    result.steps.republish = { ok: true };
  } catch (e) {
    result.steps.republish = { ok: false, error: String(e.message || e) };
  }

  return result;
})()`;

const browser = await pw.chromium.launch({ headless: false });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : {}
);
const page = await context.newPage();
page.on('dialog', (d) => d.accept());

await page.goto(`${ORIGIN}/wp-admin/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
if (page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN');
  await browser.close();
  process.exit(2);
}

await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });
const adminResult = await page.evaluate(async (code) => eval(code), adminCode);

for (const label of ['hostinger-tools', 'litespeed', 'LiteSpeed', 'Cache', 'Limpar']) {
  const link = page.getByRole('link', { name: new RegExp(label, 'i') });
  if (await link.count()) {
    adminResult.steps.foundMenu = label;
    break;
  }
}

await page.goto(`${ORIGIN}/wp-admin/admin.php?page=hostinger`, {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
}).catch(() => {});

const hostingerPurge = page.getByRole('button', { name: /clear cache|limpar cache|purge/i });
if (await hostingerPurge.count()) {
  await hostingerPurge.first().click({ timeout: 8000 }).catch(() => {});
  adminResult.steps.hostingerPurgeClick = true;
  await page.waitForTimeout(3000);
}

const verify = {};
for (const url of [`${ORIGIN}/`, `${ORIGIN}/?nocache=${Date.now()}`]) {
  const res = await page.request.get(url, {
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  const html = await res.text();
  verify[url] = {
    hasPanel: html.includes('as-regulatory-panel'),
    hasOld: html.includes('Conformidade não pode depender'),
    xCache: res.headers()['x-cache'],
    len: html.length,
  };
}

const result = { ...adminResult, verify };
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('REFRESH_OK', JSON.stringify(result, null, 2));
await browser.close();
