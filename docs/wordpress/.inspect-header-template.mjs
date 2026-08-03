import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');

const browser = await pw.chromium.launch({ headless: true });
const page = await (await browser.newContext({ storageState: storage })).newPage();
await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const result = await page.evaluate(async () => {
  const header = await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//header?context=edit' });
  const media = await wp.apiFetch({ path: '/wp/v2/media/741' });
  const raw = header.content?.raw || '';
  return {
    media: {
      src: media.source_url,
      w: media.media_details?.width,
      h: media.media_details?.height,
      sizes: Object.keys(media.media_details?.sizes || {}),
    },
    logoBlockCount: (raw.match(/wp-block-site-logo|custom-logo|site-logo/gi) || []).length,
    blocks: raw.match(/<!-- wp:[^>]+ -->[\s\S]*?(?=<!-- wp:|$)/g)?.slice(0, 8)?.map((b) => b.slice(0, 220)),
  };
});

fs.writeFileSync(path.join(dir, 'header-inspect.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
