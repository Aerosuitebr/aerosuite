// ========================================================
// 🔧 Tipos e Interfaces para Montagem FCU (Fuel Control Unit)
// ========================================================

/**
 * Define os tipos possíveis de etapa dentro de uma seção.
 * Cada tipo reflete um bloco diferente do manual técnico.
 */
export type StepKind = 'step' | 'note' | 'caution' | 'warning' | 'table' | 'figure';

/**
 * Representa uma etapa (step) dentro de uma seção.
 */
export interface AssemblyStep {
  /** Tipo de etapa (passo, nota, figura etc.) */
  kind: StepKind;

  /** Código interno de referência, opcional */
  code?: string;

  /** Título curto da etapa */
  title?: string;

  /** Texto descritivo ou corpo principal */
  text?: string;

  /** Referências associadas (páginas, figuras etc.) */
  refs?: string[];

  /** Imagem base64 (caso tipo seja "figure") */
  imageData?: string;

  /** Tipo MIME da imagem */
  imageType?: string;
}

/**
 * Representa uma seção do manual de montagem.
 */
export interface AssemblySection {
  /** Identificador da seção */
  id: string;

  /** Título da seção */
  title: string;

  /** Lista de etapas (steps) que compõem a seção */
  steps: AssemblyStep[];
}

/**
 * Representa o documento completo de montagem (Assembly Manual)
 */
export interface FcuAssemblyDoc {
  company?: string;
  certificate?: string;
  title: string;
  pn?: string;
  sn?: string;
  model?: string;
  date?: string;
  os?: string;
  client?: string;
  manual?: string;
  revision?: string;
  revisionDate?: string;
  ata?: string;
  pages?: number | null;
  observations?: string;
  sections: AssemblySection[];
}
