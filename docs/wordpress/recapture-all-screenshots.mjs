/**
 * Recaptura telas do site com dados reais (tabelas populadas).
 * Preferir tenant `default` (admin@aerosuite.com) — contém OS/estoque/propostas de demo.
 *
 * Uso:
 *   AEROSUITE_APP_URL=http://localhost:8081 node recapture-all-screenshots.mjs
 * Env: AEROSUITE_APP_EMAIL, AEROSUITE_APP_PASSWORD, AEROSUITE_APP_TENANT
 */
import { spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { sanitizePageForMarketing, assertMarketingClean } from './marketing-sanitize.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(dir, 'screenshots');
const BASE = process.env.AEROSUITE_APP_URL || 'http://localhost:8081';

const ONBOARDING_PAYLOAD = {
  displayName: 'Demo MRO',
  tagline: 'Gestão aeronáutica integrada para oficinas',
  supportEmail: 'suporte@demo.local',
  razaoSocial: 'Demo MRO Manutenção Aeronáutica Ltda',
  cnpj: '12345678000190',
  telefone: '(21) 99999-0000',
  enderecoLogradouro: 'Av. das Américas',
  enderecoNumero: '1000',
  enderecoBairro: 'Barra da Tijuca',
  cidade: 'Rio de Janeiro',
  uf: 'RJ',
  cep: '22640-100',
  concluirOnboarding: true,
};

const SHOTS = [
  {
    name: 'dashboard',
    path: '/home',
    waitMs: 4000,
    needsMainSidebar: true,
    ready: () =>
      document.querySelector('app-configuracao-empresa-inicial') === null &&
      document.querySelector('app-home, .home-cockpit, .cockpit') !== null,
  },
  {
    name: 'os-list',
    path: '/os',
    waitMs: 3000,
    needsMainSidebar: true,
    apiWait: '/api/os',
    componentSelector: 'app-os-list',
    minRows: 'app-os-list tbody tr',
  },
  {
    name: 'estoque-itens',
    path: '/estoque/itens',
    waitMs: 3000,
    needsMainSidebar: false,
    apiWait: '/api/estoque/itens',
    componentSelector: 'app-item-estoque-list',
    minRows: '.itens-stock-table tbody tr',
  },
  {
    name: 'propostas-comerciais',
    path: '/propostas-comerciais',
    waitMs: 3000,
    needsMainSidebar: true,
    apiWait: '/api/propostas-comerciais',
    componentSelector: 'app-proposta-comercial-list',
    minRows: 'app-proposta-comercial-list tbody tr',
  },
  {
    name: 'conformidade-painel',
    path: '/conformidade/painel',
    waitMs: 1500,
    needsMainSidebar: true,
    apiWait: '/api/conformidade/painel',
    extraApiWaits: ['/api/conformidade/sms/indicadores'],
    componentSelector: 'app-conformidade-painel',
    waitGone: 'app-conformidade-painel app-skeleton-table',
    loadedSelector: 'app-conformidade-painel .painel-cards',
    minRows: 'app-conformidade-painel .alert-row',
    minRowCount: 1,
  },
];

async function loadSecrets() {
  try {
    const mod = await import('./aerosuite-site-secrets.local.mjs');
    return mod.SECRETS ?? {};
  } catch {
    return {};
  }
}

async function loginViaApi(page, secrets) {
  const email = process.env.AEROSUITE_APP_EMAIL || secrets.appEmail || 'admin@aerosuite.com';
  const password = process.env.AEROSUITE_APP_PASSWORD || secrets.appPassword || 'admin123';
  const tenant = process.env.AEROSUITE_APP_TENANT || secrets.appTenant || 'default';

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const result = await page.evaluate(
    async ({ base, body }) => {
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) return { ok: false, status: res.status, body: text.slice(0, 300) };
      const data = JSON.parse(text);
      localStorage.setItem('aerosuite_token', data.token);
      localStorage.setItem('aerosuite_user', JSON.stringify(data.user));
      const tenantCodigo = data.user?.tenantCodigo || body.tenantCodigo || 'default';
      localStorage.setItem('aerosuite_tenant_codigo', tenantCodigo);
      return { ok: true, tenant: tenantCodigo, email: data.user?.email };
    },
    {
      base: BASE,
      body: { email, password, tenantCodigo: tenant },
    }
  );

  if (!result.ok) {
    throw new Error(`Login API falhou (${result.status}): ${result.body}`);
  }

  console.log(`Login API: ${result.email} @ ${result.tenant}`);
  await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return true;
}

