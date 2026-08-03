/**
 * GSC: logo da marca + solicitar indexação das 3 URLs principais.
 * Requer sessão Google já logada no Chromium do Playwright (primeira execução: login manual).
 *
 * Uso: node run-gsc-logo-index.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'gsc-storage.json');
const outPath = path.join(dir, 'gsc-logo-index-result.json');
const ORIGIN = 'https://aerosuite.com.br';
const GSC_RESOURCE_ID = 'sc-domain:aerosuite.com.br';
const LOGO_URL = `${ORIGIN}/wp-content/uploads/2026/06/aerosuite-site-icon-512.png`;

const URLS = [
  `${ORIGIN}/`,
  `${ORIGIN}/solucoes/`,
  `${ORIGIN}/contato/`,
];

const browser = await pw.chromium.launch({ headless: false });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : { locale: 'pt-BR' }
);
const page = await context.newPage();
page.on('dialog', (d) => d.accept());

const result = {
  at: new Date().toISOString(),
  logo: { attempted: false, ok: false, notes: [] },
  indexation: [],
};

async function waitForGsc() {
  await page.goto(
    `https://search.google.com/search-console?resource_id=${encodeURIComponent(GSC_RESOURCE_ID)}`,
    { waitUntil: 'domcontentloaded', timeout: 120000 }
  );
  const loginWaitMs = 180000;
  const started = Date.now();
  while (
    (page.url().includes('accounts.google.com') || page.url().includes('ServiceLogin')) &&
    Date.now() - started < loginWaitMs
  ) {
    process.stderr.write(`Aguardando login Google (${Math.round((Date.now() - started) / 1000)}s)...\r`);
    await page.waitForTimeout(2000);
  }
  if (page.url().includes('accounts.google.com')) {
    return false;
  }
  await page.waitForTimeout(2000);
  return true;
}

async function selectProperty() {
  const propLink = page.locator('a, button, [role="menuitem"]').filter({
    hasText: /aerosuite\.com\.br/i,
  });
  if (await propLink.count()) {
    await propLink.first().click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2500);
    return true;
  }
  const prefix = page.getByText(/https:\/\/aerosuite\.com\.br\/?/i);
  if (await prefix.count()) {
    await prefix.first().click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2500);
    return true;
  }
  return false;
}

async function tryBrandLogo() {
  result.logo.attempted = true;
  const settingsUrls = [
    'https://search.google.com/search-console/settings',
    'https://search.google.com/search-console/settings/brand',
    'https://search.google.com/search-console/settings/organization',
  ];
  for (const url of settingsUrls) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2000);
      const body = await page.locator('body').innerText();
      if (/informações da empresa|organization|marca|brand|logo/i.test(body)) {
        result.logo.notes.push(`settings page: ${page.url()}`);
        const nameInput = page.locator(
          'input[type="text"], input:not([type="hidden"])'
        ).filter({ has: page.locator('xpath=..') });
        const logoInput = page.locator('input[type="url"], input[type="text"]');
        const saveBtn = page.getByRole('button', {
          name: /salvar|save|guardar|concluir|done/i,
        });
        const allInputs = page.locator('input[type="text"], input[type="url"]');
        const n = await allInputs.count();
        for (let i = 0; i < Math.min(n, 6); i++) {
          const ph = (await allInputs.nth(i).getAttribute('placeholder')) || '';
          const aria = (await allInputs.nth(i).getAttribute('aria-label')) || '';
          const label = `${ph} ${aria}`.toLowerCase();
          if (/logo|imagem|image|url/i.test(label)) {
            await allInputs.nth(i).fill(LOGO_URL);
            result.logo.notes.push('filled logo url field');
          }
          if (/nome|name|empresa|company/i.test(label)) {
            await allInputs.nth(i).fill('Aero Suite');
            result.logo.notes.push('filled name field');
          }
        }
        if (await saveBtn.count()) {
          await saveBtn.first().click({ timeout: 8000 }).catch(() => {});
          await page.waitForTimeout(2000);
          result.logo.ok = true;
          return;
        }
      }
    } catch (e) {
      result.logo.notes.push(`err ${url}: ${e.message}`);
    }
  }
  result.logo.notes.push(
    'Configure manualmente: Configurações → Informações da empresa → Aero Suite + logo URL'
  );
}

async function requestIndexing(url) {
  const entry = { url, ok: false, status: '', notes: [] };
  try {
    const inspectBase = 'https://search.google.com/search-console/inspect';
    await page.goto(`${inspectBase}?resource_id=${encodeURIComponent(`https://aerosuite.com.br/`)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await page.waitForTimeout(1500);
    const searchInput = page.locator(
      'input[type="url"], input[type="search"], input[aria-label*="URL"], input[aria-label*="Inspecionar"], textarea'
    );
    if (await searchInput.count()) {
      await searchInput.first().fill(url);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
    } else {
      await page.goto(
        `https://search.google.com/search-console?resource_id=${encodeURIComponent(
          'https://aerosuite.com.br/'
        )}`,
        { waitUntil: 'domcontentloaded', timeout: 90000 }
      );
      await page.waitForTimeout(2000);
      const inspectNav = page.getByRole('link', { name: /inspecionar|inspect/i });
      if (await inspectNav.count()) {
        await inspectNav.first().click({ timeout: 8000 });
        await page.waitForTimeout(2000);
      }
      const inp = page.locator('input').first();
      if (await inp.count()) {
        await inp.fill(url);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);
      }
    }
    const body = await page.locator('body').innerText();
    entry.status = body.slice(0, 400);
    const requestBtn = page.getByRole('button', {
      name: /solicitar indexação|request indexing|pedir indexação/i,
    });
    if (await requestBtn.count()) {
      await requestBtn.first().click({ timeout: 10000 });
      await page.waitForTimeout(3000);
      entry.ok = true;
      entry.notes.push('request indexing clicked');
    } else if (/indexação solicitada|requested|na fila|queued/i.test(body)) {
      entry.ok = true;
      entry.notes.push('already requested or queued');
    } else {
      entry.notes.push('botão solicitar indexação não encontrado — faça manual na Inspeção de URL');
    }
  } catch (e) {
    entry.notes.push(String(e.message || e));
  }
  result.indexation.push(entry);
}

const loggedIn = await waitForGsc();
if (!loggedIn) {
  result.error = 'NOT_LOGGED_IN_GOOGLE';
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.error(result.error);
  await browser.close();
  process.exit(2);
}

await context.storageState({ path: storage });
await selectProperty();
await tryBrandLogo();
for (const url of URLS) {
  await requestIndexing(url);
  await page.waitForTimeout(1500);
}

await context.storageState({ path: storage });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('GSC_OK', JSON.stringify(result, null, 2));
await browser.close();
