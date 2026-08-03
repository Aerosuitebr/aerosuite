/**
 * Instala/ativa aerosuite-perf (preloads, CSS defer, cache headers).
 * Uso: node run-aerosuite-perf-install.mjs
 */
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

const seoBuild = spawnSync(process.execPath, ['build-seo-php.mjs'], { cwd: dir, stdio: 'inherit' });
if (seoBuild.status !== 0) {
  console.error('build-seo-php failed');
  process.exit(seoBuild.status || 1);
}

if (process.platform === 'win32') {
  spawnSync(
    'powershell',
    ['-NoProfile', '-Command', `Compress-Archive -Path "${pluginDir}\\*" -DestinationPath "${zipPath}" -Force`],
    { stdio: 'inherit' }
  );
} else {
  spawnSync('zip', ['-j', zipPath, path.join(pluginDir, 'aerosuite-performance.php')], { stdio: 'inherit' });
}

const browser = await pw.chromium.launch({ headless: false });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : {}
);
const admin = await context.newPage();
admin.on('dialog', (d) => d.accept());

await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

const loginWaitMs = 180000;
const started = Date.now();
while (admin.url().includes('wp-login') && Date.now() - started < loginWaitMs) {
  process.stderr.write(`Aguardando login wp-admin (${Math.round((Date.now() - started) / 1000)}s)...\r`);
  await admin.waitForTimeout(2000);
}

if (admin.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN');
  await browser.close();
  process.exit(2);
}

await context.storageState({ path: storage });

await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
for (const legacy of ['aerosuite-perf/aerosuite-perf.php', PLUGIN_FILE]) {
  const legacyRow = admin.locator(`tr[data-plugin="${legacy}"]`);
  if (!(await legacyRow.count())) continue;
  await legacyRow.locator('.deactivate a').click({ timeout: 5000 }).catch(() => {});
  await admin.waitForTimeout(800);
  await legacyRow.locator('.delete a').click({ timeout: 5000 }).catch(() => {});
  await admin.waitForTimeout(1500);
}

await admin.goto(`${ORIGIN}/wp-admin/plugin-install.php?tab=upload`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await admin.evaluate(() =>
  document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove())
);
await admin.locator('input[type="file"]').setInputFiles(zipPath);
await admin.evaluate(() => document.querySelector('#install-plugin-submit')?.click());
await admin.waitForTimeout(4000);

const replaceLink = admin.locator('a.update-from-upload-overwrite');
if (await replaceLink.count()) {
  await replaceLink.click({ timeout: 8000 });
  await admin.waitForTimeout(5000);
} else {
  await admin.waitForTimeout(3000);
}

await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
const installed = admin.locator(`tr[data-plugin="${PLUGIN_FILE}"]`);
if (await installed.count()) {
  const activate = installed.locator('.activate a');
  if (await activate.count()) {
    await activate.click({ timeout: 8000 });
    await admin.waitForTimeout(2000);
  }
}

const active = await admin.locator(`tr[data-plugin="${PLUGIN_FILE}"].active`).count();
const result = { ok: active > 0, plugin: PLUGIN_FILE, at: new Date().toISOString() };
fs.writeFileSync(path.join(dir, 'aerosuite-perf-install.json'), JSON.stringify(result, null, 2));
console.log('PERF_PLUGIN', JSON.stringify(result));
await browser.close();
