import '@angular/compiler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';
import { HangarJobCardComponent } from './hangar-job-card.component';
import { splitExecutionOrigin, executionSnapshot } from './hangar-execution.util';
import type { JobCard } from '../core/job-card.service';

function setup(online=true) {
  const response=new Subject<JobCard>();const loaded=new Subject<JobCard>();const queue:any[]=[];
  const component=Object.assign(Object.create(HangarJobCardComponent.prototype),{
    osId:1,card:{osId:1,assinaturas:[]},execInicio:'',execFim:'',execObsIni:'',execObsFim:'',
    execOrigin:splitExecutionOrigin('Origem: proposta comercial PROP-1'),executionBaseline:executionSnapshot('','','',''),executionOsId:1,executionSaveState:'idle',salvandoExec:false,
    pendingSignatures:new Map(),pendingHours:[],sigCtx:new Map(),
    jobCard:{atualizarExecucao:vi.fn(()=>response),obter:vi.fn(()=>loaded)},
    offlineCache:{isOnline:()=>online,saveCard:vi.fn(),pendingCount:()=>queue.length,loadQueue:()=>queue,enqueue:vi.fn((op:any)=>queue.push(op))},
    i18n:{translate:(key:string)=>key},toast:{add:vi.fn()},toastError:vi.fn()
  }) as any;
  return {component,response,loaded};
}
beforeEach(()=>vi.useFakeTimers());
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();});
describe('Execution save flow',()=>{
  it('saves both blocks and preserves the read-only source prefix',()=>{
    const {component,response}=setup();component.execInicio='2026-10-27T08:00';component.execObsIni='Inspeção inicial';component.execObsFim='Conclusão pendente';
    component.salvarExecucao();component.salvarExecucao();expect(component.jobCard.atualizarExecucao).toHaveBeenCalledTimes(1);
    expect(component.jobCard.atualizarExecucao).toHaveBeenCalledWith(1,expect.objectContaining({inicioServico:'2026-10-27T08:00',fimServico:'',obsIniServ:'Origem: proposta comercial PROP-1\n\nInspeção inicial',obsFimServ:'Conclusão pendente'}));
    expect(component.executionDirty).toBe(true);response.next({osId:1} as JobCard);
    expect(component.executionDirty).toBe(false);expect(component.executionSaveState).toBe('saved');
  });
  it('preserves a draft after failure',()=>{
    const {component,response}=setup();component.execObsIni='Não perder';component.salvarExecucao();response.error(new Error('failed'));
    expect(component.executionDirty).toBe(true);expect(component.execObsIni).toBe('Não perder');expect(component.salvandoExec).toBe(false);
  });
  it('does not overwrite unsaved fields when another tab refreshes the card',()=>{
    const {component}=setup();component.execObsIni='Rascunho';component.applyCard({osId:1,obsIniServ:'Servidor',assinaturas:[]} as JobCard);
    expect(component.execObsIni).toBe('Rascunho');expect(component.executionDirty).toBe(true);
  });
  it('marks offline saves as queued and retains source metadata',()=>{
    const {component}=setup(false);component.execInicio='Início registrado na oficina';component.salvarExecucao();
    expect(component.executionSaveState).toBe('queued');expect(component.executionDirty).toBe(false);
    expect(component.offlineCache.enqueue).toHaveBeenCalledWith(expect.objectContaining({body:expect.objectContaining({obsIniServ:'Origem: proposta comercial PROP-1'})}));
  });
  it('ignores late save and load responses for a different OS',()=>{
    const {component,response,loaded}=setup();component.execInicio='Texto';component.salvarExecucao();component.carregarCard();component.osId=2;
    response.next({osId:1} as JobCard);loaded.next({osId:1} as JobCard);
    expect(component.offlineCache.saveCard).not.toHaveBeenCalled();expect(component.executionSaveState).toBe('idle');
  });
});
