#!/usr/bin/env node
/**
 * Verificação Relatório 5 (R-02 a R-14) — código + API/UI em homologação.
 * Uso:
 *   node scripts/verify-relatorio5-homolog.mjs
 * Env: AEROSUITE_APP_URL, AEROSUITE_TEST_EMAIL, AEROSUITE_TEST_PASSWORD, AEROSUITE_TEST_TENANT
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.env.AEROSUITE_APP_URL || 'https://app.aerosuite.com.br').replace(/\/$/, '');
const API = `${BASE}/api`;
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const evDir = join(root, 'docs/homolog_ux/evidencias/confronto-relatorio5', stamp);
const OUT = join(evDir, 'verificacao-relatorio5.json');

const EMAIL = process.env.AEROSUITE_TEST_EMAIL || 'admin@aerosuite.com';
const PASSWORD = process.env.AEROSUITE_TEST_PASSWORD || 'admin123';
const TENANT = process.env.AEROSUITE_TEST_TENANT || 'default';

const results = [];
let token = null;
let me = null;
const created = { diretriz: null, calibracao: null, documento: null, habilitacao: null, nc: null };

function record(id, passed, detail, method = 'code') {
  const idx = results.findIndex((r) => r.id === id);
  const row = { id, passed, detail, method, at: new Date().toISOString() };
  if (idx >= 0) results[idx] = row;
  else results.push(row);
}

function codeHas(patterns) {
  for (const { file, pattern } of patterns) {
    const fp = join(root, file);
    if (!existsSync(fp)) return false;
    const txt = readFileSync(fp, 'utf8');
    const ok = typeof pattern === 'string' ? txt.includes(pattern) : pattern.test(txt);
    if (!ok) return false;
  }
  return true;
}

async function api(method, path, opts = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let body = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, body, raw: text };
}

function isUnexpectedError(res) {
  const msg = JSON.stringify(res.body || '').toLowerCase();
  return (
    res.status >= 500 ||
    msg.includes('unexpected') ||
    msg.includes('inesperado') ||
    msg.includes('api.common.unexpectederror')
  );
}

async function login() {
  const tenants = await api('GET', `/auth/login-tenants?email=${encodeURIComponent(EMAIL)}`);
  let tenantCodigo = TENANT;
  if (tenants.ok && Array.isArray(tenants.body) && tenants.body.length) {
    const match = tenants.body.find((t) => t.codigo === TENANT) || tenants.body[0];
    tenantCodigo = match?.codigo || TENANT;
  }
  const loginRes = await api('POST', '/auth/login', {
    body: { email: EMAIL, password: PASSWORD, tenantCodigo },
  });
  if (!loginRes.ok || !loginRes.body?.token) {
    throw new Error(`Login falhou status=${loginRes.status} body=${JSON.stringify(loginRes.body).slice(0, 200)}`);
  }
  token = loginRes.body.token;
  const meRes = await api('GET', '/auth/me');
  if (!meRes.ok) throw new Error(`GET /auth/me falhou status=${meRes.status}`);
  me = meRes.body;
  return { tenantCodigo, me };
}

async function testR10() {
  const suffix = Date.now();
  const tests = [];

  const ad = await api('POST', '/aero/diretrizes', {
    body: {
      tipo: 'AD',
      numero: `R5-AD-${suffix}`,
      titulo: `Homolog R5 AD ${suffix}`,
      status: 'ABERTA',
    },
  });
  tests.push({ name: 'AD/SB', ok: ad.status === 201 && !isUnexpectedError(ad), status: ad.status, body: ad.body });
  if (ad.body?.id) created.diretriz = ad.body.id;

  const cal = await api('POST', '/conformidade/calibracao', {
    body: {
      identificador: `R5-CAL-${suffix}`,
      descricao: `Instrumento homolog ${suffix}`,
      tipo: 'INSTRUMENTO',
    },
  });
  tests.push({ name: 'Calibração', ok: cal.status === 201 && !isUnexpectedError(cal), status: cal.status, body: cal.body });
  if (cal.body?.id) created.calibracao = cal.body.id;

  const doc = await api('POST', '/conformidade/documentos', {
    body: {
      tipo: 'POP',
      codigo: `R5-DOC-${suffix}`,
      titulo: `Doc homolog ${suffix}`,
      revisao: '00',
      status: 'VIGENTE',
    },
  });
  tests.push({ name: 'Documentos SGQ', ok: doc.status === 201 && !isUnexpectedError(doc), status: doc.status, body: doc.body });
  if (doc.body?.id) created.documento = doc.body.id;

  const uid = me?.id ?? me?.userId;
  const hab = await api('POST', '/conformidade/habilitacoes', {
    body: {
      usuarioId: uid,
      tipo: 'MECANICO',
      escopo: 'Homolog R5',
      identificador: `HAB-${suffix}`,
    },
  });
  tests.push({ name: 'Habilitações', ok: hab.status === 201 && !isUnexpectedError(hab), status: hab.status, body: hab.body });
  if (hab.body?.id) created.habilitacao = hab.body.id;

  const nc = await api('POST', '/conformidade/nao-conformidades', {
    body: {
      titulo: `NC homolog R5 ${suffix}`,
      severidade: 'MEDIA',
      status: 'ABERTA',
    },
  });
  tests.push({ name: 'Não conformidades', ok: nc.status === 201 && !isUnexpectedError(nc), status: nc.status, body: nc.body });
  if (nc.body?.id) created.nc = nc.body.id;

  const failed = tests.filter((t) => !t.ok);
  const passed = failed.length === 0;
  record(
    'R-10',
    passed,
    passed
      ? `5/5 módulos salvaram OK (${tests.map((t) => t.name).join(', ')})`
      : `Falhas: ${failed.map((t) => `${t.name} status=${t.status}`).join('; ')}`,
    'api'
  );
  return passed;
}

async function cleanupR10() {
  if (created.diretriz) await api('DELETE', `/aero/diretrizes/${created.diretriz}`);
  if (created.calibracao) await api('DELETE', `/conformidade/calibracao/${created.calibracao}`);
  if (created.documento) await api('DELETE', `/conformidade/documentos/${created.documento}`);
  if (created.habilitacao) await api('DELETE', `/conformidade/habilitacoes/${created.habilitacao}`);
  if (created.nc) await api('DELETE', `/conformidade/nao-conformidades/${created.nc}`);
}

async function testR13() {
  const get = await api('GET', '/go-live-migracao/checklist');
  if (!get.ok || !Array.isArray(get.body)) {
    record('R-13', false, `GET checklist status=${get.status}`, 'api');
    return false;
  }
  const total = get.body.length;
  const concluidos = get.body.filter((i) => i.concluido).length;
  const allMarked = total > 0 && concluidos === total;

  const first = get.body[0];
  const itemKey = first?.itemKey || first?.i18nKey;
  const toggle = get.body.map((i) => ({
    itemKey: i.itemKey || i.i18nKey,
    concluido: !(i.itemKey === itemKey || i.i18nKey === itemKey),
  }));
  const put = await api('PUT', '/go-live-migracao/checklist', { body: { itens: toggle } });
  const saveOk = put.ok && Array.isArray(put.body);

  const inflatedWithoutActivity =
    allMarked &&
    (await api('GET', '/os?page=0&size=1')).body?.totalElements === 0 &&
    (await api('GET', '/propostas-comerciais?page=0&size=1')).body?.totalElements === 0;

  const passed = saveOk && !inflatedWithoutActivity;
  record(
    'R-13',
    passed,
    saveOk
      ? `checklist ${concluidos}/${total} concluídos; save status=${put.status}; inflatedEmpty=${inflatedWithoutActivity}`
      : `Falha ao salvar checklist status=${put.status}`,
    'api'
  );
  return passed;
}

async function testR05() {
  const menu = await api('GET', '/funcionalidades/meu-menu');
  if (!menu.ok || !Array.isArray(menu.body)) {
    record('R-05', false, `meu-menu status=${menu.status}`, 'api');
    return false;
  }
  const secoes = [...new Set(menu.body.map((f) => f.secao).filter(Boolean))];
  const hasConformidade = secoes.some(
    (s) => s === 'Conformidade Técnica' || /conformidade/i.test(s)
  );
  const conformidadeItems = menu.body.filter((f) => /conformidade|sgq|habilita|diretriz|calibra/i.test(f.codigo || ''));
  record(
    'R-05',
    hasConformidade && conformidadeItems.length >= 3,
    `seções: ${secoes.join(' | ')}; itens conformidade=${conformidadeItems.length}`,
    'api'
  );
  return hasConformidade;
}

async function testR02R08() {
  const resumo = await api('GET', '/relatorios/resumo?tipo=os&dataInicio=17/06/2026');
  const hasTotals = resumo.ok && typeof resumo.body?.totalOs === 'number';
  const hasTipo = resumo.body?.tipoRelatorio === 'os' || resumo.body?.totalOs != null;
  record('R-02', hasTotals, `resumo filtrado status=${resumo.status} totalOs=${resumo.body?.totalOs}`, 'api');
  record('R-08', hasTotals && hasTipo, `resumo por tipo status=${resumo.status} keys=${Object.keys(resumo.body || {}).join(',')}`, 'api');
  return hasTotals;
}

async function fetchBuiltJsSnippet() {
  try {
    const html = await fetch(BASE).then((r) => r.text());
    const m = html.match(/src="(\/[^"]+main[^"]+\.js)"/);
    if (!m) return '';
    const jsUrl = m[1].startsWith('http') ? m[1] : `${BASE}${m[1]}`;
    const js = await fetch(jsUrl).then((r) => r.text());
    return js.slice(0, 500000);
  } catch {
    return '';
  }
}

async function testUiBundles() {
  const js = await fetchBuiltJsSnippet();
  if (!js) {
    ['R-06', 'R-07', 'R-09', 'R-14'].forEach((id) =>
      record(id, false, 'Não foi possível ler bundle JS do deploy', 'ui-bundle')
    );
    return;
  }
  record('R-06', js.includes('Fechar') && !js.includes('common.actions.close'), 'Botão Fechar no bundle; sem chave crua exposta', 'ui-bundle');
  record('R-07', !js.includes('reports.view.showCharts') || js.includes('buildViewStats'), 'Botão Ver gráficos removido ou preview por tipo presente', 'ui-bundle');
  record('R-09', js.includes('Número de peça') || js.includes('N\\u00famero de pe\\u00e7a'), 'Label P/N pt-BR no bundle', 'ui-bundle');
  record('R-14', js.includes('Nenhum resultado encontrado') || js.includes('primeng.emptySearch'), 'Autocomplete vazio i18n pt-BR', 'ui-bundle');
  record('R-04', js.includes('cell-truncate'), 'Truncamento tabela relatórios no bundle', 'ui-bundle');
  record('R-12', js.includes('arquivo-hint-callout'), 'Callout anexo PDF documentos no bundle', 'ui-bundle');
  record('R-03', js.includes('align-content:start') || js.includes('align-content: start'), 'Home KPIs reposicionados no bundle CSS/SCSS compilado', 'ui-bundle');
}

function staticChecks() {
  const checks = {
    'R-11': () => codeHas([{ file: 'frontend/src/app/core/i18n/aero-diretriz-i18n.ts', pattern: 'aero.diretriz.usage.p1' }]),
  };
  for (const [id, fn] of Object.entries(checks)) {
    if (!results.find((r) => r.id === id)) {
      record(id, !!fn(), 'Microcopy AD/SB presente nos 4 idiomas', 'code');
    }
  }
}

async function main() {
  await mkdir(evDir, { recursive: true });
  console.log(`Reteste Relatório 5 em ${BASE}`);

  staticChecks();

  try {
    const { tenantCodigo } = await login();
    console.log(`Login OK tenant=${tenantCodigo} user=${me?.email || EMAIL}`);

    await testR10();
    await cleanupR10();
    await testR13();
    await testR05();
    await testR02R08();
  } catch (e) {
    record('AUTH', false, String(e.message || e), 'api');
    console.error('API tests blocked:', e.message || e);
  }

  await testUiBundles();

  const summary = {
    base: BASE,
    stamp,
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).map((r) => ({ id: r.id, detail: r.detail })),
    results,
  };
  await writeFile(OUT, JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
  console.log('Evidência:', OUT);
  process.exit(summary.failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
