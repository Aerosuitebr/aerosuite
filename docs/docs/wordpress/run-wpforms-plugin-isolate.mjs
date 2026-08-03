/**
 * Isola plugin conflitante do WPForms #12 desativando um a um (UI plugins.php).
 * Reativa todos ao final. Uso: node run-wpforms-plugin-isolate.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const ORIGIN = 'https://aerosuite.com.br';

const CANDIDATES = [
  'sugar-calendar-lite/sugar-calendar-lite.php',
  'google-analytics-for-wordpress/googleanalytics.php',
  'complianz-gdpr/complianz-gpdr.php',
  'translatepress-multilingual/index.php',
  'wp-mail-smtp/wp_mail_smtp.php',
];

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  process.exit(2);
}

async function submitForm(page) {
  await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.click('#as-consent-accept-all', { timeout: 4000 }).catch(() => {});
  await page.waitForSelector('#wpforms-form-12', { timeout: 45000 });
  await page.fill('#wpforms-12-field_1', 'Isolate');
  await page.fill('#wpforms-12-field_2', `iso.${Date.now()}@aerosuite.com.br`);
  await page.fill('#wpforms-12-field_7', '(21) 99999-0002');
  await page.fill('#wpforms-12-field_8', 'Teste isolamento plugin');
  const trap = await page.$('#wpforms-12-field_3');
  if (trap) await trap.evaluate((el) => { el.value = ''; });
  const capture = page.waitForResponse(
    (r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST',
    { timeout: 25000 }
  );
  await page.click('#wpforms-submit-12');
  const res = await capture;
  return { status: res.status(), ok: res.ok() };
}

async function setPluginActive(admin, pluginFile, active) {
  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (admin.url().includes('wp-login')) throw new Error('session_expired');
  const row = admin.locator(`tr[data-plugin="${pluginFile}"]`);
  if (!(await row.count())) return { pluginFile, skipped: 'not_found' };
  const link = row.locator(active ? 'a[href*="action=activate"]' : 'a[href*="action=deactivate"]');
  if (!(await link.count())) return { pluginFile, skipped: active ? 'already_active' : 'already_inactive' };
  await link.first().click({ timeout: 10000 });
  await admin.waitForTimeout(2500);
  return { pluginFile, active };
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();

const result = { at: new Date().toISOString(), baseline: null, tests: [], reactivated: [] };

result.baseline = await submitForm(front).catch((e) => ({ error: String(e.message || e) }));

for (const pluginFile of CANDIDATES) {
  let test = { pluginFile, deactivated: null, submit: null };
  try {
    test.deactivated = await setPluginActive(admin, pluginFile, false);
    test.submit = await submitForm(front);
    if (test.submit.ok) {
      test.likelyCause = true;
    }
  } catch (err) {
    test.error = String(err.message || err);
  } finally {
    try {
      await setPluginActive(admin, pluginFile, true);
      result.reactivated.push(pluginFile);
    } catch (err) {
      test.reactivateError = String(err.message || err);
    }
  }
  result.tests.push(test);
  if (test.likelyCause) break;
}

fs.writeFileSync(path.join(dir, 'wpforms-plugin-isolate-result.json'), JSON.stringify(result, null, 2));
console.log('ISOLATE_PLUGINS_OK', JSON.stringify(result.baseline, null, 2), result.tests.find((t) => t.likelyCause)?.pluginFile || 'none');
await browser.close();
