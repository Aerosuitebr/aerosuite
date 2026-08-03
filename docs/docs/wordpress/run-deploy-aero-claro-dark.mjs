/**
 * Troca logo colorido → claro em fundos escuros (hero, rodapé, page-hero).
 * Mantém Aero_Colorido no header claro (as-site-header-logo).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');

const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const mediaJson = path.join(dir, 'aerosuite-logo-media.json');

const media = JSON.parse(fs.readFileSync(mediaJson, 'utf8'));
const color = media.hero;
const light = media.logoLight;
if (!color || !light) {
  console.error('MISSING hero or logoLight — rode node run-upload-aero-claro-logo.mjs');
  process.exit(2);
}

const browser = await pw.chromium.launch({ headless: true });
const page = await (await browser.newContext({ storageState: storage })).newPage();
await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (page.url().includes('wp-login')) {
  console.error('SESSION_EXPIRED');
  process.exit(3);
}
await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const result = await page.evaluate(
  async ({ color, light }) => {
    function patchDarkLogos(html) {
      if (!html) return { content: html, count: 0 };
      let next = html;
      let count = 0;
      const esc = color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const heroRe = new RegExp(`(class="as-hero-v2__logo" src=")${esc}`, 'g');
      const heroNext = next.replace(heroRe, `$1${light}`);
      if (heroNext !== next) {
        next = heroNext;
        count++;
      }

      const pageHeroRe =
        /(class="as-page-hero__media as-page-hero__media--logo"><img src=")https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"']+/g;
      const pageHeroNext = next.replace(pageHeroRe, `$1${light}`);
      if (pageHeroNext !== next) {
        next = pageHeroNext;
        count++;
      }

      const footerRe =
        /(as-site-chrome__brand[\s\S]*?<img src=")https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"']+/g;
      const footerNext = next.replace(footerRe, `$1${light}`);
      if (footerNext !== next) {
        next = footerNext;
        count++;
      }

      return { content: next, count };
    }

    const pages = {};
    const list = await wp.apiFetch({ path: '/wp/v2/pages?per_page=100&context=edit' });
    for (const p of list) {
      const raw = p.content?.raw || '';
      const { content, count } = patchDarkLogos(raw);
      if (count) {
        await wp.apiFetch({ path: `/wp/v2/pages/${p.id}`, method: 'POST', data: { content } });
      }
      pages[p.id] = { slug: p.slug, patched: count };
    }

    let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' }))
      .content.raw;
    const footerPatch = patchDarkLogos(footer);
    if (footerPatch.count) {
      footer = footerPatch.content;
      await wp.apiFetch({
        path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer',
        method: 'POST',
        data: { content: footer },
      });
    }

    return { ok: true, color, light, pages, footerPatched: footerPatch.count };
  },
  { color, light },
);

fs.writeFileSync(path.join(dir, 'aero-claro-deploy-result.json'), JSON.stringify(result, null, 2));
console.log('DEPLOY_OK', JSON.stringify(result));
await browser.close();

spawnSync(process.execPath, ['sync-aero-colorido-logo-config.mjs'], { cwd: dir, stdio: 'inherit' });
spawnSync(process.execPath, ['run-aerosuite-perf-update.mjs'], { cwd: dir, stdio: 'inherit' });
spawnSync(process.execPath, ['run-force-home-refresh.mjs'], { cwd: dir, stdio: 'inherit' });
