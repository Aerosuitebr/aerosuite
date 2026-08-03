/** English → Portuguese fallback lexicon for assembly local translation. */
export const FCU_ASSEMBLY_LOCAL_LEXICON: Readonly<Record<string, string>> = {
  assembly: 'montagem',
  install: 'instalar',
  clean: 'limpar',
  lubricate: 'lubrificar',
  adjust: 'ajustar',
  tighten: 'apertar',
  loosen: 'afrouxar',
  replace: 'substituir',
  check: 'verificar',
  measure: 'medir',
  position: 'posicionar',
  align: 'alinhar',
  connect: 'conectar',
  disconnect: 'desconectar',
  attach: 'fixar',
  detach: 'desprender',
  secure: 'fixar',
  release: 'liberar',
  apply: 'aplicar',
  insert: 'inserir',
  extract: 'extrair',
  rotate: 'girar',
  turn: 'virar',
  push: 'empurrar',
  pull: 'puxar',
  lift: 'levantar',
  lower: 'abaixar',
  open: 'abrir',
  close: 'fechar',
  start: 'iniciar',
  stop: 'parar',
  continue: 'continuar',
  complete: 'completar',
  finish: 'finalizar',
  begin: 'começar',
  end: 'terminar',
  caution: 'cuidado',
  warning: 'advertência',
  note: 'nota',
  important: 'importante',
  attention: 'atenção',
  danger: 'perigo',
  hazard: 'risco',
  screw: 'parafuso',
  bolt: 'parafuso',
  nut: 'porca',
  washer: 'arruela',
  gasket: 'junta',
  seal: 'vedação',
  bearing: 'rolamento',
  shaft: 'eixo',
  gear: 'engrenagem',
  spring: 'mola',
  valve: 'válvula',
  pump: 'bomba',
  motor: 'motor',
  engine: 'motor',
  unit: 'unidade',
  component: 'componente',
  part: 'peça',
  tool: 'ferramenta',
  equipment: 'equipamento',
  step: 'passo',
  procedure: 'procedimento',
  instruction: 'instrução',
  method: 'método',
  process: 'processo',
  operation: 'operação',
  task: 'tarefa',
  action: 'ação',
  activity: 'atividade'
};

export function applyAssemblyLabelFixes(text: string): string {
  return text
    .replace(/\bCAUTION:?/gi, 'CUIDADO:')
    .replace(/\bWARNING:?/gi, 'ADVERTÊNCIA:')
    .replace(/\bNOTE:?/gi, 'NOTA:');
}

export function inferAssemblyStepKind(text: string, tagName: string): 'note' | 'caution' | 'warning' | 'step' {
  const t = text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
  if (t.startsWith('nota') || t.includes('note:')) return 'note';
  if (t.startsWith('caution') || t.includes('cuidado:') || t.includes('atencao:')) return 'caution';
  if (t.startsWith('warning') || t.includes('advertencia:') || t.includes('aviso:')) return 'warning';

  const tag = tagName.toUpperCase();
  if (/^H[3-6]$/.test(tag)) return 'step';
  if (/^\s*\d+(\.|:|\))\s+/.test(text)) return 'step';

  return 'step';
}
