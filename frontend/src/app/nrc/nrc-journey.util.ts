import { Nrc, NrcAcao } from '../core/nrc.service';

export type NrcJornadaStep = 'REGISTRO' | 'CONTENCAO' | 'CAUSA' | 'ACOES' | 'EFICACIA' | 'ENCERRADA';

export const NRC_JORNADA_STEPS: NrcJornadaStep[] = [
  'REGISTRO', 'CONTENCAO', 'CAUSA', 'ACOES', 'EFICACIA'
];

export function parseJourneyStepParam(raw?: string | null): NrcJornadaStep | undefined {
  const normalized = raw?.trim().toUpperCase();
  if (!normalized) return undefined;
  const aliases: Record<string, NrcJornadaStep> = {
    TRATAMENTO: 'CONTENCAO',
    ACAO_CORRETIVA: 'ACOES',
    ANALISE: 'CAUSA',
    EM_ANALISE: 'CAUSA'
  };
  const step = aliases[normalized] ?? normalized;
  if (NRC_JORNADA_STEPS.includes(step as NrcJornadaStep)) {
    return step as NrcJornadaStep;
  }
  return undefined;
}

export function resolveEtapa(nrc?: Nrc): NrcJornadaStep {
  if (!nrc) return 'REGISTRO';
  if (nrc.etapaAtual) return nrc.etapaAtual as NrcJornadaStep;
  if (nrc.status === 'ENCERRADA') return 'ENCERRADA';
  return 'CONTENCAO';
}

export function stepIndex(step: NrcJornadaStep): number {
  if (step === 'ENCERRADA') return NRC_JORNADA_STEPS.length;
  const idx = NRC_JORNADA_STEPS.indexOf(step);
  return idx >= 0 ? idx : 0;
}

export function isStepComplete(nrc: Nrc, step: NrcJornadaStep): boolean {
  const current = stepIndex(resolveEtapa(nrc));
  const target = stepIndex(step);
  if (nrc.status === 'ENCERRADA') return true;
  return target < current;
}

export function isStepAccessible(nrc: Nrc, step: NrcJornadaStep): boolean {
  if (step === 'REGISTRO') return true;
  if (nrc.status === 'ENCERRADA') return true;
  const etapa = resolveEtapa(nrc);
  const targetIdx = stepIndex(step);
  const etapaIdx = stepIndex(etapa);
  // RNC ABERTA fica em etapa REGISTRO até salvar correção imediata; ainda assim o responsável
  // precisa abrir Correção imediata para iniciar o tratamento (Avançar / stepper).
  if (etapa === 'REGISTRO' && step === 'CONTENCAO') return true;
  return targetIdx <= etapaIdx;
}

export function allAcoesConcluidas(acoes?: NrcAcao[]): boolean {
  if (!acoes?.length) return false;
  return acoes.every(a => a.status === 'CONCLUIDA');
}

export function emptyAcao(): NrcAcao {
  return { status: 'PENDENTE', ordemItem: 0 };
}

/** Dias de SLA sugeridos por severidade (ISO / boas práticas SGQ). */
export const NRC_SLA_DAYS: Record<string, number> = {
  MENOR: 30,
  MAIOR: 15,
  CRITICA: 7
};

export function slaDaysForSeveridade(severidade?: string | null): number {
  if (!severidade) return NRC_SLA_DAYS['MENOR'];
  return NRC_SLA_DAYS[severidade] ?? NRC_SLA_DAYS['MENOR'];
}

/** Data limite sugerida a partir de hoje + SLA da severidade. */
export function suggestedPrazoDate(severidade?: string | null, from: Date = new Date()): Date {
  const days = slaDaysForSeveridade(severidade);
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

/** Dias restantes até o prazo (negativo = vencido). */
export function daysUntilPrazo(prazoTratamento?: string | null): number | null {
  if (!prazoTratamento) return null;
  const deadline = new Date(prazoTratamento);
  if (Number.isNaN(deadline.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
