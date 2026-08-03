/**
 * Remove registros Locaweb obsoletos no Cloudflare (UI automatizada).
 * Requer sessão no dash (perfil .wp-browser-profile compartilhado).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');

const dir = path.dirname(fileURLToPath(import.meta.url));
const userDataDir = path.join(dir, '.wp-browser-profile');
const outPath = path.join(dir, 'locaweb-dns-cleanup-result.json');
const ZONE =
  'https://dash.cloudflare.com/44a7c31ca337648abef38dea0c599e79/aerosuite.com.br/dns/records';

const TARGETS = [
  'mail.ita.locaweb.com.br',
  'autodiscover.email.locaweb.com.br',
  'domainconnect.locaweb.com.br',
  'pop.aerosuite.com.br',
  'webmail-seguro.com.br',
];

async function deleteRow(page, needle) {
  await page.goto(`${ZONE}?search=${encodeURIComponent(needle)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await page.waitForTimeout(1500);
  const row = page.locator('table tbody tr').filter({ hasText: needle }).first();
  if (!(await row.count())) return { needle, action: 'not-found' };
  await row.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Delete' }).first().click();
  await page.getByRole('button', { name: 'Delete' }).last().click();
  await page.waitForTimeout(1200);
  return { needle, action: 'deleted' };
}

const context = await pw.chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: { width: 1400, height: 900 },
});
const page = context.pages()[0] || (await context.newPage());

const actions = [];
for (const needle of TARGETS) {
  try {
    actions.push(await deleteRow(page, needle));
  } catch (e) {
    actions.push({ needle, action: 'error', error: String(e) });
  }
}

const result = { at: new Date().toISOString(), actions };
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await context.close();
