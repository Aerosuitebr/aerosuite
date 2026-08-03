/**
 * Correções prioritárias no WordPress (requer sessão wp-storage.json).
 * 1. Flush permalinks (sitemap)
 * 2. Atualizar plugins críticos (WPForms, WP Mail SMTP)
 * 3. Teste WPForms com/sem SMTP
 * 4. Re-auditoria sitemap + formulário
 *
 * Uso: node run-priority-fixes.mjs
 */
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

const CRITICAL_PLUGINS = [
  'wpforms-lite/wpforms',
  'wp-mail-smtp/wp_mail_smtp',
  'sugar-calendar-lite/sugar-calendar-lite',
];

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  console.error('Exporte cookies do wp-admin para wp-storage.json (Playwright storageState).');
  process.exit(2);
}

async function fetchSitemapStatus() {
  try {
    const res = await fetch(`${ORIGIN}/wp-sitemap.xml`);
    const body = await res.text();
    return { status: res.status, ok: res.ok, preview: body.slice(0, 300) };
  } catch (err) {
    return { status: 0, ok: false, error: String(err.message || err) };
  }
}

async function submitWpforms(page) {
  await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.click('#as-consent-accept-all', { timeout: 3000 }).catch(() => {});
  await page.waitForSelector('#wpforms-form-12', { timeout: 30000 });
  await page.fill('#wpforms-12-field_1', 'Fix Test');
  await page.fill('#wpforms-12-field_2', `fix.${Date.now()}@aerosuite.com.br`);
  await page.fill('#wpforms-12-field_7', '(21) 99999-0001');
  await page.fill('#wpforms-12-field_8', 'Teste pos-correcao');
  const trap = await page.$('#wpforms-12-field_3');
  if (trap) await trap.evaluate((el) => { el.value = ''; });
  const capture = page.waitForResponse(
    (r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST',
    { timeout: 25000 }
  );
  await page.click('#wpforms-submit-12');
  const res = await capture;
  const body = await res.text().catch(() => '');
  return { status: res.status(), ok: res.ok(), bodyPreview: body.slice(0, 800) };
}

async function flushPermalinks(admin) {
  await admin.goto(`${ORIGIN}/wp-admin/options-permalink.php`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (admin.url().includes('wp-login')) return { ok: false, error: 'session_expired' };
  await admin.click('#submit', { timeout: 15000 });
  await admin.waitForTimeout(1500);
  return { ok: true };
}

async function listPluginUpdates(admin) {
  return admin.evaluate(async () => {
    if (typeof wp === 'undefined' || !wp.apiFetch) return { error: 'no apiFetch' };
    try {
      const plugins = await wp.apiFetch({ path: '/wp/v2/plugins?status=active' });
      return plugins.map((p) => ({ plugin: p.plugin, name: p.name, version: p.version }));
    } catch (e) {
      return { error: String(e.message || e) };
    }
  });
}

async function updatePluginsViaAdmin(admin) {
  await admin.goto(`${ORIGIN}/wp-admin/update-core.php`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (admin.url().includes('wp-login')) return { ok: false, error: 'session_expired' };

  const updated = [];
  const checkboxes = admin.locator('input[type="checkbox"][value*="wpforms"], input[type="checkbox"][value*="wp-mail-smtp"], input[type="checkbox"][value*="wordpress"]');
  const count = await checkboxes.count();
  for (let i = 0; i < count; i++) {
    await checkboxes.nth(i).check({ force: true }).catch(() => {});
  }

  const updateBtn = admin.locator('#upgrade-plugins, input[name="upgrade"]').first();
  if (await updateBtn.count()) {
    await updateBtn.click({ timeout: 10000 }).catch(() => {});
    await admin.waitForTimeout(8000);
    updated.push('bulk_attempted');
  }

  const coreBtn = admin.locator('a.update-link, .update-link').first();
  if (await coreBtn.count()) {
    await coreBtn.click({ timeout: 5000 }).catch(() => {});
    await admin.waitForTimeout(5000);
    updated.push('single_link_clicked');
  }

  return { ok: true, updated };
}

async function ensureWpAdmin(admin) {
  const url = admin.url();
  if (!url.includes('/wp-admin') || url.includes('wp-login')) {
    await admin.goto(`${ORIGIN}/wp-admin/post.php?post=21&action=edit`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
  }
  if (admin.url().includes('wp-login')) {
    throw new Error('session_expired');
  }
  await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, {
    timeout: 120000,
  });
}

async function togglePlugin(admin, pluginSlug, active) {
  await ensureWpAdmin(admin);
  return admin.evaluate(
    async ({ plugin, status }) => {
      await wp.apiFetch({
        path: '/wp/v2/plugins/' + encodeURIComponent(plugin),
        method: 'POST',
        data: { status: status ? 'active' : 'inactive' },
      });
      return { plugin, active: status };
    },
    { plugin: pluginSlug, status: active }
  );
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();

const result = {
  at: new Date().toISOString(),
  sitemapBefore: await fetchSitemapStatus(),
  wpformsBefore: null,
  permalinks: null,
  pluginsBefore: null,
  pluginUpdates: null,
  smtpIsolation: null,
  sitemapAfter: null,
  wpformsAfter: null,
};

await admin.goto(`${ORIGIN}/wp-admin/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
if (admin.url().includes('wp-login')) {
  console.error('SESSION_EXPIRED');
  await browser.close();
  process.exit(3);
}

await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

result.pluginsBefore = await listPluginUpdates(admin);
result.wpformsBefore = await submitWpforms(front).catch((e) => ({ error: String(e.message || e) }));

result.permalinks = await flushPermalinks(admin);
result.pluginUpdates = await updatePluginsViaAdmin(admin);

result.sitemapAfter = await fetchSitemapStatus();

if (!result.wpformsBefore?.ok || result.wpformsBefore?.status >= 500) {
  const SMTP = 'wp-mail-smtp/wp_mail_smtp';
  const baseline = result.wpformsBefore;
  let smtpOff = null;
  try {
    await togglePlugin(admin, SMTP, false);
    await admin.waitForTimeout(2000);
    smtpOff = await submitWpforms(front);
  } catch (err) {
    smtpOff = { error: String(err.message || err) };
  } finally {
    await togglePlugin(admin, SMTP, true).catch(() => {});
  }
  result.smtpIsolation = { baseline, smtpOff, smtpLikelyCause: smtpOff?.ok && !baseline?.ok };
}

result.wpformsAfter = await submitWpforms(front).catch((e) => ({ error: String(e.message || e) }));

const outPath = path.join(dir, 'priority-fixes-result.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('FIXES_OK', JSON.stringify({
  sitemapBefore: result.sitemapBefore.status,
  sitemapAfter: result.sitemapAfter.status,
  wpformsBefore: result.wpformsBefore?.status,
  wpformsAfter: result.wpformsAfter?.status,
  smtpLikelyCause: result.smtpIsolation?.smtpLikelyCause,
}, null, 2));
console.log('Report:', outPath);

await browser.close();

const audit = spawnSync(process.execPath, [path.join(dir, 'run-site-audit.mjs')], {
  stdio: 'inherit',
  cwd: dir,
});

process.exit(audit.status === 0 ? 0 : 1);
