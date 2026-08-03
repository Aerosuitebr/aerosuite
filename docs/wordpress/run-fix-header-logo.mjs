/**
 * Corrige header WP: logo Aero_Colorido fixo + CSS proporcional + premium CSS.
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
const premiumCss = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const heroJs = fs.readFileSync(path.join(dir, 'aerosuite-hero.js'), 'utf8');
const phoneJs = fs.readFileSync(path.join(dir, 'aerosuite-phone-mask.js'), 'utf8');
const zoomJs = fs.readFileSync(path.join(dir, 'aerosuite-showcase-zoom.js'), 'utf8');

const { hero, upload } = JSON.parse(fs.readFileSync(mediaJson, 'utf8'));
const mediaId = upload?.id;

const HEADER_LOGO_CSS =
  'header.wp-block-template-part .custom-logo,.is-style-ext-preset--group--natural-1--header-1 .custom-logo{display:none!important}header.wp-block-template-part .wp-block-site-logo,.is-style-ext-preset--group--natural-1--header-1 .wp-block-site-logo{display:none!important}header.wp-block-template-part .as-site-header-logo img,.is-style-ext-preset--group--natural-1--header-1 .as-site-header-logo img{width:auto!important;max-width:min(500px,66vw)!important;max-height:clamp(88px,12vh,124px)!important;height:auto!important;object-fit:contain;display:block!important}.as-site-header-logo{display:inline-flex;align-items:center;line-height:0;text-decoration:none}.is-style-ext-preset--group--natural-1--header-1 .wp-block-site-title{display:none!important}';

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
  async ({ hero, mediaId, premiumCss, heroJs, phoneJs, zoomJs, headerLogoCss }) => {
    const logoHtml = `<!-- wp:html -->
<a class="as-site-header-logo" href="https://aerosuite.com.br/" aria-label="Aero Suite">
  <img src="${hero}" alt="Aero Suite" width="500" height="130" decoding="async" loading="eager"/>
</a>
<!-- /wp:html -->`;

    let header = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//header?context=edit' }))
      .content.raw;

    header = header.replace(
      /width="(?:210|320|380|440)" height="(?:54|82|98|114)"/g,
      'width="500" height="130"',
    );

    header = header.replace(
      /<!-- wp:site-logo[^]*?<!-- \/wp:site-logo -->|<!-- wp:site-logo \{[^}]+\} \/-->/g,
      logoHtml,
    );
    header = header.replace(/<!-- wp:site-title[^]*?<!-- \/wp:site-title -->/g, '');
    header = header.replace(/<!-- wp:site-title \{[^}]+\} \/-->\n?/g, '');

    if (header.includes('id="aerosuite-critical-css"')) {
      header = header.replace(
        /(<style id="aerosuite-critical-css">)([\s\S]*?)(<\/style>)/,
        (_, open, body, close) => {
          const stripped = body
            .replace(/\.as-site-header-logo[\s\S]*?wp-block-site-title\{display:none!important\}/, '')
            .replace(/header\.wp-block-template-part \.custom-logo[\s\S]*?wp-block-site-title\{display:none!important\}/, '');
          return open + stripped + headerLogoCss + close;
        },
      );
    }

    await wp.apiFetch({
      path: '/wp/v2/template-parts/extendable//header?id=extendable//header',
      method: 'POST',
      data: { content: header },
    });

    let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' }))
      .content.raw;
    footer = footer.replace(/<style id="aerosuite-hero-logo-pos">[\s\S]*?<\/style>\n?/g, '');
    const block = `<!-- wp:html -->
<style id="aerosuite-premium-css">${premiumCss}</style>
<script id="aerosuite-phone-mask-js">${phoneJs}</script>
<script id="aerosuite-showcase-zoom-js">${zoomJs}</script>
<script id="aerosuite-hero-js">${heroJs}</script>
<!-- /wp:html -->
`;
    if (footer.includes('aerosuite-premium-css')) {
      footer = footer.replace(
        /<!-- wp:html -->[\s\S]*?aerosuite-premium-css[\s\S]*?<!-- \/wp:html -->/,
        block.trim(),
      );
    } else {
      footer = block + footer;
    }
    await wp.apiFetch({
      path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer',
      method: 'POST',
      data: { content: footer },
    });

    await wp.apiFetch({
      path: '/wp/v2/settings',
      method: 'POST',
      data: { site_logo: mediaId, custom_logo: mediaId },
    });

    return {
      ok: true,
      headerHasFixedLogo: header.includes('as-site-header-logo'),
      headerLen: header.length,
      footerLen: footer.length,
    };
  },
  { hero, mediaId, premiumCss, heroJs, phoneJs, zoomJs, headerLogoCss: HEADER_LOGO_CSS },
);

fs.writeFileSync(path.join(dir, 'header-logo-fix-result.json'), JSON.stringify(result, null, 2));
console.log('FIX_OK', JSON.stringify(result));
await browser.close();

spawnSync(process.execPath, ['run-force-home-refresh.mjs'], { cwd: dir, stdio: 'inherit' });
