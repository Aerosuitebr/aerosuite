import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion';
import { PaginatorModule } from 'primeng/paginator';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { OSService, OS, OsPainelResumo, OSSolicitacaoTrocaItem, KitFcuDeficitItem, KitFcuDeficitPreview } from '../core/os.service';
import { TenantFeatureService } from '../core/tenant-feature.service';
import { TenantFeatureCodes } from '../core/tenant-feature-codes';
import { FcuCompatService, Fcu } from '../core/fcu.service';
import { FabricanteService } from '../core/fabricantes.service';
import { AssociacaoFcuService, AssociacaoFcu } from '../core/associacao-fcu.service';
import { OSFileService, OSFile, UploadProgress } from '../core/os-file.service';
import { TipoServicoService, TipoServico } from '../core/tipos-servico.service';
import { PublicacaoTecnicaService, PublicacaoFcu } from '../core/publicacao-tecnica.service';
import { PageHelpComponent } from '../shared/page-help/page-help.component';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { ProductSelectorComponent, PropostaItem, Product } from '../shared/product-selector/product-selector.component';
import { AuthService } from '../auth/auth.service';
import { canonFuncionalidadeCodigo, isSuperPerfil } from '../auth/permissao.util';
import { EstoqueService } from '../core/estoque.service';
import { TranslationService } from '../core/translation.service';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import { TranslatePipe } from '../core/translate.pipe';
import { BrandingService } from '../core/branding.service';
import { toastKey } from '../core/toast-i18n.util';
import { getDefaultAppLogoUrlAbsolute } from '../shared/constants/logo.constant';
import { buildOsPrintContext, buildOsPrintDocument } from './shared/os-print.util';
import { LocaleDateTimePipe } from '../core/locale/locale-datetime.pipe';
import { formatUiDateTime } from '../core/locale/locale-intl.util';
import { OsCrsDialogComponent } from './os-crs-dialog/os-crs-dialog.component';
import { OsAdSbAplicaveisComponent } from './os-ad-sb-aplicaveis/os-ad-sb-aplicaveis.component';
import { OsTarefaDadosTecnicosComponent, OsTarefaDadoTecnico } from './os-tarefa-dados-tecnicos/os-tarefa-dados-tecnicos.component';
import { OsConformidadeAlertasComponent } from './os-conformidade-alertas/os-conformidade-alertas.component';
import { BlingApiService, BlingPropostaFluxoPasso, BlingPropostaFluxoView } from '../core/bling-api.service';

export type OsTrocaItem = PropostaItem & { id?: number; pago?: boolean | null };
import { ProgressBarModule } from 'primeng/progressbar';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { FileUploadModule } from 'primeng/fileupload';
import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../core/lazy-list-pagination.helper';

