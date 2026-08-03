import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..', '..');

function read(rel) {
  return fs.readFileSync(path.join(dir, rel), 'utf8');
}

function readB64(abs) {
  return fs.readFileSync(abs).toString('base64');
}

const assets = {
  css: read('aerosuite-premium.css'),
  js: read('aerosuite-phone-mask.js'),
  showcase: read('snippets/showcase-modules.html'),
  cta: read('snippets/cta-band.html'),
  logoB64: readB64(path.join(root, 'frontend/src/assets/Pictureandletter.png')),
  logoName: 'aerosuite-pictureandletter.png',
  logoMime: 'image/png',
  markB64: readB64(path.join(root, 'frontend/src/assets/LOGO_AERO.png')),
  markName: 'aerosuite-logo-aero.png',
  markMime: 'image/png',
  bgB64: readB64(path.join(root, 'frontend/src/assets/aero-suite-bg-deco.svg')),
  bgName: 'aerosuite-bg-deco.svg',
  bgMime: 'image/svg+xml',
};

const out = path.join(dir, 'eval-bundle.js');
const body = `window.aerosuiteDeploy = async function() {
  const assets = ${JSON.stringify(assets)};

  async function uploadB64(name, mime, b64) {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const fd = new FormData();
    fd.append('file', new Blob([arr], { type: mime }), name);
    fd.append('title', name.replace(/\\.[^.]+$/, ''));
    const media = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
    return media.source_url;
  }

  function htmlBlock(inner) {
    return '<!-- wp:html -->\\n' + inner.trim() + '\\n<!-- /wp:html -->';
  }

  const urls = {
    css: await uploadB64('aerosuite-premium.css', 'text/css', btoa(unescape(encodeURIComponent(assets.css)))),
    js: await uploadB64('aerosuite-phone-mask.js', 'application/javascript', btoa(unescape(encodeURIComponent(assets.js)))),
    logo: await uploadB64(assets.logoName, assets.logoMime, assets.logoB64),
    logoMark: await uploadB64(assets.markName, assets.markMime, assets.markB64),
    bg: await uploadB64(assets.bgName, assets.bgMime, assets.bgB64),
  };

  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  footer = footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium[\\s\\S]*?<!-- \\/wp:html -->/g, '');
  const assetBlock = '<!-- wp:html -->\\n<link rel="stylesheet" href="' + urls.css + '" id="aerosuite-premium-css" />\\n<script src="' + urls.js + '" id="aerosuite-phone-mask-js" defer></script>\\n<!-- /wp:html -->\\n';
  if (!footer.includes('aerosuite-premium-css')) footer = assetBlock + footer;
  await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer', method: 'POST', data: { content: footer } });

  const heroImg = urls.logo;
  const markImg = urls.logoMark;
  const showcase = assets.showcase;
  const cta = assets.cta;

  const homeContent = ${JSON.stringify('')}; // placeholder replaced below
  return { ok: true, urls };
};
`;

// Build page contents separately in browser-deploy style - embed from browser-deploy.js logic
// Simpler: read browser-deploy.js and append - actually inline full page strings in generate script

import { readFileSync } from 'fs';
const deployPages = readFileSync(path.join(dir, 'page-blocks.mjs'), 'utf8');
// We'll create page-blocks.mjs

fs.writeFileSync(out, '// generated - run: await aerosuiteDeploy()\n' + body);
console.log('Wrote', out, fs.statSync(out).size);
