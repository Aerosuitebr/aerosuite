/**
 * Corrige WPForms #12: instala plugin fix, isola conflitos, captura log, reativa plugins.
 * Uso: node run-wpforms-fix.mjs
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
const WPFORMS = 'wpforms-lite/wpforms';
const FIX_PLUGIN = 'aerosuite-wpforms-fix/aerosuite-wpforms-fix.php';
const LOG_URL = `${ORIGIN}/wp-content/uploads/aerosuite-wpforms-debug.log`;

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  process.exit(2);
}

function buildFixZip() {
  const zipPath = path.join(dir, 'aerosuite-wpforms-fix.zip');
  const pluginDir = path.join(dir, 'plugins', 'aerosuite-wpforms-fix');
  if (process.platform === 'win32') {
    spawnSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Compress-Archive -Path "${pluginDir}\\*" -DestinationPath "${zipPath}" -Force`,
      ],
      { stdio: 'inherit' }
    );
  } else {
    spawnSync('zip', ['-r', zipPath, '.'], { cwd: pluginDir, stdio: 'inherit' });
  }
  return zipPath;
}

async function submitForm(page) {
  await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.click('#as-consent-accept-all', { timeout: 4000 }).catch(() => {});
  await page.waitForSelector('#wpforms-form-12', { timeout: 45000 });
  await page.fill('#wpforms-12-field_1', 'Fix Test');
  await page.fill('#wpforms-12-field_2', `fix.${Date.now()}@aerosuite.com.br`);
  await page.fill('#wpforms-12-field_5', 'Aero Suite');
  await page.fill('#wpforms-12-field_7', '(21) 99999-0001');
  await page.fill('#wpforms-12-field_8', 'Teste pos-correcao automatizado');
  const trap = await page.$('#wpforms-12-field_3');
  if (trap) await trap.evaluate((el) => { el.value = ''; });
  const capture = page.waitForResponse(
    (r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST',
    { timeout: 30000 }
  );
  await page.click('#wpforms-submit-12');
  const res = await capture;
  const body = await res.text().catch(() => '');
  return {
    status: res.status(),
    ok: res.ok(),
    bodyPreview: body.slice(0, 1200),
    isJson: body.trim().startsWith('{'),
    isCritical: body.includes('erro crítico') || body.includes('critical error'),
  };
}

async function fetchDebugLog() {
  try {
    const res = await fetch(`${LOG_URL}?t=${Date.now()}`, { cache: 'no-store' });
    const text = await res.text();
    return { status: res.status, tail: text.slice(-4000) };
  } catch (err) {
    return { error: String(err.message || err) };
  }
}

async function listPlugins(admin) {
  return admin.evaluate(async () => {
    const all = await wp.apiFetch({ path: '/wp/v2/plugins?context=edit&per_page=100' });
    return all.map((p) => ({ plugin: p.plugin, status: p.status, name: p.name, version: p.version }));
  });
}

async function setPluginStatus(admin, plugin, status) {
  return admin.evaluate(
    async ({ plugin, status }) => {
      try {
        await wp.apiFetch({
          path: '/wp/v2/plugins/' + encodeURIComponent(plugin),
          method: 'POST',
          data: { status },
        });
        return { plugin, status, ok: true };
      } catch (e) {
        return { plugin, status, ok: false, error: String(e.message || e) };
      }
    },
    { plugin, status }
  );
}

async function dismissAdminOverlays(admin) {
  await admin.evaluate(() => {
    document.querySelectorAll('#extendify-agent-popout-modal, .extendify-agent, #extendify-agent-main').forEach((el) => {
      el.remove();
    });
    document.querySelectorAll('.notice.is-dismissible button.notice-dismiss').forEach((btn) => btn.click());
  });
  await admin.keyboard.press('Escape').catch(() => {});
}

async function uploadFixPlugin(admin, zipPath) {
  await admin.goto(`${ORIGIN}/wp-admin/plugin-install.php?tab=upload`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (admin.url().includes('wp-login')) return { ok: false, error: 'session_expired' };
  await dismissAdminOverlays(admin);

  const fileInput = admin.locator('input[type="file"]#pluginzip, input[type="file"][name="pluginzip"]');
  if (!(await fileInput.count())) return { ok: false, error: 'no_upload_input' };
  await fileInput.setInputFiles(zipPath);

  await admin.evaluate(() => {
    const btn = document.querySelector('#install-plugin-submit, input[name="install-plugin-submit"]');
    if (btn) btn.click();
  });
  await admin.waitForTimeout(8000);
  await dismissAdminOverlays(admin);

  const activateLink = admin.locator('a[href*="action=activate"][href*="aerosuite-wpforms-fix"]');
  if (await activateLink.count()) {
    await admin.evaluate(() => {
      const a = document.querySelector('a[href*="action=activate"][href*="aerosuite-wpforms-fix"]');
      if (a) a.click();
    });
    await admin.waitForTimeout(2500);
    return { ok: true, activated: true };
  }

  const already = admin.locator('text=Plugin already installed');
  if (await already.count()) {
    await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
    const act = admin.locator(`tr[data-plugin="${FIX_PLUGIN}"] a[href*="action=activate"]`);
    if (await act.count()) {
      await act.first().click();
      await admin.waitForTimeout(2500);
      return { ok: true, activated: true, note: 'was_installed' };
    }
    return { ok: true, activated: false, note: 'already_active_or_missing' };
  }

  return { ok: true, activated: false, page: admin.url() };
}

async function tuneWpformsSettings(admin) {
  await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-builder&view=settings&form_id=12`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (admin.url().includes('wp-login')) return { ok: false, error: 'session_expired' };
  await dismissAdminOverlays(admin);

  const notes = [];
  await admin.waitForTimeout(3000);

  const toggles = admin.locator(
    'input[type="checkbox"][name*="anti"], input[id*="anti-spam"], label:has-text("Anti-Spam") input'
  );
  if (await toggles.count()) {
    const first = toggles.first();
    if (await first.isChecked().catch(() => false)) {
      await first.uncheck({ force: true }).catch(() => {});
      notes.push('anti_spam_unchecked');
    }
  }

  await admin.evaluate(() => {
    document.querySelectorAll('input[type="checkbox"]').forEach((el) => {
      const name = (el.getAttribute('name') || '') + (el.id || '');
      if (/notification.*enable|enable.*notification/i.test(name) && el.checked) {
        el.click();
      }
    });
  });
  notes.push('notifications_attempt_off');

  const save = admin.locator('.wpforms-btn-save, button:has-text("Salvar"), button:has-text("Save")').first();
  if (await save.count()) {
    await save.click({ timeout: 8000 }).catch(() => {});
    await admin.waitForTimeout(2500);
    notes.push('saved');
  }

  return { ok: true, notes };
}

const zipPath = buildFixZip();
const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();

const result = {
  at: new Date().toISOString(),
  baseline: null,
  upload: null,
  tune: null,
  afterFixPlugin: null,
  minimalPlugins: null,
  debugLog: null,
  final: null,
  restored: [],
};

await admin.goto(`${ORIGIN}/wp-admin/post.php?post=21&action=edit`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (admin.url().includes('wp-login')) {
  console.error('SESSION_EXPIRED');
  await browser.close();
  process.exit(3);
}
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const pluginsBefore = await listPlugins(admin);
result.baseline = await submitForm(front).catch((e) => ({ error: String(e.message || e) }));

result.upload = await uploadFixPlugin(admin, zipPath);
result.tune = await tuneWpformsSettings(admin);

result.afterFixPlugin = await submitForm(front).catch((e) => ({ error: String(e.message || e) }));
result.debugLog = await fetchDebugLog();

if (!result.afterFixPlugin?.ok || result.afterFixPlugin?.status >= 500) {
  const keep = new Set([WPFORMS, FIX_PLUGIN]);
  const active = pluginsBefore.filter((p) => p.status === 'active' && !keep.has(p.plugin));
  const deactivated = [];
  for (const p of active) {
    const r = await setPluginStatus(admin, p.plugin, 'inactive');
    deactivated.push(r);
  }
  await admin.waitForTimeout(2000);
  const minimalSubmit = await submitForm(front).catch((e) => ({ error: String(e.message || e) }));
  result.minimalPlugins = { deactivated: deactivated.length, submit: minimalSubmit };
  result.debugLogAfterMinimal = await fetchDebugLog();

  for (const p of active) {
    const r = await setPluginStatus(admin, p.plugin, 'active');
    result.restored.push(r);
  }
}

result.final = await submitForm(front).catch((e) => ({ error: String(e.message || e) }));
result.debugLogFinal = await fetchDebugLog();

const outPath = path.join(dir, 'wpforms-fix-result.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log('WPFORMS_FIX', JSON.stringify({
  baseline: result.baseline?.status,
  afterFix: result.afterFixPlugin?.status,
  minimal: result.minimalPlugins?.submit?.status,
  final: result.final?.status,
  logTail: (result.debugLogFinal?.tail || result.debugLog?.tail || '').slice(-800),
}, null, 2));

await browser.close();
process.exit(result.final?.ok && result.final?.status < 400 ? 0 : 1);
