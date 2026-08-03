/**
 * Envia e-mails de autorização portfólio (Bellows + King) via WP Mail SMTP.
 * Destinos padrão: timmaia@bellowscontrols.com.br, timmaia@kingdorio.com
 * Cc: wellemlyra@gmail.com
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
const pluginFile = 'aerosuite-send-auth-emails/aerosuite-send-auth-emails.php';
const zipPath = path.join(dir, 'aerosuite-send-auth-emails.zip');
const pluginDir = path.join(dir, 'plugins', 'aerosuite-send-auth-emails');
const storagePath = path.join(dir, 'wp-storage.json');
const outPath = path.join(dir, 'portfolio-auth-emails-result.json');

function zipPlugin() {
  if (process.platform === 'win32') {
    spawnSync(
      'powershell',
      ['-NoProfile', '-Command', `Compress-Archive -Path "${pluginDir}\\*" -DestinationPath "${zipPath}" -Force`],
      { stdio: 'inherit' },
    );
  } else {
    spawnSync('zip', ['-rj', zipPath, path.join(pluginDir, 'aerosuite-send-auth-emails.php')], { stdio: 'inherit' });
  }
}

async function sendPortfolioEmails(admin) {
  admin.on('dialog', (d) => d.accept());
  await admin.goto(`${ORIGIN}/wp-admin/plugin-install.php?tab=upload`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await admin.evaluate(() =>
    document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()),
  );
  await admin.locator('input[type="file"]').setInputFiles(zipPath);
  await admin.evaluate(() => document.querySelector('#install-plugin-submit')?.click());
  await admin.waitForTimeout(7000);

  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
  const row = admin.locator(`tr[data-plugin="${pluginFile}"]`);

  if ((await row.count()) > 0) {
    const isActive = await row.locator('.deactivate').count();
    if (isActive) {
      await row.locator('.deactivate a').click({ timeout: 8000 }).catch(() => {});
      await admin.waitForTimeout(1500);
    }
    await row.locator('.delete a').click({ timeout: 8000 }).catch(() => {});
    await admin.waitForTimeout(2000);
  }

  await admin.goto(`${ORIGIN}/wp-admin/plugin-install.php?tab=upload`, { waitUntil: 'domcontentloaded' });
  await admin.locator('input[type="file"]').setInputFiles(zipPath);
  await admin.evaluate(() => document.querySelector('#install-plugin-submit')?.click());
  await admin.waitForTimeout(7000);

  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
  await admin.locator(`tr[data-plugin="${pluginFile}"] .activate a`).click({ timeout: 10000 });
  await admin.waitForTimeout(4000);

  const statusRes = await admin
    .goto(`${ORIGIN}/wp-admin/?aerosuite_auth_status=1`, { waitUntil: 'domcontentloaded' })
    .catch(() => null);
  let sent = null;
  if (statusRes?.ok()) {
    try {
      sent = JSON.parse(await statusRes.text());
    } catch {
      sent = { raw: (await statusRes.text()).slice(0, 500) };
    }
  }

  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
  await admin.locator(`tr[data-plugin="${pluginFile}"] .deactivate a`).click({ timeout: 5000 }).catch(() => {});
  await admin.waitForTimeout(800);

  return sent;
}

async function main() {
  if (!fs.existsSync(storagePath)) {
    console.error('AUTH_EMAILS_FAIL missing wp-storage.json');
    process.exit(1);
  }

  zipPlugin();

  const browser = await pw.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: storagePath });
  const admin = await ctx.newPage();

  const result = {
    at: new Date().toISOString(),
    targets: {
      bellows: 'timmaia@bellowscontrols.com.br',
      king: 'timmaia@kingdorio.com',
      cc: 'wellemlyra@gmail.com',
    },
    sent: await sendPortfolioEmails(admin),
  };

  await browser.close();
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  const ok =
    Array.isArray(result.sent?.sent) && result.sent.sent.every((r) => r.ok === true);
  console.log(ok ? 'AUTH_EMAILS_OK' : 'AUTH_EMAILS_WARN', JSON.stringify(result.sent));
  process.exit(ok ? 0 : 2);
}

main().catch((e) => {
  console.error('AUTH_EMAILS_FAIL', e.message);
  process.exit(1);
});
