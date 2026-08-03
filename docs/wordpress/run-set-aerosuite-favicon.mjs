/**
 * Envia favicon Aero Suite e define Site Icon no WordPress (abas do navegador).
 * Uso: node build-site-icon-assets.mjs && node run-set-aerosuite-favicon.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const iconPath = path.join(dir, 'static', 'aerosuite-site-icon-512.png');
const outJson = path.join(dir, 'aerosuite-favicon-media.json');

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  process.exit(2);
}
if (!fs.existsSync(iconPath)) {
  console.error('MISSING_ICON', iconPath, '— rode: node build-site-icon-assets.mjs');
  process.exit(2);
}

const base64 = fs.readFileSync(iconPath).toString('base64');

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const page = await context.newPage();

await page.goto('https://aerosuite.com.br/wp-admin/options-general.php', {
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

const result = await page.evaluate(async ({ b64, fileName }) => {
  let mediaId = null;
  let mediaUrl = null;
  let slug = null;

  const existing = await wp.apiFetch({
    path: '/wp/v2/media?search=aerosuite-site-icon&per_page=10',
  });
  const hit =
    existing &&
    existing.find((m) => m.slug && m.slug.indexOf('aerosuite-site-icon') !== -1);
  if (hit) {
    mediaId = hit.id;
    mediaUrl = hit.source_url;
    slug = hit.slug;
  } else {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: 'image/png' });
    const form = new FormData();
    form.append('file', blob, fileName);
    form.append('title', 'Aero Suite — ícone do site');
    form.append('alt_text', 'Símbolo Aero Suite');

    const res = await fetch(wpApiSettings.root + 'wp/v2/media', {
      method: 'POST',
      headers: { 'X-WP-Nonce': wpApiSettings.nonce },
      body: form,
      credentials: 'same-origin',
    });
    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, step: 'upload', status: res.status, err: errText.slice(0, 500) };
    }
    const media = await res.json();
    mediaId = media.id;
    mediaUrl = media.source_url;
    slug = media.slug;
  }

  try {
    await wp.apiFetch({
      path: '/wp/v2/settings',
      method: 'POST',
      data: { site_icon: mediaId },
    });
  } catch (settingsErr) {
    return {
      ok: false,
      step: 'settings',
      mediaId,
      mediaUrl,
      err: String(settingsErr.message || settingsErr),
    };
  }

  return { ok: true, mediaId, mediaUrl, slug, siteIconSet: true };
}, { b64: base64, fileName: 'aerosuite-site-icon-512.png' });

fs.writeFileSync(
  outJson,
  JSON.stringify({ generatedAt: new Date().toISOString(), ...result }, null, 2)
);
console.log('FAVICON_OK', JSON.stringify(result));
await browser.close();

if (!result.ok) process.exit(4);
