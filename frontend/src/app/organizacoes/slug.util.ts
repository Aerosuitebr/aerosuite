/** Gera slug de organização a partir do nome (alinhado à validação backend). */
export function slugFromOrganizationName(name: string): string {
  let s = (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length < 2) {
    s = 'org';
  }
  if (s.length > 62) {
    s = s.substring(0, 62).replace(/-+$/, '');
  }
  return s;
}

export function suggestSupportEmail(codigo: string, domain = 'local'): string {
  const c = (codigo || 'org').trim().toLowerCase();
  return `contato@${c}.${domain}`;
}
