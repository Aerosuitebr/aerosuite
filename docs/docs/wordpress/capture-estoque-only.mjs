/**
 * Recaptura a tela de itens de estoque (hero / site) com dados na tabela.
 * Uso: node capture-estoque-only.mjs
 * Env: AEROSUITE_APP_EMAIL, AEROSUITE_APP_PASSWORD (ou login manual na janela)
 */
import { chromium } from 'playwright';
import { copyFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(dir, 'screenshots');
const BASE = process.env.AEROSUITE_APP_URL || 'https://app.aerosuite.com.br';
const ROUTE = '/estoque/itens';

async function loadSecrets() {
  try {
    const mod = await import('./aerosuite-site-secrets.local.mjs');
    return mod.SECRETS ?? {};
  } catch {
    return {};
  }
}

async function tryAutoLogin(page, secrets) {
  const email = process.env.AEROSUITE_APP_EMAIL || secrets.appEmail || 'admin@aerosuite.com';
  const password = process.env.AEROSUITE_APP_PASSWORD || secrets.appPassword || 'admin123';
  const tenant = process.env.AEROSUITE_APP_TENANT || secrets.appTenant || 'default';
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  const tenantField = page.locator('#tenantCodigo');
  if (await tenantField.isVisible().catch(() => false)) {
    await tenantField.fill(tenant);
  }
  const emailField = page.locator('#email');
  if (await emailField.count()) {
    await emailField.fill(email);
  } else {
    await page.getByRole('textbox', { name: /e-mail/i }).fill(email);
  }
  const passField = page.locator('#password input');
  if (await passField.count()) {
    await passField.fill(password);
  } else {
    await page.getByPlaceholder(/senha/i).fill(password);
  }
  const submit = page.locator('[data-testid="login-submit"], button.login-button').first();
  if (await submit.count()) {
    await submit.click();
  } else {
    await page.getByRole('button', { name: /entrar/i }).click();
  }
  try {
    await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 25000 });
    return true;
  } catch {
    return false;
  }
}

async function waitForAuth(page, secrets) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  if (await tryAutoLogin(page, secrets)) return;
  console.log('\n>>> Login automático falhou — faça login na janela (até 3 min)...\n');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 180000 });
}

async function waitForItensTable(page) {
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'networkidle', timeout: 90000 });
  // Aguarda fim do skeleton / carregamento lazy
  await page.waitForFunction(
    () => {
      const rows = document.querySelectorAll(
        '.itens-stock-table .p-datatable-tbody tr, table.itens-stock-table tbody tr'
      );
      if (rows.length > 0) return true;
      const empty = document.querySelector('.empty-state');
      return !!empty;
    },
    { timeout: 90000 }
  );
  const count = await page.locator('table.itens-stock-table tbody tr').count();
  if (count === 0) {
    const empty = await page.locator('.empty-state').count();
    if (empty) {
      throw new Error('Lista de itens vazia — use um tenant com peças cadastradas para o screenshot.');
    }
  }
  await page.waitForTimeout(800);
  return count;
}

async function main() {
  const secrets = await loadSecrets();
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: process.env.AEROSUITE_CAPTURE_HEADLESS === '1',
    args: ['--window-size=1440,900'],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  await waitForAuth(page, secrets);
  const rows = await waitForItensTable(page);
  console.log('Linhas na tabela:', rows);

  const main = page.locator('.itens-container').first();
  const box = await main.boundingBox();
  const fileItens = join(OUT, 'estoque-itens.png');
  const fileFifo = join(OUT, 'estoque-fifo.png');

  if (box) {
    await page.screenshot({
      path: fileItens,
      clip: {
        x: Math.max(0, box.x),
        y: Math.max(0, box.y),
        width: Math.min(box.width, 1400),
        height: Math.min(box.height, 820),
      },
    });
  } else {
    await page.screenshot({ path: fileItens, fullPage: false });
  }
  await copyFile(fileItens, fileFifo);
  console.log('OK', fileItens);
  console.log('OK', fileFifo);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