@Component({
  selector: 'app-os-list',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    DropdownModule,
    ButtonModule,
    CardModule,
    TagModule,
    BadgeModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule,
    ToastModule,
    AccordionModule,
    PaginatorModule,
    MultiSelectModule,
    PageHelpComponent,
    ProgressBarModule,
    FileUploadModule,
    ProductSelectorComponent,
    TranslatePipe,
    LocaleDateTimePipe,
    OsCrsDialogComponent,
    OsAdSbAplicaveisComponent,
    OsTarefaDadosTecnicosComponent,
    OsConformidadeAlertasComponent,
    PageHeroComponent,
    ListDataStatesComponent
  ],

  template: `
    <div class="as-page list-container">
      <app-page-hero
        variant="navy"
        titleKey="os.list.title"
        subtitleKey="os.list.subtitle"
        titleIcon="pi-file-edit"
        [hasActions]="true">
        <div actions class="header-actions">
            <app-page-help></app-page-help>
            <button 
              pButton 
              type="button" 
              icon="pi pi-search" 
              class="p-button-outlined consult-btn"
              (click)="openOSConsultModal()"
              [pTooltip]="'os.list.tooltip.searchSaved' | translate"
              [attr.aria-label]="'os.list.tooltip.searchSaved' | translate"
              tooltipPosition="bottom">
            </button>
            <button 
              pButton 
              type="button" 
              [label]="'os.list.btnNew' | translate" 
              icon="pi pi-plus"
              class="add-btn"
              (click)="addNew()">
            </button>
        </div>
      </app-page-hero>

      <!-- Filters Section -->
      <div class="filters-section">
        <div class="filters-card">
          <div class="search-container">
            <div class="search-input-wrapper">
              <i class="pi pi-search search-icon" *ngIf="!searching"></i>
              <i class="pi pi-spin pi-spinner search-icon" *ngIf="searching"></i>
              <input 
                type="text" 
                pInputText 
                [(ngModel)]="q" 
                [attr.aria-label]="'os.list.searchPlaceholder' | translate"
                [placeholder]="'os.list.searchPlaceholder' | translate" 
                (input)="onSearchChange($event)"
                (keyup.enter)="buscar()"
                class="search-input">
            </div>
            <button 
              pButton 
              type="button" 
              icon="pi pi-search" 
              class="search-btn"
              (click)="buscar()"
              [pTooltip]="'os.list.tooltip.search' | translate"
              [attr.aria-label]="'os.list.tooltip.search' | translate"
              tooltipPosition="top">
            </button>
            <button 
              pButton 
              type="button" 
              icon="pi pi-times" 
              class="clear-btn"
              (click)="clear()"
              [pTooltip]="'os.list.tooltip.clear' | translate"
              [attr.aria-label]="'os.list.tooltip.clear' | translate"
              tooltipPosition="top">
            </button>
          </div>
          
          <div class="stats-container" [class.stats-container--extended]="dashboardExtendido">
            <div class="stat-item">
              <div class="stat-number">{{ total }}</div>
              <div class="stat-label">{{ 'os.list.statTotal' | translate }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ getDisplayedCount() }}</div>
              <div class="stat-label">{{ 'common.list.stat.displaying' | translate }}</div>
            </div>
            <ng-container *ngIf="dashboardExtendido && painelResumo">
              <div class="stat-item stat-item--accent">
                <div class="stat-number">{{ painelResumo.aguardando }}</div>
                <div class="stat-label">{{ 'os.list.dashboard.aguardando' | translate }}</div>
              </div>
              <div class="stat-item stat-item--accent">
                <div class="stat-number">{{ painelResumo.emExecucao }}</div>
                <div class="stat-label">{{ 'os.list.dashboard.emExecucao' | translate }}</div>
              </div>
              <div class="stat-item stat-item--accent">
                <div class="stat-number">{{ painelResumo.aguardandoPecas }}</div>
                <div class="stat-label">{{ 'os.list.dashboard.aguardandoPecas' | translate }}</div>
              </div>
              <div class="stat-item stat-item--accent">
                <div class="stat-number">{{ painelResumo.inspecao }}</div>
                <div class="stat-label">{{ 'os.list.dashboard.inspecao' | translate }}</div>
              </div>
              <div class="stat-item stat-item--warn" *ngIf="painelResumo.prioridadeAog > 0">
                <div class="stat-number">{{ painelResumo.prioridadeAog }}</div>
                <div class="stat-label">{{ 'os.list.dashboard.aog' | translate }}</div>
              </div>
              <div class="stat-item stat-item--warn">
                <div class="stat-number">{{ painelResumo.crsPendente }}</div>
                <div class="stat-label">{{ 'os.list.dashboard.crsPendente' | translate }}</div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-section">
        <div class="table-card">
          <div class="table-container">
            <app-list-data-states
              [loading]="loading"
              [itemCount]="total"
              [skeletonRows]="8"
              [skeletonCols]="8"
              [mountContentWhileLoading]="true"
              emptyTitleKey="os.list.empty.title"
              emptyDescriptionKey="ui.empty.description">
            <p-table appListScroll
            [value]="rows"
            [loading]="loading"
            [paginator]="true"
            [first]="tableFirst"
            [rows]="size"
            [totalRecords]="total"
            [lazy]="true"
            (onLazyLoad)="loadLazy($event)"
            [sortField]="sortField"
            [sortOrder]="sortOrder"
            [showCurrentPageReport]="true"
            [currentPageReportTemplate]="'os.list.pageReport' | translate"
            [rowsPerPageOptions]="listRowsPerPageOptions"
            styleClass="p-datatable-sm">
            
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="idOs">
                  {{ 'os.list.col.osId' | translate }}
                  <p-sortIcon field="idOs"></p-sortIcon>
                </th>
                <th pSortableColumn="clienteNome">
                  {{ 'os.list.col.client' | translate }}
                  <p-sortIcon field="clienteNome"></p-sortIcon>
                </th>
                <th pSortableColumn="numOsOriginal">
                  {{ 'os.list.col.originalOs' | translate }}
                  <p-sortIcon field="numOsOriginal"></p-sortIcon>
                </th>
                <th pSortableColumn="serialNumber">
                  {{ 'os.list.col.serialNumber' | translate }}
                  <p-sortIcon field="serialNumber"></p-sortIcon>
                </th>
                <th pSortableColumn="partNumber">
                  {{ 'os.list.col.partNumber' | translate }}
                  <p-sortIcon field="partNumber"></p-sortIcon>
                </th>
                <th pSortableColumn="dtAbertura">
                  {{ 'os.list.col.openDate' | translate }}
                  <p-sortIcon field="dtAbertura"></p-sortIcon>
                </th>
                <th class="col-actions" style="width: 120px;">{{ 'common.list.col.actions' | translate }}</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-row>
              <tr
                (click)="editOS(row)"
                style="cursor: pointer;"
                [ngClass]="trocaEventualListagem(row)?.rowClass">
                <td>
                  <div class="os-id-cell">
                    <i
                      *ngIf="trocaEventualListagem(row) as trocaInd"
                      class="troca-ind-icon pi"
                      [ngClass]="trocaInd.icon"
                      [class.troca-ind--info]="trocaInd.state === 'info'"
                      [class.troca-ind--pendente]="trocaInd.state === 'pendente'"
                      [class.troca-ind--pago]="trocaInd.state === 'pago'"
                      [class.troca-ind--nao-pago]="trocaInd.state === 'naoPago'"
                      [pTooltip]="trocaInd.tooltip"
                      tooltipPosition="top"></i>
                    <i
                      *ngIf="row?.temDeficitKitFcu"
                      class="kit-deficit-ind-icon pi pi-exclamation-triangle"
                      [pTooltip]="'os.list.tooltip.kitDeficit' | translate"
                      tooltipPosition="top"
                      (click)="$event.stopPropagation(); openKitDeficitModal(row)"></i>
                    <i
                      *ngIf="row?.crsEmitido"
                      class="crs-ind-icon pi pi-verified"
                      [pTooltip]="crsListagemTooltip(row)"
                      tooltipPosition="top"
                      (click)="$event.stopPropagation()"></i>
                    <div class="os-id">
                      <strong>{{ formatOSId(row) }}</strong>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="cliente-nome">
                    {{ row.clienteNome || '-' }}
                  </div>
                </td>
                <td>
                  <div class="os-original">
                    {{ row.numOsOriginal || '-' }}
                  </div>
                </td>
                <td>
                  <div class="serial-text">
                    {{ row.serialNumber || '-' }}
                  </div>
                </td>
                <td>
                  <div class="part-text">
                    {{ row.fcuPn || row.partNumber || '-' }}
                  </div>
                </td>
                <td>
                  <div class="date-text">
                    {{ row.dtAbertura ? (row.dtAbertura | localeDateTime:'dateNumeric') : '-' }}
                  </div>
                </td>
                <td class="col-actions">
                  <div class="action-buttons" (click)="$event.stopPropagation()">
                    <button 
                      pButton 
                      type="button" 
                      icon="pi pi-eye" 
                      class="p-button-text p-button-sm"
                      [pTooltip]="'os.list.tooltip.readOnly' | translate"
                      [attr.aria-label]="'os.list.tooltip.readOnly' | translate"
                      tooltipPosition="top"
                      (click)="viewOS(row)">
                    </button>
                    <button 
                      pButton 
                      type="button" 
                      icon="pi pi-print" 
                      class="p-button-text p-button-sm print-btn"
                      [pTooltip]="'os.list.tooltip.print' | translate"
                      [attr.aria-label]="'os.list.tooltip.print' | translate"
                      (click)="printOS(row)">
                    </button>
                    <button 
                      pButton 
                      type="button" 
                      icon="pi pi-pencil" 
                      class="p-button-text p-button-sm edit-btn"
                      [pTooltip]="'os.list.tooltip.edit' | translate"
                      [attr.aria-label]="'os.list.tooltip.edit' | translate"
                      (click)="editOS(row)">
                    </button>
                    <button 
                      pButton 
                      type="button" 
                      icon="pi pi-trash" 
                      class="p-button-text p-button-sm delete-btn"
                      [pTooltip]="'os.list.tooltip.delete' | translate"
                      [attr.aria-label]="'os.list.tooltip.delete' | translate"
                      (click)="confirmDelete(row)">
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7" class="text-center">
                  <div class="empty-state">
                    <i class="pi pi-inbox" style="font-size: 3rem; color: #9ca3af;"></i>
                    <p>{{ 'os.list.empty' | translate }}</p>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
            </app-list-data-states>
          </div>
        </div>
      </div>

      <!-- OS Modal -->
      <p-dialog 
        styleClass="as-hero-dialog" [(visible)]="showOSModal" 
        [modal]="true" 
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
        [focusTrap]="true"
        [closeOnEscape]="true"
        [style]="{width: '900px'}"
        [header]="osModalHeader"
        (onHide)="closeOSModal()">
        
        <form [formGroup]="osForm" (ngSubmit)="saveOS()" class="os-form">
          <!-- Número da OS (Readonly, sempre no topo) -->
          <div class="os-number-header">
            <div class="form-field">
              <label class="field-label">
                <i class="pi pi-hashtag"></i>
                {{ 'os.form.number' | translate }}
              </label>
              <input 
                pInputText 
                [value]="formatOSId(currentOS)"
                [disabled]="true"
                [placeholder]="osNumberPlaceholder"
                class="form-input os-number-display"
                readonly>
            </div>
          </div>

          <div *ngIf="isEditing && currentOS?.id && blingFluxo" class="os-bling-fluxo-banner">
            <div class="os-bling-fluxo-header">
              <strong>{{ 'comercial.proposta.bling.fluxoTitle' | translate }}</strong>
              <p-tag *ngIf="blingFluxo?.automacaoPendente"
                     [severity]="blingFluxo?.automacaoComErro ? 'danger' : (blingFluxo?.aguardandoConclusaoOs ? 'info' : 'warn')"
                     [value]="fluxoAutomacaoLabel()"></p-tag>
              <button *ngIf="blingFluxo?.retryDisponivel" pButton type="button" class="p-button-sm p-button-outlined"
                      icon="pi pi-refresh" [label]="'comercial.proposta.bling.fluxoRetryBtn' | translate"
                      [loading]="reprocessandoFluxoBling" (click)="reprocessarFluxoBlingOs()"></button>
            </div>
            <ol class="os-bling-fluxo-steps" *ngIf="blingFluxo?.passos?.length">
              <li *ngFor="let passo of blingFluxo!.passos!">
                <strong>{{ fluxoPassoLabel(passo) }}</strong>
                <span>{{ passo.titulo }}</span>
                <small>{{ ('comercial.proposta.bling.fluxoStatus.' + (passo.status || 'PENDING')) | translate }}</small>
              </li>
            </ol>
            <p *ngIf="blingFluxo?.ultimoErro" class="os-bling-fluxo-erro">{{ blingFluxo?.ultimoErro }}</p>
          </div>

          <div class="os-encerrada-banner" *ngIf="registroEncerrado && isEditing">
            <i class="pi pi-lock"></i>
            <div class="os-encerrada-text">
              <p>{{ 'os.form.encerrada.banner' | translate }}</p>
              <p class="hint-crs" *ngIf="currentOS?.crsEmitido">{{ 'os.form.encerrada.bannerCrs' | translate }}</p>
            </div>
            <button
              *ngIf="podeReabrirOs()"
              pButton
              type="button"
              [label]="'os.form.reabrir.btn' | translate"
              icon="pi pi-unlock"
              class="p-button-warning p-button-sm"
              (click)="openReabrirDialog()">
            </button>
          </div>

          <app-os-conformidade-alertas
            *ngIf="isEditing && currentOS?.id"
            [osId]="currentOS!.id!"></app-os-conformidade-alertas>

          <!-- FCU Selection -->
          <div class="fcu-selection">
            <div class="form-field">
              <label for="fcuSelect" class="field-label">
                <i class="pi pi-microchip"></i>
                {{ 'os.form.fcu.label' | translate }} *
              </label>
              <p-dropdown 
                id="fcuSelect"
                formControlName="fcuId"
                [options]="fcuOptions"
                optionLabel="displayText"
                optionValue="id"
                [placeholder]="'os.form.fcu.placeholder' | translate"
                [filter]="true"
                filterBy="displayText,pn,fcuCodigo"
                [showClear]="true"
                [disabled]="isReadOnly"
                class="form-input"
                [class.p-invalid]="osForm.get('fcuId')?.invalid && osForm.get('fcuId')?.touched"
                (onChange)="onFcuChange($event)">
                <ng-template pTemplate="selectedItem" let-selectedOption>
                  <div *ngIf="selectedOption" class="fcu-selected">
                    <strong>{{ selectedOption.pn || selectedOption.fcuCodigo || ('os.form.fcu.noPn' | translate) }}</strong>
                    <span class="fcu-description" *ngIf="selectedOption.fcuDescription">{{ selectedOption.fcuDescription }}</span>
                  </div>
                </ng-template>
                <ng-template pTemplate="item" let-option>
                  <div class="fcu-option">
                    <strong>{{ option.pn || option.fcuCodigo || ('os.form.fcu.noPn' | translate) }}</strong>
                    <span class="fcu-description" *ngIf="option.fcuDescription">{{ option.fcuDescription }}</span>
                  </div>
                </ng-template>
              </p-dropdown>
              <small 
                *ngIf="osForm.get('fcuId')?.invalid && osForm.get('fcuId')?.touched" 
                class="p-error">
                {{ 'os.form.fcu.required' | translate }}
              </small>
            </div>
          </div>

          <!-- Accordion Sections -->
          <p-accordion [multiple]="true" [activeIndex]="[0, 1, 2, 3, 4]">
            <!-- Descrição do Artigo -->
            <p-accordionTab [header]="'os.form.accordion.article' | translate">
              <div class="form-grid">
                <div class="form-field">
                  <label for="clienteNome" class="field-label">
                    <i class="pi pi-user"></i>
                    {{ 'os.form.field.client' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="clienteNome"
                    formControlName="clienteNome"
                    [placeholder]="'os.form.ph.client' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="fabricanteId" class="field-label">
                    <i class="pi pi-building"></i>
                    {{ 'os.form.field.manufacturer' | translate }}
                  </label>
                  <p-dropdown
                    id="fabricanteId"
                    formControlName="fabricanteId"
                    [options]="fabricanteOptions"
                    optionLabel="nome"
                    optionValue="id"
                    [placeholder]="'os.form.ph.manufacturer' | translate"
                    [showClear]="true"
                    styleClass="form-input"
                    [filter]="true"
                    [filterPlaceholder]="'os.form.ph.manufacturerFilter' | translate">
                  </p-dropdown>
                </div>

                <div class="form-field">
                  <label for="pn" class="field-label">
                    <i class="pi pi-tag"></i>
                    {{ 'os.form.field.pn' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="pn"
                    formControlName="pn"
                    [placeholder]="'os.form.ph.partNumber' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="modelo" class="field-label">
                    <i class="pi pi-cog"></i>
                    {{ 'os.form.field.model' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="modelo"
                    formControlName="modelo"
                    [placeholder]="'os.form.ph.model' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="nome" class="field-label">
                    <i class="pi pi-info-circle"></i>
                    {{ 'os.form.field.name' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="nome"
                    formControlName="nome"
                    [placeholder]="'os.form.ph.name' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="serialNumber" class="field-label">
                    <i class="pi pi-qrcode"></i>
                    {{ 'os.form.field.serialNumber' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="serialNumber"
                    formControlName="serialNumber"
                    [placeholder]="'os.form.ph.serialNumber' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="tsn" class="field-label">
                    <i class="pi pi-clock"></i>
                    {{ 'os.form.field.tsn' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="tsn"
                    formControlName="tsn"
                    [placeholder]="'os.form.field.tsn' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="tso" class="field-label">
                    <i class="pi pi-clock"></i>
                    {{ 'os.form.field.tso' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="tso"
                    formControlName="tso"
                    [placeholder]="'os.form.field.tso' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <!-- Linha com Marcas de Matrícula, Motor e S/N Motor -->
                <div class="form-field">
                  <label for="marcasMatricula" class="field-label">
                    <i class="pi pi-id-card"></i>
                    {{ 'os.form.field.regMarks' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="marcasMatricula"
                    formControlName="marcasMatricula"
                    [placeholder]="'os.form.ph.regMarks' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="motor" class="field-label">
                    <i class="pi pi-cog"></i>
                    {{ 'os.form.field.engine' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="motor"
                    formControlName="motor"
                    [placeholder]="'os.form.ph.engine' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="snMotor" class="field-label">
                    <i class="pi pi-tag"></i>
                    {{ 'os.form.field.engineSn' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="snMotor"
                    formControlName="snMotor"
                    [placeholder]="'os.form.ph.engineSn' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>
              </div>
            </p-accordionTab>

            <!-- Serviço -->
            <p-accordionTab [header]="'os.form.accordion.service' | translate">
              <div class="form-grid">
                <div class="form-field">
                  <label for="tipoServico" class="field-label">
                    <i class="pi pi-wrench"></i>
                    {{ 'os.form.field.serviceType' | translate }}
                  </label>
                  <p-dropdown 
                    id="tipoServico"
                    formControlName="tipoServicoId"
                    [options]="tipoServicoOptions"
                    optionLabel="nome"
                    optionValue="id"
                    [placeholder]="'os.form.ph.serviceType' | translate"
                    [disabled]="isReadOnly"
                    [filter]="true"
                    filterBy="nome"
                    class="form-input">
                  </p-dropdown>
                </div>

                <div class="form-field">
                  <label for="numOsOriginal" class="field-label">
                    <i class="pi pi-file"></i>
                    {{ 'os.form.field.originalOsShort' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="numOsOriginal"
                    formControlName="numOsOriginal"
                    [placeholder]="'os.form.ph.originalOs' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="dtAbertura" class="field-label">
                    <i class="pi pi-calendar"></i>
                    {{ 'os.form.field.openDateShort' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="dtAbertura"
                    formControlName="dtAbertura"
                    type="date"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="dataConclusaoServ" class="field-label">
                    <i class="pi pi-calendar"></i>
                    {{ 'os.form.field.conclusionShort' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="dataConclusaoServ"
                    formControlName="dataConclusaoServ"
                    type="date"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="inicioServico" class="field-label">
                    <i class="pi pi-pencil"></i>
                    {{ 'os.form.field.serviceStartShort' | translate }}
                  </label>
                  <textarea 
                    pInputTextarea 
                    id="inicioServico"
                    formControlName="inicioServico"
                    [placeholder]="'os.form.ph.serviceStartNotes' | translate"
                    rows="3"
                    class="form-input"
                    [readonly]="isReadOnly">
                  </textarea>
                </div>

                <div class="form-field">
                  <label for="fimServico" class="field-label">
                    <i class="pi pi-pencil"></i>
                    {{ 'os.form.field.serviceEndShort' | translate }}
                  </label>
                  <textarea 
                    pInputTextarea 
                    id="fimServico"
                    formControlName="fimServico"
                    [placeholder]="'os.form.ph.serviceEndNotes' | translate"
                    rows="3"
                    class="form-input"
                    [readonly]="isReadOnly">
                  </textarea>
                </div>

                <div class="form-field">
                  <label for="dataFechamento" class="field-label">
                    <i class="pi pi-calendar-times"></i>
                    {{ 'os.form.field.closeDateShort' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="dataFechamento"
                    formControlName="dataFechamento"
                    type="date"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>
              </div>
            </p-accordionTab>

            <!-- Arquivos -->
            <p-accordionTab [header]="'os.form.accordion.files' | translate">
              <div class="form-grid">
                <!-- Área de Upload (apenas em modo edição/criação) -->
                <div class="form-field full-width" *ngIf="!isReadOnly">
                  <label class="field-label">
                    <i class="pi pi-upload"></i>
                    {{ 'os.form.files.upload' | translate }}
                  </label>
                  <div class="upload-area" 
                       (click)="fileInput.click()"
                       (dragover)="onDragOver($event)"
                       (dragleave)="onDragLeave($event)"
                       (drop)="onDrop($event)"
                       [class.drag-over]="isDragOver"
                       [class.uploading]="isUploading">
                    <input 
                      type="file" 
                      #fileInput 
                      hidden 
                      multiple 
                      [attr.aria-label]="'os.form.files.upload' | translate"
                      (change)="onFilesSelected($event)">
                    <div class="upload-content" *ngIf="!isUploading">
                      <i class="pi pi-cloud-upload upload-icon"></i>
                      <p class="upload-text">{{ 'os.form.files.drop' | translate }}</p>
                      <span class="upload-hint">{{ 'os.form.files.hint' | translate }}</span>
                    </div>
                    <div class="upload-progress-container" *ngIf="isUploading">
                      <div class="upload-progress-header">
                        <i class="pi pi-spin pi-spinner"></i>
                        <span>{{ 'os.form.files.uploading' | translate }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Lista de arquivos sendo enviados com progresso -->
                  <div class="upload-files-list" *ngIf="uploadProgress.length > 0">
                    <div *ngFor="let upload of uploadProgress" class="upload-file-item">
                      <div class="upload-file-info">
                        <i class="pi" [ngClass]="{
                          'pi-spin pi-spinner': upload.status === 'uploading',
                          'pi-check-circle': upload.status === 'completed',
                          'pi-times-circle': upload.status === 'error'
                        }" [style.color]="upload.status === 'completed' ? '#22c55e' : (upload.status === 'error' ? '#ef4444' : '#3b82f6')"></i>
                        <span class="upload-file-name">{{ upload.fileName }}</span>
                      </div>
                      <div class="upload-file-progress">
                        <p-progressBar 
                          [value]="upload.progress" 
                          [showValue]="true"
                          [style]="{height: '8px'}"
                          [styleClass]="upload.status === 'error' ? 'progress-error' : ''">
                        </p-progressBar>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Lista de arquivos associados -->
                <div class="form-field full-width" *ngIf="hasAssociatedFiles">
                  <label class="field-label">
                    <i class="pi pi-paperclip"></i>
                    {{ 'os.form.files.associated' | translate }}
                    <span class="file-count-badge">{{ associatedFiles.length }}</span>
                  </label>
                  <div class="files-grid">
                    <div *ngFor="let file of associatedFiles" class="file-card">
                      <div class="file-card-header">
                        <div class="file-icon-wrapper" [ngClass]="getFileIconClass(file.fileExtension)">
                          <i class="pi" [ngClass]="getFileIcon(file.fileExtension)"></i>
                        </div>
                        <div class="file-card-info">
                          <div class="file-name" [pTooltip]="file.fileName" tooltipPosition="top">
                            {{ file.fileName }}
                          </div>
                          <div class="file-meta">
                            <span class="file-size" *ngIf="file.fileSize">
                              <i class="pi pi-info-circle"></i>
                              {{ formatFileSize(file.fileSize) }}
                            </span>
                            <span class="file-type" *ngIf="file.fileExtension">
                              {{ file.fileExtension.toUpperCase() }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="file-card-actions">
                        <button
                          pButton
                          type="button"
                          icon="pi pi-eye"
                          class="p-button-sm p-button-text p-button-primary"
                          [pTooltip]="'os.form.files.view' | translate"
                          [attr.aria-label]="'os.form.files.view' | translate"
                          tooltipPosition="top"
                          (click)="viewFile(file)">
                        </button>
                        <button
                          pButton
                          type="button"
                          icon="pi pi-download"
                          class="p-button-sm p-button-text p-button-primary"
                          [pTooltip]="'os.form.files.download' | translate"
                          [attr.aria-label]="'os.form.files.download' | translate"
                          tooltipPosition="top"
                          (click)="downloadFile(file)">
                        </button>
                        <button
                          *ngIf="!isReadOnly"
                          pButton
                          type="button"
                          icon="pi pi-trash"
                          class="p-button-sm p-button-text p-button-danger"
                          [pTooltip]="'os.form.files.remove' | translate"
                          [attr.aria-label]="'os.form.files.remove' | translate"
                          tooltipPosition="top"
                          (click)="removeFile(file)">
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Mensagem quando não há arquivos -->
                <div class="form-field full-width" *ngIf="!hasAssociatedFiles && isReadOnly">
                  <div class="files-empty-state">
                    <i class="pi pi-inbox"></i>
                    <p>{{ 'os.form.files.empty' | translate }}</p>
                  </div>
                </div>
              </div>
            </p-accordionTab>

            <!-- Referência do Serviço -->
            <p-accordionTab [header]="'os.form.accordion.serviceRef' | translate">
              <div class="form-grid">
                <div class="form-field">
                  <label for="manualPn" class="field-label">
                    <i class="pi pi-bookmark"></i>
                    {{ 'os.form.field.pn' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="manualPn"
                    formControlName="manualPn"
                    [placeholder]="'os.form.ph.manualPn' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="numRevisao" class="field-label">
                    <i class="pi pi-sort-numeric-up"></i>
                    {{ 'os.form.field.revNumberShort' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="numRevisao"
                    formControlName="numRevisao"
                    [placeholder]="'os.form.ph.revNumber' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="dataRevManual" class="field-label">
                    <i class="pi pi-calendar-plus"></i>
                    {{ 'os.form.field.revDateShort' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="dataRevManual"
                    formControlName="dataRevManual"
                    type="date"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <div class="form-field">
                  <label for="ataManual" class="field-label">
                    <i class="pi pi-book"></i>
                    {{ 'os.form.field.ata' | translate }}
                  </label>
                  <input 
                    pInputText 
                    id="ataManual"
                    formControlName="ataManual"
                    [placeholder]="'os.form.ph.ata' | translate"
                    class="form-input"
                    [readonly]="isReadOnly">
                </div>

                <app-os-ad-sb-aplicaveis
                  class="form-field full-width"
                  [fcuId]="osForm.get('fcuId')?.value"
                  [partNumber]="osForm.get('partNumber')?.value"
                  [serialNumber]="osForm.get('serialNumber')?.value"></app-os-ad-sb-aplicaveis>

                <app-os-tarefa-dados-tecnicos
                  class="form-field full-width"
                  [items]="tarefasDadosTecnicos"
                  [fcuId]="osForm.get('fcuId')?.value"
                  [partNumber]="osForm.get('partNumber')?.value"
                  [serialNumber]="osForm.get('serialNumber')?.value"
                  [readOnly]="isReadOnly"
                  (itemsChange)="onTarefasDadosTecnicosChange($event)"></app-os-tarefa-dados-tecnicos>

                <div class="form-field full-width">
                  <label for="tituloAds" class="field-label">
                    <i class="pi pi-tag"></i>
                    {{ 'os.form.field.adsTitle' | translate }}
                  </label>
                  <textarea 
                    pInputTextarea 
                    id="tituloAds"
                    formControlName="tituloAds"
                    [placeholder]="'os.form.ph.ads' | translate"
                    rows="3"
                    class="form-input"
                    [readonly]="isReadOnly">
                  </textarea>
                </div>

                <div class="form-field full-width">
                  <label for="tituloAfins" class="field-label">
                    <i class="pi pi-tag"></i>
                    {{ 'os.form.field.relatedTitle' | translate }}
                  </label>
                  <textarea 
                    pInputTextarea 
                    id="tituloAfins"
                    formControlName="tituloAfins"
                    [placeholder]="'os.form.ph.related' | translate"
                    rows="3"
                    class="form-input"
                    [readonly]="isReadOnly">
                  </textarea>
                </div>

                <div class="form-field full-width">
                  <label for="boletinsServAfins" class="field-label">
                    <i class="pi pi-file-text"></i>
                    {{ 'os.form.field.serviceBulletins' | translate }}
                  </label>
                  <textarea 
                    pInputTextarea 
                    id="boletinsServAfins"
                    formControlName="boletinsServAfins"
                    [placeholder]="'os.form.ph.bulletins' | translate"
                    rows="3"
                    class="form-input"
                    [readonly]="isReadOnly">
                  </textarea>
                </div>
              </div>
            </p-accordionTab>

            <p-accordionTab [header]="'os.form.accordion.exchange' | translate">
              <div class="form-grid">
                <div class="form-field full-width">
                  <label for="solicitacaoTrocasComentario" class="field-label">
                    <i class="pi pi-comment"></i>
                    {{ 'os.form.field.mechanicComment' | translate }}
                  </label>
                  <textarea
                    pInputTextarea
                    id="solicitacaoTrocasComentario"
                    formControlName="solicitacaoTrocasComentario"
                    rows="3"
                    class="form-input"
                    [placeholder]="'os.form.ph.exchange' | translate"
                    [readonly]="isReadOnly">
                  </textarea>
                </div>
                <div class="form-field full-width" *ngIf="!isReadOnly">
                  <button pButton type="button" icon="pi pi-plus" [label]="'os.form.troca.addProducts' | translate"
                    class="p-button-outlined" (click)="openTrocasProductSelector()"></button>
                </div>
                <div class="form-field full-width" *ngIf="trocasItems.length === 0">
                  <p class="hint-muted">{{ 'os.form.troca.noProducts' | translate }}</p>
                </div>
                <div class="form-field full-width trocas-table-wrap" *ngIf="trocasItems.length > 0">
                  <table class="trocas-items-table">
                    <thead>
                      <tr>
                        <th class="col-troca-prod">{{ 'os.form.troca.col.product' | translate }}</th>
                        <th class="col-troca-pn">{{ 'os.form.troca.col.pn' | translate }}</th>
                        <th class="col-troca-qtd">{{ 'os.form.troca.col.qty' | translate }}</th>
                        <th class="col-troca-vu">{{ 'os.form.troca.col.unit' | translate }}</th>
                        <th class="col-troca-tot">{{ 'os.form.troca.col.total' | translate }}</th>
                        <th class="col-troca-pago">{{ 'os.form.troca.col.paid' | translate }}</th>
                        <th *ngIf="!isReadOnly" class="col-troca-ac"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of trocasItems; let ti = index">
                        <td class="col-troca-prod cell-ellipsis" [pTooltip]="item.product?.name">{{ item.product?.name }}</td>
                        <td class="col-troca-pn">
                          <input pInputText class="table-in table-in-pn" [(ngModel)]="item.produtoPn" [ngModelOptions]="{standalone: true}"
                            [readonly]="isReadOnly" (ngModelChange)="onTrocasPnSnChange(item)">
                        </td>
                        <td class="col-troca-qtd">
                          <div class="troca-num-wrap troca-num-wrap-qty">
                            <p-inputNumber [(ngModel)]="item.quantidade" [ngModelOptions]="{standalone: true}" [min]="1"
                              [readonly]="isReadOnly" (ngModelChange)="updateTrocasItemTotal(item)" [showButtons]="false">
                            </p-inputNumber>
                          </div>
                        </td>
                        <td class="col-troca-vu">
                          <div class="troca-num-wrap troca-num-wrap-vu">
                            <p-inputNumber [(ngModel)]="item.valorUnitario" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2"
                              [ngModelOptions]="{standalone: true}" [readonly]="isReadOnly" (ngModelChange)="updateTrocasItemTotal(item)" [showButtons]="false">
                            </p-inputNumber>
                          </div>
                        </td>
                        <td class="col-troca-tot">{{ item.valorTotal | number:'1.2-2' }}</td>
                        <td class="pago-cell">
                          <ng-container *ngIf="podeMarcarPagoTrocasOs() && !isReadOnly">
                            <select class="pago-select" [(ngModel)]="item.pago" [ngModelOptions]="{standalone: true}">
                              <option [ngValue]="null">{{ 'os.form.troca.paid.pending' | translate }}</option>
                              <option [ngValue]="true">{{ 'os.form.troca.paid.yes' | translate }}</option>
                              <option [ngValue]="false">{{ 'os.form.troca.paid.no' | translate }}</option>
                            </select>
                          </ng-container>
                          <ng-container *ngIf="isReadOnly || !podeMarcarPagoTrocasOs()">
                            <i class="pi pi-check pago-ok" *ngIf="item.pago === true" [pTooltip]="'os.form.troca.paid.yes' | translate"></i>
                            <i class="pi pi-times pago-no" *ngIf="item.pago === false" [pTooltip]="'os.form.troca.paid.no' | translate"></i>
                            <span class="pago-pend" *ngIf="item.pago !== true && item.pago !== false" [pTooltip]="'os.form.troca.paid.waiting' | translate">—</span>
                          </ng-container>
                        </td>
                        <td *ngIf="!isReadOnly" class="col-troca-ac">
                          <button *ngIf="podeExcluirItemTroca(item)" pButton type="button" icon="pi pi-trash"
                            class="p-button-text p-button-danger p-button-sm" [pTooltip]="'os.form.troca.remove' | translate"
                            [attr.aria-label]="'os.form.troca.remove' | translate"
                            (click)="removeTrocasItem(ti)"></button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </p-accordionTab>
          </p-accordion>

          <div class="form-actions">
            <button
              *ngIf="isEditing && currentOS?.id && !isReadOnly && podeAbrirCrs"
              pButton
              type="button"
              [label]="'os.crs.btnOpen' | translate"
              icon="pi pi-verified"
              class="p-button-outlined p-button-warning"
              (click)="openCrsDialog()">
            </button>
            <button 
              pButton 
              type="button" 
              [label]="'os.form.btn.cancel' | translate" 
              icon="pi pi-times"
              class="p-button-text"
              (click)="closeOSModal()">
            </button>
            <button 
              *ngIf="!isReadOnly && !registroEncerrado"
              pButton 
              type="submit" 
              [label]="osSaveButtonLabel"
              [icon]="isEditing ? 'pi pi-check' : 'pi pi-plus'"
              class="p-button-primary"
              [disabled]="osForm.invalid || saving">
            </button>
          </div>
        </form>
      </p-dialog>

      <p-dialog
        [(visible)]="showReabrirDialog"
        [modal]="true"
        [header]="'os.form.reabrir.dialogTitle' | translate"
        [style]="{ width: '480px' }"
        [draggable]="false">
        <p *ngIf="currentOS?.crsEmitido" class="reabrir-hint">{{ 'os.form.reabrir.hintCrs' | translate }}</p>
        <label class="field-label">{{ 'os.form.reabrir.justificativa' | translate }}</label>
        <textarea
          pInputTextarea
          rows="4"
          class="w-full"
          [(ngModel)]="reabrirJustificativa"
          [placeholder]="'os.form.reabrir.justificativaPh' | translate"></textarea>
        <ng-template pTemplate="footer">
          <button pButton type="button" class="p-button-text" [label]="'os.form.btn.cancel' | translate"
            (click)="showReabrirDialog = false"></button>
          <button pButton type="button" icon="pi pi-unlock" class="p-button-warning"
            [label]="'os.form.reabrir.submit' | translate"
            [loading]="reabrindo"
            [disabled]="!reabrirJustificativa || reabrirJustificativa.trim().length < 15"
            (click)="confirmReabrir()"></button>
        </ng-template>
      </p-dialog>

      <app-product-selector
        [(visible)]="showTrocasProductSelector"
        [existingItems]="trocasItemsForSelector"
        (productsSelected)="onTrocasProductsSelected($event)"
        (cancelled)="showTrocasProductSelector = false">
      </app-product-selector>

      <!-- Modal de Produtos Associados ao FCU -->
      <p-dialog 
        styleClass="as-hero-dialog" [(visible)]="showFcuProductsModal" 
        [modal]="true" 
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
        [style]="{width: '800px', maxHeight: '90vh'}"
        [header]="'os.form.fcuModal.title' | translate"
        (onHide)="closeFcuProductsModal()">
        
        <div class="fcu-products-modal-content">
          <!-- Informações do FCU no topo -->
          <div *ngIf="selectedFcuForProducts" class="fcu-header-card">
            <div class="fcu-header-info">
              <div class="fcu-header-title">
                <i class="pi pi-microchip fcu-icon"></i>
                <div>
                  <h3>{{ selectedFcuForProducts.fcuCodigo || ('os.form.fcu.label' | translate) }}</h3>
                  <p *ngIf="selectedFcuForProducts.fcuDescription">{{ selectedFcuForProducts.fcuDescription }}</p>
                  <div class="fcu-details" *ngIf="selectedFcuForProducts.pn">
                    <span class="fcu-detail-item">
                      <i class="pi pi-tag"></i> {{ 'os.form.fcuModal.pn' | translate }} {{ selectedFcuForProducts.pn }}
                    </span>
                    <span class="fcu-detail-item" *ngIf="selectedFcuForProducts.modelo">
                      <i class="pi pi-cog"></i> {{ 'os.form.field.model' | translate }}: {{ selectedFcuForProducts.modelo }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lista de Produtos Associados -->
          <div class="products-section">
            <h4 class="products-section-title">
              <i class="pi pi-box"></i>
              {{ 'os.form.fcuModal.associated' | translate }}
            </h4>

            <!-- Loading -->
            <div *ngIf="loadingFcuProducts" class="loading-container">
              <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
              <p>{{ 'os.form.fcuModal.loading' | translate }}</p>
            </div>

            <!-- Lista vazia -->
            <div *ngIf="!loadingFcuProducts && fcuAssociatedProducts.length === 0" class="empty-products">
              <i class="pi pi-info-circle" style="font-size: 2rem; color: #9ca3af;"></i>
              <p>{{ 'os.form.fcuModal.empty' | translate }}</p>
            </div>

            <!-- Grid de Tickets de Produtos -->
            <div *ngIf="!loadingFcuProducts && fcuAssociatedProducts.length > 0" class="products-grid">
              <div 
                *ngFor="let associacao of fcuAssociatedProducts" 
                class="product-ticket"
                [ngClass]="'ticket-' + getProductTicketColor(associacao)"
                [style.color]="getProductTicketTextColor(associacao)">
                <div class="product-ticket-header">
                  <h5 class="product-name">{{ associacao.productName || ('os.form.fcuModal.noName' | translate) }}</h5>
                  <p-tag 
                    [value]="fcuProductTagLabel(associacao)"
                    [severity]="getProductTicketColor(associacao)"
                    [style]="{'font-weight': 'bold'}">
                  </p-tag>
                </div>
                <div class="product-ticket-body">
                  <div class="product-info-row">
                    <div class="product-info-item">
                      <i class="pi pi-shopping-cart"></i>
                      <span class="info-label">{{ 'os.form.fcuModal.qtyRequired' | translate }}</span>
                      <span class="info-value">{{ associacao.qtdProduct || 0 }}</span>
                    </div>
                    <div class="product-info-item">
                      <i class="pi pi-warehouse"></i>
                      <span class="info-label">{{ 'os.form.fcuModal.qtyStock' | translate }}</span>
                      <span class="info-value">{{ associacao.productQuantity || 0 }}</span>
                    </div>
                  </div>
                  <div class="product-info-row" *ngIf="associacao.productPn">
                    <div class="product-info-item">
                      <i class="pi pi-tag"></i>
                      <span class="info-label">{{ 'os.form.fcuModal.pn' | translate }}</span>
                      <span class="info-value">{{ associacao.productPn }}</span>
                    </div>
                  </div>
                  <div class="product-info-row" *ngIf="associacao.productDescription">
                    <div class="product-info-item full-width">
                      <i class="pi pi-info-circle"></i>
                      <span class="info-label">{{ 'os.form.fcuModal.description' | translate }}</span>
                      <span class="info-value">{{ associacao.productDescription }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button 
            pButton 
            type="button" 
            [label]="'os.form.btn.close' | translate" 
            icon="pi pi-times"
            class="p-button-secondary"
            (click)="closeFcuProductsModal()">
          </button>
        </ng-template>
      </p-dialog>

      <!-- OS Consult Modal -->
      <p-dialog 
        styleClass="as-hero-dialog" [(visible)]="showOSConsultModal" 
        [modal]="true" 
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
        [style]="{width: '900px'}"
        [header]="'os.form.consult.title' | translate"
        [transitionOptions]="'300ms cubic-bezier(0.25, 0.8, 0.25, 1)'"
        (onHide)="closeOSConsultModal()">
        
        <div class="os-consult-content">
          <!-- Search and Filters -->
          <div class="consult-filters">
            <div class="search-container">
              <div class="search-input-wrapper">
                <i class="pi pi-search search-icon"></i>
                <input 
                  type="text" 
                  pInputText 
                  [(ngModel)]="consultSearchQuery" 
                  [attr.aria-label]="'os.form.consult.search' | translate"
                  [placeholder]="'os.form.consult.search' | translate" 
                  (keyup.enter)="searchOSConsult()"
                  class="search-input">
              </div>
              <button 
                pButton 
                type="button" 
                icon="pi pi-search" 
                class="p-button-outlined search-btn"
                (click)="searchOSConsult()"
                [pTooltip]="'os.list.tooltip.search' | translate"
                [attr.aria-label]="'os.list.tooltip.search' | translate"
                tooltipPosition="top">
              </button>
              <button 
                pButton 
                type="button" 
                icon="pi pi-times" 
                class="p-button-text clear-btn"
                (click)="clearOSConsult()"
                [pTooltip]="'os.form.consult.tooltip.clear' | translate"
                [attr.aria-label]="'os.form.consult.tooltip.clear' | translate"
                tooltipPosition="top">
              </button>
            </div>
          </div>

          <!-- OS List Table -->
          <div class="consult-table-container">
            <p-table
              [value]="consultOSList" 
              [loading]="consultLoading"
              [paginator]="true"
              [first]="consultTableFirst"
              [rows]="consultPageSize"
              [totalRecords]="consultTotal"
              [lazy]="true"
              (onLazyLoad)="loadConsultLazy($event)"
              [sortField]="consultSortField"
              [sortOrder]="consultSortOrder"
              [showCurrentPageReport]="true"
              [currentPageReportTemplate]="'os.list.pageReport' | translate"
              [rowsPerPageOptions]="listRowsPerPageOptions"
              styleClass="p-datatable-sm consult-table">
              
              <ng-template pTemplate="header">
                <tr>
                  <th pSortableColumn="idOs" style="width: 100px;">
                    {{ 'os.form.consult.col.number' | translate }}
                    <p-sortIcon field="idOs"></p-sortIcon>
                  </th>
                  <th pSortableColumn="clienteNome">
                    {{ 'os.form.consult.col.client' | translate }}
                    <p-sortIcon field="clienteNome"></p-sortIcon>
                  </th>
                  <th pSortableColumn="dataAbertura" style="width: 150px;">
                    {{ 'os.form.consult.col.openDate' | translate }}
                    <p-sortIcon field="dataAbertura"></p-sortIcon>
                  </th>
                  <th style="width: 100px;">
                    {{ 'os.form.consult.col.action' | translate }}
                  </th>
                </tr>
              </ng-template>
              
              <ng-template pTemplate="body" let-os>
                <tr
                  [class.selected-row]="selectedOSId === os.idOs"
                  [class.selecting]="isSelectingOS && selectedOSId === os.idOs"
                  [ngClass]="trocaEventualListagem(os)?.rowClass">
                  <td>
                    <div class="consult-os-id-cell">
                      <i
                        *ngIf="trocaEventualListagem(os) as trocaInd"
                        class="troca-ind-icon pi"
                        [ngClass]="trocaInd.icon"
                        [class.troca-ind--info]="trocaInd.state === 'info'"
                        [class.troca-ind--pendente]="trocaInd.state === 'pendente'"
                        [class.troca-ind--pago]="trocaInd.state === 'pago'"
                        [class.troca-ind--nao-pago]="trocaInd.state === 'naoPago'"
                        [pTooltip]="trocaInd.tooltip"
                        tooltipPosition="top"></i>
                      <span class="os-number">{{ formatOSId(os) }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="client-name">{{ os.clienteNome || '-' }}</span>
                  </td>
                  <td>
                    <span class="opening-date">{{ formatDate(os.dataAbertura) }}</span>
                  </td>
                  <td>
                    <div class="action-cell">
                      <button 
                        *ngIf="selectedOSId !== os.idOs"
                        pButton 
                        type="button" 
                        icon="pi pi-check" 
                        class="p-button-success p-button-sm select-btn"
                        (click)="selectOS(os)"
                        [pTooltip]="'os.form.consult.select' | translate"
                        [attr.aria-label]="'os.form.consult.select' | translate"
                        tooltipPosition="top"
                        [disabled]="isSelectingOS">
                      </button>
                      <div *ngIf="selectedOSId === os.idOs" class="selection-animation">
                        <i class="pi pi-check-circle selection-icon"></i>
                        <span class="selection-text">{{ 'os.form.consult.selected' | translate }}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-template>
              
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="4" class="text-center">
                    <div class="empty-state">
                      <i class="pi pi-file" style="font-size: 3rem; color: #ccc;"></i>
                      <p>{{ 'os.list.empty' | translate }}</p>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      </p-dialog>

      <!-- Modal de Déficit do Kit FCU (detalhes da OS já salva) -->
      <p-dialog
        styleClass="as-hero-dialog" [(visible)]="showKitDeficitModal"
        [modal]="true"
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
        [style]="{width: '760px'}"
        [header]="kitDeficitModalHeader"
        (onHide)="closeKitDeficitModal()">

        <div class="kit-deficit-modal">
          <div class="kit-deficit-summary" *ngIf="kitDeficitOs">
            <div class="kit-deficit-summary-row">
              <span class="kit-deficit-label">{{ 'os.form.kit.client' | translate }}</span>
              <span class="kit-deficit-value">{{ kitDeficitOs.clienteNome || '-' }}</span>
            </div>
            <div class="kit-deficit-summary-row">
              <span class="kit-deficit-label">{{ 'os.form.kit.fcuPn' | translate }}</span>
              <span class="kit-deficit-value">{{ kitDeficitOs.fcuPn || kitDeficitOs.partNumber || '-' }}</span>
            </div>
            <div class="kit-deficit-summary-row" *ngIf="kitDeficitOs.fcuCodigo">
              <span class="kit-deficit-label">{{ 'os.form.kit.fcuCode' | translate }}</span>
              <span class="kit-deficit-value">{{ kitDeficitOs.fcuCodigo }}</span>
            </div>
          </div>

          <div *ngIf="loadingKitDeficit" class="kit-deficit-loading">
            <i class="pi pi-spin pi-spinner"></i>
            <span>{{ 'os.form.kit.loading' | translate }}</span>
          </div>

          <div *ngIf="!loadingKitDeficit && kitDeficitItens.length === 0" class="kit-deficit-empty">
            <i class="pi pi-info-circle"></i>
            <span>{{ 'os.form.kit.empty' | translate }}</span>
          </div>

          <p-table
            *ngIf="!loadingKitDeficit && kitDeficitItens.length > 0"
            [value]="kitDeficitItens"
            styleClass="p-datatable-sm kit-deficit-table">
            <ng-template pTemplate="header">
              <tr>
                <th>{{ 'os.form.kit.col.pn' | translate }}</th>
                <th>{{ 'os.form.kit.col.product' | translate }}</th>
                <th class="num-col">{{ 'os.form.kit.col.required' | translate }}</th>
                <th class="num-col">{{ 'os.form.kit.col.available' | translate }}</th>
                <th class="num-col">{{ 'os.form.kit.col.deficit' | translate }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td><strong>{{ item.productPn || '-' }}</strong></td>
                <td>{{ item.productName || '-' }}</td>
                <td class="num-col">{{ item.quantidadeNecessaria }}</td>
                <td class="num-col">{{ item.quantidadeDisponivel }}</td>
                <td class="num-col"><strong class="kit-deficit-value-faltante">{{ item.deficit }}</strong></td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <ng-template pTemplate="footer">
          <button pButton type="button" [label]="'os.form.btn.close' | translate" icon="pi pi-times"
                  class="p-button-text" (click)="closeKitDeficitModal()"></button>
        </ng-template>
      </p-dialog>

      <app-os-crs-dialog
        [(visible)]="crsDialogVisible"
        [osId]="currentOS?.id ?? null"
        [numeroOs]="currentOS?.id ?? null"
        [canEmit]="podeEmitirCrs">
      </app-os-crs-dialog>

      <!-- Toast Messages -->
      <p-toast></p-toast>
      
      <!-- Confirmation Dialog -->
      <p-confirmDialog [closeOnEscape]="true" [dismissableMask]="false"></p-confirmDialog>
    </div>
  `,
  styleUrls: ['./os-list.component.scss', '../shared/styles/list-styles.scss']
})
export class OSListComponent implements OnInit, OnDestroy {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  get osModalHeader(): string {
    if (this.isReadOnly) return this.i18n.translate('os.form.dialog.view');
    if (this.isEditing) return this.i18n.translate('os.form.dialog.edit');
    return this.i18n.translate('os.form.dialog.new');
  }

