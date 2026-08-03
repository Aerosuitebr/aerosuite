/**
 * Captura /estoque/itens no ng serve (localhost:4200) com API mockada — útil quando app.aerosuite.com.br está fora.
 * Uso: npm run dev (frontend) + node capture-estoque-local-mock.mjs
 */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { copyFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(dir, 'screenshots');
const BASE = process.env.AEROSUITE_APP_URL || 'http://localhost:4200';

const mockUser = {
  id: 1,
  tenantId: 1,
  tenantCodigo: 'default',
  tenantNome: 'Demo MRO',
  email: 'admin@aerosuite.com',
  nome: 'Administrador',
  role: 'ADMIN',
  funcionalidadeCodigos: ['ESTOQUE', 'OS', 'COMERCIAL', 'DASHBOARD'],
  modulosHabilitados: ['ESTOQUE', 'OS', 'COMERCIAL'],
  tenantFeatures: [],
  perfil: { id: 1, nome: 'Administrador', descricao: '', codigo: 'ADMIN' },
};

function fakeJwt() {
  const h = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 86400 * 30, sub: '1' })
  ).toString('base64url');
  return `${h}.${p}.capture`;
}

const loginResponse = {
  token: fakeJwt(),
  user: mockUser,
};

async function installMocks(page) {
  const itensPage = JSON.parse(
    await readFile(join(dir, 'fixtures', 'estoque-itens-mock.json'), 'utf8')
  );

  await page.route('**/api/auth/login**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(loginResponse),
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/auth/me**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    });
  });

  await page.route('**/api/auth/login-tenants**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ codigo: 'default', nome: 'Demo MRO' }]),
    });
  });

  await page.route('**/api/public/sistema-empresa/branding**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        nomeExibicao: 'Aero Suite',
        logoUrl: null,
        corPrimaria: '#0a2f6b',
      }),
    });
  });

  await page.route('**/api/estoque/itens**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(itensPage),
      });
    } else {
      await route.continue();
    }
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  await installMocks(page);

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const tenantField = page.locator('#tenantCodigo');
  if (await tenantField.isVisible().catch(() => false)) {
    await tenantField.fill('default');
  }
  await page.locator('#email').fill('admin@aerosuite.com');
  await page.locator('#password input').fill('admin123');
  await page.locator('[data-testid="login-submit"], button.login-button').first().click();
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 45000 });

  await page.goto(`${BASE}/estoque/itens`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForSelector('.itens-stock-table .p-datatable-tbody tr, table.itens-stock-table tbody tr', {
    timeout: 60000,
  });
  await page.waitForTimeout(600);

  const mainEl = page.locator('.itens-container').first();
  const box = await mainEl.boundingBox();
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
    await page.screenshot({ path: fileItens });
  }
  await copyFile(fileItens, fileFifo);
  console.log('OK', fileItens);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
