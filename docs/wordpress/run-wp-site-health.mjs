/**
 * Lê versão PHP e plugins ativos via wp-admin (sessão wp-storage.json).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  process.exit(2);
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const page = await context.newPage();

await page.goto('https://aerosuite.com.br/wp-admin/site-health.php?tab=debug', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

if (page.url().includes('wp-login')) {
  console.error('SESSION_EXPIRED');
  await browser.close();
  process.exit(3);
}

const info = await page.evaluate(() => {
  const text = document.body.innerText || '';
  const phpMatch = text.match(/Versão do PHP[^\d]*(\d+\.\d+\.\d+)/i) || text.match(/PHP version[^\d]*(\d+\.\d+\.\d+)/i);
  const wpMatch = text.match(/Versão do WordPress[^\d]*(\d+\.\d+(?:\.\d+)?)/i) || text.match(/WordPress version[^\d]*(\d+\.\d+(?:\.\d+)?)/i);
  return {
    php: phpMatch ? phpMatch[1] : null,
    wp: wpMatch ? wpMatch[1] : null,
    snippet: text.slice(0, 2500),
  };
});

const plugins = await page.evaluate(async () => {
  if (typeof wp === 'undefined' || !wp.apiFetch) return { error: 'no apiFetch' };
  try {
    const list = await wp.apiFetch({ path: '/wp/v2/plugins' });
    return list
      .filter((p) => p.status === 'active')
      .map((p) => ({ name: p.name, plugin: p.plugin, version: p.version }));
  } catch (e) {
    return { error: String(e.message || e) };
  }
});

await page.goto('https://aerosuite.com.br/wp-admin/admin.php?page=wpforms-overview', {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});

const wpformsNote = await page.evaluate(() => document.body.innerText.slice(0, 1500));

const out = { at: new Date().toISOString(), info, plugins, wpformsNote };
fs.writeFileSync(path.join(dir, 'wp-site-health-result.json'), JSON.stringify(out, null, 2));
console.log('HEALTH_OK', JSON.stringify(out, null, 2));
await browser.close();
