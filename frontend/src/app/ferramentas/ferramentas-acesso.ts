import { User } from '../auth/auth.service';

export function podeAcessarFerramentaria(user: User | null, codes: ReadonlySet<string>): boolean {
  return !!user && ['FERRAMENTAS_ESTACAO', 'FERRAMENTAS_GESTAO', 'FERRAMENTAS_CALIBRACAO'].some(c => codes.has(c));
}
