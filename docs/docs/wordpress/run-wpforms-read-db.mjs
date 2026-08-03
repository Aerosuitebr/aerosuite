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
await admin.goto(`${ORIGIN}/wp-admin/post.php?post=18&action=edit`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const data = await admin.evaluate(async () => {
  const attempts = [];
  for (const path of ['/wp/v2/wpforms/12', '/wp/v2/wpforms?include=12', '/wp/v2/posts/12?context=edit']) {
    try {
      const r = await wp.apiFetch({ path });
      attempts.push({ path, ok: true, keys: Object.keys(r), postType: r.type, contentLen: (r.content?.raw || r.content?.rendered || '').length });
    } catch (e) {
      attempts.push({ path, ok: false, error: String(e.message || e) });
    }
  }
  const builder = await fetch(`${window.ajaxurl}?action=wpforms_builder_help&form_id=12`).then((r) => r.text()).catch((e) => String(e));
  return { attempts, builderPreview: String(builder).slice(0, 200) };
});

console.log(JSON.stringify(data, null, 2));
await browser.close();
