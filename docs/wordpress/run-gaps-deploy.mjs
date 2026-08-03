/**
 * Publica pacote de lacunas (blog, legal, comparativo, obrigado, home, footer).
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

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  process.exit(2);
}

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

const result = await page.evaluate(async (code) => eval(code), deployCode);
fs.writeFileSync(path.join(dir, 'gaps-deploy-result.json'), JSON.stringify(result, null, 2));
console.log('DEPLOY_OK', JSON.stringify(result));
await browser.close();
