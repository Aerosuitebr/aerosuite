import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { PlatformOpsLoginComponent } from './platform-ops-login.component';

function setup(returnUrl: string | null) {
  const router = { navigateByUrl: vi.fn() };
  const component = Object.assign(Object.create(PlatformOpsLoginComponent.prototype), {
    router, route: { snapshot: { queryParamMap: { get: () => returnUrl } } }
  }) as any;
  return { component, router };
}

describe('Control-plane menu destination', () => {
  it('returns to onboarding only after successful authentication', () => {
    const { component, router } = setup('/plataforma/boas-vindas');
    component.onSuccess();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/plataforma/boas-vindas');
  });
  it.each(['https://example.com', '//example.com', '/plataforma/acesso', '/plataforma/../login', null])('rejects an unlisted return destination: %s', destination => {
    const { component, router } = setup(destination);
    component.onSuccess();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/plataforma');
  });
  it('keeps the destination after MFA enrollment', () => {
    const { component, router } = setup('/plataforma/backup');
    component.onEnrollmentCompleted();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/plataforma/backup');
  });
});