  get kitDeficitModalHeader(): string {
    const base = this.i18n.translate('os.form.kit.title');
    if (!this.kitDeficitOs) return base;
    return `${base} — OS ${this.formatOSId(this.kitDeficitOs)}`;
  }

  get osNumberPlaceholder(): string {
    return this.currentOS?.id != null
      ? this.formatOSId(this.currentOS)
      : this.i18n.translate('os.form.numberGeneratedOnSave');
  }

  get osSaveButtonLabel(): string {
    return this.isEditing
      ? this.i18n.translate('os.form.btn.update')
      : this.i18n.translate('os.form.btn.create');
  }

  fcuProductTagLabel(associacao: AssociacaoFcu): string {
    const c = this.getProductTicketColor(associacao);
    if (c === 'danger') return this.i18n.translate('os.form.fcuModal.tag.critical');
    if (c === 'warning') return this.i18n.translate('os.form.fcuModal.tag.warning');
    return this.i18n.translate('os.form.fcuModal.tag.ok');
  }

  private api = inject(OSService);
  private blingApi = inject(BlingApiService);
  private fcuApi = inject(FcuCompatService);
  private fabricanteService = inject(FabricanteService);
  private associacaoFcuService = inject(AssociacaoFcuService);
  private osFileService = inject(OSFileService);
  private tipoServicoService = inject(TipoServicoService);
  private publicacaoTecnicaService = inject(PublicacaoTecnicaService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private branding = inject(BrandingService);
  private cdr = inject(ChangeDetectorRef);
  readonly appLogoDataUri = getDefaultAppLogoUrlAbsolute();
  
  // Expor Math para o template
  Math = Math;
  private messageService = inject(MessageService);

  private toast(
    severity: 'success' | 'info' | 'warn' | 'error',
    summaryKey: string,
    detailKey?: string,
    detailParams?: Record<string, string>,
    life?: number
  ): void {
    toastKey(this.messageService, this.i18n, severity, summaryKey, detailKey, detailParams, life);
  }

  private saveToastSuffixes(fileCount: number, preview: KitFcuDeficitPreview | null): { files: string; deficit: string } {
    const files =
      fileCount > 0
        ? this.i18n.translate('os.list.toast.suffix.files', { count: String(fileCount) })
        : '';
    const deficit =
      preview?.temDeficit
        ? this.i18n.translate('os.list.toast.suffix.deficit', {
            count: String(preview.quantidadeItensFaltantes)
          })
        : '';
    return { files, deficit };
  }
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private estoqueService = inject(EstoqueService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tenantFeatures = inject(TenantFeatureService);

  rows: any[] = [];
  dashboardExtendido = false;
  painelResumo: OsPainelResumo | null = null;
  total = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  pageIndex = 0;
  sortField = 'id';
  sortOrder: 1 | -1 = 1;
  q = '';
  loading = true;
  searching = false;
  
  private searchSubject = new Subject<string>();
  private readonly requestGuard = createStaleRequestGuard();
  private readonly consultRequestGuard = createStaleRequestGuard();

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  get consultTableFirst(): number {
    return this.consultPageIndex * this.consultPageSize;
  }

  // Modal properties
  showOSModal = false;
  isEditing = false;
  isReadOnly = false;
  saving = false;
  currentOS: OS | null = null;
  crsDialogVisible = false;
  registroEncerrado = false;
  showReabrirDialog = false;
  reabrirJustificativa = '';
  reabrindo = false;
  blingFluxo: BlingPropostaFluxoView | null = null;
  reprocessandoFluxoBling = false;

  // Consult Modal properties
  showOSConsultModal = false;
  consultOSList: any[] = [];
  consultTotal = 0;
  consultPageSize = DEFAULT_LIST_PAGE_SIZE;
  consultPageIndex = 0;
  consultSortField = 'idOs';
  consultSortOrder: 1 | -1 = -1;
  consultSearchQuery = '';
  consultLoading = false;
  selectedOSId: number | null = null;
  isSelectingOS = false;

  // Form
  osForm!: FormGroup;

  // FCU Options
  fcuOptions: any[] = [];
  private osFormLookupsLoaded = false;
  fcuList: Fcu[] = [];

  // Modal de Produtos Associados ao FCU
  showFcuProductsModal = false;
  selectedFcuForProducts: Fcu | null = null;
  fcuAssociatedProducts: AssociacaoFcu[] = [];
  loadingFcuProducts = false;

  // Tipo Serviço Options - carregado do backend
  tipoServicoOptions: TipoServico[] = [];

  // Fabricante Options - carregado do backend para o select
  fabricanteOptions: { id: number; nome: string }[] = [];

  // Arquivos disponíveis e selecionados
  availableFiles: OSFile[] = [];
  selectedFiles: OSFile[] = [];
  loadingFiles = false;
  
  // Upload de arquivos
  uploadProgress: UploadProgress[] = [];
  isUploading = false;
  isDragOver = false;

  showTrocasProductSelector = false;
  trocasItems: OsTrocaItem[] = [];
  tarefasDadosTecnicos: OsTarefaDadoTecnico[] = [];

  // Modal de detalhes de déficit do kit FCU (acionado pelo indicador na listagem)
  showKitDeficitModal = false;
  kitDeficitOs: any = null;
  kitDeficitItens: KitFcuDeficitItem[] = [];
  loadingKitDeficit = false;

  get trocasItemsForSelector(): PropostaItem[] {
    return this.trocasItems;
  }

  podeMarcarPagoTrocasOs(): boolean {
    return this.authService.podeMarcarPagoTrocasOs();
  }

  /** Mecânico/outros: só remove linha se pagamento ainda não foi definido (pendente). Suprimento/Admin/Diretor: sempre em edição. */
  podeExcluirItemTroca(item: OsTrocaItem): boolean {
    if (this.isReadOnly) {
      return false;
    }
    if (this.podeMarcarPagoTrocasOs()) {
      return true;
    }
    return item.pago !== true && item.pago !== false;
  }

  ngOnInit() {
    this.initForm();
    this.dashboardExtendido = this.tenantFeatures.isOn(TenantFeatureCodes.MRO_OS_DASHBOARD_EXTENDIDO);
    if (this.dashboardExtendido) {
      this.api.painelResumo().subscribe({
        next: (r) => { this.painelResumo = r; },
        error: () => { this.painelResumo = null; }
      });
    }
    
    // Dropdowns FCU/fabricante/tipo só ao abrir o formulário — listagem carrega mais rápido.
    // Configurar busca inteligente com debounce
    this.searchSubject.pipe(
      debounceTime(300), // Aguarda 300ms após o usuário parar de digitar
      distinctUntilChanged() // Só executa se o valor mudou
    ).subscribe(searchTerm => {
      this.q = searchTerm;
      this.loadLazy({ first: 0, rows: this.size });
    });

    const editIdRaw = this.route.snapshot.queryParamMap.get('editId');
    if (editIdRaw) {
      const id = Number(editIdRaw);
      if (!Number.isNaN(id) && id > 0) {
        this.api.getById(id).subscribe({
          next: (full) => {
            this.editOS(full as any);
            this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
          },
          error: () => {
            this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
          }
        });
      }
    }

    // PrimeNG lazy table: garantir 1.ª carga após bootstrap (evita race com AuthService/interceptor no smoke Puppeteer).
    setTimeout(() => this.loadLazy({ first: 0, rows: this.size }), 100);
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  onSearchChange(event: any) {
    this.searching = true;
    const searchValue = event.target.value.trim();
    // A busca será feita pelo backend nos campos idOs e clienteNome
    // Se for número, busca por ID da OS, caso contrário busca por nome do cliente
    this.searchSubject.next(searchValue);
    // Resetar flag de busca após um tempo
    setTimeout(() => {
      this.searching = false;
    }, 350);
  }

  initForm() {
    this.osForm = this.fb.group({
      // idOs não é mais um campo do formulário - será gerado pelo backend
      adsDas: [''],
      ataManual: [''],
      clienteNome: [''],
      dataConclusaoServ: [''],
      dataFechamento: [''],
      dataRevManual: [''],
      dtAbertura: [''],
      fabricanteId: [null, [Validators.min(0)]],
      fcuId: [null, [Validators.required, Validators.min(1)]],
      tsn: [''],
      tso: [''],
      marcasMatricula: [''],
      motor: [''],
      snMotor: [''],
      manualPn: [''],
      numOsOriginal: [''],
      numRevisao: [''],
      obsConclusaoServ: [''],
      obsFimServ: [''],
      serialNumber: [''],
      obsIniServ: [''],
      tipoServicoId: [null],
      inicioServico: [''],
      fimServico: [''],
      tituloAds: [''],
      tituloAfins: [''],
      boletinsServAfins: [''],
      partNumber: [''],
      // Campos adicionais para auto-preenchimento
      fabricanteNome: [''],
      pn: [''],
      modelo: [''],
      nome: [''],
      // Arquivos associados
      fileNames: [],
      solicitacaoTrocasComentario: ['']
    });
  }

  toSort(event: any) {
    this.sortField = event.field;
    this.sortOrder = event.order;
    this.reload();
  }

  reload() {
    const seq = this.requestGuard.bump();
    this.loading = true;
    this.api.list({
      page: this.pageIndex,
      size: this.size,
      sort: this.sortField + ',' + (this.sortOrder === 1 ? 'asc' : 'desc'),
      q: this.q.trim() || undefined
    }).subscribe({
      next: (response) => {
        if (this.requestGuard.isStale(seq)) {
          return;
        }
        // Mapear os dados para garantir que idOs seja preenchido corretamente
        // Se idOs não existir ou for 0, usar o id do banco
        // Também mapear dados do Fabricante e FCU que vêm do backend
        this.rows = response.items.map((os: any) => {
          // Extrair ID do Fabricante de diferentes fontes
          const fabricanteId = os.idFabricanteId || (os.idFabricante?.id) || (os.fabricante?.id) || os.fabricanteId;
          // Extrair ID do FCU de diferentes fontes
          const fcuId = os.idFcuId || (os.idFcu?.id ? Number(os.idFcu.id) : null) || (os.fcu?.id ? Number(os.fcu.id) : null) || os.fcuId;
          
          // Extrair dados do Fabricante do objeto se disponível (vem do backend)
          // Java Records expõem métodos, não propriedades, então precisamos verificar ambos
          const fabricanteDto = os.idFabricante || os.fabricante;
          const fabricanteNome = os.fabricanteNome || os.nomeFabricante || 
            (fabricanteDto ? (fabricanteDto.nome || (typeof fabricanteDto.nome === 'function' ? fabricanteDto.nome() : null)) : null) || '';
          
          // Extrair dados do FCU do objeto se disponível (vem do backend)
          // Java Records expõem métodos, não propriedades, então precisamos verificar ambos
          const fcuDto = os.idFcu || os.fcu;
          const fcuPn = os.fcuPn || 
            (fcuDto ? (fcuDto.pn || (typeof fcuDto.pn === 'function' ? fcuDto.pn() : null)) : null) || '';
          const fcuModelo = os.fcuModelo || 
            (fcuDto ? (fcuDto.modelo || (typeof fcuDto.modelo === 'function' ? fcuDto.modelo() : null)) : null) || '';
          const fcuDescription = os.fcuDescription || 
            (fcuDto ? (fcuDto.fcuDescription || (typeof fcuDto.fcuDescription === 'function' ? fcuDto.fcuDescription() : null)) : null) || '';
          const fcuCodigo = os.fcuCodigo || 
            (fcuDto ? (fcuDto.fcuCodigo || (typeof fcuDto.fcuCodigo === 'function' ? fcuDto.fcuCodigo() : null)) : null) || '';
          const fcuSerialNumber = os.fcuSerialNumber ||
            (fcuDto ? (fcuDto.serialNumber || (typeof fcuDto.serialNumber === 'function' ? fcuDto.serialNumber() : null)) : null) || '';
          const fcuAtaManual = os.fcuAtaManual ||
            (fcuDto ? (fcuDto.ataManual || (typeof fcuDto.ataManual === 'function' ? fcuDto.ataManual() : null)) : null) || '';
          const fcuDataRevManual = os.fcuDataRevManual ||
            (fcuDto ? (fcuDto.dataRevManual || (typeof fcuDto.dataRevManual === 'function' ? fcuDto.dataRevManual() : null)) : null) || '';
          const fcuNumRevisao = os.fcuNumRevisao ||
            (fcuDto ? (fcuDto.numRevisao || (typeof fcuDto.numRevisao === 'function' ? fcuDto.numRevisao() : null)) : null) || '';
          
          const mappedOs = {
            ...os,
            id: os.id, // Garantir que o id seja preservado
            idOs: os.idOs && os.idOs !== 0 ? os.idOs : (os.id || 0),
            // Mapear IDs para compatibilidade
            fabricanteId: fabricanteId,
            fcuId: fcuId,
            // Mapear dados para exibição
            fabricanteNome: fabricanteNome,
            fcuDescription: fcuDescription,
            fcuCodigo: fcuCodigo,
            fcuModelo: fcuModelo,
            fcuPn: fcuPn,
            fcuSerialNumber: fcuSerialNumber,
            fcuAtaManual: fcuAtaManual,
            fcuDataRevManual: fcuDataRevManual,
            fcuNumRevisao: fcuNumRevisao
          };
          return mappedOs;
        });
        this.total = response.totalElements;
        this.loading = false;
      },
      error: (error) => {
        if (this.requestGuard.isStale(seq)) {
          return;
        }
        this.loading = false;
        console.error('Failed to load work order:', error);
        this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.loadDataError', {
          msg: extractApiErrorMessage(error, this.i18n, 'os.list.toast.summary.error')
        });
      }
    });
  }

  loadLazy(event?: LazyLoadEvent) {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    if (event?.sortField) this.sortField = event.sortField;
    if (event?.sortOrder) this.sortOrder = event.sortOrder;
    this.reload();
  }

  buscar() {
    this.pageIndex = 0;
    this.loadLazy({ first: 0, rows: this.size });
  }

  clear() {
    this.q = '';
    this.pageIndex = 0;
    this.searchSubject.next('');
    this.loadLazy({ first: 0, rows: this.size });
  }

  getDisplayedCount(): number {
    // Retorna o número real de registros exibidos na página atual
    // Se estamos na última página, pode ter menos registros que o tamanho da página
    const startIndex = this.pageIndex * this.size;
    const endIndex = Math.min(startIndex + this.size, this.total);
    return Math.max(0, endIndex - startIndex);
  }

  get hasAssociatedFiles(): boolean {
    return !!(this.currentOS?.files && this.currentOS.files.length > 0);
  }

  get associatedFiles(): OSFile[] {
    return this.currentOS?.files || [];
  }

  /**
   * Alinhado ao backend ({@code RequiresFuncionalidades}): evita pedidos que geram 403 e toasts duplicados
   * (interceptor já mostra "Acesso negado" quando {@code funcionalidadeCodigos} está preenchido).
   */
  /** Abre CRS para emitir (perfil com CRS_EMITIR) ou só baixar PDF se já emitido. */
  get podeAbrirCrs(): boolean {
    if (this.hasFuncionalidade('CRS_EMITIR')) {
      return true;
    }
    return !!(this.currentOS?.crsEmitido && this.hasFuncionalidade('ORDEM_SERVICO'));
  }

  get podeEmitirCrs(): boolean {
    return this.hasFuncionalidade('CRS_EMITIR');
  }

  private hasFuncionalidade(codigo: string): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return false;
    }
    if (isSuperPerfil(user)) {
      return true;
    }
    const codigos = user.funcionalidadeCodigos;
    if (codigos == null || codigos.length === 0) {
      return true;
    }
    const want = canonFuncionalidadeCodigo(codigo);
    return codigos.some((c) => canonFuncionalidadeCodigo(c) === want);
  }

  /** Carrega lookups do formulário OS só quando o modal abre (não bloqueia a listagem). */
  private ensureOsFormLookupsLoaded(): void {
    if (this.osFormLookupsLoaded) {
      return;
    }
    this.osFormLookupsLoaded = true;
    if (this.hasFuncionalidade('FCU')) {
      this.loadFcuOptions();
    }
    if (this.hasFuncionalidade('TIPOS_SERVICO')) {
      this.loadTipoServicoOptions();
    }
    if (this.hasFuncionalidade('FABRICANTES')) {
      this.loadFabricanteOptions();
    }
  }

  loadFcuOptions() {
    this.fcuApi.list({ size: 200 }).subscribe({
      next: (response: any) => {
        this.fcuList = response.items;
        this.fcuOptions = response.items.map((fcu: any) => ({
          id: fcu.id,
          fcuCodigo: fcu.fcuCodigo,
          fcuDescription: fcu.fcuDescription,
          pn: fcu.pn || '',
          displayText: fcu.pn || fcu.fcuCodigo || this.i18n.translate('os.form.fcu.noPn')
        }));
      },
      error: (err) => {
        if (err?.status === 403) {
          return;
        }
        this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.loadFcuError');
      }
    });
  }

  loadTipoServicoOptions() {
    this.tipoServicoService.list({ size: 200 }).subscribe({
      next: (response: any) => {
        this.tipoServicoOptions = response.items || [];
      },
      error: (err) => {
        if (err?.status === 403) {
          return;
        }
        this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.loadServiceTypeError');
      }
    });
  }

  loadFabricanteOptions() {
    this.fabricanteService.list({ size: 200 }).subscribe({
      next: (response: any) => {
        const items = response.items || [];
        this.fabricanteOptions = items.map((f: any) => ({
          id: f.id,
          nome: f.nome || f.name || ''
        })).filter((f: any) => f.nome !== undefined && f.nome !== null);
      },
      error: (err) => {
        if (err?.status === 403) {
          return;
        }
        this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.loadManufacturerError');
      }
    });
  }

  /** Formato do ID na listagem: BEL-[ID]/[Ano que a OS foi aberta] */
  formatOSId(os: { id?: number | null; dtAbertura?: string | null; dataAbertura?: string | null } | null): string {
    if (!os || os.id == null) return '-';
    const year = os.dtAbertura || os.dataAbertura;
    const yearStr = year ? new Date(year).getFullYear() : '-';
    return `BEL-${os.id}/${yearStr}`;
  }

  crsListagemTooltip(row: OS): string {
    const data = row.crsEmitidoEm
      ? formatUiDateTime(this.i18n.getCurrentLanguage(), row.crsEmitidoEm, 'dateTime')
      : '—';
    return this.i18n.translate('os.list.tooltip.crs', {
      data,
      cert: row.crsCertificadoNumero || '—'
    });
  }

  onFcuChange(event: any) {
    const fcuId = event.value;
    if (fcuId) {
      const selectedFcu = this.fcuList.find(fcu => fcu.id === fcuId);
      if (selectedFcu) {
        // Abrir modal de produtos associados primeiro
        this.selectedFcuForProducts = selectedFcu;
        this.loadFcuAssociatedProducts(fcuId);
        this.showFcuProductsModal = true;
      }
    } else {
      // Limpar campos quando FCU for desmarcado
      this.osForm.patchValue({
        fabricanteId: null,
        pn: '',
        modelo: '',
        serialNumber: '',
        tsn: '',
        tso: '',
        marcasMatricula: '',
        motor: '',
        snMotor: '',
        nome: '',
        ataManual: '',
        dataRevManual: '',
        numRevisao: '',
        manualPn: '',
        fabricanteNome: '',
        clienteNome: ''
      });
    }
  }

  loadFcuAssociatedProducts(fcuId: number) {
    this.loadingFcuProducts = true;
    this.associacaoFcuService.getByFcuId(fcuId).subscribe({
      next: (associacoes) => {
        this.fcuAssociatedProducts = associacoes;
        this.loadingFcuProducts = false;
      },
      error: (error) => {
        this.fcuAssociatedProducts = [];
        this.loadingFcuProducts = false;
        this.toast('warn', 'os.list.toast.summary.warn', 'os.list.toast.fcuProductsWarn');
      }
    });
  }

  closeFcuProductsModal() {
    const fcuToFill = this.selectedFcuForProducts;
    this.showFcuProductsModal = false;
    this.selectedFcuForProducts = null;
    this.fcuAssociatedProducts = [];
    
    // Após fechar o modal, preencher os campos do formulário
    if (fcuToFill) {
      this.fillFormWithFcuData(fcuToFill);
    }
  }

  fillFormWithFcuData(selectedFcu: Fcu) {
    // Auto-preenchimento dos campos básicos do FCU (Descrição do Artigo)
    this.osForm.patchValue({
      fabricanteId: selectedFcu.idFabricante,
      pn: selectedFcu.pn,
      modelo: selectedFcu.modelo,
      serialNumber: selectedFcu.serialNumber,
      tsn: '', // Campo não disponível no FCU
      tso: '', // Campo não disponível no FCU
      marcasMatricula: '', // Campo não disponível no FCU
      motor: '', // Campo não disponível no FCU
      snMotor: '', // Campo não disponível no FCU
      nome: selectedFcu.fcuDescription,
      clienteNome: '' // Será preenchido quando tivermos a API de clientes
    });
    // fabricanteId já foi definido acima; o select de fabricante exibe o nome a partir de fabricanteOptions

    // Buscar publicação técnica associada ao FCU para preencher Referência do Serviço
    if (selectedFcu.id) {
      this.publicacaoTecnicaService.getPublicacaoByFcuId(selectedFcu.id).subscribe({
        next: (publicacao) => {
          if (publicacao && publicacao.publicacaoId) {
            // FCU está associado a uma publicação - preencher com dados da publicação
            this.osForm.patchValue({
              ataManual: publicacao.publicacaoAtaManual || '',
              numRevisao: publicacao.publicacaoNumeroRevisao || '',
              dataRevManual: publicacao.fcuDataRevManual || '', // Data de revisão vem da publicação
              manualPn: publicacao.publicacaoTipoManual || ''
            });
            this.toast('info', 'os.list.toast.summary.pubFound', 'os.list.toast.pubAutoFill');
          } else {
            // FCU não está associado a nenhuma publicação - campos vazios para preenchimento manual
            this.osForm.patchValue({
              ataManual: '',
              numRevisao: '',
              dataRevManual: '',
              manualPn: ''
            });
          }
          this.cdr.detectChanges();
        },
        error: () => {
          // Em caso de erro, deixar campos vazios para preenchimento manual
          this.osForm.patchValue({
            ataManual: '',
            numRevisao: '',
            dataRevManual: '',
            manualPn: ''
          });
        }
      });
    } else {
      // Se não houver ID do FCU, limpar campos de referência
      this.osForm.patchValue({
        ataManual: '',
        numRevisao: '',
        dataRevManual: '',
        manualPn: ''
      });
    }
  }

  getProductTicketColor(associacao: AssociacaoFcu): string {
    const qtdRequerida = associacao.qtdProduct || 0;
    const qtdEstoque = associacao.productQuantity || 0;

    // Se não há quantidade requerida, considerar como OK (azul)
    if (qtdRequerida === 0) {
      return 'info';
    }

    // Vermelho: estoque < requerido
    if (qtdEstoque < qtdRequerida) {
      return 'danger'; // Vermelho
    }

    // Amarelo: estoque está próximo do requerido (entre 100% e 120% do requerido)
    const percentual = (qtdEstoque / qtdRequerida) * 100;
    if (percentual >= 100 && percentual <= 120) {
      return 'warning'; // Amarelo
    }

    // Azul: estoque > 120% do requerido
    return 'info'; // Azul
  }

  getProductTicketTextColor(associacao: AssociacaoFcu): string {
    const color = this.getProductTicketColor(associacao);
    
    // Para vermelho, usar texto branco para melhor contraste
    if (color === 'danger') {
      return '#ffffff';
    }
    
    // Para amarelo, usar texto escuro
    if (color === 'warning') {
      return '#1f2937';
    }
    
    // Para azul, usar texto branco
    return '#ffffff';
  }

  addNew() {
    this.ensureOsFormLookupsLoaded();
    this.isEditing = false;
    this.isReadOnly = false;
    this.registroEncerrado = false;
    this.currentOS = null;
    this.osForm.reset();
    this.osForm.patchValue({
      adsDas: '',
      ataManual: '',
      clienteNome: '',
      dataConclusaoServ: '',
      dataFechamento: '',
      dataRevManual: '',
      dtAbertura: '',
      fabricanteId: null,
      fcuId: null,
      tsn: '',
      tso: '',
      marcasMatricula: '',
      motor: '',
      snMotor: '',
      manualPn: '',
      numOsOriginal: '',
      numRevisao: '',
      obsConclusaoServ: '',
      obsFimServ: '',
      serialNumber: '',
      obsIniServ: '',
      tipoServicoId: null,
      inicioServico: '',
      fimServico: '',
      tituloAds: '',
      tituloAfins: '',
      boletinsServAfins: '',
      partNumber: '',
      fabricanteNome: '',
      pn: '',
      modelo: '',
      nome: '',
      fileNames: [],
      solicitacaoTrocasComentario: ''
    });
    this.trocasItems = [];
    this.tarefasDadosTecnicos = [];
    this.selectedFiles = [];
    this.loadAvailableFiles();
    this.showOSModal = true;
  }

  onTarefasDadosTecnicosChange(items: OsTarefaDadoTecnico[]): void {
    this.tarefasDadosTecnicos = items ?? [];
  }

  viewOS(os: OS) {
    this.ensureOsFormLookupsLoaded();
    // Abrir formulário em modo somente leitura ao clicar na linha
    this.isEditing = false;
    this.isReadOnly = true;
    this.currentOS = os;
    this.loadOSData(os);
    this.loadAvailableFiles();
    this.showOSModal = true;
  }

  editOS(os: OS) {
    this.ensureOsFormLookupsLoaded();
    this.isEditing = true;
    this.isReadOnly = false;
    this.currentOS = os;
    const rawFabricanteId = (os as any).idFabricanteId ?? ((os as any).idFabricante?.id ?? (typeof (os as any).idFabricante?.id === 'function' ? (os as any).idFabricante?.id?.() : null)) ?? ((os as any).fabricante?.id ?? (typeof (os as any).fabricante?.id === 'function' ? (os as any).fabricante?.id?.() : null)) ?? (os as any).fabricanteId ?? null;
    const fabricanteId = rawFabricanteId != null ? Number(rawFabricanteId) : null;
    this.osForm.patchValue({
      adsDas: os.adsDas || '',
      ataManual: os.ataManual || '',
      clienteNome: os.clienteNome || '',
      dataConclusaoServ: os.dataConclusaoServ || '',
      dataFechamento: os.dataFechamento || '',
      dataRevManual: os.dataRevManual || '',
      dtAbertura: os.dtAbertura || '',
      fabricanteId: fabricanteId,
      // Backend pode retornar: idFcuId, idFcu.id, fcu.id, ou fcuId
      fcuId: os.idFcuId || (os.idFcu?.id ? Number(os.idFcu.id) : null) || (os.fcu?.id ? Number(os.fcu.id) : null) || os.fcuId || null,
      tsn: os.tsn || '',
      tso: os.tso || '',
      marcasMatricula: os.marcasMatricula || '',
      motor: os.motor || '',
      snMotor: os.snMotor || '',
      manualPn: os.manualPn || '',
      numOsOriginal: os.numOsOriginal || '',
      numRevisao: os.numRevisao || '',
      obsConclusaoServ: os.obsConclusaoServ || '',
      obsFimServ: os.obsFimServ || '',
      serialNumber: os.serialNumber || '',
      obsIniServ: os.obsIniServ || '',
      tipoServicoId: os.tipoServicoId || null,
      inicioServico: os.inicioServico || '',
      fimServico: os.fimServico || '',
      tituloAds: os.tituloAds || '',
      tituloAfins: os.tituloAfins || '',
      boletinsServAfins: os.boletinsServAfins || '',
      partNumber: os.partNumber || '',
      fabricanteNome: '',
      pn: '',
      modelo: '',
      nome: '',
      fileNames: []
    });
    
    // Atualizar currentOS com os arquivos associados se houver
    if (os.files) {
      this.currentOS = { ...this.currentOS, files: os.files } as any;
    }

    // Buscar dados do FCU se houver fcuId (apenas para pn, modelo, serialNumber e nome)
    // IMPORTANTE: ataManual, dataRevManual e numRevisao são persistidos na OS
    // e NÃO devem ser sobrescritos com dados do FCU ao editar
    const fcuIdValue = os.idFcuId || (os.idFcu?.id ? Number(os.idFcu.id) : null) || (os.fcu?.id ? Number(os.fcu.id) : null) || os.fcuId;
    
    // Extrair dados do FCU do objeto se disponível (vem do backend)
    const fcuDto = os.idFcu || os.fcu;
    
    if (fcuDto) {
      // Se temos o objeto FCU completo do backend, usar os dados diretamente
      // Java Records expõem métodos, não propriedades, então precisamos verificar ambos
      // Tentar acessar como propriedade ou método (para records Java)
      const fcuPn = fcuDto.pn || (typeof fcuDto.pn === 'function' ? fcuDto.pn() : null);
      const fcuModelo = fcuDto.modelo || (typeof fcuDto.modelo === 'function' ? fcuDto.modelo() : null);
      const fcuDescription = fcuDto.fcuDescription || (typeof fcuDto.fcuDescription === 'function' ? fcuDto.fcuDescription() : null);
      const fcuSerialNumber = fcuDto.serialNumber || (typeof fcuDto.serialNumber === 'function' ? fcuDto.serialNumber() : null);
      const fcuIdFabricante = fcuDto.idFabricante || (typeof fcuDto.idFabricante === 'function' ? fcuDto.idFabricante() : null);
      
      // NÃO sobrescrever ataManual, dataRevManual e numRevisao - eles vêm da OS
      this.osForm.patchValue({
        pn: fcuPn || os.partNumber || '',
        modelo: fcuModelo || '',
        serialNumber: fcuSerialNumber || os.serialNumber || '',
        nome: fcuDescription || ''
      });
      // Só preencher fabricanteId com o do FCU se a OS não tiver fabricante salvo
      if (fabricanteId == null && fcuIdFabricante) {
        this.osForm.patchValue({ fabricanteId: Number(fcuIdFabricante) });
      }
    } else if (fcuIdValue) {
      const selectedFcu = this.fcuList.find(fcu => fcu.id === fcuIdValue);
      if (selectedFcu) {
        const patch: any = {
          pn: selectedFcu.pn,
          modelo: selectedFcu.modelo,
          serialNumber: selectedFcu.serialNumber || os.serialNumber || '',
          nome: selectedFcu.fcuDescription
        };
        if (fabricanteId == null && selectedFcu.idFabricante != null) {
          patch.fabricanteId = Number(selectedFcu.idFabricante);
        }
        this.osForm.patchValue(patch);
      }
    }
    
    // Buscar nome do fabricante se houver fabricanteId
    const fabricanteDto = (os as any).idFabricante || (os as any).fabricante;
    
    if (fabricanteDto) {
      const nomeFabricante = fabricanteDto.nome || (typeof fabricanteDto.nome === 'function' ? fabricanteDto.nome() : null);
      
      if (nomeFabricante) {
        this.osForm.patchValue({
          fabricanteNome: nomeFabricante
        });
        this.cdr.detectChanges();
      } else {
        const fabricanteIdForFetch = (os as any).idFabricanteId || (os as any).idFabricante?.id || (os as any).fabricante?.id || (os as any).fabricanteId;
        if (fabricanteIdForFetch) {
          this.fabricanteService.getById(fabricanteIdForFetch).subscribe({
            next: (fabricante) => {
              const nomeFabricante = fabricante.nome || fabricante.name || '';
              this.osForm.patchValue({
                fabricanteNome: nomeFabricante
              });
              this.cdr.detectChanges();
            },
            error: () => {
              // Silenciar erro
            }
          });
        }
      }
    } else {
      // Se não temos o objeto, buscar pelo ID
      const fabricanteId = os.idFabricanteId || (os.idFabricante?.id) || (os.fabricante?.id) || os.fabricanteId;
      if (fabricanteId) {
        this.fabricanteService.getById(fabricanteId).subscribe({
          next: (fabricante) => {
            const nomeFabricante = fabricante.nome || fabricante.name || '';
            this.osForm.patchValue({
              fabricanteNome: nomeFabricante
            });
            this.cdr.detectChanges();
          },
          error: () => {
            // Silenciar erro
          }
        });
      }
    }

    this.mapTrocasFromOs(os);
    if (os.id) {
      this.loadBlingFluxoForOs(os.id);
      this.api.getById(os.id).subscribe({
        next: (full) => {
          this.currentOS = full as any;
          this.mapTrocasFromOs(full);
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    } else {
      this.blingFluxo = null;
    }

    this.syncRegistroEncerrado(this.currentOS);
    this.loadAvailableFiles();
    this.showOSModal = true;
  }

  loadAvailableFiles() {
    this.loadingFiles = true;
    this.osFileService.listAvailableFiles().subscribe({
      next: (files) => {
        this.availableFiles = files || [];
        this.loadingFiles = false;
        if (this.availableFiles.length === 0) {
          console.warn('⚠️ No available files found');
        }
      },
      error: (error) => {
        console.error('❌ Failed to load available files:', error);
        console.error('📋 Detalhes do erro:', error.error || error.message);
        this.availableFiles = [];
        this.loadingFiles = false;
        this.toast('warn', 'os.list.toast.summary.warn', 'os.list.toast.filesLoadWarn');
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  viewFile(file: OSFile) {
    if (!file.id) {
      this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.fileIdMissing');
      return;
    }

    // Abrir arquivo em nova aba para visualização
    this.osFileService.downloadFile(file.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        // Abrir em nova aba/janela para visualização
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          // Se popup foi bloqueado, criar link e abrir
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        // Não revogar URL imediatamente para permitir visualização
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      },
      error: () => {
        this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.fileViewError');
      }
    });
  }

  downloadFile(file: OSFile) {
    if (!file.id) {
      this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.fileIdMissing');
      return;
    }

    this.osFileService.downloadFile(file.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.toast('success', 'os.list.toast.summary.success', 'os.list.toast.fileDownloadOk');
      },
      error: () => {
        this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.fileDownloadError');
      }
    });
  }

  removeFile(file: OSFile) {
    if (!file.id) {
      this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.fileIdMissing');
      return;
    }

    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.os.removeFile.message', { name: String(file?.fileName ?? '') }),
      header: 'confirm.header.removeFile',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesRemove',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.osFileService.removeFile(file.id!).subscribe({
          next: () => {
            // Recarregar dados da OS para atualizar lista de arquivos
            if (this.currentOS?.id) {
              this.api.getById(this.currentOS.id).subscribe({
                next: (updatedOS) => {
                  this.currentOS = updatedOS as any;
                  this.loadOSData(updatedOS as any);
                  this.toast('success', 'os.list.toast.summary.success', 'os.list.toast.fileRemoveOk');
                },
                error: () => {
                  this.toast('success', 'os.list.toast.summary.success', 'os.list.toast.fileRemoveOk');
                }
              });
            }
          },
          error: () => {
            this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.fileRemoveError');
          }
        });
      }
    });
  }

  // ============== MÉTODOS DE UPLOAD ==============
  
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
      this.uploadFiles(Array.from(files));
    }
  }
  
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles(Array.from(input.files));
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      input.value = '';
    }
  }
  
  uploadFiles(files: File[]) {
    if (!this.currentOS?.id) {
      this.toast('warn', 'os.list.toast.summary.attention', 'os.list.toast.saveBeforeUpload');
      return;
    }
    
    if (files.length === 0) {
      return;
    }
    
    this.isUploading = true;
    this.uploadProgress = [];
    
    this.osFileService.uploadFiles(this.currentOS.id, files).subscribe({
      next: (progress) => {
        this.uploadProgress = progress;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isUploading = false;
        this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.uploadError');
      },
      complete: () => {
        this.isUploading = false;
        
        // Recarregar arquivos da OS
        this.reloadOSFiles();
        
        // Limpar progresso após um tempo
        setTimeout(() => {
          this.uploadProgress = [];
        }, 3000);
        
        this.toast('success', 'os.list.toast.summary.success', 'os.list.toast.uploadOk', {
          count: String(files.length)
        });
      }
    });
  }
  
  reloadOSFiles() {
    if (this.currentOS?.id) {
      this.osFileService.getFilesByOSId(this.currentOS.id).subscribe({
        next: (files) => {
          this.currentOS = { ...this.currentOS, files: files } as any;
          this.cdr.detectChanges();
        },
        error: (error) => {
        }
      });
    }
  }
  
  getFileIcon(extension?: string): string {
    if (!extension) return 'pi-file';
    
    const ext = extension.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'pi-file-pdf';
      case 'doc':
      case 'docx':
        return 'pi-file-word';
      case 'xls':
      case 'xlsx':
        return 'pi-file-excel';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return 'pi-image';
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return 'pi-folder';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'mkv':
        return 'pi-video';
      case 'mp3':
      case 'wav':
      case 'flac':
        return 'pi-volume-up';
      default:
        return 'pi-file';
    }
  }
  
  getFileIconClass(extension?: string): { [key: string]: boolean } {
    if (!extension) return { 'generic': true };
    
    const ext = extension.toLowerCase();
    return {
      'pdf': ext === 'pdf',
      'docx': ext === 'doc' || ext === 'docx',
      'excel': ext === 'xls' || ext === 'xlsx',
      'image': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext),
      'archive': ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext),
      'video': ['mp4', 'avi', 'mov', 'mkv'].includes(ext),
      'audio': ['mp3', 'wav', 'flac'].includes(ext),
      'generic': !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'zip', 'rar', '7z', 'tar', 'gz', 'mp4', 'avi', 'mov', 'mkv', 'mp3', 'wav', 'flac'].includes(ext)
    };
  }

  private syncRegistroEncerrado(os: OS | null): void {
    this.registroEncerrado = !!(os?.dataFechamento || os?.crsEmitido);
    if (this.registroEncerrado && this.isEditing && !this.isReadOnly) {
      this.osForm.disable({ emitEvent: false });
    } else if (!this.isReadOnly) {
      this.osForm.enable({ emitEvent: false });
    }
  }

  podeReabrirOs(): boolean {
    const c = this.authService.getCurrentUser()?.perfil?.codigo?.trim().toUpperCase();
    return ['P145_RT', 'P145_INSPETOR', 'ADMIN', 'ADMINISTRADOR', 'QUALIDADE', 'GERENTE', 'DIRETOR'].includes(c ?? '');
  }

  openReabrirDialog(): void {
    this.reabrirJustificativa = '';
    this.showReabrirDialog = true;
  }

  confirmReabrir(): void {
    if (!this.currentOS?.id || this.reabrindo) {
      return;
    }
    this.reabrindo = true;
    this.api.reabrir(this.currentOS.id, this.reabrirJustificativa.trim()).subscribe({
      next: res => {
        this.reabrindo = false;
        this.showReabrirDialog = false;
        this.currentOS = res.os;
        this.registroEncerrado = false;
        this.osForm.enable({ emitEvent: false });
        this.osForm.patchValue({ dataFechamento: '' });
        this.toast('success', 'common.toast.success', 'api.os.reaberturaSucesso');
        this.cdr.detectChanges();
      },
      error: err => {
        this.reabrindo = false;
        const msg = extractApiErrorMessage(err, this.i18n, 'os.list.toast.updateError');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
      }
    });
  }

  closeOSModal() {
    this.showTrocasProductSelector = false;
    this.trocasItems = [];
    this.tarefasDadosTecnicos = [];
    this.showOSModal = false;
    this.isEditing = false;
    this.isReadOnly = false;
    this.registroEncerrado = false;
    this.showReabrirDialog = false;
    this.reabrirJustificativa = '';
    this.currentOS = null;
    this.crsDialogVisible = false;
    this.blingFluxo = null;
    this.osForm.enable({ emitEvent: false });
    this.osForm.reset();
  }

  openCrsDialog(): void {
    if (!this.podeAbrirCrs) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'os.crs.toast.noPermission');
      return;
    }
    if (this.currentOS?.id) {
      this.crsDialogVisible = true;
    }
  }

  loadOSData(os: OS) {
    // Carregar dados completos da OS para visualização (incluindo arquivos associados)
    if (os.id) {
      this.loadBlingFluxoForOs(os.id);
      this.api.getById(os.id).subscribe({
        next: (fullOS) => {
          this.currentOS = fullOS as any; // Atualizar currentOS com dados completos incluindo arquivos
          this.fillFormWithOSData(fullOS);
        },
        error: () => {
          this.fillFormWithOSData(os);
        }
      });
    } else {
      this.blingFluxo = null;
      this.fillFormWithOSData(os);
    }
  }

  loadBlingFluxoForOs(osId: number): void {
    this.blingApi.getOsFluxo(osId).subscribe({
      next: fluxo => (this.blingFluxo = fluxo),
      error: () => (this.blingFluxo = null),
    });
  }

  fluxoPassoLabel(passo: BlingPropostaFluxoPasso): string {
    const code = passo.codigo || '';
    const key = `comercial.proposta.bling.fluxoStep.${code}`;
    const translated = this.i18n.translate(key);
    return translated !== key ? translated : passo.titulo || code;
  }

  fluxoAutomacaoLabel(): string {
    const motivo = this.blingFluxo?.automacaoMotivo;
    if (motivo && motivo !== 'NENHUM') {
      const key = `comercial.proposta.bling.fluxoMotivo.${motivo}`;
      const translated = this.i18n.translate(key);
      if (translated !== key) {
        return translated;
      }
    }
    return this.i18n.translate('comercial.proposta.bling.fluxoPendente');
  }

  reprocessarFluxoBlingOs(): void {
    const propostaId = this.blingFluxo?.propostaComercialId;
    if (!propostaId) {
      return;
    }
    this.reprocessandoFluxoBling = true;
    this.blingApi.retryPropostaFluxo(propostaId).subscribe({
      next: result => {
        this.reprocessandoFluxoBling = false;
        if (result.fluxo) {
          this.blingFluxo = result.fluxo;
        } else if (this.currentOS?.id) {
          this.loadBlingFluxoForOs(this.currentOS.id);
        }
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'comercial.proposta.bling.fluxoRetryOk');
      },
      error: () => {
        this.reprocessandoFluxoBling = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.proposta.bling.fluxoRetryErr');
      },
    });
  }

  fillFormWithOSData(os: any) {
    // Mapear IDs do backend para o formulário (garantir número para o select marcar a opção correta)
    const rawFabricanteId = os.idFabricanteId ?? (os.idFabricante?.id ?? (typeof os.idFabricante?.id === 'function' ? os.idFabricante?.id?.() : null)) ?? (os.fabricante?.id ?? (typeof os.fabricante?.id === 'function' ? os.fabricante?.id?.() : null)) ?? os.fabricanteId ?? null;
    const fabricanteId = rawFabricanteId != null ? Number(rawFabricanteId) : null;
    // Backend pode retornar: idFcuId, idFcu.id, fcu.id, ou fcuId
    const fcuId = os.idFcuId || (os.idFcu?.id ? Number(os.idFcu.id) : null) || (os.fcu?.id ? Number(os.fcu.id) : null) || os.fcuId || null;
    
    this.osForm.patchValue({
      // idOs não é mais um campo do formulário
      adsDas: os.adsDas || '',
      ataManual: os.ataManual || '',
      clienteNome: os.clienteNome || '',
      dataConclusaoServ: os.dataConclusaoServ || '',
      dataFechamento: os.dataFechamento || '',
      dataRevManual: os.dataRevManual || '',
      dtAbertura: os.dtAbertura || '',
      fabricanteId: fabricanteId,
      fcuId: fcuId,
      tsn: os.tsn || '',
      tso: os.tso || '',
      marcasMatricula: os.marcasMatricula || '',
      motor: os.motor || '',
      snMotor: os.snMotor || '',
      manualPn: os.manualPn || '',
      numOsOriginal: os.numOsOriginal || '',
      numRevisao: os.numRevisao || '',
      obsConclusaoServ: os.obsConclusaoServ || '',
      obsFimServ: os.obsFimServ || '',
      serialNumber: os.serialNumber || '',
      obsIniServ: os.obsIniServ || '',
      tipoServicoId: os.tipoServicoId || null,
      inicioServico: os.inicioServico || '',
      fimServico: os.fimServico || '',
      tituloAds: os.tituloAds || '',
      tituloAfins: os.tituloAfins || '',
      boletinsServAfins: os.boletinsServAfins || '',
      partNumber: os.partNumber || '',
      fabricanteNome: '',
      pn: '',
      modelo: '',
      nome: '',
      fileNames: []
    });
    this.mapTrocasFromOs(os);
    this.tarefasDadosTecnicos = Array.isArray(os.tarefasDadosTecnicos) ? [...os.tarefasDadosTecnicos] : [];
    
    // Atualizar currentOS com os arquivos associados se houver
    if (os.files) {
      this.currentOS = { ...this.currentOS, files: os.files } as any;
    }

    // Buscar dados do FCU se houver fcuId (apenas para pn, modelo, serialNumber e nome)
    // IMPORTANTE: ataManual, dataRevManual e numRevisao são persistidos na OS
    // e NÃO devem ser sobrescritos com dados do FCU ao editar
    const fcuIdValue = os.idFcuId || (os.idFcu?.id ? Number(os.idFcu.id) : null) || (os.fcu?.id ? Number(os.fcu.id) : null) || os.fcuId;
    
    // Extrair dados do FCU do objeto se disponível (vem do backend)
    const fcuDto = os.idFcu || os.fcu;
    
    if (fcuDto) {
      // Se temos o objeto FCU completo do backend, usar os dados diretamente
      // Java Records expõem métodos, não propriedades, então precisamos verificar ambos
      const fcuPn = fcuDto.pn || (typeof fcuDto.pn === 'function' ? fcuDto.pn() : null);
      const fcuModelo = fcuDto.modelo || (typeof fcuDto.modelo === 'function' ? fcuDto.modelo() : null);
      const fcuDescription = fcuDto.fcuDescription || (typeof fcuDto.fcuDescription === 'function' ? fcuDto.fcuDescription() : null);
      const fcuSerialNumber = fcuDto.serialNumber || (typeof fcuDto.serialNumber === 'function' ? fcuDto.serialNumber() : null);
      const fcuIdFabricante = fcuDto.idFabricante || (typeof fcuDto.idFabricante === 'function' ? fcuDto.idFabricante() : null);
      
      // NÃO sobrescrever ataManual, dataRevManual e numRevisao - eles vêm da OS
      this.osForm.patchValue({
        pn: fcuPn || os.partNumber || '',
        modelo: fcuModelo || '',
        serialNumber: fcuSerialNumber || os.serialNumber || '',
        nome: fcuDescription || ''
      });
      // Só preencher fabricanteId com o do FCU se a OS não tiver fabricante salvo (prioridade ao fabricante da OS)
      if (fabricanteId == null && fcuIdFabricante != null) {
        this.osForm.patchValue({ fabricanteId: Number(fcuIdFabricante) });
      }
    } else if (fcuIdValue) {
      const selectedFcu = this.fcuList.find(fcu => fcu.id === fcuIdValue);
      if (selectedFcu) {
        const patch: any = {
          pn: selectedFcu.pn,
          modelo: selectedFcu.modelo,
          serialNumber: selectedFcu.serialNumber || os.serialNumber || '',
          nome: selectedFcu.fcuDescription
        };
        if (fabricanteId == null && selectedFcu.idFabricante != null) {
          patch.fabricanteId = Number(selectedFcu.idFabricante);
        }
        this.osForm.patchValue(patch);
      }
    }
    
    // Buscar nome do fabricante
    // Primeiro tentar usar o objeto Fabricante que vem do backend
    const fabricanteDto = os.idFabricante || os.fabricante;
    
    if (fabricanteDto) {
      // Verificar se é um record (tem método nome()) ou objeto (tem propriedade nome)
      const nomeFabricante = fabricanteDto.nome || (typeof fabricanteDto.nome === 'function' ? fabricanteDto.nome() : null);
      
      if (nomeFabricante) {
        // Se temos o objeto Fabricante completo do backend, usar o nome diretamente
        this.osForm.patchValue({ fabricanteNome: nomeFabricante });
        this.cdr.detectChanges();
      } else {
        // Se não temos o nome no objeto, buscar pelo ID
        const fabricanteIdValue = os.idFabricanteId || (os.idFabricante?.id) || (os.fabricante?.id) || os.fabricanteId;
        if (fabricanteIdValue) {
          this.fabricanteService.getById(fabricanteIdValue).subscribe({
            next: (fabricante) => {
              const nomeFabricante = fabricante.nome || fabricante.name || '';
              this.osForm.patchValue({ fabricanteNome: nomeFabricante });
              this.cdr.detectChanges();
            },
            error: () => {
              this.osForm.patchValue({ fabricanteNome: '' });
            }
          });
        }
      }
    } else {
      // Se não temos o objeto, buscar pelo ID
      const fabricanteIdValue = os.idFabricanteId || (os.idFabricante?.id) || (os.fabricante?.id) || os.fabricanteId;
      if (fabricanteIdValue) {
        this.fabricanteService.getById(fabricanteIdValue).subscribe({
          next: (fabricante) => {
            const nomeFabricante = fabricante.nome || fabricante.name || '';
            this.osForm.patchValue({ fabricanteNome: nomeFabricante });
            this.cdr.detectChanges();
          },
          error: () => {
            this.osForm.patchValue({ fabricanteNome: '' });
          }
        });
      }
    }
    
    this.syncRegistroEncerrado(os);
  }

  mapTrocasFromOs(os: any) {
    this.osForm.patchValue({ solicitacaoTrocasComentario: os.solicitacaoTrocasComentario || '' });
    const list = os.solicitacaoTrocasItens;
    if (!list || !Array.isArray(list)) {
      this.trocasItems = [];
      return;
    }
    this.trocasItems = list.map((it: any) => this.apiTrocaItemToRow(it));
  }

  private apiTrocaItemToRow(it: any): OsTrocaItem {
    const product: Product = {
      id: Number(it.idProduto) || 0,
      name: it.produtoNome || '—',
      description: it.produtoDescricao,
      productpn: it.produtoPn,
      price: it.valorUnitario
    };
    return {
      id: it.id,
      pago: it.pago,
      product,
      quantidade: it.quantidade ?? 1,
      valorUnitario: it.valorUnitario ?? 0,
      valorTotal: it.valorTotal ?? 0,
      produtoPn: it.produtoPn,
      produtoSn: it.produtoSn
    };
  }

  openTrocasProductSelector() {
    if (this.isReadOnly) return;
    this.showTrocasProductSelector = true;
  }

  onTrocasProductsSelected(items: PropostaItem[]) {
    if (!items?.length) {
      this.showTrocasProductSelector = false;
      return;
    }
    const linhas = this.buildTrocasDisponibilidadeLinhas(items);
    if (linhas.length === 0) {
      this.applyTrocasSelection(items);
      return;
    }
    this.estoqueService.consultarDisponibilidade(linhas).subscribe({
      next: (result) => {
        const sem = result.filter((r) => r.semEstoque);
        if (sem.length === 0) {
          this.applyTrocasSelection(items);
          return;
        }
        const detalhe = sem
          .map((r) => {
            const it = items.find(
              (i) =>
                (i.produtoPn || i.product?.productpn || '').trim().toLowerCase() ===
                r.partNumber.trim().toLowerCase()
            );
            const nome = it?.product?.name || r.partNumber;
            return this.i18n.translate('confirm.os.stock.line', {
              name: nome,
              pn: r.partNumber,
              available: String(r.quantidadeDisponivel),
              requested: String(r.quantidadeSolicitada),
            });
          })
          .join('\n');
        this.confirmationService.confirm({
          header: 'confirm.header.stockShort',
          message:
            this.i18n.translate('confirm.os.stock.intro') +
            '\n\n' +
            detalhe +
            '\n\n' +
            this.i18n.translate('confirm.os.stock.prompt'),
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'confirm.yesAddAnyway',
          rejectLabel: 'common.confirm.cancel',
          accept: () => this.applyTrocasSelection(items),
          reject: () => {
            this.showTrocasProductSelector = true;
          }
        });
      },
      error: () => {
        this.toast('warn', 'os.list.toast.summary.stockQuery', 'os.list.toast.stockCheckWarn');
        this.applyTrocasSelection(items);
      }
    });
  }

  private buildTrocasDisponibilidadeLinhas(items: PropostaItem[]): { partNumber: string; quantidade: number }[] {
    const acc = new Map<string, { partNumber: string; quantidade: number }>();
    for (const it of items) {
      const pn = (it.produtoPn || it.product?.productpn || '').trim();
      if (!pn) continue;
      const q = Math.max(1, Number(it.quantidade) || 1);
      const k = pn.toLowerCase();
      const cur = acc.get(k);
      if (cur) cur.quantidade += q;
      else acc.set(k, { partNumber: pn, quantidade: q });
    }
    return [...acc.values()];
  }

  private applyTrocasSelection(items: PropostaItem[]) {
    const prev = this.trocasItems;
    this.trocasItems = items.map((it) => {
      const kn = `${it.product?.id}|${(it.produtoPn || it.product?.productpn || '').trim()}`;
      const old = prev.find((p) => `${p.product?.id}|${(p.produtoPn || '').trim()}` === kn);
      return {
        ...it,
        produtoPn: it.produtoPn || it.product?.productpn || '',
        produtoSn: it.produtoSn || '',
        id: old?.id,
        pago: old != null ? old.pago : null
      } as OsTrocaItem;
    });
    this.showTrocasProductSelector = false;
    this.cdr.markForCheck();
  }

  onTrocasPnSnChange(_item: OsTrocaItem) {
    this.cdr.markForCheck();
  }

  updateTrocasItemTotal(item: OsTrocaItem) {
    const q = item.quantidade ?? 0;
    const u = item.valorUnitario ?? 0;
    item.valorTotal = Math.round(q * u * 100) / 100;
    this.cdr.markForCheck();
  }

  removeTrocasItem(index: number) {
    this.trocasItems.splice(index, 1);
    this.trocasItems = [...this.trocasItems];
  }

  buildTarefasDadosTecnicosPayload(): OsTarefaDadoTecnico[] {
    return (this.tarefasDadosTecnicos ?? [])
      .filter(r => (r.tarefaDescricao ?? '').trim().length >= 3)
      .map((r, idx) => ({
        id: r.id,
        ordem: idx,
        tarefaDescricao: r.tarefaDescricao.trim(),
        tipoDado: r.tipoDado,
        aeroDiretrizId: r.tipoDado === 'AD_SB' ? r.aeroDiretrizId ?? null : null,
        publicacaoTecnicaId: r.tipoDado === 'MANUAL' ? r.publicacaoTecnicaId ?? null : null,
        referenciaExterna: r.tipoDado === 'OUTRO' ? (r.referenciaExterna?.trim() || null) : null,
        observacao: r.observacao?.trim() || null
      }));
  }

  buildTrocasPayload() {
    return this.trocasItems.map((it, idx) => ({
      id: it.id,
      idProduto: it.product?.id && it.product.id > 0 ? it.product.id : null,
      produtoNome: it.product?.name,
      produtoDescricao: it.product?.description,
      produtoPn: it.produtoPn ?? it.product?.productpn,
      produtoSn: it.produtoSn ?? null,
      quantidade: it.quantidade,
      valorUnitario: it.valorUnitario,
      valorTotal: it.valorTotal,
      pago: it.pago ?? null,
      ordem: idx
    }));
  }

  /**
   * Indicador na listagem de OS para “Solicitação de Troca Eventual”:
   * info = só observação; pendente = aguardando definição de pago; pago = todos aprovados; naoPago = há não pagos/recusados.
   */
  trocaEventualListagem(row: OS | null | undefined): {
    state: 'info' | 'pendente' | 'pago' | 'naoPago';
    icon: string;
    tooltip: string;
    rowClass: string;
  } | null {
    if (!row) return null;
    const itens = row.solicitacaoTrocasItens as OSSolicitacaoTrocaItem[] | undefined;
    const com = (row.solicitacaoTrocasComentario ?? '').trim();
    const hasItens = Array.isArray(itens) && itens.length > 0;
    if (!hasItens && !com) return null;
    if (!hasItens && com) {
      return {
        state: 'info',
        icon: 'pi-info-circle',
        rowClass: 'os-row-troca-info',
        tooltip: this.i18n.translate('os.list.tooltip.troca.info')
      };
    }
    const pagos = itens!.map((i) => i.pago);
    if (pagos.some((p) => p === null || p === undefined)) {
      return {
        state: 'pendente',
        icon: 'pi-clock',
        rowClass: 'os-row-troca-pendente',
        tooltip: this.i18n.translate('os.list.tooltip.troca.pendente')
      };
    }
    if (pagos.every((p) => p === true)) {
      return {
        state: 'pago',
        icon: 'pi-check-circle',
        rowClass: 'os-row-troca-pago',
        tooltip: this.i18n.translate('os.list.tooltip.troca.pago')
      };
    }
    return {
      state: 'naoPago',
      icon: 'pi-times-circle',
      rowClass: 'os-row-troca-nao-pago',
      tooltip: this.i18n.translate('os.list.tooltip.troca.naoPago')
    };
  }

  /**
   * Abre o modal com os detalhes do déficit registrado para a OS quando o
   * indicador de déficit do kit FCU é clicado na listagem.
   */
  openKitDeficitModal(row: any): void {
    if (!row || !row.id) {
      return;
    }
    this.kitDeficitOs = row;
    this.kitDeficitItens = [];
    this.loadingKitDeficit = true;
    this.showKitDeficitModal = true;
    this.api.listKitFcuDeficit(row.id).subscribe({
      next: (itens) => {
        this.kitDeficitItens = itens || [];
        this.loadingKitDeficit = false;
      },
      error: () => {
        this.loadingKitDeficit = false;
        this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.kitDeficitLoadError');
      }
    });
  }

  closeKitDeficitModal(): void {
    this.showKitDeficitModal = false;
    this.kitDeficitOs = null;
    this.kitDeficitItens = [];
    this.loadingKitDeficit = false;
  }

  // Consult Modal Methods
  openOSConsultModal() {
    this.showOSConsultModal = true;
    this.consultSearchQuery = '';
    this.consultPageIndex = 0;
    this.consultSortField = 'idOs';
    this.consultSortOrder = -1;
  }

  closeOSConsultModal() {
    this.showOSConsultModal = false;
    this.consultOSList = [];
    this.consultSearchQuery = '';
  }

  loadConsultOS() {
    const seq = this.consultRequestGuard.bump();
    this.consultLoading = true;
    const searchQuery = this.consultSearchQuery || '';
    this.api.list({
      page: this.consultPageIndex,
      size: this.consultPageSize,
      sort: `${this.consultSortField},${this.consultSortOrder === 1 ? 'asc' : 'desc'}`,
      q: searchQuery.trim() || undefined
    }).subscribe({
      next: (response) => {
        if (this.consultRequestGuard.isStale(seq)) {
          return;
        }
        // Mapear os dados para garantir que idOs seja preenchido corretamente
        // Se idOs não existir ou for 0, usar o id do banco
        this.consultOSList = response.items.map((os: any) => ({
          ...os,
          idOs: os.idOs && os.idOs !== 0 ? os.idOs : (os.id || 0)
        }));
        this.consultTotal = response.totalElements;
        this.consultLoading = false;
      },
      error: () => {
        if (this.consultRequestGuard.isStale(seq)) {
          return;
        }
        this.consultLoading = false;
        this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.consultLoadError');
      }
    });
  }

  loadConsultLazy(e?: LazyLoadEvent) {
    const req = resolveLazyPageRequest(e, { pageIndex: this.consultPageIndex, size: this.consultPageSize });
    this.consultPageIndex = req.page;
    this.consultPageSize = req.size;
    if (e?.sortField) this.consultSortField = e.sortField;
    if (e?.sortOrder) this.consultSortOrder = e.sortOrder;
    this.loadConsultOS();
  }

  searchOSConsult() {
    this.consultPageIndex = 0;
    this.loadConsultLazy({ first: 0, rows: this.consultPageSize });
  }

  clearOSConsult() {
    this.consultSearchQuery = '';
    this.consultPageIndex = 0;
    this.loadConsultLazy({ first: 0, rows: this.consultPageSize });
  }

  selectOS(os: any) {
    if (this.isSelectingOS) return;
    
    this.isSelectingOS = true;
    this.selectedOSId = os.idOs;
    
    // Aguardar a animação de seleção
    setTimeout(() => {
      // Buscar dados completos da OS do backend (incluindo arquivos associados)
      if (os.id) {
        this.api.getById(os.id).subscribe({
          next: (fullOS) => {
            
            // Preencher o formulário com os dados completos da OS
            this.isEditing = true; // Definir como true para mostrar arquivos associados
            this.isReadOnly = false; // Garantir que não está em modo somente leitura
            this.currentOS = fullOS as any;
            
            // Usar fillFormWithOSData para garantir que todos os dados sejam carregados corretamente
            this.fillFormWithOSData(fullOS);
            
            // Carregar arquivos disponíveis primeiro
            this.loadAvailableFiles();
            
            // Carregar explicitamente os arquivos associados à OS
            this.osFileService.getFilesByOSId(os.id).subscribe({
              next: (files) => {
                // Atualizar currentOS com os arquivos carregados
                if (files && Array.isArray(files) && files.length > 0) {
                  this.currentOS = { ...this.currentOS, files: files } as any;
                } else {
                  this.currentOS = { ...this.currentOS, files: [] } as any;
                }
                
                // Aguardar um pouco para garantir que availableFiles também foi carregado
                setTimeout(() => {
                  
                  // Forçar detecção de mudanças após atualizar os arquivos
                  this.cdr.detectChanges();
                  
                  // Fechar a modal de consulta e abrir a modal de edição após carregar tudo
                  this.closeOSConsultModal();
                  this.showOSModal = true;
                  
                  this.toast('success', 'os.list.toast.summary.osSelected', 'os.list.toast.osLoadedOk', {
                    id: String(os.idOs)
                  });
                  
                  this.isSelectingOS = false;
                  this.selectedOSId = null;
                }, 100);
              },
              error: (error) => {
                
                // Continuar mesmo se não conseguir carregar os arquivos
                this.currentOS = { ...this.currentOS, files: fullOS.files || [] } as any;
                
                // Aguardar um pouco antes de abrir o modal
                setTimeout(() => {
                  // Fechar a modal de consulta e abrir a modal de edição mesmo com erro
                  this.closeOSConsultModal();
                  this.showOSModal = true;
                  
                  this.toast('success', 'os.list.toast.summary.osSelected', 'os.list.toast.osLoadedOk', {
                    id: String(os.idOs)
                  });
                  
                  this.isSelectingOS = false;
                  this.selectedOSId = null;
                  this.cdr.detectChanges();
                }, 100);
              }
            });
          },
          error: (error) => {
            
            // Em caso de erro, usar os dados básicos da busca
            this.isEditing = false;
            this.currentOS = os;
            this.fillFormWithOSData(os);
            this.loadAvailableFiles();
            
            // Fechar a modal de consulta e abrir a modal de edição
            this.closeOSConsultModal();
            this.showOSModal = true;
            
            this.toast('warn', 'os.list.toast.summary.warn', 'os.list.toast.osLoadedPartial', {
              id: String(os.idOs)
            });
            
            this.isSelectingOS = false;
            this.selectedOSId = null;
          }
        });
      } else {
        // Se não houver ID, usar os dados básicos da busca
        console.warn('⚠️ Work order without ID, using basic search data');
        this.isEditing = false;
        this.currentOS = os;
        this.fillFormWithOSData(os);
        this.loadAvailableFiles();
        
        // Fechar a modal de consulta e abrir a modal de edição
        this.closeOSConsultModal();
        this.showOSModal = true;
        
        this.toast('success', 'os.list.toast.summary.osSelected', 'os.list.toast.osLoadedOk', {
          id: String(os.idOs)
        });
        
        this.isSelectingOS = false;
        this.selectedOSId = null;
      }
    }, 800); // Duração da animação
  }

  saveOS() {
    if (this.osForm.invalid) {
      this.osForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formValue = this.buildSavePayloadFromForm();

    // Verifica déficit do kit FCU ANTES de salvar quando há FCU novo na OS.
    // Quando há déficit, abre confirmação informativa para o usuário decidir
    // se prossegue mesmo assim. O save em si só dispara após confirmar.
    const previewFcuId = this.fcuIdParaPreviewDeficit();
    if (previewFcuId) {
      this.api.previewKitFcuDeficit(previewFcuId).subscribe({
        next: (preview) => {
          if (preview && preview.temDeficit && preview.itens && preview.itens.length > 0) {
            this.confirmarSalvarComDeficitKit(formValue, preview);
          } else {
            this.executarSalvarOS(formValue, null);
          }
        },
        error: () => {
          // Se o preview falhar, não bloqueia: salva como antes (modo tolerante).
          this.executarSalvarOS(formValue, null);
        }
      });
      return;
    }

    this.executarSalvarOS(formValue, null);
  }

  /**
   * Constrói o payload do form aplicando todas as transformações esperadas pelo backend
   * (datas vazias → null, renome de fcuId → idFcuId, remoção de campos auxiliares, etc.).
   */
  private buildSavePayloadFromForm(): any {
    const formValue = { ...this.osForm.value };

    // Remover idOs do payload - será gerado pelo backend
    delete formValue.idOs;

    // Limpar campos de data vazios (converter strings vazias para null)
    const dateFields = ['dataConclusaoServ', 'dataFechamento', 'dataRevManual', 'dtAbertura'];
    dateFields.forEach(field => {
      if (formValue[field] === '' || formValue[field] === null || formValue[field] === undefined) {
        formValue[field] = null;
      }
    });

    // Limpar outros campos opcionais vazios
    const optionalStringFields = ['adsDas', 'clienteNome', 'tsn', 'tso', 'manualPn', 'numOsOriginal',
      'numRevisao', 'obsConclusaoServ', 'obsFimServ', 'serialNumber', 'obsIniServ',
      'tituloAds', 'tituloAfins', 'boletinsServAfins', 'partNumber', 'fabricanteNome', 'pn', 'modelo', 'nome',
      'solicitacaoTrocasComentario'];

    // Limpar tipoServicoId se for null ou undefined
    if (formValue.tipoServicoId === null || formValue.tipoServicoId === undefined) {
      formValue.tipoServicoId = null;
    }
    optionalStringFields.forEach(field => {
      if (formValue[field] === '') {
        formValue[field] = null;
      }
    });

    // ataManual agora é string (VARCHAR), apenas converter vazio para null
    if (formValue.ataManual === '' || formValue.ataManual === null || formValue.ataManual === undefined) {
      formValue.ataManual = null;
    }

    // Incluir arquivos selecionados no formato esperado pelo backend
    const selectedFileNames = formValue.fileNames || [];
    formValue.fileNames = selectedFileNames.length > 0 ? selectedFileNames : null;

    formValue.solicitacaoTrocasItens = this.buildTrocasPayload();
    formValue.tarefasDadosTecnicos = this.buildTarefasDadosTecnicosPayload();

    // Converter nomes dos campos do frontend para o backend
    if (formValue.fcuId !== undefined && formValue.fcuId !== null) {
      formValue.idFcuId = formValue.fcuId;
      delete formValue.fcuId;
    }
    if (formValue.fabricanteId !== undefined && formValue.fabricanteId !== null) {
      formValue.idFabricanteId = formValue.fabricanteId;
      delete formValue.fabricanteId;
    }

    // Remover campos extras que não existem no backend
    delete formValue.fabricanteNome;
    delete formValue.pn;
    delete formValue.modelo;
    delete formValue.nome;
    delete formValue.idFcu;
    delete formValue.idFabricante;

    return formValue;
  }

  /**
   * Retorna o id do FCU sobre o qual rodar o preview de déficit, ou null se não aplicável.
   * - Em criação: qualquer FCU informado.
   * - Em edição: somente se FCU foi DEFINIDO/MUDOU agora (backend só dispara o kit nesses casos).
   */
  private fcuIdParaPreviewDeficit(): number | null {
    const novoFcuId = Number(this.osForm.get('fcuId')?.value);
    if (!novoFcuId || isNaN(novoFcuId) || novoFcuId <= 0) {
      return null;
    }
    if (this.isEditing && this.currentOS) {
      const cur: any = this.currentOS as any;
      const idAnterior = Number(cur.idFcu?.id ?? cur.idFcu ?? cur.fcuId ?? 0);
      if (idAnterior > 0 && idAnterior === novoFcuId) {
        return null; // FCU não mudou — backend não tenta debitar de novo
      }
    }
    return novoFcuId;
  }

  /**
   * Mostra um diálogo de confirmação detalhando o déficit do kit FCU antes de salvar a OS.
   * Se o usuário confirmar, prossegue com o save. Caso contrário, cancela.
   */
  private confirmarSalvarComDeficitKit(formValue: any, preview: KitFcuDeficitPreview): void {
    const linhas = (preview.itens || [])
      .map(it =>
        this.i18n.translate('confirm.os.kit.line', {
          pn: it.productPn || '-',
          namePart: it.productName ? ` — ${it.productName}` : '',
          required: String(it.quantidadeNecessaria),
          available: String(it.quantidadeDisponivel),
          deficit: String(it.deficit),
        })
      )
      .join('\n');
    const message =
      this.i18n.translate('confirm.os.kit.prefix') +
      '\n\n' +
      linhas +
      '\n\n' +
      this.i18n.translate('confirm.os.kit.suffix');
    this.confirmationService.confirm({
      header: 'confirm.header.kitDeficit',
      message,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'confirm.yesOpenAnyway',
      rejectLabel: 'common.confirm.cancel',
      acceptButtonStyleClass: 'p-button-warning',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => this.executarSalvarOS(formValue, preview),
      reject: () => {
        this.saving = false;
        this.toast('info', 'os.list.toast.summary.cancelled', 'os.list.toast.openCancelled');
      }
    });
  }

  /**
   * Executa o save propriamente dito (create/update). Se {@code preview} indicar déficit,
   * o toast de sucesso ressalta a abertura com déficit no kit FCU.
   */
  private executarSalvarOS(formValue: any, preview: KitFcuDeficitPreview | null): void {
    const selectedFileNames = formValue?.fileNames || [];
    const { files: arquivosLabel, deficit: ressalvaDeficit } = this.saveToastSuffixes(
      selectedFileNames.length,
      preview
    );

    if (this.isEditing && this.currentOS?.id) {
      this.api.update(this.currentOS.id, formValue).subscribe({
        next: () => {
          this.saving = false;
          this.closeOSModal();
          this.reload();
          this.toast(
            ressalvaDeficit ? 'warn' : 'success',
            ressalvaDeficit ? 'os.list.toast.summary.updatedDeficit' : 'os.list.toast.summary.success',
            'os.list.toast.updatedOk',
            { files: arquivosLabel, deficit: ressalvaDeficit },
            ressalvaDeficit ? 8000 : 3000
          );
        },
        error: (error) => {
          this.saving = false;
          const errorMessage = extractApiErrorMessage(error, this.i18n, 'os.list.toast.updateError');
          this.i18n.addToastLiteralDetail(this.messageService, 'error', 'os.list.toast.summary.error', errorMessage);
        }
      });
    } else {
      this.api.create(formValue).subscribe({
        next: (createdOS) => {
          this.currentOS = createdOS;
          this.saving = false;
          this.toast(
            ressalvaDeficit ? 'warn' : 'success',
            ressalvaDeficit ? 'os.list.toast.summary.openedDeficit' : 'os.list.toast.summary.success',
            'os.list.toast.createdOk',
            {
              id: this.formatOSId(createdOS),
              files: arquivosLabel,
              deficit: ressalvaDeficit
            },
            ressalvaDeficit ? 8000 : 3000
          );
          setTimeout(() => {
            this.closeOSModal();
            this.reload();
          }, ressalvaDeficit ? 2500 : 2000);
        },
        error: (error) => {
          const errorMessage = extractApiErrorMessage(error, this.i18n, 'os.list.toast.createError');
          this.saving = false;
          this.i18n.addToastLiteralDetail(this.messageService, 'error', 'os.list.toast.summary.error', errorMessage);
        }
      });
    }
  }

  confirmDelete(row: any) {
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.os.inactivate.message', { id: String(this.formatOSId(row)) }),
      header: 'confirm.header.inactivate',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesInactivate',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.remove(row);
      },
      reject: () => {
      }
    });
  }

  remove(row: any) {
    if (!row.id) {
      this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.inactivateIdMissing');
      return;
    }
    
    this.loading = true;
    this.api.delete(row.id).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.reload();
        this.i18n.addToastLiteralDetail(
          this.messageService,
          'success',
          'os.list.toast.summary.success',
          response?.message || this.i18n.translate('os.list.toast.inactivateOk')
        );
      },
      error: (error) => {
        this.loading = false;
        this.i18n.addToastLiteralDetail(
          this.messageService,
          'error',
          'os.list.toast.summary.error',
          error?.error?.error || error?.message || this.i18n.translate('os.list.toast.inactivateError')
        );
      }
    });
  }

  printOS(os: OS) {
    // Buscar dados completos da OS do backend
    if (!os.id) {
      this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.printIdMissing');
      return;
    }

    this.api.getById(os.id).subscribe({
      next: (fullOS) => {
        const printData: any = { ...fullOS };
        
        // Extrair dados do FCU do objeto se disponível (vem do backend)
        // Java Records expõem métodos, não propriedades, então precisamos verificar ambos
        const fcuDto = fullOS.idFcu || fullOS.fcu;
        
        if (fcuDto) {
          // Se temos o objeto FCU completo do backend, usar os dados diretamente
          const fcuPn = fcuDto.pn || (typeof fcuDto.pn === 'function' ? fcuDto.pn() : null);
          const fcuModelo = fcuDto.modelo || (typeof fcuDto.modelo === 'function' ? fcuDto.modelo() : null);
          const fcuDescription = fcuDto.fcuDescription || (typeof fcuDto.fcuDescription === 'function' ? fcuDto.fcuDescription() : null);
          const fcuSerialNumber = fcuDto.serialNumber || (typeof fcuDto.serialNumber === 'function' ? fcuDto.serialNumber() : null);
          const fcuIdFabricante = fcuDto.idFabricante || (typeof fcuDto.idFabricante === 'function' ? fcuDto.idFabricante() : null);
          
          printData.fcuData = fcuDto;
          printData.pn = fcuPn || fullOS.partNumber || '';
          printData.modelo = fcuModelo || '';
          printData.nome = fcuDescription || '';
          printData.serialNumber = fcuSerialNumber || fullOS.serialNumber || '';
          // TSN e TSO vêm apenas da OS, não do FCU
          printData.tsn = fullOS.tsn || '';
          printData.tso = fullOS.tso || '';
          
          // Extrair nome do fabricante do objeto se disponível (vem do backend)
          const fabricanteDto = fullOS.idFabricante || fullOS.fabricante;
          const nomeFabricante = fabricanteDto ? (fabricanteDto.nome || (typeof fabricanteDto.nome === 'function' ? fabricanteDto.nome() : null)) : null;
          
          if (nomeFabricante) {
            printData.fabricanteNome = nomeFabricante;
            this.generatePrintView(printData);
          } else if (fcuIdFabricante) {
            // Se não temos o objeto, buscar pelo ID
            this.fabricanteService.getById(fcuIdFabricante).subscribe({
              next: (fabricante) => {
                printData.fabricanteNome = fabricante.nome || fabricante.name || '';
                this.generatePrintView(printData);
              },
              error: () => {
                printData.fabricanteNome = '';
                this.generatePrintView(printData);
              }
            });
          } else {
            printData.fabricanteNome = '';
            this.generatePrintView(printData);
          }
        } else {
          // Se não temos o objeto FCU, buscar pelo ID (fallback)
          const printFcuId = fullOS.idFcuId || (fullOS.idFcu?.id ? Number(fullOS.idFcu.id) : null) || (fullOS.fcu?.id ? Number(fullOS.fcu.id) : null) || fullOS.fcuId;
          if (printFcuId) {
            this.fcuApi.get(printFcuId).subscribe({
              next: (fcu) => {
                printData.fcuData = fcu;
                printData.pn = fcu.pn || fullOS.partNumber || '';
                printData.modelo = fcu.modelo || '';
                printData.nome = fcu.fcuDescription || '';
                printData.serialNumber = fcu.serialNumber || fullOS.serialNumber || '';
                printData.tsn = fullOS.tsn || '';
                printData.tso = fullOS.tso || '';
                
                // Buscar nome do fabricante
                if (fcu.idFabricante) {
                  this.fabricanteService.getById(fcu.idFabricante).subscribe({
                    next: (fabricante) => {
                      printData.fabricanteNome = fabricante.nome || fabricante.name || '';
                      this.generatePrintView(printData);
                    },
                    error: () => {
                      printData.fabricanteNome = '';
                      this.generatePrintView(printData);
                    }
                  });
                } else {
                  printData.fabricanteNome = '';
                  this.generatePrintView(printData);
                }
              },
              error: () => {
                // Se não conseguir buscar FCU, usar dados da OS
                printData.pn = fullOS.partNumber || '';
                printData.modelo = '';
                printData.nome = '';
                printData.fabricanteNome = '';
                this.generatePrintView(printData);
              }
            });
          } else {
            // Se não houver FCU, usar dados da OS diretamente
            printData.pn = fullOS.partNumber || '';
            printData.modelo = '';
            printData.nome = '';
            printData.fabricanteNome = '';
            this.generatePrintView(printData);
          }
        }
      },
      error: () => {
        this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.printLoadError');
      }
    });
  }

  private generatePrintView(os: any) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.toast('error', 'os.list.toast.summary.error', 'os.list.toast.printPopupBlocked');
      return;
    }

    const ctx = buildOsPrintContext(this.i18n, this.branding, this.appLogoDataUri);
    const printContent = buildOsPrintDocument(
      ctx,
      os,
      this.formatOSId(os),
      this.i18n,
      this.branding
    );

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Aguardar carregamento e imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Fechar janela após impressão (opcional)
        // printWindow.close();
      }, 250);
    };
  }

  formatDate(dateStr?: string): string {
    return formatUiDateTime(this.i18n.getCurrentLanguage(), dateStr, 'date');
  }
}
