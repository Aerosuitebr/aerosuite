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
const admin = await context.newPage();
await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-overview`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
const forms = await admin.evaluate(() =>
  [...document.querySelectorAll('table.wp-list-table tbody tr, .wpforms-overview-table tbody tr, #the-list tr')].map((tr) => ({
    id: tr.querySelector('.column-id')?.textContent?.trim() || tr.id?.replace('post-', ''),
    title: tr.querySelector('.column-primary strong, .row-title')?.textContent?.trim(),
    edit: tr.querySelector('a.row-title, a[href*="form_id="]')?.getAttribute('href'),
  }))
);
console.log(JSON.stringify(forms, null, 2));
await browser.close();
