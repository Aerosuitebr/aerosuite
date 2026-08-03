import { environment } from '../../environments/environment';

/** Iniciais neutras quando não há foto (substitui avatar masculino genérico). */
export function usuarioAvatarInitials(nome: string | null | undefined): string {
  const parts = (nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Sentinela vazio — UI usa iniciais do nome em vez de foto stock. */
export const DEFAULT_USUARIO_AVATAR = '';

/** URLs temporárias do browser — inválidas após F5. */
export function isEphemeralUsuarioFotoUrl(value: string | null | undefined): boolean {
  const raw = value?.trim();
  return !!raw && (raw.startsWith('blob:') || raw.startsWith('data:'));
}

function apiBase(): string {
  return environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
}

function extractFilename(raw: string): string | null {
  const path = raw.split('?')[0].replace(/\\/g, '/');
  const match = path.match(/(?:public\/usuario-foto|usuarios\/foto|uploads)\/([^/]+)$/i);
  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }
  if (!path.includes('/')) {
    return path;
  }
  return null;
}

function buildPublicFotoUrl(filename: string): string {
  const base = apiBase().replace(/\/$/, '');
  return `${base}/public/usuario-foto/${encodeURIComponent(filename)}`;
}

/**
 * Converte o valor persistido (uploads/..., nome de ficheiro ou URL) na URL servida pela API.
 */
export function resolveUsuarioFotoUrl(fotoPerfil: string | null | undefined): string | null {
  const raw = fotoPerfil?.trim();
  if (!raw) {
    return null;
  }

  if (isEphemeralUsuarioFotoUrl(raw)) {
    return null;
  }

  const filename = extractFilename(raw);
  if (filename) {
    return buildPublicFotoUrl(filename);
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  const base = apiBase().replace(/\/$/, '');

  if (raw.startsWith('/api/')) {
    return raw.split('?')[0];
  }

  if (raw.startsWith('/')) {
    return `${base}${raw}`;
  }

  return buildPublicFotoUrl(raw);
}

export function getUsuarioFotoDisplayUrl(fotoPerfil: string | null | undefined): string {
  return resolveUsuarioFotoUrl(fotoPerfil) ?? DEFAULT_USUARIO_AVATAR;
}

/** Nome do ficheiro para persistir (BD / localStorage). */
export function extractUsuarioFotoFilename(fotoPerfil: string | null | undefined): string | undefined {
  const raw = fotoPerfil?.trim();
  if (!raw || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return undefined;
  }
  const filename = extractFilename(raw);
  return filename ?? undefined;
}

/** @deprecated Preferir {@link extractUsuarioFotoFilename} para persistência. */
export function normalizeUsuarioFotoPerfil(fotoPerfil: string | null | undefined): string | undefined {
  return extractUsuarioFotoFilename(fotoPerfil) ?? resolveUsuarioFotoUrl(fotoPerfil) ?? undefined;
}
