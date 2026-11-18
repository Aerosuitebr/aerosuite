import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, firstValueFrom, switchMap, timer } from 'rxjs';
import { Ferramenta, FerramentasService, ItemFerramenta, PlanoPn, ResumoVinculoPn, SugestaoPn, requerAtencaoCalibracao } from './ferramentas.service';

type Coluna = 'vinculadas' | 'acervo';
type Linha = Pick<Ferramenta, 'id' | 'codigo' | 'descricao'> & Partial<Ferramenta>;

@Component({
  selector: 'app-vinculos-ferramentas-pn',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DialogModule, TooltipModule],
  templateUrl: './vinculos-ferramentas-pn.component.html',
  styleUrl: './vinculos-ferramentas-pn.component.scss'
})
export class VinculosFerramentasPnComponent implements OnInit, OnDestroy {
  private acervo: ItemFerramenta[] = [];
  itensPorId = new Map<number, ItemFerramenta>();
  @Input() set itens(valor: ItemFerramenta[]) {
    this.acervo = valor;
    this.itensPorId = new Map(valor.map(item => [item.ferramenta.id, item]));
  }
  get itens() { return this.acervo; }
  @Input() central = false;
  @Input() podeEditar = true;
  private readonly api = inject(FerramentasService);
  private buscaPn?: Subscription;
  private consultaPlano?: Subscription;
  private consultaResumo?: Subscription;
  aberto = false;
  pn = '';
  descricaoPn = '';
  termoPn = '';
  termoFerramenta = '';
  termoCentral = '';
  private destaqueCentral?: RegExp;
  private trechosPorTexto = new Map<string, { texto: string; marcado: boolean }[]>();
  expandidos = new Set<string>();
  readonly requerAtencaoCalibracao = requerAtencaoCalibracao;
  sugestoes: SugestaoPn[] = [];
  resumo: ResumoVinculoPn[] = [];
  buscando = false;
  carregando = false;
  carregandoResumo = false;
  salvando = false;
  erroBusca = '';
  erro = '';
  erroResumo = '';
  aviso = '';
  destinoArraste?: Coluna;
  private arraste?: { origem: Coluna; ids: number[] };
  private plano?: PlanoPn;
  private vinculadas = new Set<number>();
  private selecao = { vinculadas: new Set<number>(), acervo: new Set<number>() };

