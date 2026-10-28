/** Separação visual de metadado legado, preservando o conteúdo no salvamento. */
export interface ExecutionOrigin { line: string; separator: string; observations: string; }
const ORIGIN_LINE = /^(?:Origem:\s*proposta comercial\b|Source:\s*commercial proposal\b|Origen:\s*propuesta comercial\b|Origine\s*:\s*proposition commerciale\b)/i;
export function splitExecutionOrigin(value: string | null | undefined): ExecutionOrigin {
  const raw = value || '';
  const first = raw.match(/^([^\r\n]*)(\r?\n(?:\r?\n)*|$)([\s\S]*)$/);
  if (!first || !ORIGIN_LINE.test(first[1])) return { line: '', separator: '', observations: raw };
  return { line: first[1], separator: first[2], observations: first[3] };
}
export function combineExecutionOrigin(origin: ExecutionOrigin, observations: string): string {
  if (!origin.line) return observations;
  if (!observations) return origin.line + (origin.observations === '' ? origin.separator : '');
  return origin.line + (origin.separator || '\n\n') + observations;
}
export function executionSnapshot(start: string, end: string, startNotes: string, endNotes: string): string {
  return JSON.stringify([start, end, startNotes, endNotes]);
}
