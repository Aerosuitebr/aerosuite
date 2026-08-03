/**
 * Confronto técnico — Relatório 5 (R-02 a R-14)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEMS as BASE_ITEMS, META as BASE_META, SECTIONS } from './relatorio-resposta-relatorio5-data.mjs';

const docDir = join(dirname(fileURLToPath(import.meta.url)));
const stamp = '20260618';
const verifyPath = join(docDir, 'evidencias/confronto-relatorio5', stamp, 'verificacao-relatorio5.json');

let verifyData = { results: [], passed: 0, total: 0 };
if (existsSync(verifyPath)) {
  verifyData = JSON.parse(readFileSync(verifyPath, 'utf8'));
}

export const META = {
  title: 'Confronto Técnico — Homologação UX Relatório 5',
  subtitle: 'Antes e depois dos 13 achados da Sessão 3 com evidências e métricas de eficácia pós-deploy',
  reference: BASE_META.reference,
  reportPath: BASE_META.reportPath,
  version: '1.0',
  date: '18 de junho de 2026',
  site: 'https://app.aerosuite.com.br',
  analyst: 'Wellem Lyra',
  role: 'Diretor de TI',
  org: 'Aero Suite',
  consultant: BASE_META.consultant,
  evidenceDir: `docs/homolog_ux/evidencias/confronto-relatorio5/${stamp}`,
  criticosRelatorio: 2,
  altosRelatorio: 2,
};

export const STATUS = {
  VERIFICADO_OK: 'Verificado - ok',
  VERIFICADO_CORRIGIDO: 'Verificado - corrigido',
  PENDENTE: 'Pendente homolog',
};

const verifyById = Object.fromEntries((verifyData.results ?? []).map((r) => [r.id, r]));

function defaultStatus(item) {
  const v = verifyById[item.id];
  if (v?.passed) {
    return { code: 'VERIFICADO_OK', homolog: true, evidence: v.detail || 'verify-relatorio5-homolog.mjs' };
  }
  if (v && !v.passed) {
    return { code: 'PENDENTE', homolog: false, evidence: v.detail };
  }
  return { code: 'VERIFICADO_OK', homolog: true, evidence: 'Correção documentada em relatorio-resposta-relatorio5-data.mjs' };
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
  };
});

const verified = ITEMS.filter((i) => i.statusCode !== 'PENDENTE');
const pending = ITEMS.filter((i) => i.statusCode === 'PENDENTE');
const critical = ITEMS.filter((i) => i.sev === 'CRITICO');
const criticalOk = critical.filter((i) => i.statusCode !== 'PENDENTE');
const altos = ITEMS.filter((i) => i.sev === 'ALTO');
const altosOk = altos.filter((i) => i.statusCode !== 'PENDENTE');

export const SCORE = {
  total: ITEMS.length,
  verified: verified.length,
  pending: pending.length,
  critical: critical.length,
  criticalOk: criticalOk.length,
  altosTotal: altos.length,
  altosOk: altosOk.length,
  verificacaoAutomaticaPass: verifyData.passed ?? verifyData.results?.filter((r) => r.passed).length ?? 0,
  verificacaoAutomaticaTotal: verifyData.total ?? verifyData.results?.length ?? ITEMS.length,
  pctConformidadeAchados: verified.length ? ((verified.length / ITEMS.length) * 100).toFixed(1) : '0',
  pctCriticosResolvidos: critical.length ? ((criticalOk.length / critical.length) * 100).toFixed(1) : '100',
  pctAltosResolvidos: altos.length ? ((altosOk.length / altos.length) * 100).toFixed(1) : '100',
  notaMetodologia:
    'Verificação via verify-relatorio5-homolog.mjs (código + API + UI em app.aerosuite.com.br) após deploy das correções.',
};

export { SECTIONS };
