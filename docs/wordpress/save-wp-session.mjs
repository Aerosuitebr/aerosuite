/**
 * Salva wp-storage.json a partir do perfil persistente (.wp-browser-profile)
 * ou abre wp-admin headed se a sessão expirou.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');

const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const userDataDir = path.join(dir, '.wp-browser-profile');

async function saveIfLoggedIn(page, context) {
  const url = page.url();
  if (url.includes('wp-login')) return false;
  if (!url.includes('wp-admin')) {
    await page.goto('https://aerosuite.com.br/wp-admin/', {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    if (page.url().includes('wp-login')) return false;
  }
  await context.storageState({ path: storage });
  return true;
}

async function main() {
  let context = await pw.chromium.launchPersistentContext(userDataDir, {
    headless: true,
    viewport: { width: 1280, height: 900 },
  });
  let page = context.pages()[0] || (await context.newPage());
  await page.goto('https://aerosuite.com.br/wp-admin/', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });

  if (await saveIfLoggedIn(page, context)) {
    console.log('SESSION_OK', storage);
    await context.close();
    return;
  }

  await context.close();
  console.log('Abrindo navegador para login (perfil Playwright)...');
  context = await pw.chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 900 },
  });
  page = context.pages()[0] || (await context.newPage());
  await page.goto('https://aerosuite.com.br/wp-login.php', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });

  const started = Date.now();
  while (Date.now() - started < 5 * 60 * 1000) {
    await page.waitForTimeout(2000);
    if (!page.url().includes('wp-login')) break;
  }

  if (!(await saveIfLoggedIn(page, context))) {
    console.error('SESSION_FAIL — faça login na janela Playwright e rode de novo.');
    await context.close();
    process.exit(2);
  }

  console.log('SESSION_OK', storage);
  await context.close();
}

main().catch((e) => {
  console.error('SESSION_FAIL', e.message);
  process.exit(1);
});
