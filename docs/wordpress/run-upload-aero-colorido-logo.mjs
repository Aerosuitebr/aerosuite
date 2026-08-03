/**
 * Envia Aero_Colorido.png para o WordPress e substitui o logo hero em páginas e chrome.
 * Uso: node run-upload-aero-colorido-logo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..', '..');
const storage = path.join(dir, 'wp-storage.json');
const logoPath = path.join(root, 'frontend', 'src', 'assets', 'Aero_Colorido.png');
const outJson = path.join(dir, 'aerosuite-logo-media.json');
const ORIGIN = 'https://aerosuite.com.br';
const PAGE_IDS = [21, 20, 16, 18];
const OLD_LOGO_RE =
  /https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"'\\s]*(hero-logo-transparent|Pictureandletter|aerosuite-logo-light|aero-colorido|Aero_Colorido|aerosuite-pictureandletter)[^"'\\s]*/gi;

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  process.exit(2);
}
if (!fs.existsSync(logoPath)) {
  console.error('MISSING_LOGO', logoPath);
  process.exit(2);
}

const base64 = fs.readFileSync(logoPath).toString('base64');

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const page = await context.newPage();

await page.goto(`${ORIGIN}/wp-admin/post.php?post=21&action=edit`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

if (page.url().includes('wp-login')) {
  console.error('SESSION_EXPIRED');
  await browser.close();
  process.exit(3);
}

await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, {
  timeout: 120000,
});

const result = await page.evaluate(
  async ({ b64, fileName, pageIds, oldLogoReSource }) => {
    const oldLogoRe = new RegExp(oldLogoReSource, 'gi');

    async function uploadLogo() {
      const search = await wp.apiFetch({
        path: '/wp/v2/media?search=aero-colorido-logo&per_page=10',
      });
      const hit =
        search?.find((m) => m.slug?.includes('aero-colorido')) ||
        search?.find((m) => m.title?.rendered?.includes('Aero Suite — logo colorido'));
      if (hit?.source_url) {
        return { url: hit.source_url, id: hit.id, reused: true };
      }

      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const fd = new FormData();
      fd.append('file', new Blob([arr], { type: 'image/png' }), fileName);
      fd.append('title', 'Aero Suite — logo colorido');
      fd.append('alt_text', 'Aero Suite — logotipo colorido');
      const media = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
      return { url: media.source_url, id: media.id, reused: false };
    }

    function replaceLogoUrls(content, hero) {
      if (!content) return { content, count: 0 };
      const before = content;
      const next = content.replace(oldLogoRe, hero);
      return { content: next, count: before === next ? 0 : 1 };
    }

    const upload = await uploadLogo();
    const hero = upload.url;
    const pages = {};

    for (const id of pageIds) {
      const raw = (await wp.apiFetch({ path: `/wp/v2/pages/${id}?context=edit` })).content?.raw || '';
      const { content, count } = replaceLogoUrls(raw, hero);
      if (count) {
        await wp.apiFetch({ path: `/wp/v2/pages/${id}`, method: 'POST', data: { content } });
      }
      pages[id] = { updated: count > 0, len: content.length };
    }

    const templateParts = {};
    for (const part of ['extendable//header', 'extendable//footer']) {
      try {
        const tp = await wp.apiFetch({ path: `/wp/v2/template-parts/${part}?context=edit` });
        let raw = tp.content?.raw || '';
        const { content, count } = replaceLogoUrls(raw, hero);
        if (count) {
          await wp.apiFetch({
            path: `/wp/v2/template-parts/${part}?id=${part}`,
            method: 'POST',
            data: { content },
          });
        }
        templateParts[part] = { updated: count > 0, len: content.length };
      } catch (err) {
        templateParts[part] = { error: String(err.message || err) };
      }
    }

    let purge = { ok: false };
    try {
      await wp.apiFetch({ path: '/litespeed/v1/tool/purge_all', method: 'GET' });
      purge = { ok: true };
    } catch (err) {
      purge = { ok: false, err: String(err.message || err) };
    }

    return { ok: true, hero, upload, pages, templateParts, purge };
  },
  {
    b64: base64,
    fileName: 'aero-colorido-logo.png',
    pageIds: PAGE_IDS,
    oldLogoReSource: OLD_LOGO_RE.source,
  },
);

fs.writeFileSync(
  outJson,
  JSON.stringify({ generatedAt: new Date().toISOString(), ...result }, null, 2),
);
console.log('UPLOAD_OK', JSON.stringify(result));

await browser.close();

if (!result.ok) process.exit(4);

spawnSync(process.execPath, ['sync-aero-colorido-logo-config.mjs'], {
  cwd: dir,
  stdio: 'inherit',
});
