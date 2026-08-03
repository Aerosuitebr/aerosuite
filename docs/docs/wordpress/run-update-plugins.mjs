/**
 * Atualiza plugins e temas pendentes no wp-admin (requer wp-storage.json).
 * Uso: node run-update-plugins.mjs
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

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  process.exit(2);
}

async function openUpdateCore(page) {
  await page.goto(`${ORIGIN}/wp-admin/update-core.php`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (page.url().includes('wp-login')) {
    throw new Error('session_expired');
  }
  await page.waitForTimeout(1500);
}

function formSelector(actionFragment) {
  return `form[action*="action=${actionFragment}"]`;
}

async function countPending(page, actionFragment) {
  return page.evaluate((fragment) => {
    const form = document.querySelector(`form[action*="action=${fragment}"]`);
    if (!form) return { count: 0, items: [] };
    const boxes = [...form.querySelectorAll('input[type="checkbox"][name="checked[]"]')];
    return {
      count: boxes.length,
      items: boxes.map((b) => b.value),
    };
  }, actionFragment);
}

async function bulkUpgrade(page, actionFragment, submitId) {
  const pending = await countPending(page, actionFragment);
  if (pending.count === 0) {
    return { ok: true, updated: 0, items: [] };
  }

  await page.evaluate((fragment) => {
    const form = document.querySelector(`form[action*="action=${fragment}"]`);
    if (!form) return;
    for (const box of form.querySelectorAll('input[type="checkbox"][name="checked[]"]')) {
      box.checked = true;
    }
  }, actionFragment);

  const selector = `${formSelector(actionFragment)} input#${submitId}, input#${submitId}`;
  await page.locator(selector).first().click({ timeout: 15000 });

  await page.waitForURL(
    (url) => url.pathname.includes('update-core.php') || url.pathname.includes('update.php'),
    { timeout: 300000 }
  ).catch(() => {});

  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(4000);

  return { ok: true, updated: pending.count, items: pending.items };
}

async function updateViaPluginLinks(page) {
  await page.goto(`${ORIGIN}/wp-admin/plugins.php`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a.update-link')]
      .map((a) => ({ href: a.href, text: a.textContent?.trim() }))
      .filter((l) => l.href.includes('upgrade-plugin'))
  );

  const done = [];
  for (const link of links) {
    await page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(3000);
    done.push(link.href);
  }
  return { count: done.length, links: done };
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const page = await context.newPage();

const result = {
  at: new Date().toISOString(),
  before: {},
  pluginRounds: [],
  themeRounds: [],
  pluginLinks: null,
  after: {},
};

try {
  await openUpdateCore(page);
  result.before.plugins = await countPending(page, 'do-plugin-upgrade');
  result.before.themes = await countPending(page, 'do-theme-upgrade');

  for (let i = 0; i < 3; i++) {
    await openUpdateCore(page);
    const pending = await countPending(page, 'do-plugin-upgrade');
    if (pending.count === 0) break;
    result.pluginRounds.push(await bulkUpgrade(page, 'do-plugin-upgrade', 'upgrade-plugins'));
    await openUpdateCore(page);
    if ((await countPending(page, 'do-plugin-upgrade')).count === 0) break;
  }

  result.pluginLinks = await updateViaPluginLinks(page);

  for (let i = 0; i < 3; i++) {
    await openUpdateCore(page);
    const pending = await countPending(page, 'do-theme-upgrade');
    if (pending.count === 0) break;
    result.themeRounds.push(await bulkUpgrade(page, 'do-theme-upgrade', 'upgrade-themes'));
    await openUpdateCore(page);
    if ((await countPending(page, 'do-theme-upgrade')).count === 0) break;
  }

  await openUpdateCore(page);
  result.after.plugins = await countPending(page, 'do-plugin-upgrade');
  result.after.themes = await countPending(page, 'do-theme-upgrade');
  result.after.menuBadge = await page.evaluate(() => {
    const el = document.querySelector('#menu-dashboard .update-plugins, .update-plugins');
    return el ? el.textContent?.trim() : null;
  });
} catch (err) {
  result.error = String(err.message || err);
}

const outPath = path.join(dir, 'update-plugins-result.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

const remaining = (result.after?.plugins?.count ?? 0) + (result.after?.themes?.count ?? 0);
console.log('UPDATE_PLUGINS', JSON.stringify({
  beforePlugins: result.before?.plugins?.count,
  beforeThemes: result.before?.themes?.count,
  afterPlugins: result.after?.plugins?.count,
  afterThemes: result.after?.themes?.count,
  menuBadge: result.after?.menuBadge,
  error: result.error,
}, null, 2));
console.log('Report:', outPath);

await browser.close();
process.exit(remaining === 0 && !result.error ? 0 : 1);
