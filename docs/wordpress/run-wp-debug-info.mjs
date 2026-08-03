/**
 * Copia Info do Site Health (PHP, extensões) via wp-admin.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const page = await context.newPage();

await page.goto('https://aerosuite.com.br/wp-admin/site-health.php?tab=debug', {
  waitUntil: 'networkidle',
  timeout: 120000,
});

const debug = await page.evaluate(() => {
  const pre = document.querySelector('#health-check-debug pre, .health-check-debug pre, textarea.health-check-debug');
  if (pre) return pre.textContent || pre.innerText || '';
  return document.body.innerText;
});

const filtered = debug
  .split('\n')
  .filter((line) => /php|wpforms|mail|smtp|error|extension|mysqli|pdo|xml|mbstring/i.test(line))
  .slice(0, 120)
  .join('\n');

const out = { at: new Date().toISOString(), filtered, len: debug.length };
fs.writeFileSync(path.join(dir, 'wp-debug-info-result.json'), JSON.stringify(out, null, 2));
console.log('DEBUG_INFO_OK\n', filtered.slice(0, 4000));
await browser.close();
