import { User } from './auth.service';

/** Alinhado às regras do backend {@code RequiresFuncionalidades}. */
export interface PermissaoRota {
  funcionalidadesAny?: string[];
  funcionalidadesAll?: string[];
  funcionalidadesPrefix?: string[];
}

const SUPER_PERFIL_CODIGOS = new Set(
  ['ADMIN', 'ADMINISTRADOR', 'DIRETOR'].map((s) => s.toUpperCase())
);

/** Canonização para comparação (alinha `chat` / `CHAT`, BD vs anotações). */
export function canonFuncionalidadeCodigo(c: string | null | undefined): string {
  return c != null ? String(c).trim().toUpperCase() : '';
}

export function isSuperPerfil(user: { perfil?: { codigo?: string } }): boolean {
  const c = user.perfil?.codigo?.trim();
  if (!c) {
    return false;
  }
  return SUPER_PERFIL_CODIGOS.has(c.toUpperCase());
}

export function matchesPrefix(userCodes: Set<string>, prefix: string): boolean {
  const p = canonFuncionalidadeCodigo(prefix);
  if (!p) {
    return false;
  }
  for (const code of userCodes) {
    const cu = canonFuncionalidadeCodigo(code);
    if (!cu) {
      continue;
    }
    if (cu === p || cu.startsWith(p + '_')) {
      return true;
    }
  }
  return false;
}

/**
 * Verifica se o utilizador satisfaz os requisitos de permissão (espelho do {@link FuncionalidadeGuard}).
 * Sessões sem {@link User.funcionalidadeCodigos} são tratadas como permissivas na UI até hidratação/login.
 */
export function passesPermissaoRota(
  user: User | null,
  perm: PermissaoRota | undefined
): boolean {
  if (
    !perm ||
    (!perm.funcionalidadesAny?.length &&
      !perm.funcionalidadesAll?.length &&
      !perm.funcionalidadesPrefix?.length)
  ) {
    return true;
  }
  if (!user) {
    return false;
  }
  if (isSuperPerfil(user)) {
    return true;
  }
  const codigos = user.funcionalidadeCodigos;
  if (!codigos) {
    return false;
  }
  const set = new Set(codigos.map((c) => canonFuncionalidadeCodigo(c)).filter(Boolean));

  if (perm.funcionalidadesAll?.length) {
    for (const req of perm.funcionalidadesAll) {
      const rq = canonFuncionalidadeCodigo(req);
      if (rq && !set.has(rq)) {
        return false;
      }
    }
  }
  if (perm.funcionalidadesAny?.length) {
    if (!perm.funcionalidadesAny.some((req) => req && set.has(canonFuncionalidadeCodigo(req)))) {
      return false;
    }
  }
  if (perm.funcionalidadesPrefix?.length) {
    if (!perm.funcionalidadesPrefix.some((prefix) => matchesPrefix(set, prefix))) {
      return false;
    }
  }
  return true;
}
