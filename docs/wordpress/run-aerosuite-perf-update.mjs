/** Atualiza plugin aerosuite-performance (headless) e purga cache. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const PLUGIN_FILE = 'aerosuite-performance/aerosuite-performance.php';
const pluginDir = path.join(dir, 'plugins', 'aerosuite-performance');
const zipPath = path.join(dir, 'aerosuite-performance.zip');
const storage = path.join(dir, 'wp-storage.json');

spawnSync(process.execPath, ['build-seo-php.mjs'], { cwd: dir, stdio: 'inherit' });
spawnSync(
  'powershell',
  ['-NoProfile', '-Command', `Compress-Archive -Path "${pluginDir}\\*" -DestinationPath "${zipPath}" -Force`],
  { stdio: 'inherit' },
);

const browser = await pw.chromium.launch({ headless: true });
const admin = await (await browser.newContext({ storageState: storage })).newPage();
admin.on('dialog', (d) => d.accept());

await admin.goto(`${ORIGIN}/wp-admin/plugin-install.php?tab=upload`, { waitUntil: 'domcontentloaded', timeout: 120000 });
if (admin.url().includes('wp-login')) throw new Error('SESSION_EXPIRED');
await admin.locator('input[type="file"]').setInputFiles(zipPath);
await admin.evaluate(() => document.querySelector('#install-plugin-submit')?.click());
await admin.waitForTimeout(5000);
const overwrite = admin.locator('a.update-from-upload-overwrite');
if (await overwrite.count()) {
  await overwrite.click({ timeout: 8000 });
  await admin.waitForTimeout(5000);
}

await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
const row = admin.locator(`tr[data-plugin="${PLUGIN_FILE}"]`);
if (await row.locator('.activate a').count()) {
  await row.locator('.activate a').click({ timeout: 8000 });
  await admin.waitForTimeout(2000);
}

const purge = await admin.evaluate(async () => {
  try {
    await wp.apiFetch({ path: '/litespeed/v1/tool/purge_all', method: 'GET' });
    return { ok: true };
  } catch (e) {
    return { ok: false, err: String(e.message || e) };
  }
});

const active = (await admin.locator(`tr[data-plugin="${PLUGIN_FILE}"].active`).count()) > 0;
console.log(JSON.stringify({ ok: active, purge, version: '1.3.3-seo-indexation' }, null, 2));
await browser.close();
