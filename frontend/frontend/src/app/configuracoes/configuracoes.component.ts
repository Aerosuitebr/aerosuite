import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { StepsModule } from 'primeng/steps';
import { AccordionModule } from 'primeng/accordion';
import {
  AppearancePreferencesService,
  ThemeMode,
  InterfaceDensity,
  FontSize
} from '../core/appearance-preferences.service';
import { TranslationService } from '../core/translation.service';
import {
  isBackendI18nMessage,
  isCancelledByUserBackendMessage,
  translateBackendI18nMessage,
} from '../core/backend-i18n-message.util';
import { PageHelpComponent } from '../shared/page-help/page-help.component';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { TranslatePipe } from '../core/translate.pipe';
import { AuthService } from '../auth/auth.service';
import { canonFuncionalidadeCodigo, isSuperPerfil } from '../auth/permissao.util';
import { SistemaAtualizacaoService, SistemaAtualizacaoStatus, AtualizacaoProgress } from '../core/sistema-atualizacao.service';
import { EmpresaConfigPanelComponent } from '../configuracao-empresa/empresa-config-panel.component';
import { RouterModule } from '@angular/router';
import { toastKey } from '../core/toast-i18n.util';

interface Configuracao {
  id: string;
  nome: string;
  descricao: string;
  valor: any;
  tipo: 'text' | 'number' | 'boolean' | 'select';
  opcoes?: any[];
  categoria: string;
  obrigatorio: boolean;
}

type SettingsSectionKind = 'config' | 'empresa' | 'bling' | 'whatsapp';

