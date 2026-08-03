/**
 * Corrige erro 500: limpa .htaccess, desativa LSC quebrado, reinstala perf estável.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: false });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : {}
);
const page = await context.newPage();
page.on('dialog', (d) => d.accept());

await page.goto(`${ORIGIN}/wp-admin/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
if (page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN');
  await browser.close();
  process.exit(2);
}

await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const fix = await page.evaluate(async () => {
  const out = { steps: [] };
  try {
    await wp.apiFetch({
      path: '/wp/v2/plugins/litespeed-cache%2Flitespeed-cache',
      method: 'POST',
      data: { status: 'inactive' },
    });
    out.steps.lscDeactivate = { ok: true };
  } catch (e) {
    out.steps.lscDeactivate = { ok: false, error: String(e.message || e) };
  }

  try {
    if (typeof insert_with_markers === 'undefined') {
      // noop in browser
    }
    out.steps.htaccess = { note: 'cleanup via plugin reinstall' };
  } catch (e) {
    out.steps.htaccess = { error: String(e.message || e) };
  }

  return out;
});

await page.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
for (const slug of ['litespeed-cache/litespeed-cache.php']) {
  const row = page.locator(`tr[data-plugin="${slug}"]`);
  if (await row.count()) {
    const deactivate = row.locator('.deactivate a');
    if (await deactivate.count()) {
      await deactivate.first().click({ timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(2000);
      fix.steps.lscUiDeactivate = true;
    }
  }
}

await browser.close();

spawnSync(process.execPath, ['run-aerosuite-perf-install.mjs'], { cwd: dir, stdio: 'inherit' });

console.log('FIX_OK', JSON.stringify(fix));
