/**
 * Envia logo Bellows para a biblioteca de mídia do WordPress.
 * Uso: node run-upload-bellows-logo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const logoPath = path.join(dir, 'static', 'portfolio', 'bellows-logo-redondo.png');
const outJson = path.join(dir, 'bellows-media.json');

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  process.exit(2);
}
if (!fs.existsSync(logoPath)) {
  console.error('MISSING_LOGO', logoPath);
  process.exit(2);
}

const bytes = fs.readFileSync(logoPath);
const base64 = bytes.toString('base64');

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const page = await context.newPage();

await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
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
  const existing = await wp.apiFetch({
    path: '/wp/v2/media?search=bellows-logo-redondo&per_page=5',
  });
  if (existing && existing.length) {
    const hit = existing.find((m) => m.slug && m.slug.indexOf('bellows') !== -1) || existing[0];
    return { ok: true, reused: true, id: hit.id, url: hit.source_url, slug: hit.slug };
  }

  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const blob = new Blob([arr], { type: 'image/png' });
  const form = new FormData();
  form.append('file', blob, fileName);
  form.append('title', 'Bellows — Serviços Aeronáuticos');
  form.append('alt_text', 'Logo Bellows Serviços Aeronáuticos');

  const res = await fetch(wpApiSettings.root + 'wp/v2/media', {
    method: 'POST',
    headers: { 'X-WP-Nonce': wpApiSettings.nonce },
    body: form,
    credentials: 'same-origin',
  });
  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, status: res.status, err: errText.slice(0, 500) };
  }
  const media = await res.json();
  return { ok: true, reused: false, id: media.id, url: media.source_url, slug: media.slug };
}, { b64: base64, fileName: 'bellows-logo-redondo.png' });

fs.writeFileSync(
  outJson,
  JSON.stringify({ generatedAt: new Date().toISOString(), ...result }, null, 2)
);
console.log('UPLOAD_OK', JSON.stringify(result));
await browser.close();

if (!result.ok) process.exit(4);