  get alterado() {
    return !!this.plano && (this.plano.ferramentas.length !== this.vinculadas.size
      || this.plano.ferramentas.some(f => !this.vinculadas.has(f.id)));
  }
  get linhasVinculadas(): Linha[] {
    const ferramentas = new Map(this.itens.map(i => [i.ferramenta.id, i.ferramenta]));
    const originais = new Map(this.plano?.ferramentas.map(f => [f.id, f]));
    return [...this.vinculadas].flatMap(id => {
      const ferramenta = ferramentas.get(id) ?? originais.get(id);
      return ferramenta ? [ferramenta] : [];
    }).sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true }));
  }
  get linhasAcervo() {
    return this.itens.map(i => i.ferramenta)
      .filter(f => !this.vinculadas.has(f.id) && this.combina(
        [f.codigo, f.descricao, f.tipo, f.marca, f.modelo, f.serie, f.posicao], this.termoFerramenta))
      .sort((a, b) => Number(this.normalizar(b.codigo) === this.normalizar(this.termoFerramenta))
        - Number(this.normalizar(a.codigo) === this.normalizar(this.termoFerramenta))
        || a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true }));
  }
  get resumoFiltrado() {
    return this.resumo.filter(grupo => this.ferramentasDoResumo(grupo).length > 0);
  }
  ferramentasDoResumo(grupo: ResumoVinculoPn) {
    if (this.combina([grupo.pn, grupo.descricao ?? undefined], this.termoCentral)) return grupo.ferramentas;
    return grupo.ferramentas.filter(f => this.combina([f.codigo, f.descricao], this.termoCentral));
  }
  buscarResumo(termo: string) {
    this.termoCentral = termo;
    this.trechosPorTexto.clear();
    const busca = this.normalizar(termo);
    const termos = busca.split(/\s+/).filter(Boolean).sort((a, b) => b.length - a.length);
    const literal = termos.map(palavra => palavra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const compacto = busca.replace(/[^\p{L}\p{N}]/gu, '');
    const comSeparadores = [...compacto].join('[^\\p{L}\\p{N}]*');
    this.destaqueCentral = literal ? new RegExp([comSeparadores, literal].filter(Boolean).join('|'), 'gu') : undefined;
  }
  definirExpansao(expandir: boolean) {
    this.expandidos = new Set(expandir ? this.resumoFiltrado.map(grupo => grupo.pn) : []);
  }
  alternarGrupo(pn: string) {
    if (this.expandidos.has(pn)) this.expandidos.delete(pn);
    else this.expandidos.add(pn);
  }
  trechosDestaque(texto: string) {
    const anteriores = this.trechosPorTexto.get(texto);
    if (anteriores) return anteriores;
    const normalizado = texto.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR');
    const partes: { texto: string; marcado: boolean }[] = [];
    let inicio = 0;
    for (const ocorrencia of this.destaqueCentral ? normalizado.matchAll(this.destaqueCentral) : []) {
      const posicao = ocorrencia.index!;
      if (posicao > inicio) partes.push({ texto: texto.slice(inicio, posicao), marcado: false });
      inicio = posicao + ocorrencia[0].length;
      partes.push({ texto: texto.slice(posicao, inicio), marcado: true });
    }
    if (inicio < texto.length) partes.push({ texto: texto.slice(inicio), marcado: false });
    this.trechosPorTexto.set(texto, partes);
    return partes;
  }
  rotuloDisponibilidade(item: ItemFerramenta) {
    const rotulos: Record<string, string> = {
      DISPONIVEL: 'Disponível agora', BLOQUEADA: 'Bloqueada', EM_LABORATORIO: 'No laboratório',
      EM_ANALISE: 'Em análise', EM_USO: 'Em uso', BAIXA: 'Baixada'
    };
    if (item.custodia) return item.osNumero ? `Sob custódia (OS #${item.osNumero})` : 'Sob custódia';
    return rotulos[item.situacao] ?? item.situacao.replaceAll('_', ' ').toLocaleLowerCase('pt-BR');
  }

  ngOnInit() {
    if (this.central) this.carregarResumo();
  }
  ngOnDestroy() {
    this.buscaPn?.unsubscribe();
    this.consultaPlano?.unsubscribe();
    this.consultaResumo?.unsubscribe();
  }
  carregarResumo() {
    this.consultaResumo?.unsubscribe();
    this.carregandoResumo = true;
    this.erroResumo = '';
    this.consultaResumo = this.api.get<ResumoVinculoPn[]>('/plano-pn/vinculos').subscribe({
      next: resumo => {
        this.resumo = resumo;
        this.carregandoResumo = false;
      },
      error: err => {
        this.erroResumo = err.error?.message || 'Não foi possível carregar os vínculos.';
        this.carregandoResumo = false;
      }
    });
  }
  abrir(pn?: string, descricao?: string | null) {
    this.limparPn();
    this.termoFerramenta = '';
    this.aviso = '';
    this.aberto = true;
    if (pn) this.abrirPn(pn, descricao);
    else this.pesquisarPn('');
  }
  fechar() {
    if (!this.salvando) this.aberto = false;
  }
  limparPn() {
    this.buscaPn?.unsubscribe();
    this.consultaPlano?.unsubscribe();
    this.pn = '';
    this.descricaoPn = '';
    this.termoPn = '';
    this.sugestoes = [];
    this.buscando = false;
    this.carregando = false;
    this.erro = '';
    this.erroBusca = '';
    this.plano = undefined;
    this.vinculadas.clear();
    this.selecao.vinculadas.clear();
    this.selecao.acervo.clear();
    this.fimArraste();
  }
  pesquisarPn(termo: string) {
    this.termoPn = termo;
    this.buscaPn?.unsubscribe();
    this.erroBusca = '';
    this.sugestoes = [];
    this.buscando = true;
    this.buscaPn = timer(termo.trim() ? 220 : 0).pipe(switchMap(() =>
      this.api.get<SugestaoPn[]>(`/plano-pn/catalogo?q=${encodeURIComponent(termo.trim())}`)
    )).subscribe({
      next: sugestoes => { this.sugestoes = sugestoes; this.buscando = false; },
      error: err => {
        this.erroBusca = err.error?.message || 'Não foi possível buscar os PNs.';
        this.buscando = false;
      }
    });
  }
  confirmarBuscaPn() {
    if (!this.pnDigitado || this.buscando || this.erroBusca) return;
    const exato = this.sugestoes.find(s => s.pn === this.pnDigitado);
    const sugestao = exato ?? (this.sugestoes.length === 1 ? this.sugestoes[0] : undefined);
    if (sugestao) this.abrirPn(sugestao.pn, sugestao.descricao);
  }
  abrirPn(pn: string, descricao?: string | null) {
    this.limparPn();
    this.pn = pn.trim();
    if (!this.pn) return;
    this.descricaoPn = descricao?.trim() ?? '';
    this.carregando = true;
    this.consultaPlano = this.api.planoPn(this.pn).subscribe({
      next: plano => { this.aplicarPlano(plano); this.carregando = false; },
      error: err => {
        this.erro = err.error?.message || 'Não foi possível consultar o PN.';
        this.carregando = false;
      }
    });
    if (descricao === undefined) {
      const pnConsultado = this.pn.toUpperCase();
      this.consultaPlano.add(this.api.get<SugestaoPn[]>(`/plano-pn/catalogo?q=${encodeURIComponent(pnConsultado)}`).subscribe({
        next: sugestoes => {
          this.descricaoPn = sugestoes.find(s => s.pn === pnConsultado)?.descricao?.trim() ?? '';
        },
        error: () => { this.descricaoPn = ''; }
      }));
    }
  }
  descricaoFerramenta(ferramenta: Linha) {
    const descricao = ferramenta.descricao.trim();
    const codigo = ferramenta.codigo.trim();
    const inicioCodigo = descricao.length - codigo.length;
    if (codigo && descricao.slice(inicioCodigo).toUpperCase() === codigo.toUpperCase()
        && (inicioCodigo === 0 || /\s/.test(descricao[inicioCodigo - 1]))) {
      return descricao.slice(0, inicioCodigo).trimEnd();
    }
    return descricao;
  }
  detalhesFerramenta(ferramenta: Linha) {
    const serie = ferramenta.serie?.trim() ?? '';
    const serieDistinta = serie.toUpperCase() === ferramenta.codigo.trim().toUpperCase() ? '' : serie;
    return [ferramenta.modelo?.trim(), serieDistinta].filter(Boolean).join(' · ');
  }
  get podeMover() { return !!this.plano && !this.salvando; }
  get pnDigitado() { return this.termoPn.trim().toUpperCase(); }
  get jaSugerido() { return this.sugestoes.some(s => s.pn === this.pnDigitado); }
  get totalVinculadas() { return this.vinculadas.size; }
  selecionado(coluna: Coluna, id: number) { return this.selecao[coluna].has(id); }
  idsVisiveis(coluna: Coluna) {
    const linhas = coluna === 'acervo' ? this.linhasAcervo : this.linhasVinculadas;
    return linhas.map(f => f.id);
  }
  idsSelecionados(coluna: Coluna) {
    return this.idsVisiveis(coluna).filter(id => this.selecao[coluna].has(id));
  }
  selecionar(coluna: Coluna, id: number, marcado: boolean) {
    if (marcado) this.selecao[coluna].add(id);
    else this.selecao[coluna].delete(id);
  }
  buscarFerramenta(termo: string) {
    this.termoFerramenta = termo;
    this.selecao.acervo.clear();
  }
  selecionarTodos(coluna: Coluna, marcado: boolean) {
    for (const id of this.idsVisiveis(coluna)) this.selecionar(coluna, id, marcado);
  }
  mover(origem: Coluna, ids = this.idsSelecionados(origem)) {
    if (!this.podeMover) return;
    for (const id of ids) {
      if (origem === 'acervo') this.vinculadas.add(id);
      else this.vinculadas.delete(id);
      this.selecao[origem].delete(id);
    }
  }
  iniciarArraste(evento: DragEvent, origem: Coluna, id: number) {
    if (!this.podeMover || !evento.dataTransfer) { evento.preventDefault(); return; }
    const ids = this.selecionado(origem, id) ? this.idsSelecionados(origem) : [id];
    this.arraste = { origem, ids };
    evento.dataTransfer.setData('text/plain', String(id));
    evento.dataTransfer.effectAllowed = 'move';
  }
  permitirArraste(evento: DragEvent, destino: Coluna) {
    if (!this.podeMover || !this.arraste || this.arraste.origem === destino) return;
    evento.preventDefault();
    if (evento.dataTransfer) evento.dataTransfer.dropEffect = 'move';
    this.destinoArraste = destino;
  }
  soltar(evento: DragEvent, destino: Coluna) {
    const arraste = this.arraste;
    if (arraste && arraste.origem !== destino) {
      evento.preventDefault();
      this.mover(arraste.origem, arraste.ids);
    }
    this.fimArraste();
  }
  fimArraste() {
    this.arraste = undefined;
    this.destinoArraste = undefined;
  }
  async salvar() {
    if (!this.plano || !this.alterado || this.salvando) return;
    const originais = new Set(this.plano.ferramentas.map(f => f.id));
    this.salvando = true;
    this.erro = '';
    try {
      const plano = await firstValueFrom(this.api.put<PlanoPn>('/plano-pn/vinculos', {
        pn: this.plano.pn,
        adicionar: [...this.vinculadas].filter(id => !originais.has(id)),
        remover: [...originais].filter(id => !this.vinculadas.has(id))
      }));
      this.aplicarPlano(plano);
      this.aviso = `Vínculos de ${plano.pn} salvos.`;
      this.aberto = false;
      if (this.central) this.carregarResumo();
    } catch (err: any) {
      this.erro = err.error?.message || 'Não foi possível salvar os vínculos.';
    } finally {
      this.salvando = false;
    }
  }
  private aplicarPlano(plano: PlanoPn) {
    this.plano = plano;
    this.pn = plano.pn;
    this.vinculadas = new Set(plano.ferramentas.map(f => f.id));
    this.selecao.acervo.clear();
    this.selecao.vinculadas.clear();
  }
  private normalizar(valor: string) {
    return valor.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR').trim();
  }
  private combina(campos: (string | undefined)[], termo: string) {
    const busca = this.normalizar(termo);
    if (!busca) return true;
    const valores = campos.filter((campo): campo is string => !!campo).map(campo => this.normalizar(campo));
    const compacto = (valor: string) => valor.replace(/[^\p{L}\p{N}]/gu, '');
    const chave = compacto(busca);
    return busca.split(/\s+/).every(palavra => valores.some(valor => valor.includes(palavra)))
      || !!chave && valores.some(valor => compacto(valor).includes(chave));
  }
}
