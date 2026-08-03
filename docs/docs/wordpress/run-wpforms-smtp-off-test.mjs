import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const SMTP = 'wp-mail-smtp/wp_mail_smtp.php';

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await context.newPage();
const front = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
const smtpOff = await admin.evaluate(async (plugin) => {
  try {
    await wp.apiFetch({ path: '/wp/v2/plugins/' + encodeURIComponent(plugin), method: 'POST', data: { status: 'inactive' } });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}, SMTP);

await front.goto(`${ORIGIN}/contato/?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });
await front.fill('#wpforms-12-field_1', 'SMTP Off Test');
await front.fill('#wpforms-12-field_2', `smtpoff.${Date.now()}@aerosuite.com.br`);
await front.fill('#wpforms-12-field_8', 'test');
await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});

const [res] = await Promise.all([
  front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  front.click('#wpforms-submit-12'),
]);
const body = await res.text();

// reactivate smtp
await admin.evaluate(async (plugin) => {
  try {
    await wp.apiFetch({ path: '/wp/v2/plugins/' + encodeURIComponent(plugin), method: 'POST', data: { status: 'active' } });
  } catch (_) {}
}, SMTP);

console.log(JSON.stringify({ smtpOff, status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 400) }, null, 2));
await browser.close();
process.exit(body.includes('"success":true') ? 0 : 1);
