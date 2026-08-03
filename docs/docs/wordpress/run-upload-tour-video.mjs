/**
 * Envia poster + MP4 do tour para a biblioteca WordPress e grava aerosuite-tour-video-media.json.
 *
 * Uso:
 *   node run-upload-tour-video.mjs
 *   node run-upload-tour-video.mjs "D:\caminho\para\video.mp4"
 *
 * Requer: wp-storage.json (sessão WP admin) e playwright-core.
 * O MP4 sobe via interface nativa do WP (setInputFiles), não via base64.
 * Por padrão usa a versão web comprimida em static/ (~28 MB); passe outro caminho se quiser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');

const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const mediaJson = path.join(dir, 'aerosuite-tour-video-media.json');
const posterPath = path.join(dir, 'static', 'aerosuite-tour-video-poster.jpg');
const webVideoPath = path.join(dir, 'static', 'aerosuite-tour-cinematic.web.mp4');
const sourceVideoPath = path.join(
  'D:',
  'Desenvolvimento',
  'Aero_videos',
  'drive-download-20260708T210407Z-3-001',
  'AeroSuiteVideo com intro e end.mp4',
);

const videoPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : fs.existsSync(webVideoPath)
    ? webVideoPath
    : sourceVideoPath;
const ORIGIN = 'https://aerosuite.com.br';

if (!fs.existsSync(storage)) {
  console.error('MISSING wp-storage.json — faça login WP antes.');
  process.exit(2);
}
if (!fs.existsSync(posterPath)) {
  console.error('MISSING poster:', posterPath);
  process.exit(2);
}
if (!fs.existsSync(videoPath)) {
  console.error('MISSING video:', videoPath);
  process.exit(2);
}

const posterB64 = fs.readFileSync(posterPath).toString('base64');
const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const page = await context.newPage();

async function ensureAdmin() {
  await page.goto(`${ORIGIN}/wp-admin/post.php?post=21&action=edit`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (page.url().includes('wp-login')) {
    console.error('SESSION_EXPIRED');
    process.exit(3);
  }
  await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, {
    timeout: 120000,
  });
}

async function uploadPoster() {
  return page.evaluate(async ({ b64, fileName }) => {
    const search = await wp.apiFetch({
      path: '/wp/v2/media?search=aerosuite-tour-video-poster&per_page=10',
    });
    const hit = search?.find((m) => m.slug?.includes('aerosuite-tour-video-poster'));
    if (hit?.source_url) return { url: hit.source_url, id: hit.id, reused: true };

    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const fd = new FormData();
    fd.append('file', new Blob([arr], { type: 'image/jpeg' }), fileName);
    fd.append('title', 'Aero Suite — poster tour em vídeo');
    fd.append('alt_text', 'Prévia do tour em vídeo Aero Suite');
    const media = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
    return { url: media.source_url, id: media.id, reused: false };
  }, { b64: posterB64, fileName: 'aerosuite-tour-video-poster.jpg' });
}

async function uploadVideoFile() {
  await page.goto(`${ORIGIN}/wp-admin/media-new.php`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (page.url().includes('wp-login')) {
    throw new Error('SESSION_EXPIRED on media-new');
  }

  const input = page.locator('input[type="file"]#async-upload, input[type="file"].browser.button');
  await input.setInputFiles(videoPath);

  const fileName = path.basename(videoPath);
  await page.waitForFunction(
    (name) => {
      const items = document.querySelectorAll('.media-item, .attachment-preview, .upload-flash-bypass');
      const text = document.body.innerText || '';
      return (
        text.includes('Créditos de') === false &&
        (document.querySelector('.media-success') ||
          document.querySelector('.attachment-details') ||
          Array.from(document.querySelectorAll('a')).some((a) => a.href && a.href.includes(name.replace(/ /g, '%20'))))
      );
    },
    fileName,
    { timeout: 600000 },
  );

  await page.waitForTimeout(3000);

  return page.evaluate(async (slugPart) => {
    const list = await wp.apiFetch({
      path: `/wp/v2/media?search=${encodeURIComponent('AeroSuite')}&per_page=20&orderby=date&order=desc`,
    });
    const hit =
      list?.find((m) => m.mime_type === 'video/mp4' && m.source_url?.includes('AeroSuite')) ||
      list?.find((m) => m.mime_type === 'video/mp4');
    if (!hit?.source_url) {
      return { error: 'video_not_found_in_media', list: list?.map((m) => ({ id: m.id, url: m.source_url })) };
    }
    return { url: hit.source_url, id: hit.id, reused: false };
  }, 'AeroSuite');
}

await ensureAdmin();
console.log('Uploading poster…');
const posterUpload = await uploadPoster();
console.log('Poster OK', posterUpload);

console.log('Uploading video (pode levar vários minutos)…', videoPath);
await ensureAdmin();
const videoUpload = await uploadVideoFile();
if (videoUpload.error) {
  console.error('VIDEO_UPLOAD_FAILED', JSON.stringify(videoUpload, null, 2));
  await browser.close();
  process.exit(4);
}
console.log('Video OK', videoUpload);

const payload = {
  generatedAt: new Date().toISOString(),
  title: 'Tour Aero Suite — gestão MRO em ação',
  durationLabel: '4 min',
  poster: posterUpload.url,
  videoMp4: videoUpload.url,
  posterUpload,
  videoUpload,
};

fs.writeFileSync(mediaJson, JSON.stringify(payload, null, 2));
console.log('WROTE', mediaJson);
console.log('Next: node build-gaps-deploy.mjs && node run-gaps-deploy-inline.mjs');
await browser.close();
