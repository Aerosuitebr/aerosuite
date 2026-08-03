import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../../core/list-pagination.constants';
import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageService } from 'primeng/api';
import { EstoqueService, Fornecedor, Invoice } from '../../core/estoque.service';
import { TranslationService } from '../../core/translation.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../core/translate.pipe';
import { createEstoqueSearch } from '../shared/estoque-search.helper';
import { InvoiceParaDropdown, mapInvoicesParaDropdown } from '../shared/invoice-dropdown.util';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';
import { IsoLocalDatePipe } from '../../core/locale/iso-local-date.pipe';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { parseIsoDateLocal, toIsoDatePayload } from '../../core/locale/iso-local-date.util';

interface Lote {
  id?: number;
  codigoLote?: string;
  invoiceId?: number;
  invoiceNumero?: string;
  fornecedorId?: number;
  fornecedorNome?: string;
  fornecedorCodigo?: string;
  dataEntrada?: string | Date;
  dataValidade?: string | Date;
  quantidadeTotal?: number;
  quantidadeDisponivel?: number;
  localizacao?: string;
  status?: string;
  observacoes?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-lote-list',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, TooltipModule, DropdownModule, ToastModule, DialogModule,
    CalendarModule, InputNumberModule, InputTextareaModule, TranslatePipe,
    PageHeroComponent, ListDataStatesComponent, IsoLocalDatePipe
  ],
  template: `
    <p-toast></p-toast>
    
    <div class="as-page lotes-container">
      <app-page-hero
        variant="sky"
        titleKey="estoque.lotes.list.title"
        subtitleKey="estoque.lotes.list.subtitle"
        titleIcon="pi-th-large"
        [hasActions]="true">
        <button
          actions
          pButton
          [label]="'estoque.lotes.list.btnNew' | translate"
          icon="pi pi-plus"
          (click)="abrirNovoLote()"></button>
      </app-page-hero>

      <!-- Filtros -->
      <div class="filter-bar">
        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <input
            pInputText
            [(ngModel)]="searchTerm"
            [placeholder]="'estoque.lotes.list.searchPlaceholder' | translate"
            (input)="listSearch.fromInput($event)"
            (ngModelChange)="listSearch.fromModel($event)" />
        </span>
        <p-dropdown [(ngModel)]="statusFilter" [options]="statusOptions" [placeholder]="'estoque.lotes.list.filterStatus' | translate" 
                    [showClear]="true" (onChange)="buscar()" [appendTo]="'body'"></p-dropdown>
      </div>

      <!-- Tabela -->
      <div class="table-container">
        <app-list-data-states
          [loading]="loading"
          [itemCount]="lotes.length"
          [skeletonRows]="8"
          [skeletonCols]="9"
          emptyTitleKey="estoque.lotes.list.empty"
          emptyDescriptionKey="ui.empty.description">
          <p-table appListScroll
            [value]="lotes"
            [loading]="loading"
            [paginator]="true"
            [rows]="listPageSize"
                 styleClass="p-datatable-striped estoque-data-table" [rowHover]="true"
                 [tableStyle]="{ width: '100%', 'table-layout': 'fixed' }">
          <ng-template pTemplate="header">
            <tr>
              <th class="col-lote-cod"><div class="header-cell"><span>{{ 'estoque.lotes.list.col.batchCode' | translate }}</span></div></th>
              <th class="col-lote-forn"><div class="header-cell"><span>{{ 'estoque.lotes.list.col.supplier' | translate }}</span></div></th>
              <th class="col-lote-inv"><div class="header-cell"><span>{{ 'estoque.lotes.list.col.invoice' | translate }}</span></div></th>
              <th class="col-lote-data"><div class="header-cell"><span>{{ 'estoque.lotes.list.col.entryDate' | translate }}</span></div></th>
              <th class="col-lote-qty col-center"><div class="header-cell header-cell--center"><span>{{ 'estoque.lotes.list.col.qtyTotal' | translate }}</span></div></th>
              <th class="col-lote-qty col-center"><div class="header-cell header-cell--center"><span>{{ 'estoque.lotes.list.col.qtyAvailable' | translate }}</span></div></th>
              <th class="col-lote-loc"><div class="header-cell"><span>{{ 'estoque.lotes.list.col.location' | translate }}</span></div></th>
              <th class="col-lote-status col-center"><div class="header-cell header-cell--center"><span>{{ 'common.list.col.status' | translate }}</span></div></th>
              <th class="col-lote-acoes col-center"><div class="header-cell header-cell--center"><span>{{ 'common.list.col.actions' | translate }}</span></div></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-lote>
            <tr>
              <td class="col-lote-cod"><span class="lote-badge">{{ lote.codigoLote }}</span></td>
              <td class="col-lote-forn">
                <div class="fornecedor-info">
                  <strong>{{ lote.fornecedorNome || '-' }}</strong>
                  <small>{{ lote.fornecedorCodigo }}</small>
                </div>
              </td>
              <td class="col-lote-inv">{{ lote.invoiceNumero || '-' }}</td>
              <td class="col-lote-data">{{ lote.dataEntrada | isoLocalDate }}</td>
              <td class="col-lote-qty col-center">{{ lote.quantidadeTotal }}</td>
              <td class="col-lote-qty col-center">
                <span [class.qtd-baixa]="lote.quantidadeDisponivel <= 0" 
                      [class.qtd-ok]="lote.quantidadeDisponivel > 0">
                  {{ lote.quantidadeDisponivel }}
                </span>
              </td>
              <td class="col-lote-loc">{{ lote.localizacao || '-' }}</td>
              <td class="col-lote-status col-center"><p-tag [value]="getStatusLabel(lote.status)" [severity]="getStatusSeverity(lote.status)"></p-tag></td>
              <td class="col-lote-acoes col-center">
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm p-button-warning" 
                        [pTooltip]="'estoque.lotes.list.tooltip.edit' | translate" (click)="editarLote(lote)"></button>
                <button pButton icon="pi pi-list" class="p-button-text p-button-sm" 
                        [pTooltip]="'estoque.lotes.list.tooltip.viewItems' | translate" (click)="verItensLote(lote)"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
        </app-list-data-states>
      </div>

      <!-- Legenda -->
      <div class="legenda">
        <span><i class="pi pi-circle-fill" style="color: #22c55e"></i> {{ 'estoque.lotes.legend.active' | translate }}</span>
        <span><i class="pi pi-circle-fill" style="color: #f59e0b"></i> {{ 'estoque.lotes.legend.partial' | translate }}</span>
        <span><i class="pi pi-circle-fill" style="color: #ef4444"></i> {{ 'estoque.lotes.legend.depleted' | translate }}</span>
        <span><i class="pi pi-circle-fill" style="color: #64748b"></i> {{ 'estoque.lotes.legend.blocked' | translate }}</span>
      </div>
    </div>

    <!-- Dialog Novo/Editar Lote -->
    <p-dialog styleClass="as-hero-dialog lote-dialog" [(visible)]="showLoteDialog" 
              [header]="loteEditando?.id ? ('estoque.lotes.dialog.edit' | translate) : ('estoque.lotes.dialog.new' | translate)"
              [modal]="true"
              [style]="{width: '600px'}"
              [contentStyle]="{'overflow': 'visible'}"
             >
      <div class="lote-form" *ngIf="loteEditando">
        <div class="form-grid">
          <div class="form-field">
            <label>{{ 'estoque.lotes.dialog.field.code' | translate }}</label>
            <input pInputText [(ngModel)]="loteEditando.codigoLote" [placeholder]="'estoque.common.autoCodePh' | translate">
            <small class="hint">{{ 'estoque.common.autoCodeHint' | translate }}</small>
          </div>
          
          <div class="form-field">
            <label>{{ 'estoque.lotes.dialog.field.supplier' | translate }}</label>
            <p-dropdown [(ngModel)]="loteEditando.fornecedorId" 
                        [options]="fornecedores" 
                        optionLabel="razaoSocial" 
                        optionValue="id"
                        [placeholder]="'estoque.lotes.dialog.ph.supplier' | translate"
                        [filter]="true"
                        [appendTo]="'body'"
                        styleClass="w-full">
            </p-dropdown>
          </div>

          <div class="form-field">
            <label>{{ 'estoque.lotes.dialog.field.invoice' | translate }}</label>
            <p-dropdown [(ngModel)]="loteEditando.invoiceId" 
                        [options]="invoices" 
                        optionLabel="rotuloSelecao" 
                        optionValue="id"
                        [placeholder]="'estoque.lotes.dialog.ph.invoice' | translate"
                        [filter]="true"
                        filterBy="rotuloSelecao,numeroInvoice"
                        [showClear]="true"
                        [appendTo]="'body'"
                        styleClass="w-full">
            </p-dropdown>
          </div>

          <div class="form-field">
            <label>{{ 'estoque.lotes.dialog.field.entryDate' | translate }}</label>
            <p-calendar [(ngModel)]="loteEditando.dataEntrada" 
                        dateFormat="dd/mm/yy" 
                        [showIcon]="true"
                        [utc]="false"
                        [appendTo]="'body'"
                        styleClass="w-full"></p-calendar>
          </div>

          <div class="form-field">
            <label>{{ 'estoque.lotes.dialog.field.expiry' | translate }}</label>
            <p-calendar [(ngModel)]="loteEditando.dataValidade" 
                        dateFormat="dd/mm/yy" 
                        [showIcon]="true"
                        [utc]="false"
                        [appendTo]="'body'"
                        styleClass="w-full"></p-calendar>
          </div>

          <div class="form-field">
            <label>{{ 'estoque.lotes.dialog.field.location' | translate }}</label>
            <input pInputText [(ngModel)]="loteEditando.localizacao" [placeholder]="'estoque.lotes.dialog.ph.location' | translate">
          </div>

          <div class="form-field">
            <label>{{ 'estoque.lotes.dialog.field.qtyTotal' | translate }}</label>
            <p-inputNumber [(ngModel)]="loteEditando.quantidadeTotal" [min]="0"></p-inputNumber>
          </div>

          <div class="form-field">
            <label>{{ 'estoque.lotes.dialog.field.status' | translate }}</label>
            <p-dropdown [(ngModel)]="loteEditando.status" 
                        [options]="statusOptions"
                        [placeholder]="'estoque.common.select' | translate"
                        [appendTo]="'body'"
                        styleClass="w-full"></p-dropdown>
          </div>

          <div class="form-field full-width">
            <label>{{ 'estoque.lotes.dialog.field.notes' | translate }}</label>
            <textarea pInputTextarea [(ngModel)]="loteEditando.observacoes" [rows]="3" 
                      [placeholder]="'estoque.lotes.dialog.ph.notes' | translate"></textarea>
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button pButton [label]="'common.actions.cancel' | translate" class="p-button-text" (click)="cancelarLote()"></button>
          <button pButton [label]="'common.actions.save' | translate" icon="pi pi-check" 
                  (click)="salvarLote()" 
                  [loading]="salvando"
                  [disabled]="!loteEditando?.fornecedorId"></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['../shared/estoque-datatable.scss'],
  styles: [`
    :host { display: block; width: 100%; box-sizing: border-box; }
    .lotes-container { width: 100%; max-width: 100%; box-sizing: border-box; }
    
    .page-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      margin-bottom: 24px; 
    }
    
    .page-header h1 { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      font-size: 24px; 
      color: #1e293b; 
      margin: 0 0 8px; 
    }
    
    .page-header h1 i { color: #f59e0b; }
    .page-header p { color: #64748b; margin: 0; }
    
    .filter-bar { 
      display: flex; 
      gap: 16px; 
      margin-bottom: 20px; 
      flex-wrap: wrap;
    }
    
    .filter-bar input { width: 300px; }
    
    .table-container { 
      background: white; 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      width: 100%;
    }
    :host ::ng-deep .estoque-data-table .col-lote-cod { width: 12%; }
    :host ::ng-deep .estoque-data-table .col-lote-forn { width: 18%; }
    :host ::ng-deep .estoque-data-table .col-lote-inv { width: 12%; }
    :host ::ng-deep .estoque-data-table .col-lote-data { width: 10%; }
    :host ::ng-deep .estoque-data-table .col-lote-qty { width: 8%; }
    :host ::ng-deep .estoque-data-table .col-lote-loc { width: 14%; }
    :host ::ng-deep .estoque-data-table .col-lote-status { width: 10%; }
    :host ::ng-deep .estoque-data-table .col-lote-acoes { width: 8%; }
    
    .lote-badge { 
      background: #fef3c7; 
      padding: 6px 12px; 
      border-radius: 6px; 
      font-size: 13px; 
      font-weight: 600; 
      color: #92400e;
      font-family: monospace;
    }
    
    .fornecedor-info {
      display: flex;
      flex-direction: column;
      
      strong { font-size: 14px; }
      small { color: #64748b; font-size: 12px; }
    }

    .text-center { text-align: center; }

    .qtd-baixa { 
      color: #dc2626; 
      font-weight: 600; 
      background: #fef2f2;
      padding: 4px 10px;
      border-radius: 4px;
    }

    .qtd-ok { 
      color: #16a34a; 
      font-weight: 600;
      background: #f0fdf4;
      padding: 4px 10px;
      border-radius: 4px;
    }
    
    .empty-state { 
      text-align: center; 
      padding: 60px 40px; 
      color: #64748b; 
      
      i { font-size: 56px; display: block; margin-bottom: 16px; opacity: 0.3; }
      p { margin-bottom: 8px; font-size: 16px; }
      small { font-size: 13px; }
    }

    .legenda {
      display: flex;
      gap: 24px;
      margin-top: 20px;
      padding: 16px 20px;
      background: white;
      border-radius: 8px;
      font-size: 13px;
      color: #64748b;
      flex-wrap: wrap;
      
      span {
        display: flex;
        align-items: center;
        gap: 6px;
        
        i { font-size: 8px; }
      }
    }

    /* Form Styles */
    .lote-form {
      padding: 8px 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      &.full-width { grid-column: span 2; }
      
      label {
        font-size: 13px;
        font-weight: 500;
        color: #334155;
      }
      
      input, textarea, :host ::ng-deep .p-dropdown, 
      :host ::ng-deep .p-calendar, :host ::ng-deep .p-inputnumber {
        width: 100%;
      }

      .hint {
        font-size: 11px;
        color: #94a3b8;
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    :host ::ng-deep {
      .lote-dialog .p-dialog-content { overflow: visible; }
      .p-dropdown-panel { z-index: 10001 !important; }
      .p-datepicker { z-index: 10001 !important; }
    }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-field.full-width { grid-column: span 1; }
      .filter-bar { flex-direction: column; }
      .filter-bar input { width: 100%; }
      .legenda { flex-direction: column; gap: 12px; }
    }
  `]
})
export class LoteListComponent implements OnInit {
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;

  private http = inject(HttpClient);
  private estoqueService = inject(EstoqueService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly listSearch = createEstoqueSearch(this.destroyRef, term => {
    this.searchTerm = term;
    this.buscar();
  });

  lotes: Lote[] = [];
  fornecedores: Fornecedor[] = [];
  invoices: InvoiceParaDropdown[] = [];
  loading = true;
  salvando = false;
  searchTerm = '';
  statusFilter: string | null = null;

  showLoteDialog = false;
  loteEditando: Partial<Lote> | null = null;

  private readonly statusOptionDefs = [
    { label: 'ATIVO', value: 'ATIVO' as const },
    { label: 'PARCIAL', value: 'PARCIAL' as const },
    { label: 'ESGOTADO', value: 'ESGOTADO' as const },
    { label: 'BLOQUEADO', value: 'BLOQUEADO' as const },
    { label: 'VENCIDO', value: 'VENCIDO' as const }
  ];

  get statusOptions() {
    return this.i18n.buildTranslatedOptions('lote.status', this.statusOptionDefs);
  }

  ngOnInit() {
    this.buscar();
    this.carregarFornecedores();
    this.carregarInvoices();
  }

  buscar() {
    this.loading = true;
    // Buscar lotes da API
    this.http.get<any>(`${environment.apiUrl}/estoque/lotes`, {
      params: {
        search: this.searchTerm || '',
        status: this.statusFilter || ''
      }
    }).subscribe({
      next: (result) => {
        this.lotes = result.content || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to search batches:', err);
        // Se a API não existir ainda, mostrar lista vazia
        this.lotes = [];
      }
    });
  }

  carregarFornecedores() {
    this.estoqueService.listarFornecedores({ size: 200 }).subscribe({
      next: (result) => this.fornecedores = result.content,
      error: (err) => console.error('Failed to load suppliers:', err)
    });
  }

  carregarInvoices() {
    this.estoqueService.listarInvoices({ size: 200, somenteUtilizaveis: true }).subscribe({
      next: (result) => {
        this.invoices = mapInvoicesParaDropdown(result.content, s =>
          this.i18n.translateCatalog('invoice.status', s, s ?? '')
        );
      },
      error: (err) => console.error('Failed to load invoices:', err)
    });
  }

  abrirNovoLote() {
    this.loteEditando = {
      codigoLote: '',
      fornecedorId: undefined,
      invoiceId: undefined,
      dataEntrada: new Date(),
      quantidadeTotal: 0,
      status: 'ATIVO',
      localizacao: ''
    };
    this.showLoteDialog = true;
  }

  editarLote(lote: Lote) {
    this.loteEditando = { ...lote };
    if (this.loteEditando.dataEntrada) {
      this.loteEditando.dataEntrada = parseIsoDateLocal(this.loteEditando.dataEntrada) ?? undefined;
    }
    if (this.loteEditando.dataValidade) {
      this.loteEditando.dataValidade = parseIsoDateLocal(this.loteEditando.dataValidade) ?? undefined;
    }
    const invId = this.loteEditando.invoiceId;
    if (invId != null && !this.invoices.some(i => i.id === invId)) {
      this.loteEditando.invoiceId = undefined;
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.screens.entrada.toast.invoiceNaoUtilizavel');
    }
    this.showLoteDialog = true;
  }

  verItensLote(lote: Lote) {
    this.i18n.addToast(this.messageService, 'info', 'estoque.loteList.toast.infoTitle', 'estoque.loteList.toast.infoDetail', {
      codigo: String(lote.codigoLote ?? ''),
      disp: String(lote.quantidadeDisponivel ?? 0),
      total: String(lote.quantidadeTotal ?? 0)
    });
  }

  salvarLote() {
    if (!this.loteEditando) return;

    if (!this.loteEditando.fornecedorId) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.loteList.toast.warnNeedSupplier');
      return;
    }

    this.salvando = true;

    const dados: any = { ...this.loteEditando };
    dados.dataEntrada = toIsoDatePayload(dados.dataEntrada);
    dados.dataValidade = toIsoDatePayload(dados.dataValidade);

    const url = dados.id 
      ? `${environment.apiUrl}/estoque/lotes/${dados.id}`
      : `${environment.apiUrl}/estoque/lotes`;
    
    const request = dados.id
      ? this.http.put<Lote>(url, dados)
      : this.http.post<Lote>(url, dados);

    request.subscribe({
      next: (lote) => {
        this.salvando = false;
        this.showLoteDialog = false;
        this.buscar();
        if (dados.id) {
          this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.loteList.toast.savedUpdated');
        } else {
          this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.loteList.toast.savedCreated', {
            codigo: String(lote.codigoLote ?? '')
          });
        }
      },
      error: (err) => {
        this.salvando = false;
        console.error('Failed to save batch:', err);
        const msg = this.i18n.translateApiError(err?.error, 'estoque.loteList.toast.saveErrorFallback');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
      }
    });
  }

  cancelarLote() {
    this.showLoteDialog = false;
    this.loteEditando = null;
  }

  getStatusLabel(status?: string): string {
    if (!status) {
      return '-';
    }
    return this.i18n.translateCatalog('lote.status', status, status);
  }

  getStatusSeverity(status?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const severities: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' } = {
      ATIVO: 'success',
      PARCIAL: 'warning',
      ESGOTADO: 'danger',
      BLOQUEADO: 'secondary',
      VENCIDO: 'danger'
    };
    return severities[status || ''] || 'secondary';
  }
}
