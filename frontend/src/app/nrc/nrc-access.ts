import { User } from '../auth/auth.service';

const QUALITY = new Set([
  'QUALIDADE', 'QUALITY', 'ADMIN', 'ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'SGQ', 'P145_RT', 'P145_INSPETOR'
]);

export function hasNrc(user: User | null, code: string): boolean {
  const codes = user?.funcionalidadeCodigos || [];
  return codes.some((item) => item?.toUpperCase() === code);
}

export function canReadNrc(user: User | null): boolean {
  return ['NRC_LIST', 'NRC_ABRIR', 'NRC_ANALISAR', 'NRC_ENCERRAR', 'NRC_DASHBOARD', 'NRC_RELATORIO']
    .some((code) => hasNrc(user, code));
}

export function isNrcQuality(user: User | null): boolean {
  const code = (user?.perfil?.codigo || '').toUpperCase();
  const name = (user?.perfil?.nome || '').toUpperCase();
  return QUALITY.has(code)
    || name.includes('QUALID')
    || name.includes('SGQ')
    || name.includes('INSPET')
    || name.includes('ADMINISTR')
    || name.includes('DIRETOR')
    || hasNrc(user, 'NRC_ENCERRAR');
}

export function nrcErrorText(error: unknown, translate: (key: string) => string): string {
  const body = (error as { error?: { code?: string; message?: string } })?.error;
  const key = body?.code ? `nrc.error.${body.code}` : '';
  if (key) {
    const translated = translate(key);
    if (translated !== key) {
      return translated;
    }
  }
  return body?.message || translate('nrc.error.generic');
}
