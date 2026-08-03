/**
 * Publica pacote marketing no WordPress (eval inline — evita mixed-content fetch).
 * Uso: node run-marketing-deploy-inline.mjs
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
const loginWaitMs = Number(process.env.WP_LOGIN_WAIT_MS || 180000);
const deployCode = fs.readFileSync(path.join(dir, '.deploy-marketing-once.js'), 'utf8');

const browser = await pw.chromium.launch({ headless: !headed });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : {}
);
const page = await context.newPage();

await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

const started = Date.now();
while (page.url().includes('wp-login') && Date.now() - started < loginWaitMs) {
  if (headed) {
    process.stderr.write(
      `Aguardando login no wp-admin (${Math.round((Date.now() - started) / 1000)}s) — não recarregue, só faça login na janela...\r`
    );
  }
  await page.waitForTimeout(2000);
}

if (page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN', page.url());
  await browser.close();
  process.exit(2);
}

await context.storageState({ path: storage });

await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, {
  timeout: 120000,
});

console.log('Executando deploy marketing (~' + Math.round(deployCode.length / 1024) + ' KB)...');
const result = await page.evaluate(async (code) => eval(code), deployCode);

fs.writeFileSync(path.join(dir, 'marketing-deploy-result.json'), JSON.stringify(result, null, 2));
console.log('DEPLOY_OK', JSON.stringify(result));
await browser.close();
