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
await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
const info = await admin.evaluate(() => {
  const row = document.querySelector('tr[data-plugin="aerosuite-wpforms-fix/aerosuite-wpforms-fix.php"]');
  if (!row) return { found: false };
  return {
    found: true,
    active: row.classList.contains('active'),
    text: row.innerText.replace(/\s+/g, ' ').slice(0, 300),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
