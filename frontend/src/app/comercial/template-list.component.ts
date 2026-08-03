import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../core/lazy-list-pagination.helper';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TemplateProdutoServicoService, TemplateProdutoServico } from '../core/template-produto-servico.service';
import { TipoServicoService, TipoServico } from '../core/tipos-servico.service';
import { PageHelpComponent } from '../shared/page-help/page-help.component';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../core/translate.pipe';
import { LocaleMoneyPipe } from '../core/locale/locale-money.pipe';
import { LocaleCurrencyService } from '../core/locale/locale-currency.service';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { createListSearch } from '../core/list-search.helper';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-template-list',
  imports: [
    ListTableScrollDirective,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    DropdownModule,
    DialogModule,
    PageHelpComponent,
    TranslatePipe,
    LocaleMoneyPipe,
    ListDataStatesComponent,
    PageHeroComponent
  ],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    
    <div class="templates-page">
      <app-page-hero
        variant="navy"
        kickerKey="comercial.list.templates.banner.badge"
        titleKey="comercial.list.templates.title"
        subtitleKey="comercial.list.templates.subtitle"
        titleIcon="pi-th-large"
        [hasActions]="true">
        <div actions class="hero-actions">
          <app-page-help></app-page-help>
          <button
            pButton
            [label]="'comercial.list.templates.btnNew' | translate"
            icon="pi pi-plus"
            (click)="abrirDialogNovoTemplate()"></button>
        </div>
      </app-page-hero>

      <section class="toolbar-card">
        <span class="p-input-icon-left search-wrapper">
          <i class="pi pi-search"></i>
          <input type="text" pInputText [(ngModel)]="searchTerm" 
                 [placeholder]="'comercial.list.templates.searchPlaceholder' | translate"
                 (input)="listSearch.fromInput($event)" class="search-input">
        </span>
        <p-dropdown [(ngModel)]="categoriaFiltro" [options]="categoriaOptions"
                    [placeholder]="'comercial.list.templates.filterCategoryPlaceholder' | translate" [showClear]="true"
                    (onChange)="onSearch()" class="categoria-filter">
        </p-dropdown>
      </section>

      <p class="list-money-sources" *ngIf="listMoneySourcesLine">{{ listMoneySourcesLine }}</p>

      <section class="table-panel">
        <app-list-data-states
          [loading]="loading"
          [itemCount]="totalRecords"
          [skeletonRows]="8"
          [skeletonCols]="8"
          [mountContentWhileLoading]="true"
          emptyTitleKey="comercial.list.templates.empty"
          emptyDescriptionKey="ui.empty.description">
          <button
            emptyAction
            pButton
            [label]="'comercial.list.templates.emptyBtn' | translate"
            icon="pi pi-plus"
            class="p-button-outlined"
            (click)="abrirDialogNovoTemplate()"></button>
        <p-table appListScroll
          [first]="tableFirst"
          [value]="templates"
          [loading]="loading"
          [paginator]="true"
          [rows]="size"
          [rowsPerPageOptions]="listRowsPerPageOptions"
          [showCurrentPageReport]="true"
          [currentPageReportTemplate]="templatesPageReport"
          styleClass="p-datatable-striped templates-table"
          [totalRecords]="totalRecords"
          [lazy]="true"
          dataKey="id"
          [tableStyle]="{ 'min-width': '64rem' }"
          (onLazyLoad)="loadTemplates($event)">
          <ng-template pTemplate="header">
            <tr>
              <th class="col-name">{{ 'comercial.list.templates.col.name' | translate }}</th>
              <th class="col-product">{{ 'comercial.list.templates.col.product' | translate }}</th>
              <th class="col-category">{{ 'comercial.list.templates.col.category' | translate }}</th>
              <th class="col-service">{{ 'comercial.list.templates.col.serviceType' | translate }}</th>
              <th class="col-value">{{ 'comercial.list.templates.col.baseValue' | translate }}</th>
              <th class="col-usage">{{ 'comercial.list.templates.col.usage' | translate }}</th>
              <th class="col-status">{{ 'comercial.list.templates.col.status' | translate }}</th>
              <th class="col-actions">{{ 'comercial.list.templates.col.actions' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-template>
            <tr>
              <td class="col-name">
                <div class="template-name-cell"
                     [pTooltip]="template.nomeTemplate"
                     tooltipPosition="top">
                  <i class="pi pi-file"></i>
                  <strong class="cell-primary">{{ template.nomeTemplate }}</strong>
                </div>
              </td>
              <td class="col-product">
                <div class="produto-cell"
                     [pTooltip]="produtoTooltip(template)"
                     tooltipPosition="top">
                  <strong class="cell-primary">{{ template.produtoNome || '-' }}</strong>
                  <small class="cell-secondary" *ngIf="template.produtoPn">{{ 'comercial.list.propostas.preview.pn' | translate }} {{ template.produtoPn }}</small>
                </div>
              </td>
              <td class="col-category">
                <p-tag *ngIf="template.categoria" 
                       [value]="template.categoria" 
                       [style]="{background: getCategoriaColor(template.categoria)}">
                </p-tag>
                <span *ngIf="!template.categoria" class="cell-empty">-</span>
              </td>
              <td class="col-service">
                <span class="cell-primary"
                      [pTooltip]="template.tipoServicoNome || undefined"
                      tooltipPosition="top">{{ template.tipoServicoNome || '-' }}</span>
              </td>
              <td class="col-value">
                <span class="valor-amount">{{ template.produtoValorBase | localeMoney:'BRL':listMoneyPipeOpts }}</span>
              </td>
              <td class="col-usage uso-cell">
                <span class="uso-badge" [class.popular]="template.vezesUtilizado > 5">
                  <i class="pi pi-chart-line"></i>
                  {{ template.vezesUtilizado || 0 }}
                </span>
              </td>
              <td class="col-status">
                <p-tag [value]="template.ativo ? ('comercial.list.templates.tagActive' | translate) : ('comercial.list.templates.tagInactive' | translate)" 
                       [severity]="template.ativo ? 'success' : 'danger'">
                </p-tag>
              </td>
              <td class="col-actions">
                <div class="action-buttons">
                  <button pButton icon="pi pi-pencil" 
                          class="p-button-text p-button-rounded p-button-sm p-button-info"
                          [pTooltip]="'comercial.list.templates.tooltipEdit' | translate"
                          (click)="editarTemplate(template)">
                  </button>
                  <button pButton icon="pi pi-copy" 
                          class="p-button-text p-button-rounded p-button-sm p-button-secondary"
                          [pTooltip]="'comercial.list.templates.tooltipDuplicate' | translate"
                          (click)="duplicarTemplate(template)">
                  </button>
                  <button pButton 
                          [icon]="template.ativo ? 'pi pi-ban' : 'pi pi-check-circle'" 
                          class="p-button-text p-button-rounded p-button-sm"
                          [class.p-button-danger]="template.ativo"
                          [class.p-button-success]="!template.ativo"
                          [pTooltip]="template.ativo ? ('comercial.list.templates.tooltipDeactivate' | translate) : ('comercial.list.templates.tooltipActivate' | translate)"
                          (click)="toggleStatus(template)">
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="empty">
            <tr>
              <td colspan="8" class="empty-message">
                <i class="pi pi-inbox"></i>
                <p>{{ 'comercial.list.templates.empty' | translate }}</p>
                <button pButton [label]="'comercial.list.templates.emptyBtn' | translate" icon="pi pi-plus"
                        (click)="abrirDialogNovoTemplate()" class="p-button-outlined">
                </button>
              </td>
            </tr>
          </ng-template>
        </p-table>
        </app-list-data-states>
      </section>
    </div>

    <!-- Dialog: Novo/Editar Template -->
    <p-dialog styleClass="as-hero-dialog" [(visible)]="showDialog" 
              [header]="templateEmEdicao?.id ? ('comercial.list.templates.dialog.edit' | translate) : ('comercial.list.templates.dialog.new' | translate)" 
              [modal]="true" 
              [style]="{width: '700px'}"
              [closable]="true">
      <form [formGroup]="templateForm" class="template-form">
        <div class="form-section">
          <h4><i class="pi pi-info-circle"></i> {{ 'comercial.list.templates.form.secIdent' | translate }}</h4>
          <div class="form-grid">
            <div class="form-field full-width">
              <label for="nomeTemplate">{{ 'comercial.list.templates.form.lblNome' | translate }}</label>
              <input pInputText id="nomeTemplate" formControlName="nomeTemplate" 
                     [placeholder]="'comercial.list.templates.form.phNome' | translate" class="w-full">
            </div>
            <div class="form-field full-width">
              <label for="descricaoTemplate">{{ 'comercial.list.templates.form.lblDesc' | translate }}</label>
              <textarea pInputTextarea id="descricaoTemplate" formControlName="descricaoTemplate"
                        [rows]="2" [placeholder]="'comercial.list.templates.form.phDesc' | translate" class="w-full"></textarea>
            </div>
            <div class="form-field">
              <label for="categoria">{{ 'comercial.list.templates.form.lblCategoria' | translate }}</label>
              <p-dropdown id="categoria" formControlName="categoria"
                          [options]="categoriaOptions" [editable]="true"
                          [placeholder]="'comercial.list.templates.form.phCategoria' | translate" class="w-full">
              </p-dropdown>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4><i class="pi pi-box"></i> {{ 'comercial.list.templates.form.secProduto' | translate }}</h4>
          <div class="form-grid">
            <div class="form-field">
              <label for="produtoNome">{{ 'comercial.list.templates.form.lblProdutoNome' | translate }}</label>
              <input pInputText id="produtoNome" formControlName="produtoNome" 
                     [placeholder]="'comercial.list.templates.form.phProdutoNome' | translate" class="w-full">
            </div>
            <div class="form-field">
              <label for="produtoPn">{{ 'comercial.list.templates.form.lblPn' | translate }}</label>
              <input pInputText id="produtoPn" formControlName="produtoPn" 
                     [placeholder]="'comercial.list.templates.form.phPn' | translate" class="w-full">
            </div>
            <div class="form-field">
              <label for="produtoManual">{{ 'comercial.list.templates.form.lblManual' | translate }}</label>
              <input pInputText id="produtoManual" formControlName="produtoManual" 
                     [placeholder]="'comercial.list.templates.form.phManual' | translate" class="w-full">
            </div>
            <div class="form-field">
              <label for="produtoValorBaseUi">{{ 'comercial.list.templates.form.lblValorBase' | translate }}</label>
              <p-inputNumber
                inputId="produtoValorBaseUi"
                [ngModel]="getProdutoValorBaseUi()"
                [ngModelOptions]="{standalone: true}"
                mode="currency"
                [currency]="localeCurrency.getDisplayCurrency()"
                [locale]="localeCurrency.getIntlLocale()"
                styleClass="w-full"
                (ngModelChange)="setProdutoValorBaseUi($event)">
              </p-inputNumber>
            </div>
            <div class="form-field">
              <label for="aplicacaoMotor">{{ 'comercial.list.templates.form.lblAplicacao' | translate }}</label>
              <input pInputText id="aplicacaoMotor" formControlName="aplicacaoMotor" 
                     [placeholder]="'comercial.list.templates.form.phAplicacao' | translate" class="w-full">
            </div>
            <div class="form-field">
              <label for="idTipoServico">{{ 'comercial.list.templates.form.lblTipoServico' | translate }}</label>
              <p-dropdown id="idTipoServico" formControlName="idTipoServico"
                          [options]="tiposServico" optionLabel="nome" optionValue="id"
                          [placeholder]="'comercial.list.templates.form.phTipoServico' | translate" [filter]="true" [showClear]="true" class="w-full">
              </p-dropdown>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4><i class="pi pi-cog"></i> {{ 'comercial.list.templates.form.secServico' | translate }}</h4>
          <div class="form-grid">
            <div class="form-field full-width">
              <label for="servicoDescricaoPadrao">{{ 'comercial.list.templates.form.lblServPadrao' | translate }}</label>
              <textarea pInputTextarea id="servicoDescricaoPadrao" formControlName="servicoDescricaoPadrao"
                        [rows]="3" [placeholder]="'comercial.list.templates.form.phServPadrao' | translate" class="w-full"></textarea>
            </div>
            <div class="form-field">
              <label for="prazoEntregaPadrao">{{ 'comercial.list.templates.form.lblPrazo' | translate }}</label>
              <input pInputText id="prazoEntregaPadrao" formControlName="prazoEntregaPadrao" 
                     [placeholder]="'comercial.list.templates.form.phPrazo' | translate" class="w-full">
            </div>
            <div class="form-field">
              <label for="formaPagamentoPadrao">{{ 'comercial.list.templates.form.lblPagto' | translate }}</label>
              <input pInputText id="formaPagamentoPadrao" formControlName="formaPagamentoPadrao" 
                     [placeholder]="'comercial.list.templates.form.phPagto' | translate" class="w-full">
            </div>
            <div class="form-field">
              <label for="validadeDias">{{ 'comercial.list.templates.form.lblValidade' | translate }}</label>
              <p-inputNumber id="validadeDias" formControlName="validadeDias" 
                             [min]="1" [max]="365" class="w-full">
              </p-inputNumber>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4><i class="pi pi-comment"></i> {{ 'comercial.list.templates.form.secObs' | translate }}</h4>
          <div class="form-grid">
            <div class="form-field full-width">
              <label for="observacaoPadrao">{{ 'comercial.list.templates.form.lblObsProp' | translate }}</label>
              <textarea pInputTextarea id="observacaoPadrao" formControlName="observacaoPadrao"
                        [rows]="4" [placeholder]="'comercial.list.templates.form.phObsProp' | translate" 
                        class="w-full" [maxlength]="5000"></textarea>
              <small class="char-counter">{{ (templateForm.get('observacaoPadrao')?.value?.length || 0) }}/5000</small>
            </div>
          </div>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <button pButton [label]="'comercial.list.templates.form.btnCancel' | translate" icon="pi pi-times" class="p-button-text"
                (click)="showDialog = false"></button>
        <button pButton [label]="'comercial.list.templates.form.btnSave' | translate" icon="pi pi-check" 
                (click)="salvarTemplate()" [loading]="saving"
                [disabled]="templateForm.invalid"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
    }

    .templates-page {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: calc(100dvh - 88px);
      width: 100%;
      box-sizing: border-box;
      background: #f1f5f9;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(15, 23, 42, 0.14);
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .toolbar-card {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
    }

    .list-money-sources {
      margin: 0;
      padding: 0.65rem 1.25rem;
      font-size: 12px;
      line-height: 1.45;
      color: #64748b;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
    }

    .search-wrapper {
      flex: 1;
      min-width: 300px;

      .search-input {
        width: 100%;
        height: 44px;
        border-radius: 10px;
        padding-left: 40px;
      }
    }

    .categoria-filter { width: 200px; }

    .table-panel {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 0 1rem 1rem;
      background: #fff;
      overflow-x: auto;
    }

    .cell-primary {
      font-size: 13px;
      color: #0f172a;
      font-weight: 600;
      line-height: 1.4;
      overflow-wrap: anywhere;
      word-break: normal;
      hyphens: auto;
      white-space: normal;
      display: block;
    }

    .cell-secondary {
      font-size: 11px;
      color: #64748b;
      line-height: 1.35;
      overflow-wrap: anywhere;
      white-space: normal;
      display: block;
    }

    .cell-empty {
      color: #94a3b8;
    }

    .template-name-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;

      i { color: #0ea5e9; font-size: 18px; flex-shrink: 0; }
    }

    .produto-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .valor-amount {
      font-weight: 600;
      color: #059669;
      font-size: 13px;
      white-space: nowrap;
    }

    .uso-cell {
      .uso-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background: #f1f5f9;
        border-radius: 12px;
        font-size: 12px;
        color: #64748b;

        &.popular {
          background: #fef3c7;
          color: #92400e;

          i { color: #f59e0b; }
        }

        i { font-size: 10px; }
      }
    }

    .action-buttons {
      display: flex;
      gap: 2px;
      flex-wrap: nowrap;
      justify-content: center;
      width: 100%;
    }

    .empty-message {
      text-align: center;
      padding: 48px 24px !important;
      color: #64748b;

      i { font-size: 48px; margin-bottom: 16px; display: block; }
      p { margin: 0 0 16px; font-size: 16px; }
    }

    :host ::ng-deep {
      .templates-table table {
        table-layout: auto;
        width: 100%;
      }

      .templates-table .p-datatable-thead > tr > th {
        background: #f8fafc;
        color: #334155;
        font-weight: 700;
        font-size: 0.8rem;
        line-height: 1.35;
        padding: 0.75rem;
        border-bottom: 2px solid #e2e8f0;
        white-space: nowrap;
        vertical-align: middle;
      }

      .templates-table .p-datatable-tbody > tr > td {
        padding: 0.75rem;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
        font-size: 0.85rem;
        line-height: 1.4;
        white-space: normal;
        overflow-wrap: break-word;
        word-break: normal;
      }

      .templates-table .p-datatable-tbody > tr:hover {
        background: #f8fafc;
      }

      .templates-table .col-name {
        min-width: 11rem;
      }

      .templates-table .col-product {
        min-width: 12rem;
      }

      .templates-table .col-category {
        min-width: 8rem;
      }

      .templates-table .col-service {
        min-width: 10rem;
      }

      .templates-table .col-value,
      .templates-table .col-usage,
      .templates-table .col-status {
        min-width: 5.5rem;
        white-space: nowrap;
      }

      .templates-table .col-actions {
        min-width: 8.5rem;
        white-space: nowrap;
      }

      .templates-table .p-datatable-thead > tr > th.col-actions,
      .templates-table .p-datatable-tbody > tr > td.col-actions {
        text-align: center;
      }

      .templates-table .col-category .p-tag {
        max-width: 100%;
        white-space: normal;
        overflow-wrap: break-word;
      }

      .p-dropdown { height: 44px; }
    }

    /* Form Dialog */
    .template-form {
      .form-section {
        margin-bottom: 20px;

        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          margin: 0 0 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;

          i { color: #0ea5e9; }
        }
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        .full-width { grid-column: 1 / -1; }
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 6px;

        label {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }
      }

      .w-full { width: 100%; }

      .char-counter {
        font-size: 11px;
        color: #94a3b8;
        text-align: right;
        margin-top: 4px;
      }
    }
  `]
})
export class TemplateListComponent implements OnInit, OnDestroy {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private templateService = inject(TemplateProdutoServicoService);
  private tipoServicoService = inject(TipoServicoService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private fb = inject(FormBuilder);
  readonly localeCurrency = inject(LocaleCurrencyService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private readonly requestGuard = createStaleRequestGuard();

  readonly listSearch = createListSearch(this.destroyRef, term => {
    this.searchTerm = term;
    this.pageIndex = 0;
    this.loadTemplates({ first: 0, rows: this.size });
  });

  templates: TemplateProdutoServico[] = [];
  loading = true;
  totalRecords = 0;
  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  searchTerm = '';
  categoriaFiltro: string | null = null;
  categoriaOptions: string[] = [];
  tiposServico: TipoServico[] = [];

  readonly listMoneyPipeOpts = { showFootnote: false };

  /** Fontes de conversão (moeda do idioma) — uma vez acima da tabela. */
  get listMoneySourcesLine(): string {
    return this.localeCurrency.getCatalogPriceFootnote(null, 'BRL');
  }

  produtoTooltip(template: TemplateProdutoServico): string | undefined {
    const parts: string[] = [];
    if (template.produtoNome) {
      parts.push(template.produtoNome);
    }
    if (template.produtoPn) {
      parts.push(`${this.i18n.translate('comercial.list.propostas.preview.pn')} ${template.produtoPn}`);
    }
    return parts.length ? parts.join('\n') : undefined;
  }

  showDialog = false;
  templateEmEdicao: TemplateProdutoServico | null = null;
  templateForm!: FormGroup;
  saving = false;

  private profileSub?: Subscription;

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  get templatesPageReport(): string {
    return this.i18n.translate('comercial.list.templates.pageReport');
  }

  private categoriaColors: Record<string, string> = {
    FCU: '#0ea5e9',
    ELETRICO: '#f59e0b',
    IGNICAO: '#ef4444',
    INSTRUMENTOS: '#8b5cf6',
    HELICE: '#10b981',
    MOTOR: '#6366f1',
    HIDRAULICO: '#06b6d4'
  };

  ngOnInit() {
    this.initForm();
    this.loadCategorias();
    this.loadTiposServico();
    this.profileSub = this.localeCurrency.profile$.subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }

  private roundMoney(n: number): number {
    return Math.round(n * 100) / 100;
  }

  getProdutoValorBaseUi(): number {
    const raw = this.templateForm?.get('produtoValorBase')?.value;
    const brl = raw == null || raw === '' ? 0 : Number(raw);
    if (!Number.isFinite(brl)) {
      return 0;
    }
    return this.roundMoney(this.localeCurrency.convertBetween(brl, 'BRL', this.localeCurrency.getDisplayCurrency()));
  }

  setProdutoValorBaseUi(value: number | null): void {
    const brl = this.localeCurrency.convertBetween(value ?? 0, this.localeCurrency.getDisplayCurrency(), 'BRL');
    this.templateForm.patchValue({ produtoValorBase: this.roundMoney(brl) }, { emitEvent: false });
  }

  initForm() {
    this.templateForm = this.fb.group({
      nomeTemplate: ['', Validators.required],
      descricaoTemplate: [''],
      categoria: [''],
      produtoNome: [''],
      produtoPn: [''],
      produtoManual: [''],
      produtoValorBase: [null],
      aplicacaoMotor: [''],
      idTipoServico: [null],
      servicoDescricaoPadrao: [''],
      prazoEntregaPadrao: [this.i18n.translate('comercial.list.templates.defaults.prazoEntrega')],
      formaPagamentoPadrao: [this.i18n.translate('comercial.list.templates.defaults.formaPagamento')],
      validadeDias: [30],
      observacaoPadrao: ['', Validators.maxLength(5000)]
    });
  }

  loadCategorias() {
    this.templateService.listCategorias().subscribe({
      next: (cats) => {
        this.categoriaOptions = cats;
      },
      error: (err) => console.error('Failed to load categories:', err)
    });
  }

  loadTiposServico() {
    this.tipoServicoService.list({ size: 1000 }).subscribe({
      next: (result) => {
        this.tiposServico = result.items || [];
      },
      error: (err) => console.error('Failed to load service types:', err)
    });
  }

  loadTemplates(event?: LazyLoadEvent) {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    const seq = this.requestGuard.bump();
    this.loading = true;

    this.templateService.list({
      page: this.pageIndex,
      size: this.size,
      q: this.searchTerm || undefined,
      categoria: this.categoriaFiltro || undefined
    }).subscribe({
      next: (result) => {
        if (this.requestGuard.isStale(seq)) return;
        this.templates = result.content;
        this.totalRecords = result.totalElements;
        this.loading = false;
      },
      error: (err) => {
        if (this.requestGuard.isStale(seq)) return;
        console.error('Failed to load templates:', err);
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.list.templates.loadError');
        this.loading = false;
      }
    });
  }

  onSearch() {
    this.pageIndex = 0;
    this.loadTemplates({ first: 0, rows: this.size });
  }

  getCategoriaColor(categoria: string): string {
    const slug = categoria
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    return this.categoriaColors[slug] || '#64748b';
  }

  abrirDialogNovoTemplate() {
    this.templateEmEdicao = null;
    this.templateForm.reset({
      prazoEntregaPadrao: this.i18n.translate('comercial.list.templates.defaults.prazoEntrega'),
      formaPagamentoPadrao: this.i18n.translate('comercial.list.templates.defaults.formaPagamento'),
      validadeDias: 30,
      observacaoPadrao: ''
    });
    this.showDialog = true;
  }

  editarTemplate(template: TemplateProdutoServico) {
    this.templateEmEdicao = template;
    this.templateForm.patchValue({
      nomeTemplate: template.nomeTemplate,
      descricaoTemplate: template.descricaoTemplate,
      categoria: template.categoria,
      produtoNome: template.produtoNome,
      produtoPn: template.produtoPn,
      produtoManual: template.produtoManual,
      produtoValorBase: template.produtoValorBase,
      aplicacaoMotor: template.aplicacaoMotor,
      idTipoServico: template.idTipoServico,
      servicoDescricaoPadrao: template.servicoDescricaoPadrao,
      prazoEntregaPadrao: template.prazoEntregaPadrao,
      formaPagamentoPadrao: template.formaPagamentoPadrao,
      validadeDias: template.validadeDias,
      observacaoPadrao: template.observacaoPadrao
    });
    this.showDialog = true;
  }

  duplicarTemplate(template: TemplateProdutoServico) {
    this.templateEmEdicao = null;
    this.templateForm.patchValue({
      nomeTemplate: template.nomeTemplate + ' ' + this.i18n.translate('comercial.list.templates.copySuffix'),
      descricaoTemplate: template.descricaoTemplate,
      categoria: template.categoria,
      produtoNome: template.produtoNome,
      produtoPn: template.produtoPn,
      produtoManual: template.produtoManual,
      produtoValorBase: template.produtoValorBase,
      aplicacaoMotor: template.aplicacaoMotor,
      idTipoServico: template.idTipoServico,
      servicoDescricaoPadrao: template.servicoDescricaoPadrao,
      prazoEntregaPadrao: template.prazoEntregaPadrao,
      formaPagamentoPadrao: template.formaPagamentoPadrao,
      validadeDias: template.validadeDias,
      observacaoPadrao: template.observacaoPadrao
    });
    this.showDialog = true;
  }

  salvarTemplate() {
    if (this.templateForm.invalid) return;

    this.saving = true;
    const data = this.templateForm.value;

    // Buscar nome do tipo de serviço
    if (data.idTipoServico) {
      const tipo = this.tiposServico.find(t => t.id === data.idTipoServico);
      if (tipo) {
        data.tipoServicoNome = tipo.nome;
      }
    }

    const request = this.templateEmEdicao?.id
      ? this.templateService.update(this.templateEmEdicao.id, data)
      : this.templateService.create(data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showDialog = false;
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          this.templateEmEdicao?.id ? 'comercial.templateList.toast.savedUpdated' : 'comercial.templateList.toast.savedCreated'
        );
        this.onSearch();
        this.loadCategorias();
      },
      error: (err) => {
        this.saving = false;
        console.error('Failed to save:', err);
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.templateList.toast.saveError');
      }
    });
  }

  toggleStatus(template: TemplateProdutoServico) {
    if (!template.id) return;

    const action = template.ativo
      ? this.i18n.translate('confirm.action.deactivateVerb')
      : this.i18n.translate('confirm.action.activateVerb');
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.template.toggle', {
        action,
        name: String(template.nomeTemplate ?? '')
      }),
      header: 'confirm.header.generic',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: template.ativo ? 'common.confirm.yesInactivate' : 'common.confirm.yesActivate',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        if (template.ativo) {
          this.templateService.delete(template.id!).subscribe({
            next: () => {
              this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'comercial.templateList.toast.inactivatedOk');
              this.onSearch();
            },
            error: () => {
              this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.templateList.toast.inactivateError');
            }
          });
        } else {
          this.templateService.update(template.id!, { ...template, ativo: true }).subscribe({
            next: () => {
              this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'comercial.templateList.toast.activatedOk');
              this.onSearch();
            },
            error: () => {
              this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.templateList.toast.activateError');
            }
          });
        }
      }
    });
  }
}
