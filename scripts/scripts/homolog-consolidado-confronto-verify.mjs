#!/usr/bin/env node
/**
 * Confronto Consolidado v2 — verificação homolog + captura de evidências.
 * Uso: node scripts/homolog-consolidado-confronto-verify.mjs
 * Env: AEROSUITE_APP_URL (default https://app.aerosuite.com.br)
 */
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'frontend/package.json'));
const puppeteer = require('puppeteer');

const BASE = process.env.AEROSUITE_APP_URL || 'https://app.aerosuite.com.br';
const EMAIL = 'rafaellanottesconsultoria@gmail.com';
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const evDir = join(root, 'docs/homolog_ux/evidencias/confronto-v2', stamp);
const OUT_JSON = join(evDir, 'verificacao-homolog.json');

async function fetchLoginTenants() {
  const url = `${BASE}/api/auth/login-tenants?email=${encodeURIComponent(EMAIL)}`;
  const res = await fetch(url);
  const body = await res.json();
  return { status: res.status, body: Array.isArray(body) ? body : body?.value ?? body };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function captureLoginDropdown(page, tag) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('#email', { timeout: 15000 });
  await page.click('#email', { clickCount: 3 });
  await page.type('#email', EMAIL, { delay: 20 });
  await sleep(1200);
  const tenantVisible = await page.$('.tenant-dropdown, [inputid="tenantCodigo"], p-dropdown');
  if (tenantVisible) {
    await page.click('.tenant-dropdown .p-dropdown-trigger, p-dropdown .p-dropdown-trigger');
    await sleep(600);
  }
  const file = join(evDir, `${tag}-login-tenant-dropdown.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function main() {
  await mkdir(evDir, { recursive: true });

  const apiBefore = await fetchLoginTenants();
  const tenants = apiBefore.body ?? [];
  const dupNames = tenants.filter(t => (t.nome || '').includes('Rafaella'));
  const hasLabel = tenants.some(t => t.label && String(t.label).includes('·'));
  const hasCriadoEm = tenants.some(t => t.criadoEm);
  const duplicateCount = tenants.length;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--window-size=1440,900', '--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  const shotUi = await captureLoginDropdown(page, 'homolog-atual');
  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    email: EMAIL,
    api: {
      endpoint: '/api/auth/login-tenants',
      status: apiBefore.status,
      tenantCount: duplicateCount,
      tenants: tenants.map(t => ({
        id: t.id,
        codigo: t.codigo,
        nome: t.nome,
        label: t.label ?? null,
        criadoEm: t.criadoEm ?? null,
      })),
      backendHasLabelField: hasLabel,
      backendHasCriadoEm: hasCriadoEm,
      a2Status: duplicateCount > 1 && !hasLabel ? 'FALHA_HOMOLOG' : duplicateCount <= 1 ? 'OK_DADOS' : 'PARCIAL_UI',
    },
    screenshots: { uiHomolog: shotUi },
    findings: {
      A2: {
        homolog: duplicateCount > 1 ? 'REINCIDENCIA_CONFIRMADA' : 'OK',
        cause: duplicateCount > 1
          ? (!hasLabel
            ? 'Deploy pendente (API sem label) + dados duplicados no banco'
            : 'Dados duplicados no banco')
          : 'Resolvido',
      },
    },
  };

  await writeFile(OUT_JSON, JSON.stringify(report, null, 2), 'utf8');
  console.log('Evidências:', evDir);
  console.log('Tenants:', duplicateCount, '| label na API:', hasLabel);
  console.log(JSON.stringify(report.api.tenants, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
