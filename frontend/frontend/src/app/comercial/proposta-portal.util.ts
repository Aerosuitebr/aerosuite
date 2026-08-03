/** Status em que a ação rápida de publicar/conceder acesso no portal está disponível. */
export function propostaPodeAcaoPortal(status?: string | null): boolean {
  const s = (status || '').toUpperCase();
  if (s === 'CANCELADA') return false;
  return s === 'RASCUNHO' || s === 'ENVIADA';
}

export function propostaPodeGerenciarPortalTab(status?: string | null): boolean {
  return (status || '').toUpperCase() !== 'CANCELADA';
}

export function propostaVisivelNoPortal(status?: string | null): boolean {
  const s = (status || '').toUpperCase();
  return s === 'ENVIADA' || s === 'APROVADA' || s === 'REJEITADA' || s === 'CANCELADA';
}

export function propostaTemEmailCliente(email?: string | null): boolean {
  const e = (email || '').trim();
  return e.length > 0 && e.includes('@');
}
