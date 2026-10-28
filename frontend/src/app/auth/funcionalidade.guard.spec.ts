import '@angular/compiler';
import { describe, expect, it, vi } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { FuncionalidadeGuard } from './funcionalidade.guard';

const route = { data: { perm: { funcionalidadesAny: ['CENTRAL_OPERACIONAL'] } } } as unknown as ActivatedRouteSnapshot;
const state = { url: '/operacoes/impedimentos' } as RouterStateSnapshot;
function setup(codes: string[] = []) {
  const user = { id: 7, perfil: { codigo: 'OPERACIONAL' }, funcionalidadeCodigos: codes };
  const auth = { getCurrentUser: vi.fn(() => user), refreshCurrentUserFromServer: vi.fn(() => of(user)) };
  const router = { navigate: vi.fn() };
  const i18n = { addToast: vi.fn() };
  const guard = new FuncionalidadeGuard(auth as any, router as any, {} as any, i18n as any);
  return { user, auth, router, i18n, guard };
}
async function result(value: ReturnType<FuncionalidadeGuard['canActivate']>) {
  return typeof value === 'boolean' ? value : firstValueFrom(value);
}
describe('FuncionalidadeGuard: menu atualizado em sessão antiga', () => {
  it('atualiza pelo servidor e abre a central quando a nova permissão já está autorizada', async () => {
    const c = setup(['ORDEM_SERVICO']);
    c.auth.refreshCurrentUserFromServer.mockReturnValue(of({ ...c.user, funcionalidadeCodigos: ['CENTRAL_OPERACIONAL'] }));
    expect(await result(c.guard.canActivate(route, state))).toBe(true);
    expect(c.auth.refreshCurrentUserFromServer).toHaveBeenCalledOnce();
    expect(c.router.navigate).not.toHaveBeenCalled();
  });
  it('mantém a negativa quando o servidor confirma que a permissão está ausente', async () => {
    const c = setup();
    expect(await result(c.guard.canActivate(route, state))).toBe(false);
    expect(c.i18n.addToast).toHaveBeenCalledOnce();
    expect(c.router.navigate).toHaveBeenCalledWith([''], { replaceUrl: true });
  });
  it('não libera acesso quando a atualização falha', async () => {
    const c = setup();
    c.auth.refreshCurrentUserFromServer.mockReturnValue(throwError(() => new Error('offline')));
    expect(await result(c.guard.canActivate(route, state))).toBe(false);
    expect(c.router.navigate).toHaveBeenCalledOnce();
  });
  it('não repete a consulta para uma sessão que já satisfaz a regra', () => {
    const c = setup(['CENTRAL_OPERACIONAL']);
    expect(c.guard.canActivate(route, state)).toBe(true);
    expect(c.auth.refreshCurrentUserFromServer).not.toHaveBeenCalled();
  });
  it('envia a sessão ausente ao login, sem consultar permissões', () => {
    const c = setup();
    c.auth.getCurrentUser.mockReturnValue(null as any);
    expect(c.guard.canActivate(route, state)).toBe(false);
    expect(c.router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: state.url } });
    expect(c.auth.refreshCurrentUserFromServer).not.toHaveBeenCalled();
  });
});