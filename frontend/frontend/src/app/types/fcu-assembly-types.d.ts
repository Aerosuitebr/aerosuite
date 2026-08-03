export type StepKind = 'step' | 'note' | 'caution' | 'warning' | 'table' | 'figure';

export interface AssemblyStep {
  kind: StepKind;
  code?: string;
  title?: string;
  text: string;
  refs?: string[];
  imageData?: string;
  imageType?: string;
}

export interface AssemblySection {
  id: string;
  title: string;
  steps: AssemblyStep[];
}

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
