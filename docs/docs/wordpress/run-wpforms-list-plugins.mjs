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
const plugins = await admin.evaluate(() =>
  [...document.querySelectorAll('#the-list tr[data-plugin]')].map((tr) => ({
    plugin: tr.dataset.plugin,
    name: tr.querySelector('.plugin-title strong')?.textContent?.trim(),
    active: tr.classList.contains('active'),
    version: tr.querySelector('.plugin-version-author-uri')?.textContent?.trim(),
  })).filter((p) => /aero|wpforms|smtp/i.test(p.plugin + p.name))
);
console.log(JSON.stringify(plugins, null, 2));
await browser.close();
