import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ListboxModule } from 'primeng/listbox';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FuncionalidadeService, Funcionalidade } from '../core/funcionalidade.service';
import { PerfilService, Perfil } from '../core/perfil.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { toastKey } from '../core/toast-i18n.util';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { repairDisplayText } from '../core/display-text.util';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-controle-acesso',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ListboxModule,
    CheckboxModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    ToastModule,
    TranslatePipe,
    PageHeroComponent
  ],
  template: `
    <p-toast></p-toast>

    <div class="as-page controle-acesso-container">
      <app-page-hero
        variant="navy"
        titleKey="controleAcesso.title"
        subtitleKey="controleAcesso.subtitle"
        titleIcon="pi-shield"
        [hasActions]="true">
        <button
          actions
          pButton
          type="button"
          icon="pi pi-plus"
          [label]="'controleAcesso.btn.newProfile' | translate"
          class="p-button-primary"
          (click)="onNovoPerfil()">
        </button>
      </app-page-hero>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Funcionalidades Disponíveis -->
        <div class="funcionalidades-section">
          <p-card [header]="'controleAcesso.section.available' | translate" styleClass="funcionalidades-card">
            <div class="funcionalidades-list">
              <div 
                *ngFor="let funcionalidade of funcionalidades; trackBy: trackByFuncionalidadeId"
                class="funcionalidade-item"
                [class.selected]="isFuncionalidadeSelected(funcionalidade)">
                <div class="funcionalidade-info">
                  <div class="funcionalidade-header">
                    <i *ngIf="funcionalidade.icone" [class]="funcionalidade.icone" class="funcionalidade-icon"></i>
                    <span class="funcionalidade-nome">{{ funcLabel(funcionalidade) }}</span>
                  </div>
                  <div class="funcionalidade-detalhes">
                    <span class="codigo">{{ funcionalidade.codigo }}</span>
                    <span *ngIf="funcionalidade.descricao" class="descricao">{{ funcionalidade.descricao }}</span>
                  </div>
                </div>
                <div class="funcionalidade-actions">
                  <button
                    *ngIf="!isFuncionalidadeSelected(funcionalidade)"
                    pButton
                    type="button"
                    icon="pi pi-plus"
                    [label]="'controleAcesso.btn.assign' | translate"
                    class="p-button-outlined btn-assign-feature"
                    size="small"
                    [disabled]="!perfilSelecionado"
                    (click)="adicionarFuncionalidadeAoPerfil(funcionalidade)">
                  </button>
                </div>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Perfis -->
        <div class="perfis-section">
          <p-card [header]="'controleAcesso.section.profiles' | translate" styleClass="perfis-card">
            <div class="perfis-list">
              <div 
                *ngFor="let perfil of perfis; trackBy: trackByPerfilId"
                class="perfil-item"
                [class.selected]="perfilSelecionado?.id === perfil.id"
                (click)="selecionarPerfil(perfil)">
                <div class="perfil-info">
                  <div class="perfil-header">
                    <span class="perfil-nome">{{ perfilLabel(perfil) }}</span>
                  </div>
                  <div class="perfil-detalhes">
                    <span class="codigo">{{ perfil.codigo }}</span>
                    <span *ngIf="perfilDescricao(perfil)" class="descricao">{{ perfilDescricao(perfil) }}</span>
                  </div>
                </div>
                <div class="perfil-stats">
                  <span class="funcionalidades-count">
                    {{ featuresCountLabel(getFuncionalidadesCount(perfil)) }}
                  </span>
                </div>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Funcionalidades do Perfil Selecionado -->
        <div class="perfil-funcionalidades-section">
          <p-card 
            [header]="perfilFuncionalidadesHeader"
            styleClass="perfil-funcionalidades-card">
            
            <div *ngIf="!perfilSelecionado" class="no-selection">
              <i class="pi pi-info-circle"></i>
              <p>{{ 'controleAcesso.selectProfileHint' | translate }}</p>
            </div>

            <div *ngIf="perfilSelecionado" class="perfil-funcionalidades-content">
              <div class="perfil-funcionalidades-header">
                <span class="total-funcionalidades">
                  {{ featuresAssignedLabel(funcionalidadesDoPerfil.length) }}
                </span>
                <button 
                  pButton 
                  type="button" 
                  [label]="'controleAcesso.btn.save' | translate" 
                  icon="pi pi-save"
                  class="p-button-primary"
                  [disabled]="!hasChanges()"
                  (click)="salvarAlteracoes()">
                </button>
              </div>

              <div class="funcionalidades-do-perfil">
                <div 
                  *ngFor="let funcionalidade of funcionalidadesDoPerfil; trackBy: trackByFuncionalidadeId"
                  class="funcionalidade-perfil-item">
                  <div class="funcionalidade-info">
                    <div class="funcionalidade-header">
                      <i *ngIf="funcionalidade.icone" [class]="funcionalidade.icone" class="funcionalidade-icon"></i>
                      <span class="funcionalidade-nome">{{ funcLabel(funcionalidade) }}</span>
                    </div>
                    <div class="funcionalidade-detalhes">
                      <span class="codigo">{{ funcionalidade.codigo }}</span>
                    </div>
                  </div>
                  <div class="funcionalidade-actions">
                    <button 
                      pButton 
                      type="button" 
                      icon="pi pi-times" 
                      [label]="'controleAcesso.btn.remove' | translate"
                      class="p-button-danger p-button-outlined"
                      size="small"
                      (click)="removerFuncionalidadeDoPerfil(funcionalidade)">
                    </button>
                  </div>
                </div>

                <div *ngIf="funcionalidadesDoPerfil.length === 0" class="no-funcionalidades">
                  <i class="pi pi-inbox"></i>
                  <p>{{ 'controleAcesso.noFeatures' | translate }}</p>
                </div>
              </div>
            </div>
          </p-card>
        </div>
      </div>
    </div>

    <p-dialog
      [(visible)]="showNovoPerfilDialog"
      [header]="'controleAcesso.dialog.newProfileTitle' | translate"
      [modal]="true"
      [style]="{ width: '480px' }"
      styleClass="as-hero-dialog">
      <div class="novo-perfil-form">
        <label>{{ 'controleAcesso.dialog.fieldName' | translate }}</label>
        <input pInputText class="w-full" [(ngModel)]="novoPerfilNome" />
        <label>{{ 'controleAcesso.dialog.fieldCode' | translate }}</label>
        <input pInputText class="w-full" [(ngModel)]="novoPerfilCodigo" />
        <label>{{ 'controleAcesso.dialog.fieldDescription' | translate }}</label>
        <textarea pInputTextarea rows="3" class="w-full" [(ngModel)]="novoPerfilDescricao"></textarea>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" class="p-button-text" [label]="'common.confirm.cancel' | translate" (click)="showNovoPerfilDialog = false"></button>
        <button pButton type="button" [label]="'controleAcesso.dialog.btnCreate' | translate" icon="pi pi-check"
                [loading]="criandoPerfil" (click)="criarNovoPerfil()"></button>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['./controle-acesso.component.scss']
})
export class ControleAcessoComponent implements OnInit, OnDestroy {
  funcionalidades: Funcionalidade[] = [];
  perfis: Perfil[] = [];
  perfilSelecionado: Perfil | null = null;
  funcionalidadesDoPerfil: Funcionalidade[] = [];
  funcionalidadesSelecionadas: Set<number> = new Set();
  loading = true;
  hasUnsavedChanges = false;
  showNovoPerfilDialog = false;
  novoPerfilNome = '';
  novoPerfilCodigo = '';
  novoPerfilDescricao = '';
  criandoPerfil = false;
  private langSub?: Subscription;

  constructor(
    private funcionalidadeService: FuncionalidadeService,
    private perfilService: PerfilService,
    private messageService: MessageService,
    private i18n: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

  get perfilFuncionalidadesHeader(): string {
    if (!this.perfilSelecionado) {
      return this.i18n.translate('controleAcesso.selectProfile');
    }
    return this.i18n.translate('controleAcesso.profileFeatures', {
      name: this.perfilLabel(this.perfilSelecionado)
    });
  }

  funcLabel(f: Funcionalidade): string {
    return this.i18n.translateMenuFunc(f.codigo, f.nome);
  }

  perfilLabel(p: Perfil): string {
    return repairDisplayText(this.i18n.translatePerfil(p.codigo, p.nome));
  }

  perfilDescricao(p: Perfil): string {
    const text = this.i18n.translateCatalog('perfil.desc', p.codigo, p.descricao);
    return repairDisplayText(text);
  }

  featuresCountLabel(count: number): string {
    return this.i18n.translate('controleAcesso.featuresCount', { count: String(count) });
  }

  featuresAssignedLabel(count: number): string {
    return this.i18n.translate('controleAcesso.featuresAssigned', { count: String(count) });
  }

  ngOnInit() {
    this.carregarDados();
    this.langSub = this.i18n.getCurrentLanguage$().subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
  }

  carregarDados() {
    this.loading = true;
    
    // Carregar funcionalidades e perfis da API real
    this.funcionalidadeService.listarParaGestaoRbac().subscribe({
      next: (funcionalidades) => {
        this.funcionalidades = funcionalidades || [];
      },
      error: (error) => {
        console.error('Failed to load permissions:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'controleAcesso.toast.loadFeaturesError');
      }
    });

    this.perfilService.listarTodos().subscribe({
      next: (perfis) => {
        this.perfis = perfis || [];
        if (!this.perfilSelecionado && this.perfis.length > 0) {
          const admin =
            this.perfis.find(p => {
              const c = (p.codigo ?? '').toUpperCase();
              return c === 'ADMIN' || c === 'ADMINISTRADOR';
            }) ?? this.perfis[0];
          this.selecionarPerfil(admin);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load profiles:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'controleAcesso.toast.loadProfilesError');
        this.loading = false;
      }
    });
  }

  selecionarPerfil(perfil: Perfil) {
    this.perfilSelecionado = perfil;
    this.carregarFuncionalidadesDoPerfil();
    this.hasUnsavedChanges = false;
  }

  carregarFuncionalidadesDoPerfil() {
    if (!this.perfilSelecionado) return;

    this.perfilService.listarFuncionalidades(this.perfilSelecionado.id).subscribe({
      next: (funcionalidades) => {
        this.funcionalidadesDoPerfil = funcionalidades;
        this.funcionalidadesSelecionadas = new Set(funcionalidades.map(f => f.id));
      },
      error: (error) => {
        console.error('Failed to load profile permissions:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'controleAcesso.toast.loadProfileFeaturesError');
      }
    });
  }

  isFuncionalidadeSelected(funcionalidade: Funcionalidade): boolean {
    return this.funcionalidadesSelecionadas.has(funcionalidade.id);
  }

  adicionarFuncionalidadeAoPerfil(funcionalidade: Funcionalidade) {
    if (!this.perfilSelecionado) {
      toastKey(this.messageService, this.i18n, 'warn', 'common.toast.warn', 'controleAcesso.selectProfileHint');
      return;
    }
    if (this.isFuncionalidadeSelected(funcionalidade)) {
      return;
    }

    this.funcionalidadesDoPerfil.push(funcionalidade);
    this.funcionalidadesSelecionadas.add(funcionalidade.id);
    this.hasUnsavedChanges = true;
  }

  removerFuncionalidadeDoPerfil(funcionalidade: Funcionalidade) {
    if (!this.perfilSelecionado) return;

    this.funcionalidadesDoPerfil = this.funcionalidadesDoPerfil.filter(f => f.id !== funcionalidade.id);
    this.funcionalidadesSelecionadas.delete(funcionalidade.id);
    this.hasUnsavedChanges = true;
  }

  getFuncionalidadesCount(perfil: Perfil): number {
    // Contar funcionalidades do perfil (seria melhor ter isso no backend)
    return this.funcionalidades.filter(f => f.perfilIds?.includes(perfil.id)).length;
  }

  hasChanges(): boolean {
    return this.hasUnsavedChanges;
  }

  salvarAlteracoes() {
    if (!this.perfilSelecionado) return;

    const funcionalidadeIds = this.funcionalidadesDoPerfil.map(f => f.id);
    
    this.perfilService.atribuirFuncionalidades(this.perfilSelecionado.id, funcionalidadeIds).subscribe({
      next: () => {
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'controleAcesso.toast.saveSuccess');
        this.hasUnsavedChanges = false;
        this.carregarDados(); // Recarregar para atualizar contadores
      },
      error: (error) => {
        console.error('Failed to save changes:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'controleAcesso.toast.saveError');
      }
    });
  }

  trackByFuncionalidadeId(index: number, funcionalidade: Funcionalidade): number {
    return funcionalidade.id;
  }

  trackByPerfilId(index: number, perfil: Perfil): number {
    return perfil.id;
  }

  onNovoPerfil() {
    this.novoPerfilNome = '';
    this.novoPerfilCodigo = '';
    this.novoPerfilDescricao = '';
    this.showNovoPerfilDialog = true;
  }

  criarNovoPerfil() {
    const nome = this.novoPerfilNome.trim();
    const codigo = this.novoPerfilCodigo.trim().toUpperCase();
    if (!nome || !codigo) {
      toastKey(this.messageService, this.i18n, 'warn', 'common.toast.warn', 'controleAcesso.toast.newProfileValidation');
      return;
    }
    this.criandoPerfil = true;
    this.perfilService.criar({ nome, codigo, descricao: this.novoPerfilDescricao.trim(), ativo: true }).subscribe({
      next: perfil => {
        this.criandoPerfil = false;
        this.showNovoPerfilDialog = false;
        toastKey(this.messageService, this.i18n, 'success', 'controleAcesso.toast.newProfileSummary', 'controleAcesso.toast.newProfileInfo');
        this.carregarDados();
        if (perfil) {
          this.selecionarPerfil(perfil);
        }
      },
      error: () => {
        this.criandoPerfil = false;
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'controleAcesso.toast.newProfileError');
      }
    });
  }
}
