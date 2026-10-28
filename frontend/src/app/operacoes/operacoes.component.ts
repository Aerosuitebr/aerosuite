import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { finalize, Subject, takeUntil, switchMap, forkJoin, of, catchError } from 'rxjs';
import { OperacoesService, Operacao, Contexto, Resumo } from './operacoes.service';
interface Modulo {id:string;nome:string;icone:string;titulo:string;descricao:string;acao:string;estados:string[];}
@Component({standalone:true,selector:'app-operacoes',imports:[CommonModule,FormsModule,RouterLink,DialogModule,DropdownModule,TooltipModule,DragDropModule,PageHeroComponent],templateUrl:'./operacoes.component.html',styleUrls:['./operacoes.component.scss'],animations:[trigger('registroVisivel',[
 transition(':enter',[style({opacity:0,transform:'translateY(6px)'}),animate('180ms ease-out',style({opacity:1,transform:'translateY(0)'}))]),
 transition(':leave',[animate('150ms ease-in',style({opacity:0,transform:'translateY(-4px)'}))])
])]})
export class OperacoesComponent implements OnInit,OnDestroy {
 private api=inject(OperacoesService); private route=inject(ActivatedRoute);private router=inject(Router);private destroy$=new Subject<void>();private reload$=new Subject<void>();
 modulos:Modulo[]=[
 {id:'impedimentos',nome:'Impedimentos',icone:'pi pi-bolt',titulo:'Destrave o próximo passo.',descricao:'Transforme cada parada em uma ação, com responsável e prazo.',acao:'Novo impedimento',estados:['ABERTO','EM_ANDAMENTO','RESOLVIDO','CANCELADO']},
 {id:'materiais',nome:'Materiais',icone:'pi pi-box',titulo:'Material certo. OS pronta.',descricao:'Registre demandas, reserve saldo por lote e acompanhe a separação.',acao:'Demanda ou reserva',estados:['PENDENTE','RESERVADO','SEPARADO','CONSUMIDO','CANCELADO']},
 {id:'compras',nome:'Compras',icone:'pi pi-shopping-cart',titulo:'Da falta à disponibilidade.',descricao:'Conecte a necessidade da OS ao fornecedor e à previsão de entrega.',acao:'Solicitar compra',estados:['SOLICITADO','COTACAO','PEDIDO','RECEBIDO','CANCELADO']},
 {id:'prontidao',nome:'Prontidão',icone:'pi pi-check-circle',titulo:'Confira antes de avançar.',descricao:'Reúna evidências e pendências para execução e entrega da OS.',acao:'Adicionar conferência',estados:['PENDENTE','CONFERIDO','CANCELADO']},
 {id:'custos',nome:'Resultados',icone:'pi pi-chart-line',titulo:'Enxergue o custo da execução.',descricao:'Compare orçamento de custo, lançamentos e materiais consumidos em reais.',acao:'Lançar custo',estados:['PREVISTO','REALIZADO','CANCELADO']},
 {id:'planejamento',nome:'Planejamento',icone:'pi pi-calendar',titulo:'Planeje com capacidade.',descricao:'Distribua horas por recurso e antecipe conflitos de carga.',acao:'Planejar trabalho',estados:['PLANEJADO','CONFIRMADO','CONCLUIDO','CANCELADO']},
 {id:'ferramentas',nome:'Ferramentas',icone:'pi pi-wrench',titulo:'Cada instrumento, em seu lugar.',descricao:'Rastreie retirada, responsável, prazo de devolução e calibração.',acao:'Registrar retirada',estados:['RETIRADO','DEVOLVIDO','CANCELADO']},
 {id:'retornos',nome:'Reincidências',icone:'pi pi-history',titulo:'Aprenda com cada retorno.',descricao:'Relacione garantia e retrabalho ao histórico do mesmo PN e SN.',acao:'Registrar retorno',estados:['ABERTO','EM_ANALISE','CONCLUIDO','CANCELADO']}
 ];
 contextoBuscando=false;osOpcoes:(Contexto['os'][number]&{label:string;busca:string})[]=[];
 private readonly preferenciaMovimento=typeof window!=='undefined' && typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
 movimentoReduzido=this.preferenciaMovimento?.matches ?? false;
 private atualizarMovimento=(e:MediaQueryListEvent)=>{this.movimentoReduzido=e.matches;};
 ocultarVazias=false;movimentoOrigem:string|null=null;
 podeEntrar=(drag:CdkDrag<Operacao>,drop:CdkDropList<string>)=>this.destinoPermitido(drag.data,drop.data);
 guiaAberto=false;
 indicadorAjuda:'atencao'|'concluidos'|null=null;
 modulo=this.modulos[0];dados:Operacao[]=[];contexto:Contexto={os:[],itens:[],tecnicos:[],ferramentas:[],operacoesPermitidas:false,saidaPermitida:false,custosPermitidos:false};resumo:Resumo|null=null;
 osId:number|null=null;busca='';situacao='ATIVOS';visao:'lista'|'quadro'='lista';carregando=true;salvando=false;erro='';sucesso='';modal=false;itemBloqueado=false;formErro='';form:Operacao=this.vazio();detalhe:Operacao|null=null;historico:{id:number;autor:string;descricao:string;createdAt:string}[]=[];eventosCarregando=false;eventosErro='';contextoErro='';private searchTimer:any;private pesquisaSeq=0;resumoFormulario:Resumo|null=null;
 ngOnInit(){
  this.preferenciaMovimento?.addEventListener('change',this.atualizarMovimento);
  this.reload$.pipe(switchMap(()=>{this.carregando=true;this.erro='';this.dados=[];this.resumo=null;return forkJoin({dados:this.api.listar(this.modulo.id,this.osId),resumo:this.osId?this.api.resumo(this.osId):of(null)}).pipe(catchError(e=>{this.erro=this.mensagem(e);return of(null);}),finalize(()=>this.carregando=false));}),takeUntil(this.destroy$)).subscribe(r=>{if(r){this.dados=r.dados;this.resumo=r.resumo;}});
  this.api.contexto().pipe(takeUntil(this.destroy$)).subscribe({next:c=>this.aplicarContexto(c),error:e=>this.contextoErro=this.mensagem(e)});
  this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(p=>{this.modulo=this.modulos.find(m=>m.id===p.get('modulo'))||this.modulos[0];this.situacao=this.modulo.id==='custos'?'':'ATIVOS';this.busca='';this.indicadorAjuda=null;this.guiaAberto=false;this.atualizar();});
  this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(p=>{const id=Number(p.get('osId'));this.osId=Number.isInteger(id)&&id>0?id:null;this.atualizar();});
 }
 ngOnDestroy(){this.preferenciaMovimento?.removeEventListener('change',this.atualizarMovimento);clearTimeout(this.searchTimer);this.destroy$.next();this.destroy$.complete();}
 get navegacao(){return this.modulos.filter(m=>m.id==='custos'?this.contexto.custosPermitidos:this.contexto.operacoesPermitidas);}
 get visiveis(){const q=this.norm(this.busca);return this.dados.filter(r=>(!this.situacao||(this.situacao==='ATIVOS'?!this.encerrado(r.status):this.situacao==='ATRASADOS'?this.atrasado(r):this.situacao==='CONCLUIDOS'?this.encerrado(r.status)&&r.status!=='CANCELADO':r.status===this.situacao))&&(!q||this.norm([r.titulo,r.referencia,r.responsavel,r.recurso,this.osLabel(r.osId)].join(' ')).includes(q)));}
 get abertos(){return this.dados.filter(r=>!this.encerrado(r.status));}
 get atrasados(){return this.abertos.filter(r=>r.prazo&&r.prazo<this.hoje()).length;}
 get concluidos(){return this.dados.filter(r=>this.encerrado(r.status)&&r.status!=='CANCELADO').length;}
 get taxa(){return this.dados.length?Math.round(this.concluidos/this.dados.length*100):0;}
 get ajudaBusca(){return this.modulo.id==='impedimentos'
  ? 'Título: o nome dado ao impedimento, como “Aguardar kit de vedação”.\n\nResponsável: quem acompanha a ação, como “Almoxarifado”.\n\nReferência: um identificador do registro, como o PN de um material. Nos impedimentos, esse campo normalmente não é preenchido.\n\nEsta busca filtra os registros carregados da área atual. Para localizar uma OS, use “Ordem de serviço”.'
  : 'Título: o nome dado ao registro desta área.\n\nResponsável: quem acompanha a ação.\n\nReferência: o identificador informado no registro, como PN, competência ou referência técnica, conforme a área.\n\nEsta busca filtra os registros carregados. Para localizar uma OS, use “Ordem de serviço”.';}
 get ocultos(){return this.dados.length-this.visiveis.length;}
 get situacaoLabel(){return this.situacao==='ATIVOS'?'Em acompanhamento':this.situacao==='ATRASADOS'?'Prazo vencido':this.situacao==='CONCLUIDOS'?'Concluídos (sem cancelados)':this.label(this.situacao);}
 mostrarCarregados(){this.busca='';this.situacao='';this.indicadorAjuda=null;}
 filtrarIndicador(tipo:'abertos'|'atencao'|'concluidos'){
  this.indicadorAjuda=null;
  if(tipo==='atencao' && !this.atrasados){this.indicadorAjuda='atencao';return;}
  if(tipo==='concluidos' && !this.concluidos){this.indicadorAjuda='concluidos';return;}
  this.busca='';this.situacao=tipo==='abertos'?'ATIVOS':tipo==='atencao'?'ATRASADOS':'CONCLUIDOS';
 }
 get orientacaoConclusao(){return ({
  impedimentos:'Abra Atualizar no impedimento, registre a solução e altere a situação para Resolvido quando a causa estiver tratada.',
  materiais:'Após conferir a reserva e a documentação, abra Ver detalhes e use Confirmar consumo para registrar a saída. Reservado e Separado ainda estão em acompanhamento.',
  compras:'Atualize a compra para Recebido com a referência da entrada física. O recebimento comercial não altera o estoque.',
  prontidao:'Abra Atualizar na conferência, registre a evidência e selecione Conferido. Isso não substitui a liberação técnica.',
  custos:'Registre um lançamento Realizado para incluí-lo nos custos. Valores Previstos permanecem em acompanhamento.',
  planejamento:'Após executar o trabalho, abra Atualizar e selecione Concluido. A previsão de horas não substitui o apontamento da execução.',
  ferramentas:'Quando o instrumento retornar, abra Atualizar e altere a situação para Devolvido.',
  retornos:'Depois de apurar o retorno, abra Atualizar, registre o encaminhamento e selecione Concluido.'
 } as Record<string,string>)[this.modulo.id]||'Atualize o registro após concluir a ação correspondente.';}
 get comprasPorPn(){const map=new Map<string,{pn:string;quantidade:number;oss:Set<number>;prazo:string}>();for(const r of this.visiveis.filter(r=>!this.encerrado(r.status))){const pn=r.referencia||'Sem PN';const a=map.get(pn)||{pn,quantidade:0,oss:new Set<number>(),prazo:r.prazo||''};a.quantidade+=r.quantidade||0;if(r.osId)a.oss.add(r.osId);if(r.prazo&&(!a.prazo||r.prazo<a.prazo))a.prazo=r.prazo;map.set(pn,a);}return [...map.values()].map(a=>({...a,totalOs:a.oss.size}));}
 get cargas(){const map=new Map<string,{nome:string;horas:number;capacidade:number}>();for(const r of this.abertos){const nome=r.recurso||'Sem recurso';const item=map.get(nome)||{nome,horas:0,capacidade:r.capacidade||0};item.horas+=r.horas||0;map.set(nome,item);}const total=[...map.values()].reduce((s,r)=>s+r.horas,0);return [...map.values()].map(r=>({...r,percentual:total?r.horas/total*100:0}));}
 get itemSelecionado(){return this.contexto.itens.find(i=>i.id===this.form.itemId);}
 get tipos(){return ({impedimentos:['MATERIAL','CLIENTE','DOCUMENTACAO','INSPECAO','TERCEIRO','OUTRO'],materiais:['DEMANDA','RESERVA'],compras:['NORMAL','AOG'],prontidao:['EXECUCAO','ENTREGA'],custos:['MAO_DE_OBRA','SERVICO_EXTERNO','RETRABALHO','OUTRO'],planejamento:['TECNICO','BANCADA','EQUIPAMENTO'],ferramentas:['RETIRADA'],retornos:['GARANTIA','RETRABALHO','REINCIDENCIA']} as Record<string,string[]>)[this.modulo.id]||[];}
 vazio():Operacao{return {modulo:this.modulo?.id||'impedimentos',titulo:'',status:this.modulo?.estados[0]||'ABERTO',osId:this.osId,tipo:undefined};}
 atualizar(){this.reload$.next();}
 mudarArea(id:string){if(this.navegacao.some(m=>m.id===id))this.router.navigate(['/operacoes',id],{queryParams:{osId:this.osId}});}
 selecionarOs(){this.router.navigate([],{relativeTo:this.route,queryParams:{osId:this.osId||null},queryParamsHandling:'merge'});}
 buscarOsDropdown(q:string){this.pesquisarContexto((q||'').replace(/^os\s*#?\s*(?=\d)/i,''));}
 pesquisarContexto(q:string){
  const seq=++this.pesquisaSeq;clearTimeout(this.searchTimer);this.contextoBuscando=true;this.contextoErro='';
  this.searchTimer=setTimeout(()=>this.api.contexto(q).pipe(takeUntil(this.destroy$)).subscribe({
   next:c=>{if(seq===this.pesquisaSeq){this.aplicarContexto(c);this.contextoErro='';this.contextoBuscando=false;}},
   error:e=>{if(seq===this.pesquisaSeq){this.contextoErro=this.mensagem(e);this.contextoBuscando=false;}}
  }),350);
 }
 private aplicarContexto(c:Contexto){const preservarOs=[this.osId,this.form.osId,...this.dados.map(r=>r.osId)];c.os=[...c.os,...this.contexto.os.filter(o=>preservarOs.includes(o.id)&&!c.os.some(x=>x.id===o.id))];c.itens=[...c.itens,...this.contexto.itens.filter(i=>i.id===this.form.itemId&&!c.itens.some(x=>x.id===i.id))];this.contexto=c;this.osOpcoes=c.os.map(o=>({...o,label:'OS '+o.codigo+' · '+o.cliente,busca:'OS'+o.codigo+' '+o.codigo+' '+o.cliente+' '+o.pn+' '+o.sn}));}
 selecionarOsFormulario(){if(this.modulo.id!=='retornos')return;this.resumoFormulario=null;if(this.form.osId)this.api.resumo(this.form.osId).pipe(takeUntil(this.destroy$)).subscribe({next:r=>this.resumoFormulario=r,error:e=>this.formErro=this.mensagem(e)});}
 novo(){this.form=this.vazio();this.resumoFormulario=this.resumo;this.itemBloqueado=false;this.form.tipo=this.tipos[0];this.formErro='';this.modal=true;}
 editar(r:Operacao){this.movimentoOrigem=null;this.itemBloqueado=!!r.itemId;this.form={...r};this.selecionarOsFormulario();this.formErro='';this.modal=true;}
 selecionarItem(){const item=this.itemSelecionado;if(item){this.form.referencia=item.pn;this.form.tipo='RESERVA';if(this.form.status==='PENDENTE')this.form.status='RESERVADO';}}
 estornar(r:Operacao){this.editar(r);this.form.status='CANCELADO';this.form.observacao='';}
 fechar(){if(!this.salvando)this.modal=false;}
 salvar(f:NgForm){if(f.invalid){f.form.markAllAsTouched();this.formErro='Confira os campos obrigatórios.';return;}this.salvando=true;this.formErro='';this.api.salvar(this.form).pipe(finalize(()=>this.salvando=false),takeUntil(this.destroy$)).subscribe({next:()=>{this.modal=false;this.sucesso='Registro salvo. A operação foi atualizada.';this.atualizar();this.recarregarContexto();},error:e=>this.formErro=this.mensagem(e)});}
 consumir(r:Operacao){this.salvando=true;this.api.consumir(r).pipe(finalize(()=>this.salvando=false),takeUntil(this.destroy$)).subscribe({next:()=>{this.detalhe=null;this.sucesso='Saída registrada no estoque e na OS.';this.atualizar();this.recarregarContexto();},error:e=>this.erro=this.mensagem(e)});}
 recarregarContexto(){this.api.contexto().pipe(takeUntil(this.destroy$)).subscribe({next:c=>this.aplicarContexto(c),error:e=>this.contextoErro=this.mensagem(e)});}
 abrirDetalhe(r:Operacao){this.detalhe=r;this.historico=[];this.eventosErro='';this.eventosCarregando=true;this.api.eventos(r.id!).pipe(finalize(()=>this.eventosCarregando=false),takeUntil(this.destroy$)).subscribe({next:e=>this.historico=e,error:e=>this.eventosErro=this.mensagem(e)});}
 solicitarCompra(r:Operacao){this.router.navigate(['/operacoes/compras'],{queryParams:{osId:r.osId}}).then(()=>{this.novo();this.form={...this.form,origemId:r.id,osId:r.osId,titulo:'Compra • '+r.titulo,referencia:r.referencia,quantidade:r.quantidade};});}
 get colunasQuadro(){return this.modulo.estados.filter(s=>!this.ocultarVazias||this.grupo(s).length>0);}
 get listasConectadas(){return this.colunasQuadro.map(s=>'ops-col-'+s);}
 get colunasVazias(){return this.modulo.estados.filter(s=>!this.grupo(s).length).length;}
 destinoPermitido(r:Operacao,s:string){return !!r && r.modulo===this.modulo.id && !this.encerrado(r.status) && this.modulo.estados.includes(s) && !(r.modulo==='materiais' && s==='CONSUMIDO');}
 moverCartao(event:CdkDragDrop<string>){
  const r=event.item.data as Operacao,s=event.container.data;
  if(this.carregando||this.salvando||r.status===s||!this.destinoPermitido(r,s))return;
  this.editar(r);this.movimentoOrigem=r.status;this.form.status=s;
 }
 grupo(s:string){return this.visiveis.filter(r=>r.status===s);}
 osLabel(id?:number|null){const o=this.contexto.os.find(x=>x.id===id);return o?'OS '+o.codigo:id?'OS #'+id:'Sem OS vinculada';}
 label(s?:string){if(!s)return '—';return s.replace(/_/g,' ').toLowerCase().replace(/^./,x=>x.toUpperCase());}
 norm(s:string){return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();}
 hoje(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
 encerrado(s:string){return ['RESOLVIDO','CONSUMIDO','RECEBIDO','CONFERIDO','REALIZADO','CONCLUIDO','DEVOLVIDO','CANCELADO'].includes(s);}
 atrasado(r:Operacao){return !!r.prazo&&r.prazo<this.hoje()&&!this.encerrado(r.status);}
 dinheiro(n:number){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n||0);}
 mensagem(e:any){return typeof e?.error==='string'?e.error:e?.error?.message||e?.error?.detail||'Não foi possível concluir. Verifique sua conexão e tente novamente.';}
}
