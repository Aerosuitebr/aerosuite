/**
 * Desativa TranslatePress (seletor "Portuguese" no canto — site só pt-BR).
 * Uso: node run-deactivate-translatepress.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const PLUGIN = 'translatepress-multilingual/index.php';
const storage = path.join(dir, 'wp-storage.json');
const outPath = path.join(dir, 'translatepress-deactivate-result.json');

async function main() {
  if (!fs.existsSync(storage)) {
    console.error('MISSING_SESSION', storage);
    process.exit(2);
  }

  const browser = await pw.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: storage });
  const admin = await ctx.newPage();
  await admin.goto(`${ORIGIN}/wp-admin/`, { waitUntil: 'domcontentloaded', timeout: 120000 });

  let result = { ok: false, method: 'ui' };
  admin.on('dialog', (d) => d.accept());
  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const row = admin.locator(`tr[data-plugin="${PLUGIN}"]`);
  if ((await row.count()) === 0) {
    result = { ok: true, method: 'ui', note: 'plugin_not_installed' };
  } else {
    const hasDeactivate = (await row.locator('.deactivate').count()) > 0;
    if (hasDeactivate) {
      await row.locator('.deactivate a').click({ timeout: 10000 });
      await admin.waitForTimeout(2500);
    }
    const stillActive = (await row.locator('.deactivate').count()) > 0;
    result = { ok: !stillActive, method: 'ui', wasActive: hasDeactivate };
  }

  await browser.close();
  fs.writeFileSync(outPath, JSON.stringify({ at: new Date().toISOString(), ...result }, null, 2));
  console.log(result.ok ? 'TRP_DEACTIVATE_OK' : 'TRP_DEACTIVATE_FAIL', JSON.stringify(result));
  process.exit(result.ok ? 0 : 1);
}

main().catch((e) => {
  console.error('TRP_DEACTIVATE_FAIL', e.message);
  process.exit(1);
});
