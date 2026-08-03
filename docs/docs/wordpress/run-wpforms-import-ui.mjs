import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const ORIGIN = 'https://aerosuite.com.br';
const jsonPath = path.join(dir, 'aerosuite-wpforms-form12.json');

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-tools&view=import&tab=forms`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e)=>e.remove()));

const inputs = await admin.evaluate(() =>
  [...document.querySelectorAll('input')].map((i) => ({ type: i.type, name: i.name, id: i.id, accept: i.accept }))
);
console.log('INPUTS', inputs);

const file = admin.locator('input[type="file"]');
if (await file.count()) {
  await file.first().setInputFiles(jsonPath);
  await admin.evaluate(() => {
    const btn = [...document.querySelectorAll('button, input[type=submit]')].find((el) =>
      /import|importar/i.test(el.textContent || el.value || '')
    );
    btn?.click();
  });
  await admin.waitForTimeout(8000);
}
console.log('URL', admin.url());
const msg = await admin.evaluate(() => document.body.innerText.slice(0, 1200));
console.log('MSG', msg);
await browser.close();
