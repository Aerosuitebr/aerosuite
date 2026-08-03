import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const admin = await browser.newPage();
await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-builder&view=fields&form_id=12`, {
  waitUntil: 'networkidle',
  timeout: 180000,
});
await admin.waitForTimeout(15000);

const data = await admin.evaluate(() => {
  const b = window.wpforms_builder;
  if (!b?.form?.fields) {
    return { hasBuilder: !!b, keys: b ? Object.keys(b) : [], formKeys: b?.form ? Object.keys(b.form) : [] };
  }
  return {
    hasBuilder: true,
    fields: Object.values(b.form.fields).map((f) => ({
      id: f.id,
      type: f.type,
      label: f.label,
      required: f.required,
      format: f.format,
    })),
    settings: {
      antispam: b.form.settings?.antispam,
      ajax_submit: b.form.settings?.ajax_submit,
      notification_enable: b.form.settings?.notification_enable,
    },
  };
});

console.log(JSON.stringify(data, null, 2));
await browser.close();
