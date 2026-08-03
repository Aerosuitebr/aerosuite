/**
 * Envia screenshots/web/*.webp para WordPress, atualiza MEDIA em site-config e republica home/soluções.
 * Uso: node run-screenshots-wp-deploy.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');

const dir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(dir, 'screenshots', 'web');
const storage = path.join(dir, 'wp-storage.json');
const configPath = path.join(dir, 'aerosuite-site-config.mjs');
const resultPath = path.join(dir, 'screenshots-upload-result.json');

const UPLOADS = [
  { key: 'dashboard', file: 'dashboard-web.webp', title: 'Aero Suite — Dashboard operacional v3' },
  { key: 'os', file: 'os-list-web.webp', title: 'Aero Suite — Ordens de serviço v3' },
  { key: 'estoque', file: 'estoque-fifo-web.webp', title: 'Aero Suite — Estoque FIFO v3' },
  { key: 'propostas', file: 'propostas-comerciais-web.webp', title: 'Aero Suite — Propostas comerciais v3' },
  { key: 'conformidade', file: 'conformidade-painel-web.webp', title: 'Aero Suite — Painel conformidade v3' },
  { key: 'portal', file: 'portal-cliente-web.webp', title: 'Aero Suite — Portal conformidade v3' },
];

for (const u of UPLOADS) {
  const p = path.join(webDir, u.file);
  if (!fs.existsSync(p)) {
    console.error('MISSING', p, '— rode: node recapture-all-screenshots.mjs');
    process.exit(1);
  }
}

async function uploadAll(page) {
  const payloads = UPLOADS.map((u) => ({
    ...u,
    b64: fs.readFileSync(path.join(webDir, u.file)).toString('base64'),
  }));

  return page.evaluate(async (items) => {
    const urls = {};
    for (const item of items) {
      const bin = atob(item.b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const fd = new FormData();
      fd.append('file', new Blob([arr], { type: 'image/webp' }), item.file);
      fd.append('title', item.title);
      fd.append('alt_text', item.title);
      const m = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
      urls[item.key] = m.source_url;
    }
    return urls;
  }, payloads);
}

function patchSiteConfig(urls) {
  let src = fs.readFileSync(configPath, 'utf8');
  const map = {
    dashboard: urls.dashboard,
    os: urls.os,
    estoque: urls.estoque,
    propostas: urls.propostas,
    conformidade: urls.conformidade,
    portal: urls.portal,
  };
  for (const [key, url] of Object.entries(map)) {
    if (!url) continue;
    const re = new RegExp(`(${key}:\\s*')[^']*(')`, 'm');
    if (re.test(src)) {
      src = src.replace(re, `$1${url}$2`);
    } else if (key === 'conformidade') {
      src = src.replace(
        /(propostas:\s*'[^']+',)/,
        `$1\n  conformidade: '${url}',\n  portal: '${urls.portal || url}',`
      );
    } else if (key === 'portal') {
      /* inserted with conformidade */
    }
  }
  fs.writeFileSync(configPath, src);
}

async function main() {
  if (!fs.existsSync(storage)) {
    console.error('MISSING wp-storage.json — faça login WP antes');
    process.exit(2);
  }

  const browser = await pw.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: storage });
  const page = await ctx.newPage();

  await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (page.url().includes('wp-login')) {
    console.error('SESSION_EXPIRED');
    await browser.close();
    process.exit(3);
  }
  await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

  const urls = await uploadAll(page);
  await browser.close();

  fs.writeFileSync(resultPath, JSON.stringify({ at: new Date().toISOString(), urls }, null, 2));
  console.log('UPLOAD_OK', urls);

  patchSiteConfig(urls);

  const build = spawnSync(process.execPath, ['build-gaps-deploy.mjs'], { cwd: dir, stdio: 'inherit' });
  if (build.status !== 0) process.exit(build.status ?? 1);

  const deploy = spawnSync(process.execPath, ['run-gaps-deploy.mjs'], { cwd: dir, stdio: 'inherit' });
  if (deploy.status !== 0) process.exit(deploy.status ?? 1);

  console.log('SCREENSHOTS_DEPLOY_OK');
}

main().catch((e) => {
  console.error('SCREENSHOTS_DEPLOY_FAIL', e.message);
  process.exit(1);
});