async function tryAutoLogin(page, secrets) {
  try {
    return await loginViaApi(page, secrets);
  } catch (e) {
    console.warn('Login API falhou, tentando formulário:', e.message);
  }

  const email = process.env.AEROSUITE_APP_EMAIL || secrets.appEmail || 'admin@aerosuite.com';
  const password = process.env.AEROSUITE_APP_PASSWORD || secrets.appPassword || 'admin123';
  const tenant = process.env.AEROSUITE_APP_TENANT || secrets.appTenant || 'default';

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const emailField = page.locator('#email');
  if (await emailField.count()) {
    await emailField.fill(email);
  } else {
    await page.getByRole('textbox', { name: /e-mail/i }).fill(email);
  }
  await page.waitForTimeout(800);

  const tenantDropdown = page.locator('p-dropdown[inputid="tenantCodigo"]');
  if (tenant && (await tenantDropdown.isVisible().catch(() => false))) {
    await tenantDropdown.click();
    await page.locator('.p-dropdown-item').filter({ hasText: tenant }).first().click({ timeout: 5000 }).catch(() => {});
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
    await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30000 });
    return true;
  } catch {
    return false;
  }
}

async function waitForAuth(page, secrets) {
  if (await tryAutoLogin(page, secrets)) return;
  console.log('\n>>> Faça login na janela do Chromium (até 3 min)...\n');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 180000 });
}

async function apiFetch(page, path, init = {}) {
  return page.evaluate(
    async ({ apiPath, options }) => {
      const token = localStorage.getItem('aerosuite_token');
      if (!token) return { ok: false, status: 0, body: 'no token' };
      const res = await fetch(apiPath, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options.headers ?? {}),
        },
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, body: text.slice(0, 500) };
    },
    { apiPath: `${BASE}${path}`, options: init }
  );
}

async function ensureOnboardingComplete(page) {
  const status = await apiFetch(page, '/api/sistema-empresa/status');
  if (!status.ok) {
    console.warn('WARN status', status.status, status.body);
    return;
  }
  try {
    const parsed = JSON.parse(status.body);
    if (!parsed.needsCompletion) {
      console.log('Onboarding já concluído');
      return;
    }
  } catch {
    return;
  }

  console.log('Concluindo onboarding via API...');
  const put = await apiFetch(page, '/api/sistema-empresa/config', {
    method: 'PUT',
    body: JSON.stringify(ONBOARDING_PAYLOAD),
  });
  if (!put.ok) {
    throw new Error(`Falha ao concluir onboarding: HTTP ${put.status} — ${put.body}`);
  }

  const after = await apiFetch(page, '/api/sistema-empresa/status');
  const needs = after.ok && JSON.parse(after.body).needsCompletion;
  if (needs) {
    throw new Error('Onboarding ainda pendente após PUT /config');
  }
  console.log('Onboarding concluído');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
}

function assertNotOnWizard(page, shot) {
  const url = page.url();
  if (url.includes('configuracao-empresa-inicial')) {
    throw new Error(`${shot.name}: redirecionado para wizard (${url})`);
  }
}

async function dismissTransientOverlays(page) {
  await page.evaluate(() => {
    document
      .querySelectorAll('.p-dialog-mask:not(.empresa-onboarding-dialog), .cookie-banner')
      .forEach((el) => el.remove());
  });
}

