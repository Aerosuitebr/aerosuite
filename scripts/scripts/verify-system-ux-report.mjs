#!/usr/bin/env node
/**
 * Verificação dos apontamentos UX do **sistema** (app) — Relatorio_Tecnico_UX §3.5 e §7.
 * Não confundir com verify-report-items.mjs (site WordPress).
 *
 * Uso:
 *   node scripts/verify-system-ux-report.mjs
 *   AEROSUITE_APP_URL=https://app.aerosuite.com.br node scripts/verify-system-ux-report.mjs
 *
 * Env: AEROSUITE_APP_EMAIL, AEROSUITE_APP_PASSWORD, AEROSUITE_APP_TENANT
 */
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { FORBIDDEN_PATTERNS } from '../docs/wordpress/marketing-sanitize.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const requireFromWordpress = createRequire(join(root, 'docs/wordpress/package.json'));
const { chromium } = requireFromWordpress('playwright-core');
const BASE = process.env.AEROSUITE_APP_URL || 'http://localhost:8081';
const OUT_JSON = join(root, 'scripts', '.verify-system-ux-report.json');

/** Padrões de enum/i18n que não devem aparecer na UI. */
const ENUM_LEAK = [/\bCONTENCAO\b/, /\bVERIFICACAO\b/, /\bEM_ACAO\b/];
const I18N_LEAK = [/common\.actions\./i];
const ENCODING_LEAK = [/\?\?/];

const ROUTES = [
  {
    id: '3.5.3',
    sev: 'CRITICO',
    item: 'Chave i18n common.actions.refresh visível (Painel SGQ)',
    path: '/conformidade/painel',
    apiWait: '/api/conformidade/painel',
    waitGone: 'app-skeleton-table',
    loadedSelector: 'app-conformidade-painel .painel-actions button',
    forbidden: [...I18N_LEAK, ...ENUM_LEAK],
    required: [/atualizar|refresh|actualizar|actualiser/i],
  },
  {
    id: '3.5.5',
    sev: 'ALTO',
    item: 'Enum CAPA CONTENCAO sem tradução (NC)',
    path: '/conformidade/nao-conformidades',
    apiWait: '/api/conformidade/nao-conformidades',
    componentSelector: 'app-nao-conformidade-list',
    forbidden: [...ENUM_LEAK],
  },
  {
    id: '3.5.1',
    sev: 'CRITICO',
    item: 'Dados reais de clientes na lista de OS',
    path: '/os',
    apiWait: '/api/os',
    componentSelector: 'app-os-list',
    minRows: 'app-os-list tbody tr',
    forbidden: [
      /grupo\s*farroupil/i,
      /quick\s*mnt/i,
      /axial\s*aviation/i,
      /t\?\?xi/i,
      /a\?\?re/i,
    ],
  },
  {
    id: '3.5.2',
    sev: 'CRITICO',
    item: 'Dados smoke / Servico smoke (Propostas)',
    path: '/propostas-comerciais',
    apiWait: '/api/propostas-comerciais',
    componentSelector: 'app-proposta-comercial-list',
    minRows: 'app-proposta-comercial-list tbody tr',
    forbidden: [/cliente\s+smoke/i, /servi[cç]o\s+smoke/i, /gerar\s+os/i, /\bservico\b(?!s)/i],
  },
  {
    id: '3.5.4',
    sev: 'ALTO',
    item: "Erro ortográfico 'Servico' sem cedilha (Propostas)",
    path: '/propostas-comerciais',
    apiWait: '/api/propostas-comerciais',
    componentSelector: 'app-proposta-comercial-list',
    forbidden: [/\bservico\b/i],
  },
  {
    id: '3.5.6',
    sev: 'ALTO',
    item: 'Encoding corrompido (??) em textos visíveis',
    path: '/os',
    apiWait: '/api/os',
    forbidden: [/\?\?/],
  },
  {
    id: 'conf.documentos',
    sev: 'ALTO',
    item: 'Enums/i18n vazados (Documentos SGQ)',
    path: '/conformidade/documentos',
    apiWait: '/api/conformidade/documentos',
    componentSelector: 'app-sgq-documento-list',
    forbidden: [...I18N_LEAK, ...ENUM_LEAK, ...ENCODING_LEAK],
  },
  {
    id: 'conf.treinamentos',
    sev: 'ALTO',
    item: 'Enums/i18n vazados (Treinamentos)',
    path: '/conformidade/treinamentos',
    apiWait: '/api/conformidade/treinamentos',
    componentSelector: 'app-treinamento-list',
    forbidden: [...I18N_LEAK, ...ENUM_LEAK, ...ENCODING_LEAK],
  },
  {
    id: 'conf.calibracao',
    sev: 'ALTO',
    item: 'Enums/i18n vazados (Calibração)',
    path: '/conformidade/calibracao',
    apiWait: '/api/conformidade/calibracao',
    componentSelector: 'app-calibracao-list',
    forbidden: [...I18N_LEAK, ...ENUM_LEAK, ...ENCODING_LEAK],
  },
  {
    id: 'conf.subcontratacao',
    sev: 'ALTO',
    item: 'Enums/i18n vazados (Subcontratação)',
    path: '/conformidade/subcontratacao',
    apiWait: '/api/conformidade/subcontratacao',
    componentSelector: 'app-subcontratacao-list',
    forbidden: [...I18N_LEAK, ...ENUM_LEAK, ...ENCODING_LEAK],
  },
  {
    id: 'conf.habilitacoes',
    sev: 'MEDIO',
    item: 'Enums/i18n vazados (Habilitações)',
    path: '/conformidade/habilitacoes',
    apiWait: '/api/conformidade/habilitacoes',
    componentSelector: 'app-habilitacao-list',
    forbidden: [...I18N_LEAK, ...ENUM_LEAK, ...ENCODING_LEAK],
  },
  {
    id: 'conf.treinObrig',
    sev: 'MEDIO',
    item: 'Enums/i18n vazados (Treinamentos obrigatórios)',
    path: '/conformidade/treinamentos-obrigatorios',
    apiWait: '/api/conformidade/treinamentos-obrigatorios',
    componentSelector: 'app-treinamento-obrigatorio-list',
    forbidden: [...I18N_LEAK, ...ENUM_LEAK, ...ENCODING_LEAK],
  },
];

