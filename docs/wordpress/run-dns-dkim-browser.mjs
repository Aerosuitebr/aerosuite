/**
 * Publica TXT google._domainkey no Cloudflare (UI automatizada).
 * Uso: node run-dns-dkim-browser.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');

const dir = path.dirname(fileURLToPath(import.meta.url));
const userDataDir = path.join(dir, '.wp-browser-profile');
const outPath = path.join(dir, 'dkim-dns-result.json');
const ZONE =
  'https://dash.cloudflare.com/44a7c31ca337648abef38dea0c599e79/aerosuite.com.br/dns/records';

const DKIM =
  'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv0huz46ritjA+MnajE+fkBDuja37xEe/GlJyxyGElxK2bltsJZKjcOyd/BHJcin/Ueq2zajirlyWuuIJKf8QvxHiHUTnWQPmzL7/E2fzXGdo1rHQp6DWNpYMNV51QILBcm52D3Xs2R7BBWWWWvNkLXozQlHt6GKcyv3CAnCP0PmcD7b4KL1x/u5WspAIQ/BazZ/vzgZ2M3/XczxatxdzE3lz2UCzJ5M7SE87br9vZ1xw+xeRDB45PZW/i6P8MVAUHok12hGPZAerxsabjLJRGQqbFKY0Tgt3lKdDR8URgyG5AZOEC832vbiyxQAfd13YuKM5JePJk/PKV4AbCll6UQIDAQAB';

const context = await pw.chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: { width: 1400, height: 900 },
});
const page = context.pages()[0] || (await context.newPage());

let result = { at: new Date().toISOString(), action: 'pending' };

try {
  await page.goto(`${ZONE}?search=google._domainkey`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await page.waitForTimeout(2000);

  const existing = page.locator('table tbody tr').filter({ hasText: 'google._domainkey' });
  if (await existing.count()) {
    result = { ...result, action: 'exists', note: 'google._domainkey já presente' };
  } else {
    await page.getByRole('button', { name: 'Add record' }).click();
    await page.waitForTimeout(800);
    await page.locator('[aria-label="Type"]').click();
    await page.getByRole('option', { name: 'TXT', exact: true }).click();
    await page.locator('input[name="name"]').fill('google._domainkey');
    await page.locator('textarea[name="content"], input[name="content"]').first().fill(DKIM);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2500);
    result = { ...result, action: 'created', host: 'google._domainkey' };
  }
} catch (e) {
  result = { ...result, action: 'error', error: String(e) };
}

fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await context.close();
