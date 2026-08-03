import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await page.waitForSelector('#wpforms-form-12', { timeout: 60000 });
await page.fill('#wpforms-12-field_1', 'Log Test');
await page.fill('#wpforms-12-field_2', `log.${Date.now()}@aerosuite.com.br`);
await page.fill('#wpforms-12-field_8', 'log');
await page.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});
await Promise.all([
  page.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
  page.click('#wpforms-submit-12'),
]);
await page.waitForTimeout(2000);
const log = await page.goto(`${ORIGIN}/wp-content/uploads/aerosuite-wpforms-debug.log?${Date.now()}`, { timeout: 30000 }).then(() => page.textContent('body')).catch(() => 'log fetch failed');
const lines = String(log).split(/\n/).filter((l) => /process_before|process_complete/.test(l)).slice(-5);
console.log(lines.join('\n') || log.slice(-800));
await browser.close();
