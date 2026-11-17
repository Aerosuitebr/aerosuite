import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Subscription, firstValueFrom, switchMap, timer } from 'rxjs';
import { Ferramenta, FerramentasService, ItemFerramenta, PlanoPn, ResumoVinculoPn, SugestaoPn } from './ferramentas.service';

type Coluna = 'vinculadas' | 'acervo';
type Linha = Pick<Ferramenta, 'id' | 'codigo' | 'descricao'> & Partial<Ferramenta>;

@Component({
  selector: 'app-vinculos-ferramentas-pn',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DialogModule],
  templateUrl: './vinculos-ferramentas-pn.component.html',
  styleUrl: './vinculos-ferramentas-pn.component.scss'
})
export class VinculosFerramentasPnComponent implements OnInit, OnDestroy {
  @Input() itens: ItemFerramenta[] = [];
  @Input() central = false;
  @Input() podeEditar = true;
  private readonly api = inject(FerramentasService);
  private buscaPn?: Subscription;
  private consultaPlano?: Subscription;
  private consultaResumo?: Subscription;
  aberto = false;
  pn = '';
  termoPn = '';
  termoFerramenta = '';
  termoCentral = '';
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
    return this.resumo.filter(r => this.combina([r.pn, ...r.ferramentas.flatMap(f => [f.codigo, f.descricao])], this.termoCentral));
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
      next: resumo => { this.resumo = resumo; this.carregandoResumo = false; },
      error: err => {
        this.erroResumo = err.error?.message || 'Não foi possível carregar os vínculos.';
        this.carregandoResumo = false;
      }
    });
  }
  abrir(pn?: string) {
    this.limparPn();
    this.termoFerramenta = '';
    this.aviso = '';
    this.aberto = true;
    if (pn) this.abrirPn(pn);
  }
  fechar() {
    if (!this.salvando) this.aberto = false;
  }
  limparPn() {
    this.buscaPn?.unsubscribe();
    this.consultaPlano?.unsubscribe();
    this.pn = '';
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
    this.buscando = !!termo.trim();
    if (!this.buscando) return;
    this.buscaPn = timer(220).pipe(switchMap(() =>
      this.api.get<SugestaoPn[]>(`/plano-pn/catalogo?q=${encodeURIComponent(termo.trim())}`)
    )).subscribe({
      next: sugestoes => { this.sugestoes = sugestoes; this.buscando = false; },
      error: err => {
        this.erroBusca = err.error?.message || 'Não foi possível buscar os PNs.';
        this.buscando = false;
      }
    });
  }
  abrirPn(pn: string) {
    this.limparPn();
    this.pn = pn.trim();
    if (!this.pn) return;
    this.carregando = true;
    this.consultaPlano = this.api.planoPn(this.pn).subscribe({
      next: plano => { this.aplicarPlano(plano); this.carregando = false; },
      error: err => {
        this.erro = err.error?.message || 'Não foi possível consultar o PN.';
        this.carregando = false;
      }
    });
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
