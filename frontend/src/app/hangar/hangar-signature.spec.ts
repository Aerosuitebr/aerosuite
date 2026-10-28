import '@angular/compiler';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';
import { HangarJobCardComponent } from './hangar-job-card.component';
import type { JobCardAssinatura } from '../core/job-card.service';

const saved = { papel: 'EXECUCAO', presente: true, usuarioNome: 'Mecânico', assinadoEm: '2026-10-27T16:48:00', assinaturaSha256: 'hash', assinaturaPngBase64: 'PNG' };
function setup(signatures: any[] = []) {
  const response = new Subject<JobCardAssinatura>();
  const queue: any[] = [];
  const canvas = { toDataURL: () => 'data:image/png;base64,DRAWING', width: 480, height: 120 };
  vi.stubGlobal('document', { querySelector: () => canvas });
  const component = Object.assign(Object.create(HangarJobCardComponent.prototype), {
    osId: 1, card: { assinaturas: signatures }, editingSignatures: new Set(), dirtySignatures: new Set(), pendingSignatures: new Map(), signatureBaseHashes: new Map(), sigCtx: new Map(),
    salvandoAssinatura: '', confirmation: { confirm: vi.fn() }, jobCard: { salvarAssinatura: vi.fn(() => response) },
    offlineCache: { isOnline: () => true, saveCard: vi.fn(), pendingCount: () => queue.length, loadQueue: () => queue, enqueue: vi.fn((op:any) => queue.push(op)) },
    i18n: { translate: (key:string) => key }, toast: { add: vi.fn() }, carregarCard: vi.fn(), toastError: vi.fn(), clearSig: vi.fn()
  }) as any;
  return { component, response, canvas };
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('Hangar signatures', () => {
  it('locks saved signatures and exposes the server image and metadata', () => {
    const { component } = setup([saved]);
    expect(component.signatureLocked('EXECUCAO')).toBe(true);
    expect(component.signatureImage('EXECUCAO')).toBe('data:image/png;base64,PNG');
    component.salvarAssinatura('EXECUCAO'); expect(component.jobCard.salvarAssinatura).not.toHaveBeenCalled();
  });
  it('unlocks only after confirmation and keeps the old signature until saving', () => {
    vi.useFakeTimers(); const { component } = setup([saved]); component.unlockSignature('EXECUCAO');
    expect(component.signatureLocked('EXECUCAO')).toBe(true);
    component.confirmation.confirm.mock.calls[0][0].accept();
    expect(component.signatureLocked('EXECUCAO')).toBe(false);
    expect(component.signatureRow('EXECUCAO')).toEqual(saved);
    expect(component.signatureBaseHashes.get('EXECUCAO')).toBe('hash');
  });
  it('confirms before erasing a draft and defaults to cancellation', () => {
    const { component } = setup(); component.dirtySignatures.add('EXECUCAO'); component.requestClearSig('EXECUCAO');
    const confirmation = component.confirmation.confirm.mock.calls[0][0];
    expect(confirmation.defaultFocus).toBe('reject'); expect(component.clearSig).not.toHaveBeenCalled();
    confirmation.accept(); expect(component.clearSig).toHaveBeenCalledWith('EXECUCAO');
  });
  it('rejects blank saves and immediately locks after confirmed server success', () => {
    const { component, response } = setup(); component.salvarAssinatura('EXECUCAO'); expect(component.jobCard.salvarAssinatura).not.toHaveBeenCalled();
    component.dirtySignatures.add('EXECUCAO'); component.salvarAssinatura('EXECUCAO'); response.next(saved);
    expect(component.signatureLocked('EXECUCAO')).toBe(true); expect(component.signatureRow('EXECUCAO')?.usuarioNome).toBe('Mecânico');
    expect(component.dirtySignatures.has('EXECUCAO')).toBe(false);
  });
  it('marks offline saves as pending rather than signed', () => {
    const { component } = setup(); component.offlineCache.isOnline = () => false;
    component.dirtySignatures.add('EXECUCAO'); component.salvarAssinatura('EXECUCAO');
    expect(component.pendingSignatures.has('EXECUCAO')).toBe(true); expect(component.assinaturaOk('EXECUCAO')).toBe(false);
    expect(component.signatureLocked('EXECUCAO')).toBe(true); expect(component.jobCard.salvarAssinatura).not.toHaveBeenCalled();
  });
  it('keeps the draft when the server rejects the save', () => {
    const { component, response } = setup(); component.dirtySignatures.add('INSPECAO'); component.salvarAssinatura('INSPECAO'); response.error(new Error('denied'));
    expect(component.dirtySignatures.has('INSPECAO')).toBe(true); expect(component.signatureLocked('INSPECAO')).toBe(false);
  });
  it('does not attach a late response to another OS after navigation', () => {
    const { component, response } = setup(); component.dirtySignatures.add('EXECUCAO'); component.salvarAssinatura('EXECUCAO');
    component.osId = 2; response.next(saved);
    expect(component.card.assinaturas).toEqual([]);
    expect(component.offlineCache.saveCard).not.toHaveBeenCalled();
  });
  it('maps pointer coordinates to the intrinsic canvas dimensions', () => {
    const { component } = setup(); const canvas = { width:480, height:120, getBoundingClientRect:()=>({left:10,top:10,width:240,height:60}), setPointerCapture:vi.fn() };
    const context = { moveTo:vi.fn(), beginPath:vi.fn(), lineTo:vi.fn(), stroke:vi.fn() }; component.sigCtx.set('EXECUCAO',context);
    component.startDraw({ target:canvas, pointerId:1, clientX:50, clientY:30 },'EXECUCAO');
    expect(context.moveTo).toHaveBeenCalledWith(80,40);
    component.moveDraw({ target:canvas, clientX:70, clientY:40 },'EXECUCAO');
    expect(context.lineTo).toHaveBeenCalledWith(120,60); expect(component.dirtySignatures.has('EXECUCAO')).toBe(true);
  });
});
