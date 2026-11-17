import '@angular/compiler';
import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { OSListComponent } from './os-list.component';

describe('opção de estoque na OS', () => {
  function setup(pular: boolean) {
    return Object.assign(Object.create(OSListComponent.prototype), {
      osForm: new FormGroup({ naoAtualizarEstoque: new FormControl(pular) }),
      buildSavePayloadFromForm: vi.fn(() => ({ naoAtualizarEstoque: pular })),
      fcuIdParaPreviewDeficit: vi.fn(() => 17),
      executarSalvarOS: vi.fn(), confirmarSalvarComDeficitKit: vi.fn(),
      api: { previewKitFcuDeficit: vi.fn(() => of({ temDeficit: true, itens: [{}] })) }
    }) as any;
  }

  it('salva sem consultar o kit quando o usuário dispensa atualização de estoque', () => {
    const component = setup(true);
    component.saveOS();
    expect(component.api.previewKitFcuDeficit).not.toHaveBeenCalled();
    expect(component.executarSalvarOS).toHaveBeenCalledWith({ naoAtualizarEstoque: true }, null);
  });

  it('aguarda confirmação do déficit quando a atualização está habilitada', () => {
    const component = setup(false);
    component.saveOS();
    expect(component.api.previewKitFcuDeficit).toHaveBeenCalledWith(17);
    expect(component.confirmarSalvarComDeficitKit).toHaveBeenCalled();
    expect(component.executarSalvarOS).not.toHaveBeenCalled();
  });
});
