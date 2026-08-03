/**
 * Finaliza troca do logo: custom_logo do tema + URLs legadas remanescentes.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');

const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const mediaJson = path.join(dir, 'aerosuite-logo-media.json');
const ORIGIN = 'https://aerosuite.com.br';

if (!fs.existsSync(storage) || !fs.existsSync(mediaJson)) {
  console.error('MISSING inputs');
  process.exit(2);
}

const { hero, upload } = JSON.parse(fs.readFileSync(mediaJson, 'utf8'));
const mediaId = upload?.id;
if (!hero || !mediaId) process.exit(3);

const LEGACY_RE =
  /https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"'\\s>]*(hero-logo-transparent-v2|hero-logo-transparent|Pictureandletter|aerosuite-logo-light|aerosuite-pictureandletter)[^"'\\s>]*/gi;

const browser = await pw.chromium.launch({ headless: true });
const page = await (await browser.newContext({ storageState: storage })).newPage();

await page.goto(`${ORIGIN}/wp-admin/post.php?post=21&action=edit`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (page.url().includes('wp-login')) {
  console.error('SESSION_EXPIRED');
  await browser.close();
  process.exit(3);
}
await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const result = await page.evaluate(
  async ({ hero, mediaId, legacyReSource }) => {
    const legacyRe = new RegExp(legacyReSource, 'gi');

    function patch(content) {
      if (!content) return { content, count: 0 };
      const before = content;
      const next = content.replace(legacyRe, hero);
      return { content: next, count: before === next ? 0 : (before.match(legacyRe) || []).length };
    }

    const customLogo = await wp.apiFetch({
      path: '/wp/v2/settings',
      method: 'POST',
      data: { custom_logo: mediaId },
    });

    const pages = {};
    const list = await wp.apiFetch({ path: '/wp/v2/pages?per_page=100&context=edit' });
    for (const p of list) {
      const raw = p.content?.raw || '';
      const { content, count } = patch(raw);
      if (count) {
        await wp.apiFetch({ path: `/wp/v2/pages/${p.id}`, method: 'POST', data: { content } });
      }
      pages[p.id] = { slug: p.slug, replaced: count };
    }

    const templateParts = {};
    for (const part of ['extendable//header', 'extendable//footer']) {
      const tp = await wp.apiFetch({ path: `/wp/v2/template-parts/${part}?context=edit` });
      const { content, count } = patch(tp.content?.raw || '');
      if (count) {
        await wp.apiFetch({
          path: `/wp/v2/template-parts/${part}?id=${part}`,
          method: 'POST',
          data: { content },
        });
      }
      templateParts[part] = { replaced: count };
    }

    return {
      ok: true,
      hero,
      customLogo: customLogo?.custom_logo ?? mediaId,
      pages,
      templateParts,
    };
  },
  { hero, mediaId, legacyReSource: LEGACY_RE.source },
);

fs.writeFileSync(path.join(dir, 'aerosuite-logo-finish-result.json'), JSON.stringify(result, null, 2));
console.log('FINISH_OK', JSON.stringify(result));
await browser.close();
