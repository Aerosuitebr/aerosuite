import { describe, expect, it } from 'vitest';
import type { User } from './auth.service';
import { passesPermissaoRota } from './permissao.util';

function user(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'operacional@example.test',
    nome: 'Operacional',
    role: 'USER',
    perfil: { id: 2, nome: 'Operacional', descricao: '', codigo: 'OPERACIONAL' },
    ...overrides,
  };
}

describe('passesPermissaoRota', () => {
  it('nega rota protegida enquanto o snapshot de permissões está ausente', () => {
    expect(passesPermissaoRota(user(), { funcionalidadesAny: ['PRODUTOS'] })).toBe(false);
  });

  it('permite somente quando o snapshot satisfaz a regra', () => {
    expect(
      passesPermissaoRota(user({ funcionalidadeCodigos: ['PRODUTOS'] }), {
        funcionalidadesAny: ['PRODUTOS'],
      })
    ).toBe(true);
    expect(
      passesPermissaoRota(user({ funcionalidadeCodigos: ['ESTOQUE_CONSULTAR'] }), {
        funcionalidadesPrefix: ['ESTOQUE'],
      })
    ).toBe(true);
  });

  it('mantém o bypass explícito de perfil administrador', () => {
    expect(
      passesPermissaoRota(
        user({ perfil: { id: 1, nome: 'Administrador', descricao: '', codigo: 'ADMIN' } }),
        { funcionalidadesAll: ['GERENCIAR_PERMISSOES'] }
      )
    ).toBe(true);
  });
});
