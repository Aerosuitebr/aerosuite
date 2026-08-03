/**
 * Inspeciona atualizações pendentes no wp-admin.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const page = await context.newPage();

const result = { at: new Date().toISOString() };

await page.goto(`${ORIGIN}/wp-admin/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
result.dashboardUrl = page.url();
result.sessionExpired = page.url().includes('wp-login');

if (!result.sessionExpired) {
  result.updateMenuBadge = await page.evaluate(() => {
    const el = document.querySelector('#menu-dashboard .update-plugins, .update-plugins');
    return el ? el.textContent?.trim() : null;
  });

  await page.goto(`${ORIGIN}/wp-admin/update-core.php`, { waitUntil: 'networkidle', timeout: 120000 });
  result.updateCore = await page.evaluate(() => {
    const forms = [...document.querySelectorAll('form')].map((f) => ({
      id: f.id,
      action: f.action,
      checkboxes: [...f.querySelectorAll('input[type="checkbox"]')].map((c) => ({
        name: c.name,
        value: c.value,
        id: c.id,
      })),
      submit: [...f.querySelectorAll('input[type="submit"], button[type="submit"]')].map((s) => ({
        name: s.name,
        id: s.id,
        value: s.value,
      })),
    }));
    const headings = [...document.querySelectorAll('h2, h3, .update-message')].map((h) => h.textContent?.trim()).filter(Boolean);
    const updateLinks = [...document.querySelectorAll('a.update-link, .plugin-update-tr a, .update-link')].map((a) => ({
      href: a.href,
      text: a.textContent?.trim(),
    }));
    return { forms, headings: headings.slice(0, 30), updateLinks, bodySnippet: document.body?.innerText?.slice(0, 4000) };
  });

  await page.goto(`${ORIGIN}/wp-admin/plugins.php?plugin_status=upgrade`, {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  result.pluginsUpgrade = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tr.plugin-update-tr, tr.active.update, #the-list tr')];
    const updates = [];
    for (const row of rows) {
      const name = row.querySelector('.plugin-title strong')?.textContent?.trim();
      const link = row.querySelector('a.update-link, .update-link');
      if (name || link) {
        updates.push({
          name,
          updateLink: link ? { href: link.href, text: link.textContent?.trim() } : null,
          rowText: row.textContent?.replace(/\s+/g, ' ').trim().slice(0, 200),
        });
      }
    }
    return {
      count: updates.filter((u) => u.updateLink).length,
      updates,
      notice: document.querySelector('.update-nag, .notice-warning')?.textContent?.trim(),
    };
  });

  await page.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'networkidle', timeout: 120000 });
  result.pluginsAll = await page.evaluate(() => {
    const withUpdate = [];
    for (const row of document.querySelectorAll('#the-list tr')) {
      const link = row.querySelector('a.update-link');
      if (link) {
        withUpdate.push({
          name: row.querySelector('.plugin-title strong')?.textContent?.trim(),
          href: link.href,
          version: row.querySelector('.plugin-version-author-uri')?.textContent?.trim(),
        });
      }
    }
    return { count: withUpdate.length, plugins: withUpdate };
  });
}

const outPath = path.join(dir, 'inspect-updates-result.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify({
  sessionExpired: result.sessionExpired,
  badge: result.updateMenuBadge,
  updateCoreForms: result.updateCore?.forms?.length,
  pluginsUpgrade: result.pluginsUpgrade?.count,
  pluginsAll: result.pluginsAll?.count,
}, null, 2));
console.log('Report:', outPath);

await browser.close();