function matchesListApi(fragment) {
  return (response) => {
    try {
      const path = new URL(response.url()).pathname;
      return (
        response.request().method() === 'GET' &&
        response.ok() &&
        (path === fragment || path.endsWith(fragment))
      );
    } catch {
      return false;
    }
  };
}

async function captureShot(page, shot) {
  const apiPaths = [...(shot.apiWait ? [shot.apiWait] : []), ...(shot.extraApiWaits ?? [])];
  if (apiPaths.length > 0) {
    await Promise.all([
      ...apiPaths.map((p) => page.waitForResponse(matchesListApi(p), { timeout: 90000 })),
      page.goto(`${BASE}${shot.path}`, { waitUntil: 'domcontentloaded', timeout: 90000 }),
    ]);
  } else {
    await page.goto(`${BASE}${shot.path}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  }
  assertNotOnWizard(page, shot);

  if (shot.componentSelector) {
    await page.locator(shot.componentSelector).waitFor({ state: 'attached', timeout: 90000 });
  }
  if (shot.waitGone) {
    await page.locator(shot.waitGone).waitFor({ state: 'hidden', timeout: 90000 });
  }
  if (shot.loadedSelector) {
    await page.locator(shot.loadedSelector).first().waitFor({ state: 'visible', timeout: 90000 });
  }
  if (shot.minRows) {
    const minCount = shot.minRowCount ?? 3;
    const idx = Math.min(minCount - 1, 2);
    await page.locator(shot.minRows).nth(idx).waitFor({ state: 'visible', timeout: 90000 });
    const rows = await page.locator(shot.minRows).count();
    if (rows < minCount) {
      throw new Error(`${shot.name}: apenas ${rows} linhas visíveis (esperado ≥${minCount})`);
    }
  } else if (shot.ready) {
    await page.waitForFunction(shot.ready, null, { timeout: 90000 });
  }
  if (shot.needsMainSidebar) {
    await page.waitForSelector('.sidebar--flight-deck', { timeout: 30000 });
  }
  await page.waitForTimeout(shot.waitMs);
  await dismissTransientOverlays(page);
  await sanitizePageForMarketing(page);
  await assertMarketingClean(page, shot.name);
  assertNotOnWizard(page, shot);

  const onWizard = await page.evaluate(
    () => document.querySelector('app-configuracao-empresa-inicial') !== null
  );
  if (onWizard) {
    throw new Error(`${shot.name}: wizard ainda visível na página`);
  }

  const file = join(OUT, `${shot.name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('OK', file, shot.path);
  return file;
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
  const tenant = await page.evaluate(() => localStorage.getItem('aerosuite_tenant_codigo'));
  console.log('Tenant captura:', tenant || '(não definido)');
  await ensureOnboardingComplete(page);

  const only = process.env.AEROSUITE_CAPTURE_ONLY?.trim();
  const shots = only ? SHOTS.filter((s) => s.name === only) : SHOTS;
  if (only && shots.length === 0) {
    throw new Error(`Shot desconhecido: ${only}`);
  }

  for (const shot of shots) {
    try {
      await captureShot(page, shot);
    } catch (e) {
      console.warn('WARN', shot.name, e.message);
    }
  }

  await browser.close();

  console.log('\nConvertendo para WebP...');
  const r = spawnSync(process.execPath, ['resize-screenshots.mjs'], { cwd: dir, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);

  const { copyFile } = await import('node:fs/promises');
  const web = join(OUT, 'web');
  await copyFile(join(web, 'estoque-itens-web.webp'), join(web, 'estoque-fifo-web.webp')).catch(() => {});
  await copyFile(join(web, 'conformidade-painel-web.webp'), join(web, 'portal-cliente-web.webp')).catch(() => {});

  console.log('CAPTURE_OK');
}

main().catch((e) => {
  console.error('CAPTURE_FAIL', e.message);
  process.exit(1);
});
