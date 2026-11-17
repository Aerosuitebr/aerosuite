import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, firstValueFrom, timer } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { FerramentasService, ItemFerramenta } from './ferramentas.service';
import { podeAcessarFerramentaria } from './ferramentas-acesso';
import { OsFluxoPermissaoService } from '../os/fluxo/os-fluxo-permissao.service';

@Component({
  selector: 'app-minhas-ferramentas', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './minhas-ferramentas.component.html',
  styleUrls: ['./minhas-ferramentas.component.scss']
})
export class MinhasFerramentasComponent implements OnInit, OnDestroy {
  private readonly api = inject(FerramentasService);
  private readonly auth = inject(AuthService);
  private readonly funcoes = inject(OsFluxoPermissaoService);
  private readonly subs = new Subscription();
  itens: ItemFerramenta[] = [];
  busca = ''; filtro = 'TODOS'; carregando = false; erro = ''; sincronizado?: Date;
  operador = false;
  readonly nome = this.auth.getCurrentUser()?.nome;
  get atrasadas() { return this.itens.filter(i => i.atrasada).length; }
  get recolher() { return this.itens.filter(i => i.recolher || !!i.restricao).length; }
  get filtrados() {
    const q = this.busca.trim().toLocaleLowerCase('pt-BR');
    return this.itens.filter(i =>
      (!q || [i.ferramenta.codigo, i.ferramenta.descricao, i.ferramenta.serie, i.osNumero].some(v => v?.toLocaleLowerCase('pt-BR').includes(q))) &&
      (this.filtro === 'TODOS' || (this.filtro === 'ATRASADAS' && i.atrasada) ||
        (this.filtro === 'RECOLHER' && (i.recolher || !!i.restricao))));
  }
  ngOnInit() {
    this.subs.add(this.funcoes.ensureLoaded().subscribe(codes => { this.operador = podeAcessarFerramentaria(this.auth.getCurrentUser(), codes); }));
    this.carregar();
    this.subs.add(timer(30000, 30000).subscribe(() => this.carregar()));
  }
  ngOnDestroy() { this.subs.unsubscribe(); }
  async carregar() {
    if (this.carregando || !this.auth.isAuthenticated()) return;
    this.carregando = true;
    try {
      this.itens = await firstValueFrom(this.api.get<ItemFerramenta[]>('/minhas'));
      this.sincronizado = new Date(); this.erro = '';
    } catch { this.erro = 'Não foi possível atualizar suas ferramentas. Tente novamente. Os dados anteriores podem estar desatualizados.'; }
    finally { this.carregando = false; }
  }
}
