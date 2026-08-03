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
await admin.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });
const data = await admin.evaluate(async () => {
  const tries = [];
  for (const path of ['/wp/v2/wpforms/12', '/wp/v2/posts/12', '/wp/v2/pages/12']) {
    try {
      const r = await wp.apiFetch({ path });
      tries.push({ path, ok: true, type: r.type, title: r.title?.rendered || r.title, contentLen: (r.content?.raw || r.content?.rendered || '').length });
    } catch (e) {
      tries.push({ path, ok: false, error: String(e.message || e) });
    }
  }
  let meta = null;
  try {
    meta = await wp.apiFetch({ path: '/wp/v2/posts/12?context=edit' });
  } catch (e) {
    meta = { error: String(e.message || e) };
  }
  return { tries, metaKeys: meta ? Object.keys(meta) : null, metaType: meta?.type, metaStatus: meta?.status, metaContent: meta?.content?.raw?.slice?.(0, 500) };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
