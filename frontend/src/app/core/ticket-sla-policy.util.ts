import { TicketSlaPreview } from './ticket.service';

/** Espelha {@code TicketSlaPolicy} no backend — fallback quando a API não estiver disponível. */
export function computeTicketSlaPreview(
  prioridade?: string,
  ambiente?: string,
  categoria?: string
): TicketSlaPreview | null {
  if (!prioridade) {
    return null;
  }
  const prio = normalizePrioridade(prioridade);
  let basePr = basePrimeiraRespostaMinutos(prio);
  let baseRes = baseResolucaoMinutos(prio);
  const amb = normalizeAmbiente(ambiente);
  const factor = factorAmbiente(amb);
  const modifier = modifierAmbiente(amb);

  let pr = Math.max(30, Math.round(basePr * factor));
  let res = Math.max(pr * 2, Math.round(baseRes * factor));

  if (amb === 'PRODUCAO' && isCategoriaOperacional(categoria)) {
    res = Math.max(pr * 2, Math.round(res * 0.9));
  }

  return {
    primeiraRespostaMinutos: pr,
    resolucaoMinutos: res,
    primeiraRespostaHoras: minutosParaHorasArredondadas(pr),
    resolucaoHoras: minutosParaHorasArredondadas(res),
    ambienteModifier: modifier
  };
}

function normalizePrioridade(prioridade: string): string {
  return (prioridade || 'MEDIA').trim().toUpperCase();
}

function normalizeAmbiente(ambiente?: string): string {
  return ambiente?.trim().toUpperCase() ?? '';
}

function basePrimeiraRespostaMinutos(prioridade: string): number {
  switch (prioridade) {
    case 'CRITICA': return 60;
    case 'ALTA': return 240;
    case 'BAIXA': return 1440;
    default: return 480;
  }
}

function baseResolucaoMinutos(prioridade: string): number {
  switch (prioridade) {
    case 'CRITICA': return 240;
    case 'ALTA': return 1440;
    case 'BAIXA': return 4320;
    default: return 2880;
  }
}

function factorAmbiente(ambiente: string): number {
  switch (ambiente) {
    case 'PRODUCAO': return 0.5;
    case 'DESENVOLVIMENTO': return 1.5;
    default: return 1.0;
  }
}

function modifierAmbiente(ambiente: string): string {
  switch (ambiente) {
    case 'PRODUCAO': return 'ACCELERATED';
    case 'DESENVOLVIMENTO': return 'RELAXED';
    default: return 'STANDARD';
  }
}

function isCategoriaOperacional(categoria?: string): boolean {
  if (!categoria) return false;
  const c = categoria.trim().toUpperCase();
  return c === 'OS' || c === 'ESTOQUE' || c === 'INTEGRACAO' || c === 'FCU';
}

function minutosParaHorasArredondadas(minutos: number): number {
  return Math.max(1, Math.ceil(minutos / 60));
}
