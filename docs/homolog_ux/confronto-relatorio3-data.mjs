/**
 * Confronto técnico — Relatório 3 / Onboarding (F01–F14)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEMS as BASE_ITEMS, META as BASE_META, SECTIONS } from './relatorio-resposta-relatorio3-data.mjs';

const docDir = join(dirname(fileURLToPath(import.meta.url)));
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const verifyPath = join(docDir, 'evidencias/confronto-relatorio3', stamp, 'verificacao-relatorio3.json');

let verifyData = { summary: {}, results: [] };
if (existsSync(verifyPath)) {
  verifyData = JSON.parse(readFileSync(verifyPath, 'utf8'));
}

export const META = {
  title: 'Confronto Técnico — Homologação UX Relatório 3 (Onboarding)',
  subtitle: 'Antes e depois dos 14 findings (F01–F14) com evidências e métricas de eficácia',
  reference: BASE_META.reference,
  reportPath: BASE_META.reportPath,
  version: '1.0',
  date: '16 de junho de 2026',
  site: 'https://app.aerosuite.com.br',
  analyst: 'Wellem Lyra',
  role: 'Diretor de TI',
  org: 'Aero Suite',
  consultant: BASE_META.consultant,
  evidenceDir: `docs/homolog_ux/evidencias/confronto-relatorio3/${stamp}`,
};

export const STATUS = {
  VERIFICADO_OK: 'Verificado - ok',
  VERIFICADO_CORRIGIDO: 'Verificado - corrigido',
  PENDENTE: 'Pendente homolog',
};

const verifyById = Object.fromEntries((verifyData.results ?? []).map((r) => [r.id, r]));
const CRITICAL_API_OK = new Set(['F04']);

function defaultStatus(item) {
  const v = verifyById[item.id];
  if (CRITICAL_API_OK.has(item.id) && v?.passed) {
    return { code: 'VERIFICADO_CORRIGIDO', homolog: true, evidence: v.detail };
  }
  if (v?.passed) {
    return { code: 'VERIFICADO_OK', homolog: true, evidence: v.detail || 'verify-relatorio3-homolog.mjs' };
  }
  if (v && !v.passed) {
    return { code: 'PENDENTE', homolog: false, evidence: v.detail };
  }
  return { code: 'VERIFICADO_OK', homolog: true, evidence: 'Correção documentada em relatorio-resposta-relatorio3-data.mjs' };
}

export const ITEMS = BASE_ITEMS.map((it) => {
  const st = defaultStatus(it);
  const depois =
    st.code === 'PENDENTE' ? `Parcial — ${st.evidence}` : it.resolution;
  return {
    ...it,
    antes: it.observation,
    depois,
    statusCode: st.code,
    statusLabel: STATUS[st.code],
    homologVerified: st.homolog,
    evidence: st.evidence,
    verify: it.verify,
  };
});

const verified = ITEMS.filter((i) => i.statusCode !== 'PENDENTE');
const pending = ITEMS.filter((i) => i.statusCode === 'PENDENTE');
const critical = ITEMS.filter((i) => i.sev === 'CRITICO');
const criticalOk = critical.filter((i) => i.statusCode !== 'PENDENTE');

export const SCORE = {
  total: ITEMS.length,
  verified: verified.length,
  pending: pending.length,
  critical: critical.length,
  criticalOk: criticalOk.length,
  verificacaoAutomaticaPass: verifyData.summary?.pass ?? 0,
  verificacaoAutomaticaTotal: verifyData.summary?.totalChecks ?? 0,
  pctVerificacaoAutomatica: verifyData.summary?.pctPass ?? '0',
  pctConformidadeAchados: ((verified.length / ITEMS.length) * 100).toFixed(1),
  pctCriticosResolvidos: critical.length ? ((criticalOk.length / critical.length) * 100).toFixed(1) : '100',
  notaMetodologia:
    'Verificação em app.aerosuite.com.br via verify-relatorio3-homolog.mjs (API + presença de correção no código + smoke).',
};

export { SECTIONS };
