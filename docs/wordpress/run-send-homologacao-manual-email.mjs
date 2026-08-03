/**
 * Envia e-mail do Manual de Homologacao via WP Mail SMTP (aerosuite.com.br).
 * Mesmo canal dos e-mails de autorizacao portfólio (Bellows / King do Rio).
 *
 * Uso (na raiz do repo):
 *   node scripts/send-homologacao-email.mjs --dry-run
 *   node docs/wordpress/run-send-homologacao-manual-email.mjs
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
const pluginSlug = 'aerosuite-send-homologacao-email';
const pluginFile = `${pluginSlug}/${pluginSlug}.php`;
const pluginDir = path.join(wpDir, 'plugins', pluginSlug);
const zipPath = path.join(wpDir, `${pluginSlug}.zip`);
const storagePath = path.join(wpDir, 'wp-storage.json');
const outPath = path.join(wpDir, 'homologacao-manual-email-result.json');

const htmlSrc = path.join(repoRoot, 'docs/manual-homologacao/email-preview.html');
const pdfSrc = path.join(repoRoot, 'manuals/Manual_Aero_Suite_Homologacao.pdf');

function preparePluginBundle() {
  if (!fs.existsSync(htmlSrc)) {
    throw new Error(`Gere o preview antes: node scripts/send-homologacao-email.mjs --dry-run (${htmlSrc})`);
  }
  if (!fs.existsSync(pdfSrc)) {
    throw new Error(`PDF ausente: ${pdfSrc}`);
  }
  fs.copyFileSync(htmlSrc, path.join(pluginDir, 'email-body.html'));
  fs.copyFileSync(pdfSrc, path.join(pluginDir, 'Manual_Aero_Suite_Homologacao.pdf'));
}

function zipPlugin() {
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  if (process.platform === 'win32') {
    spawnSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Compress-Archive -Path "${pluginDir}\\*" -DestinationPath "${zipPath}" -Force`,
      ],
      { stdio: 'inherit' },
    );
  } else {
    spawnSync('zip', ['-rj', zipPath, path.join(pluginDir, pluginSlug + '.php')], { stdio: 'inherit' });
  }
}

async function findHomologPluginRow(admin) {
  const plugins = await admin.evaluate(() =>
    [...document.querySelectorAll('tr[data-plugin*="aerosuite-send-homologacao-email"]')].map((tr) => ({
      plugin: tr.getAttribute('data-plugin'),
      active: !!tr.querySelector('.deactivate a'),
    })),
  );
  const sorted = plugins.sort((a, b) => {
    const nested = (p) => (p.plugin.match(/\//g) || []).length;
    return nested(a) - nested(b) || b.plugin.localeCompare(a.plugin);
  });
  const pick = sorted.find((p) => !p.plugin.includes('/aerosuite-send-homologacao-email/')) || sorted[0];
  if (!pick?.plugin) return admin.locator('tr[data-plugin="__none__"]');
  return admin.locator(`tr[data-plugin="${pick.plugin}"]`);
}

async function purgeHomologPlugins(admin) {
  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await admin.evaluate(() =>
    document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()),
  );
  for (let i = 0; i < 16; i++) {
    const plugins = await admin.evaluate(() =>
      [...document.querySelectorAll('tr[data-plugin*="aerosuite-send-homologacao-email"]')].map((tr) => ({
        plugin: tr.getAttribute('data-plugin'),
        active: !!tr.querySelector('.deactivate a'),
      })),
    );
    if (plugins.length === 0) break;
    const target = plugins.sort((a, b) => b.plugin.localeCompare(a.plugin))[0];
    const row = admin.locator(`tr[data-plugin="${target.plugin}"]`);
    if (target.active) {
      await row.locator('.deactivate a').click({ timeout: 8000 }).catch(() => {});
      await admin.waitForTimeout(1200);
    }
    await row.locator('.delete a').click({ timeout: 8000 }).catch(() => {});
    await admin.waitForTimeout(2000);
    await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
  }
}

async function activatePluginOnce(admin) {
  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const row = await findHomologPluginRow(admin);
  if ((await row.count()) === 0) {
    const plugins = await admin.evaluate(() =>
      [...document.querySelectorAll('#the-list tr[data-plugin]')].map((tr) => tr.getAttribute('data-plugin')),
    );
    throw new Error(`Plugin homolog nao encontrado. Plugins: ${plugins.filter((p) => p.includes('homolog')).join(', ') || '(nenhum homolog)'}`);
  }
  const activate = row.locator('.activate a');
  const deactivate = row.locator('.deactivate a');
  if ((await activate.count()) > 0) {
    await activate.click({ timeout: 15000 });
  } else if ((await deactivate.count()) > 0) {
    await deactivate.click({ timeout: 8000 });
    await admin.waitForTimeout(1500);
    await row.locator('.activate a').click({ timeout: 15000 });
  } else {
    throw new Error('Linha do plugin sem links activate/deactivate');
  }
  await admin.waitForTimeout(6000);
}

async function sendViaWordPress(admin) {
  admin.on('dialog', (d) => d.accept());
  await admin.goto(`${ORIGIN}/wp-admin/plugin-install.php?tab=upload`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await admin.evaluate(() =>
    document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()),
  );
  await purgeHomologPlugins(admin);

  await admin.goto(`${ORIGIN}/wp-admin/plugin-install.php?tab=upload`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await admin.locator('input[type="file"]').setInputFiles(zipPath);
  await admin.evaluate(() => document.querySelector('#install-plugin-submit')?.click());
  await admin.waitForTimeout(8000);

  await activatePluginOnce(admin);

  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
  await admin.waitForTimeout(1500);

  let sent = await admin.evaluate(async () => {
    const r = await fetch('/wp-admin/admin-ajax.php?action=aerosuite_homolog_status', { credentials: 'include' });
    const text = await r.text();
    if (text === '0' || text.trim() === '') return null;
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text.slice(0, 800), status: r.status };
    }
  });

  if (!Array.isArray(sent?.sent)) {
    const statusRes = await admin
      .goto(`${ORIGIN}/wp-admin/index.php?aerosuite_homolog_status=1`, { waitUntil: 'domcontentloaded' })
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
  const row = await findHomologPluginRow(admin);
  if ((await row.count()) > 0) {
    await row.locator('.deactivate a').click({ timeout: 5000 }).catch(() => {});
    await admin.waitForTimeout(800);
  }

  return sent;
}

async function main() {
  if (!fs.existsSync(storagePath)) {
    console.error('HOMOLOG_EMAIL_FAIL missing wp-storage.json');
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
      to: 'rafaellanottesconsultoria@gmail.com',
      cc: 'timmaia@bellowscontrols.com.br, wellemlyra@gmail.com',
    },
    subject:
      '[Aero Suite] ⚠ NOVA VERSÃO v2.0 — Manual de Homologação atualizado (SGQ · Fase 7 · SMS)',
    sent: await sendViaWordPress(admin),
  };

  await browser.close();
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  const ok = Array.isArray(result.sent?.sent) && result.sent.sent.every((r) => r.ok === true);
  console.log(ok ? 'HOMOLOG_EMAIL_OK' : 'HOMOLOG_EMAIL_WARN', JSON.stringify(result.sent));
  process.exit(ok ? 0 : 2);
}

main().catch((e) => {
  console.error('HOMOLOG_EMAIL_FAIL', e.message);
  process.exit(1);
});
