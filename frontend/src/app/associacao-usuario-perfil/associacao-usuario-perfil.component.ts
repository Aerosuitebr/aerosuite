import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SidebarModule } from 'primeng/sidebar';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { passesPermissaoRota } from '../auth/permissao.util';
import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { Perfil, PerfilService } from '../core/perfil.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { UsuarioPerfis, UsuarioService, VinculoUsuarioPerfil } from '../core/usuarios.service';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';

type StatusPerfis = 'ativo' | 'sem-perfis' | 'inativa';

@Component({
  selector: 'app-associacao-usuario-perfil',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, DropdownModule, InputSwitchModule, InputTextModule,
    MultiSelectModule, SidebarModule, TableModule, ToastModule, TooltipModule, TranslatePipe,
    ListDataStatesComponent, PageHeroComponent
  ],
  templateUrl: './associacao-usuario-perfil.component.html',
  styleUrls: ['./associacao-usuario-perfil.component.scss'],
  providers: [MessageService]
})
export class AssociacaoUsuarioPerfilComponent implements OnInit {
  private readonly usuariosApi = inject(UsuarioService);
  private readonly perfisApi = inject(PerfilService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(TranslationService);

  readonly key = 'associacao.usuarioPerfil.';
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;
  readonly pageSizes = LIST_ROWS_PER_PAGE_OPTIONS;
  readonly cores = ['azul', 'verde', 'violeta', 'ambar'];

  usuarios: UsuarioPerfis[] = [];
  linhas: UsuarioPerfis[] = [];
  perfis: Perfil[] = [];
  filtroPerfis: { perfilId: number; nome: string }[] = [];
  busca = '';
  perfilFiltro: number | null = null;
  statusFiltro: StatusPerfis | null = null;
  primeiraLinha = 0;
  loading = true;
  erroLista = false;
  salvando = false;
  erroEdicao = '';
  gavetaAberta = false;
  selecionado: UsuarioPerfis | null = null;
  rascunho: VinculoUsuarioPerfil[] = [];
  novosIds: number[] = [];
  removerId: number | null = null;

  get podeEditar(): boolean {
    return passesPermissaoRota(this.auth.getCurrentUser(), { funcionalidadesAny: ['GERENCIAR_PERMISSOES'] });
  }

  get disponiveis(): Perfil[] {
    const vinculados = new Set(this.rascunho.map(v => v.perfilId));
    return this.perfis.filter(perfil => !vinculados.has(perfil.id));
  }

  get ativos(): number {
    return this.rascunho.filter(v => v.ativo && v.perfilAtivo).length;
  }

  get alterado(): boolean {
    const original = this.selecionado?.perfis ?? [];
    if (original.length !== this.rascunho.length) return true;
    const estados = new Map(original.map(v => [v.perfilId, v.ativo]));
    return this.rascunho.some(v => estados.get(v.perfilId) !== v.ativo);
  }

  ngOnInit(): void {
    this.carregar();
    if (this.podeEditar) {
      this.perfisApi.listarTodos().subscribe({
        next: perfis => { this.perfis = perfis.filter(p => p.ativo); this.atualizarFiltroPerfis(); },
        error: () => this.aviso('matrix.profilesError', 'error')
      });
    }
  }

  carregar(): void {
    this.loading = true;
    this.erroLista = false;
    this.usuariosApi.listarVinculosDePerfis().pipe(finalize(() => this.loading = false)).subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        this.atualizarFiltroPerfis();
        this.filtrar();
      },
      error: () => { this.erroLista = true; }
    });
  }

  private atualizarFiltroPerfis(): void {
    const nomes = new Map(this.perfis.map(p => [p.id, p.nome]));
    for (const usuario of this.usuarios) {
      for (const perfil of usuario.perfis) nomes.set(perfil.perfilId, perfil.nome);
    }
    this.filtroPerfis = [...nomes].map(([perfilId, nome]) => ({ perfilId, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, this.i18n.getCurrentLanguage()));
  }

  filtrar(): void {
    const termo = this.normalizar(this.busca.trim());
    this.linhas = this.usuarios.filter(usuario =>
      (!termo || this.normalizar([usuario.nome, usuario.email, ...usuario.perfis.map(v => v.nome)].join(' ')).includes(termo))
      && (this.perfilFiltro === null || usuario.perfis.some(v => v.perfilId === this.perfilFiltro))
      && (this.statusFiltro === null || this.status(usuario) === this.statusFiltro)
    );
    this.primeiraLinha = 0;
  }

  status(usuario: UsuarioPerfis): StatusPerfis {
    if (!usuario.ativo) return 'inativa';
    return usuario.perfis.some(v => v.ativo && v.perfilAtivo) ? 'ativo' : 'sem-perfis';
  }

  iniciais(nome: string): string {
    return nome?.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toUpperCase() || '—';
  }

  excedentes(usuario: UsuarioPerfis): string {
    return usuario.perfis.slice(3).map(v => v.nome + (v.ativo && v.perfilAtivo ? '' : ' · ' +
      this.i18n.translate(this.key + 'matrix.paused'))).join(', ');
  }

  abrir(usuario?: UsuarioPerfis): void {
    this.selecionado = null;
    this.rascunho = [];
    this.erroEdicao = '';
    this.novosIds = [];
    this.removerId = null;
    if (usuario) this.selecionar(usuario);
    this.gavetaAberta = true;
  }

  selecionar(usuario: UsuarioPerfis): void {
    this.selecionado = usuario;
    this.rascunho = usuario.perfis.map(perfil => ({ ...perfil }));
  }

  novoVinculo(perfilId: number): boolean {
    return !this.selecionado?.perfis.some(v => v.perfilId === perfilId);
  }

  adicionar(ids: number[] | null): void {
    for (const perfil of this.disponiveis) {
      if (ids?.includes(perfil.id)) {
        this.rascunho.push({
          perfilId: perfil.id, nome: perfil.nome, descricao: perfil.descricao, ativo: true, perfilAtivo: true
        });
      }
    }
    this.novosIds = [];
    this.erroEdicao = '';
  }

  remover(perfilId: number): void {
    this.rascunho = this.rascunho.filter(v => v.perfilId !== perfilId);
    this.removerId = null;
  }

  salvar(): void {
    if (!this.selecionado || !this.podeEditar || !this.alterado || this.salvando) return;
    const { id, revisao } = this.selecionado;
    this.salvando = true;
    this.erroEdicao = '';
    const perfis = this.rascunho.map(({ perfilId, ativo }) => ({ perfilId, ativo }));
    this.usuariosApi.salvarVinculosDePerfis(id, revisao, perfis).pipe(finalize(() => this.salvando = false)).subscribe({
      next: usuario => {
        this.usuarios = this.usuarios.map(item => item.id === usuario.id ? usuario : item);
        this.atualizarFiltroPerfis();
        this.filtrar();
        this.gavetaAberta = false;
        this.aviso('matrix.saved', 'success');
        if (id === this.auth.getCurrentUser()?.id && !this.auth.hasTenantSupportSession()) this.auth.logout();
      },
      error: error => {
        this.erroEdicao = error.status === 409 ? 'matrix.conflict' : 'matrix.saveError';
        if (error.status === 409) this.carregar();
      }
    });
  }

  private aviso(key: string, severity: 'success' | 'error'): void {
    this.messages.add({ severity, summary: this.i18n.translate(this.key + key) });
  }

  private normalizar(valor: string): string {
    return valor.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();
  }
}
