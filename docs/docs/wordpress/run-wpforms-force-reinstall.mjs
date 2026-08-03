/** Força delete + upload do aerosuite-wpforms-fix */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const ORIGIN = 'https://aerosuite.com.br';
const PLUGIN_SLUG = 'aerosuite-wpforms-fix';
const zipPath = path.join(dir, 'aerosuite-wpforms-fix.zip');
const pluginDir = path.join(dir, 'plugins', 'aerosuite-wpforms-fix');

spawnSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path "${pluginDir}\\*" -DestinationPath "${zipPath}" -Force`], { stdio: 'inherit' });

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));

const row = admin.locator(`tr[data-plugin="${PLUGIN_SLUG}/${PLUGIN_SLUG}.php"]`);
if (await row.count()) {
  await row.locator('.deactivate a').click({ timeout: 5000 }).catch(() => {});
  await admin.waitForTimeout(2000);
  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
  await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));
  const del = admin.locator(`tr.inactive[data-plugin="${PLUGIN_SLUG}/${PLUGIN_SLUG}.php"] .delete a`);
  if (await del.count()) {
    admin.once('dialog', (d) => d.accept());
    await del.click();
    await admin.waitForTimeout(3000);
  }
}

await admin.goto(`${ORIGIN}/wp-admin/plugin-install.php?tab=upload`, { waitUntil: 'domcontentloaded' });
await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));
await admin.locator('input[type="file"]').setInputFiles(zipPath);
await admin.evaluate(() => document.querySelector('#install-plugin-submit')?.click());
await admin.waitForTimeout(8000);
await admin.evaluate(() => {
  document.querySelector('a[href*="action=activate"][href*="aerosuite-wpforms-fix"]')?.click();
});
await admin.waitForTimeout(3000);

const version = await admin.evaluate((slug) => {
  const row = document.querySelector(`tr[data-plugin="${slug}/${slug}.php"]`);
  return row?.querySelector('.plugin-version-author-uri')?.textContent?.trim() || row?.innerText?.slice(0, 200);
}, PLUGIN_SLUG);

console.log('FORCE_REINSTALL', JSON.stringify({ url: admin.url(), version }, null, 2));
await browser.close();
