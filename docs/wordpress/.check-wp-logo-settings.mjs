import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const mediaJson = JSON.parse(fs.readFileSync(path.join(dir, 'aerosuite-logo-media.json'), 'utf8'));
const mediaId = mediaJson.upload.id;

const browser = await pw.chromium.launch({ headless: true });
const page = await (await browser.newContext({ storageState: storage })).newPage();
await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const result = await page.evaluate(async (mediaId) => {
  const before = await wp.apiFetch({ path: '/wp/v2/settings' });
  const after = await wp.apiFetch({
    path: '/wp/v2/settings',
    method: 'POST',
    data: { custom_logo: mediaId, site_logo: mediaId },
  });
  return {
    beforeCustom: before.custom_logo,
    beforeSite: before.site_logo,
    afterCustom: after.custom_logo,
    afterSite: after.site_logo,
  };
}, mediaId);

console.log(JSON.stringify(result, null, 2));
await browser.close();
