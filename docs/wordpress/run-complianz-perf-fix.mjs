/**
 * Desativa Complianz (cookieblocker render-blocking) via wp-admin plugins.php
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

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const page = await context.newPage();
page.on('dialog', (d) => d.accept());

await page.goto(`${ORIGIN}/wp-admin/plugins.php`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

if (page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN');
  await browser.close();
  process.exit(3);
}

const row = page.locator('tr[data-plugin*="complianz"]');
const count = await row.count();
let deactivated = false;

if (count) {
  const pluginId = await row.first().getAttribute('data-plugin');
  const deactivate = row.first().locator('span.deactivate a, .deactivate a');
  if (await deactivate.count()) {
    await deactivate.first().click();
    await page.waitForLoadState('domcontentloaded');
    deactivated = true;
  } else {
    deactivated = 'already_inactive';
  }
  console.log('plugin', pluginId, 'action', deactivated);
} else {
  console.log('plugin_row_not_found');
}

await context.storageState({ path: storage });
await page.waitForTimeout(2000);

const html = await fetch(`${ORIGIN}/?nocache=${Date.now()}`).then((r) => r.text());
const verify = {
  cookieblocker: html.includes('cookieblocker'),
  asConsent: html.includes('as-consent'),
};

fs.writeFileSync(
  path.join(dir, 'complianz-perf-fix.json'),
  JSON.stringify({ deactivated, verify, at: new Date().toISOString() }, null, 2)
);
console.log('VERIFY', JSON.stringify(verify));
await browser.close();
