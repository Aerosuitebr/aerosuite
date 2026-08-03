import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UsuarioExternoService, UsuarioExterno, FuncionalidadeExterna, OSExternaResumo, DocumentoExterno } from '../core/usuario-externo.service';
import { AuthService } from '../auth/auth.service';
import { TranslationService } from '../core/translation.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { environment } from '../../environments/environment';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { toastKey } from '../core/toast-i18n.util';

interface OSItem {
  id: number;
  idOs: number;
  clienteNome: string;
  partNumber: string;
  serialNumber: string;
  tipoServico: string;
  dtAbertura: string;
  status?: string;
  selected?: boolean;
  documentosCount?: number;
}

interface DocumentoOS {
  id: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  fileExtension: string;
  selected?: boolean;
  isAvulso?: boolean; // Indica se é um documento avulso (pasta diversos)
}

@Component({
  standalone: true,
  selector: 'app-usuario-externo-permissoes',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    MultiSelectModule,
    TabViewModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    InputTextModule,
    BadgeModule,
    ProgressSpinnerModule,
    DialogModule,
    TranslatePipe,
    PageHeroComponent
  ],

  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideInRight', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    
    <div class="as-page permissoes-container">
      <app-page-hero
        *ngIf="usuario"
        variant="navy"
        [title]="usuario.nome"
        subtitleKey="usuariosExternos.permissoes.subtitle"
        titleIcon="pi-shield"
        [hasActions]="true">
        <div actions>
          <button pButton icon="pi pi-arrow-left"
                  [label]="'usuariosExternos.permissoes.btnBack' | translate"
                  class="p-button-text"
                  routerLink="/usuarios-externos">
          </button>
        </div>
      </app-page-hero>

      <!-- Tabs -->
      <p-tabView [(activeIndex)]="activeTabIndex">
        <!-- Funcionalidades -->
        <p-tabPanel [header]="'usuariosExternos.permissoes.tab.funcionalidades' | translate">
          <div class="tab-content" @fadeInUp>
            <div class="tab-header">
              <h3>
                <i class="pi pi-th-large"></i>
                {{ 'usuariosExternos.permissoes.func.title' | translate }}
              </h3>
              <p>{{ 'usuariosExternos.permissoes.func.desc' | translate }}</p>
            </div>

            <div class="funcionalidades-grid">
              <div class="func-card" *ngFor="let func of todasFuncionalidades" 
                   [class.selected]="isFuncionalidadeSelecionada(func.id)">
                <div class="func-checkbox">
                  <p-checkbox [(ngModel)]="funcionalidadesSelecionadas"
                              [value]="func.id"
                              [binary]="false">
                  </p-checkbox>
                </div>
                <div class="func-icon">
                  <i [class]="func.icone || 'pi pi-circle'"></i>
                </div>
                <div class="func-info">
                  <h4>{{ func.nome }}</h4>
                  <p>{{ func.descricao || ('usuariosExternos.permissoes.func.noDescription' | translate) }}</p>
                </div>
              </div>
            </div>

            <div class="tab-actions">
              <button pButton [label]="'usuariosExternos.permissoes.func.btnSave' | translate" 
                      icon="pi pi-check"
                      (click)="salvarFuncionalidades()"
                      [loading]="savingFuncs">
              </button>
            </div>
          </div>
        </p-tabPanel>

        <!-- Ordens de Serviço e Documentos -->
        <p-tabPanel [header]="'usuariosExternos.permissoes.tab.osDocumentos' | translate">
          <div class="tab-content os-docs-tab" @fadeInUp>
            <div class="tab-header-with-action">
              <div class="tab-header-text">
                <h3>
                  <i class="pi pi-file-edit"></i>
                  {{ 'usuariosExternos.permissoes.osDocs.title' | translate }}
                </h3>
                <p>{{ 'usuariosExternos.permissoes.osDocs.desc' | translate }}</p>
              </div>
              <div class="tab-header-action">
                <button pButton 
                        [label]="'usuariosExternos.permissoes.osDocs.btnSave' | translate" 
                        icon="pi pi-check"
                        class="p-button-success save-btn-header"
                        [loading]="savingDocs"
                        [disabled]="!canSaveOSPermissions()"
                        (click)="salvarPermissoesOS()">
                </button>
              </div>
            </div>

            <div class="split-panel">
              <!-- Painel Esquerdo: Lista de OS -->
              <div class="panel os-panel">
                <div class="panel-header">
                  <div class="panel-title">
                    <i class="pi pi-folder-open"></i>
                    <span>{{ 'usuariosExternos.permissoes.panel.osTitle' | translate }}</span>
                  </div>
                  <div class="search-box">
                    <i class="pi pi-search"></i>
                    <input type="text" 
                           pInputText 
                           [(ngModel)]="osBusca" 
                           [placeholder]="'usuariosExternos.permissoes.search.os' | translate"
                           (input)="filtrarOS()">
                    <button *ngIf="osBusca" 
                            pButton 
                            icon="pi pi-times" 
                            class="p-button-text p-button-sm clear-btn"
                            (click)="limparBuscaOS()">
                    </button>
                  </div>
                </div>

                <div class="panel-content">
                  <!-- Loading -->
                  <div class="loading-state" *ngIf="loadingOS">
                    <p-progressSpinner strokeWidth="3" [style]="{width: '40px', height: '40px'}"></p-progressSpinner>
                    <span>{{ 'usuariosExternos.permissoes.loading.os' | translate }}</span>
                  </div>

                  <!-- Lista de OS -->
                  <div class="os-list" *ngIf="!loadingOS" [@listAnimation]="osListaFiltrada.length">
                    <div class="os-item" 
                         *ngFor="let os of osListaFiltrada; trackBy: trackByOsId"
                         [class.selected]="osSelecionada?.id === os.id"
                         [class.has-access]="osLiberadasIds.has(os.id)"
                         (click)="selecionarOS(os)">
                      <div class="os-icon" [class.active]="osLiberadasIds.has(os.id)">
                        <i class="pi" [class.pi-check-circle]="osLiberadasIds.has(os.id)" 
                           [class.pi-file]="!osLiberadasIds.has(os.id)"></i>
                      </div>
                      <div class="os-details">
                        <div class="os-number">
                          <span class="os-id">OS {{ os.id }}</span>
                          <p-tag *ngIf="osLiberadasIds.has(os.id)" 
                                 [value]="'usuariosExternos.permissoes.tag.released' | translate" 
                                 severity="success" 
                                 [rounded]="true"
                                 styleClass="tag-small">
                          </p-tag>
                        </div>
                        <div class="os-client">{{ os.clienteNome || ('usuariosExternos.permissoes.clientNotInformed' | translate) }}</div>
                        <div class="os-meta">
                          <span *ngIf="os.partNumber"><i class="pi pi-tag"></i> {{ os.partNumber }}</span>
                          <span *ngIf="os.tipoServico"><i class="pi pi-wrench"></i> {{ os.tipoServico }}</span>
                        </div>
                      </div>
                      <div class="os-actions-inline" *ngIf="osLiberadasIds.has(os.id)">
                        <button pButton 
                                icon="pi pi-trash" 
                                class="p-button-rounded p-button-text p-button-danger p-button-sm"
                                [pTooltip]="'usuariosExternos.permissoes.tooltip.revokeAllOs' | translate"
                                tooltipPosition="left"
                                (click)="revogarTodasPermissoesOS(os, $event)">
                        </button>
                      </div>
                      <div class="os-arrow" *ngIf="!osLiberadasIds.has(os.id)">
                        <i class="pi pi-chevron-right"></i>
                      </div>
                    </div>

                    <!-- Estado vazio -->
                    <div class="empty-state" *ngIf="osListaFiltrada.length === 0 && !loadingOS">
                      <i class="pi pi-inbox"></i>
                      <p>{{ (osBusca ? 'usuariosExternos.permissoes.empty.osNotFound' : 'usuariosExternos.permissoes.empty.osNone') | translate }}</p>
                    </div>
                  </div>

                  <!-- Paginação simples -->
                  <div class="pagination" *ngIf="totalOS > osPageSize">
                    <button pButton 
                            icon="pi pi-chevron-left" 
                            class="p-button-text p-button-sm"
                            [disabled]="osPage === 0"
                            (click)="osPage = osPage - 1; carregarOS()">
                    </button>
                    <span class="page-info">{{ osPage + 1 }} / {{ Math.ceil(totalOS / osPageSize) }}</span>
                    <button pButton 
                            icon="pi pi-chevron-right" 
                            class="p-button-text p-button-sm"
                            [disabled]="(osPage + 1) * osPageSize >= totalOS"
                            (click)="osPage = osPage + 1; carregarOS()">
                    </button>
                  </div>
                </div>
              </div>

              <!-- Painel Direito: Documentos da OS -->
              <div class="panel docs-panel" [class.active]="osSelecionada">
                <div class="panel-header">
                  <div class="panel-title">
                    <i class="pi pi-file"></i>
                    <span>{{ 'usuariosExternos.permissoes.panel.docsTitle' | translate }}</span>
                    <div class="docs-counter" *ngIf="osSelecionada && getTotalSelecionados() > 0" @scaleIn>
                      <span class="counter-selected">{{ getTotalSelecionados() }}</span>
                      <span class="counter-label">{{ 'usuariosExternos.permissoes.counter.toRelease' | translate }}</span>
                    </div>
                  </div>
                  <div class="search-box" *ngIf="osSelecionada">
                    <i class="pi pi-search"></i>
                    <input type="text" 
                           pInputText 
                           [(ngModel)]="docsBusca" 
                           [placeholder]="'usuariosExternos.permissoes.search.doc' | translate"
                           (input)="filtrarDocumentos()">
                    <button *ngIf="docsBusca" 
                            pButton 
                            icon="pi pi-times" 
                            class="p-button-text p-button-sm clear-btn"
                            (click)="limparBuscaDocs()">
                    </button>
                  </div>
                </div>

                <div class="panel-content">
                  <!-- Estado inicial: nenhuma OS selecionada -->
                  <div class="empty-state initial" *ngIf="!osSelecionada && !loadingDocs">
                    <i class="pi pi-arrow-left"></i>
                    <h4>{{ 'usuariosExternos.permissoes.empty.selectOsTitle' | translate }}</h4>
                    <p>{{ 'usuariosExternos.permissoes.empty.selectOsDesc' | translate }}</p>
                  </div>

                  <!-- Loading -->
                  <div class="loading-state" *ngIf="loadingDocs">
                    <p-progressSpinner strokeWidth="3" [style]="{width: '40px', height: '40px'}"></p-progressSpinner>
                    <span>{{ 'usuariosExternos.permissoes.loading.docs' | translate }}</span>
                  </div>

                  <!-- Info da OS selecionada -->
                  <div class="selected-os-info" *ngIf="osSelecionada && !loadingDocs" @slideInRight>
                    <div class="os-badge">
                      <i class="pi pi-folder-open"></i>
                      <span>OS {{ osSelecionada.id }}</span>
                    </div>
                    <span class="os-client-name">{{ osSelecionada.clienteNome }}</span>
                  </div>

                  <!-- Seção de Upload de Documentos Avulsos -->
                  <div class="avulsos-upload-section" *ngIf="osSelecionada && !loadingDocs" @fadeInUp>
                    <div class="avulsos-header" (click)="avulsosSectionExpanded = !avulsosSectionExpanded">
                      <i class="pi" [class.pi-chevron-down]="avulsosSectionExpanded" 
                         [class.pi-chevron-right]="!avulsosSectionExpanded"></i>
                      <i class="pi pi-cloud-upload avulsos-icon"></i>
                      <span>{{ 'usuariosExternos.permissoes.avulsos.uploadTitle' | translate }}</span>
                      <p-tag *ngIf="arquivosParaUpload.length > 0" 
                             [value]="'usuariosExternos.permissoes.tag.pending' | translate:{ count: String(arquivosParaUpload.length) }" 
                             severity="warning"
                             styleClass="tag-small">
                      </p-tag>
                    </div>
                    
                    <div class="avulsos-content" *ngIf="avulsosSectionExpanded" @fadeInUp>
                      <div class="upload-area-mini" 
                           [class.drag-over]="isDragOver"
                           (dragover)="onDragOver($event)"
                           (dragleave)="onDragLeave($event)"
                           (drop)="onDrop($event)"
                           (click)="fileInputAvulso.click()">
                        <input #fileInputAvulso 
                               type="file" 
                               multiple 
                               hidden 
                               (change)="onFilesSelected($event)">
                        <i class="pi pi-cloud-upload"></i>
                        <span>{{ 'usuariosExternos.permissoes.avulsos.uploadDrag' | translate }}</span>
                      </div>

                      <div class="upload-files-list" *ngIf="arquivosParaUpload.length > 0">
                        <div class="upload-file-item" *ngFor="let file of arquivosParaUpload; let i = index">
                          <div class="file-icon-mini" [ngClass]="getFileIconClassByName(file.name)">
                            <i [class]="getFileIconByName(file.name)"></i>
                          </div>
                          <span class="file-name-mini">{{ file.name }}</span>
                          <span class="file-size-mini">{{ formatFileSize(file.size) }}</span>
                          <button pButton 
                                  icon="pi pi-times" 
                                  class="p-button-text p-button-danger p-button-sm"
                                  (click)="removerArquivoUpload(i); $event.stopPropagation()">
                          </button>
                        </div>
                      </div>

                      <p class="avulsos-hint">
                        <i class="pi pi-info-circle"></i>
                        {{ 'usuariosExternos.permissoes.avulsos.savedPath' | translate:{ id: String(osSelecionada!.id) } }}
                      </p>
                    </div>
                  </div>

                  <!-- Separador -->
                  <div class="docs-separator" *ngIf="osSelecionada && !loadingDocs">
                    <span>{{ 'usuariosExternos.permissoes.panel.docsTitle' | translate }}</span>
                    <div class="separator-actions" *ngIf="documentosOS.length > 0">
                      <button pButton 
                              [label]="'usuariosExternos.permissoes.btn.selectAll' | translate" 
                              icon="pi pi-check-square"
                              class="p-button-text p-button-sm"
                              (click)="selecionarTodosDocumentos()">
                      </button>
                      <button pButton 
                              [label]="'usuariosExternos.permissoes.btn.clear' | translate" 
                              icon="pi pi-times"
                              class="p-button-text p-button-sm"
                              (click)="limparSelecaoDocumentos()">
                      </button>
                    </div>
                  </div>

                  <!-- Lista de Documentos -->
                  <div class="docs-list" *ngIf="osSelecionada && !loadingDocs" [@listAnimation]="docsListaFiltrada.length">
                    <div class="doc-item" 
                         *ngFor="let doc of docsListaFiltrada; trackBy: trackByDocId"
                         [class.selected]="doc.selected"
                         [class.doc-avulso]="doc.isAvulso"
                         @fadeInUp>
                      <div class="doc-checkbox">
                        <p-checkbox [(ngModel)]="doc.selected" 
                                    [binary]="true"
                                    (onChange)="onDocumentoSelectionChange()">
                        </p-checkbox>
                      </div>
                      <div class="doc-icon" [ngClass]="getFileIconClass(doc.fileExtension)">
                        <i [class]="getFileIcon(doc.fileExtension)"></i>
                      </div>
                      <div class="doc-info">
                        <div class="doc-name-row">
                          <span class="doc-name">{{ doc.fileName || doc.originalName }}</span>
                          <span class="avulso-badge" *ngIf="doc.isAvulso" 
                                [pTooltip]="'usuariosExternos.permissoes.tooltip.standaloneDoc' | translate" 
                                tooltipPosition="top">
                            <i class="pi pi-paperclip"></i>
                            <span class="badge-text">{{ 'usuariosExternos.permissoes.tag.standaloneDoc' | translate }}</span>
                          </span>
                        </div>
                        <div class="doc-meta">
                          <span class="doc-ext">{{ doc.fileExtension?.toUpperCase() || ('usuariosExternos.permissoes.fileTypeDefault' | translate) }}</span>
                          <span class="doc-size">{{ formatFileSize(doc.fileSize) }}</span>
                        </div>
                      </div>
                      <div class="doc-actions">
                        <button pButton 
                                icon="pi pi-eye" 
                                class="p-button-rounded p-button-text p-button-sm"
                                [pTooltip]="'usuariosExternos.permissoes.tooltip.view' | translate"
                                tooltipPosition="left"
                                (click)="visualizarDocumento(doc, $event)">
                        </button>
                      </div>
                    </div>

                    <!-- Estado vazio -->
                    <div class="empty-state small" *ngIf="docsListaFiltrada.length === 0 && !loadingDocs">
                      <i class="pi pi-file"></i>
                      <p>{{ (docsBusca ? 'usuariosExternos.permissoes.empty.docNotFound' : 'usuariosExternos.permissoes.empty.docNone') | translate }}</p>
                      <span class="hint">{{ 'usuariosExternos.permissoes.empty.docHint' | translate }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- Resumo de OS já liberadas -->
            <div class="liberadas-summary" *ngIf="osLiberadasList.length > 0" @fadeInUp>
              <div class="summary-header">
                <i class="pi pi-check-circle"></i>
                <h4>{{ 'usuariosExternos.permissoes.summary.releasedOs' | translate:{ count: String(osLiberadasList.length) } }}</h4>
              </div>
              <div class="liberadas-list">
                <div class="liberada-item" *ngFor="let os of osLiberadasList">
                  <div class="liberada-info">
                    <span class="liberada-os">OS {{ os.id }}</span>
                    <span class="liberada-client">{{ os.clienteNome }}</span>
                  </div>
                  <div class="liberada-actions">
                    <button pButton 
                            icon="pi pi-ban" 
                            class="p-button-text p-button-warning p-button-sm"
                            [pTooltip]="'usuariosExternos.permissoes.tooltip.revokeOsFull' | translate"
                            tooltipPosition="left"
                            (click)="revogarOSCompleto(os)">
                    </button>
                    <button pButton 
                            icon="pi pi-trash" 
                            class="p-button-text p-button-danger p-button-sm"
                            [pTooltip]="'usuariosExternos.permissoes.tooltip.revokeOsPartial' | translate"
                            tooltipPosition="left"
                            (click)="revogarOS(os)">
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </p-tabPanel>

        <!-- Documentos Avulsos -->
        <p-tabPanel [header]="'usuariosExternos.permissoes.tab.avulsos' | translate">
          <div class="tab-content" @fadeInUp>
            <div class="tab-header">
              <h3>
                <i class="pi pi-folder-open"></i>
                {{ 'usuariosExternos.permissoes.avulsos.sectionTitle' | translate }}
              </h3>
              <p>{{ 'usuariosExternos.permissoes.avulsos.sectionDesc' | translate }}</p>
            </div>

            <div class="avulsos-split-panel">
              <!-- Painel de Upload -->
              <div class="panel upload-panel">
                <div class="panel-header">
                  <div class="panel-title">
                    <i class="pi pi-cloud-upload"></i>
                    <span>{{ 'usuariosExternos.permissoes.panel.addDocument' | translate }}</span>
                  </div>
                </div>
                <div class="panel-content">
                  <div class="upload-area" 
                       [class.drag-over]="isDragOver"
                       (dragover)="onDragOver($event)"
                       (dragleave)="onDragLeave($event)"
                       (drop)="onDrop($event)"
                       (click)="fileInputAvulso.click()">
                    <input #fileInputAvulso 
                           type="file" 
                           multiple 
                           hidden 
                           (change)="onFilesSelected($event)">
                    <i class="pi pi-cloud-upload"></i>
                    <h4>{{ 'usuariosExternos.permissoes.avulsos.uploadDragTitle' | translate }}</h4>
                    <p>{{ 'usuariosExternos.permissoes.avulsos.uploadDragSubtitle' | translate }}</p>
                    <span class="upload-hint">{{ 'usuariosExternos.permissoes.avulsos.uploadHint' | translate }}</span>
                  </div>

                  <!-- Lista de arquivos selecionados para upload -->
                  <div class="selected-files" *ngIf="arquivosParaUpload.length > 0">
                    <h4>
                      <i class="pi pi-list"></i>
                      {{ 'usuariosExternos.permissoes.avulsos.selectedFiles' | translate:{ count: String(arquivosParaUpload.length) } }}
                    </h4>
                    <div class="file-item" *ngFor="let file of arquivosParaUpload; let i = index">
                      <div class="file-icon" [ngClass]="getFileIconClassByName(file.name)">
                        <i [class]="getFileIconByName(file.name)"></i>
                      </div>
                      <div class="file-info">
                        <span class="file-name">{{ file.name }}</span>
                        <span class="file-size">{{ formatFileSize(file.size) }}</span>
                      </div>
                      <button pButton 
                              icon="pi pi-times" 
                              class="p-button-text p-button-danger p-button-sm"
                              (click)="removerArquivoUpload(i)">
                      </button>
                    </div>
                    <div class="upload-actions">
                      <button pButton 
                              [label]="'usuariosExternos.permissoes.btn.clear' | translate" 
                              icon="pi pi-trash"
                              class="p-button-text p-button-secondary"
                              (click)="limparArquivosUpload()">
                      </button>
                      <button pButton 
                              [label]="'usuariosExternos.permissoes.btn.uploadRelease' | translate" 
                              icon="pi pi-check"
                              class="p-button-success"
                              [loading]="uploadingAvulsos"
                              (click)="uploadDocumentosAvulsos()">
                      </button>
                    </div>
                  </div>

                  <!-- Documentos disponíveis na pasta diversos -->
                  <div class="diversos-section" *ngIf="documentosDiversos.length > 0">
                    <h4>
                      <i class="pi pi-folder"></i>
                      {{ 'usuariosExternos.permissoes.avulsos.availableTitle' | translate }}
                    </h4>
                    <div class="search-box">
                      <i class="pi pi-search"></i>
                      <input type="text" 
                             pInputText 
                             [(ngModel)]="diversosBusca" 
                             [placeholder]="'usuariosExternos.permissoes.search.doc' | translate"
                             (input)="filtrarDiversos()">
                    </div>
                    <div class="diversos-list">
                      <div class="diversos-item" 
                           *ngFor="let doc of diversosListaFiltrada"
                           [class.selected]="isDiversoSelecionado(doc)">
                        <p-checkbox [(ngModel)]="diversosSelecionados"
                                    [value]="doc.id"
                                    [binary]="false">
                        </p-checkbox>
                        <div class="doc-icon" [ngClass]="getFileIconClass(doc.fileExtension)">
                          <i [class]="getFileIcon(doc.fileExtension)"></i>
                        </div>
                        <div class="doc-info">
                          <span class="doc-name">{{ doc.fileName }}</span>
                          <span class="doc-size">{{ formatFileSize(doc.fileSize) }}</span>
                        </div>
                        <button pButton 
                                icon="pi pi-eye" 
                                class="p-button-text p-button-sm"
                                [pTooltip]="'usuariosExternos.permissoes.tooltip.view' | translate"
                                (click)="visualizarDiverso(doc)">
                        </button>
                      </div>
                    </div>
                    <div class="diversos-actions" *ngIf="diversosSelecionados.length > 0">
                      <span class="selection-count">
                        {{ 'usuariosExternos.permissoes.avulsos.selectedCount' | translate:{ count: String(diversosSelecionados.length) } }}
                      </span>
                      <button pButton 
                              [label]="'usuariosExternos.permissoes.btn.releaseSelected' | translate" 
                              icon="pi pi-check"
                              class="p-button-primary"
                              [loading]="liberandoDiversos"
                              (click)="liberarDiversosSelecionados()">
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Painel de Documentos Liberados -->
              <div class="panel liberados-panel">
                <div class="panel-header">
                  <div class="panel-title">
                    <i class="pi pi-check-circle"></i>
                    <span>{{ 'usuariosExternos.permissoes.panel.releasedDocs' | translate }}</span>
                    <span class="count-badge" *ngIf="documentosLiberados.length > 0">
                      {{ documentosLiberados.length }}
                    </span>
                  </div>
                </div>
                <div class="panel-content">
                  <div class="docs-list-simple" *ngIf="documentosLiberados.length > 0">
                    <div class="doc-item-simple" *ngFor="let doc of documentosLiberados">
                      <div class="doc-icon-simple" [ngClass]="getFileIconClassByExt(doc.tipoArquivo)">
                        <i [class]="getFileIconByExt(doc.tipoArquivo)"></i>
                      </div>
                      <div class="doc-info-simple">
                        <span class="doc-name">{{ doc.nomeArquivo }}</span>
                        <span class="doc-desc">{{ doc.descricao || ('usuariosExternos.permissoes.docStandaloneFallback' | translate) }}</span>
                      </div>
                      <p-tag [value]="getDocAccessTag(doc)" 
                             [severity]="doc.podeDownload ? 'success' : 'info'"
                             styleClass="tag-small">
                      </p-tag>
                      <button pButton icon="pi pi-trash" 
                              class="p-button-text p-button-danger p-button-sm"
                              [pTooltip]="'usuariosExternos.permissoes.tooltip.revokeAccess' | translate"
                              (click)="revogarDocumento(doc)">
                      </button>
                    </div>
                  </div>

                  <div class="empty-state" *ngIf="documentosLiberados.length === 0">
                    <i class="pi pi-folder-open"></i>
                    <h4>{{ 'usuariosExternos.permissoes.empty.noReleasedTitle' | translate }}</h4>
                    <p>{{ 'usuariosExternos.permissoes.empty.noReleasedDesc' | translate }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>

    <!-- Dialog de Visualização de Documento -->
    <p-dialog styleClass="as-hero-dialog doc-viewer-dialog" [(visible)]="showDocViewer" 
              [header]="docViewerTitle"
              [modal]="true"
              [style]="{width: '90vw', height: '90vh'}"
              [maximizable]="true"
              [draggable]="false"
             >
      <div class="doc-viewer-content">
        <iframe *ngIf="docViewerUrl" 
                [src]="docViewerUrl" 
                class="doc-iframe">
        </iframe>
        <div class="doc-viewer-loading" *ngIf="!docViewerUrl">
          <p-progressSpinner strokeWidth="3"></p-progressSpinner>
          <span>{{ 'usuariosExternos.permissoes.loading.viewer' | translate }}</span>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    .permissoes-container {
      padding: 24px;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .header-left {
      .user-info {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 16px;
      }
    }

    .user-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }

    .user-info h1 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .user-info p {
      font-size: 14px;
      color: #64748b;
      margin: 4px 0 0;
    }

    .tab-content {
      padding: 24px 0;
    }

    .tab-header {
      margin-bottom: 24px;

      h3 {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
        margin: 0 0 8px;

        i {
          color: #0ea5e9;
        }
      }

      p {
        font-size: 14px;
        color: #64748b;
        margin: 0;
      }
    }

    .tab-header-with-action {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 24px;

      .tab-header-text {
        flex: 1;

        h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 8px;

          i {
            color: #0ea5e9;
          }
        }

        p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }
      }

      .tab-header-action {
        flex-shrink: 0;

        .save-btn-header {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
          transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

          &:not(:disabled):hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
          }

          &:disabled {
            opacity: 0.5;
            box-shadow: none;
          }
        }
      }
    }

    /* Funcionalidades Grid */
    .funcionalidades-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .func-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      cursor: pointer;

      &:hover {
        border-color: #0ea5e9;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
      }

      &.selected {
        border-color: #0ea5e9;
        background: rgba(14, 165, 233, 0.05);
      }
    }

    .func-icon {
      width: 48px;
      height: 48px;
      background: rgba(14, 165, 233, 0.1);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 22px;
        color: #0ea5e9;
      }
    }

    .func-info {
      flex: 1;

      h4 {
        font-size: 15px;
        font-weight: 600;
        color: #0f172a;
        margin: 0 0 4px;
      }

      p {
        font-size: 13px;
        color: #64748b;
        margin: 0;
      }
    }

    .tab-actions {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
    }

    /* Split Panel Layout */
    .os-docs-tab {
      .split-panel {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 24px;
        min-height: 600px;
      }
    }

    .panel {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

      &.docs-panel {
        border-color: #e2e8f0;

        &.active {
          border-color: #0ea5e9;
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.15);
        }
      }
    }

    .panel-header {
      padding: 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      flex-wrap: wrap;

      i {
        font-size: 18px;
        color: #0ea5e9;
      }

      span {
        font-size: 16px;
        font-weight: 600;
        color: #0f172a;
      }
    }

    .docs-counter {
      display: flex;
      align-items: center;
      gap: 4px;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      padding: 6px 12px;
      border-radius: 20px;
      margin-left: auto;

      .counter-selected {
        font-size: 16px;
        font-weight: 700;
        color: #fff;
      }

      .counter-separator {
        color: rgba(255,255,255,0.6);
        font-size: 14px;
      }

      .counter-total {
        font-size: 14px;
        color: rgba(255,255,255,0.8);
      }

      .counter-label {
        font-size: 12px;
        color: rgba(255,255,255,0.7);
        margin-left: 4px;
      }
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;

      i.pi-search {
        position: absolute;
        left: 12px;
        color: #94a3b8;
        font-size: 14px;
      }

      input {
        width: 100%;
        padding: 10px 36px 10px 36px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

        &:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
          outline: none;
        }

        &::placeholder {
          color: #94a3b8;
        }
      }

      .clear-btn {
        position: absolute;
        right: 4px;
      }
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    /* OS List */
    .os-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .os-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #fff;
      border: 2px solid #f1f5f9;
      border-radius: 12px;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

      &:hover {
        border-color: #0ea5e9;
        transform: translateX(4px);
      }

      &.selected {
        border-color: #0ea5e9;
        background: rgba(14, 165, 233, 0.05);
        
        .os-arrow i {
          color: #0ea5e9;
        }
      }

      &.has-access {
        .os-icon {
          background: rgba(34, 197, 94, 0.1);
          
          i {
            color: #22c55e;
          }
        }
      }
    }

    .os-icon {
      width: 40px;
      height: 40px;
      background: rgba(14, 165, 233, 0.1);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 18px;
        color: #0ea5e9;
      }
    }

    .os-details {
      flex: 1;
      min-width: 0;
    }

    .os-number {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
    }

    .os-id {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
    }

    .os-client {
      font-size: 14px;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .os-meta {
      display: flex;
      gap: 12px;
      margin-top: 4px;

      span {
        font-size: 12px;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 4px;

        i {
          font-size: 11px;
        }
      }
    }

    .os-arrow {
      i {
        color: #cbd5e1;
        transition: color 0.2s ease;
      }
    }

    .os-actions-inline {
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0.7;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 1;
      }
    }

    /* Documents List */
    .docs-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .selected-os-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%);
      border-radius: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;

      .os-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #0ea5e9;
        color: #fff;
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 13px;

        i {
          font-size: 14px;
        }
      }

      .os-client-name {
        font-size: 14px;
        color: #475569;
        flex: 1;
      }

    }

    /* Seção de Upload de Documentos Avulsos */
    .avulsos-upload-section {
      background: #fefce8;
      border: 2px solid #fef08a;
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;

      .avulsos-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        cursor: pointer;
        transition: background 0.2s ease;

        &:hover {
          background: #fef9c3;
        }

        i:first-child {
          font-size: 12px;
          color: #a16207;
        }

        .avulsos-icon {
          color: #ca8a04;
          font-size: 18px;
        }

        span {
          font-weight: 600;
          font-size: 14px;
          color: #854d0e;
          flex: 1;
        }
      }

      .avulsos-content {
        padding: 0 16px 16px;
      }

      .upload-area-mini {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px;
        border: 2px dashed #fde047;
        border-radius: 10px;
        background: #fefce8;
        cursor: pointer;
        transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

        &:hover, &.drag-over {
          border-color: #facc15;
          background: #fef9c3;
        }

        i {
          font-size: 20px;
          color: #ca8a04;
        }

        span {
          font-size: 13px;
          color: #854d0e;
        }
      }

      .upload-files-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 12px;
      }

      .upload-file-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: #fff;
        border-radius: 8px;
        border: 1px solid #fde68a;

        .file-icon-mini {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;

          &.pdf {
            background: rgba(239, 68, 68, 0.1);
            i { color: #ef4444; font-size: 14px; }
          }
          &.doc, &.docx {
            background: rgba(59, 130, 246, 0.1);
            i { color: #3b82f6; font-size: 14px; }
          }
          &.xls, &.xlsx {
            background: rgba(34, 197, 94, 0.1);
            i { color: #22c55e; font-size: 14px; }
          }
          &.default {
            background: rgba(100, 116, 139, 0.1);
            i { color: #64748b; font-size: 14px; }
          }
        }

        .file-name-mini {
          flex: 1;
          font-size: 13px;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-size-mini {
          font-size: 12px;
          color: #9ca3af;
        }
      }

      .avulsos-hint {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        font-size: 12px;
        color: #a16207;

        i {
          font-size: 12px;
        }

        strong {
          color: #854d0e;
        }
      }
    }

    /* Separador de Documentos */
    .docs-separator {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      margin-bottom: 12px;

      span {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .separator-actions {
        display: flex;
        gap: 4px;
        margin-left: auto;
      }

      &::before {
        content: '';
        flex: 0 0 20px;
        height: 1px;
        background: #e2e8f0;
      }

      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #e2e8f0;
      }
    }

    /* Empty state small */
    .empty-state.small {
      padding: 24px 16px;
      
      i {
        font-size: 32px;
      }

      p {
        font-size: 13px;
        margin: 8px 0 4px;
      }

      .hint {
        font-size: 12px;
        color: #94a3b8;
      }
    }

    .doc-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #fff;
      border: 2px solid #f1f5f9;
      border-radius: 12px;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

      &:hover {
        border-color: #e2e8f0;
        background: #fafafa;
      }

      &.selected {
        border-color: #22c55e;
        background: rgba(34, 197, 94, 0.05);

        .doc-icon {
          background: rgba(34, 197, 94, 0.15);
        }
      }
    }

    .doc-checkbox {
      flex-shrink: 0;
    }

    .doc-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

      &.pdf {
        background: rgba(239, 68, 68, 0.1);
        i { color: #ef4444; }
      }

      &.doc, &.docx {
        background: rgba(59, 130, 246, 0.1);
        i { color: #3b82f6; }
      }

      &.xls, &.xlsx {
        background: rgba(34, 197, 94, 0.1);
        i { color: #22c55e; }
      }

      &.img {
        background: rgba(168, 85, 247, 0.1);
        i { color: #a855f7; }
      }

      &.default {
        background: rgba(100, 116, 139, 0.1);
        i { color: #64748b; }
      }

      i {
        font-size: 20px;
      }
    }

    .doc-info {
      flex: 1;
      min-width: 0;
    }

    .doc-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .doc-name {
      font-size: 14px;
      font-weight: 500;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .avulso-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
      flex-shrink: 0;
      white-space: nowrap;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
      }
      
      i {
        font-size: 12px;
        font-weight: bold;
      }
      
      .badge-text {
        letter-spacing: 0.2px;
      }
    }

    .doc-item.doc-avulso {
      border-left: 3px solid #3b82f6;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, #fff 100%);
    }

    .doc-meta {
      display: flex;
      gap: 12px;
      margin-top: 4px;

      .doc-ext {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .doc-size {
        font-size: 12px;
        color: #94a3b8;
      }
    }

    .doc-actions {
      flex-shrink: 0;
    }

    /* Panel Footer */
    .panel-footer {
      padding: 16px 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;

      .footer-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #64748b;

        i {
          color: #0ea5e9;
        }
      }
    }

    /* Empty & Loading States */
    .empty-state, .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      color: #64748b;

      i {
        font-size: 48px;
        margin-bottom: 16px;
        color: #cbd5e1;
      }

      h4 {
        font-size: 16px;
        font-weight: 600;
        color: #475569;
        margin: 0 0 8px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }

      &.initial {
        i {
          font-size: 36px;
          color: #0ea5e9;
          animation: pulse 2s infinite;
        }
      }
    }

    .loading-state {
      span {
        margin-top: 12px;
        font-size: 14px;
      }
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      margin-top: 16px;

      .page-info {
        font-size: 13px;
        color: #64748b;
        min-width: 60px;
        text-align: center;
      }
    }

    /* Liberadas Summary */
    .liberadas-summary {
      margin-top: 24px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;

      .summary-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 20px;
        background: rgba(34, 197, 94, 0.05);
        border-bottom: 1px solid #e2e8f0;

        i {
          color: #22c55e;
          font-size: 18px;
        }

        h4 {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }
      }

      .liberadas-list {
        max-height: 200px;
        overflow-y: auto;
      }

      .liberada-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        border-bottom: 1px solid #f1f5f9;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: #fafafa;
        }
      }

      .liberada-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .liberada-os {
        font-weight: 600;
        color: #0f172a;
        font-size: 14px;
      }

      .liberada-client {
        color: #64748b;
        font-size: 13px;
      }

      .liberada-actions {
        display: flex;
        gap: 4px;
      }
    }

    /* Documents Avulsos */
    .docs-section {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }

    .docs-list-simple {
      max-height: 400px;
      overflow-y: auto;
    }

    .doc-item-simple {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #fafafa;
      }
    }

    .doc-icon-simple {
      width: 40px;
      height: 40px;
      background: rgba(14, 165, 233, 0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 18px;
        color: #0ea5e9;
      }
    }

    .doc-info-simple {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .doc-name {
        font-weight: 500;
        color: #0f172a;
      }

      .doc-desc {
        font-size: 13px;
        color: #64748b;
      }
    }

    /* Document Viewer Dialog */
    :host ::ng-deep .doc-viewer-dialog {
      .p-dialog-content {
        padding: 0;
        height: calc(90vh - 60px);
      }
    }

    .doc-viewer-content {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1e293b;

      .doc-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }

      .doc-viewer-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        color: #fff;
      }
    }

    /* Tag small */
    :host ::ng-deep .tag-small {
      font-size: 10px !important;
      padding: 2px 6px !important;
    }

    /* TabView customization */
    :host ::ng-deep {
      .p-tabview {
        .p-tabview-nav {
          background: #fff;
          border-radius: 12px 12px 0 0;
          border: 1px solid #e2e8f0;
          border-bottom: none;
        }

        .p-tabview-panels {
          background: #fff;
          border-radius: 0 0 12px 12px;
          border: 1px solid #e2e8f0;
          border-top: none;
          padding: 24px;
        }

        .p-tabview-nav-link {
          font-weight: 500;
        }
      }
    }

    /* Animations */
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: translateX(0);
      }
      50% {
        opacity: 0.7;
        transform: translateX(-5px);
      }
    }

    /* Avulsos Split Panel */
    .avulsos-split-panel {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      min-height: 500px;
    }

    .upload-panel, .liberados-panel {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .upload-area {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 40px 24px;
      text-align: center;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      margin-bottom: 20px;

      &:hover {
        border-color: #0ea5e9;
        background: rgba(14, 165, 233, 0.03);
      }

      &.drag-over {
        border-color: #0ea5e9;
        background: rgba(14, 165, 233, 0.08);
        transform: scale(1.01);
      }

      i {
        font-size: 48px;
        color: #94a3b8;
        margin-bottom: 16px;
        display: block;
      }

      h4 {
        font-size: 16px;
        font-weight: 600;
        color: #475569;
        margin: 0 0 4px;
      }

      p {
        font-size: 14px;
        color: #94a3b8;
        margin: 0;
      }

      .upload-hint {
        display: block;
        font-size: 12px;
        color: #cbd5e1;
        margin-top: 12px;
      }
    }

    .selected-files {
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;

      h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #334155;
        margin: 0 0 12px;

        i {
          color: #0ea5e9;
        }
      }
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: #fff;
      border-radius: 8px;
      margin-bottom: 8px;

      &:last-of-type {
        margin-bottom: 0;
      }

      .file-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 16px;
        }
      }

      .file-info {
        flex: 1;
        min-width: 0;

        .file-name {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-size {
          font-size: 12px;
          color: #94a3b8;
        }
      }
    }

    .upload-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .diversos-section {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;

      h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #334155;
        margin: 0 0 12px;

        i {
          color: #64748b;
        }
      }

      .search-box {
        margin-bottom: 12px;
      }
    }

    .diversos-list {
      max-height: 250px;
      overflow-y: auto;
    }

    .diversos-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      transition: background 0.2s ease;

      &:hover {
        background: #f8fafc;
      }

      &.selected {
        background: rgba(34, 197, 94, 0.08);
      }

      .doc-icon {
        width: 32px;
        height: 32px;
      }

      .doc-info {
        flex: 1;
        min-width: 0;

        .doc-name {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doc-size {
          font-size: 11px;
          color: #94a3b8;
        }
      }
    }

    .diversos-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;

      .selection-count {
        font-size: 13px;
        color: #64748b;
      }
    }

    .count-badge {
      background: #0ea5e9;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: auto;
    }

    .doc-icon-simple {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(100, 116, 139, 0.1);

      &.pdf {
        background: rgba(239, 68, 68, 0.1);
        i { color: #ef4444; }
      }

      &.doc, &.docx {
        background: rgba(59, 130, 246, 0.1);
        i { color: #3b82f6; }
      }

      &.xls, &.xlsx {
        background: rgba(34, 197, 94, 0.1);
        i { color: #22c55e; }
      }

      &.img {
        background: rgba(168, 85, 247, 0.1);
        i { color: #a855f7; }
      }

      i {
        font-size: 18px;
        color: #64748b;
      }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .os-docs-tab .split-panel {
        grid-template-columns: 1fr;
      }

      .avulsos-split-panel {
        grid-template-columns: 1fr;
      }

      .panel {
        min-height: 400px;
      }
    }
  `]
})
export class UsuarioExternoPermissoesComponent implements OnInit {
  private usuarioExternoService = inject(UsuarioExternoService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  Math = Math;

  usuario: UsuarioExterno | null = null;
  activeTabIndex = 0;
  
  // Funcionalidades
  todasFuncionalidades: FuncionalidadeExterna[] = [];
  funcionalidadesSelecionadas: number[] = [];
  savingFuncs = false;

  // OS
  osLista: OSItem[] = [];
  osListaFiltrada: OSItem[] = [];
  osLiberadasList: OSExternaResumo[] = [];
  osLiberadasIds: Set<number> = new Set();
  osSelecionada: OSItem | null = null;
  osBusca = '';
  loadingOS = false;
  osPage = 0;
  osPageSize = 20;
  totalOS = 0;

  // Documentos
  documentosOS: DocumentoOS[] = [];
  docsListaFiltrada: DocumentoOS[] = [];
  documentosLiberados: DocumentoExterno[] = [];
  docsBusca = '';
  loadingDocs = false;
  savingDocs = false;
  documentosSelecionadosCount = 0;

  // Document Viewer
  showDocViewer = false;
  docViewerUrl: SafeResourceUrl | null = null;
  docViewerTitle = '';

  // Documentos Avulsos
  arquivosParaUpload: File[] = [];
  isDragOver = false;
  uploadingAvulsos = false;
  documentosDiversos: DocumentoOS[] = [];
  diversosListaFiltrada: DocumentoOS[] = [];
  diversosBusca = '';
  diversosSelecionados: number[] = [];
  liberandoDiversos = false;
  avulsosSectionExpanded = false;

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadUsuario(+id);
      this.loadFuncionalidades(+id);
      this.carregarOS();
      this.loadOSLiberadas(+id);
      this.loadDocumentos(+id);
      this.carregarDocumentosDiversos();
    }
  }

  loadUsuario(id: number) {
    this.usuarioExternoService.getById(id).subscribe({
      next: (usuario) => {
        this.usuario = usuario;
      },
      error: (err) => {
        console.error('Failed to load user:', err);
        this.router.navigate(['/usuarios-externos']);
      }
    });
  }

  loadFuncionalidades(usuarioId: number) {
    this.usuarioExternoService.getAllFuncionalidades().subscribe({
      next: (funcs) => {
        this.todasFuncionalidades = funcs;
      },
      error: (err) => console.error('Failed to load permissions:', err)
    });

    this.usuarioExternoService.getFuncionalidadesUsuario(usuarioId).subscribe({
      next: (funcs) => {
        this.funcionalidadesSelecionadas = funcs.map(f => f.id);
      },
      error: (err) => console.error('Failed to load user permissions:', err)
    });
  }

  carregarOS() {
    this.loadingOS = true;
    const apiUrl = environment.apiUrl;
    
    this.http.get<any>(`${apiUrl}/os`, {
      params: {
        page: this.osPage.toString(),
        size: this.osPageSize.toString(),
        q: this.osBusca || ''
      }
    }).subscribe({
      next: (response) => {
        this.osLista = response.content || response.items || response || [];
        this.osListaFiltrada = [...this.osLista];
        this.totalOS = response.totalElements || response.total || this.osLista.length;
        this.loadingOS = false;
      },
      error: (err) => {
        console.error('Failed to load work order:', err);
        this.loadingOS = false;
      }
    });
  }

  loadOSLiberadas(usuarioId: number) {
    this.usuarioExternoService.getOSsUsuario(usuarioId).subscribe({
      next: (os) => {
        this.osLiberadasList = os;
        this.osLiberadasIds = new Set(os.map(o => o.id));
      },
      error: (err) => console.error('Failed to load released work orders:', err)
    });
  }

  loadDocumentos(usuarioId: number) {
    this.usuarioExternoService.getDocumentosUsuario(usuarioId).subscribe({
      next: (docs) => {
        this.documentosLiberados = docs;
      },
      error: (err) => console.error('Failed to load documents:', err)
    });
  }

  filtrarOS() {
    // Se mudou a busca, resetar página e recarregar do servidor
    this.osPage = 0;
    this.carregarOS();
  }

  limparBuscaOS() {
    this.osBusca = '';
    this.filtrarOS();
  }

  selecionarOS(os: OSItem) {
    this.osSelecionada = os;
    this.docsBusca = '';
    this.carregarDocumentosOS(os.id);
  }

  carregarDocumentosOS(osId: number) {
    this.loadingDocs = true;
    this.documentosOS = [];
    this.docsListaFiltrada = [];
    
    const apiUrl = environment.apiUrl;
    
    this.http.get<DocumentoOS[]>(`${apiUrl}/os-files/os/${osId}`).subscribe({
      next: (docs) => {
        // Marcar documentos que já estão liberados para o usuário
        const liberadosIds = new Set(
          this.documentosLiberados
            .filter(d => d.osFileId)
            .map(d => d.osFileId)
        );
        
        this.documentosOS = docs.map(d => ({
          ...d,
          selected: liberadosIds.has(d.id)
        }));
        this.docsListaFiltrada = [...this.documentosOS];
        this.atualizarContadorDocumentos();
        this.loadingDocs = false;
      },
      error: (err) => {
        console.error('Failed to load work order documents:', err);
        this.loadingDocs = false;
      }
    });
  }

  filtrarDocumentos() {
    if (!this.docsBusca.trim()) {
      this.docsListaFiltrada = [...this.documentosOS];
      return;
    }

    const busca = this.docsBusca.toLowerCase();
    this.docsListaFiltrada = this.documentosOS.filter(doc => 
      doc.fileName?.toLowerCase().includes(busca) ||
      doc.originalName?.toLowerCase().includes(busca) ||
      doc.fileExtension?.toLowerCase().includes(busca)
    );
  }

  limparBuscaDocs() {
    this.docsBusca = '';
    this.filtrarDocumentos();
  }

  onDocumentoSelectionChange() {
    this.atualizarContadorDocumentos();
  }

  atualizarContadorDocumentos() {
    this.documentosSelecionadosCount = this.documentosOS.filter(d => d.selected).length;
  }

  canSaveOSPermissions(): boolean {
    // Habilita se tem OS selecionada E (documentos selecionados OU arquivos para upload)
    return this.osSelecionada !== null && 
           (this.documentosSelecionadosCount > 0 || this.arquivosParaUpload.length > 0);
  }

  getTotalSelecionados(): number {
    return this.documentosSelecionadosCount + this.arquivosParaUpload.length;
  }

  selecionarTodosDocumentos() {
    this.documentosOS.forEach(d => d.selected = true);
    this.atualizarContadorDocumentos();
  }

  limparSelecaoDocumentos() {
    this.documentosOS.forEach(d => d.selected = false);
    this.atualizarContadorDocumentos();
  }

  visualizarDocumento(doc: DocumentoOS, event: Event) {
    event.stopPropagation();
    
    this.docViewerTitle = doc.fileName || doc.originalName;
    this.showDocViewer = true;
    
    const apiUrl = environment.apiUrl;
    const url = `${apiUrl}/os-files/${doc.id}/download`;
    this.docViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  salvarPermissoesOS() {
    if (!this.usuario || !this.osSelecionada) return;

    const currentUser = this.authService.getCurrentUser();
    const concedidoPor = currentUser?.id || 0;
    const documentosSelecionados = this.documentosOS.filter(d => d.selected);

    this.savingDocs = true;

    // Primeiro, conceder acesso à OS
    this.usuarioExternoService.concederAcessoOS(
      this.usuario.id,
      this.osSelecionada.id,
      concedidoPor
    ).subscribe({
      next: () => {
        // Se tem arquivos para upload, fazer upload primeiro
        if (this.arquivosParaUpload.length > 0) {
          this.uploadAvulsosParaOS(documentosSelecionados, concedidoPor);
        } else {
          // Só salvar documentos selecionados
          this.salvarDocumentosSelecionados(documentosSelecionados, concedidoPor);
        }
      },
      error: (err) => {
        this.savingDocs = false;
        toastKey(this.messageService, this.i18n, 'error', 'usuariosExternos.permissoes.toast.error', 'usuariosExternos.permissoes.toast.grantOsError');
      }
    });
  }

  private uploadAvulsosParaOS(documentosSelecionados: DocumentoOS[], concedidoPor: number) {
    if (!this.osSelecionada) return;

    const formData = new FormData();
    this.arquivosParaUpload.forEach(file => {
      formData.append('files', file);
    });
    formData.append('osId', this.osSelecionada.id.toString());

    const apiUrl = environment.apiUrl;
    
    // Upload para a pasta diversos da OS específica
    this.http.post<any>(`${apiUrl}/os-files/os/${this.osSelecionada.id}/diversos/upload`, formData).subscribe({
      next: (response) => {
        const uploadedFiles = response.files || [];
        
        // Liberar os arquivos enviados + documentos selecionados
        this.liberarDocumentosComAvulsos(documentosSelecionados, uploadedFiles, concedidoPor);
      },
      error: (err) => {
        console.error('Failed to upload:', err);
        // Mesmo com erro no upload, tentar salvar documentos selecionados
        this.salvarDocumentosSelecionados(documentosSelecionados, concedidoPor);
        toastKey(this.messageService, this.i18n, 'warn', 'usuariosExternos.permissoes.toast.warn', 'usuariosExternos.permissoes.toast.uploadAvulsosPartial');
      }
    });
  }

  private liberarDocumentosComAvulsos(documentosSelecionados: DocumentoOS[], uploadedFiles: any[], concedidoPor: number) {
    if (!this.usuario) return;

    // Combinar documentos selecionados e arquivos enviados
    const todosDocumentos: any[] = [
      ...documentosSelecionados.map(doc => ({
        id: doc.id,
        name: doc.fileName || doc.originalName,
        descricao: this.i18n.translate('usuariosExternos.permissoes.desc.osDoc', {
          id: String(this.osSelecionada?.id ?? '')
        })
      })),
      ...uploadedFiles.map(file => ({
        id: file.id,
        name: file.fileName || file.originalName,
        descricao: this.i18n.translate('usuariosExternos.permissoes.desc.avulsoOs', {
          id: String(this.osSelecionada?.id ?? '')
        })
      }))
    ];

    if (todosDocumentos.length === 0) {
      this.finalizarSalvamento();
      return;
    }

    let completed = 0;
    let errors = 0;

    todosDocumentos.forEach(doc => {
      this.usuarioExternoService.concederAcessoDocumento(this.usuario!.id, {
        osFileId: doc.id,
        nomeArquivo: doc.name,
        descricao: doc.descricao,
        podeDownload: true,
        concedidoPor
      }).subscribe({
        next: () => {
          completed++;
          if (completed + errors === todosDocumentos.length) {
            this.finalizarSalvamentoComAvulsos(completed, errors);
          }
        },
        error: () => {
          errors++;
          if (completed + errors === todosDocumentos.length) {
            this.finalizarSalvamentoComAvulsos(completed, errors);
          }
        }
      });
    });
  }

  private finalizarSalvamentoComAvulsos(completed: number, errors: number) {
    this.savingDocs = false;
    this.arquivosParaUpload = [];
    this.avulsosSectionExpanded = false;
    
    // Recarregar dados
    if (this.usuario) {
      this.loadOSLiberadas(this.usuario.id);
      this.loadDocumentos(this.usuario.id);
      if (this.osSelecionada) {
        this.carregarDocumentosOS(this.osSelecionada.id);
      }
    }

    const total = completed + errors;
    if (errors === 0) {
      toastKey(this.messageService, this.i18n, 'success', 'usuariosExternos.permissoes.toast.success', 'usuariosExternos.permissoes.toast.osDocsReleased', {
        count: String(completed)
      });
    } else {
      toastKey(this.messageService, this.i18n, 'warn', 'usuariosExternos.permissoes.toast.warn', 'usuariosExternos.permissoes.toast.docsReleasedPartial', {
        completed: String(completed),
        total: String(total),
        errors: String(errors)
      });
    }
  }

  private salvarDocumentosSelecionados(documentos: DocumentoOS[], concedidoPor: number) {
    if (!this.usuario) return;

    const requests = documentos.map(doc => 
      this.usuarioExternoService.concederAcessoDocumento(this.usuario!.id, {
        osFileId: doc.id,
        nomeArquivo: doc.fileName || doc.originalName,
        descricao: this.i18n.translate('usuariosExternos.permissoes.desc.osDoc', {
          id: String(this.osSelecionada?.id ?? '')
        }),
        podeDownload: true,
        concedidoPor
      })
    );

    if (requests.length === 0) {
      this.finalizarSalvamento();
      return;
    }

    // Executar todas as requisições
    let completed = 0;
    let errors = 0;

    requests.forEach(req => {
      req.subscribe({
        next: () => {
          completed++;
          if (completed + errors === requests.length) {
            this.finalizarSalvamento(errors);
          }
        },
        error: () => {
          errors++;
          if (completed + errors === requests.length) {
            this.finalizarSalvamento(errors);
          }
        }
      });
    });
  }

  private finalizarSalvamento(errors = 0) {
    this.savingDocs = false;
    
    // Recarregar dados
    if (this.usuario) {
      this.loadOSLiberadas(this.usuario.id);
      this.loadDocumentos(this.usuario.id);
    }

    if (errors === 0) {
      toastKey(this.messageService, this.i18n, 'success', 'usuariosExternos.permissoes.toast.success', 'usuariosExternos.permissoes.toast.osDocsReleased', {
        count: String(this.documentosSelecionadosCount)
      });
    } else {
      toastKey(this.messageService, this.i18n, 'warn', 'usuariosExternos.permissoes.toast.warn', 'usuariosExternos.permissoes.toast.osGrantedPartial', {
        errors: String(errors)
      });
    }
  }

  isFuncionalidadeSelecionada(id: number): boolean {
    return this.funcionalidadesSelecionadas.includes(id);
  }

  salvarFuncionalidades() {
    if (!this.usuario) return;

    const currentUser = this.authService.getCurrentUser();
    const concedidoPor = currentUser?.id || 0;

    this.savingFuncs = true;
    this.usuarioExternoService.atualizarFuncionalidades(
      this.usuario.id,
      this.funcionalidadesSelecionadas,
      concedidoPor
    ).subscribe({
      next: () => {
        this.savingFuncs = false;
        toastKey(this.messageService, this.i18n, 'success', 'usuariosExternos.permissoes.toast.success', 'usuariosExternos.permissoes.toast.funcsUpdated');
      },
      error: (err) => {
        this.savingFuncs = false;
        toastKey(this.messageService, this.i18n, 'error', 'usuariosExternos.permissoes.toast.error', 'usuariosExternos.permissoes.toast.funcsUpdateError');
      }
    });
  }

  revogarOS(os: OSExternaResumo) {
    if (!this.usuario) return;

    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.externo.revokeOsPartial', { id: String(os.id) }),
      header: 'confirm.header.generic',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.usuarioExternoService.revogarAcessoOS(this.usuario!.id, os.id).subscribe({
          next: () => {
            toastKey(this.messageService, this.i18n, 'success', 'usuariosExternos.permissoes.toast.success', 'usuariosExternos.permissoes.toast.osAccessRemoved');
            this.loadOSLiberadas(this.usuario!.id);
          },
          error: () => {
            toastKey(this.messageService, this.i18n, 'error', 'usuariosExternos.permissoes.toast.error', 'usuariosExternos.permissoes.toast.accessRemoveError');
          }
        });
      }
    });
  }

  revogarOSCompleto(os: OSExternaResumo) {
    if (!this.usuario) return;

    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.externo.revokeOsFull', { id: String(os.id) }),
      header: 'confirm.header.revokeAllShort',
      icon: 'pi pi-ban',
      acceptLabel: 'confirm.yesRevokeAll',
      rejectLabel: 'common.confirm.cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.usuarioExternoService.revogarAcessoOSCompleto(this.usuario!.id, os.id).subscribe({
          next: () => {
            toastKey(this.messageService, this.i18n, 'success', 'usuariosExternos.permissoes.toast.success', 'usuariosExternos.permissoes.toast.osFullRevoked', {
              id: String(os.id)
            });
            this.loadOSLiberadas(this.usuario!.id);
            this.loadDocumentos(this.usuario!.id);
          },
          error: () => {
            toastKey(this.messageService, this.i18n, 'error', 'usuariosExternos.permissoes.toast.error', 'usuariosExternos.permissoes.toast.revokeError');
          }
        });
      }
    });
  }

  revogarTodasPermissoesOS(os: any, event: Event) {
    event.stopPropagation();
    if (!this.usuario) return;

    // Contar documentos liberados desta OS
    const docsDestaOS = this.documentosLiberados.filter(d => {
      // Verificar se o documento pertence a esta OS
      // Baseado na descrição que contém "OS {id}"
      return d.descricao?.includes(`OS ${os.id}`);
    });

    const numDocs = docsDestaOS.length;
    const mensagem =
      numDocs > 0
        ? this.i18n.translate('confirm.externo.revokeOsWithDocs', {
            id: String(os.id),
            count: String(numDocs)
          })
        : this.i18n.translate('confirm.externo.revokeOsOnly', { id: String(os.id) });

    this.confirmationService.confirm({
      message: mensagem,
      header: 'confirm.header.revokeAll',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'confirm.yesRevokeAll',
      rejectLabel: 'common.confirm.cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        // Primeiro revogar documentos, depois a OS
        if (docsDestaOS.length > 0) {
          this.revogarDocumentosEOS(docsDestaOS, os);
        } else {
          this.executarRevogacaoOS(os);
        }
      }
    });
  }

  private revogarDocumentosEOS(docs: DocumentoExterno[], os: any) {
    let completed = 0;
    let errors = 0;

    docs.forEach(doc => {
      this.usuarioExternoService.revogarAcessoDocumento(this.usuario!.id, doc.id).subscribe({
        next: () => {
          completed++;
          if (completed + errors === docs.length) {
            this.executarRevogacaoOS(os);
          }
        },
        error: () => {
          errors++;
          if (completed + errors === docs.length) {
            this.executarRevogacaoOS(os);
          }
        }
      });
    });
  }

  private executarRevogacaoOS(os: any) {
    this.usuarioExternoService.revogarAcessoOS(this.usuario!.id, os.id).subscribe({
      next: () => {
        toastKey(this.messageService, this.i18n, 'success', 'usuariosExternos.permissoes.toast.success', 'usuariosExternos.permissoes.toast.allOsRevoked', {
          id: String(os.id)
        });
        this.loadOSLiberadas(this.usuario!.id);
        this.loadDocumentos(this.usuario!.id);
        if (this.osSelecionada?.id === os.id) {
          this.osSelecionada = null;
          this.documentosOS = [];
          this.docsListaFiltrada = [];
        }
      },
      error: () => {
        toastKey(this.messageService, this.i18n, 'error', 'usuariosExternos.permissoes.toast.error', 'usuariosExternos.permissoes.toast.revokeError');
      }
    });
  }

  revogarDocumento(doc: DocumentoExterno) {
    if (!this.usuario) return;

    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.externo.revokeDoc', { nome: String(doc.nomeArquivo ?? '') }),
      header: 'confirm.header.generic',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.usuarioExternoService.revogarAcessoDocumento(this.usuario!.id, doc.id).subscribe({
          next: () => {
            toastKey(this.messageService, this.i18n, 'success', 'usuariosExternos.permissoes.toast.success', 'usuariosExternos.permissoes.toast.docAccessRemoved');
            this.loadDocumentos(this.usuario!.id);
          },
          error: () => {
            toastKey(this.messageService, this.i18n, 'error', 'usuariosExternos.permissoes.toast.error', 'usuariosExternos.permissoes.toast.accessRemoveError');
          }
        });
      }
    });
  }

  getDocAccessTag(doc: DocumentoExterno): string {
    return this.i18n.translate(
      doc.podeDownload
        ? 'usuariosExternos.permissoes.tag.download'
        : 'usuariosExternos.permissoes.tag.view'
    );
  }

  getInitials(nome: string): string {
    if (!nome) return '?';
    const names = nome.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return names[0][0];
  }

  getFileIcon(extension: string): string {
    const ext = extension?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'pi pi-file-pdf';
      case 'doc':
      case 'docx': return 'pi pi-file-word';
      case 'xls':
      case 'xlsx': return 'pi pi-file-excel';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'pi pi-image';
      default: return 'pi pi-file';
    }
  }

  getFileIconClass(extension: string): string {
    const ext = extension?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'pdf';
      case 'doc':
      case 'docx': return 'doc';
      case 'xls':
      case 'xlsx': return 'xls';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'img';
      default: return 'default';
    }
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  trackByOsId(index: number, os: OSItem): number {
    return os.id;
  }

  trackByDocId(index: number, doc: DocumentoOS): number {
    return doc.id;
  }

  // ========================================
  // Métodos para Documentos Avulsos
  // ========================================

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.addFilesToUpload(Array.from(files));
    }
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addFilesToUpload(Array.from(input.files));
      input.value = ''; // Reset para permitir selecionar o mesmo arquivo novamente
    }
  }

  addFilesToUpload(files: File[]) {
    this.arquivosParaUpload = [...this.arquivosParaUpload, ...files];
  }

  removerArquivoUpload(index: number) {
    this.arquivosParaUpload.splice(index, 1);
  }

  limparArquivosUpload() {
    this.arquivosParaUpload = [];
  }

  uploadDocumentosAvulsos() {
    if (!this.usuario || this.arquivosParaUpload.length === 0) return;

    const currentUser = this.authService.getCurrentUser();
    const concedidoPor = currentUser?.id || 0;

    this.uploadingAvulsos = true;
    
    const formData = new FormData();
    this.arquivosParaUpload.forEach(file => {
      formData.append('files', file);
    });

    const apiUrl = environment.apiUrl;
    
    // Upload para a pasta diversos
    this.http.post<any>(`${apiUrl}/os-files/diversos/upload`, formData).subscribe({
      next: (response) => {
        const uploadedFiles = response.files || [];
        
        // Liberar os arquivos para o usuário externo
        this.liberarArquivosUploadados(uploadedFiles, concedidoPor);
      },
      error: (err) => {
        this.uploadingAvulsos = false;
        console.error('Failed to upload:', err);
        toastKey(this.messageService, this.i18n, 'error', 'usuariosExternos.permissoes.toast.error', 'usuariosExternos.permissoes.toast.uploadError');
      }
    });
  }

  private liberarArquivosUploadados(files: any[], concedidoPor: number) {
    if (!this.usuario || files.length === 0) {
      this.uploadingAvulsos = false;
      return;
    }

    let completed = 0;
    let errors = 0;

    files.forEach(file => {
      this.usuarioExternoService.concederAcessoDocumento(this.usuario!.id, {
        osFileId: file.id,
        nomeArquivo: file.fileName || file.originalName,
        descricao: this.i18n.translate('usuariosExternos.permissoes.desc.avulso'),
        podeDownload: true,
        concedidoPor
      }).subscribe({
        next: () => {
          completed++;
          if (completed + errors === files.length) {
            this.finalizarUploadAvulsos(completed, errors);
          }
        },
        error: () => {
          errors++;
          if (completed + errors === files.length) {
            this.finalizarUploadAvulsos(completed, errors);
          }
        }
      });
    });
  }

  private finalizarUploadAvulsos(completed: number, errors: number) {
    this.uploadingAvulsos = false;
    this.arquivosParaUpload = [];
    
    if (this.usuario) {
      this.loadDocumentos(this.usuario.id);
      this.carregarDocumentosDiversos();
    }

    if (errors === 0) {
      toastKey(this.messageService, this.i18n, 'success', 'usuariosExternos.permissoes.toast.success', 'usuariosExternos.permissoes.toast.uploadSuccess', {
        count: String(completed)
      });
    } else {
      toastKey(this.messageService, this.i18n, 'warn', 'usuariosExternos.permissoes.toast.warn', 'usuariosExternos.permissoes.toast.uploadPartial', {
        completed: String(completed),
        errors: String(errors)
      });
    }
  }

  carregarDocumentosDiversos() {
    const apiUrl = environment.apiUrl;
    
    this.http.get<DocumentoOS[]>(`${apiUrl}/os-files/diversos`).subscribe({
      next: (docs) => {
        this.documentosDiversos = docs || [];
        this.diversosListaFiltrada = [...this.documentosDiversos];
      },
      error: (err) => {
        console.error('Failed to load miscellaneous documents:', err);
        this.documentosDiversos = [];
        this.diversosListaFiltrada = [];
      }
    });
  }

  filtrarDiversos() {
    if (!this.diversosBusca.trim()) {
      this.diversosListaFiltrada = [...this.documentosDiversos];
      return;
    }

    const busca = this.diversosBusca.toLowerCase();
    this.diversosListaFiltrada = this.documentosDiversos.filter(doc =>
      doc.fileName?.toLowerCase().includes(busca) ||
      doc.originalName?.toLowerCase().includes(busca)
    );
  }

  isDiversoSelecionado(doc: DocumentoOS): boolean {
    return this.diversosSelecionados.includes(doc.id);
  }

  visualizarDiverso(doc: DocumentoOS) {
    this.docViewerTitle = doc.fileName || doc.originalName;
    this.showDocViewer = true;
    
    const apiUrl = environment.apiUrl;
    const url = `${apiUrl}/os-files/${doc.id}/download`;
    this.docViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  liberarDiversosSelecionados() {
    if (!this.usuario || this.diversosSelecionados.length === 0) return;

    const currentUser = this.authService.getCurrentUser();
    const concedidoPor = currentUser?.id || 0;

    this.liberandoDiversos = true;

    const docsParaLiberar = this.documentosDiversos.filter(d => 
      this.diversosSelecionados.includes(d.id)
    );

    let completed = 0;
    let errors = 0;

    docsParaLiberar.forEach(doc => {
      this.usuarioExternoService.concederAcessoDocumento(this.usuario!.id, {
        osFileId: doc.id,
        nomeArquivo: doc.fileName || doc.originalName,
        descricao: this.i18n.translate('usuariosExternos.permissoes.desc.avulso'),
        podeDownload: true,
        concedidoPor
      }).subscribe({
        next: () => {
          completed++;
          if (completed + errors === docsParaLiberar.length) {
            this.finalizarLiberacaoDiversos(completed, errors);
          }
        },
        error: () => {
          errors++;
          if (completed + errors === docsParaLiberar.length) {
            this.finalizarLiberacaoDiversos(completed, errors);
          }
        }
      });
    });
  }

  private finalizarLiberacaoDiversos(completed: number, errors: number) {
    this.liberandoDiversos = false;
    this.diversosSelecionados = [];
    
    if (this.usuario) {
      this.loadDocumentos(this.usuario.id);
    }

    if (errors === 0) {
      toastKey(this.messageService, this.i18n, 'success', 'usuariosExternos.permissoes.toast.success', 'usuariosExternos.permissoes.toast.releaseSuccess', {
        count: String(completed)
      });
    } else {
      toastKey(this.messageService, this.i18n, 'warn', 'usuariosExternos.permissoes.toast.warn', 'usuariosExternos.permissoes.toast.releasePartial', {
        completed: String(completed),
        errors: String(errors)
      });
    }
  }

  getFileIconByName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return this.getFileIcon(ext || '');
  }

  getFileIconClassByName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return this.getFileIconClass(ext || '');
  }

  getFileIconByExt(ext: string | undefined): string {
    return this.getFileIcon(ext || '');
  }

  getFileIconClassByExt(ext: string | undefined): string {
    return this.getFileIconClass(ext || '');
  }
}
