/**
 * Envia Guia de Produção do Vídeo Promocional via WP Mail SMTP.
 *
 * Uso (na raiz do repo):
 *   node scripts/build-video-promo-guia-pdf.mjs
 *   node docs/wordpress/run-send-video-promo-guia-email.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');

const wpDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(wpDir, '../..');
const ORIGIN = 'https://aerosuite.com.br';
const pluginSlug = 'aerosuite-send-video-promo-guia-email';
const pluginDir = path.join(wpDir, 'plugins', pluginSlug);
const zipPath = path.join(wpDir, `${pluginSlug}.zip`);
const storagePath = path.join(wpDir, 'wp-storage.json');
const outPath = path.join(wpDir, 'video-promo-guia-email-result.json');

const pdfSrc = path.join(repoRoot, 'manuals/Guia_Video_Promocional_AeroSuite.pdf');

function preparePluginBundle() {
  if (!fs.existsSync(pdfSrc)) {
    throw new Error(`PDF ausente. Rode: node scripts/build-video-promo-guia-pdf.mjs (${pdfSrc})`);
  }
  fs.copyFileSync(pdfSrc, path.join(pluginDir, 'Guia_Video_Promocional_AeroSuite.pdf'));
}

function zipPlugin() {
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  if (process.platform === 'win32') {
    spawnSync(
      'powershell',
      ['-NoProfile', '-Command', `Compress-Archive -Path "${pluginDir}\\*" -DestinationPath "${zipPath}" -Force`],
      { stdio: 'inherit' },
    );
  } else {
    spawnSync('zip', ['-rj', zipPath, path.join(pluginDir, pluginSlug + '.php')], { stdio: 'inherit' });
  }
}

async function findPluginRow(admin) {
  const plugins = await admin.evaluate(
    (slug) =>
      [...document.querySelectorAll(`tr[data-plugin*="${slug}"]`)].map((tr) => ({
        plugin: tr.getAttribute('data-plugin'),
        active: !!tr.querySelector('.deactivate a'),
      })),
    pluginSlug,
  );
  const pick = plugins.sort((a, b) => a.plugin.localeCompare(b.plugin))[0];
  if (!pick?.plugin) return admin.locator('tr[data-plugin="__none__"]');
  return admin.locator(`tr[data-plugin="${pick.plugin}"]`);
}

async function purgePlugins(admin) {
  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await admin.evaluate(() =>
    document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()),
  );
  for (let i = 0; i < 12; i++) {
    const plugins = await admin.evaluate(
      (slug) =>
        [...document.querySelectorAll(`tr[data-plugin*="${slug}"]`)].map((tr) => ({
          plugin: tr.getAttribute('data-plugin'),
          active: !!tr.querySelector('.deactivate a'),
        })),
      pluginSlug,
    );
    if (plugins.length === 0) break;
    const target = plugins[0];
    const row = admin.locator(`tr[data-plugin="${target.plugin}"]`);
    if (target.active) {
      await row.locator('.deactivate a').click({ timeout: 8000 }).catch(() => {});
      await admin.waitForTimeout(1000);
    }
    await row.locator('.delete a').click({ timeout: 8000 }).catch(() => {});
    await admin.waitForTimeout(2000);
    await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
  }
}

async function activatePluginOnce(admin) {
  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const row = await findPluginRow(admin);
  if ((await row.count()) === 0) throw new Error('Plugin video promo guia não encontrado após upload');
  const activate = row.locator('.activate a');
  if ((await activate.count()) > 0) {
    await Promise.all([
      admin.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {}),
      activate.click({ timeout: 15000, noWaitAfter: true }),
    ]);
  } else {
    await row.locator('.deactivate a').click({ timeout: 8000, noWaitAfter: true }).catch(() => {});
    await admin.waitForTimeout(1500);
    await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
    await Promise.all([
      admin.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {}),
      row.locator('.activate a').click({ timeout: 15000, noWaitAfter: true }),
    ]);
  }
  await admin.waitForTimeout(8000);
}

async function sendViaWordPress(admin) {
  admin.on('dialog', (d) => d.accept());
  await purgePlugins(admin);
  await admin.goto(`${ORIGIN}/wp-admin/plugin-install.php?tab=upload`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await admin.locator('input[type="file"]').setInputFiles(zipPath);
  await admin.evaluate(() => document.querySelector('#install-plugin-submit')?.click());
  await admin.waitForTimeout(8000);
  await activatePluginOnce(admin);

  let sent = await admin.evaluate(async () => {
    const r = await fetch('/wp-admin/admin-ajax.php?action=aerosuite_video_promo_guia_status', { credentials: 'include' });
    const text = await r.text();
    if (text === '0' || !text.trim()) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text.slice(0, 800) };
    }
  });

  if (!Array.isArray(sent?.sent)) {
    const statusRes = await admin
      .goto(`${ORIGIN}/wp-admin/index.php?aerosuite_video_promo_guia_status=1`, { waitUntil: 'domcontentloaded' })
      .catch(() => null);
    if (statusRes?.ok()) {
      const text = (await statusRes.text()).trim();
      if (text.startsWith('{')) {
        try {
          sent = JSON.parse(text);
        } catch {
          sent = { raw: text.slice(0, 800) };
        }
      }
    }
  }

  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
  const row = await findPluginRow(admin);
  if ((await row.count()) > 0) {
    await row.locator('.deactivate a').click({ timeout: 5000 }).catch(() => {});
  }

  return sent;
}

async function main() {
  if (!fs.existsSync(storagePath)) {
    console.error('VIDEO_GUIA_EMAIL_FAIL missing wp-storage.json');
    process.exit(1);
  }

  preparePluginBundle();
  zipPlugin();

  const browser = await pw.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: storagePath });
  const admin = await ctx.newPage();

  const result = {
    at: new Date().toISOString(),
    channel: 'wordpress-wp-mail-smtp',
    from: 'contato@aerosuite.com.br',
    targets: {
      to: 'thiagolyra18@gmail.com',
      cc: 'wellemlyra@gmail.com',
    },
    subject: '[Aero Suite] Guia de Produção do Vídeo Promocional — Marketing',
    sent: await sendViaWordPress(admin),
  };

  await browser.close();
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  const ok = Array.isArray(result.sent?.sent) && result.sent.sent.every((r) => r.ok === true);
  console.log(ok ? 'VIDEO_GUIA_EMAIL_OK' : 'VIDEO_GUIA_EMAIL_WARN', JSON.stringify(result.sent, null, 2));
  process.exit(ok ? 0 : 2);
}

main().catch((e) => {
  console.error('VIDEO_GUIA_EMAIL_FAIL', e.message);
  process.exit(1);
});
