/** Trash forms órfãos + remove log público + auditoria */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const ORPHAN = ['323', '325', '327'];

const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await ctx.newPage();

const dismiss = () => admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));

// Trash orphan forms
await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-overview`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await dismiss();
const trashed = [];
for (const id of ORPHAN) {
  const href = await admin.evaluate((formId) => {
    const a = [...document.querySelectorAll('a')].find((x) => x.href.includes(`action=trash&form_id=${formId}`));
    return a?.href || null;
  }, id);
  if (href) {
    await admin.goto(href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    trashed.push(id);
    await admin.waitForTimeout(600);
  }
}

// Upload cleanup plugin
const pluginDir = path.join(dir, 'plugins', 'aerosuite-cleanup-once');
const zipPath = path.join(dir, 'aerosuite-cleanup-once.zip');
if (process.platform === 'win32') {
  spawnSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path "${pluginDir}\\*" -DestinationPath "${zipPath}" -Force`], { stdio: 'inherit' });
}

await admin.goto(`${ORIGIN}/wp-admin/plugin-install.php?tab=upload`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await dismiss();
await admin.locator('input[type="file"]').setInputFiles(zipPath);
await admin.evaluate(() => document.querySelector('#install-plugin-submit')?.click());
await admin.waitForTimeout(6000);

const pluginFile = 'aerosuite-cleanup-once/aerosuite-cleanup-once.php';
await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await dismiss();
await admin.locator(`tr[data-plugin="${pluginFile}"] .activate a`).click({ timeout: 8000 }).catch(() => {});
await admin.waitForTimeout(2000);

// Delete cleanup plugin after activation ran
admin.on('dialog', (d) => d.accept());
await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
await admin.locator(`tr[data-plugin="${pluginFile}"] .deactivate a`).click({ timeout: 5000 }).catch(() => {});
await admin.waitForTimeout(1000);
await admin.locator(`tr[data-plugin="${pluginFile}"] .delete a`).click({ timeout: 5000 }).catch(() => {});
await admin.waitForTimeout(1500);

await browser.close();

const logCheck = await fetch(`${ORIGIN}/wp-content/uploads/aerosuite-wpforms-debug.log?${Date.now()}`);
const logBody = await logCheck.text();

console.log(JSON.stringify({
  trashed,
  debugLog: { status: logCheck.status, public: logCheck.ok, bytes: logBody.length },
}, null, 2));

process.exit(logCheck.ok ? 1 : 0);
