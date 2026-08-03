import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../../core/list-pagination.constants';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { MessageService } from 'primeng/api';
import { EstoqueService, OsKitRastreioResumo, SaidaProdutoRastreioLinha } from '../../core/estoque.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';

@Component({
  selector: 'app-rastreio-saidas-automaticas',
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
    TabViewModule,
    TranslatePipe,
    ListDataStatesComponent,
    PageHeroComponent
  ],
  template: `
    <p-toast></p-toast>
    <div class="as-page rastreio-container">
      <app-page-hero
        variant="sky"
        titleKey="estoque.rastreio.title"
        subtitleKey="estoque.rastreio.intro"
        titleIcon="pi-compass"
        [hasActions]="false">
      </app-page-hero>

      <p class="intro-dates muted">
        <span class="mono">associacao_fcu</span>.
        {{ 'estoque.rastreio.introDates' | translate }}
      </p>

      <div class="filter-bar">
        <input pInputText [(ngModel)]="filtroPn" [placeholder]="'estoque.rastreio.filter.pn' | translate" class="filter-field" />
        <input
          pInputText
          type="number"
          [(ngModel)]="filtroOsId"
          [placeholder]="'estoque.rastreio.filter.os' | translate"
          class="filter-field narrow"
          [attr.title]="'estoque.rastreio.filter.osTitle' | translate"
        />
        <p-dropdown
          [(ngModel)]="filtroOrigem"
          [options]="origemOptions"
          optionLabel="label"
          optionValue="value"
          [placeholder]="'estoque.rastreio.filter.origin' | translate"
          [showClear]="true"
          styleClass="filter-dd"
          [attr.title]="'estoque.rastreio.filter.originTitle' | translate"
        ></p-dropdown>
        <input pInputText type="number" [(ngModel)]="filtroProdId" [placeholder]="'estoque.rastreio.filter.catalogId' | translate" class="filter-field narrow" />
        <span class="dates">
          <label>{{ 'estoque.rastreio.filter.from' | translate }}</label>
          <input type="date" [(ngModel)]="filtroIni" class="date-input" [attr.title]="'estoque.rastreio.filter.dateFromTitle' | translate" />
          <label>{{ 'estoque.rastreio.filter.to' | translate }}</label>
          <input type="date" [(ngModel)]="filtroFim" class="date-input" [attr.title]="'estoque.rastreio.filter.dateToTitle' | translate" />
        </span>
        <button pButton [label]="'estoque.rastreio.filter.search' | translate" icon="pi pi-search" (click)="buscarPrimeiraPagina()"></button>
      </div>

      <p-tabView styleClass="rastreio-tabs">
        <p-tabPanel [header]="'estoque.rastreio.tab.kit' | translate">
          <p class="legado-disclaimer">
            <i class="pi pi-sitemap"></i>
            {{ 'estoque.rastreio.kitDisclaimer' | translate }}
          </p>
          <div class="table-container">
            <app-list-data-states
              [loading]="loadingLegado"
              [itemCount]="osKitRows.length"
              [skeletonRows]="8"
              [skeletonCols]="7"
              emptyTitleKey="estoque.rastreio.empty.kitOs"
              emptyDescriptionKey="ui.empty.description">
            <p-table appListScroll
              #dataTableLegado
              [value]="osKitRows"
              [loading]="loadingLegado"
              [paginator]="true"
              [rows]="pageSizeLegado"
              [totalRecords]="totalElementsLegado"
              [lazy]="true"
              (onLazyLoad)="onLazyLoadLegado($event)"
              [rowsPerPageOptions]="listRowsPerPageOptions"
              styleClass="p-datatable-striped p-datatable-kit-os"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th style="width: 44px" scope="col"></th>
                  <th style="min-width: 130px">{{ 'estoque.rastreio.col.os' | translate }}</th>
                  <th>{{ 'estoque.rastreio.col.client' | translate }}</th>
                  <th style="min-width: 110px">{{ 'estoque.rastreio.col.openDate' | translate }}</th>
                  <th style="min-width: 160px">{{ 'estoque.rastreio.col.fcu' | translate }}</th>
                  <th style="min-width: 100px">{{ 'estoque.rastreio.col.kitItems' | translate }}</th>
                  <th style="min-width: 120px">{{ 'estoque.rastreio.col.withMov' | translate }}</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-os>
                <ng-container>
                  <tr class="os-master-row" (click)="toggleKitOsExpand(os)" [attr.title]="'estoque.rastreio.row.expandTitle' | translate">
                    <td class="expand-cell">
                      <i
                        class="pi expand-chevron"
                        [ngClass]="isKitOsExpanded(os.osId) ? 'pi-chevron-down' : 'pi-chevron-right'"
                        aria-hidden="true"
                      ></i>
                    </td>
                    <td>
                      <strong>{{ formatOSRefKit(os) }}</strong>
                      <span class="muted" *ngIf="os.osId != null"> (pk {{ os.osId }})</span>
                    </td>
                    <td>{{ os.clienteNome || '—' }}</td>
                    <td>{{ os.dtAberturaOs ? (os.dtAberturaOs | date: 'dd/MM/yyyy') : '—' }}</td>
                    <td>
                      <div class="fcu-cell">
                        <strong>{{ os.fcuPn || os.fcuCodigo || '—' }}</strong>
                        <span class="fcu-desc-line" *ngIf="os.fcuDescription">{{ os.fcuDescription }}</span>
                      </div>
                    </td>
                    <td>{{ os.quantidadeItensKit ?? 0 }}</td>
                    <td>
                      <span class="kit-stat">{{ os.quantidadeItensConfirmadosEstoque ?? 0 }}</span>
                      <span class="muted"> / {{ os.quantidadeItensKit ?? 0 }}</span>
                    </td>
                  </tr>
                  <tr *ngIf="isKitOsExpanded(os.osId)" class="os-kit-expand-row">
                    <td colspan="7" (click)="$event.stopPropagation()">
                      <div class="nested-wrap">
                        <p-table
                          [value]="os.produtosKit || []"
                          styleClass="p-datatable-sm nested-kit-table"
                          [tableStyle]="{ 'min-width': '100%' }"
                        >
                          <ng-template pTemplate="header">
                            <tr>
                              <th style="min-width: 120px">{{ 'estoque.rastreio.nested.col.stockTrace' | translate }}</th>
                              <th [attr.title]="'estoque.rastreio.nested.col.pnTitle' | translate">{{ 'estoque.rastreio.nested.col.pn' | translate }}</th>
                              <th style="width: 88px">{{ 'estoque.rastreio.nested.col.catId' | translate }}</th>
                              <th>{{ 'estoque.rastreio.nested.col.product' | translate }}</th>
                              <th style="width: 88px">{{ 'estoque.rastreio.nested.col.kitQty' | translate }}</th>
                            </tr>
                          </ng-template>
                          <ng-template pTemplate="body" let-p>
                            <tr>
                              <td>
                                <p-tag *ngIf="p.confirmadoEmEstoque" [value]="'estoque.rastreio.tag.inStock' | translate" severity="success"></p-tag>
                                <p-tag *ngIf="!p.confirmadoEmEstoque" [value]="'estoque.rastreio.tag.catalogOnly' | translate" severity="warning"></p-tag>
                              </td>
                              <td><strong>{{ p.productPn || '—' }}</strong></td>
                              <td>{{ p.produtoCatalogoId ?? '—' }}</td>
                              <td>{{ p.productName || '—' }}</td>
                              <td>{{ p.quantidadeKit ?? '—' }}</td>
                            </tr>
                          </ng-template>
                          <ng-template pTemplate="emptymessage">
                            <tr>
                              <td colspan="5" class="empty-nested">{{ 'estoque.rastreio.empty.kitProducts' | translate }}</td>
                            </tr>
                          </ng-template>
                        </p-table>
                      </div>
                    </td>
                  </tr>
                </ng-container>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="7" class="empty-state">
                    <i class="pi pi-inbox"></i>
                    <p>{{ 'estoque.rastreio.empty.kitOs' | translate }}</p>
                  </td>
                </tr>
              </ng-template>
            </p-table>
            </app-list-data-states>
          </div>
        </p-tabPanel>

        <p-tabPanel [header]="'estoque.rastreio.tab.mov' | translate">
          <p class="muted tab-sub">{{ 'estoque.rastreio.movSub' | translate }} <span class="mono">movimentacao_estoque</span></p>
          <div class="table-container">
            <app-list-data-states
              [loading]="loading"
              [itemCount]="linhas.length"
              [skeletonRows]="8"
              [skeletonCols]="11"
              emptyTitleKey="estoque.rastreio.empty.mov"
              emptyDescriptionKey="ui.empty.description">
            <p-table appListScroll
              #dataTable
              [value]="linhas"
              [loading]="loading"
              [paginator]="true"
              [rows]="pageSize"
              [totalRecords]="totalElements"
              [lazy]="true"
              (onLazyLoad)="onLazyLoad($event)"
              [rowsPerPageOptions]="listRowsPerPageOptions"
              styleClass="p-datatable-striped"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th style="min-width: 150px">{{ 'estoque.rastreio.col.datetime' | translate }}</th>
                  <th style="min-width: 120px">{{ 'estoque.rastreio.col.origin' | translate }}</th>
                  <th style="min-width: 130px">{{ 'estoque.rastreio.col.os' | translate }}</th>
                  <th>{{ 'estoque.rastreio.col.client' | translate }}</th>
                  <th style="min-width: 140px">{{ 'estoque.rastreio.col.fcu' | translate }}</th>
                  <th>{{ 'estoque.rastreio.col.pnItem' | translate }}</th>
                  <th>{{ 'estoque.rastreio.col.catalog' | translate }}</th>
                  <th style="min-width: 120px">{{ 'estoque.rastreio.col.stockItem' | translate }}</th>
                  <th style="width: 80px">{{ 'estoque.rastreio.col.qty' | translate }}</th>
                  <th>{{ 'estoque.rastreio.col.user' | translate }}</th>
                  <th style="min-width: 180px">{{ 'estoque.rastreio.col.reason' | translate }}</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-row>
                <tr>
                  <td>{{ row.dataMovimentacao | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td><p-tag [value]="labelOrigem(row.origemSaida)" [severity]="severidadeOrigem(row.origemSaida)"></p-tag></td>
                  <td>
                    <strong>{{ formatOSRef(row) }}</strong>
                    <span class="muted" *ngIf="row.osId != null"> (pk {{ row.osId }})</span>
                  </td>
                  <td>{{ row.clienteNome || '—' }}</td>
                  <td>
                    <div class="fcu-cell">
                      <strong>{{ row.fcuPn || row.fcuCodigo || '—' }}</strong>
                      <span class="fcu-desc-line" *ngIf="row.fcuDescription">{{ row.fcuDescription }}</span>
                    </div>
                  </td>
                  <td><strong>{{ row.partNumber || '—' }}</strong></td>
                  <td>
                    <span *ngIf="row.idProdutoCatalogo != null">{{ row.idProdutoCatalogo }}</span>
                    <span class="muted" *ngIf="row.produtoCatalogoNome"> — {{ row.produtoCatalogoNome }}</span>
                  </td>
                  <td>
                    <span class="mono">{{ row.codigoRastreio || '—' }}</span>
                  </td>
                  <td>{{ row.quantidade }}</td>
                  <td>{{ row.usuarioNome || '—' }}</td>
                  <td class="small-cell">
                    <div>{{ row.motivo || '' }}</div>
                    <div class="mono mute" *ngIf="row.chaveIdempotencia">{{ row.chaveIdempotencia }}</div>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="11" class="empty-state">
                    <i class="pi pi-inbox"></i>
                    <p>{{ 'estoque.rastreio.empty.mov' | translate }}</p>
                  </td>
                </tr>
              </ng-template>
            </p-table>
            </app-list-data-states>
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>
  `,
  styles: [
    `
      :host { display: block; width: 100%; box-sizing: border-box; }
      .rastreio-container {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        padding: 0;
      }
      .page-header h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 24px;
        color: #1e293b;
        margin: 0 0 8px;
      }
      .page-header h1 i {
        color: #0ea5e9;
      }
      .intro-dates {
        color: #64748b;
        margin: 0 0 20px;
        max-width: 720px;
        font-size: 14px;
      }
      .page-header p {
        color: #64748b;
        margin: 0 0 24px;
        max-width: 720px;
      }
      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }
      .filter-field {
        min-width: 200px;
      }
      .filter-field.narrow {
        min-width: 140px;
        max-width: 160px;
      }
      .filter-dd {
        min-width: 200px;
      }
      .dates {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dates label {
        font-size: 13px;
        color: #64748b;
      }
      .date-input {
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 14px;
      }
      .table-container {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .mono {
        font-family: ui-monospace, monospace;
        font-size: 12px;
      }
      .muted {
        color: #64748b;
        font-weight: normal;
        font-size: 12px;
      }
      .mute {
        color: #94a3b8;
        font-size: 11px;
        margin-top: 4px;
      }
      .small-cell {
        font-size: 13px;
        color: #334155;
      }
      .empty-state {
        text-align: center;
        padding: 48px;
        color: #64748b;
      }
      .empty-state i {
        font-size: 48px;
        display: block;
        margin-bottom: 16px;
      }
      .legado-disclaimer {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 8px;
        padding: 12px 14px;
        margin: 0 0 16px;
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 8px;
        color: #92400e;
        font-size: 14px;
        line-height: 1.45;
      }
      .legado-disclaimer i {
        margin-top: 2px;
        flex-shrink: 0;
      }
      .tab-sub {
        margin: 0 0 14px;
        font-size: 14px;
        max-width: 900px;
      }
      :host ::ng-deep .rastreio-tabs .p-tabview-panels {
        padding-top: 16px;
      }
      .fcu-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
        line-height: 1.25;
        max-width: 200px;
      }
      .fcu-cell .fcu-desc-line {
        font-size: 12px;
        color: #64748b;
        font-weight: normal;
      }
      .os-master-row {
        cursor: pointer;
      }
      .os-master-row:hover {
        background: #f8fafc !important;
      }
      .expand-cell {
        width: 44px;
        text-align: center;
        vertical-align: middle;
      }
      .expand-chevron {
        color: #0ea5e9;
        font-size: 14px;
      }
      .os-kit-expand-row > td {
        background: #f1f5f9;
        border-top: none !important;
        padding: 0 !important;
      }
      .nested-wrap {
        padding: 12px 16px 16px 48px;
      }
      .nested-kit-table {
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
      }
      .empty-nested {
        text-align: center;
        padding: 16px;
        color: #64748b;
        font-size: 13px;
      }
      .kit-stat {
        font-weight: 600;
        color: #0f172a;
      }
    `
  ]
})
export class RastreioSaidasAutomaticasComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private estoqueService = inject(EstoqueService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);

  @ViewChild('dataTable') private dataTable?: Table;
  @ViewChild('dataTableLegado') private dataTableLegado?: Table;

  linhas: SaidaProdutoRastreioLinha[] = [];
  loading = true;
  pageIndex = 0;
  pageSize = DEFAULT_LIST_PAGE_SIZE;
  totalElements = 0;

  osKitRows: OsKitRastreioResumo[] = [];
  /** OS cujo kit está expandido (chave = osId). */
  expandedKitOsIds: Record<number, boolean> = {};
  loadingLegado = true;
  pageIndexLegado = 0;
  pageSizeLegado = DEFAULT_LIST_PAGE_SIZE;
  totalElementsLegado = 0;

  filtroPn = '';
  filtroOsId: number | null = null;
  filtroOrigem: string | null = null;
  filtroProdId: number | null = null;
  filtroIni = '';
  filtroFim = '';

  private readonly origemDefs = [
    { labelKey: 'estoque.rastreio.origem.OS_FCU_KIT', value: 'OS_FCU_KIT' as const },
    { labelKey: 'estoque.rastreio.origem.TROCAS_EVENTUAL', value: 'TROCAS_EVENTUAL' as const }
  ];

  get origemOptions() {
    return this.origemDefs.map(d => ({
      label: this.i18n.translate(d.labelKey),
      value: d.value
    }));
  }

  ngOnInit(): void {
    this.buscar(0, this.pageSize);
    this.buscarLegado(0, this.pageSizeLegado);
  }

  buscarPrimeiraPagina(): void {
    this.pageIndex = 0;
    this.pageIndexLegado = 0;
    if (this.dataTable) {
      this.dataTable.first = 0;
    }
    if (this.dataTableLegado) {
      this.dataTableLegado.first = 0;
    }
    this.buscar(0, this.pageSize);
    this.buscarLegado(0, this.pageSizeLegado);
  }

  onLazyLoad(ev: { first?: number; rows?: number }): void {
    const rows = ev.rows ?? this.pageSize;
    const first = ev.first ?? 0;
    this.pageSize = rows;
    this.pageIndex = Math.floor(first / rows);
    this.buscar(this.pageIndex, rows);
  }

  onLazyLoadLegado(ev: { first?: number; rows?: number }): void {
    const rows = ev.rows ?? this.pageSizeLegado;
    const first = ev.first ?? 0;
    this.pageSizeLegado = rows;
    this.pageIndexLegado = Math.floor(first / rows);
    this.buscarLegado(this.pageIndexLegado, rows);
  }

  private buscar(page: number, size: number): void {
    this.loading = true;
    this.estoqueService
      .listarRastreioSaidasAutomaticas({
        page,
        size,
        partNumber: this.filtroPn?.trim() || undefined,
        origemSaida: this.filtroOrigem || undefined,
        osId: this.filtroOsId != null && !Number.isNaN(this.filtroOsId) ? this.filtroOsId : undefined,
        produtoCatalogoId:
          this.filtroProdId != null && !Number.isNaN(this.filtroProdId) ? this.filtroProdId : undefined,
        dataInicio: this.filtroIni || undefined,
        dataFim: this.filtroFim || undefined
      })
      .subscribe({
        next: (res) => {
          this.linhas = res.content ?? [];
          this.totalElements = res.totalElements ?? this.linhas.length;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.i18n.addToastLiteralDetail(
            this.messageService,
            'error',
            'estoque.rastreio.toast.loadMovSummary',
            this.i18n.translateApiError(err?.error, 'estoque.rastreio.toast.requestFailed')
          );
        }
      });
  }

  private buscarLegado(page: number, size: number): void {
    this.loadingLegado = true;
    this.expandedKitOsIds = {};
    this.estoqueService
      .listarKitCatalogoFcuPorOsLegado({
        page,
        size,
        partNumber: this.filtroPn?.trim() || undefined,
        osId: this.filtroOsId != null && !Number.isNaN(this.filtroOsId) ? this.filtroOsId : undefined,
        produtoCatalogoId:
          this.filtroProdId != null && !Number.isNaN(this.filtroProdId) ? this.filtroProdId : undefined,
        dataInicio: this.filtroIni || undefined,
        dataFim: this.filtroFim || undefined
      })
      .subscribe({
        next: (res) => {
          this.osKitRows = res.content ?? [];
          this.totalElementsLegado = res.totalElements ?? this.osKitRows.length;
          this.loadingLegado = false;
        },
        error: (err) => {
          this.loadingLegado = false;
          this.i18n.addToastLiteralDetail(
            this.messageService,
            'error',
            'estoque.rastreio.toast.loadKitSummary',
            this.i18n.translateApiError(err?.error, 'estoque.rastreio.toast.requestFailed')
          );
        }
      });
  }

  isKitOsExpanded(osId?: number): boolean {
    if (osId == null) {
      return false;
    }
    return !!this.expandedKitOsIds[osId];
  }

  toggleKitOsExpand(os: OsKitRastreioResumo): void {
    if (os.osId == null) {
      return;
    }
    const id = os.osId;
    const next = { ...this.expandedKitOsIds };
    if (next[id]) {
      delete next[id];
    } else {
      next[id] = true;
    }
    this.expandedKitOsIds = next;
  }

  formatOSRefKit(row: OsKitRastreioResumo): string {
    if (row.osId == null) {
      return '—';
    }
    let y = '';
    if (row.dtAberturaOs) {
      const d = String(row.dtAberturaOs);
      const m = d.match(/^(\d{4})/);
      y = m ? m[1] : '';
    }
    return y ? `BEL-${row.osId}/${y}` : `BEL-${row.osId}`;
  }

  formatOSRef(row: SaidaProdutoRastreioLinha): string {
    if (row.osId == null) {
      return '—';
    }
    let y = '';
    if (row.dtAberturaOs) {
      const d = String(row.dtAberturaOs);
      const m = d.match(/^(\d{4})/);
      y = m ? m[1] : '';
    }
    return y ? `BEL-${row.osId}/${y}` : `BEL-${row.osId}`;
  }

  labelOrigem(o?: string | null): string {
    if (o === 'OS_FCU_KIT') {
      return this.i18n.translate('estoque.rastreio.labelOrigem.OS_FCU_KIT');
    }
    if (o === 'TROCAS_EVENTUAL') {
      return this.i18n.translate('estoque.rastreio.labelOrigem.TROCAS_EVENTUAL');
    }
    return o || '—';
  }

  severidadeOrigem(o?: string | null): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    if (o === 'OS_FCU_KIT') {
      return 'info';
    }
    if (o === 'TROCAS_EVENTUAL') {
      return 'warning';
    }
    return 'secondary';
  }
}
