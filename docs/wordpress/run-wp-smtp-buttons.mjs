import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await pw.chromium.launch({ headless: true });
const admin = await (await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') })).newPage();
await admin.goto('https://aerosuite.com.br/wp-admin/admin.php?page=wp-mail-smtp', { waitUntil: 'domcontentloaded', timeout: 120000 });
const buttons = await admin.evaluate(() =>
  [...document.querySelectorAll('button, input[type="submit"]')].map((b) => ({
    id: b.id,
    type: b.type,
    name: b.name,
    value: b.value,
    text: (b.innerText || b.value || '').slice(0, 60),
    visible: b.offsetParent !== null,
  }))
);
console.log(JSON.stringify(buttons.filter((b) => /salv|save|submit|orange/i.test(b.text + b.value + b.id)), null, 2));
await browser.close();
