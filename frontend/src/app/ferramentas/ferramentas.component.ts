import { Component, ElementRef, ViewChild, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { combineLatest, firstValueFrom, forkJoin, Subscription, timer } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Calibracao, Contexto, Evento, Ferramenta, FerramentasService, ItemFerramenta, Pendente } from './ferramentas.service';
import { criterioProvisorio } from './criterio-aceitacao';
import { TerminalFerramentaria, PareamentoFerramentaria } from './ferramentas.service';
import { FullscreenToggleComponent } from '../shared/fullscreen-toggle/fullscreen-toggle.component';
import { VinculosFerramentasPnComponent } from './vinculos-ferramentas-pn.component';

@Component({
  selector: 'app-ferramentas', standalone: true, imports: [CommonModule, FormsModule, RouterModule, FullscreenToggleComponent, VinculosFerramentasPnComponent],
  templateUrl: './ferramentas.component.html', styleUrls: ['../os/fluxo/fluxo-shared.css', './ferramentas.component.scss', './ferramentas-theme.scss']
})
export class FerramentasComponent implements OnInit, OnDestroy {
  readonly api = inject(FerramentasService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  @ViewChild('scanner') scanner?: ElementRef<HTMLInputElement>;
  @ViewChild('dialog') dialog?: ElementRef<HTMLElement>;
  @ViewChild('drawer') drawer?: ElementRef<HTMLElement>;
  @ViewChild('resultadoCards') resultadoCards?: ElementRef<HTMLElement>;
  @ViewChild('certificadoInput') certificadoInput?: ElementRef<HTMLInputElement>;
  arquivoErro = ''; lendoArquivo = false; arquivoTamanho = 0;
  private arquivoSequencia = 0;
  private focusAnterior?: HTMLElement;
  private subs = new Subscription();
  private osSolicitada: number | null=null;
  osOperacoes: number | null=null; buscaOperacoes='';
  visao = 'estacao'; modo = 'RETIRADA'; codigo = ''; busca = ''; filtro = 'TODOS';
  leituraMensagem = ''; leituraFalhou = false;
  get previaLeitura() {const codigo=this.codigo.trim().toUpperCase();return codigo?this.itens.find(i=>i.ferramenta.codigo.toUpperCase()===codigo):undefined;}
  itens: ItemFerramenta[] = []; cesta: ItemFerramenta[] = []; pendentes: Pendente[] = []; ciclos: Calibracao[] = [];
  contexto: Contexto = {pessoas: [], ordens: [], laboratorios: [], permissoes: []};
  carregando = false; ocupado = false; erro = ''; aviso = ''; avisoErro = false; sincronizado?: Date;
  som = true;
  osId: number | null = null; mecanicoId: number | null = null; localizacao = ''; retorno = '';
  erroPreparacao = '';
  terminal?: TerminalFerramentaria;
  pareamento?: PareamentoFerramentaria;
  terminalErro=''; verificandoTerminal=false;
  get terminalPronto(){return !!this.terminal?.ferramentaria;}
  get exigeTerminalModal(){return ['devolver','enviar','receber','prepararPn'].includes(this.modal) || (this.modal==='confirmar' && !['CANCELAR','RECUSAR'].includes(this.form.etapa));}
  async atualizarTerminal(){
    if(!this.auth.isAuthenticated() || this.verificandoTerminal)return;
    this.verificandoTerminal=true;
    try {
      this.terminal=await firstValueFrom(this.api.get<TerminalFerramentaria>('/terminal'));this.terminalErro='';
      if(this.terminal.vinculada)this.pareamento=undefined;
      else if(!this.pareamento?.codigo || !this.pareamento.expiraEm || new Date(this.pareamento.expiraEm).getTime()<Date.now()+60000)
        this.pareamento=await firstValueFrom(this.api.post<PareamentoFerramentaria>('/terminal/pareamento',{}));
    }catch(e:any){this.terminal=undefined;this.terminalErro=e?.error?.message || 'Não foi possível verificar esta máquina. Tente novamente.';}
    finally{this.verificandoTerminal=false;}
  }
  scannerFocado = false; sugestaoMecanico = '';
  selecionarOs(id: number | null) {
    this.osId=id;this.sugestaoMecanico='';
    const ordem=this.contexto.ordens.find(o=>o.id===id);
    if(!this.tem('ESTACAO') && this.modo!=='TRANSFERENCIA'){this.mecanicoId=this.usuario?.id || null;if(ordem)this.sugestaoMecanico='A movimentação continuará sob sua responsabilidade.';return;}
    this.mecanicoId=null;
    if(!ordem)return;
    const pessoa=this.contexto.pessoas.find(p=>p.id===ordem.mecanicoResponsavelId);
    if(pessoa){this.mecanicoId=pessoa.id;this.sugestaoMecanico=`${pessoa.nome} sugerido pelo vínculo com a OS. Você pode alterar para esta movimentação.`;}
    else this.sugestaoMecanico=ordem.mecanicoResponsavelId?'O responsável da OS não está habilitado para receber ferramentas. Selecione outro mecânico.':'Esta OS não tem mecânico vinculado. Selecione o responsável pela movimentação.';
  }
  modal = ''; form: any = {}; selecionado?: ItemFerramenta; pendente?: Pendente; ciclo?: Calibracao;
  detalhes?: ItemFerramenta; eventos: Evento[] = []; impactos: any[] = []; de = ''; ate = ''; detalheCarregando = false;
  readonly criterioProvisorio = criterioProvisorio;
  certificadosBaixando = new Set<number>();
  certificadoDownloadIniciado?: number;
  ngOnInit() {
    this.subs.add(combineLatest([this.route.paramMap,this.route.queryParamMap]).subscribe(([p,q]) => {
      this.visao=p.get('visao') || 'estacao';this.busca='';
      const os=Number(q.get('osId'));
      if(Number.isSafeInteger(os) && os>0){this.osSolicitada=os;this.osOperacoes=os;if(this.contexto.ordens.length){this.selecionarOs(os);this.osSolicitada=null;}}
      const filtro=q.get('filtro') || 'TODOS';
      this.filtro=['TODOS','DISPONIVEL','SOB_CUSTODIA','EM_USO','ATRASADAS','BLOQUEADA','EM_LABORATORIO','CALIBRACAO_ATENCAO'].includes(filtro)?filtro:'TODOS';
      if(this.filtro!=='TODOS')setTimeout(()=>this.focarResultados());
    }));
    if(this.auth.isAuthenticated()) this.carregar();
    this.subs.add(timer(30000,30000).subscribe(()=>{if(this.auth.isAuthenticated() && !this.ocupado && !this.carregando)this.carregar(false);}));
    this.subs.add(timer(3000,3000).subscribe(()=>{if(this.auth.isAuthenticated() && !this.terminalPronto && !this.ocupado)this.atualizarTerminal();}));
  }
  ngOnDestroy() {this.subs.unsubscribe();}
  tem(...codes: string[]) {return codes.some(c => this.contexto.permissoes.includes(`FERRAMENTAS_${c}`));}
  get usuario() {return this.auth.getCurrentUser();}
  get disponiveis() {return this.itens.filter(i=>this.correspondeFiltro(i,'DISPONIVEL')).length;}
  get emUso() {return this.itens.filter(i=>this.correspondeFiltro(i,'SOB_CUSTODIA')).length;}
  get atrasadas() {return this.itens.filter(i=>this.correspondeFiltro(i,'ATRASADAS')).length;}
  get atencaoCal() {return this.itens.filter(i=>this.correspondeFiltro(i,'CALIBRACAO_ATENCAO')).length;}
  correspondeFiltro(i: ItemFerramenta,filtro: string) {
    if(filtro==='TODOS')return true;
    if(filtro==='SOB_CUSTODIA')return !!i.custodia;
    if(filtro==='ATRASADAS')return i.atrasada || i.recolher;
    if(filtro==='CALIBRACAO_ATENCAO')return i.ferramenta.exigeCalibracao && (i.diasCalibracao==null || i.diasCalibracao<=this.janela(i));
    return i.situacao===filtro;
  }
  get tituloFiltro() {return ({DISPONIVEL:'Disponíveis agora',SOB_CUSTODIA:'Sob custódia',EM_USO:'Em uso',ATRASADAS:'Retorno e recolhimento',BLOQUEADA:'Ferramentas bloqueadas',EM_LABORATORIO:'Em laboratório',CALIBRACAO_ATENCAO:'Atenção à calibração'} as Record<string,string>)[this.filtro] || 'Todas as ferramentas';}
  get descricaoFiltro() {return ({DISPONIVEL:'Exemplares regulares e livres para retirada.',SOB_CUSTODIA:'Todas as custódias ativas, incluindo ferramentas bloqueadas que precisam ser recolhidas.',ATRASADAS:'Exemplares com retorno em atraso ou restrição que exige recolhimento.',CALIBRACAO_ATENCAO:'Instrumentos dentro da janela de alerta, vencidos ou sem calibração aprovada.'} as Record<string,string>)[this.filtro] || 'Exemplares que correspondem à situação selecionada.';}
  janela(i: ItemFerramenta) {return Math.max(...i.ferramenta.alertas.split(',').map(Number));}
  get filtrados() {
    const q=this.busca.trim().toLocaleLowerCase('pt-BR');
    return this.itens.filter(i => (!q || [i.ferramenta.codigo,i.ferramenta.descricao,i.ferramenta.serie,i.mecanico,i.osNumero].some(v=>v?.toLocaleLowerCase('pt-BR').includes(q))) &&
      this.correspondeFiltro(i,this.filtro));
  }
  get instrumentos() {return this.filtrados.filter(i=>i.ferramenta.exigeCalibracao);}
  get operacoesItens(){const q=this.buscaOperacoes.trim().toLocaleLowerCase('pt-BR');return this.itens.filter(i=>(!this.osOperacoes || i.custodia?.osId===this.osOperacoes) && (!q || [i.ferramenta.codigo,i.ferramenta.descricao,i.mecanico,i.osNumero].join(' ').toLocaleLowerCase('pt-BR').includes(q)));}
  get operacoesPendentes(){const q=this.buscaOperacoes.trim().toLocaleLowerCase('pt-BR');return this.pendentes.filter(p=>(!this.osOperacoes || p.movimento.osId===this.osOperacoes) && (!q || [p.codigo,p.descricao,p.mecanico,p.osNumero].join(' ').toLocaleLowerCase('pt-BR').includes(q)));}
  get operacoesRetornos(){return this.operacoesItens.filter(i=>i.custodia).sort((a,b)=>Number(b.recolher || b.atrasada)-Number(a.recolher || a.atrasada) || (a.custodia!.retornoPrevisto || '').localeCompare(b.custodia!.retornoPrevisto || ''));}
  get operacoesCiclos(){const ids=new Set(this.operacoesItens.map(i=>i.ferramenta.id));return this.ciclosAbertos.filter(c=>ids.has(c.ferramentaId));}
  get operacoesCalibracao(){return this.operacoesItens.filter(i=>this.correspondeFiltro(i,'CALIBRACAO_ATENCAO'));}
  async operarOs(){if(this.osOperacoes)await this.router.navigate(['/ferramentas'],{queryParams:{osId:this.osOperacoes}});}
  get ciclosAbertos() {return this.ciclos.filter(c=>['EM_LABORATORIO','EM_ANALISE'].includes(c.status));}
  get titulo() {return ({operacoes:'Central de operações',estacao:'Estação de ferramentas',acervo:'Acervo de ferramentas',calibracao:'Gestão de calibração',pendencias:'Movimentações pendentes',minhas:'Minhas ferramentas'} as any)[this.visao] || 'Estação de ferramentas';}
  get iconeVisao() {return ({operacoes:'pi-compass',estacao:'pi-barcode',acervo:'pi-box',calibracao:'pi-verified',pendencias:'pi-inbox',minhas:'pi-wrench'} as any)[this.visao] || 'pi-barcode';}
  get subtitulo() {return ({operacoes:'Ferramentaria e calibração conectadas à execução das ordens de serviço.',estacao:'Da leitura à liberação. Cada ferramenta, cada responsável, cada movimento.',acervo:'Identificação individual e rastreabilidade ao longo de toda a operação.',calibracao:'Planeje, acompanhe e libere instrumentos com evidências e decisão técnica.',pendencias:'Confira a entrega e o destinatário para concluir o registro pela ferramentaria.',minhas:'Acompanhe os itens sob sua responsabilidade.'} as any)[this.visao];}
  async carregar(visivel=true) {
    if(this.carregando)return;this.carregando=true;
    try {
      const [itens,contexto,pendentes,ciclos]=await firstValueFrom(forkJoin([this.api.get<ItemFerramenta[]>(),this.api.get<Contexto>('/contexto'),this.api.get<Pendente[]>('/movimentos'),this.api.get<Calibracao[]>('/calibracoes')]));
      this.itens=itens;this.contexto=contexto;this.pendentes=pendentes;this.ciclos=ciclos;this.sincronizado=new Date();
      if(this.osSolicitada && contexto.ordens.some(o=>o.id===this.osSolicitada)){this.selecionarOs(this.osSolicitada);this.osSolicitada=null;}
      this.cesta=this.cesta.map(i=>itens.find(n=>n.ferramenta.id===i.ferramenta.id) || i);
      if(this.modo!=='TRANSFERENCIA' && !this.tem('ESTACAO') && this.tem('MECANICO'))this.mecanicoId=this.usuario!.id;
      if(!this.retorno){const d=new Date();d.setHours(d.getHours()+2);this.retorno=this.localDateTime(d);}
      this.erro='';if(visivel)setTimeout(()=>this.filtro!=='TODOS'?this.focarResultados():this.focar(),0);
      await this.atualizarTerminal();
    }catch(e){this.falha(e);}finally{this.carregando=false;}
  }
  async navegar(v: string){await this.router.navigate(v==='estacao'?['/ferramentas']:['/ferramentas',v]);}
  async verFiltro(filtro: string){
    this.busca='';
    await this.router.navigate(['/ferramentas',filtro==='CALIBRACAO_ATENCAO'?'calibracao':'acervo'],{queryParams:{filtro}});
    setTimeout(()=>this.focarResultados());
  }
  async alterarFiltro(filtro: string){await this.router.navigate([],{relativeTo:this.route,queryParams:{filtro:filtro==='TODOS'?null:filtro},queryParamsHandling:'merge'});}
  private focarResultados(){
    const el=this.resultadoCards?.nativeElement;if(!el)return;
    el.focus({preventScroll:true});
    el.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  localDateTime(d: Date) {const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);const part=(k:string)=>parts.find(p=>p.type===k)!.value;return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;}
  hoje() {const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>p.find(x=>x.type===k)!.value).join('-');}
  rotulo(s?: string) {return ({DISPONIVEL:'Disponível',EM_USO:'Em uso',BLOQUEADA:'Bloqueada',EM_LABORATORIO:'No laboratório',EM_ANALISE:'Em análise',APROVADA:'Aprovada',REPROVADA:'Reprovada',RETIRADA:'Retirada',TRANSFERENCIA:'Transferência',INTERESSE:'Interesse',REGULAR:'Íntegra e conferida',AVARIA:'Avaria',INSPECAO:'Inspeção necessária',PERDA:'Perda',DESVIO:'Suspeita de desvio',CHECAGEM:'Checagem intermediária',BAIXA:'Baixa'} as any)[s || ''] || (s || '').replaceAll('_',' ').toLowerCase();}
  mudarModo(m: string){this.modo=m;if(m==='TRANSFERENCIA')this.mecanicoId=null;else if(!this.tem('ESTACAO'))this.mecanicoId=this.usuario?.id || null;this.cesta=[];this.aviso='';this.codigo='';this.limparLeitura();this.focar();}
  focar(){if(!this.modal && !this.detalhes && this.visao==='estacao' && this.auth.isAuthenticated())this.scanner?.nativeElement.focus();}
  bipar() {
    if(this.ocupado)return;
    const codigo=this.codigo.trim().toUpperCase();if(!codigo)return;
    if(!this.sincronizado){this.feedbackLeitura(this.carregando?'Aguarde o carregamento do acervo antes de confirmar o código.':'O acervo não foi carregado. Clique em Atualizar e tente novamente.',true);return;}
    const i=this.itens.find(i=>i.ferramenta.codigo.toUpperCase()===codigo);
    if(!i){this.feedbackLeitura(this.itens.length?'Código não encontrado. Confira a etiqueta ou cadastre o exemplar.':'Nenhuma ferramenta cadastrada. Cadastre o exemplar no Acervo antes de fazer a leitura.',true);return;}
    if(this.modo==='CONSULTA'){this.codigo='';this.limparLeitura();this.ver(i);return;}
    if(this.cesta.some(n=>n.ferramenta.id===i.ferramenta.id)){this.feedbackLeitura(`${codigo} já está na conferência.`,true);return;}
    if(['RETIRADA','TRANSFERENCIA'].includes(this.modo) && (i.restricao || (this.modo==='RETIRADA' && i.custodia))){this.feedbackLeitura(i.restricao || `${codigo} já está em uso por ${i.mecanico}. Registre um interesse ou transferência.`,true);return;}
    if(['DEVOLUCAO','TRANSFERENCIA'].includes(this.modo) && !i.custodia){this.feedbackLeitura('Este exemplar não possui custódia ativa.',true);return;}
    this.cesta=[...this.cesta,i];this.codigo='';this.feedbackLeitura(`${codigo} adicionado à conferência.`);this.focar();
  }
  limparLeitura(){this.leituraMensagem='';this.leituraFalhou=false;}
  private feedbackLeitura(mensagem: string,erro=false){this.leituraMensagem=mensagem;this.leituraFalhou=erro;this.aviso='';if(this.som)this.beep(erro);this.focar();if(erro)this.scanner?.nativeElement.select();}
  notificar(msg: string,erro=false){this.aviso=msg;this.avisoErro=erro;if(this.som)this.beep(erro);}
  private beep(erro: boolean){try {const ctx=new AudioContext();const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=erro?220:880;g.gain.value=.035;o.start();o.stop(ctx.currentTime+.10);o.onended=()=>ctx.close();}catch{}}
  remover(id: number){this.cesta=this.cesta.filter(i=>i.ferramenta.id!==id);this.focar();}
  async preparar(){
    this.erroPreparacao='';
    if(this.ocupado || !this.cesta.length)return;
    if(this.modo==='DEVOLUCAO'){this.abrir('devolver',this.cesta[0]);return;}
    if(this.tem('ESTACAO') && this.modo!=='INTERESSE' && !this.terminalPronto){this.erroPreparacao='Use uma máquina pareada à Ferramentaria para preparar esta operação. Consulte a identificação do terminal acima.';return;}
    const campos=[{valor:this.osId,nome:'a ordem de serviço',indice:0},{valor:this.mecanicoId,nome:'o mecânico responsável',indice:1},{valor:this.localizacao.trim(),nome:'a localização informada',indice:2},{valor:this.retorno,nome:'a previsão de retorno',indice:3}];
    const faltante=campos.find(c=>!c.valor);
    if(faltante){this.erroPreparacao=`Preencha ${faltante.nome} para continuar.`;const campo=document.querySelectorAll<HTMLElement>('.operation-fields select, .operation-fields input')[faltante.indice];campo?.focus();campo?.scrollIntoView({block:'center',behavior:'smooth'});return;}
    this.ocupado=true;
    try {await firstValueFrom(this.api.post('/movimentos',{ferramentas:this.cesta.map(i=>i.ferramenta.id),osId:this.osId,mecanicoId:this.mecanicoId,localizacao:this.localizacao,retornoPrevisto:this.retorno,tipo:this.modo}));this.cesta=[];await this.carregar(false);this.notificar('Preparação registrada. Confirme a entrega e o recebimento em Pendências.');await this.navegar('pendencias');}
    catch(e){this.falha(e);this.erroPreparacao=this.erro;}finally{this.ocupado=false;}
  }
  abrir(modal: string,i?: ItemFerramenta,c?: Calibracao,p?: Pendente,etapa?: string){
    this.arquivoSequencia++;this.arquivoErro='';this.lendoArquivo=false;this.arquivoTamanho=0;
    this.focusAnterior=document.activeElement as HTMLElement;this.modal=modal;this.selecionado=i;this.ciclo=c;this.pendente=p;this.erro='';
    this.form=modal==='cadastro'?{codigo:'',descricao:'',tipo:'',marca:'',modelo:'',serie:'',posicao:'',exigeCalibracao:false,intervalo:6,unidade:'MESES',alertas:'30,15,7',criterio:''}:
      modal==='editar'?{...i!.ferramenta,justificativa:''}:
      modal==='confirmar'?{etapa,justificativa:'',retornoPrevisto:p?.movimento.retornoPrevisto?.slice(0,16)}:
      modal==='prepararPn'?{localizacao:p?.movimento.localizacao,retornoPrevisto:p?.movimento.retornoPrevisto?.slice(0,16)}:
      modal==='enviar'?{laboratorioId:null,enviadaEm:this.hoje(),retornoPrevisto:'',condicaoEnvio:''}:
      modal==='receber'?{realizadaEm:this.hoje(),certificado:'',arquivoNome:'',arquivoBase64:'',resultados:'',conferenciaFisica:false}:
      modal==='analisar'?{aprovada:true,justificativa:''}:
      modal==='laboratorio'?{nome:'',contato:'',escopo:'',consultaAcreditacao:''}:
      {condicao:modal==='ocorrencia'?'INSPECAO':'REGULAR',justificativa:'',localizacao:i?.custodia?.localizacao || '',retornoPrevisto:i?.custodia?.retornoPrevisto?.slice(0,16) || ''};
    setTimeout(()=>this.dialog?.nativeElement.querySelector<HTMLElement>('input,select,textarea,button')?.focus());
  }
  fechar(){if(this.ocupado)return;this.arquivoSequencia++;this.lendoArquivo=false;this.modal='';this.erro='';setTimeout(()=>{this.focusAnterior?.focus();this.focar();});}
  @HostListener('document:keydown',['$event']) teclado(e: KeyboardEvent){
    if(e.key==='Escape' && !this.ocupado){if(this.modal)this.fechar();else if(this.detalhes)this.detalhes=undefined;else this.focar();}
    if(e.key==='F2' && this.auth.isAuthenticated()){e.preventDefault();this.navegar('estacao').then(()=>setTimeout(()=>this.focar()));}
    const surface=this.modal?this.dialog:this.detalhes?this.drawer:undefined;
    if(e.key==='Tab' && surface){const elements=Array.from(surface.nativeElement.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select,textarea,[tabindex="0"]'));const first=elements[0],last=elements[elements.length-1];if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}}
  }
  get modalTitulo(){return ({cadastro:'Novo exemplar',editar:'Editar cadastro',devolver:'Conferir devolução',previsao:'Atualizar previsão',ocorrencia:'Registrar ocorrência',enviar:'Enviar para calibração',receber:'Receber e documentar',analisar:'Análise e decisão técnica',laboratorio:'Novo laboratório',prepararPn:'Preparar retirada solicitada',confirmar:this.form.etapa==='REGISTRAR'?'Conferir e registrar movimentação':`Confirmar ${this.rotulo(this.form.etapa)}`} as any)[this.modal] || 'Confirmar operação';}
  async salvar(){
    if(this.exigeTerminalModal && !this.terminalPronto){this.erro='Use uma máquina pareada à Ferramentaria para registrar esta operação física.';return;}
    if(this.ocupado || (this.modal==='receber' && (this.lendoArquivo || !this.form.arquivoBase64 || this.arquivoErro)))return;this.ocupado=true;this.erro='';
    try {
      if(['cadastro','editar'].includes(this.modal) && this.form.exigeCalibracao && criterioProvisorio(this.form.criterio)) {this.erro='Substitua o texto de teste por um critério técnico definido pela empresa.';return;}
      if(this.modal==='analisar' && this.form.aprovada && criterioProvisorio(this.selecionado?.ferramenta.criterio)){this.erro='Revise o critério de aceitação no cadastro antes de aprovar esta calibração.';return;}
      const id=this.selecionado?.ferramenta.id;
      if(this.modal==='cadastro')await firstValueFrom(this.api.post('',this.form));
      if(this.modal==='editar')await firstValueFrom(this.api.put(`/${id}`,{ferramenta:this.form,justificativa:this.form.justificativa}));
      if(['devolver','previsao','ocorrencia'].includes(this.modal))await firstValueFrom(this.api.post(`/${id}/${this.modal}`,this.form));
      if(this.modal==='confirmar')await firstValueFrom(this.api.post(`/movimentos/${this.pendente!.movimento.id}/confirmar`,this.form));
      if(this.modal==='prepararPn')await firstValueFrom(this.api.post(`/movimentos/${this.pendente!.movimento.id}/preparar-solicitacao-pn`,this.form));
      if(this.modal==='enviar')await firstValueFrom(this.api.post(`/${id}/calibracoes`,this.form));
      if(this.modal==='receber')await firstValueFrom(this.api.post(`/calibracoes/${this.ciclo!.id}/receber`,this.form));
      if(this.modal==='analisar')await firstValueFrom(this.api.post(`/calibracoes/${this.ciclo!.id}/analisar`,this.form));
      if(this.modal==='laboratorio')await firstValueFrom(this.api.post('/laboratorios',{...this.form,consultaAcreditacao:this.form.consultaAcreditacao || null}));
      const devolucao=this.modal==='devolver';if(devolucao && id)this.remover(id);
      this.modal='';this.detalhes=undefined;await this.carregar(false);this.notificar('Operação registrada com sucesso.');this.ocupado=false;
      if(devolucao && this.modo==='DEVOLUCAO' && this.cesta.length)this.abrir('devolver',this.cesta[0]);else this.focar();
    }catch(e){this.falha(e);}finally{this.ocupado=false;}
  }
  async arquivo(event: Event){
    const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;
    this.removerArquivo();
    if(file.size>10*1024*1024 || (file.type!=='application/pdf' && !(file.type==='' && /\.pdf$/i.test(file.name)))){this.arquivoErro='Selecione um certificado PDF de até 10 MB.';return;}
    const sequencia=this.arquivoSequencia,form=this.form;this.lendoArquivo=true;
    try {
      if(await file.slice(0,5).text()!=='%PDF-')throw new Error('PDF_INVALIDO');
      const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(file);});
      if(sequencia!==this.arquivoSequencia || form!==this.form || this.modal!=='receber')return;
      this.form.arquivoNome=file.name;this.form.arquivoBase64=data.split(',')[1];this.arquivoTamanho=file.size;this.arquivoErro='';
    }catch(e){if(sequencia===this.arquivoSequencia)this.arquivoErro=e instanceof Error && e.message==='PDF_INVALIDO'?'O arquivo selecionado não possui uma assinatura PDF válida.':'Não foi possível ler o PDF. Selecione o arquivo novamente.';}
    finally{if(sequencia===this.arquivoSequencia)this.lendoArquivo=false;input.value='';}
  }
  removerArquivo(){this.arquivoSequencia++;this.form.arquivoNome='';this.form.arquivoBase64='';this.arquivoTamanho=0;this.arquivoErro='';this.lendoArquivo=false;if(this.certificadoInput)this.certificadoInput.nativeElement.value='';}
  get tamanhoArquivo(){return this.arquivoTamanho>=1024*1024?`${(this.arquivoTamanho/(1024*1024)).toFixed(1).replace('.',',')} MB`:`${Math.max(1,Math.round(this.arquivoTamanho/1024))} KB`;}
  async ver(i: ItemFerramenta){this.detalhes=i;this.eventos=[];this.impactos=[];this.de=i.ferramenta.ultimaCalibracao || '';this.ate=this.hoje();this.detalheCarregando=true;setTimeout(()=>this.drawer?.nativeElement.querySelector<HTMLElement>('button')?.focus());
    try{this.eventos=await firstValueFrom(this.api.get<Evento[]>(`/${i.ferramenta.id}/historico`));}catch(e){this.falha(e);}finally{this.detalheCarregando=false;}}
  async investigar(){if(!this.detalhes)return;this.detalheCarregando=true;try{this.impactos=await firstValueFrom(this.api.get<any[]>(`/${this.detalhes.ferramenta.id}/impacto?de=${this.de}&ate=${this.ate}`));if(!this.impactos.length)this.notificar('Nenhuma custódia encontrada no período.');}catch(e){this.falha(e);}finally{this.detalheCarregando=false;}}
  async baixar(c: Calibracao){
    if(this.certificadosBaixando.has(c.id))return;
    this.certificadosBaixando.add(c.id);this.certificadoDownloadIniciado=undefined;
    try{const blob=await firstValueFrom(this.api.certificado(c.id));const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`certificado-${String(c.certificado || c.id).replace(/[\\/:*?"<>|]/g,'-')}.pdf`;document.body.appendChild(a);a.click();a.remove();this.certificadoDownloadIniciado=c.id;setTimeout(()=>URL.revokeObjectURL(url),30000);}
    catch(e){this.falha(e);}finally{this.certificadosBaixando.delete(c.id);}
  }
  itemDoCiclo(c: Calibracao){return this.itens.find(i=>i.ferramenta.id===c.ferramentaId);}
  laboratorioNome(id: number){return this.contexto.laboratorios.find(l=>l.id===id)?.nome || 'Laboratório';}
  cicloAtrasado(c: Calibracao){return c.status==='EM_LABORATORIO' && c.retornoPrevisto<this.hoje();}
  async etiqueta(i: ItemFerramenta){
    try{const {default: JsBarcode}=await import('jsbarcode');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');JsBarcode(svg,i.ferramenta.codigo,{format:'CODE128',height:55,width:2,fontSize:16,margin:12});const win=window.open('','_blank','width=600,height=400');if(!win){this.notificar('Permita a janela de impressão no navegador.',true);return;}win.document.title=`Etiqueta ${i.ferramenta.codigo}`;const style=win.document.createElement('style');style.textContent='@page{size:70mm 40mm;margin:2mm}body{font:12px Arial;text-align:center;margin:8px}svg{max-width:100%;height:90px}p{margin:4px}';win.document.head.append(style);win.document.body.append(svg);const p=win.document.createElement('p');p.textContent=i.ferramenta.descricao;win.document.body.append(p);win.focus();setTimeout(()=>win.print(),250);}catch{this.notificar('Não foi possível gerar a etiqueta. Verifique o código.',true);}
  }
  private falha(e: any){this.erro=e?.error?.message || e?.error?.error || (e?.status===0?'Sem conexão com o servidor. Confira a rede e tente novamente.':'Não foi possível concluir. Atualize e tente novamente.');this.notificar(this.erro,true);}
}
