/**
 * Publica pacote gaps no WordPress (janela visível — faça login se pedir).
 * Uso: node run-gaps-deploy-inline.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const deployCode = fs.readFileSync(path.join(dir, '.deploy-gaps-once.js'), 'utf8');

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
  process.stderr.write(
    `Aguardando login wp-admin (${Math.round((Date.now() - started) / 1000)}s)...\r`
  );
  await page.waitForTimeout(2000);
}

if (page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN');
  await browser.close();
  process.exit(2);
}

await context.storageState({ path: storage });

await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, {
  timeout: 120000,
});

console.log('Executando deploy gaps (~' + Math.round(deployCode.length / 1024) + ' KB)...');
const result = await page.evaluate(async (code) => eval(code), deployCode);

fs.writeFileSync(path.join(dir, 'gaps-deploy-result.json'), JSON.stringify(result, null, 2));
console.log('DEPLOY_OK', JSON.stringify(result));
await browser.close();
