import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const page = await (await pw.chromium.launch({ headless: true }).then(async (b) => {
  const p = await (await b.newContext({ storageState: path.join(dir, 'wp-storage.json') })).newPage();
  await p.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch);
  const header = await p.evaluate(async () => (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//header?context=edit' })).content.raw);
  await b.close();
  return header;
}));
fs.writeFileSync(path.join(dir, 'header-raw.txt'), page);
console.log('len', page.length, 'site-logo idx', page.indexOf('site-logo'));
