import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ListboxModule } from 'primeng/listbox';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { UsuarioService } from '../core/usuarios.service';
import { FuncionalidadeService } from '../core/funcionalidade.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';

interface UsuarioLocal {
  id: number;
  nome: string;
  email: string;
  perfilAtual?: string;
  perfilId?: number;
}

interface FuncionalidadeLocal {
  id: number;
  nome: string;
  descricao: string;
  secao: string;
  icone: string;
  ativo: boolean;
  visivel: boolean;
  posicao: number;
  codigo?: string;
}

@Component({
  selector: 'app-consulta-funcionalidades-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ListboxModule,
    InputTextModule,
    TagModule,
    FormsModule,
    ToastModule,
    TranslatePipe,
    PageHeroComponent
  ],
  template: `
    <p-toast></p-toast>
    
    <div class="as-page consulta-container">
      <app-page-hero
        variant="navy"
        titleKey="consultaUsuarioFunc.title"
        subtitleKey="consultaUsuarioFunc.subtitle"
        titleIcon="pi-search"
        [hasActions]="false">
      </app-page-hero>

      <!-- Área Principal -->
      <div class="main-content">
        <!-- Lista de Usuários -->
        <div class="usuarios-section">
          <div class="section-header">
            <h3>{{ 'consultaUsuarioFunc.secUsuarios' | translate }}</h3>
            <div class="search-box">
              <input 
                pInputText 
                [(ngModel)]="filtroUsuario"
                (ngModelChange)="filtrarUsuarios()"
                [placeholder]="'consultaUsuarioFunc.searchPh' | translate"
                class="search-input">
            </div>
          </div>
          
          <div class="usuarios-list">
            <p-listbox 
              [options]="usuariosFiltrados" 
              [(ngModel)]="usuarioSelecionado"
              optionLabel="nome"
              [filter]="false"
              [style]="{'width': '100%', 'height': '500px'}"
              (onChange)="carregarFuncionalidadesUsuario()">
              
              <ng-template let-usuario pTemplate="item">
                <div class="usuario-item">
                  <div class="usuario-avatar">
                    <i class="pi pi-user"></i>
                  </div>
                  <div class="usuario-info">
                    <div class="usuario-nome">{{ usuario.nome }}</div>
                    <div class="usuario-email">{{ usuario.email }}</div>
                    <div class="usuario-perfil">
                      <p-tag 
                        [value]="perfilLabel(usuario)" 
                        [severity]="usuario.perfilAtual ? 'success' : 'warning'">
                      </p-tag>
                    </div>
                  </div>
                </div>
              </ng-template>
            </p-listbox>
          </div>
        </div>

        <!-- Funcionalidades do Usuário -->
        <div class="funcionalidades-section">
          <div class="section-header">
            <h3>{{ 'consultaUsuarioFunc.secFuncoes' | translate }}</h3>
            <div class="funcionalidades-stats" *ngIf="usuarioSelecionado">
              <span class="func-count-chip">{{ funcionalidadesCountLabel }}</span>
            </div>
          </div>

          <div class="funcionalidades-content" *ngIf="usuarioSelecionado; else noUserSelected">
            <!-- Informações do Usuário Selecionado -->
            <div class="usuario-selecionado-info">
              <div class="usuario-card">
                <div class="usuario-avatar-large">
                  <i class="pi pi-user"></i>
                </div>
                <div class="usuario-details">
                  <h4>{{ usuarioSelecionado.nome }}</h4>
                  <p>{{ usuarioSelecionado.email }}</p>
                  <p-tag 
                    [value]="perfilLabel(usuarioSelecionado!)" 
                    [severity]="usuarioSelecionado.perfilAtual ? 'success' : 'warning'">
                  </p-tag>
                </div>
              </div>
            </div>

            <!-- Lista de Funcionalidades -->
            <div class="funcionalidades-list">
              <div class="funcionalidade-item" *ngFor="let funcionalidade of funcionalidadesUsuario">
                <div class="funcionalidade-icon">
                  <i [class]="funcionalidade.icone || 'pi pi-circle'"></i>
                </div>
                <div class="funcionalidade-info">
                  <div class="funcionalidade-nome">{{ nomeFunc(funcionalidade) }}</div>
                  <div class="funcionalidade-descricao">{{ funcionalidade.descricao }}</div>
                  <div class="funcionalidade-secao">
                    <p-tag 
                      [value]="secaoLabel(funcionalidade.secao)" 
                      severity="info" 
                      styleClass="secao-tag">
                    </p-tag>
                  </div>
                </div>
                <div class="funcionalidade-status">
                  <p-tag 
                    [value]="funcionalidade.ativo ? ('consultaUsuarioFunc.funcAtivo' | translate) : ('consultaUsuarioFunc.funcInativo' | translate)" 
                    [severity]="funcionalidade.ativo ? 'success' : 'danger'">
                  </p-tag>
                </div>
              </div>
            </div>

            <!-- Mensagem quando não há funcionalidades -->
            <div class="empty-funcionalidades" *ngIf="funcionalidadesUsuario.length === 0">
              <i class="pi pi-info-circle"></i>
              <p>{{ 'consultaUsuarioFunc.emptyFuncs' | translate }}</p>
            </div>
          </div>

          <ng-template #noUserSelected>
            <div class="no-selection">
              <i class="pi pi-user-plus"></i>
              <h4>{{ 'consultaUsuarioFunc.pickUserTit' | translate }}</h4>
              <p>{{ 'consultaUsuarioFunc.pickUserSub' | translate }}</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Resumo -->
      <div class="resumo-section" *ngIf="usuarioSelecionado && funcionalidadesUsuario.length > 0">
        <div class="resumo-card">
          <h3>{{ 'consultaUsuarioFunc.resumo' | translate }}</h3>
          <div class="resumo-stats">
            <div class="stat-item">
              <div class="stat-number">{{ funcionalidadesUsuario.length }}</div>
              <div class="stat-label">{{ 'consultaUsuarioFunc.statTotalFuncs' | translate }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ getFuncionalidadesAtivas() }}</div>
              <div class="stat-label">{{ 'consultaUsuarioFunc.statFuncsAtivas' | translate }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ getSecoesUnicas() }}</div>
              <div class="stat-label">{{ 'consultaUsuarioFunc.statSecoes' | translate }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./consulta-funcionalidades-usuario.component.scss']
})
export class ConsultaFuncionalidadesUsuarioComponent implements OnInit {
  usuarios: UsuarioLocal[] = [];
  usuariosFiltrados: UsuarioLocal[] = [];
  usuarioSelecionado: UsuarioLocal | null = null;
  funcionalidadesUsuario: FuncionalidadeLocal[] = [];
  filtroUsuario = '';
  loading = true;

  constructor(
    private usuarioService: UsuarioService,
    private funcionalidadeService: FuncionalidadeService,
    private messageService: MessageService,
    private i18n: TranslationService
  ) {}

  ngOnInit() {
    this.carregarUsuarios();
  }

  carregarUsuarios() {
    this.loading = true;
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
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'consultaUsuarioFunc.toast.erroUsuario');
      }
    });
  }

  carregarFuncionalidadesUsuario() {
    if (!this.usuarioSelecionado) {
      this.funcionalidadesUsuario = [];
      return;
    }

    this.loading = true;
    this.funcionalidadeService.listarPorUsuario(this.usuarioSelecionado.id).subscribe({
      next: (funcionalidades) => {
        this.funcionalidadesUsuario = funcionalidades.map(func => ({
          id: func.id,
          nome: func.nome,
          codigo: func.codigo,
          descricao: func.descricao || '',
          secao: func.secao,
          icone: func.icone || 'pi pi-circle',
          ativo: func.ativo,
          visivel: func.visivel,
          posicao: func.posicao || 0
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load permissions:', error);
        this.loading = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'consultaUsuarioFunc.toast.erroFuncs');
      }
    });
  }

  getFuncionalidadesAtivas(): number {
    return this.funcionalidadesUsuario.filter(func => func.ativo).length;
  }

  getSecoesUnicas(): number {
    const secoes = new Set(this.funcionalidadesUsuario.map(func => func.secao));
    return secoes.size;
  }

  filtrarUsuarios() {
    if (!this.filtroUsuario) {
      this.usuariosFiltrados = [...this.usuarios];
    } else {
      const filtro = this.filtroUsuario.toLowerCase();
      this.usuariosFiltrados = this.usuarios.filter(usuario =>
        usuario.nome.toLowerCase().includes(filtro) ||
        usuario.email.toLowerCase().includes(filtro)
      );
    }
  }

  perfilLabel(u: UsuarioLocal): string {
    if (!u.perfilAtual?.trim()) {
      return this.i18n.translate('consultaUsuarioFunc.semPerfil');
    }
    return this.i18n.translatePerfil(undefined, u.perfilAtual);
  }

  get funcionalidadesCountLabel(): string {
    return this.i18n.translate('consultaUsuarioFunc.countFeat', {
      count: String(this.funcionalidadesUsuario.length)
    });
  }

  nomeFunc(f: FuncionalidadeLocal): string {
    return this.i18n.translateMenuFunc(f.codigo || '', f.nome);
  }

  secaoLabel(secao: string): string {
    return this.i18n.translateMenuSecao(secao);
  }
}
