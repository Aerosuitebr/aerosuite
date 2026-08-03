import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { UsuarioService } from '../core/usuarios.service';
import { PerfilService } from '../core/perfil.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { toastKey } from '../core/toast-i18n.util';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';

interface UsuarioLocal {
  id: number;
  nome: string;
  email: string;
  perfilAtual?: string;
  perfilId?: number;
}

interface PerfilLocal {
  id: number;
  nome: string;
  descricao: string;
  codigo: string;
}

@Component({
  selector: 'app-associacao-usuario-perfil',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule,
    ButtonModule,
    CardModule,
    TableModule,
    DropdownModule,
    InputTextModule,
    CheckboxModule,
    DialogModule,
    FormsModule,
    ToastModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  template: `
    <p-toast></p-toast>
    
    <div class="as-page associacao-container">
      <app-page-hero
        variant="navy"
        titleKey="associacao.usuarioPerfil.title"
        subtitleKey="associacao.usuarioPerfil.subtitle"
        titleIcon="pi-users"
        [hasActions]="true">
        <button
          actions
          pButton
          type="button"
          [label]="'associacao.usuarioPerfil.btn.new' | translate"
          icon="pi pi-plus"
          class="p-button-primary"
          (click)="abrirDialogNovaAssociacao()">
        </button>
      </app-page-hero>

      <!-- Filtros -->
      <div class="filters-section">
        <div class="filter-card">
          <div class="filter-row">
            <div class="filter-item">
              <label for="buscaUsuario">{{ 'associacao.usuarioPerfil.filter.user' | translate }}</label>
              <input 
                pInputText 
                id="buscaUsuario"
                [(ngModel)]="filtros.buscaUsuario"
                [placeholder]="'associacao.usuarioPerfil.filter.userPh' | translate"
                class="w-full">
            </div>
            <div class="filter-item">
              <label for="filtroPerfil">{{ 'associacao.usuarioPerfil.filter.profile' | translate }}</label>
              <p-dropdown 
                id="filtroPerfil"
                [options]="perfis"
                [(ngModel)]="filtros.perfilId"
                [placeholder]="'associacao.usuarioPerfil.filter.allProfiles' | translate"
                optionLabel="nome"
                optionValue="id"
                [showClear]="true"
                class="w-full">
              </p-dropdown>
            </div>
            <div class="filter-item">
              <button 
                pButton 
                type="button" 
                [label]="'associacao.usuarioPerfil.filter.apply' | translate" 
                icon="pi pi-filter" 
                class="p-button-outlined"
                (click)="aplicarFiltros()">
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabela de Usuários -->
      <div class="table-section">
        <div class="table-card">
          <h3>{{ 'associacao.usuarioPerfil.table.title' | translate }}</h3>
          <app-list-data-states
            [loading]="loading"
            [itemCount]="usuariosFiltrados.length"
            [skeletonRows]="8"
            [skeletonCols]="5"
            emptyTitleKey="associacao.usuarioPerfil.empty"
            emptyDescriptionKey="ui.empty.description">
          <p-table appListScroll
            [value]="usuariosFiltrados" 
            [paginator]="true" 
            [rows]="listPageSize" 
            [loading]="loading"
            styleClass="modern-table">
            
            <ng-template pTemplate="header">
              <tr>
                <th>{{ 'associacao.usuarioPerfil.col.user' | translate }}</th>
                <th>{{ 'associacao.usuarioPerfil.col.email' | translate }}</th>
                <th>{{ 'associacao.usuarioPerfil.col.profile' | translate }}</th>
                <th>{{ 'associacao.usuarioPerfil.col.status' | translate }}</th>
                <th style="width: 200px;">{{ 'associacao.usuarioPerfil.col.actions' | translate }}</th>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="body" let-usuario>
              <tr>
                <td>
                  <div class="user-info">
                    <div class="user-avatar">
                      <i class="pi pi-user"></i>
                    </div>
                    <div class="user-details">
                      <strong>{{ usuario.nome }}</strong>
                    </div>
                  </div>
                </td>
                <td>{{ usuario.email }}</td>
                <td>
                  <span class="perfil-badge" [class]="'perfil-' + (usuario.perfilId || 'sem-perfil')">
                    {{ usuarioPerfilDisplay(usuario) }}
                  </span>
                </td>
                <td>
                  <span class="status-badge status-ativo">
                    <i class="pi pi-check-circle"></i>
                    {{ 'associacao.usuarioPerfil.status.active' | translate }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button 
                      pButton 
                      type="button" 
                      icon="pi pi-pencil" 
                      class="p-button-text p-button-sm"
                      [pTooltip]="'associacao.usuarioPerfil.tooltip.edit' | translate"
                      (click)="editarAssociacao(usuario)">
                    </button>
                    <button 
                      pButton 
                      type="button" 
                      icon="pi pi-trash" 
                      class="p-button-text p-button-sm p-button-danger"
                      [pTooltip]="'associacao.usuarioPerfil.tooltip.remove' | translate"
                      (click)="removerAssociacao(usuario)">
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="text-center">
                  <div class="empty-state">
                    <i class="pi pi-users" style="font-size: 3rem; color: #9ca3af;"></i>
                    <p>{{ 'associacao.usuarioPerfil.empty' | translate }}</p>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
          </app-list-data-states>
        </div>
      </div>
    </div>

    <!-- Dialog Nova Associação -->
    <p-dialog 
      styleClass="as-hero-dialog" [header]="'associacao.usuarioPerfil.dialog.new' | translate" 
      [(visible)]="dialogNovaAssociacao"
      [modal]="true" 
      [style]="{width: '500px'}"
      [closable]="true">
      
      <div class="dialog-content">
        <div class="form-group">
          <label for="usuarioSelecionado">{{ 'associacao.usuarioPerfil.dialog.user' | translate }}</label>
          <p-dropdown 
            id="usuarioSelecionado"
            [options]="usuarios"
            [(ngModel)]="novaAssociacao.usuarioId"
            [placeholder]="'associacao.usuarioPerfil.dialog.userPh' | translate"
            optionLabel="nome"
            optionValue="id"
            class="w-full">
          </p-dropdown>
        </div>
        
        <div class="form-group">
          <label for="perfilSelecionado">{{ 'associacao.usuarioPerfil.dialog.profile' | translate }}</label>
          <p-dropdown 
            id="perfilSelecionado"
            [options]="perfis"
            [(ngModel)]="novaAssociacao.perfilId"
            [placeholder]="'associacao.usuarioPerfil.dialog.profilePh' | translate"
            optionLabel="nome"
            optionValue="id"
            class="w-full">
          </p-dropdown>
        </div>
      </div>
      
      <ng-template pTemplate="footer">
        <button 
          pButton 
          type="button" 
          [label]="'common.actions.cancel' | translate"
          icon="pi pi-times" 
          class="p-button-outlined"
          (click)="fecharDialogNovaAssociacao()">
        </button>
        <button 
          pButton 
          type="button" 
          [label]="'common.actions.save' | translate"
          icon="pi pi-check" 
          class="p-button-primary"
          (click)="salvarNovaAssociacao()"
          [disabled]="!novaAssociacao.usuarioId || !novaAssociacao.perfilId">
        </button>
      </ng-template>
    </p-dialog>

    <!-- Dialog Editar Associação -->
    <p-dialog 
      styleClass="as-hero-dialog" [header]="'associacao.usuarioPerfil.dialog.editTitle' | translate"
      [(visible)]="dialogEditarAssociacao"
      [modal]="true" 
      [style]="{width: '500px'}"
      [closable]="true">
      
      <div class="dialog-content">
        <div class="form-group">
          <label>{{ 'associacao.usuarioPerfil.dialog.usuarioLbl' | translate }}</label>
          <p>{{ usuarioSelecionado?.nome }} ({{ usuarioSelecionado?.email }})</p>
        </div>
        
        <div class="form-group">
          <label for="novoPerfil">{{ 'associacao.usuarioPerfil.dialog.novoPerfil' | translate }}</label>
          <p-dropdown 
            id="novoPerfil"
            [options]="perfis"
            [(ngModel)]="edicaoAssociacao.perfilId"
            [placeholder]="'associacao.usuarioPerfil.dialog.novoPerfilPh' | translate"
            optionLabel="nome"
            optionValue="id"
            class="w-full">
          </p-dropdown>
        </div>
      </div>
      
      <ng-template pTemplate="footer">
        <button 
          pButton 
          type="button" 
          [label]="'common.actions.cancel' | translate"
          icon="pi pi-times" 
          class="p-button-outlined"
          (click)="fecharDialogEditarAssociacao()">
        </button>
        <button 
          pButton 
          type="button" 
          [label]="'common.actions.save' | translate"
          icon="pi pi-check" 
          class="p-button-primary"
          (click)="salvarEdicaoAssociacao()"
          [disabled]="!edicaoAssociacao.perfilId">
        </button>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['./associacao-usuario-perfil.component.scss']
})
export class AssociacaoUsuarioPerfilComponent implements OnInit {
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;

  usuarios: UsuarioLocal[] = [];
  usuariosFiltrados: UsuarioLocal[] = [];
  perfis: PerfilLocal[] = [];
  loading = true;

  filtros = {
    buscaUsuario: '',
    perfilId: null
  };

  dialogNovaAssociacao = false;
  dialogEditarAssociacao = false;

  novaAssociacao = {
    usuarioId: null,
    perfilId: null
  };

  usuarioSelecionado: UsuarioLocal | null = null;
  edicaoAssociacao = {
    perfilId: null as number | null
  };

  constructor(
    private usuarioService: UsuarioService,
    private perfilService: PerfilService,
    private messageService: MessageService,
    private i18n: TranslationService
  ) {}

  usuarioPerfilDisplay(usuario: UsuarioLocal): string {
    if (!usuario.perfilAtual?.trim()) {
      return this.i18n.translate('associacao.usuarioPerfil.noProfile');
    }
    const perfil = this.perfis.find((p) => p.id === usuario.perfilId);
    return this.i18n.translatePerfil(perfil?.codigo, usuario.perfilAtual);
  }

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.loading = true;
    
    // Carregar usuários
    this.usuarioService.list().subscribe({
      next: (response) => {
        this.usuarios = (response.items || []).map(usuario => ({
          id: usuario.id || 0,
          nome: usuario.nome || '',
          email: usuario.email || '',
          perfilAtual: usuario.perfil?.nome,
          perfilId: usuario.perfil?.id
        }));
        this.usuariosFiltrados = [...this.usuarios];
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.loading = false;
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'associacao.usuarioPerfil.toast.loadUsersError');
      }
    });

    // Carregar perfis
    this.perfilService.listarTodos().subscribe({
      next: (perfis) => {
        this.perfis = perfis.map(perfil => ({
          id: perfil.id,
          nome: perfil.nome,
          descricao: perfil.descricao || '',
          codigo: perfil.codigo
        }));
      },
      error: (error) => {
        console.error('Failed to load profiles:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'associacao.usuarioPerfil.toast.loadProfilesError');
      }
    });
  }

  aplicarFiltros() {
    let usuariosFiltrados = [...this.usuarios];

    if (this.filtros.buscaUsuario) {
      const busca = this.filtros.buscaUsuario.toLowerCase();
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.nome.toLowerCase().includes(busca) ||
        usuario.email.toLowerCase().includes(busca)
      );
    }

    if (this.filtros.perfilId) {
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.perfilId === this.filtros.perfilId
      );
    }

    this.usuariosFiltrados = usuariosFiltrados;
  }

  abrirDialogNovaAssociacao() {
    this.novaAssociacao = { usuarioId: null, perfilId: null };
    this.dialogNovaAssociacao = true;
  }

  fecharDialogNovaAssociacao() {
    this.dialogNovaAssociacao = false;
  }

  salvarNovaAssociacao() {
    if (!this.novaAssociacao.usuarioId || !this.novaAssociacao.perfilId) {
      toastKey(
        this.messageService,
        this.i18n,
        'warn',
        'associacao.usuarioPerfil.toast.requiredFieldsSummary',
        'associacao.usuarioPerfil.toast.requiredFieldsDetail'
      );
      return;
    }

    // Simular salvamento
    toastKey(
      this.messageService,
      this.i18n,
      'success',
      'associacao.usuarioPerfil.toast.createSuccessSummary',
      'associacao.usuarioPerfil.toast.createSuccessDetail'
    );

    this.fecharDialogNovaAssociacao();
    this.carregarDados();
  }

  editarAssociacao(usuario: UsuarioLocal) {
    this.usuarioSelecionado = usuario;
    this.edicaoAssociacao.perfilId = usuario.perfilId || null;
    this.dialogEditarAssociacao = true;
  }

  fecharDialogEditarAssociacao() {
    this.dialogEditarAssociacao = false;
    this.usuarioSelecionado = null;
  }

  salvarEdicaoAssociacao() {
    if (!this.edicaoAssociacao.perfilId) {
      toastKey(
        this.messageService,
        this.i18n,
        'warn',
        'associacao.usuarioPerfil.toast.profileRequiredSummary',
        'associacao.usuarioPerfil.toast.profileRequiredDetail'
      );
      return;
    }

    // Simular atualização
    toastKey(
      this.messageService,
      this.i18n,
      'success',
      'associacao.usuarioPerfil.toast.updateSuccessSummary',
      'associacao.usuarioPerfil.toast.updateSuccessDetail'
    );

    this.fecharDialogEditarAssociacao();
    this.carregarDados();
  }

  removerAssociacao(usuario: UsuarioLocal) {
    toastKey(
      this.messageService,
      this.i18n,
      'success',
      'associacao.usuarioPerfil.toast.removeSuccessSummary',
      'associacao.usuarioPerfil.toast.removeSuccessDetail',
      { name: usuario.nome }
    );

    this.carregarDados();
  }
}
