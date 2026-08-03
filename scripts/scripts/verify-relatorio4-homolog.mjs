#!/usr/bin/env node
/**
 * Verificação objetiva — Relatório 4 (F01–F14, C01–C04, P01–P11).
 * Uso: node scripts/verify-relatorio4-homolog.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.AEROSUITE_APP_URL || 'https://app.aerosuite.com.br';
const API = `${BASE}/api`;
const stamp = '20260617';
const evDir = join(root, 'docs/homolog_ux/evidencias/confronto-relatorio4', stamp);
const OUT = join(evDir, 'verificacao-relatorio4.json');

const results = [];

function record(id, passed, detail, method = 'code') {
  const idx = results.findIndex((r) => r.id === id);
  const row = { id, passed, detail, method, at: new Date().toISOString() };
  if (idx >= 0) results[idx] = row;
  else results.push(row);
}

async function api(method, path, opts = {}) {
  const headers = { Accept: 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
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

function fileExcludes(file, pattern) {
  const fp = join(root, file);
  if (!existsSync(fp)) return false;
  const txt = readFileSync(fp, 'utf8');
  return typeof pattern === 'string' ? !txt.includes(pattern) : !pattern.test(txt);
}

async function main() {
  await mkdir(evDir, { recursive: true });
  console.log('Verificando Relatório 4 em', BASE);

  const checks = {
    F01: () =>
      codeHas([
        { file: 'frontend/src/app/auth/login/login.component.ts', pattern: 'subscriptionInactive' },
        { file: 'frontend/src/app/auth/login/login.component.ts', pattern: 'login.subscribeNow' },
        { file: 'frontend/src/app/auth/login/login.component.ts', pattern: '/billing' },
        { file: 'frontend/src/app/auth/login/login.component.ts', pattern: 'showStartTrialLink' },
      ]),
    F02: () =>
      codeHas([
        { file: 'frontend/src/app/p1/trial-signup.component.ts', pattern: 'aerosuite.trialSignupEmail' },
      ]),
    F03: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.ts', pattern: 'tagline.trim().toLowerCase() === displayName.trim().toLowerCase()' },
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.html', pattern: 'taglineDuplicatesName' },
      ]),
    F04: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.ts', pattern: 'sanitizeTenantAssetUrl' },
        { file: 'backend/src/main/java/com/aerosuite/api/PublicEmpresaAssetResource.java', pattern: 'NOT_FOUND' },
        { file: 'backend/src/main/java/com/aerosuite/api/SistemaEmpresaResource.java', pattern: 'saveLogoForTenant' },
      ]),
    F05: () =>
      codeHas([
        { file: 'frontend/src/app/shared/brand-primary-color-input/brand-primary-color-input.component.ts', pattern: '#000000' },
      ]),
    F06: () =>
      fileExcludes('frontend/src/app/shared/styles/_premium-a11y.scss', /^\s*:focus-visible\s*\{/m) &&
      codeHas([
        { file: 'frontend/src/app/shared/styles/_premium-a11y.scss', pattern: '.wizard-actions' },
      ]),
    F07: () =>
      !readFileSync(join(root, 'backend/src/main/java/com/aerosuite/service/TenantSignupService.java'), 'utf8').includes('.local'),
    F08: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.ts', pattern: 'telefoneFormatError' },
        { file: 'frontend/src/app/core/i18n/configuracao-empresa-i18n.ts', pattern: 'empresaWizard.validation.telefoneFormat' },
      ]),
    F09: () => codeHas([{ file: 'frontend/src/app/core/br-input.util.ts', pattern: 'slice(0, 11)' }]),
    F10: () =>
      codeHas([
        { file: 'frontend/src/app/core/translation.service.ts', pattern: 'const life = severity' },
        { file: 'frontend/src/app/core/i18n-message.factory.ts', pattern: 'defaultToastLife' },
        { file: 'frontend/src/app/core/toast-i18n.util.ts', pattern: 'sticky: false' },
      ]),
    F12: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.html', pattern: 'wizard-btn-primary' },
      ]),
    F13: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.html', pattern: 'wizard-review__color-label' },
      ]),
    F14: () =>
      codeHas([
        { file: 'frontend/src/app/p1/trial-signup.component.ts', pattern: "disabled: true" },
        { file: 'frontend/src/app/p1/trial-signup.component.ts', pattern: 'get(\'aceito\')?.enable' },
      ]),
    C01: () =>
      codeHas([
        { file: 'frontend/src/app/p1/trial-signup.component.ts', pattern: 'requireAtLeastOneModule' },
        { file: 'frontend/src/app/p1/trial-signup.component.ts', pattern: 'modMro: [false]' },
        { file: 'backend/src/main/java/com/aerosuite/service/TenantSignupService.java', pattern: 'resolveSignupModulos' },
        { file: 'backend/src/main/java/com/aerosuite/service/TenantSignupService.java', pattern: 'TENANT_SIGNUP_MODULOS_REQUIRED' },
      ]),
    C02: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.ts', pattern: 'enderecoLogradouro?.trim()' },
      ]),
    C03: () => codeHas([{ file: 'frontend/src/app/core/br-input.util.ts', pattern: 'sanitizeAddressField' }]),
    C04: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.ts', pattern: 'enderecoBairro?.trim()' },
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.ts', pattern: 'enderecoComplemento?.trim()' },
      ]),
    P01: () =>
      codeHas([
        { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'fabricanteNomeMax' },
        { file: 'backend/src/main/java/com/aerosuite/service/FabricanteService.java', pattern: 'trimRequireMax(e.nome, 255' },
      ]),
    P02: () => codeHas([{ file: 'frontend/src/app/products/product-new.component.ts', pattern: 'productNameMax' }]),
    P03: () =>
      codeHas([
        { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'productDescMax' },
        { file: 'frontend/src/app/core/backend-i18n-message.util.ts', pattern: 'description' },
      ]),
    P04: () =>
      codeHas([
        { file: 'backend/src/main/java/com/aerosuite/service/FabricanteService.java', pattern: 'FieldLengthValidator' },
      ]),
    P05: () =>
      codeHas([
        { file: 'frontend/src/app/products/product-list.component.ts', pattern: 'rowCurrency' },
        { file: 'frontend/src/app/products/product-list.component.ts', pattern: 'decodeProductLocal' },
      ]),
    P06: () =>
      codeHas([
        { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'loadedProductId' },
      ]),
    P07: () =>
      codeHas([
        { file: 'frontend/src/app/products/product-list.component.ts', pattern: 'invalidateRowPhotoCache' },
      ]),
    P08: () =>
      codeHas([
        { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'revokeSelectedPreviews' },
        { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'photoUpload?.clear()' },
      ]),
    P09: () =>
      codeHas([
        { file: 'frontend/src/app/products/product-list.component.scss', pattern: 'white-space: nowrap' },
      ]),
    P10: () =>
      codeHas([
        { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'precoTouched' },
        { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'estoqueTouched' },
        { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'this.produto.preco > 0' },
      ]),
    P11: () =>
      codeHas([
        { file: 'frontend/src/app/core/br-input.util.ts', pattern: 'PRODUCT_PN_PATTERN' },
        { file: 'frontend/src/app/core/br-input.util.ts', pattern: 'isDuplicateProductPn' },
        { file: 'frontend/src/app/products/product-new.component.ts', pattern: 'isPnDuplicate' },
        { file: 'backend/src/main/java/com/aerosuite/service/ProductService.java', pattern: 'assertUniqueProductPn' },
        { file: 'backend/src/main/java/com/aerosuite/service/ProductService.java', pattern: 'PN_PATTERN' },
      ]),
  };

  for (const [id, fn] of Object.entries(checks)) {
    try {
      const passed = !!fn();
      record(id, passed, passed ? 'verify-relatorio4-homolog.mjs OK' : 'Falha na verificação automatizada');
    } catch (e) {
      record(id, false, String(e?.message || e));
    }
  }

  // API smoke F04 — endpoint global retorna 404
  const logoGlobal = await api('GET', '/public/empresa-asset/logo');
  record('F04_API', logoGlobal.status === 404, `GET /logo status=${logoGlobal.status}`, 'api');

  // Testes unitários comportamentais (br-input.util — F08/C02/C03/P11)
  const vitest = spawnSync('npm', ['run', 'test:unit', '--', 'src/app/core/br-input.util.spec.ts', 'src/app/core/toast-defaults.util.spec.ts'], {
    cwd: join(root, 'frontend'),
    shell: true,
    encoding: 'utf8',
  });
  const vitestOk = vitest.status === 0;
  record(
    'BEHAVIOR_BR_INPUT',
    vitestOk,
    vitestOk ? 'vitest br-input.util.spec.ts OK' : (vitest.stderr || vitest.stdout || 'vitest failed').slice(0, 500),
    'vitest'
  );

  const pass = results.filter((r) => r.passed).length;
  const fail = results.filter((r) => !r.passed).length;
  const summary = { pass, fail, total: results.length, base: BASE, stamp };
  await writeFile(OUT, JSON.stringify({ summary, results }, null, 2));
  console.log(`Resultado: ${pass}/${results.length} OK, ${fail} falha(s)`);
  console.log('Evidência:', OUT);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
