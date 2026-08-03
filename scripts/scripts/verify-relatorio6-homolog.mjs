#!/usr/bin/env node
/**
 * Verificação Relatório 6 (S4-01 a S4-36) — código + API/UI.
 * Uso: node scripts/verify-relatorio6-homolog.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.env.AEROSUITE_APP_URL || 'https://app.aerosuite.com.br').replace(/\/$/, '');
const API = `${BASE}/api`;
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const evDir = join(root, 'docs/homolog_ux/evidencias/confronto-relatorio6', stamp);
const OUT = join(evDir, 'verificacao-relatorio6.json');

const EMAIL = process.env.AEROSUITE_TEST_EMAIL || 'admin@aerosuite.com';
const PASSWORD = process.env.AEROSUITE_TEST_PASSWORD || 'admin123';
const TENANT = process.env.AEROSUITE_TEST_TENANT || 'default';

const results = [];
let token = null;
const created = { product: null, diretriz: null };

function record(id, passed, detail, method = 'code') {
  const idx = results.findIndex((r) => r.id === id);
  const row = { id, passed, detail, method, at: new Date().toISOString() };
  if (idx >= 0) results[idx] = row;
  else results.push(row);
}

function readFileText(rel) {
  const fp = join(root, rel);
  return existsSync(fp) ? readFileSync(fp, 'utf8') : '';
}

function codeHas(patterns) {
  for (const { file, pattern } of patterns) {
    const txt = readFileText(file);
    if (!txt) return false;
    const ok = typeof pattern === 'string' ? txt.includes(pattern) : pattern.test(txt);
    if (!ok) return false;
  }
  return true;
}

function codeLacks(file, pattern) {
  const txt = readFileText(file);
  if (!txt) return false;
  return typeof pattern === 'string' ? !txt.includes(pattern) : !pattern.test(txt);
}

function extractPtOsFormValues() {
  const txt = readFileText('frontend/src/app/core/i18n/os-form-i18n.ts');
  const m = txt.match(/export const OS_FORM_PT_BR[\s\S]*?= \{([\s\S]*?)\};/);
  if (!m) return [];
  const values = [];
  for (const line of m[1].split('\n')) {
    const vm = line.match(/:\s*'([^']*)'/);
    if (vm) values.push(vm[1]);
  }
  return values;
}

function auditOsFormPtBr() {
  const forbidden = [
    { re: /Time Since New/i, label: 'Time Since New' },
    { re: /Time Since Overhaul/i, label: 'Time Since Overhaul' },
    { re: /^Serial Number$/i, label: 'Serial Number' },
    { re: /^Part Number$/i, label: 'Part Number' },
    { re: /Manual Part Number/i, label: 'Manual Part Number' },
    { re: /^ATA Manual$/i, label: 'ATA Manual' },
    { re: /Serial Number do Motor/i, label: 'Serial Number do Motor' },
  ];
  const values = extractPtOsFormValues();
  const hits = [];
  for (const v of values) {
    for (const f of forbidden) {
      if (f.re.test(v)) hits.push(`${f.label} → "${v}"`);
    }
  }
  return { ok: hits.length === 0, hits };
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
    throw new Error(`Login falhou status=${loginRes.status}`);
  }
  token = loginRes.body.token;
  const meRes = await api('GET', '/auth/me');
  if (!meRes.ok) throw new Error(`GET /auth/me falhou status=${meRes.status}`);
  return { tenantCodigo };
}

function staticChecks() {
  const s401 = codeHas([
    { file: 'frontend/src/app/products/product-meta.util.ts', pattern: 'FABRICANTE_NAME_MAX = 100' },
    { file: 'frontend/src/app/products/product-new.component.scss', pattern: 'fabricante-label-truncate' },
  ]);
  const s429 = codeHas([{ file: 'frontend/src/styles.scss', pattern: 'p-dropdown.p-invalid' }]);
  const osPt = auditOsFormPtBr();

  const map = {
    'S4-01': s401,
    'S4-02': s401,
    'S4-03': codeHas([
      { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'preco >= 0' },
    ]),
    'S4-04': codeHas([
      { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'observacoes.length' },
    ]),
    'S4-05': codeHas([
      { file: 'frontend/src/app/products/product-meta.util.ts', pattern: 'PRODUCT_SPEC_TEXT_MAX' },
      { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'productSpecTextMax' },
    ]),
    'S4-06': codeHas([
      { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'fieldInvalid(' },
      { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'formAttempted' },
    ]),
    'S4-07': codeHas([
      { file: 'backend/src/main/resources/db/migration/V77__relatorio6_homolog_fixes.sql', pattern: 'VARCHAR(255)' },
      { file: 'backend/src/main/java/com/aerosuite/domain/Product.java', pattern: 'length = 255' },
    ]),
    'S4-08': codeHas([
      { file: 'frontend/src/app/products/product-list.component.ts', pattern: 'cell-truncate' },
      { file: 'frontend/src/styles.scss', pattern: '.cell-truncate' },
    ]),
    'S4-09': codeHas([{ file: 'frontend/src/app/products/product-list.component.ts', pattern: 'products.list.col.status' }]),
    'S4-11': codeHas([{ file: 'frontend/src/app/products/product-list.component.ts', pattern: 'fabricanteNome' }]),
    'S4-12': codeHas([{ file: 'frontend/src/app/products/product-list.component.ts', pattern: 'dblclick' }]),
    'S4-13': codeHas([{ file: 'frontend/src/app/core/i18n/screens-misc-i18n.ts', pattern: 'reports.csv.col.createdAt' }]),
    'S4-14': codeHas([{ file: 'frontend/src/app/relatorios/relatorios.component.ts', pattern: 'productsActive' }]),
    'S4-15': codeHas([
      { file: 'frontend/src/app/core/i18n/forms-misc-i18n.ts', pattern: '+55 (00) 00000-0000 ou +1 555 123 4567' },
    ]),
    'S4-16': codeHas([
      { file: 'backend/src/main/java/com/aerosuite/domain/UsuarioExterno.java', pattern: 'conviteEnviadoEm' },
      { file: 'frontend/src/app/usuarios-externos/usuarios-externos-list.component.ts', pattern: 'formatLastAccess' },
    ]),
    'S4-17': codeHas([
      {
        file: 'backend/src/main/java/com/aerosuite/i18n/TransactionalEmailMessages.java',
        pattern: 'if (blank(setupUrl) && !blank(senhaTemporaria))',
      },
    ]),
    'S4-18': codeHas([
      { file: 'backend/src/main/java/com/aerosuite/i18n/TransactionalEmailMessages.java', pattern: 'portalSupportFooter' },
    ]),
    'S4-20': codeHas([
      { file: 'backend/src/main/resources/db/migration/V77__relatorio6_homolog_fixes.sql', pattern: 'funcionalidade_externa' },
    ]),
    'S4-22': codeHas([
      { file: 'frontend/src/app/associacao-fcu/associacao-fcu.component.ts', pattern: 'size: 200' },
    ]) && codeLacks('frontend/src/app/associacao-fcu/associacao-fcu.component.ts', 'size: 1000'),
    'S4-24': codeHas([
      { file: 'backend/src/main/java/com/aerosuite/api/PublicHealthResource.java', pattern: 'PublicHealthResource' },
      { file: 'frontend/src/app/core/app-health.service.ts', pattern: '/public/health' },
    ]),
    'S4-25': osPt.ok && codeHas([
      { file: 'frontend/src/app/core/i18n/os-form-i18n.ts', pattern: 'Tempo desde novo (TSN)' },
      { file: 'frontend/src/app/core/i18n/os-form-i18n.ts', pattern: 'Número de série do motor' },
    ]),
    'S4-26': codeHas([{ file: 'frontend/src/app/core/i18n/os-form-i18n.ts', pattern: 'numberGeneratedOnSave' }]),
    'S4-27': codeHas([{ file: 'frontend/src/app/core/i18n/os-form-i18n.ts', pattern: "'os.form.accordion.service': 'Serviço'" }]),
    'S4-29': s429,
    'S4-33': codeHas([{ file: 'frontend/src/styles.scss', pattern: 'white-space: pre-line' }]),
    'S4-34': codeHas([
      { file: 'frontend/src/app/core/branding.service.ts', pattern: 'allowSessionTenant' },
      { file: 'backend/src/main/java/com/aerosuite/service/SistemaEmpresaConfigService.java', pattern: 'S4-34' },
    ]),
    'S4-35': s429,
    'S4-36': codeHas([
      { file: 'backend/src/main/java/com/aerosuite/service/AeroDiretrizService.java', pattern: 'entityManager.flush()' },
    ]),
  };

  for (const [id, passed] of Object.entries(map)) {
    let detail = passed ? 'Verificação estática OK' : 'Padrão esperado não encontrado no código';
    if (id === 'S4-25' && !osPt.ok) {
      detail = `Inglês residual pt-BR: ${osPt.hits.join('; ')}`;
    }
    record(id, passed, detail, 'code');
  }
}

async function testS407() {
  const suffix = Date.now();
  const res = await api('POST', '/products', {
    body: {
      name: 'P'.repeat(255),
      productpn: `R6-${suffix}`,
      price: 1,
      quantity: 0,
      status: 'ATIVO',
      isActive: true,
    },
  });
  const ok = (res.status === 201 || res.status === 200) && !isUnexpectedError(res);
  if (res.body?.id) created.product = res.body.id;
  record('S4-07-api', ok, ok ? `Produto 255 chars id=${res.body?.id}` : `status=${res.status}`, 'api');
}

async function testS422() {
  const res = await api('GET', '/fcu?isActive=true&size=200&page=0');
  record('S4-22-api', res.ok, `GET /fcu size=200 status=${res.status}`, 'api');
}

async function testS436() {
  const suffix = Date.now();
  const res = await api('POST', '/aero/diretrizes', {
    body: {
      tipo: 'AD',
      numero: `R6-AD-${suffix}`,
      titulo: `Homolog R6 AD ${suffix}`,
      status: 'ABERTA',
    },
  });
  const ok = res.status === 201 && !isUnexpectedError(res);
  if (res.body?.id) created.diretriz = res.body.id;
  record('S4-36-api', ok, ok ? `AD id=${res.body?.id}` : `status=${res.status}`, 'api');
}

async function testS420() {
  const res = await api('GET', '/funcionalidades-externas');
  if (!res.ok || !Array.isArray(res.body)) {
    record('S4-20-api', false, `status=${res.status}`, 'api');
    return;
  }
  const corrupt = res.body.some((f) => /\?\?/.test(`${f.nome || ''}${f.descricao || ''}`));
  record('S4-20-api', !corrupt, corrupt ? 'encoding ?? detectado' : 'cards UTF-8 OK', 'api');
}

async function cleanup() {
  if (created.product) await api('DELETE', `/products/${created.product}`);
  if (created.diretriz) await api('DELETE', `/aero/diretrizes/${created.diretriz}`);
}

async function testPublicEndpoints() {
  const healthRes = await api('GET', '/public/health');
  const healthOk = healthRes.ok && healthRes.body?.ok === true;
  record(
    'S4-24-api',
    healthOk,
    healthOk
      ? `health ok=${healthRes.body.ok} database=${healthRes.body.database}`
      : `GET /public/health status=${healthRes.status} (deploy pendente?)`,
    'api'
  );

  const brandRes = await api('GET', '/public/sistema-empresa/branding');
  const brandOk = brandRes.ok && brandRes.body?.configured === false;
  record(
    'S4-34-api',
    brandOk,
    brandOk
      ? `branding configured=${brandRes.body?.configured}`
      : `GET branding status=${brandRes.status} (deploy pendente?)`,
    'api'
  );
}

async function testUiBundle() {
  try {
    const html = await fetch(BASE).then((r) => r.text());
    const m = html.match(/src="([^"]*main[^"]+\.js)"/);
    if (!m) {
      record('deploy-ui', false, 'Bundle main.js não encontrado no HTML', 'ui-bundle');
      return;
    }
    const src = m[1];
    const jsUrl = src.startsWith('http') ? src : src.startsWith('/') ? `${BASE}${src}` : `${BASE}/${src}`;
    const js = await fetch(jsUrl).then((r) => r.text());
    const checks = {
      'S4-08-ui': js.includes('cell-truncate'),
      'S4-06-ui': js.includes('formAttempted') || js.includes('fieldInvalid'),
      'S4-25-ui': js.includes('Tempo desde novo') || js.includes('Tempo desde'),
      'S4-24-ui': js.includes('statusDegraded') || js.includes('footer.statusDegraded'),
      'S4-34-ui': js.includes('allowSessionTenant'),
    };
    for (const [id, ok] of Object.entries(checks)) {
      record(id, ok, ok ? 'Presente no bundle deployado' : 'Ausente no bundle (deploy pendente?)', 'ui-bundle');
    }
  } catch (e) {
    record('deploy-ui', false, String(e.message || e), 'ui-bundle');
  }
}

async function main() {
  await mkdir(evDir, { recursive: true });
  console.log(`Reteste Relatório 6 em ${BASE}`);
  staticChecks();

  try {
    await login();
    await testS407();
    await testS422();
    await testS436();
    await testS420();
    await cleanup();
  } catch (e) {
    record('AUTH', false, String(e.message || e), 'api');
    console.warn('Testes API autenticados indisponíveis:', e.message || e);
  }

  await testPublicEndpoints();
  await testUiBundle();

  const staticFailed = results.filter((r) => r.method === 'code' && !r.passed);
  const apiFailed = results.filter((r) => r.method === 'api' && !r.passed && r.id !== 'AUTH');
  const uiFailed = results.filter((r) => r.method === 'ui-bundle' && !r.passed);
  const s4Ids = results.filter((r) => /^S4-\d+$/.test(r.id));
  const s4Passed = s4Ids.filter((r) => r.passed).length;

  const summary = {
    base: BASE,
    stamp,
    s4Achados: { total: s4Ids.length, passed: s4Passed, open: s4Ids.filter((r) => !r.passed) },
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    staticFailed,
    apiFailed,
    uiFailed,
    deployRequired: apiFailed.length > 0 || uiFailed.length > 0,
    failed: results.filter((r) => !r.passed),
    results,
  };
  await writeFile(OUT, JSON.stringify(summary, null, 2));
  console.log(`Achados S4 (código): ${s4Passed}/${s4Ids.length} OK`);
  console.log(`Total: ${summary.passed}/${summary.total} OK`);
  if (staticFailed.length) {
    console.log('Falhas estáticas:', staticFailed.map((f) => f.id).join(', '));
  }
  if (apiFailed.length || uiFailed.length) {
    console.log('Deploy pendente — falhas API/UI:', [...apiFailed, ...uiFailed].map((f) => f.id).join(', '));
  }
  console.log(`Relatório: ${OUT}`);
  process.exit(staticFailed.length ? 1 : 0);
}

main();
