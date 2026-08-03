import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../../core/list-pagination.constants';
import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { EstoqueService, MovimentacaoEstoque } from '../../core/estoque.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';

@Component({
  selector: 'app-movimentacao-list',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    DropdownModule,
    ToastModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  template: `
    <p-toast></p-toast>
    <div class="as-page movimentacoes-container">
      <app-page-hero
        variant="sky"
        titleKey="estoque.movimentacoes.list.title"
        subtitleKey="estoque.movimentacoes.list.subtitle"
        titleIcon="pi-history"
        [hasActions]="false">
      </app-page-hero>

      <div class="filter-bar">
        <input
          pInputText
          [(ngModel)]="partNumberFilter"
          [placeholder]="'estoque.movimentacoes.list.filterPnPh' | translate"
          class="filter-field filter-pn"
          (keyup.enter)="buscarPrimeiraPagina()" />
        <p-dropdown
          [(ngModel)]="tipoFilter"
          [options]="tipoOptions"
          [placeholder]="'estoque.movimentacoes.list.filterType' | translate"
          [showClear]="true"
          styleClass="filter-dd">
        </p-dropdown>
        <span class="dates">
          <label for="mov-data-ini">{{ 'estoque.movimentacoes.list.filterDateFrom' | translate }}</label>
          <input id="mov-data-ini" type="date" [(ngModel)]="dataInicioFilter" class="date-input" />
          <label for="mov-data-fim">{{ 'estoque.movimentacoes.list.filterDateTo' | translate }}</label>
          <input id="mov-data-fim" type="date" [(ngModel)]="dataFimFilter" class="date-input" />
        </span>
        <button
          pButton
          type="button"
          [label]="'estoque.movimentacoes.list.btnSearch' | translate"
          icon="pi pi-search"
          (click)="buscarPrimeiraPagina()">
        </button>
        <button
          pButton
          type="button"
          class="p-button-text"
          [label]="'estoque.movimentacoes.list.btnClear' | translate"
          icon="pi pi-filter-slash"
          (click)="limparFiltros()">
        </button>
      </div>

      <div class="table-container">
        <app-list-data-states
          [loading]="loading"
          [itemCount]="movimentacoes.length"
          [skeletonRows]="8"
          [skeletonCols]="7"
          emptyTitleKey="estoque.movimentacoes.list.empty"
          emptyDescriptionKey="ui.empty.description">
          <p-table
            #dataTable
            appListScroll
            [value]="movimentacoes"
            [loading]="loading"
            [paginator]="true"
            [rows]="pageSize"
            [totalRecords]="totalElements"
            [lazy]="true"
            (onLazyLoad)="onLazyLoad($event)"
            [rowsPerPageOptions]="listRowsPerPageOptions"
            styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 170px">{{ 'estoque.movimentacoes.list.col.datetime' | translate }}</th>
              <th style="width: 110px">{{ 'estoque.movimentacoes.list.col.type' | translate }}</th>
              <th style="width: 150px">{{ 'estoque.movimentacoes.list.col.itemCode' | translate }}</th>
              <th>{{ 'estoque.movimentacoes.list.col.partNumber' | translate }}</th>
              <th>{{ 'estoque.movimentacoes.list.col.reason' | translate }}</th>
              <th style="width: 100px">{{ 'estoque.movimentacoes.list.col.qty' | translate }}</th>
              <th>{{ 'estoque.movimentacoes.list.col.user' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-mov>
            <tr>
              <td>{{ mov.dataMovimentacao | date:'dd/MM/yyyy HH:mm' }}</td>
              <td><p-tag [value]="getTipoLabel(mov.tipoMovimentacao)" [severity]="getTipoSeverity(mov.tipoMovimentacao)"></p-tag></td>
              <td><span class="codigo">{{ mov.itemCodigoRastreio }}</span></td>
              <td><strong>{{ mov.itemPartNumber }}</strong></td>
              <td>{{ mov.motivo || '-' }}</td>
              <td>{{ mov.quantidade }}</td>
              <td>{{ mov.usuarioNome || '-' }}</td>
            </tr>
          </ng-template>
        </p-table>
        </app-list-data-states>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; box-sizing: border-box; }
    .movimentacoes-container { width: 100%; max-width: 100%; box-sizing: border-box; }
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 12px;
      margin-bottom: 20px;
    }
    .filter-field { min-width: 180px; }
    .filter-pn { flex: 1 1 220px; max-width: 280px; }
    .filter-dd { min-width: 180px; }
    .dates {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #475569;
    }
    .date-input {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 13px;
      color: #0f172a;
      background: #fff;
    }
    .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    @media (max-width: 1023px) {
      .table-container {
        overflow-x: auto;
        overflow-y: visible;
        -webkit-overflow-scrolling: touch;
      }
    }
    .codigo { font-family: monospace; font-size: 12px; color: #0ea5e9; }
  `]
})
export class MovimentacaoListComponent {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  @ViewChild('dataTable') dataTable?: Table;

