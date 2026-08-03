import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');

const browser = await pw.chromium.launch({ headless: true });
const page = await (await browser.newContext({ storageState: storage })).newPage();
await page.goto('https://aerosuite.com.br/wp-admin/site-editor.php', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (page.url().includes('wp-login')) {
  console.error('SESSION_EXPIRED');
  process.exit(3);
}
await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const result = await page.evaluate(async () => {
  const settings = await wp.apiFetch({ path: '/wp/v2/settings' });
  const header = await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//header?context=edit' });
  const html = await fetch('https://aerosuite.com.br/solucoes/?nocache=' + Date.now()).then((r) => r.text());
  return {
    site_logo: settings.site_logo,
    custom_logo: settings.custom_logo,
    headerSnippet: (header.content?.raw || '').slice(0, 2500),
    logoMatches: [
      ...html.matchAll(/https:\/\/aerosuite\.com\.br\/wp-content\/uploads\/[^"'\s>]+\.(png|webp)/gi),
    ]
      .map((m) => m[0])
      .filter((u) => /logo|aero|picture/i.test(u))
      .slice(0, 12),
    siteLogoHtml: html.match(/wp-block-site-logo[\s\S]{0,400}/)?.[0] || html.match(/custom-logo[\s\S]{0,300}/)?.[0],
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
