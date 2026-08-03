import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const PLUGIN = 'aerosuite-wpforms-fix/aerosuite-wpforms-fix.php';

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await context.newPage();
await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });

const status = await admin.evaluate(async (plugin) => {
  try {
    const p = await wp.apiFetch({ path: '/wp/v2/plugins/' + encodeURIComponent(plugin), method: 'POST', data: { status: 'active' } });
    return { active: p.status === 'active', version: p.version, name: p.name };
  } catch (e) {
    return { error: String(e.message || e) };
  }
}, PLUGIN);

const preview = await admin.evaluate(async () => {
  const t = await fetch('/?wpforms_form_preview=12').then((r) => r.text());
  return {
    field1Type: t.match(/data-field-id="1"[^>]*data-field-type="([^"]+)"/)?.[1] || null,
    hasField4: t.includes('wpforms-12-field_4'),
    fieldIds: [...t.matchAll(/data-field-id="(\d+)"/g)].map((m) => m[1]),
  };
});

console.log(JSON.stringify({ status, preview }, null, 2));
await browser.close();
