/**
 * Purge Cloudflare (API se token disponível; senão UI do dashboard).
 * Uso: node run-cloudflare-purge.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '44a7c31ca337648abef38dea0c599e79';
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const outPath = path.join(dir, 'cloudflare-purge-result.json');

async function purgeViaApi() {
  if (!CF_TOKEN) {
    return { ok: false, skipped: true, method: 'api', reason: 'CLOUDFLARE_API_TOKEN ausente' };
  }
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ purge_everything: true }),
  });
  const json = await res.json();
  return {
    ok: json.success === true,
    method: 'api',
    status: res.status,
    id: json.result?.id,
    errors: json.errors,
  };
}

async function purgeViaBrowser() {
  const browser = await pw.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const url = `https://dash.cloudflare.com/${ZONE_ID}/${ORIGIN.replace('https://', '')}/caching/configuration`;

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

  const loginWaitMs = 180000;
  const started = Date.now();
  while (page.url().includes('login') && Date.now() - started < loginWaitMs) {
    process.stderr.write(`Aguardando login Cloudflare (${Math.round((Date.now() - started) / 1000)}s)...\r`);
    await page.waitForTimeout(2000);
  }

  if (page.url().includes('login')) {
    await browser.close();
    return { ok: false, method: 'browser', reason: 'NOT_LOGGED_IN' };
  }

  const purgeBtn = page.getByRole('button', { name: /purge everything|limpar tudo|purge all/i });
  if (await purgeBtn.count()) {
    await purgeBtn.first().click({ timeout: 10000 });
    const confirm = page.getByRole('button', { name: /confirm|purge|limpar|ok/i });
    if (await confirm.count()) {
      await confirm.first().click({ timeout: 8000 }).catch(() => {});
    }
    await page.waitForTimeout(4000);
    await browser.close();
    return { ok: true, method: 'browser', url };
  }

  await browser.close();
  return { ok: false, method: 'browser', reason: 'Purge button not found', url };
}

const result = { at: new Date().toISOString(), zoneId: ZONE_ID, steps: {} };
result.steps.api = await purgeViaApi();
if (!result.steps.api.ok) {
  result.steps.browser = await purgeViaBrowser();
}
result.ok = result.steps.api.ok === true || result.steps.browser?.ok === true;
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('CF_PURGE', JSON.stringify(result));
process.exit(result.ok ? 0 : 1);
