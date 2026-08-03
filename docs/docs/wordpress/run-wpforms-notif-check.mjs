/** Estado WPForms #12 notifications + entries recentes */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await ctx.newPage();

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-builder&view=settings&form_id=12`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await admin.waitForTimeout(4000);

const notif = await admin.evaluate(() => {
  const enable = document.querySelector(
    'input[name*="notifications"][name*="enable"], #wpforms-panel-field-notifications-1-enable, input[id*="notification"][id*="enable"]'
  );
  const email = document.querySelector(
    'input[name*="notifications"][name*="email"], #wpforms-panel-field-notifications-1-email'
  );
  return {
    enableChecked: enable?.checked ?? null,
    emailValue: email?.value ?? null,
    url: location.href,
  };
});

console.log(JSON.stringify({ notif }, null, 2));
await browser.close();
