import '@angular/compiler';
import { describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';
import { OperacoesComponent } from './operacoes.component';
function tela(): OperacoesComponent {
 const c = Object.create(OperacoesComponent.prototype) as OperacoesComponent;
 Object.assign(c, {modulo:{id:'impedimentos'},osId:2371,busca:'',situacao:'ATIVOS',indicadorAjuda:null,contexto:{os:[]},hoje:()=> '2026-10-25',dados:[
 {id:1,titulo:'Kit pendente',modulo:'impedimentos',status:'ABERTO',prazo:'2026-10-24'},
 {id:2,titulo:'Outro kit',modulo:'impedimentos',status:'EM_ANDAMENTO',prazo:'2026-10-26'},
 {id:3,titulo:'Kit tratado',modulo:'impedimentos',status:'RESOLVIDO',prazo:'2026-10-23'},
 {id:4,titulo:'Kit cancelado',modulo:'impedimentos',status:'CANCELADO',prazo:'2026-10-22'}]});return c;
}
describe('Central operacional: indicadores e filtros',()=>{
 it('explica o número oculto pelo filtro inicial',()=>{const c=tela();expect(c.visiveis.map(r=>r.id)).toEqual([1,2]);expect(c.ocultos).toBe(2);expect(c.situacaoLabel).toBe('Em acompanhamento');});
 it('exibe todos os carregados sem remover a OS selecionada',()=>{const c=tela();c.busca='Kit pendente';c.mostrarCarregados();expect(c.visiveis).toHaveLength(4);expect(c.ocultos).toBe(0);expect(c.osId).toBe(2371);});
 it('filtra atrasos sem incluir resolvidos e cancelados com prazo passado',()=>{const c=tela();c.busca='não encontrado';c.filtrarIndicador('atencao');expect(c.visiveis.map(r=>r.id)).toEqual([1]);expect(c.busca).toBe('');});
 it('o indicador concluídos exclui cancelamentos',()=>{const c=tela();c.filtrarIndicador('concluidos');expect(c.visiveis.map(r=>r.id)).toEqual([3]);expect(c.concluidos).toBe(1);});
 it('um indicador zero abre orientação sem alterar o recorte',()=>{const c=tela();c.dados=c.dados.filter(r=>r.status==='EM_ANDAMENTO');c.busca='Outro';c.filtrarIndicador('concluidos');expect(c.indicadorAjuda).toBe('concluidos');expect(c.situacao).toBe('ATIVOS');expect(c.busca).toBe('Outro');c.filtrarIndicador('atencao');expect(c.indicadorAjuda).toBe('atencao');});
 it('busca e situação são combinadas na contagem dos ocultos',()=>{const c=tela();c.busca='Outro';expect(c.visiveis.map(r=>r.id)).toEqual([2]);expect(c.ocultos).toBe(3);});
});
describe('Busca dinâmica de OS',()=>{
 it('normaliza o prefixo OS sem alterar buscas por cliente',()=>{
  const c=tela();const spy=vi.spyOn(c,'pesquisarContexto').mockImplementation(()=>{});
  c.buscarOsDropdown('OS 2104');expect(spy).toHaveBeenLastCalledWith('2104');
  c.buscarOsDropdown('OS2104');expect(spy).toHaveBeenLastCalledWith('2104');
  c.buscarOsDropdown('Cliente Demo');expect(spy).toHaveBeenLastCalledWith('Cliente Demo');
 });
 it('ignora respostas antigas quando a pessoa já mudou a pesquisa',()=>{
  vi.useFakeTimers();
  try {
   const c=tela();const antiga=new Subject<any>(),atual=new Subject<any>();
   Object.assign(c,{pesquisaSeq:0,searchTimer:null,destroy$:new Subject<void>(),form:{osId:null},contexto:{os:[],itens:[]},api:{contexto:vi.fn().mockReturnValueOnce(antiga).mockReturnValueOnce(atual)}});
   const resultado={os:[{id:2371,codigo:2104,cliente:'Resultado atual',pn:'PN',sn:'SN'}],itens:[],tecnicos:[],ferramentas:[]};
   c.pesquisarContexto('antiga');vi.advanceTimersByTime(350);
   c.pesquisarContexto('atual');vi.advanceTimersByTime(350);
   atual.next(resultado);antiga.next({...resultado,os:[{...resultado.os[0],cliente:'Resultado antigo'}]});
   expect(c.osOpcoes[0].cliente).toBe('Resultado atual');expect(c.contextoBuscando).toBe(false);
  } finally {vi.useRealTimers();}
 });
});
describe('Quadro operacional: colunas e movimentações',()=>{
 function quadro(){const c=tela();Object.assign(c.modulo,{estados:['ABERTO','EM_ANDAMENTO','RESOLVIDO','CANCELADO']});Object.assign(c,{ocultarVazias:false,carregando:false,salvando:false,api:{salvar:vi.fn()}});return c;}
 it('oculta colunas vazias de acordo com os filtros atuais',()=>{const c=quadro();c.ocultarVazias=true;expect(c.colunasQuadro).toEqual(['ABERTO','EM_ANDAMENTO']);c.situacao='';expect(c.colunasQuadro).toHaveLength(4);});
 it('conta as colunas sem resultados sem remover estados do catálogo',()=>{const c=quadro();expect(c.colunasVazias).toBe(2);expect(c.colunasQuadro).toHaveLength(4);});
 it('arrastar prepara uma cópia e exige confirmação antes de persistir',()=>{const c=quadro();const r=c.dados[0];r.version=7;c.moverCartao({item:{data:r},container:{data:'EM_ANDAMENTO'}} as any);expect(c.form.status).toBe('EM_ANDAMENTO');expect(c.form.version).toBe(7);expect(c.movimentoOrigem).toBe('ABERTO');expect(c.modal).toBe(true);expect(r.status).toBe('ABERTO');expect((c as any).api.salvar).not.toHaveBeenCalled();c.fechar();expect(r.status).toBe('ABERTO');});
 it('não reabre registros encerrados pelo quadro',()=>{const c=quadro();expect(c.destinoPermitido(c.dados[2],'ABERTO')).toBe(false);expect(c.destinoPermitido(c.dados[3],'ABERTO')).toBe(false);});
 it('mantém o consumo de material na ação específica do estoque',()=>{const c=quadro();Object.assign(c.modulo,{id:'materiais',estados:['PENDENTE','RESERVADO','SEPARADO','CONSUMIDO','CANCELADO']});const r={...c.dados[0],modulo:'materiais',status:'RESERVADO'};expect(c.destinoPermitido(r,'CONSUMIDO')).toBe(false);expect(c.destinoPermitido(r,'SEPARADO')).toBe(true);});
 it('ignora uma queda na mesma coluna ou em destino inválido',()=>{const c=quadro();const edit=vi.spyOn(c,'editar');c.moverCartao({item:{data:c.dados[0]},container:{data:'ABERTO'}} as any);c.moverCartao({item:{data:c.dados[0]},container:{data:'CONSUMIDO'}} as any);expect(edit).not.toHaveBeenCalled();});
});