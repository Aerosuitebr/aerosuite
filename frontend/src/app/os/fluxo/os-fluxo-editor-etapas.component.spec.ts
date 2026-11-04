import '@angular/compiler';
import { describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { OsFluxoEditorEtapasComponent } from './os-fluxo-editor-etapas.component';

function editor(): any {
  const c = Object.create(OsFluxoEditorEtapasComponent.prototype);
  Object.assign(c, {
    dados: {versaoFluxo:'v1',setores:['Oficina'],etapasDisponiveis:[{id:1,nome:'Limpeza',setor:'Oficina',cor:'#123456'},{id:2,nome:'Inspeção',setor:'Oficina',cor:'#654321'}]},
    removidas:[],salvando:false,revisando:false,erro:'',proximaChave:-1,
    api:{salvarFluxo:vi.fn(()=>of({versaoFluxo:'v2'}))},salvo:{emit:vi.fn()},fechar:{emit:vi.fn()}
  });
  c.ngOnInit(); return c;
}
describe('Editor do fluxo',()=>{
  it('isola o rascunho e reordena pelo arraste e pelas setas',()=>{
    const c=editor(); c.reordenar({previousIndex:0,currentIndex:1});
    expect(c.rascunho.map((e:any)=>e.id)).toEqual([2,1]);
    expect(c.dados.etapasDisponiveis.map((e:any)=>e.id)).toEqual([1,2]);
    expect(c.alterado).toBe(true);c.mover(0,1);expect(c.alterado).toBe(false);
  });
  it('insere exatamente entre etapas e valida antes de salvar',()=>{
    const c=editor();c.inserir(1,'Oficina');expect(c.rascunho.map((e:any)=>e.id)).toEqual([1,null,2]);
    expect(c.valido).toBe(false);c.rascunho[1].nome='Pintura';expect(c.valido).toBe(true);
    c.salvar();expect(c.api.salvarFluxo).toHaveBeenCalledWith('v1',[
      {id:1,nome:'Limpeza',setor:'Oficina',cor:'#123456',metaMinutos:null},
      {id:null,nome:'Pintura',setor:'Oficina',cor:'#2563eb',metaMinutos:null},
      {id:2,nome:'Inspeção',setor:'Oficina',cor:'#654321',metaMinutos:null}
    ]);
  });
  it('desfaz exclusão e mantém ao menos uma etapa',()=>{
    const c=editor();c.remover(0);expect(c.removidas.map((e:any)=>e.id)).toEqual([1]);
    c.remover(0);expect(c.rascunho).toHaveLength(1);c.restaurar(1);expect(c.alterado).toBe(false);
  });
  it('rejeita nomes repetidos e metas inválidas',()=>{
    const c=editor();c.rascunho[1].nome=' LIMPEZA ';expect(c.valido).toBe(false);
    c.rascunho[1].nome='Inspeção';c.rascunho[0].metaMinutos=0;expect(c.valido).toBe(false);
  });
  it('preserva rascunho e revisão quando há conflito de versão',()=>{
    const c=editor();c.mover(0,1);c.revisando=true;
    c.api.salvarFluxo.mockReturnValue(throwError(()=>({error:{mensagem:'O fluxo foi alterado por outro usuário.'}})));
    c.salvar();expect(c.erro).toContain('outro usuário');expect(c.rascunho[0].id).toBe(2);
    expect(c.fechar.emit).not.toHaveBeenCalled();expect(c.salvando).toBe(false);
  });
});
