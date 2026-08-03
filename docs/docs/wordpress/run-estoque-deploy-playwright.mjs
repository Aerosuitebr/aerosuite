/**
 * Deploy estoque via Playwright no wp-admin (usa wp-storage.json se existir).
 * Uso: node run-estoque-deploy-playwright.mjs
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
const loginWaitMs = Number(process.env.WP_LOGIN_WAIT_MS || 120000);

const j = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-estoque-deploy-chunks.json'), 'utf8'));

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
    process.stderr.write(`Aguardando login (${Math.round((Date.now() - started) / 1000)}s)...\r`);
  }
  await page.waitForTimeout(2000);
}

if (page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN', page.url());
  await browser.close();
  process.exit(2);
}

await context.storageState({ path: storage });

async function evalExpr(expr) {
  return page.evaluate(async (code) => {
    // eslint-disable-next-line no-eval
    return await eval('(' + code + ')');
  }, expr);
}

const results = [];
results.push(await evalExpr(j.init));
for (let i = 0; i < j.chunks.length; i++) {
  results.push(await evalExpr(j.chunks[i]));
  console.log('chunk', i, 'ok');
}
const url = await evalExpr(j.upload);
console.log('upload', url);
const apply = await evalExpr(j.apply);
console.log('apply', JSON.stringify(apply));

fs.writeFileSync(path.join(dir, 'estoque-deploy-result.json'), JSON.stringify({ url, apply, results }, null, 2));
await browser.close();
