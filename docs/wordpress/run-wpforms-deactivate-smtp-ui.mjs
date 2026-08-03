import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await context.newPage();
const front = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));

const smtpRow = admin.locator('tr[data-plugin="wp-mail-smtp/wp_mail_smtp.php"]');
let smtpState = 'unknown';
if (await smtpRow.locator('.deactivate').count()) {
  await smtpRow.locator('.deactivate a').click();
  await admin.waitForTimeout(3000);
  smtpState = 'deactivated';
} else if (await smtpRow.count()) {
  smtpState = 'already_inactive';
}

await front.goto(`${ORIGIN}/contato/?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });
await front.fill('#wpforms-12-field_1', 'No SMTP Test');
await front.fill('#wpforms-12-field_2', `nosmtp.${Date.now()}@aerosuite.com.br`);
await front.fill('#wpforms-12-field_8', 'test');
await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});

const [res] = await Promise.all([
  front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  front.click('#wpforms-submit-12'),
]);
const body = await res.text();

console.log(JSON.stringify({ smtpState, status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 500) }, null, 2));
await browser.close();
process.exit(body.includes('"success":true') ? 0 : 1);