  private estoqueService = inject(EstoqueService);
  private i18n = inject(TranslationService);

  movimentacoes: MovimentacaoEstoque[] = [];
  loading = true;
  pageSize = DEFAULT_LIST_PAGE_SIZE;
  totalElements = 0;
  private currentPage = 0;

  tipoFilter: string | null = null;
  partNumberFilter = '';
  dataInicioFilter = '';
  dataFimFilter = '';

  private readonly tipoOptionDefs = [
    { label: 'ENTRADA', value: 'ENTRADA' as const },
    { label: 'SAIDA', value: 'SAIDA' as const },
    { label: 'TRANSFERENCIA', value: 'TRANSFERENCIA' as const },
    { label: 'AJUSTE', value: 'AJUSTE' as const },
    { label: 'DEVOLUCAO', value: 'DEVOLUCAO' as const },
    { label: 'DESCARTE', value: 'DESCARTE' as const }
  ];

  get tipoOptions() {
    return this.i18n.buildTranslatedOptions('movimentacao.tipo', this.tipoOptionDefs);
  }

  getTipoLabel(tipo?: string): string {
    if (!tipo) return '';
    return this.i18n.translateCatalog('movimentacao.tipo', tipo, tipo);
  }

  buscarPrimeiraPagina() {
    this.currentPage = 0;
    if (this.dataTable) {
      this.dataTable.first = 0;
    }
    this.buscar(0, this.pageSize);
  }

  limparFiltros() {
    this.tipoFilter = null;
    this.partNumberFilter = '';
    this.dataInicioFilter = '';
    this.dataFimFilter = '';
    this.buscarPrimeiraPagina();
  }

  onLazyLoad(event: TableLazyLoadEvent) {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.pageSize;
    this.pageSize = rows;
    this.currentPage = rows > 0 ? Math.floor(first / rows) : 0;
    this.buscar(this.currentPage, rows);
  }

  private buscar(page: number, size: number) {
    this.loading = true;
    this.estoqueService.listarMovimentacoes({
      page,
      size,
      tipo: this.tipoFilter || undefined,
      partNumber: this.partNumberFilter.trim() || undefined,
      dataInicio: this.dataInicioFilter || undefined,
      dataFim: this.dataFimFilter || undefined
    }).subscribe({
      next: (result) => {
        this.movimentacoes = result.content ?? [];
        this.totalElements = result.totalElements ?? this.movimentacoes.length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getTipoSeverity(tipo?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const severities: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' } = {
      ENTRADA: 'success',
      SAIDA: 'danger',
      TRANSFERENCIA: 'info',
      AJUSTE: 'warning',
      DEVOLUCAO: 'info',
      DESCARTE: 'danger'
    };
    return severities[tipo || ''] || 'secondary';
  }
}
