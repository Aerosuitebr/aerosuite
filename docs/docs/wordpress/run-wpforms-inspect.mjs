import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';

const html = await fetch(`${ORIGIN}/contato/?t=${Date.now()}`).then((r) => r.text());
const idx = html.indexOf('wpforms-container');
const snippet = idx >= 0 ? html.slice(idx, idx + 1500) : null;

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await context.newPage();
await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-overview`, { waitUntil: 'domcontentloaded', timeout: 120000 });

const forms = await admin.evaluate(async () => {
  const rows = [...document.querySelectorAll('.wp-list-table tbody tr')];
  return rows.slice(0, 15).map((tr) => ({
    id: tr.querySelector('.column-id')?.textContent?.trim(),
    title: tr.querySelector('.column-name')?.textContent?.trim(),
    shortcode: tr.querySelector('.column-shortcode code')?.textContent?.trim(),
  }));
});

// Try preview URL for form 327
const preview327Res = await fetch(`${ORIGIN}/?wpforms_form_preview=327`);
const preview327Text = await preview327Res.text();
const preview327 = { status: preview327Res.status, hasForm: preview327Text.includes('wpforms-form-327') };

const preview12Res = await fetch(`${ORIGIN}/?wpforms_form_preview=12`);
const preview12Text = await preview12Res.text();
const preview12 = { status: preview12Res.status, hasForm: preview12Text.includes('wpforms-form-12') };

console.log(JSON.stringify({ snippet, forms, preview327, preview12 }, null, 2));
await browser.close();
