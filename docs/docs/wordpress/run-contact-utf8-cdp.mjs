#!/usr/bin/env node
/** Emite comandos para colar no CDP — ou use com playwright se tiver storage. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const deploy = fs.readFileSync(path.join(dir, '.deploy-contact-utf8-once.js'), 'utf8');

async function main() {
  const pw = require('playwright-core');
  const storage = path.join(dir, 'wp-storage.json');
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext(
    fs.existsSync(storage) ? { storageState: storage } : {}
  );
  const page = await context.newPage();
  await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=18&action=edit', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (page.url().includes('wp-login')) {
    console.error('NOT_LOGGED_IN');
    process.exit(2);
  }
  const value = await page.evaluate(async (code) => {
    let v = eval(code);
    if (v && typeof v.then === 'function') v = await v;
    return v;
  }, deploy);
  console.log(JSON.stringify(value, null, 2));
  await context.storageState({ path: storage });
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
