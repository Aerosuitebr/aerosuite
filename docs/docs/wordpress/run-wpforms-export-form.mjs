import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
await admin.goto('https://aerosuite.com.br/wp-admin/admin.php?page=wpforms-builder&view=fields&form_id=12', {
  waitUntil: 'networkidle',
  timeout: 120000,
});
await admin.waitForTimeout(10000);
const data = await admin.evaluate(() => ({
  hasBuilder: !!window.wpforms_builder,
  fieldTypes: window.wpforms_builder?.form?.fields
    ? Object.values(window.wpforms_builder.form.fields).map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        format: f.format,
        required: f.required,
        meta: f.meta,
      }))
    : null,
}));
fs.writeFileSync(path.join(dir, 'wpforms-form-12-export.json'), JSON.stringify(data, null, 2));
console.log(JSON.stringify(data, null, 2));
await browser.close();
