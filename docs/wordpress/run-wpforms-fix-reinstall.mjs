/** Remove e reinstala aerosuite-wpforms-fix */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const ORIGIN = 'https://aerosuite.com.br';
const PLUGIN = 'aerosuite-wpforms-fix/aerosuite-wpforms-fix.php';
const zipPath = path.join(dir, 'aerosuite-wpforms-fix.zip');
const pluginDir = path.join(dir, 'plugins', 'aerosuite-wpforms-fix');

spawnSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path "${pluginDir}\\*" -DestinationPath "${zipPath}" -Force`], { stdio: 'inherit' });

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
await admin.goto(`${ORIGIN}/wp-admin/post.php?post=21&action=edit`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const del = await admin.evaluate(async (plugin) => {
  try {
    await wp.apiFetch({ path: '/wp/v2/plugins/' + encodeURIComponent(plugin), method: 'DELETE' });
    return { deleted: true };
  } catch (e) {
    try {
      await wp.apiFetch({ path: '/wp/v2/plugins/' + encodeURIComponent(plugin), method: 'POST', data: { status: 'inactive' } });
    } catch (_) {}
    return { deleted: false, error: String(e.message || e) };
  }
}, PLUGIN);

await admin.goto(`${ORIGIN}/wp-admin/plugin-install.php?tab=upload`, { waitUntil: 'domcontentloaded' });
await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e)=>e.remove()));
await admin.locator('input[type="file"]').setInputFiles(zipPath);
await admin.evaluate(() => document.querySelector('#install-plugin-submit')?.click());
await admin.waitForTimeout(8000);
const act = await admin.evaluate(() => {
  const a = document.querySelector('a[href*="action=activate"][href*="aerosuite-wpforms-fix"]');
  if (a) { a.click(); return 'activated'; }
  return 'no_activate_link';
});
await admin.waitForTimeout(2000);
console.log('REINSTALL', JSON.stringify({ del, url: admin.url(), act }));
await browser.close();
