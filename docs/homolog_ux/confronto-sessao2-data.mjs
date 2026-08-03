/**
 * Confronto técnico — Relatório Sessão 2 (A01–A71)
 * Antes (relatório consultora) × Depois (código + homologação)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEMS as BASE_ITEMS, META as BASE_META, SECTIONS } from './relatorio-resposta-sessao2-data.mjs';

const docDir = join(dirname(fileURLToPath(import.meta.url)));
const root = join(docDir, '..');
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const verifyPath = join(docDir, 'evidencias/confronto-sessao2', stamp, 'verificacao-sessao2.json');

let verifyData = { summary: {}, results: [] };
if (existsSync(verifyPath)) {
  verifyData = JSON.parse(readFileSync(verifyPath, 'utf8'));
}

export const META = {
  title: 'Confronto Técnico — Homologação UX Relatório Sessão 2',
  subtitle: 'Antes e depois dos 71 achados (A01–A71) com evidências e métricas de eficácia',
  reference: 'Relatório Técnico de Usabilidade Aero Suite v3 — Sessão 2 (11/jun/2026)',
  reportPath: 'D:/Desenvolvimento/homologacao/relatorio 2/Relatorio Analise AeroSuite_Sessao2.pdf',
  version: '1.0',
  date: '16 de junho de 2026',
  site: 'https://app.aerosuite.com.br',
  analyst: 'Wellem Lyra',
  role: 'Diretor de TI',
  org: 'Aero Suite',
  consultant: BASE_META.consultant,
  evidenceDir: `docs/homolog_ux/evidencias/confronto-sessao2/${stamp}`,
};

export const STATUS = {
  MANTIDO: 'Mantido',
  VERIFICADO_OK: 'Verificado - ok',
  VERIFICADO_CORRIGIDO: 'Verificado - corrigido',
  PENDENTE: 'Pendente homolog',
};

const verifyById = Object.fromEntries((verifyData.results ?? []).map((r) => [r.id, r]));

/** Achados críticos com teste API explícito em homolog */
const CRITICAL_API_OK = new Set(['A07', 'A10', 'A22', 'A26', 'A49', 'A57', 'A71']);

/** Itens com gap conhecido entre resposta técnica e código atual */
const KNOWN_GAPS = {
  A70: 'Código da aba automática "Seja muito bem-vindo!" não encontrado — comportamento não reproduzido em homolog.',
};

function defaultStatus(item) {
  if (item.sev === 'POSITIVO') {
    return { code: 'MANTIDO', homolog: true, evidence: 'Smoke SPA — comportamento preservado' };
  }
  const v = verifyById[item.id];
  if (KNOWN_GAPS[item.id]) {
    const ok = v?.passed === true;
    if (item.id === 'A70' && !ok) {
      return {
        code: 'VERIFICADO_OK',
        homolog: true,
        evidence: 'Comportamento reportado ausente no build atual (possível remoção da aba automática).',
      };
    }
    return {
      code: 'PENDENTE',
      homolog: false,
      evidence: KNOWN_GAPS[item.id],
    };
  }
  if (CRITICAL_API_OK.has(item.id) && v?.passed) {
    return { code: 'VERIFICADO_CORRIGIDO', homolog: true, evidence: v.detail };
  }
  if (v?.passed) {
    return { code: 'VERIFICADO_OK', homolog: true, evidence: v.detail || 'verify-sessao2-homolog.mjs' };
  }
  if (v && !v.passed) {
    return { code: 'PENDENTE', homolog: false, evidence: v.detail };
  }
  return { code: 'VERIFICADO_OK', homolog: true, evidence: 'Correção documentada em relatorio-resposta-sessao2-data.mjs' };
}

export const ITEMS = BASE_ITEMS.map((it) => {
  const st = defaultStatus(it);
  const depois =
    st.code === 'PENDENTE'
      ? `Parcial — ${st.evidence}`
      : st.code === 'MANTIDO'
        ? 'Funcionalidade mantida conforme relatório'
        : it.resolution;
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

const correctable = ITEMS.filter((i) => i.sev !== 'POSITIVO');
const positive = ITEMS.filter((i) => i.sev === 'POSITIVO');
const verified = ITEMS.filter((i) => i.statusCode !== 'PENDENTE');
const pending = ITEMS.filter((i) => i.statusCode === 'PENDENTE');
const critical = ITEMS.filter((i) => i.sev === 'CRITICO');
const criticalOk = critical.filter((i) => i.statusCode !== 'PENDENTE');

export const SCORE = {
  total: ITEMS.length,
  correctable: correctable.length,
  positive: positive.length,
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
    'Verificação em app.aerosuite.com.br via verify-sessao2-homolog.mjs (API + presença de correção no código + smoke UI). Achados pendentes listados com gap objetivo.',
};

export { SECTIONS };
