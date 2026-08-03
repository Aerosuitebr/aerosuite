import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../../core/lazy-list-pagination.helper';
import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EstoqueService, Fornecedor, PageResponse } from '../../core/estoque.service';
import { TranslationService } from '../../core/translation.service';
import { extractApiErrorMessage } from '../../core/backend-i18n-message.util';
import { TranslatePipe } from '../../core/translate.pipe';
import { ESTOQUE_PAIS_I18N_KEYS, ESTOQUE_PAIS_OPTION_VALUES } from '../../core/i18n/estoque-screens-i18n';
import { createEstoqueSearch } from '../shared/estoque-search.helper';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';

@Component({
  selector: 'app-fornecedor-list',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    DialogModule, ToastModule, DropdownModule, InputTextareaModule,
    TagModule, TooltipModule, ConfirmDialogModule, TranslatePipe,
    ListDataStatesComponent, PageHeroComponent
  ],
  styleUrls: ['./fornecedor-list.component.scss'],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    
    <div class="as-page fornecedor-container">
      <app-page-hero
        variant="sky"
        titleKey="estoque.fornecedores.list.title"
        subtitleKey="estoque.fornecedores.list.subtitle"
        titleIcon="pi-truck"
        [hasActions]="true">
        <button
          actions
          pButton
          [label]="'estoque.fornecedores.list.btnNew' | translate"
          icon="pi pi-plus"
          (click)="abrirDialog()"></button>
      </app-page-hero>

      <div class="filter-bar">
        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <input
            pInputText
            [(ngModel)]="searchTerm"
            [placeholder]="'estoque.fornecedores.list.searchPlaceholder' | translate"
            (input)="listSearch.fromInput($event)"
            (ngModelChange)="listSearch.fromModel($event)" />
        </span>
      </div>

      <div class="table-container">
        <app-list-data-states
          [loading]="loading"
          [itemCount]="totalRecords"
          [skeletonRows]="8"
          [skeletonCols]="6"
          [mountContentWhileLoading]="true"
          emptyTitleKey="estoque.fornecedores.list.empty"
          emptyDescriptionKey="ui.empty.description">
        <p-table appListScroll
                 [value]="fornecedores"
                 [loading]="loading"
                 [paginator]="true"
                 [first]="tableFirst"
                 [rows]="size"
                 [rowsPerPageOptions]="listRowsPerPageOptions"
                 [totalRecords]="totalRecords"
                 [lazy]="true"
                 dataKey="id"
                 (onLazyLoad)="carregarDados($event)"
                 styleClass="p-datatable-striped fornecedores-table">
          <ng-template pTemplate="header">
            <tr>
              <th class="col-codigo">
                <div class="header-cell"><span>{{ 'common.list.col.code' | translate }}</span></div>
              </th>
              <th class="col-razao">
                <div class="header-cell"><span>{{ 'estoque.fornecedores.list.col.legalName' | translate }}</span></div>
              </th>
              <th class="col-pais">
                <div class="header-cell"><span>{{ 'estoque.fornecedores.list.col.country' | translate }}</span></div>
              </th>
              <th class="col-telefone">
                <div class="header-cell"><span>{{ 'estoque.fornecedores.list.col.phone' | translate }}</span></div>
              </th>
              <th class="col-email">
                <div class="header-cell"><span>{{ 'common.list.col.email' | translate }}</span></div>
              </th>
              <th class="col-asl">
                <div class="header-cell"><span>{{ 'estoque.fornecedores.col.aslStatus' | translate }}</span></div>
              </th>
              <th class="col-actions">
                <div class="header-cell"><span>{{ 'common.list.col.actions' | translate }}</span></div>
              </th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-f>
            <tr>
              <td class="col-codigo">
                <span class="codigo-badge" [pTooltip]="f.codigo" tooltipPosition="top">{{ f.codigo }}</span>
              </td>
              <td class="col-razao">
                <div class="fornecedor-info">
                  <strong [pTooltip]="f.razaoSocial" tooltipPosition="top">{{ f.razaoSocial }}</strong>
                  <small *ngIf="f.nomeFantasia" [pTooltip]="f.nomeFantasia" tooltipPosition="top">{{ f.nomeFantasia }}</small>
                </div>
              </td>
              <td class="col-pais">
                <p-tag [value]="f.paisOrigem || ('estoque.common.notInformed' | translate)"
                       [severity]="f.paisOrigem === 'Estados Unidos' ? 'info' : 'secondary'"></p-tag>
              </td>
              <td class="col-telefone">
                <span class="cell-content" [pTooltip]="f.telefone" tooltipPosition="top">{{ f.telefone || '-' }}</span>
              </td>
              <td class="col-email">
                <span class="cell-content" [pTooltip]="f.email" tooltipPosition="top">{{ f.email || '-' }}</span>
              </td>
              <td class="col-asl">
                <p-tag [value]="labelAsl(f.aslStatus)" [severity]="aslSeverity(f.aslStatus)"></p-tag>
              </td>
              <td class="col-actions">
                <div class="actions-cell">
                <div class="action-buttons">
                  <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" 
                          [pTooltip]="'common.list.tooltip.edit' | translate" (click)="editar(f)"></button>
                  <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" 
                          [pTooltip]="'common.list.tooltip.delete' | translate" (click)="confirmarExclusao(f)"></button>
                  </div>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
        </app-list-data-states>
      </div>

      <!-- Dialog de Cadastro/Edição -->
      <p-dialog styleClass="as-hero-dialog fornecedor-dialog" [(visible)]="showDialog"
                [header]="fornecedor.id ? ('estoque.fornecedores.dialog.edit' | translate) : ('estoque.fornecedores.dialog.new' | translate)"
                [modal]="true" [style]="{width: '700px'}">
        <div class="form-grid">
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.dialog.field.code' | translate }}</label>
            <input pInputText [(ngModel)]="fornecedor.codigo" [placeholder]="'estoque.common.autoCodePh' | translate">
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.dialog.field.legalName' | translate }}</label>
            <input pInputText [(ngModel)]="fornecedor.razaoSocial" [placeholder]="'estoque.fornecedores.dialog.ph.company' | translate">
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.dialog.field.tradeName' | translate }}</label>
            <input pInputText [(ngModel)]="fornecedor.nomeFantasia">
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.dialog.field.country' | translate }}</label>
            <p-dropdown [(ngModel)]="fornecedor.paisOrigem" [options]="paises" [placeholder]="'estoque.common.select' | translate" styleClass="w-full"></p-dropdown>
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.dialog.field.phone' | translate }}</label>
            <input pInputText [(ngModel)]="fornecedor.telefone">
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.dialog.field.email' | translate }}</label>
            <input pInputText [(ngModel)]="fornecedor.email" type="email">
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.dialog.field.website' | translate }}</label>
            <input pInputText [(ngModel)]="fornecedor.website">
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.dialog.field.contact' | translate }}</label>
            <input pInputText [(ngModel)]="fornecedor.contatoNome" [placeholder]="'estoque.fornecedores.dialog.ph.contact' | translate">
          </div>
          <div class="form-field full-width">
            <label>{{ 'estoque.fornecedores.dialog.field.address' | translate }}</label>
            <input pInputText [(ngModel)]="fornecedor.endereco">
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.dialog.field.city' | translate }}</label>
            <input pInputText [(ngModel)]="fornecedor.cidade">
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.dialog.field.state' | translate }}</label>
            <input pInputText [(ngModel)]="fornecedor.estado">
          </div>
          <div class="form-field full-width">
            <label>{{ 'estoque.fornecedores.dialog.field.notes' | translate }}</label>
            <textarea pInputTextarea [(ngModel)]="fornecedor.observacoes" [rows]="3"></textarea>
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.field.aslStatus' | translate }}</label>
            <p-dropdown [(ngModel)]="fornecedor.aslStatus" [options]="aslStatusOptions" optionLabel="label" optionValue="value" styleClass="w-full"></p-dropdown>
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.field.aslEscopo' | translate }}</label>
            <input pInputText [(ngModel)]="fornecedor.aslEscopo" class="w-full" />
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.field.aslValidade' | translate }}</label>
            <input pInputText type="date" [(ngModel)]="fornecedor.aslValidade" class="w-full" />
          </div>
          <div class="form-field">
            <label>{{ 'estoque.fornecedores.field.aslAprovadoEm' | translate }}</label>
            <input pInputText type="date" [(ngModel)]="fornecedor.aslAprovadoEm" class="w-full" />
          </div>
          <div class="form-field full-width">
            <label>{{ 'estoque.fornecedores.field.aslObs' | translate }}</label>
            <textarea pInputTextarea [(ngModel)]="fornecedor.aslObservacoes" [rows]="2"></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton [label]="'common.actions.cancel' | translate" class="p-button-text" (click)="showDialog = false"></button>
          <button pButton [label]="'common.actions.save' | translate" icon="pi pi-check" (click)="salvar()" [loading]="salvando"></button>
        </ng-template>
      </p-dialog>
    </div>
  `
})
export class FornecedorListComponent {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private estoqueService = inject(EstoqueService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly requestGuard = createStaleRequestGuard();

  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;

  readonly listSearch = createEstoqueSearch(this.destroyRef, term => {
    this.searchTerm = term;
    this.buscar();
  });

  fornecedores: Fornecedor[] = [];
  totalRecords = 0;
  loading = true;
  searchTerm = '';
  
  showDialog = false;
  fornecedor: Partial<Fornecedor> = {};
  salvando = false;

  get paises() {
    return ESTOQUE_PAIS_OPTION_VALUES.map(value => ({
      label: this.i18n.translate(ESTOQUE_PAIS_I18N_KEYS[value] ?? value),
      value
    }));
  }

  get aslStatusOptions() {
    return ['APROVADO', 'PENDENTE', 'SUSPENSO', 'NAO_APLICAVEL'].map(value => ({
      value,
      label: this.i18n.translate(`estoque.fornecedores.asl.${value}`)
    }));
  }

  labelAsl(status?: string): string {
    if (!status) return '—';
    return this.i18n.translateCatalog('estoque.fornecedores.asl', status, status);
  }

  aslSeverity(status?: string): 'success' | 'warning' | 'danger' | 'secondary' {
    if (status === 'APROVADO') return 'success';
    if (status === 'SUSPENSO') return 'danger';
    if (status === 'PENDENTE') return 'warning';
    return 'secondary';
  }

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  carregarDados(event?: LazyLoadEvent) {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    const seq = this.requestGuard.bump();
    this.loading = true;

    this.estoqueService.listarFornecedores({
      page: req.page,
      size: req.size,
      search: this.searchTerm.trim() || undefined
    }).subscribe({
      next: (result) => {
        if (this.requestGuard.isStale(seq)) {
          return;
        }
        this.fornecedores = result.content ?? [];
        this.totalRecords = result.totalElements ?? 0;
        this.loading = false;
      },
      error: () => {
        if (this.requestGuard.isStale(seq)) {
          return;
        }
        this.loading = false;
      }
    });
  }

  buscar() {
    this.pageIndex = 0;
    this.carregarDados({ first: 0, rows: this.size });
  }

  abrirDialog() {
    this.fornecedor = { paisOrigem: 'Estados Unidos', aslStatus: 'PENDENTE' };
    this.showDialog = true;
  }

  editar(f: Fornecedor) {
    this.fornecedor = { ...f };
    this.showDialog = true;
  }

  salvar() {
    if (!this.fornecedor.razaoSocial) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.fornecedorList.toast.warnRazaoSocial');
      return;
    }

    this.salvando = true;
    const request = this.fornecedor.id
      ? this.estoqueService.atualizarFornecedor(this.fornecedor.id, this.fornecedor as Fornecedor)
      : this.estoqueService.criarFornecedor(this.fornecedor as Fornecedor);

    request.subscribe({
      next: () => {
        this.salvando = false;
        this.showDialog = false;
        this.buscar();
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.fornecedorList.toast.saved');
      },
      error: (err) => {
        this.salvando = false;
        const msg = extractApiErrorMessage(err, this.i18n, 'estoque.fornecedorList.toast.saveErrorFallback');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
      }
    });
  }

  confirmarExclusao(f: Fornecedor) {
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.fornecedor.message', { name: String(f?.razaoSocial ?? '') }),
      header: 'confirm.header.delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (!f?.id) return;
        this.estoqueService.excluirFornecedor(f.id).subscribe({
          next: () => {
            this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'estoque.fornecedorList.toast.deleted');
            this.buscar();
          },
          error: (err) => {
            const msg = extractApiErrorMessage(err, this.i18n, 'estoque.fornecedorList.toast.deleteError');
            this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
          }
        });
      }
    });
  }
}
