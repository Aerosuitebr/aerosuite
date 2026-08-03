import { LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import {
  OSService,
  OS,
  OsConsultaTrocasEventuaisLinha,
  OSSolicitacaoTrocaItem
} from '../core/os.service';

@Component({
  selector: 'app-os-consulta-trocas-eventuais',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    TooltipModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  styleUrls: ['../shared/styles/list-styles.scss', './os-consulta-trocas-eventuais.component.scss'],
  template: `
    <div class="as-page list-container">
      <p-toast></p-toast>

      <app-page-hero
        variant="navy"
        titleKey="os.consultaTrocas.title"
        subtitleKey="os.consultaTrocas.subtitle"
        titleIcon="pi-search"
        [hasActions]="true">
        <div actions class="header-actions">
          <button
            pButton
            type="button"
            [label]="'os.consultaTrocas.btnBackOs' | translate"
            icon="pi pi-arrow-left"
            class="p-button-outlined"
            (click)="router.navigate(['/os'])"></button>
        </div>
      </app-page-hero>

      <div class="filters-section">
        <div class="filters-card">
          <div class="search-container">
            <div class="search-input-wrapper">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                pInputText
                class="search-input"
                [(ngModel)]="searchQ"
                [placeholder]="'os.consultaTrocas.searchPh' | translate"
                (keyup.enter)="refreshFromSearch()" />
            </div>
            <button
              pButton
              type="button"
              icon="pi pi-search"
              class="search-btn"
              [pTooltip]="'os.consultaTrocas.tooltipSearch' | translate"
              tooltipPosition="top"
              (click)="refreshFromSearch()"></button>
          </div>
        </div>
      </div>

      <div class="table-section">
        <div class="table-card">
          <div class="table-container">
            <app-list-data-states
              [loading]="loading"
              [itemCount]="rows.length"
              [skeletonRows]="8"
              [skeletonCols]="8"
              emptyTitleKey="os.consultaTrocas.empty"
              emptyDescriptionKey="ui.empty.description">
            <p-table appListScroll
              #dt
              [value]="rows"
              [lazy]="true"
              (onLazyLoad)="loadLazy($event)"
              [paginator]="true"
              [rows]="pageSize"
              [totalRecords]="totalRecords"
              [loading]="loading"
              [rowsPerPageOptions]="listRowsPerPageOptions"
              [sortField]="'id'"
              [sortOrder]="-1"
              dataKey="id"
              styleClass="consulta-trocas-table p-datatable-sm p-datatable-striped"
              [showCurrentPageReport]="true"
              [currentPageReportTemplate]="'os.consultaTrocas.pageReport' | translate">
              <ng-template pTemplate="header">
                <tr>
                  <th pSortableColumn="idOs" style="width: 140px; min-width: 140px;">
                    {{ 'os.consultaTrocas.col.idOs' | translate }}
                    <p-sortIcon field="idOs"></p-sortIcon>
                  </th>
                  <th pSortableColumn="clienteNome">
                    {{ 'os.consultaTrocas.col.cliente' | translate }}
                    <p-sortIcon field="clienteNome"></p-sortIcon>
                  </th>
                  <th pSortableColumn="dtAbertura" style="width: 130px;">
                    {{ 'os.consultaTrocas.col.abertura' | translate }}
                    <p-sortIcon field="dtAbertura"></p-sortIcon>
                  </th>
                  <th pSortableColumn="quantidadeItens" style="width: 90px;" class="num">
                    {{ 'os.consultaTrocas.col.itens' | translate }}
                    <p-sortIcon field="quantidadeItens"></p-sortIcon>
                  </th>
                  <th style="width: 70px;" class="num" [attr.title]="'os.consultaTrocas.col.pendTitle' | translate">{{ 'os.consultaTrocas.col.pendShort' | translate }}</th>
                  <th style="width: 60px;" class="num" [attr.title]="'os.consultaTrocas.col.pagoTitle' | translate">{{ 'os.consultaTrocas.col.pagoShort' | translate }}</th>
                  <th style="width: 60px;" class="num" [attr.title]="'os.consultaTrocas.col.naopagoTitle' | translate">{{ 'os.consultaTrocas.col.naopagoShort' | translate }}</th>
                  <th style="width: 90px;" class="coment-col">{{ 'os.consultaTrocas.col.comentShort' | translate }}</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-row>
                <tr class="row-click" (click)="abrirDetalhe(row)">
                  <td><strong>{{ formatOSId(row) }}</strong></td>
                  <td>{{ row.clienteNome || '—' }}</td>
                  <td>{{ row.dtAbertura || '—' }}</td>
                  <td class="num">{{ row.quantidadeItens }}</td>
                  <td class="num">{{ row.itensPagoPendente }}</td>
                  <td class="num">{{ row.itensPagoSim }}</td>
                  <td class="num">{{ row.itensPagoNao }}</td>
                  <td class="coment-col">
                    <span
                      *ngIf="row.temComentario"
                      class="coment-badge"
                      [pTooltip]="'os.consultaTrocas.comentTitulo' | translate"
                      tooltipPosition="left">
                      <i class="pi pi-comment" aria-hidden="true"></i>
                      {{ 'os.consultaTrocas.comentSim' | translate }}
                    </span>
                    <span *ngIf="!row.temComentario" class="coment-none" aria-hidden="true">—</span>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="8" class="empty">{{ 'os.consultaTrocas.empty' | translate }}</td>
                </tr>
              </ng-template>
            </p-table>
            </app-list-data-states>
          </div>
        </div>
      </div>
    </div>

    <p-dialog
      styleClass="as-hero-dialog" [header]="dialogTitulo"
      [(visible)]="dialogVisivel"
      [modal]="true"
      [style]="{ width: 'min(920px, 96vw)' }"
      [draggable]="false"
      (onHide)="fecharDialog()">
      <ng-container *ngIf="detalheLoading">
        <p class="muted">{{ 'os.consultaTrocas.loading' | translate }}</p>
      </ng-container>
      <ng-container *ngIf="!detalheLoading && detalheOs">
        <div class="detail-head" *ngIf="detalheOs.solicitacaoTrocasComentario?.trim()">
          <strong>{{ 'os.consultaTrocas.comentTitulo' | translate }}</strong>
          <p class="coment">{{ detalheOs.solicitacaoTrocasComentario }}</p>
        </div>
        <p-table [value]="detalheItens" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'os.consultaTrocas.col.produto' | translate }}</th>
              <th>{{ 'os.consultaTrocas.col.pn' | translate }}</th>
              <th>{{ 'os.consultaTrocas.col.sn' | translate }}</th>
              <th class="num">{{ 'os.consultaTrocas.col.qtd' | translate }}</th>
              <th>{{ 'os.consultaTrocas.col.statusPagamento' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-it>
            <tr>
              <td>{{ it.produtoNome || '—' }}</td>
              <td>{{ it.produtoPn || '—' }}</td>
              <td>{{ it.produtoSn || '—' }}</td>
              <td class="num">{{ it.quantidade ?? '—' }}</td>
              <td>{{ labelPago(it.pago) }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="empty">{{ 'os.consultaTrocas.emptyItens' | translate }}</td>
            </tr>
          </ng-template>
        </p-table>
        <div class="dialog-actions">
          <button pButton type="button" [label]="'os.consultaTrocas.btnClose' | translate" class="p-button-text" (click)="fecharDialog()"></button>
          <button
            pButton
            type="button"
            [label]="'os.consultaTrocas.btnOpenOs' | translate"
            icon="pi pi-external-link"
            (click)="abrirOsEdicao()"></button>
        </div>
      </ng-container>
    </p-dialog>
  `
})
export class OsConsultaTrocasEventuaisComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  @ViewChild('dt') dt?: Table;

  private api = inject(OSService);
  readonly router = inject(Router);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);

  rows: OsConsultaTrocasEventuaisLinha[] = [];
  totalRecords = 0;
  pageSize = 20;
  loading = true;
  searchQ = '';
  /** Último termo enviado à API (lazy load reenvia sem o input — manter filtro) */
  private qAtivo = '';

  dialogVisivel = false;
  dialogTitulo = '';
  detalheLoading = false;
  detalheOs: OS | null = null;
  detalheItens: OSSolicitacaoTrocaItem[] = [];
  private detalheOsPk: number | null = null;

  ngOnInit() {
    this.loading = true;
    this.loadPage(0, this.pageSize, 'id', -1);
  }

  refreshFromSearch() {
    this.qAtivo = (this.searchQ || '').trim();
    if (this.dt) {
      this.dt.reset();
      return;
    }
    this.loadPage(0, this.pageSize, 'id', -1);
  }

  loadLazy(ev: TableLazyLoadEvent) {
    const first = ev.first ?? 0;
    const rows = ev.rows ?? this.pageSize;
    this.pageSize = rows;
    const sortField = (ev.sortField as string) || 'id';
    const sortOrder = ev.sortOrder ?? -1;
    this.loadPage(first, rows, sortField, sortOrder);
  }

  private loadPage(first: number, rows: number, sortField: string, sortOrder: number) {
    this.loading = true;
    const page = rows > 0 ? Math.floor(first / rows) : 0;
    const dir = sortOrder === 1 ? 'asc' : 'desc';
    const sort = `${sortField},${dir}`;
    this.api
      .listConsultaTrocasEventuais({
        page,
        size: rows,
        sort,
        q: this.qAtivo || undefined
      })
      .subscribe({
        next: (res) => {
          this.rows = res.items || [];
          this.totalRecords = res.totalElements ?? 0;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'os.consultaTrocas.toast.loadFail');
        }
      });
  }

  abrirDetalhe(row: OsConsultaTrocasEventuaisLinha) {
    this.detalheOsPk = row.id;
    const num = this.formatOSId(row);
    const cliente = (row.clienteNome || '').trim() || this.i18n.translate('os.consultaTrocas.clienteFallback');
    this.dialogTitulo = this.i18n.translate('os.consultaTrocas.dialogTitulo', {
      num,
      cliente
    });
    this.dialogVisivel = true;
    this.detalheLoading = true;
    this.detalheOs = null;
    this.detalheItens = [];
    this.api.getById(row.id).subscribe({
      next: (os) => {
        this.detalheOs = os;
        this.detalheItens = [...(os.solicitacaoTrocasItens || [])].sort(
          (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || (a.id ?? 0) - (b.id ?? 0)
        );
        this.detalheLoading = false;
      },
      error: () => {
        this.detalheLoading = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'os.consultaTrocas.toast.osFail');
      }
    });
  }

  fecharDialog() {
    this.dialogVisivel = false;
    this.detalheOs = null;
    this.detalheItens = [];
    this.detalheOsPk = null;
  }

  abrirOsEdicao() {
    const id = this.detalheOsPk ?? this.detalheOs?.id;
    if (id == null) {
      return;
    }
    this.dialogVisivel = false;
    this.router.navigate(['/os'], { queryParams: { editId: String(id) } });
  }

  labelPago(p: boolean | null | undefined): string {
    if (p === true) {
      return this.i18n.translate('os.consultaTrocas.pago.true');
    }
    if (p === false) {
      return this.i18n.translate('os.consultaTrocas.pago.false');
    }
    return this.i18n.translate('os.consultaTrocas.pago.null');
  }

  /** Mesmo padrão da tela de Ordem de Serviço: BEL-[id]/[ano da abertura]. */
  formatOSId(os: { id?: number | null; dtAbertura?: string | null; dataAbertura?: string | null } | null): string {
    if (!os || os.id == null) {
      return '-';
    }
    const rawDate = os.dtAbertura || os.dataAbertura;
    const year = rawDate ? new Date(rawDate).getFullYear() : new Date().getFullYear();
    const yearStr = Number.isFinite(year) ? String(year) : String(new Date().getFullYear());
    return `BEL-${os.id}/${yearStr}`;
  }
}
