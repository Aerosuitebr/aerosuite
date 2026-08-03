/**
 * Publica pacote marketing no WordPress (requer sessão wp-admin).
 * Uso: node run-marketing-deploy.mjs
 * Login manual: $env:WP_HEADED='1'; node run-marketing-deploy.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = process.env.WP_STORAGE || path.join(dir, 'wp-storage.json');
const headed = process.env.WP_HEADED !== '0';
const deployUrl =
  process.env.DEPLOY_SCRIPT_URL || 'http://127.0.0.1:8765/.deploy-marketing-once.js';
const loginWaitMs = Number(process.env.WP_LOGIN_WAIT_MS || 180000);

const browser = await pw.chromium.launch({ headless: !headed });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : {}
);
const page = await context.newPage();

await page.goto('https://aerosuite.com.br/wp-admin/', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

const started = Date.now();
while (page.url().includes('wp-login') && Date.now() - started < loginWaitMs) {
  if (headed) {
    process.stderr.write(
      `Aguardando login no wp-admin (${Math.round((Date.now() - started) / 1000)}s)...\r`
    );
  }
  await page.waitForTimeout(2000);
  await page.goto('https://aerosuite.com.br/wp-admin/', { waitUntil: 'domcontentloaded' });
}

if (page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN', page.url());
  await browser.close();
  process.exit(2);
}

await context.storageState({ path: storage });

const hasWp = await page.evaluate(() => typeof wp !== 'undefined' && !!wp.apiFetch);
if (!hasWp) {
  await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
}

const result = await page.evaluate(async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error('fetch deploy: ' + r.status);
  const code = await r.text();
  return await eval(code);
}, deployUrl);

fs.writeFileSync(path.join(dir, 'marketing-deploy-result.json'), JSON.stringify(result, null, 2));
console.log('DEPLOY_OK', JSON.stringify(result).slice(0, 500));
await browser.close();
