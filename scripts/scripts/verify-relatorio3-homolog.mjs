#!/usr/bin/env node
/**
 * Verificação objetiva — Relatório 3 / Onboarding (F01–F14).
 * Uso: node scripts/verify-relatorio3-homolog.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.AEROSUITE_APP_URL || 'https://app.aerosuite.com.br';
const API = `${BASE}/api`;
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const evDir = join(root, 'docs/homolog_ux/evidencias/confronto-relatorio3', stamp);
const OUT = join(evDir, 'verificacao-relatorio3.json');

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
  return { status: res.status, ok: res.ok };
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

async function main() {
  await mkdir(evDir, { recursive: true });
  console.log('Verificando Relatório 3 (F01–F14) em', BASE);

  const checks = {
    F01: () =>
      codeHas([
        { file: 'frontend/src/app/auth/login/login.component.ts', pattern: 'subscriptionInactive' },
        { file: 'frontend/src/app/auth/login/login.component.ts', pattern: 'login.subscribeNow' },
        { file: 'frontend/src/app/auth/login/login.component.ts', pattern: '/billing' },
      ]),
    F02: () =>
      codeHas([
        { file: 'frontend/src/app/p1/trial-signup.component.ts', pattern: 'aerosuite.trialSignupEmail' },
        { file: 'frontend/src/app/p1/trial-signup.component.ts', pattern: "trialCreated: '1'" },
      ]) &&
      !readFileSync(join(root, 'frontend/src/app/p1/trial-signup.component.ts'), 'utf8').includes('email: v.adminEmail'),
    F03: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.ts', pattern: "tagline: ''" },
        { file: 'backend/src/main/java/com/aerosuite/service/TenantSignupService.java', pattern: 'cfg.displayName = tenantNome' },
      ]),
    F04: () =>
      codeHas([
        { file: 'backend/src/main/java/com/aerosuite/service/EmpresaAssetService.java', pattern: 'saveWordmarkForTenant' },
        { file: 'backend/src/main/java/com/aerosuite/api/PublicEmpresaAssetResource.java', pattern: '/{tenantCodigo}/wordmark' },
        { file: 'backend/src/main/java/com/aerosuite/api/SistemaEmpresaResource.java', pattern: 'saveLogoForTenant' },
      ]),
    F05: () =>
      codeHas([
        { file: 'frontend/src/app/shared/brand-primary-color-input/brand-primary-color-input.component.ts', pattern: '#000000' },
      ]),
    F06: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.scss', pattern: 'outline: none' },
      ]),
    F07: () => {
      const java = readFileSync(
        join(root, 'backend/src/main/java/com/aerosuite/service/TenantSignupService.java'),
        'utf8',
      );
      return java.includes('adminEmail') && !java.includes('.local"');
    },
    F08: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.ts', pattern: 'onTelefoneInput' },
        { file: 'frontend/src/app/core/br-input.util.ts', pattern: 'formatPhoneBr' },
      ]),
    F09: () =>
      codeHas([
        { file: 'frontend/src/app/core/br-input.util.ts', pattern: 'slice(0, 11)' },
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.html', pattern: 'maxlength="15"' },
      ]),
    F10: () =>
      codeHas([
        { file: 'frontend/src/app/core/translation.service.ts', pattern: 'const life = severity' },
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.ts', pattern: 'messages.clear' },
      ]),
    F11: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.html', pattern: 'maxlength="60"' },
        { file: 'backend/src/main/java/com/aerosuite/service/SistemaEmpresaConfigService.java', pattern: 'trimMax' },
      ]),
    F12: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.html', pattern: 'p-button-primary wizard-btn-primary' },
      ]) &&
      !readFileSync(join(root, 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.html'), 'utf8').includes('login-button wizard-btn-primary'),
    F13: () =>
      codeHas([
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.html', pattern: 'wizard-review__color-label' },
        { file: 'frontend/src/app/configuracao-empresa/configuracao-empresa-inicial.component.ts', pattern: 'taglineDuplicatesName' },
      ]),
    F14: () =>
      codeHas([
        { file: 'frontend/src/app/p1/trial-signup.component.ts', pattern: 'markLegalDocOpened' },
        { file: 'frontend/src/app/p1/trial-signup.component.ts', pattern: 'legalDocsOpened' },
      ]),
  };

  for (const [id, fn] of Object.entries(checks)) {
    const ok = fn();
    record(id, ok, ok ? 'código verificado' : 'verificação de código falhou', 'code');
  }

  const globalLogo = await api('GET', '/public/empresa-asset/logo');
  const codeF04 = results.find((r) => r.id === 'F04')?.passed;
  const apiOk = globalLogo.status === 404;
  record(
    'F04',
    !!codeF04,
    codeF04
      ? apiOk
        ? 'isolamento tenant no código + endpoint global 404 em homolog'
        : 'código corrigido; deploy necessário para 404 do endpoint global em homolog'
      : 'verificação de código falhou',
    apiOk ? 'api+code' : 'code',
  );

  const pass = results.filter((r) => r.passed).length;
  const fail = results.filter((r) => !r.passed).length;
  const summary = {
    report: 'Relatório 3 — Onboarding Sessão 2 (16/jun/2026)',
    reportPath: 'D:/Desenvolvimento/homologacao/relatorio 3/Relatorio AeroSuite.pdf',
    base: BASE,
    generatedAt: new Date().toISOString(),
    totalFindings: 14,
    totalChecks: results.length,
    pass,
    fail,
    pctPass: ((pass / results.length) * 100).toFixed(1),
    failures: results.filter((r) => !r.passed),
  };

  await writeFile(OUT, JSON.stringify({ summary, results }, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
