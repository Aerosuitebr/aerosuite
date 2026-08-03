/**
 * Normalização de secções/códigos do menu lateral (dados vindos da API/BD).
 */

/** Remove acentos e converte para slug estável (ex.: "Publicações Técnicas" → PUBLICACOES_TECNICAS). */
export function slugifyMenuSection(secao: string): string {
  let s = secao
    .replace(/\uFFFD/g, '')
    .replace(/\?+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');

  // "Publicações Técnicas" e corrupções (ex.: PUBLICAAES_TCNICAS).
  if (
    s.startsWith('PUBLICA') &&
    (s.includes('TECNIC') || s.includes('T_CNIC') || s.includes('TCNIC'))
  ) {
    return 'PUBLICACOES_TECNICAS';
  }
  // "Conformidade Técnica" e corrupções (ex.: CONFORMIDADE_TCNICA).
  if (s.startsWith('CONFORMIDADE') && (s.includes('TECNIC') || s.includes('TCNIC'))) {
    return 'CONFORMIDADE_TECNICA';
  }
  if (s.startsWith('ADMINISTRA')) {
    return 'ADMINISTRACAO';
  }
  if (s === 'OPERACIONAL' || s.startsWith('OPERACION')) {
    return 'OPERACIONAL';
  }
  // "Ações Rápidas" e corrupções comuns de encoding (ex.: AAES_RIPIDAS).
  if (
    (s.startsWith('ACOE') && s.includes('RAPID')) ||
    /^A+ES_R[AI]PIDAS$/.test(s) ||
    /^A_.*PIDAS$/.test(s) ||
    (s.includes('PIDAS') && /^A+[A-Z]*ES_/.test(s)) ||
    (s.includes('_ES_R_') && s.includes('PIDAS'))
  ) {
    return 'ACOES_RAPIDAS';
  }
  if (s.startsWith('GEST')) {
    return 'GESTAO';
  }
  if (s.startsWith('COMUNICA')) {
    return 'COMUNICACAO';
  }
  return s;
}

/** Códigos na BD que diferem do slug usado em menu.func.* */
const MENU_FUNC_ALIASES: Record<string, string> = {
  AUDITORIA_OS: 'OS_AUDITORIA',
};

/** Variantes de código de funcionalidade para lookup em menu.func.* */
export function menuFuncCodigoVariants(codigo: string | null | undefined): string[] {
  if (!codigo?.trim()) {
    return [];
  }
  const raw = String(codigo).trim().toUpperCase();
  const underscored = raw.replace(/-/g, '_');
  const out = new Set<string>([raw, underscored]);
  const alias = MENU_FUNC_ALIASES[underscored];
  if (alias) {
    out.add(alias);
  }
  return [...out];
}

export function looksLikeCorruptedMenuText(text: string | null | undefined): boolean {
  if (!text) {
    return false;
  }
  if (/\?{2,}/.test(text) || text.includes('\uFFFD')) {
    return true;
  }
  const upper = text.toUpperCase();
  // Slugs claramente corrompidos por encoding (ex.: AAES_RIPIDAS).
  return /^A+ES_R[AI]PIDAS$/.test(upper) || (upper.includes('PIDAS') && /^A+[A-Z]*ES_/.test(upper));
}