async function loadSecrets() {
  try {
    const mod = await import('../docs/wordpress/aerosuite-site-secrets.local.mjs');
    return mod.SECRETS ?? {};
  } catch {
    return {};
  }
}

async function loginViaApi(page, secrets) {
  const email = process.env.AEROSUITE_APP_EMAIL || secrets.appEmail || 'admin@aerosuite.com';
  const password = process.env.AEROSUITE_APP_PASSWORD || secrets.appPassword || 'admin123';
  const tenant = process.env.AEROSUITE_APP_TENANT || secrets.appTenant || 'default';

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });

  const result = await page.evaluate(
    async ({ base, body }) => {
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) return { ok: false, status: res.status, body: text.slice(0, 400) };
      const data = JSON.parse(text);
      localStorage.setItem('aerosuite_token', data.token);
      localStorage.setItem('aerosuite_user', JSON.stringify(data.user));
      localStorage.setItem(
        'aerosuite_tenant_codigo',
        data.user?.tenantCodigo || body.tenantCodigo || 'default'
      );
      return { ok: true, tenant: data.user?.tenantCodigo, email: data.user?.email };
    },
    { base: BASE, body: { email, password, tenantCodigo: tenant } }
  );

  if (!result.ok) {
    throw new Error(`Login falhou (${result.status}): ${result.body}`);
  }
  console.log(`Login: ${result.email} @ ${result.tenant || tenant}`);
}

async function waitRouteReady(page, route) {
  await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 90000 });

  if (route.apiWait) {
    await page
      .waitForResponse((r) => r.url().includes(route.apiWait) && r.status() === 200, {
        timeout: 45000,
      })
      .catch(() => {});
  }

  if (route.waitGone) {
    await page.locator(route.waitGone).first().waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
  }

  if (route.loadedSelector) {
    await page.locator(route.loadedSelector).first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  }

  if (route.componentSelector) {
    await page.locator(route.componentSelector).first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  }

  if (route.minRows) {
    await page.locator(route.minRows).first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  }

  await page.waitForTimeout(800);
}

function scanText(text, patterns) {
  const hits = [];
  for (const p of patterns) {
    if (p.test(text)) hits.push(p.source);
  }
  return hits;
}

async function evaluateRoute(page, route) {
  await waitRouteReady(page, route);

  const bodyText = await page.evaluate(() => document.body?.innerText || '');
  const forbidden = route.forbidden || [];
  const hits = scanText(bodyText, forbidden);

  let requiredOk = true;
  let requiredNote = '';
  if (route.required?.length) {
    requiredOk = route.required.some((p) => p.test(bodyText));
    if (!requiredOk) {
      requiredNote = 'texto esperado ausente (ex.: Atualizar no botão refresh)';
    }
  }

  const globalHits = scanText(bodyText, FORBIDDEN_PATTERNS);
  const allHits = [...new Set([...hits, ...globalHits.filter((h) => forbidden.some((f) => f.source === h))])];

  const ok = hits.length === 0 && requiredOk;
  const note =
    hits.length === 0
      ? requiredOk
        ? 'sem ocorrências na rota'
        : requiredNote
      : `encontrado: ${hits.slice(0, 4).join(', ')}`;

  return { ok, note, hits, bodySample: bodyText.slice(0, 200).replace(/\s+/g, ' ') };
}

async function main() {
  const secrets = await loadSecrets();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await loginViaApi(page, secrets);

  const seen = new Set();
  const results = [];

  for (const route of ROUTES) {
    const key = `${route.id}:${route.path}:${(route.forbidden || []).map((f) => f.source).join('|')}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let row;
    try {
      row = await evaluateRoute(page, route);
    } catch (e) {
      row = { ok: false, note: `erro: ${e.message}`, hits: [], bodySample: '' };
    }

    results.push({
      id: route.id,
      sev: route.sev,
      item: route.item,
      route: route.path,
      ok: row.ok,
      note: row.note,
      hits: row.hits,
    });
    const mark = row.ok ? 'OK' : 'FAIL';
    console.log(`[${mark}] ${route.id} ${route.item} — ${row.note}`);
  }

  await browser.close();

  const summary = {
    at: new Date().toISOString(),
    appUrl: BASE,
    source: 'Relatorio_Tecnico_UX_AeroSuite_1.pdf §3.5 (sistema)',
    total: results.length,
    ok: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
    items: results,
  };

  await writeFile(OUT_JSON, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`\nResumo: ${summary.ok}/${summary.total} aderente(s) — ${OUT_JSON}`);

  if (summary.fail > 0) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
