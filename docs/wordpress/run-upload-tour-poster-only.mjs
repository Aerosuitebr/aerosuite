/**
 * Envia apenas o poster do tour (JPEG) via wp.apiFetch e imprime a URL.
 * Uso: node run-upload-tour-poster-only.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');

const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const posterPath = path.join(dir, 'static', 'aerosuite-tour-video-poster-v2.jpg');
const fallbackPoster = path.join(dir, 'static', 'aerosuite-tour-video-poster.jpg');
const filePath = process.argv[2] ? path.resolve(process.argv[2]) : posterPath;

if (!fs.existsSync(filePath)) {
  console.error('MISSING poster:', filePath);
  process.exit(2);
}

const b64 = fs.readFileSync(filePath).toString('base64');
const browser = await pw.chromium.launch({ headless: false });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : {}
);
const page = await context.newPage();

await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

const loginWaitMs = 180000;
const started = Date.now();
while (page.url().includes('wp-login') && Date.now() - started < loginWaitMs) {
  process.stderr.write(`Aguardando login wp-admin (${Math.round((Date.now() - started) / 1000)}s)...\r`);
  await page.waitForTimeout(2000);
}

if (page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN');
  await browser.close();
  process.exit(3);
}

await context.storageState({ path: storage });
await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, {
  timeout: 120000,
});

const upload = await page.evaluate(async ({ b64Data, fileName }) => {
  const search = await wp.apiFetch({
    path: '/wp/v2/media?search=aerosuite-tour-video-poster-v2&per_page=20',
  });
  const hit = search?.find((m) => m.slug?.includes('aerosuite-tour-video-poster-v2'));
  if (hit?.source_url) return { url: hit.source_url, id: hit.id, reused: true };

  const bin = atob(b64Data);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const fd = new FormData();
  fd.append('file', new Blob([arr], { type: 'image/jpeg' }), fileName);
  fd.append('title', 'Aero Suite — poster tour em vídeo');
  fd.append('alt_text', 'Prévia do tour em vídeo Aero Suite');
  const media = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
  return { url: media.source_url, id: media.id, reused: false };
}, { b64Data: b64, fileName: path.basename(filePath) });

console.log(JSON.stringify(upload, null, 2));
await browser.close();
