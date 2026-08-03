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
await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-builder&view=fields&form_id=12`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

const formData = await admin.evaluate(async () => {
  const body = new URLSearchParams();
  body.set('action', 'wpforms_get_form');
  body.set('form_id', '12');
  const res = await fetch(window.ajaxurl, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: body.toString(),
  });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    const form = json.data?.form || json.data || json;
    const fields = form?.fields || form?.form?.fields;
    return {
      status: res.status,
      success: json.success,
      fieldSummary: fields
        ? Object.values(fields).map((f) => ({ id: f.id, type: f.type, label: f.label, required: f.required, format: f.format }))
        : null,
      settingsKeys: form?.settings ? Object.keys(form.settings) : null,
      antispam: form?.settings?.antispam,
      rawKeys: typeof json.data === 'object' ? Object.keys(json.data) : null,
      preview: text.slice(0, 500),
    };
  } catch {
    return { status: res.status, raw: text.slice(0, 1000) };
  }
});

console.log(JSON.stringify(formData, null, 2));
await browser.close();
