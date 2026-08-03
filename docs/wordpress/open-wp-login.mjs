/**
 * Abre wp-admin UMA vez e aguarda sinal de login (sem recarregar a página).
 *
 * 1. node open-wp-login.mjs
 * 2. Faça login na janela que abrir
 * 3. Quando terminar, crie o arquivo de sinal:
 *    echo ok > .wp-login-ready
 *    (ou peça ao agente no chat: "loguei")
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = process.env.WP_STORAGE || path.join(dir, 'wp-storage.json');
const readyFile = path.join(dir, '.wp-login-ready');
const userDataDir = path.join(dir, '.wp-browser-profile');

if (fs.existsSync(readyFile)) fs.unlinkSync(readyFile);

console.log('Abrindo navegador (sem recarregar durante o login)...');
console.log('URL: https://aerosuite.com.br/wp-login.php');
console.log('');
console.log('Quando terminar o login, avise no chat ou execute:');
console.log('  echo ok > .wp-login-ready');

const context = await pw.chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: { width: 1280, height: 900 },
});
const page = context.pages()[0] || (await context.newPage());

await page.goto('https://aerosuite.com.br/wp-login.php', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

const started = Date.now();
while (Date.now() - started < 30 * 60 * 1000) {
  if (fs.existsSync(readyFile)) break;
  await page.waitForTimeout(1500);
}

if (!fs.existsSync(readyFile) && page.url().includes('wp-login')) {
  console.error('TIMEOUT — confirme o login criando .wp-login-ready ou avise no chat.');
  await context.close();
  process.exit(2);
}

if (!page.url().includes('wp-admin')) {
  await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
}

await context.storageState({ path: storage });
if (fs.existsSync(readyFile)) fs.unlinkSync(readyFile);

console.log('LOGIN_OK — sessão salva em wp-storage.json');
console.log('Pode fechar a janela ou deixá-la aberta; avise no chat para rodar o deploy.');

await context.close();
process.exit(0);
