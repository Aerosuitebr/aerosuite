/**
 * Ativa WP Mail SMTP e plugin fix v1.1.0.
 */
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
await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));

const result = await admin.evaluate(() => {
  const out = [];
  for (const id of ['wp-mail-smtp/wp_mail_smtp.php', 'aerosuite-wpforms-fix-7/aerosuite-wpforms-fix.php']) {
    const row = document.querySelector(`tr[data-plugin="${id}"]`);
    if (!row) {
      out.push({ id, status: 'missing' });
      continue;
    }
    if (!row.classList.contains('active')) row.querySelector('.activate a')?.click();
    out.push({ id, status: row.classList.contains('active') ? 'was_active' : 'activate_clicked' });
  }
  return out;
});

await admin.waitForTimeout(3000);
await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
const active = await admin.evaluate(() =>
  [...document.querySelectorAll('tr.active[data-plugin]')].filter((tr) =>
    /wp-mail-smtp|aerosuite-wpforms-fix-7/.test(tr.dataset.plugin || '')
  ).map((tr) => tr.dataset.plugin)
);

console.log(JSON.stringify({ result, active }, null, 2));
await browser.close();
