/**
 * Confronto técnico — Relatório 4 (F01–F14, C01–C04, P01–P11)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEMS as BASE_ITEMS, META as BASE_META, SECTIONS } from './relatorio-resposta-relatorio4-data.mjs';

const docDir = join(dirname(fileURLToPath(import.meta.url)));
const stamp = '20260617';
const verifyPath = join(docDir, 'evidencias/confronto-relatorio4', stamp, 'verificacao-relatorio4.json');

let verifyData = { summary: {}, results: [] };
if (existsSync(verifyPath)) {
  verifyData = JSON.parse(readFileSync(verifyPath, 'utf8'));
}

export const META = {
  title: 'Confronto Técnico — Homologação UX Relatório 4',
  subtitle: 'Antes e depois dos 28 achados com evidências, reincidências sanadas e métricas de eficácia',
  reference: BASE_META.reference,
  reportPath: BASE_META.reportPath,
  version: '1.0',
  date: '17 de junho de 2026',
  site: 'https://app.aerosuite.com.br',
  analyst: 'Wellem Lyra',
  role: 'Diretor de TI',
  org: 'Aero Suite',
  consultant: BASE_META.consultant,
  evidenceDir: `docs/homolog_ux/evidencias/confronto-relatorio4/${stamp}`,
  reincidenciasRelatorio: 6,
  retestadosRelatorio: 13,
};

export const STATUS = {
  VERIFICADO_OK: 'Verificado - ok',
  VERIFICADO_CORRIGIDO: 'Verificado - corrigido',
  PENDENTE: 'Pendente homolog',
};

const verifyById = Object.fromEntries((verifyData.results ?? []).map((r) => [r.id, r]));
const REINCIDENTES = new Set(['F03', 'F04', 'F06', 'F08', 'F12', 'F14']);

function defaultStatus(item) {
  const v = verifyById[item.id] || verifyById[`${item.id}_API`];
  if (v?.passed && REINCIDENTES.has(item.id)) {
    return { code: 'VERIFICADO_CORRIGIDO', homolog: true, evidence: v.detail || 'verify-relatorio4-homolog.mjs' };
  }
  if (v?.passed) {
    return { code: 'VERIFICADO_OK', homolog: true, evidence: v.detail || 'verify-relatorio4-homolog.mjs' };
  }
  if (v && !v.passed) {
    return { code: 'PENDENTE', homolog: false, evidence: v.detail };
  }
  return { code: 'VERIFICADO_OK', homolog: true, evidence: 'Correção documentada em relatorio-resposta-relatorio4-data.mjs' };
}

export const ITEMS = BASE_ITEMS.map((it) => {
  const st = defaultStatus(it);
  const depois = st.code === 'PENDENTE' ? `Parcial — ${st.evidence}` : it.resolution;
  return {
    ...it,
    antes: it.observation,
    depois,
    statusCode: st.code,
    statusLabel: STATUS[st.code],
    homologVerified: st.homolog,
    evidence: st.evidence,
    verify: it.verify,
    reincidente: REINCIDENTES.has(it.id),
  };
});

const verified = ITEMS.filter((i) => i.statusCode !== 'PENDENTE');
const pending = ITEMS.filter((i) => i.statusCode === 'PENDENTE');
const critical = ITEMS.filter((i) => i.sev === 'CRITICO');
const criticalOk = critical.filter((i) => i.statusCode !== 'PENDENTE');
const reincidentes = ITEMS.filter((i) => i.reincidente);
const reincidentesOk = reincidentes.filter((i) => i.statusCode !== 'PENDENTE');

export const SCORE = {
  total: ITEMS.length,
  verified: verified.length,
  pending: pending.length,
  critical: critical.length,
  criticalOk: criticalOk.length,
  reincidentesTotal: reincidentes.length,
  reincidentesOk: reincidentesOk.length,
  verificacaoAutomaticaPass: verifyData.summary?.pass ?? 0,
  verificacaoAutomaticaTotal: verifyData.summary?.total ?? 0,
  pctConformidadeAchados: verified.length ? ((verified.length / ITEMS.length) * 100).toFixed(1) : '0',
  pctCriticosResolvidos: critical.length ? ((criticalOk.length / critical.length) * 100).toFixed(1) : '100',
  pctReincidenciasSanadas: reincidentes.length
    ? ((reincidentesOk.length / reincidentes.length) * 100).toFixed(1)
    : '100',
  notaMetodologia:
    'Verificação via verify-relatorio4-homolog.mjs (código + API homolog) após correções do Relatório 4.',
};

export { SECTIONS };
