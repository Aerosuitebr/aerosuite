/**
 * Envia Aero_Claro.png para a biblioteca WordPress.
 * Uso: node run-upload-aero-claro-logo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..', '..');
const storage = path.join(dir, 'wp-storage.json');
const logoPath = path.join(root, 'frontend', 'src', 'assets', 'Aero_Claro.png');
const mediaJson = path.join(dir, 'aerosuite-logo-media.json');

if (!fs.existsSync(storage) || !fs.existsSync(logoPath)) {
  console.error('MISSING', { storage: fs.existsSync(storage), logoPath: fs.existsSync(logoPath) });
  process.exit(2);
}

const base64 = fs.readFileSync(logoPath).toString('base64');
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

const upload = await page.evaluate(async ({ b64, fileName }) => {
  const search = await wp.apiFetch({ path: '/wp/v2/media?search=aero-claro-logo&per_page=10' });
  const hit =
    search?.find((m) => m.slug?.includes('aero-claro')) ||
    search?.find((m) => m.title?.rendered?.includes('logo claro'));
  if (hit?.source_url) {
    return { url: hit.source_url, id: hit.id, reused: true };
  }

  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const fd = new FormData();
  fd.append('file', new Blob([arr], { type: 'image/png' }), fileName);
  fd.append('title', 'Aero Suite — logo claro');
  fd.append('alt_text', 'Aero Suite — logotipo claro');
  const media = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
  return { url: media.source_url, id: media.id, reused: false };
}, { b64: base64, fileName: 'aero-claro-logo.png' });

const prev = fs.existsSync(mediaJson) ? JSON.parse(fs.readFileSync(mediaJson, 'utf8')) : {};
fs.writeFileSync(
  mediaJson,
  JSON.stringify(
    {
      ...prev,
      generatedAt: new Date().toISOString(),
      logoLight: upload.url,
      logoLightUpload: upload,
    },
    null,
    2,
  ),
);

fs.copyFileSync(logoPath, path.join(dir, 'static', 'aero-claro-logo.png'));
console.log('UPLOAD_OK', JSON.stringify(upload));
await browser.close();