interface SettingsSection {
  id: string;
  kind: SettingsSectionKind;
  icon: string;
  tone: string;
  titleKey: string;
  descKey: string;
}

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  host: {
    class: 'configuracoes-host',
  },
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    CheckboxModule,
    InputNumberModule,
    DividerModule,
    FormsModule,
    ToastModule,
    DialogModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    StepsModule,
    AccordionModule,
    PageHelpComponent,
    EmpresaConfigPanelComponent,
    RouterModule,
    PageHeroComponent,
    TranslatePipe,
  ],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    
    <div class="as-page configuracoes-container">
      <app-page-hero
        variant="navy"
        titleKey="settings.title"
        subtitleKey="settings.description"
        titleIcon="pi-cog"
        [hasActions]="true">
        <div actions class="header-actions">
          <app-page-help></app-page-help>
          <button
            pButton
            type="button"
            [label]="'settings.saveAll' | translate"
            icon="pi pi-save"
            class="p-button-primary"
            [loading]="salvandoAdmin"
            [disabled]="salvandoAdmin"
            (click)="salvarTodas()">
          </button>
          <button
            pButton
            type="button"
            [label]="'settings.restoreDefaults' | translate"
            icon="pi pi-refresh"
            class="p-button-outlined"
            (click)="restaurarPadroes()">
          </button>
        </div>
      </app-page-hero>

      <div class="as-page-body configuracoes-body">
        <nav class="settings-jump-nav" [attr.aria-label]="'settings.nav.aria' | translate">
          <button
            type="button"
            class="settings-jump-nav__chip"
            *ngFor="let item of jumpNavItems"
            (click)="scrollToSection(item.id)">
            <i class="pi" [ngClass]="item.icon" aria-hidden="true"></i>
            <span>{{ item.labelKey | translate }}</span>
          </button>
        </nav>

        <p-accordion
          styleClass="settings-accordion"
          [multiple]="true"
          [(activeIndex)]="settingsAccordionOpen">
          <p-accordionTab
            *ngFor="let section of settingsSections; let idx = index">
            <ng-template pTemplate="header">
              <div class="settings-acc-head" [attr.id]="'settings-' + section.id">
                <span class="settings-acc-icon" [ngClass]="'settings-acc-icon--' + section.tone">
                  <i class="pi" [ngClass]="section.icon" aria-hidden="true"></i>
                </span>
                <span class="settings-acc-text">
                  <span class="settings-acc-title">{{ section.titleKey | translate }}</span>
                  <span class="settings-acc-desc">{{ section.descKey | translate }}</span>
                </span>
              </div>
            </ng-template>

            <ng-container [ngSwitch]="section.kind">
              <div *ngSwitchCase="'config'" class="config-grid">
                <div class="config-item" *ngFor="let config of getConfiguracoesPorCategoria(section.id)">
                  <div class="config-label">
                    <label [for]="config.id">{{ config.nome }}</label>
                    <span class="required" *ngIf="config.obrigatorio">*</span>
                    <p class="config-description">{{ config.descricao }}</p>
                  </div>
                  <div class="config-input">
                    <input
                      *ngIf="config.tipo === 'text'"
                      pInputText
                      [id]="config.id"
                      [(ngModel)]="config.valor"
                      class="w-full">
                    <p-inputNumber
                      *ngIf="config.tipo === 'number'"
                      [id]="config.id"
                      [(ngModel)]="config.valor"
                      [min]="0"
                      [max]="999999"
                      class="w-full">
                    </p-inputNumber>
                    <p-checkbox
                      *ngIf="config.tipo === 'boolean'"
                      [inputId]="config.id"
                      [id]="config.id"
                      [(ngModel)]="config.valor"
                      [binary]="true"
                      [attr.aria-label]="config.nome">
                    </p-checkbox>
                    <p-dropdown
                      *ngIf="config.tipo === 'select'"
                      [id]="config.id"
                      [options]="config.opcoes"
                      [(ngModel)]="config.valor"
                      optionLabel="label"
                      optionValue="value"
                      appendTo="body"
                      panelStyleClass="config-settings-dropdown-panel"
                      class="w-full">
                    </p-dropdown>
                  </div>
                </div>
              </div>

              <div *ngSwitchCase="'empresa'" class="settings-acc-embed">
                <app-empresa-config-panel></app-empresa-config-panel>
              </div>

              <div *ngSwitchCase="'bling'" class="settings-acc-embed settings-bling-link">
                <div class="settings-bling-link__card">
                  <div class="settings-bling-link__copy">
                    <h3>{{ 'integrations.bling.settingsLinkTitle' | translate }}</h3>
                    <p>{{ 'integrations.bling.settingsLinkDesc' | translate }}</p>
                  </div>
                  <a pButton routerLink="/integracoes/bling" icon="pi pi-external-link"
                    [label]="'integrations.bling.settingsLinkBtn' | translate"></a>
                </div>
              </div>

              <div *ngSwitchCase="'whatsapp'" class="settings-acc-embed settings-bling-link">
                <div class="settings-bling-link__card">
                  <div class="settings-bling-link__copy">
                    <h3>{{ 'integrations.whatsapp.settingsLinkTitle' | translate }}</h3>
                    <p>{{ 'integrations.whatsapp.settingsLinkDesc' | translate }}</p>
                  </div>
                  <a pButton routerLink="/integracoes/whatsapp" icon="pi pi-whatsapp"
                    [label]="'integrations.whatsapp.settingsLinkBtn' | translate"></a>
                </div>
              </div>
            </ng-container>
          </p-accordionTab>
        </p-accordion>

      <!-- Seção de Atualização - DESABILITADA -->
      <div class="update-section" *ngIf="false && isAdmin">
        <div class="update-card">
          <div class="update-header">
            <div class="update-icon">
              <i class="pi pi-download"></i>
            </div>
            <div class="update-title-section">
              <h3>{{ t('config.update.ui.title') }}</h3>
              <p>{{ t('config.update.ui.subtitle') }}</p>
            </div>
          </div>
          
          <div class="update-content">
            <div class="update-status">
              <div class="status-info">
                <div class="status-item">
                  <span class="status-label">{{ t('config.update.ui.currentVersion') }}</span>
                  <span class="status-value">{{ atualizacaoStatus?.versaoAtual || versaoAtualSistema || t('config.update.ui.unknownVersion') }}</span>
                </div>
                <div class="status-item" *ngIf="atualizacaoStatus?.versaoDisponivel">
                  <span class="status-label">{{ t('config.update.ui.newVersionAvailable') }}</span>
                  <span class="status-value new-version">{{ atualizacaoStatus.versaoDisponivel }}</span>
                </div>
                <div class="status-item" *ngIf="!atualizacaoStatus?.versaoDisponivel && versaoVerificadaGoogleDrive">
                  <span class="status-label">{{ t('config.update.ui.driveVersion') }}</span>
                  <span class="status-value">{{ versaoVerificadaGoogleDrive }}</span>
                </div>
                <div class="status-item">
                  <span class="status-label">{{ t('config.update.ui.status') }}</span>
                  <span class="status-badge" [ngClass]="'status-' + (atualizacaoStatus?.status || 'ATUALIZADO').toLowerCase()">
                    {{ atualizacaoStatus?.status || 'ATUALIZADO' }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Card de Verificação com Círculo de Progresso -->
            <div class="verification-card" *ngIf="verificandoAtualizacao || verificacaoConcluida">
              <div class="verification-content">
                <div class="circular-progress-wrapper">
                  <svg class="circular-progress" viewBox="0 0 120 120">
                    <circle class="progress-background" cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                    <circle 
                      class="progress-circle" 
                      cx="60" 
                      cy="60" 
                      r="54" 
                      fill="none" 
                      stroke="#3b82f6" 
                      stroke-width="8"
                      [attr.stroke-dasharray]="339.292"
                      [attr.stroke-dashoffset]="339.292 - (339.292 * progressoVerificacao / 100)"
                      stroke-linecap="round"
                      transform="rotate(-90 60 60)"/>
                    <text class="progress-text" x="60" y="60" text-anchor="middle" dominant-baseline="middle">
                      {{ progressoVerificacao }}%
                    </text>
                  </svg>
                  <div class="progress-icon-wrapper">
                    <i class="pi pi-check-circle success-icon" *ngIf="verificacaoConcluida"></i>
                    <i class="pi pi-spin pi-spinner loading-icon" *ngIf="verificandoAtualizacao && !verificacaoConcluida"></i>
                  </div>
                </div>
                
                <div class="verification-steps">
                  <div class="verification-step" 
                       [ngClass]="{'active': verificacaoSteps.conectando.ativo, 'completed': verificacaoSteps.conectando.concluido}">
                    <div class="step-indicator">
                      <i class="pi pi-check" *ngIf="verificacaoSteps.conectando.concluido"></i>
                      <i class="pi pi-spin pi-spinner" *ngIf="verificacaoSteps.conectando.ativo && !verificacaoSteps.conectando.concluido"></i>
                      <span *ngIf="!verificacaoSteps.conectando.ativo && !verificacaoSteps.conectando.concluido">1</span>
                    </div>
                    <div class="step-content">
                      <div class="step-title">{{ t('config.update.step.connectServer') }}</div>
                      <div class="step-description">{{ verificacaoSteps.conectando.descricao }}</div>
                    </div>
                  </div>
                  
                  <div class="verification-step" 
                       [ngClass]="{'active': verificacaoSteps.verificando.ativo, 'completed': verificacaoSteps.verificando.concluido}">
                    <div class="step-indicator">
                      <i class="pi pi-check" *ngIf="verificacaoSteps.verificando.concluido"></i>
                      <i class="pi pi-spin pi-spinner" *ngIf="verificacaoSteps.verificando.ativo && !verificacaoSteps.verificando.concluido"></i>
                      <span *ngIf="!verificacaoSteps.verificando.ativo && !verificacaoSteps.verificando.concluido">2</span>
                    </div>
                    <div class="step-content">
                      <div class="step-title">{{ t('config.update.step.checkVersion') }}</div>
                      <div class="step-description">{{ verificacaoSteps.verificando.descricao }}</div>
                    </div>
                  </div>
                  
                  <div class="verification-step" 
                       [ngClass]="{'active': verificacaoSteps.comparando.ativo, 'completed': verificacaoSteps.comparando.concluido}">
                    <div class="step-indicator">
                      <i class="pi pi-check" *ngIf="verificacaoSteps.comparando.concluido"></i>
                      <i class="pi pi-spin pi-spinner" *ngIf="verificacaoSteps.comparando.ativo && !verificacaoSteps.comparando.concluido"></i>
                      <span *ngIf="!verificacaoSteps.comparando.ativo && !verificacaoSteps.comparando.concluido">3</span>
                    </div>
                    <div class="step-content">
                      <div class="step-title">{{ t('config.update.step.compareVersions') }}</div>
                      <div class="step-description">{{ verificacaoSteps.comparando.descricao }}</div>
                    </div>
                  </div>
                  
                  <div class="verification-step" 
                       [ngClass]="{'active': verificacaoSteps.concluido.ativo, 'completed': verificacaoSteps.concluido.concluido}">
                    <div class="step-indicator">
                      <i class="pi pi-check" *ngIf="verificacaoSteps.concluido.concluido"></i>
                      <i class="pi pi-spin pi-spinner" *ngIf="verificacaoSteps.concluido.ativo && !verificacaoSteps.concluido.concluido"></i>
                      <span *ngIf="!verificacaoSteps.concluido.ativo && !verificacaoSteps.concluido.concluido">4</span>
                    </div>
                    <div class="step-content">
                      <div class="step-title">{{ t('config.update.step.conclusion') }}</div>
                      <div class="step-description">{{ verificacaoSteps.concluido.descricao }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="update-actions">
              <button 
                pButton 
                type="button" 
                [label]="t('config.update.check')" 
                icon="pi pi-search"
                [loading]="verificandoAtualizacao"
                [disabled]="verificandoAtualizacao"
                class="p-button-primary"
                (click)="verificarAtualizacoes()">
              </button>
              
              <button 
                pButton 
                type="button" 
                [label]="t('config.update.downloadInstall')" 
                icon="pi pi-download"
                [disabled]="!atualizacaoStatus || !atualizacaoStatus.versaoDisponivel || atualizacaoStatus.status === 'EM_ANDAMENTO'"
                class="p-button-success"
                *ngIf="atualizacaoStatus && atualizacaoStatus.versaoDisponivel && atualizacaoStatus.status !== 'CONCLUIDA'"
                (click)="confirmarDownloadAtualizacao()">
              </button>
            </div>
            
            <div class="update-message" *ngIf="atualizacaoStatus?.mensagem && !progressoAtualizacao">
              <i class="pi pi-info-circle"></i>
              <span>{{ tm(atualizacaoStatus.mensagem) }}</span>
            </div>

            <!-- Accordion de Progresso da Atualização -->
            <p-accordion 
              *ngIf="progressoAtualizacao && 
                     progressoAtualizacao.status !== 'PRONTA_PARA_INSTALACAO' && 
                     progressoAtualizacao.status !== 'CONCLUIDA' && 
                     progressoAtualizacao.status !== 'CANCELADA' &&
                     (progressoAtualizacao.status === 'EM_ANDAMENTO' || progressoAtualizacao.status === 'APROVADA' || progressoAtualizacao.status === 'DISPONIVEL') &&
                     atualizacaoStatus?.status !== 'PRONTA_PARA_INSTALACAO' &&
                     atualizacaoStatus?.status !== 'CONCLUIDA' &&
                     atualizacaoStatus?.status !== 'CANCELADA'"
              [(activeIndex)]="accordionAtualizacaoAberto"
              [multiple]="false">
              <p-accordionTab>
                <ng-template pTemplate="header">
                  <div class="accordion-header-content">
                    <div class="accordion-header-left">
                      <i class="pi pi-spin pi-spinner" *ngIf="progressoAtualizacao?.status === 'EM_ANDAMENTO' || progressoAtualizacao?.status === 'APROVADA'"></i>
                      <i class="pi pi-check-circle status-icon-success" *ngIf="progressoAtualizacao?.status === 'CONCLUIDA' || progressoAtualizacao?.status === 'PRONTA_PARA_INSTALACAO'"></i>
                      <i class="pi pi-times-circle status-icon-error" *ngIf="progressoAtualizacao?.status === 'CANCELADA'"></i>
                      <span class="accordion-title">
                        <span *ngIf="accordionAtualizacaoAberto !== null || progressoAtualizacao?.status === 'EM_ANDAMENTO' || progressoAtualizacao?.status === 'APROVADA'">
                          {{ getProgressTitle() }}
                        </span>
                        <span *ngIf="accordionAtualizacaoAberto === null && (progressoAtualizacao?.status === 'CONCLUIDA' || progressoAtualizacao?.status === 'PRONTA_PARA_INSTALACAO')">
                          {{ t('config.update.ui.successAccordion') }}
                        </span>
                      </span>
                    </div>
                    <div class="accordion-header-right">
                      <span class="progress-version">{{ progressoAtualizacao?.versaoDisponivel || atualizacaoStatus?.versaoDisponivel }}</span>
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-times" 
                        class="p-button-danger p-button-sm p-button-text" 
                        *ngIf="podeCancelarAtualizacao()" 
                        (click)="cancelarAtualizacao(); $event.stopPropagation()"
                        [title]="t('config.update.ui.cancelTooltip')">
                      </button>
                    </div>
                  </div>
                </ng-template>
                
                <div class="update-progress-container">
                  <!-- Steps do Progresso -->
                  <div class="progress-steps">
                    <div class="step-item" 
                         [ngClass]="{'active': isStepActive(0), 'completed': isStepCompleted(0)}">
                      <div class="step-icon">
                        <i class="pi pi-search" *ngIf="!isStepCompleted(0)"></i>
                        <i class="pi pi-check" *ngIf="isStepCompleted(0)"></i>
                      </div>
                      <div class="step-content">
                        <div class="step-title">{{ t('config.update.progress.stepVerify') }}</div>
                        <div class="step-description">{{ t('config.update.progress.stepVerifyDesc') }}</div>
                      </div>
                    </div>

                    <div class="step-item" 
                         [ngClass]="{'active': isStepActive(1), 'completed': isStepCompleted(1)}">
                      <div class="step-icon">
                        <i class="pi pi-folder" *ngIf="!isStepCompleted(1)"></i>
                        <i class="pi pi-check" *ngIf="isStepCompleted(1)"></i>
                      </div>
                      <div class="step-content">
                        <div class="step-title">{{ t('config.update.progress.stepFolder') }}</div>
                        <div class="step-description">{{ t('config.update.progress.stepFolderDesc') }}</div>
                      </div>
                    </div>

                    <div class="step-item" 
                         [ngClass]="{'active': isStepActive(2), 'completed': isStepCompleted(2)}">
                      <div class="step-icon">
                        <i class="pi pi-download" *ngIf="!isStepCompleted(2)"></i>
                        <i class="pi pi-check" *ngIf="isStepCompleted(2)"></i>
                      </div>
                      <div class="step-content">
                        <div class="step-title">{{ t('config.update.progress.stepDownload') }}</div>
                        <div class="step-description">{{ t('config.update.progress.stepDownloadDesc') }}</div>
                      </div>
                    </div>

                    <div class="step-item" 
                         [ngClass]="{'active': isStepActive(3), 'completed': isStepCompleted(3)}">
                      <div class="step-icon">
                        <i class="pi pi-check-circle" *ngIf="!isStepCompleted(3)"></i>
                        <i class="pi pi-check" *ngIf="isStepCompleted(3)"></i>
                      </div>
                      <div class="step-content">
                        <div class="step-title">{{ t('config.update.progress.stepDone') }}</div>
                        <div class="step-description">{{ t('config.update.progress.stepDoneDesc') }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Barra de Progresso Geral -->
                  <div class="progress-bar-container">
                    <div class="progress-bar-wrapper">
                      <div class="custom-progress-bar">
                        <div #progressBarFill class="custom-progress-bar-fill" [style.width.%]="getProgressPercentage()"></div>
                      </div>
                    </div>
                    <div class="progress-info">
                      <span class="progress-text">{{ getProgressMessage() }}</span>
                      <span class="progress-percentage">{{ getProgressPercentage() }}%</span>
                    </div>
                  </div>
                </div>
              </p-accordionTab>
            </p-accordion>
          </div>
        </div>
      </div>

      <!-- Modal de Instalação -->
      <p-dialog 
        styleClass="as-hero-dialog instalacao-modal" [(visible)]="mostrarModalInstalacao" 
        [modal]="true" 
        [closable]="false"
        [draggable]="false"
        [resizable]="false"
        [style]="{width: '90vw', maxWidth: '800px'}"
       >
        <ng-template pTemplate="header">
          <div class="modal-header">
            <i class="pi pi-download"></i>
            <h3>{{ t('config.update.ui.modalTitle') }}</h3>
          </div>
        </ng-template>
        
        <div class="instalacao-content">
          <div class="instalacao-mensagem" *ngIf="mensagemInstalacao">
            <i class="pi pi-info-circle"></i>
            <span>{{ mensagemInstalacao }}</span>
          </div>
          
          <!-- Passo 1: Backup -->
          <div class="instalacao-step" [ngClass]="{'active': instalacaoSteps.backup.ativo, 'completed': instalacaoSteps.backup.concluido}">
            <div class="step-header">
              <div class="step-icon-wrapper">
                <i class="pi pi-database step-icon" [ngClass]="{'pi-spin': instalacaoSteps.backup.ativo && !instalacaoSteps.backup.concluido}"></i>
                <i class="pi pi-check step-check" *ngIf="instalacaoSteps.backup.concluido"></i>
              </div>
              <div class="step-info">
                <h4>{{ t('config.update.install.stepBackup') }}</h4>
                <p>{{ instalacaoSteps.backup.descricao }}</p>
              </div>
            </div>
            <div class="step-progress">
              <div class="progress-bar">
                <div class="progress-fill" [style.width]="instalacaoSteps.backup.progresso + '%'"></div>
              </div>
              <span class="progress-text">{{ instalacaoSteps.backup.progresso | number:'1.0-0' }}%</span>
            </div>
          </div>
          
          <!-- Passo 2: Download -->
          <div class="instalacao-step" [ngClass]="{'active': instalacaoSteps.download.ativo, 'completed': instalacaoSteps.download.concluido}">
            <div class="step-header">
              <div class="step-icon-wrapper">
                <i class="pi pi-download step-icon" [ngClass]="{'pi-spin': instalacaoSteps.download.ativo && !instalacaoSteps.download.concluido}"></i>
                <i class="pi pi-check step-check" *ngIf="instalacaoSteps.download.concluido"></i>
              </div>
              <div class="step-info">
                <h4>{{ t('config.update.install.stepDownload') }}</h4>
                <p>{{ instalacaoSteps.download.descricao }}</p>
              </div>
            </div>
            <div class="step-progress">
              <div class="progress-bar">
                <div class="progress-fill" [style.width]="instalacaoSteps.download.progresso + '%'"></div>
              </div>
              <span class="progress-text">{{ instalacaoSteps.download.progresso | number:'1.0-0' }}%</span>
            </div>
          </div>
          
          <!-- Passo 3: Instalação -->
          <div class="instalacao-step" [ngClass]="{'active': instalacaoSteps.instalacao.ativo, 'completed': instalacaoSteps.instalacao.concluido}">
            <div class="step-header">
              <div class="step-icon-wrapper">
                <i class="pi pi-cog step-icon" [ngClass]="{'pi-spin': instalacaoSteps.instalacao.ativo && !instalacaoSteps.instalacao.concluido}"></i>
                <i class="pi pi-check step-check" *ngIf="instalacaoSteps.instalacao.concluido"></i>
              </div>
              <div class="step-info">
                <h4>{{ t('config.update.install.stepInstall') }}</h4>
                <p>{{ instalacaoSteps.instalacao.descricao }}</p>
              </div>
            </div>
            <div class="step-progress">
              <div class="progress-bar">
                <div class="progress-fill" [style.width]="instalacaoSteps.instalacao.progresso + '%'"></div>
              </div>
              <span class="progress-text">{{ instalacaoSteps.instalacao.progresso | number:'1.0-0' }}%</span>
            </div>
          </div>
          
          <!-- Passo 4: Restart -->
          <div class="instalacao-step restart-step" [ngClass]="{'active': instalacaoSteps.restart.ativo, 'completed': instalacaoSteps.restart.concluido, 'warning': contadorRestart <= 5 && contadorRestart > 0, 'critical': contadorRestart <= 3}">
            <div class="step-header">
              <div class="step-icon-wrapper">
                <i class="pi pi-refresh step-icon" [ngClass]="{'pi-spin': instalacaoSteps.restart.ativo && contadorRestart > 0}"></i>
                <i class="pi pi-check step-check" *ngIf="instalacaoSteps.restart.concluido && contadorRestart === 0"></i>
              </div>
              <div class="step-info">
                <h4>{{ t('config.update.install.stepRestart') }}</h4>
                <p>{{ instalacaoSteps.restart.descricao }}</p>
              </div>
            </div>
            <div class="restart-countdown" *ngIf="instalacaoSteps.restart.ativo && contadorRestart > 0">
              <div class="countdown-circle" [ngClass]="{'warning': contadorRestart <= 5, 'critical': contadorRestart <= 3}">
                <svg class="countdown-svg" viewBox="0 0 120 120">
                  <circle class="countdown-background" cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                  <circle 
                    class="countdown-progress" 
                    cx="60" 
                    cy="60" 
                    r="54" 
                    fill="none" 
                    stroke="#ef4444" 
                    stroke-width="8"
                    [attr.stroke-dasharray]="339.292"
                    [attr.stroke-dashoffset]="339.292 - (339.292 * (10 - contadorRestart) / 10)"
                    stroke-linecap="round"
                    transform="rotate(-90 60 60)"/>
                  <text class="countdown-text" x="60" y="60" text-anchor="middle" dominant-baseline="middle">
                    {{ contadorRestart }}
                  </text>
                </svg>
              </div>
              <div class="countdown-message">
                <strong>{{ t('config.update.install.restartIn', { n: contadorRestart }) }}</strong>
                <p>{{ t('config.update.install.restartWarn') }}</p>
              </div>
            </div>
            <div class="step-progress" *ngIf="instalacaoSteps.restart.ativo">
              <div class="progress-bar">
                <div class="progress-fill restart-fill" [style.width]="instalacaoSteps.restart.progresso + '%'"></div>
              </div>
            </div>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <div class="modal-footer">
            <button 
              pButton 
              type="button" 
              [label]="t('config.update.cancel')" 
              icon="pi pi-times"
              class="p-button-danger"
              (click)="cancelarAtualizacao()"
              *ngIf="podeCancelarAtualizacao()">
            </button>
            <button 
              pButton 
              type="button" 
              [label]="t('config.update.close')" 
              icon="pi pi-times"
              class="p-button-secondary"
              [disabled]="instalacaoSteps.restart.ativo && contadorRestart > 0"
              (click)="mostrarModalInstalacao = false">
            </button>
          </div>
        </ng-template>
      </p-dialog>

      </div>
    </div>
  `,
  styleUrls: ['./configuracoes.component.scss']
})
export class ConfiguracoesComponent implements OnInit, OnDestroy, AfterViewInit {
  private appearanceService = inject(AppearancePreferencesService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);
  private atualizacaoService = inject(SistemaAtualizacaoService);
  private renderer = inject(Renderer2);
  private destroy$ = new Subject<void>();
  @ViewChild('progressBarFill', { static: false }) progressBarFill?: ElementRef<HTMLDivElement>;
  @ViewChild(EmpresaConfigPanelComponent) empresaPanel?: EmpresaConfigPanelComponent;
  
  // Método helper para tradução
  t = (key: string, params?: Record<string, string | number>) => {
    if (!params) {
      return this.translationService.translate(key);
    }
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      normalized[k] = String(v);
    }
    return this.translationService.translate(key, normalized);
  };

  /** Traduz mensagens `i18n:chave` enviadas pelo backend. */
  tm = (message?: string | null) =>
    translateBackendI18nMessage(this.translationService, message);
  
  configuracoes: Configuracao[] = [];
  categorias: Array<{ id: string; nome: string; descricao: string }> = [];
  settingsSections: SettingsSection[] = [];
  settingsAccordionOpen: number[] = [0];
  jumpNavItems: Array<{ id: string; labelKey: string; icon: string }> = [];
  isAdmin = false;

  private readonly categoryIcons: Record<string, string> = {
    aparencia: 'pi-palette',
  };
  verificandoAtualizacao = false;
  atualizacaoStatus: SistemaAtualizacaoStatus | null = null;
  versaoAtualSistema: string = '';
  versaoVerificadaGoogleDrive: string | null = null;
  progressoAtualizacao: AtualizacaoProgress | null = null;
  accordionAtualizacaoAberto: number | null = null;
  
  // Estados dos passos da verificação
  verificacaoSteps = {
    conectando: { ativo: false, concluido: false, descricao: '' },
    verificando: { ativo: false, concluido: false, descricao: '' },
    comparando: { ativo: false, concluido: false, descricao: '' },
    concluido: { ativo: false, concluido: false, descricao: '' }
  };
  
  progressoVerificacao = 0; // 0-100
  verificacaoConcluida = false;

  salvandoAdmin = false;

  ngOnInit() {
    // Verificar se o usuário é administrador
    const currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.canManageSystemConfig(currentUser);
    
    this.carregarCategorias();
    this.carregarConfiguracoes();
    this.resetVerificacaoSteps();

    // Carregar status de atualização se for admin - DESABILITADO
    if (false && this.isAdmin) {
      // this.carregarStatusAtualizacao();
      
      // Escutar mudanças no status de atualização - DESABILITADO
      if (false) {
      this.atualizacaoService.status$
        .pipe(takeUntil(this.destroy$))
        .subscribe(status => {
          this.atualizacaoStatus = status;
          
          // Controlar accordion baseado no status
          if (status) {
            if (status.status === 'EM_ANDAMENTO') {
              this.accordionAtualizacaoAberto = 0; // Abrir accordion
            } else if (status.status === 'PRONTA_PARA_INSTALACAO' || status.status === 'CONCLUIDA') {
              // Fechar accordion e limpar progresso (mesmo comportamento do cancelamento)
              this.accordionAtualizacaoAberto = null;
              this.progressoAtualizacao = null;
              // Recarregar status após um pequeno delay
              setTimeout(() => {
                if (!this.carregandoStatus) {
                  this.carregarStatusAtualizacao();
                }
              }, 1000);
            }
          }
          
          this.updateProgressBar();
        });
      }
      
      // Escutar progresso de atualização em tempo real - DESABILITADO
      if (false) {
      this.atualizacaoService.progress$
        .pipe(takeUntil(this.destroy$))
        .subscribe(progress => {
          // Ignorar atualizações se já foi concluída ou cancelada anteriormente
          if (this.atualizacaoStatus?.status === 'PRONTA_PARA_INSTALACAO' || 
              this.atualizacaoStatus?.status === 'CONCLUIDA' ||
              this.atualizacaoStatus?.status === 'CANCELADA') {
            // Não atualizar progresso se já foi concluída
            return;
          }
          
          this.progressoAtualizacao = progress;
          
          // Controlar accordion: abrir durante EM_ANDAMENTO, fechar após conclusão
          if (progress) {
            if (progress.status === 'EM_ANDAMENTO' || progress.status === 'APROVADA') {
              this.accordionAtualizacaoAberto = 0; // Abrir primeiro (e único) tab
            } else if (progress.status === 'PRONTA_PARA_INSTALACAO' || progress.status === 'CONCLUIDA') {
              // Fechar accordion imediatamente
              this.accordionAtualizacaoAberto = null;
              // Limpar progresso imediatamente para fazer o accordion desaparecer
              this.progressoAtualizacao = null;
              // Recarregar status após um pequeno delay (mesmo comportamento do cancelamento)
              setTimeout(() => {
                if (!this.carregandoStatus) {
                  this.carregarStatusAtualizacao();
                }
              }, 1000);
            }
          }
          
          // Atualizar modal de instalação se estiver aberto
          if (this.mostrarModalInstalacao && progress) {
            this.atualizarInstalacaoDoProgresso(progress);
          }
          
          // Atualizar status apenas quando necessário (mudança de status importante)
          if (progress && (progress.status === 'CANCELADA' || progress.status === 'CONCLUIDA' || progress.status === 'PRONTA_PARA_INSTALACAO' || progress.status === 'REINICIANDO')) {
            // Debounce: aguardar um pouco antes de recarregar para evitar múltiplas chamadas
            setTimeout(() => {
              if (!this.carregandoStatus) {
                this.carregarStatusAtualizacao();
              }
            }, 500);
          }
        });
      }
    }
    
    // Escutar mudanças de idioma e atualizar textos
    this.translationService.getCurrentLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.carregarCategorias();
        this.carregarConfiguracoes();
      });
  }

  ngAfterViewInit() {
    this.updateProgressBar();
  }

  private updateProgressBar() {
    // Não precisa mais manipular o DOM manualmente - o binding [style.width.%] cuida disso
    // Mantido apenas para compatibilidade com chamadas existentes
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarCategorias() {
    this.categorias = [
      { id: 'aparencia', nome: this.t('appearance.title'), descricao: this.t('appearance.description') }
    ];
    this.rebuildSettingsSections();
  }

  getCategoryIcon(categoryId: string): string {
    return this.categoryIcons[categoryId] ?? 'pi-cog';
  }

  scrollToSection(sectionId: string): void {
    const idx = this.settingsSections.findIndex(s => `settings-${s.id}` === sectionId);
    if (idx < 0) {
      return;
    }
    if (!this.settingsAccordionOpen.includes(idx)) {
      this.settingsAccordionOpen = [...this.settingsAccordionOpen, idx];
    }
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  private rebuildSettingsSections(): void {
    const categoryKeys: Record<string, { titleKey: string; descKey: string }> = {
      aparencia: { titleKey: 'appearance.title', descKey: 'appearance.description' },
    };

    this.settingsSections = this.categorias.map(c => ({
      id: c.id,
      kind: 'config' as const,
      icon: this.getCategoryIcon(c.id),
      tone: c.id,
      titleKey: categoryKeys[c.id]?.titleKey ?? 'settings.title',
      descKey: categoryKeys[c.id]?.descKey ?? 'settings.description',
    }));

    if (this.isAdmin) {
      this.settingsSections.push(
        {
          id: 'empresa',
          kind: 'empresa',
          icon: 'pi-building',
          tone: 'empresa',
          titleKey: 'empresa.panel.title',
          descKey: 'empresa.panel.intro',
        },
        {
          id: 'bling',
          kind: 'bling',
          icon: 'pi-sync',
          tone: 'bling',
          titleKey: 'integrations.bling.title',
          descKey: 'integrations.bling.intro',
        },
        {
          id: 'whatsapp',
          kind: 'whatsapp',
          icon: 'pi-whatsapp',
          tone: 'whatsapp',
          titleKey: 'integrations.whatsapp.title',
          descKey: 'integrations.whatsapp.intro',
        },
      );
    }

    this.rebuildJumpNav();
  }

  private rebuildJumpNav(): void {
    this.jumpNavItems = this.settingsSections.map(s => ({
      id: `settings-${s.id}`,
      labelKey: s.titleKey,
      icon: s.icon,
    }));
  }

  carregarConfiguracoes() {
    const appearancePrefs = this.appearanceService.getPreferences();
    
    // Configurações de Aparência e Interface (todos os usuários)
    const configuracoesAparencia: Configuracao[] = [
      {
        id: 'tema',
        nome: this.t('appearance.theme'),
        descricao: this.t('appearance.theme.description'),
        valor: appearancePrefs.theme,
        tipo: 'select' as const,
        opcoes: [
          { label: this.t('appearance.theme.light'), value: 'light' },
          { label: this.t('appearance.theme.dark'), value: 'dark' },
          { label: this.t('appearance.theme.auto'), value: 'auto' }
        ],
        categoria: 'aparencia',
        obrigatorio: false
      },
      {
        id: 'idioma_sistema',
        nome: this.t('appearance.language'),
        descricao: this.t('appearance.language.description'),
        valor: appearancePrefs.language,
        tipo: 'select' as const,
        opcoes: [
          { label: this.t('settings.locale.ptBR'), value: 'pt-BR' },
          { label: this.t('settings.locale.enUS'), value: 'en-US' },
          { label: this.t('settings.locale.esES'), value: 'es-ES' },
          { label: this.t('settings.locale.frFR'), value: 'fr-FR' }
        ],
        categoria: 'aparencia',
        obrigatorio: false
      },
      {
        id: 'densidade_interface',
        nome: this.t('appearance.density'),
        descricao: this.t('appearance.density.description'),
        valor: appearancePrefs.density,
        tipo: 'select' as const,
        opcoes: [
          { label: this.t('appearance.density.compact'), value: 'compact' },
          { label: this.t('appearance.density.normal'), value: 'normal' },
          { label: this.t('appearance.density.spacious'), value: 'spacious' }
        ],
        categoria: 'aparencia',
        obrigatorio: false
      },
      {
        id: 'tamanho_fonte',
        nome: this.t('appearance.fontSize'),
        descricao: this.t('appearance.fontSize.description'),
        valor: appearancePrefs.fontSize,
        tipo: 'select' as const,
        opcoes: [
          { label: this.t('appearance.fontSize.small'), value: 'small' },
          { label: this.t('appearance.fontSize.medium'), value: 'medium' },
          { label: this.t('appearance.fontSize.large'), value: 'large' }
        ],
        categoria: 'aparencia',
        obrigatorio: false
      },
      {
        id: 'animacoes',
        nome: this.t('appearance.animations'),
        descricao: this.t('appearance.animations.description'),
        valor: appearancePrefs.animationsEnabled,
        tipo: 'boolean' as const,
        categoria: 'aparencia',
        obrigatorio: false
      }
    ];
    
    this.configuracoes = configuracoesAparencia;
  }

  private canManageSystemConfig(user = this.authService.getCurrentUser()): boolean {
    if (!user) {
      return false;
    }
    if (isSuperPerfil(user)) {
      return true;
    }
    const codes = new Set((user.funcionalidadeCodigos ?? []).map(canonFuncionalidadeCodigo));
    return codes.has('CONFIGURACOES') || codes.has('GERENCIAR_PERMISSOES');
  }

  getConfiguracoesPorCategoria(categoriaId: string): Configuracao[] {
    return this.configuracoes.filter(config => config.categoria === categoriaId);
  }

  salvarTodas(): void {
    void this.runSalvarTodas();
  }

  private async runSalvarTodas(): Promise<void> {
    const aparenciaConfigs = this.configuracoes.filter(c => c.categoria === 'aparencia');

    aparenciaConfigs.forEach(config => {
      switch (config.id) {
        case 'tema':
          this.appearanceService.setTheme(config.valor as ThemeMode);
          break;
        case 'idioma_sistema':
          this.appearanceService.setLanguage(config.valor as string);
          break;
        case 'densidade_interface':
          this.appearanceService.setDensity(config.valor as InterfaceDensity);
          break;
        case 'tamanho_fonte':
          this.appearanceService.setFontSize(config.valor as FontSize);
          break;
        case 'animacoes':
          this.appearanceService.setAnimationsEnabled(config.valor as boolean);
          break;
      }
    });

    if (!this.empresaPanel?.canEdit) {
      toastKey(this.messageService, this.translationService, 'success', 'settings.saved', 'settings.savedDetail');
      return;
    }

    if (this.salvandoAdmin) {
      return;
    }

    this.salvandoAdmin = true;

    try {
      if (this.empresaPanel?.canEdit) {
        const empresaOk = await this.empresaPanel.saveFromParent(false, { silent: true });
        if (!empresaOk) {
          this.messageService.add({
            severity: 'warn',
            summary: this.translationService.translate('common.toast.warn'),
            detail: this.translationService.translate('settings.saveAllEmpresaFailed'),
          });
          return;
        }
      }

      toastKey(this.messageService, this.translationService, 'success', 'settings.saved', 'settings.savedDetail');
    } finally {
      this.salvandoAdmin = false;
    }
  }

  restaurarPadroes() {
    this.appearanceService.resetToDefaults();
    this.carregarConfiguracoes();
    toastKey(this.messageService, this.translationService, 'info', 'settings.restored', 'settings.restoredDetail');
  }

  private carregandoStatus = false;
  
  carregarStatusAtualizacao() {
    // Evitar múltiplas chamadas simultâneas
    if (this.carregandoStatus) {
      return;
    }
    
    this.carregandoStatus = true;
    
    this.atualizacaoService.getStatus().subscribe({
      next: (status) => {
        this.atualizacaoStatus = status;
        
        // Se o status for concluído ou cancelado, limpar progresso para fazer o accordion desaparecer
        if (status && (status.status === 'PRONTA_PARA_INSTALACAO' || status.status === 'CONCLUIDA' || status.status === 'CANCELADA')) {
          this.progressoAtualizacao = null;
          this.accordionAtualizacaoAberto = null;
        }
        
        // Sempre atualizar versão atual do sistema, mesmo quando não há atualização
        if (status && status.versaoAtual) {
          this.versaoAtualSistema = status.versaoAtual;
        } else if (status && (status as any).versaoAtual) {
          // Caso o backend retorne versaoAtual mesmo sem atualização
          this.versaoAtualSistema = (status as any).versaoAtual;
        }
        
        this.carregandoStatus = false;
      },
      error: (error) => {
        console.error('Failed to load update status:', error);
        // Se não houver atualização disponível, status será null
        this.atualizacaoStatus = null;
        this.carregandoStatus = false;
      }
    });
  }

  verificarAtualizacoes() {
    
    // Resetar estados
    this.verificacaoConcluida = false;
    this.progressoVerificacao = 0;
    Object.keys(this.verificacaoSteps).forEach(key => {
      this.verificacaoSteps[key as keyof typeof this.verificacaoSteps].ativo = false;
      this.verificacaoSteps[key as keyof typeof this.verificacaoSteps].concluido = false;
    });
    
    this.verificandoAtualizacao = true;
    
    // Passo 1: Conectando
    setTimeout(() => {
      this.verificacaoSteps.conectando.ativo = true;
      this.progressoVerificacao = 10;
    }, 100);
    
    // Passo 2: Verificando
    setTimeout(() => {
      this.verificacaoSteps.conectando.ativo = false;
      this.verificacaoSteps.conectando.concluido = true;
      this.verificacaoSteps.verificando.ativo = true;
      this.progressoVerificacao = 40;
    }, 800);
    
    // Passo 3: Comparando
    setTimeout(() => {
      this.verificacaoSteps.verificando.ativo = false;
      this.verificacaoSteps.verificando.concluido = true;
      this.verificacaoSteps.comparando.ativo = true;
      this.progressoVerificacao = 70;
    }, 1500);
    
    // Chamar endpoint de verificação manual
    this.atualizacaoService.verificarAtualizacao().subscribe({
      next: (response: any) => {
        
        // Passo 4: Concluído
        setTimeout(() => {
          this.verificacaoSteps.comparando.ativo = false;
          this.verificacaoSteps.comparando.concluido = true;
          this.verificacaoSteps.concluido.ativo = true;
          this.progressoVerificacao = 100;
          
          setTimeout(() => {
            this.verificacaoSteps.concluido.concluido = true;
            this.verificacaoSteps.concluido.ativo = false;
            this.verificacaoConcluida = true;
            this.verificandoAtualizacao = false;
            
            // Fechar o card após 3 segundos
            setTimeout(() => {
              this.verificacaoConcluida = false;
              this.progressoVerificacao = 0;
              // Resetar todos os passos
              Object.keys(this.verificacaoSteps).forEach(key => {
                this.verificacaoSteps[key as keyof typeof this.verificacaoSteps].ativo = false;
                this.verificacaoSteps[key as keyof typeof this.verificacaoSteps].concluido = false;
              });
            }, 3000);
          }, 500);
        }, 500);
        
        // Atualizar versão atual e encontrada imediatamente da resposta
        if (response.versaoAtual) {
          this.versaoAtualSistema = response.versaoAtual;
        }
        
        // Sempre atualizar a versão verificada do Google Drive
        if (response.versaoEncontrada) {
          this.versaoVerificadaGoogleDrive = response.versaoEncontrada;
        }
        
        if (response.versaoEncontrada) {
          // Se houver versão encontrada diferente da atual, atualizar o status
          if (response.temAtualizacao) {
            toastKey(this.messageService, this.translationService, 'success', 'config.update.toast.newVersionTitle', 'config.update.toast.newVersionDetail', {
              found: String(response.versaoEncontrada || ''),
              current: String(response.versaoAtual || '')
            }, 5000);
          } else {
            toastKey(this.messageService, this.translationService, 'info', 'config.update.toast.systemUpdatedTitle', 'config.update.toast.systemUpdatedDetail', {
              current: String(response.versaoAtual || ''),
              found: String(response.versaoEncontrada || '')
            }, 5000);
          }
        } else {
          this.versaoVerificadaGoogleDrive = null;
          toastKey(this.messageService, this.translationService, 'info', 'config.update.toast.checkDoneTitle', 'config.update.toast.checkDoneDetail', {
            current: String(response.versaoAtual || this.versaoAtualSistema || '')
          }, 5000);
        }
        
        // Recarregar status imediatamente para atualizar a UI
        this.carregarStatusAtualizacao();
        
        // Aguardar um pouco e recarregar status novamente para garantir
        setTimeout(() => {
          this.carregarStatusAtualizacao();
        }, 2000);
      },
      error: (error) => {
        console.error('Failed to check for updates:', error);
        
        // Resetar estados em caso de erro
        this.verificacaoSteps.conectando.ativo = false;
        this.verificacaoSteps.verificando.ativo = false;
        this.verificacaoSteps.comparando.ativo = false;
        this.progressoVerificacao = 0;
        this.verificandoAtualizacao = false;
        
        toastKey(this.messageService, this.translationService, 'error', 'common.toast.error', 'config.update.toast.checkErrorDetail', {
          error: String(error?.message || this.t('ui.error.generic'))
        });
      }
    });
  }

  // Modal de instalação
  mostrarModalInstalacao = false;
  instalacaoSteps = {
    backup: { ativo: false, concluido: false, progresso: 0, descricao: '' },
    download: { ativo: false, concluido: false, progresso: 0, descricao: '' },
    instalacao: { ativo: false, concluido: false, progresso: 0, descricao: '' },
    restart: { ativo: false, concluido: false, progresso: 0, descricao: '' }
  };
  contadorRestart = 0;
  mensagemInstalacao = '';

  confirmarDownloadAtualizacao() {
    if (!this.isAdmin) {
      toastKey(this.messageService, this.translationService, 'error', 'config.update.toast.accessDeniedTitle', 'config.update.toast.adminOnlyDetail');
      return;
    }

    if (!this.atualizacaoStatus || !this.atualizacaoStatus.id) {
      return;
    }

    // Abrir modal de instalação
    this.mostrarModalInstalacao = true;
    this.resetarInstalacaoSteps();
    this.baixarEInstalarAtualizacao();
  }

  resetVerificacaoSteps(): void {
    this.verificacaoSteps = {
      conectando: { ativo: false, concluido: false, descricao: this.t('config.update.verify.connecting') },
      verificando: { ativo: false, concluido: false, descricao: this.t('config.update.verify.checking') },
      comparando: { ativo: false, concluido: false, descricao: this.t('config.update.verify.comparing') },
      concluido: { ativo: false, concluido: false, descricao: this.t('config.update.verify.done') }
    };
  }

  resetarInstalacaoSteps() {
    this.instalacaoSteps = {
      backup: { ativo: false, concluido: false, progresso: 0, descricao: this.t('config.update.install.prepBackup') },
      download: { ativo: false, concluido: false, progresso: 0, descricao: this.t('config.update.install.waitDownload') },
      instalacao: { ativo: false, concluido: false, progresso: 0, descricao: this.t('config.update.install.waitInstall') },
      restart: { ativo: false, concluido: false, progresso: 0, descricao: this.t('config.update.install.waitRestart') }
    };
    this.contadorRestart = 0;
    this.mensagemInstalacao = '';
  }

  cancelarAtualizacao() {
    // Obter o ID da atualização (priorizar progressoAtualizacao que é mais atualizado)
    const atualizacaoId = this.progressoAtualizacao?.updateId 
      ? parseInt(this.progressoAtualizacao.updateId) 
      : (this.atualizacaoStatus?.id || null);
    
    if (!atualizacaoId) {
      console.warn('Could not cancel: update ID not found');
      toastKey(this.messageService, this.translationService, 'warn', 'common.toast.warn', 'config.update.toast.cancelIdNotFound');
      return;
    }

    this.confirmationService.confirm({
      message: 'confirm.config.cancelUpdate.message',
      header: 'confirm.header.cancelUpdate',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesCancel',
      rejectLabel: 'common.confirm.noShort',
      accept: () => {
        this.mensagemInstalacao = this.t('config.update.install.cancelling');
        this.atualizacaoService.cancelarAtualizacao(atualizacaoId).subscribe({
          next: () => {
            toastKey(this.messageService, this.translationService, 'info', 'config.update.toast.cancelledTitle', 'config.update.toast.cancelledDetail');
            this.mostrarModalInstalacao = false;
            this.resetarInstalacaoSteps();
            // Recarregar status apenas uma vez após um pequeno delay
            setTimeout(() => {
              if (!this.carregandoStatus) {
                this.carregarStatusAtualizacao();
              }
            }, 1000);
          },
          error: (error) => {
            console.error('Failed to cancel update:', error);
            toastKey(this.messageService, this.translationService, 'error', 'common.toast.error', 'config.update.toast.cancelError');
          }
        });
      }
    });
  }

  baixarEInstalarAtualizacao() {
    if (!this.atualizacaoStatus || !this.atualizacaoStatus.id) {
      this.mostrarModalInstalacao = false;
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      toastKey(this.messageService, this.translationService, 'error', 'common.toast.error', 'config.update.toast.userNotAuthenticated');
      this.mostrarModalInstalacao = false;
      return;
    }

    // Verificar se é administrador
    if (!this.isAdmin) {
      toastKey(this.messageService, this.translationService, 'error', 'config.update.toast.accessDeniedTitle', 'config.update.toast.adminOnlyDetail');
      this.mostrarModalInstalacao = false;
      return;
    }

    // Iniciar processo de instalação
    this.mensagemInstalacao = this.t('config.update.install.starting');
    
    // Passo 1: Backup
    setTimeout(() => {
      this.instalacaoSteps.backup.ativo = true;
      this.instalacaoSteps.backup.descricao = this.t('config.update.install.creatingBackup');
      this.simularProgresso('backup', 2000);
    }, 500);

    // Aprovar atualização
    this.atualizacaoService.aprovarAtualizacao(this.atualizacaoStatus.id).subscribe({
      next: (status) => {
        this.atualizacaoStatus = status;
        this.mensagemInstalacao = this.t('config.update.install.approved', {
          version: status.versaoDisponivel ?? ''
        });
        
        // Concluir backup e iniciar download
        setTimeout(() => {
          this.instalacaoSteps.backup.ativo = false;
          this.instalacaoSteps.backup.concluido = true;
          this.instalacaoSteps.backup.progresso = 100;
          this.instalacaoSteps.backup.descricao = this.t('config.update.install.backupDone');
          
          // Iniciar download
          this.instalacaoSteps.download.ativo = true;
          this.instalacaoSteps.download.descricao = this.t('config.update.install.downloading');
          this.simularProgresso('download', 5000);
        }, 2500);
      },
      error: (error) => {
        console.error('Failed to approve update:', error);
        this.mensagemInstalacao = this.t('config.update.install.approveErrorDetail', {
          error: String(error?.message || this.t('ui.error.generic'))
        });
        this.instalacaoSteps.backup.ativo = false;
        toastKey(this.messageService, this.translationService, 'error', 'common.toast.error', 'config.update.toast.approveError');
      }
    });
  }

  simularProgresso(step: 'backup' | 'download' | 'instalacao', duracao: number) {
    const intervalo = 50; // Atualizar a cada 50ms
    const incremento = 100 / (duracao / intervalo);
    let progresso = 0;

    const timer = setInterval(() => {
      progresso += incremento;
      if (progresso >= 100) {
        progresso = 100;
        clearInterval(timer);
        
        // Concluir etapa atual e iniciar próxima
        this.instalacaoSteps[step].progresso = 100;
        this.instalacaoSteps[step].ativo = false;
        this.instalacaoSteps[step].concluido = true;
        
        if (step === 'backup') {
          // Já tratado no callback de aprovação
        } else if (step === 'download') {
          // Iniciar instalação
          setTimeout(() => {
            this.instalacaoSteps.download.descricao = this.t('config.update.install.downloadDone');
            this.instalacaoSteps.instalacao.ativo = true;
            this.instalacaoSteps.instalacao.descricao = this.t('config.update.install.installing');
            this.simularProgresso('instalacao', 3000);
          }, 500);
        } else if (step === 'instalacao') {
          // Instalação concluída, aguardar restart
          setTimeout(() => {
            this.instalacaoSteps.instalacao.descricao = this.t('config.update.install.completed');
            this.instalacaoSteps.restart.ativo = true;
            this.instalacaoSteps.restart.descricao = this.t('config.update.install.preparingRestart');
            this.iniciarContagemRestart();
          }, 500);
        }
      } else {
        this.instalacaoSteps[step].progresso = progresso;
      }
    }, intervalo);
  }

  iniciarContagemRestart() {
    this.contadorRestart = 10;
    const timer = setInterval(() => {
      this.contadorRestart--;
      this.instalacaoSteps.restart.progresso = ((10 - this.contadorRestart) / 10) * 100;
      
      if (this.contadorRestart <= 0) {
        clearInterval(timer);
        this.contadorRestart = 0;
        this.instalacaoSteps.restart.progresso = 100;
        this.instalacaoSteps.restart.descricao = this.t('config.update.install.restartingNow');
        this.mensagemInstalacao = this.t('config.update.install.reloadingPage');
        
        // Recarregar página após 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        this.instalacaoSteps.restart.descricao = this.t('config.update.install.restartCountdown', { n: this.contadorRestart });
        this.mensagemInstalacao = this.t('config.update.install.completedRestart', { n: this.contadorRestart });
      }
    }, 1000);
  }

  // Métodos para controle do progresso visual
  getProgressTitle(): string {
    if (!this.progressoAtualizacao && this.atualizacaoStatus?.status === 'EM_ANDAMENTO') {
      return this.t('config.update.progress.title.inProgress');
    }
    
    if (this.progressoAtualizacao) {
      switch (this.progressoAtualizacao.status) {
        case 'DISPONIVEL':
          return this.t('config.update.progress.title.available');
        case 'APROVADA':
          return this.t('config.update.progress.title.preparing');
        case 'EM_ANDAMENTO':
          return this.t('config.update.progress.title.downloading');
      case 'PRONTA_PARA_INSTALACAO':
        return this.t('config.update.progress.title.ready');
      case 'CONCLUIDA':
        return this.t('config.update.progress.title.completed');
      case 'REINICIANDO':
        return this.t('config.update.progress.title.restarting');
      case 'CANCELADA':
        return this.t('config.update.progress.title.cancelled');
      default:
        return this.t('config.update.progress.title.processing');
      }
    }
    
    return this.t('config.update.progress.title.checking');
  }

  getProgressPercentage(): number {
    if (!this.progressoAtualizacao && this.atualizacaoStatus?.status === 'EM_ANDAMENTO') {
      return 25; // Progresso inicial
    }
    
    if (!this.progressoAtualizacao) {
      return 0;
    }

    const status = this.progressoAtualizacao.status;
    const hints = this.progressStepHints(this.progressoAtualizacao.mensagem);
    
    switch (status) {
      case 'DISPONIVEL':
        return 10;
      case 'APROVADA':
        return 20;
      case 'EM_ANDAMENTO':
        // Progresso baseado no passo: 0=25%, 1=50%, 2=75%, 3=100%
        if (hints.creating) {
          return 50; // Passo 1: Criando pasta
        } else if (hints.downloading) {
          return 75; // Passo 2: Baixando arquivo
        } else {
          return 25; // Passo 0: Verificação
        }
      case 'PRONTA_PARA_INSTALACAO':
      case 'CONCLUIDA':
        return 100;
      case 'CANCELADA':
        return 0;
      default:
        return 0;
    }
  }

  getProgressMessage(): string {
    if (this.progressoAtualizacao?.mensagem) {
      return this.tm(this.progressoAtualizacao.mensagem);
    }
    
    if (this.atualizacaoStatus?.mensagem) {
      return this.tm(this.atualizacaoStatus.mensagem);
    }
    
    return this.t('config.update.progress.processing');
  }

  private progressStepHints(message?: string | null): { creating: boolean; downloading: boolean } {
    const m = message ?? '';
    if (isBackendI18nMessage(m)) {
      return {
        creating:
          m.includes('creatingFolders') ||
          m.includes('backupJar') ||
          m.includes('backupConfig') ||
          m.includes('backupFrontend') ||
          m.includes('finishingBackup'),
        downloading: m.includes('downloadingDrive') || m.includes('backupDoneDownload'),
      };
    }
    const lower = m.toLowerCase();
    return {
      creating: lower.includes('criando') || lower.includes('backup'),
      downloading: lower.includes('baixando') || lower.includes('download'),
    };
  }

  isStepActive(stepIndex: number): boolean {
    if (!this.progressoAtualizacao && this.atualizacaoStatus?.status === 'EM_ANDAMENTO') {
      return stepIndex === 0; // Verificação ativa se em andamento sem detalhes
    }
    
    if (!this.progressoAtualizacao) {
      return stepIndex === 0; // Apenas verificação ativa
    }

    const status = this.progressoAtualizacao.status;
    const hints = this.progressStepHints(this.progressoAtualizacao.mensagem);
    
    switch (stepIndex) {
      case 0: // Verificação
        return status === 'DISPONIVEL' || status === 'APROVADA' || 
               (status === 'EM_ANDAMENTO' && !hints.creating && !hints.downloading);
      case 1: // Criando pasta do update
        return status === 'EM_ANDAMENTO' && hints.creating;
      case 2: // Baixando arquivo
        return status === 'EM_ANDAMENTO' && hints.downloading;
      case 3: // Concluído
        return status === 'PRONTA_PARA_INSTALACAO' || status === 'CONCLUIDA';
      default:
        return false;
    }
  }

  isStepCompleted(stepIndex: number): boolean {
    if (!this.progressoAtualizacao && this.atualizacaoStatus?.status === 'CONCLUIDA') {
      return stepIndex <= 3; // Todos completos se concluído
    }
    
    if (!this.progressoAtualizacao) {
      return false;
    }

    const status = this.progressoAtualizacao.status;
    
    if (status === 'PRONTA_PARA_INSTALACAO' || status === 'CONCLUIDA') {
      return stepIndex <= 3; // Todos completos
    }
    
    if (status === 'CANCELADA') {
      return false; // Nenhum completo se cancelado
    }

    // Verificar se o step anterior ao ativo está completo
    const activeStep = this.getActiveStepIndex();
    return stepIndex < activeStep;
  }

  getActiveStepIndex(): number {
    if (!this.progressoAtualizacao && this.atualizacaoStatus?.status === 'EM_ANDAMENTO') {
      return 0; // Verificação
    }
    
    if (!this.progressoAtualizacao) {
      return 0;
    }

    const status = this.progressoAtualizacao.status;
    const hints = this.progressStepHints(this.progressoAtualizacao.mensagem);
    
    if (status === 'DISPONIVEL' || status === 'APROVADA') {
      return 0; // Verificação
    }
    
    if (status === 'EM_ANDAMENTO') {
      if (hints.creating) {
        return 1; // Criando pasta
      } else if (hints.downloading) {
        return 2; // Baixando arquivo
      } else {
        return 0; // Verificação (padrão)
      }
    }
    
    if (status === 'PRONTA_PARA_INSTALACAO' || status === 'CONCLUIDA') {
      return 3; // Concluído
    }
    
    return 0;
  }

  formatCountdown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  atualizarInstalacaoDoProgresso(progress: AtualizacaoProgress) {
    // Se foi cancelada, fechar modal e mostrar mensagem
    if (progress.status === 'CANCELADA') {
      this.mensagemInstalacao = progress.mensagem
        ? this.tm(progress.mensagem)
        : this.t('config.update.install.cancelled');
      this.instalacaoSteps.backup.ativo = false;
      this.instalacaoSteps.download.ativo = false;
      this.instalacaoSteps.instalacao.ativo = false;
      this.instalacaoSteps.restart.ativo = false;
      
      // Verificar se a mensagem não é de erro (cancelamento pelo usuário vs erro)
      const isCancelamentoUsuario = isCancelledByUserBackendMessage(progress.mensagem);
      
      if (isCancelamentoUsuario) {
        toastKey(this.messageService, this.translationService, 'info', 'config.update.toast.cancelledTitle', 'config.update.toast.cancelledDetail');
      } else {
        // Foi cancelada por erro
        toastKey(this.messageService, this.translationService, 'warn', 'config.update.toast.cancelledTitle', 'config.update.toast.cancelledByError', {
          message: this.tm(progress.mensagem)
        });
      }
      
      // Fechar modal após 2 segundos
      setTimeout(() => {
        this.mostrarModalInstalacao = false;
        this.resetarInstalacaoSteps();
        // Recarregar status apenas uma vez
        if (!this.carregandoStatus) {
          this.carregarStatusAtualizacao();
        }
      }, 2000);
      return;
    }
    
    // Atualizar baseado no status e contador regressivo
    if (progress.status === 'APROVADA') {
      // Backup em andamento
      if (!this.instalacaoSteps.backup.concluido) {
        this.instalacaoSteps.backup.ativo = true;
        this.instalacaoSteps.backup.descricao = this.t('config.update.install.creatingBackup');
        if (progress.contadorRegressivo !== null && progress.contadorRegressivo !== undefined) {
          // Usar contador regressivo para calcular progresso (300 segundos total)
          const progresso = ((300 - progress.contadorRegressivo) / 300) * 100;
          this.instalacaoSteps.backup.progresso = Math.min(100, Math.max(0, progresso));
        }
      }
    } else if (progress.status === 'EM_ANDAMENTO') {
      // Download e instalação
      if (this.instalacaoSteps.backup.concluido && !this.instalacaoSteps.download.concluido) {
        this.instalacaoSteps.download.ativo = true;
        this.instalacaoSteps.download.descricao = progress.mensagem
          ? this.tm(progress.mensagem)
          : this.t('config.update.install.downloading');
        if (progress.contadorRegressivo !== null && progress.contadorRegressivo !== undefined) {
          // Contador regressivo durante EM_ANDAMENTO indica progresso
          if (progress.contadorRegressivo > 200) {
            // Download (200-300 segundos restantes)
            const progresso = ((300 - progress.contadorRegressivo) / 100) * 100;
            this.instalacaoSteps.download.progresso = Math.min(100, Math.max(0, progresso));
          } else if (progress.contadorRegressivo > 100) {
            // Extração (100-200 segundos restantes)
            this.instalacaoSteps.download.concluido = true;
            this.instalacaoSteps.download.progresso = 100;
            this.instalacaoSteps.instalacao.ativo = true;
            this.instalacaoSteps.instalacao.descricao = this.t('config.update.install.extracting');
            const progresso = ((200 - progress.contadorRegressivo) / 100) * 50;
            this.instalacaoSteps.instalacao.progresso = Math.min(50, Math.max(0, progresso));
          } else if (progress.contadorRegressivo > 0) {
            // Instalação (0-100 segundos restantes)
            this.instalacaoSteps.instalacao.ativo = true;
            this.instalacaoSteps.instalacao.descricao = this.t('config.update.install.installing');
            const progresso = 50 + ((100 - progress.contadorRegressivo) / 100) * 50;
            this.instalacaoSteps.instalacao.progresso = Math.min(100, Math.max(50, progresso));
          }
        }
      } else if (this.instalacaoSteps.download.concluido && !this.instalacaoSteps.instalacao.concluido) {
        this.instalacaoSteps.instalacao.ativo = true;
        this.instalacaoSteps.instalacao.descricao = progress.mensagem
          ? this.tm(progress.mensagem)
          : this.t('config.update.install.installing');
      }
    } else if (progress.status === 'CONCLUIDA' || progress.status === 'REINICIANDO') {
      // Instalação concluída, iniciar restart
      this.instalacaoSteps.instalacao.concluido = true;
      this.instalacaoSteps.instalacao.progresso = 100;
      this.instalacaoSteps.restart.ativo = true;
      
      if (progress.contadorRegressivo !== null && progress.contadorRegressivo !== undefined) {
        this.contadorRestart = progress.contadorRegressivo;
        this.instalacaoSteps.restart.progresso = ((10 - this.contadorRestart) / 10) * 100;
        this.instalacaoSteps.restart.descricao = this.t('config.update.install.restartCountdown', { n: this.contadorRestart });
        this.mensagemInstalacao = progress.mensagem
          ? this.tm(progress.mensagem)
          : this.t('config.update.install.completedRestart', { n: this.contadorRestart });
      } else {
        this.instalacaoSteps.restart.descricao = this.t('config.update.install.restartingSystem');
        this.mensagemInstalacao = progress.mensagem
          ? this.tm(progress.mensagem)
          : this.t('config.update.install.completedRestartImmediate');
      }
    }
    
    // Atualizar mensagem geral
    if (progress.mensagem) {
      this.mensagemInstalacao = this.tm(progress.mensagem);
    }
  }

  podeCancelarAtualizacao(): boolean {
    // Verificar se há uma atualização ativa (via progressoAtualizacao ou atualizacaoStatus)
    const temAtualizacaoAtiva = 
      (this.progressoAtualizacao && this.progressoAtualizacao.updateId) ||
      (this.atualizacaoStatus && this.atualizacaoStatus.id);
    
    if (!temAtualizacaoAtiva) {
      return false;
    }

    // Obter o status atual (priorizar progressoAtualizacao que é mais atualizado)
    const status = this.progressoAtualizacao?.status || this.atualizacaoStatus?.status;
    
    // Não pode cancelar se já foi cancelada ou concluída
    if (status === 'CANCELADA' || status === 'CONCLUIDA') {
      return false;
    }
    
    // Permitir cancelar em QUALQUER outro status (DISPONIVEL, APROVADA, EM_ANDAMENTO, REINICIANDO, etc.)
    // O usuário deve poder cancelar a qualquer momento durante o processo
    return true;
  }

  estaReiniciando(): boolean {
    // Não desabilitar o botão mesmo durante reinicialização - permitir cancelar até o último momento
    // O backend vai tratar adequadamente se já estiver muito avançado
    return false;
  }
}
