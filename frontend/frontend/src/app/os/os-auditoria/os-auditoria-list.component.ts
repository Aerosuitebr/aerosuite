import { Component, inject, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, Table } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { OSAuditoriaService, OSAuditoria, PageResponse } from '../../core/os-auditoria.service';
import { DossieAuditoriaService } from '../../core/dossie-auditoria.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { TranslationService } from '../../core/translation.service';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { formatUiDateTime } from '../../core/locale/locale-intl.util';
import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../../core/lazy-list-pagination.helper';

interface FiltroAuditoria {
  identificadorOs?: number;
  acao?: string;
  dataInicio?: Date;
  dataFim?: Date;
  usuario?: string;
}

interface ValorDisplay {
  label: string;
  tooltip: string;
  showMetadataLink: boolean;
}

interface FriendlyLabel {
  label: string;
  tooltip: string;
  showMetadataLink: boolean;
}

@Component({
  selector: 'app-os-auditoria-list',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    TooltipModule,
    ProgressSpinnerModule,
    CardModule,
    DialogModule,
    InputNumberModule,
    TranslatePipe,
    ToastModule,
    ListDataStatesComponent,
    PageHeroComponent
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="auditoria-page">
      <app-page-hero
        variant="navy"
        titleKey="os.auditoria.list.title"
        subtitleKey="os.auditoria.list.subtitle"
        titleIcon="pi-history"
        [hasActions]="true">
        <div actions class="hero-actions">
          <button
            *ngIf="filtros.identificadorOs"
            pButton
            type="button"
            icon="pi pi-file-pdf"
            class="p-button-outlined"
            [label]="'dossie.linkFromAuditoria' | translate"
            [loading]="exportandoDossie"
            (click)="exportarDossie()">
          </button>
        </div>
      </app-page-hero>

      <p-card styleClass="toolbar-card">
        <div class="filters-grid" role="search">
          <div class="filter-field filter-field--sm">
            <label for="audOsId">{{ 'os.auditoria.list.col.osId' | translate }}</label>
            <p-inputNumber
              inputId="audOsId"
              [(ngModel)]="filtros.identificadorOs"
              [useGrouping]="false"
              [placeholder]="'os.auditoria.list.ph.osId' | translate"
              (onInput)="onFiltroChange()">
            </p-inputNumber>
          </div>

          <div class="filter-field">
            <label for="audAcao">{{ 'os.auditoria.list.col.actionType' | translate }}</label>
            <p-dropdown
              inputId="audAcao"
              [(ngModel)]="filtros.acao"
              [options]="acoesOptions"
              [placeholder]="'os.auditoria.list.filter.allActions' | translate"
              [showClear]="true"
              appendTo="body"
              (onChange)="onFiltroChange()">
            </p-dropdown>
          </div>

          <div class="filter-field">
            <label for="audDataIni">{{ 'os.auditoria.list.filter.dateFrom' | translate }}</label>
            <p-calendar
              inputId="audDataIni"
              [(ngModel)]="filtros.dataInicio"
              dateFormat="dd/mm/yy"
              [showIcon]="true"
              [showClear]="true"
              appendTo="body"
              [placeholder]="'os.auditoria.list.filter.dateFrom' | translate"
              (onSelect)="onFiltroChange()"
              (onClear)="onFiltroChange()">
            </p-calendar>
          </div>

          <div class="filter-field">
            <label for="audDataFim">{{ 'os.auditoria.list.filter.dateTo' | translate }}</label>
            <p-calendar
              inputId="audDataFim"
              [(ngModel)]="filtros.dataFim"
              dateFormat="dd/mm/yy"
              [showIcon]="true"
              [showClear]="true"
              appendTo="body"
              [placeholder]="'os.auditoria.list.filter.dateTo' | translate"
              (onSelect)="onFiltroChange()"
              (onClear)="onFiltroChange()">
            </p-calendar>
          </div>

          <div class="filter-field filter-field--user">
            <label for="audUsuario">{{ 'os.auditoria.list.col.user' | translate }}</label>
            <input
              pInputText
              id="audUsuario"
              [(ngModel)]="filtros.usuario"
              [placeholder]="'os.auditoria.list.filter.userPlaceholder' | translate"
              (input)="onFiltroChange()" />
          </div>

          <div class="filter-actions">
            <button
              pButton
              type="button"
              [label]="'os.auditoria.list.filter.clear' | translate"
              icon="pi pi-filter-slash"
              class="p-button-outlined"
              (click)="limparFiltros()"></button>
            <button
              pButton
              type="button"
              [label]="'os.auditoria.list.btn.search' | translate"
              icon="pi pi-search"
              (click)="buscar()"></button>
          </div>
        </div>
      </p-card>

      <!-- Tabela -->
      <p-card styleClass="table-card">
        <app-list-data-states
          [loading]="loading"
          [itemCount]="totalRecords"
          [skeletonRows]="8"
          [skeletonCols]="8"
          [mountContentWhileLoading]="true"
          emptyTitleKey="os.auditoria.list.empty"
          emptyDescriptionKey="os.auditoria.list.emptyHint">
        <p-table appListScroll
          #dt
          [first]="tableFirst"
          [value]="auditorias"
          [lazy]="true"
          [paginator]="true"
          [rows]="size"
          [totalRecords]="totalRecords"
          [loading]="loading"
          [rowsPerPageOptions]="listRowsPerPageOptions"
          dataKey="id"
          (onLazyLoad)="onLazyLoad($event)"
          [showCurrentPageReport]="true"
          [currentPageReportTemplate]="'common.list.pageReport' | translate"
          styleClass="p-datatable-sm p-datatable-striped auditoria-table">

          <ng-template pTemplate="header">
            <tr>
              <th class="col-os">{{ 'os.auditoria.list.col.osId' | translate }}</th>
              <th class="col-acao">{{ 'os.auditoria.list.col.actionType' | translate }}</th>
              <th class="col-campo">{{ 'os.auditoria.list.col.field' | translate }}</th>
              <th class="col-valor">{{ 'os.auditoria.list.col.oldValue' | translate }}</th>
              <th class="col-valor">{{ 'os.auditoria.list.col.newValue' | translate }}</th>
              <th class="col-user">{{ 'os.auditoria.list.col.user' | translate }}</th>
              <th class="col-data">{{ 'os.auditoria.list.col.datetime' | translate }}</th>
              <th class="col-detalhe">{{ 'os.auditoria.list.col.details' | translate }}</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-item>
            <tr>
              <td class="col-os">
                <span class="os-number cell-ellipsis">{{ item.idOs != null ? item.idOs : '?' }}</span>
              </td>
              <td class="col-acao">
                <p-tag
                  [value]="item.acaoDescricao"
                  [severity]="getSeverity(item.acao)"
                  [icon]="getIcon(item.acao)"
                  styleClass="tag-nowrap">
                </p-tag>
              </td>
              <td class="col-campo">
                <span
                  *ngIf="item.campoAlteradoLabel"
                  class="cell-ellipsis"
                  [pTooltip]="item.campoAlteradoLabel"
                  tooltipPosition="top">{{ item.campoAlteradoLabel }}</span>
                <span *ngIf="!item.campoAlteradoLabel" class="cell-empty" aria-hidden="true">—</span>
              </td>
              <td class="col-valor">
                <ng-container *ngIf="getValorDisplay(item, 'anterior') as vd; else emptyAnterior">
                  <div class="valor-cell-inner">
                    <span
                      class="valor-anterior cell-ellipsis"
                      [pTooltip]="vd.tooltip"
                      tooltipPosition="top">{{ truncateText(vd.label) }}</span>
                    <button
                      *ngIf="vd.showMetadataLink"
                      type="button"
                      class="metadata-link"
                      [attr.aria-label]="'os.auditoria.list.viewFileMetadata' | translate"
                      (click)="verDetalhes(item)">
                      {{ 'os.auditoria.list.viewFileMetadata' | translate }}
                    </button>
                  </div>
                </ng-container>
                <ng-template #emptyAnterior>
                  <span class="cell-empty" aria-hidden="true">—</span>
                </ng-template>
              </td>
              <td class="col-valor">
                <ng-container *ngIf="getValorDisplay(item, 'novo') as vd; else emptyNovo">
                  <div class="valor-cell-inner">
                    <span
                      class="valor-novo cell-ellipsis"
                      [pTooltip]="vd.tooltip"
                      tooltipPosition="top">{{ truncateText(vd.label) }}</span>
                    <button
                      *ngIf="vd.showMetadataLink"
                      type="button"
                      class="metadata-link"
                      [attr.aria-label]="'os.auditoria.list.viewFileMetadata' | translate"
                      (click)="verDetalhes(item)">
                      {{ 'os.auditoria.list.viewFileMetadata' | translate }}
                    </button>
                  </div>
                </ng-container>
                <ng-template #emptyNovo>
                  <span class="cell-empty" aria-hidden="true">—</span>
                </ng-template>
              </td>
              <td class="col-user">
                <div class="user-cell">
                  <i class="pi pi-user" aria-hidden="true"></i>
                  <span
                    class="cell-ellipsis"
                    [pTooltip]="item.usuarioNome || ('os.auditoria.list.userSystem' | translate)"
                    tooltipPosition="top">{{ item.usuarioNome || ('os.auditoria.list.userSystem' | translate) }}</span>
                </div>
              </td>
              <td class="col-data">
                <span class="cell-ellipsis">{{ formatDate(item.dataHora) }}</span>
              </td>
              <td class="col-detalhe">
                <button
                  pButton
                  type="button"
                  icon="pi pi-eye"
                  class="p-button-rounded p-button-text p-button-sm"
                  [pTooltip]="'estoque.invoices.list.tooltip.details' | translate"
                  (click)="verDetalhes(item)">
                </button>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="empty-message">
                <i class="pi pi-inbox"></i>
                <p>{{ 'os.auditoria.list.empty' | translate }}</p>
              </td>
            </tr>
          </ng-template>
        </p-table>
        </app-list-data-states>
      </p-card>

      <!-- Dialog de Detalhes -->
      <p-dialog 
        styleClass="as-hero-dialog" [(visible)]="showDetalhes"
        [header]="'os.auditoria.list.dialog.details' | translate"
        [modal]="true"
        [style]="{ width: '760px', 'max-width': '92vw' }">
        
        <div class="detalhes-content" *ngIf="auditoriaDetalhes">
          <div class="detalhe-row">
            <label>{{ 'os.auditoria.list.dialog.osId' | translate }}</label>
            <span>{{ auditoriaDetalhes.idOs != null ? auditoriaDetalhes.idOs : '?' }}</span>
          </div>
          <div class="detalhe-row">
            <label>{{ 'os.auditoria.list.dialog.action' | translate }}</label>
            <p-tag 
              [value]="auditoriaDetalhes.acaoDescricao" 
              [severity]="getSeverity(auditoriaDetalhes.acao)">
            </p-tag>
          </div>
          <div class="detalhe-row">
            <label>{{ 'os.auditoria.list.dialog.datetime' | translate }}</label>
            <span>{{ formatDateFull(auditoriaDetalhes.dataHora) }}</span>
          </div>
          <div class="detalhe-row">
            <label>{{ 'os.auditoria.list.dialog.user' | translate }}</label>
            <span>{{ auditoriaDetalhes.usuarioNome || ('os.auditoria.list.userSystem' | translate) }}</span>
          </div>
          <div class="detalhe-row" *ngIf="auditoriaDetalhes.usuarioEmail">
            <label>{{ 'os.auditoria.list.dialog.email' | translate }}</label>
            <span>{{ auditoriaDetalhes.usuarioEmail }}</span>
          </div>
          <div class="detalhe-row" *ngIf="auditoriaDetalhes.ipOrigem">
            <label>{{ 'os.auditoria.list.dialog.ip' | translate }}</label>
            <span>{{ auditoriaDetalhes.ipOrigem }}</span>
          </div>
          
          <div class="alteracao-section" *ngIf="auditoriaDetalhes.acao === 'ALTERACAO'">
            <h4>{{ 'os.auditoria.list.section.change' | translate }}</h4>
            <div class="detalhe-row">
              <label>{{ 'os.auditoria.list.dialog.field' | translate }}</label>
              <span>{{ auditoriaDetalhes.campoAlteradoLabel || auditoriaDetalhes.campoAlterado }}</span>
            </div>
            <div class="valores-comparacao">
              <div class="valor-box anterior">
                <label>{{ 'os.auditoria.list.dialog.before' | translate }}</label>
                <pre class="json-pre">{{ formatJsonDisplay(auditoriaDetalhes.valorAnterior) }}</pre>
              </div>
              <div class="valor-box novo">
                <label>{{ 'os.auditoria.list.dialog.after' | translate }}</label>
                <pre class="json-pre">{{ formatJsonDisplay(auditoriaDetalhes.valorNovo) }}</pre>
              </div>
            </div>
          </div>

          <div class="alteracao-section" *ngIf="auditoriaDetalhes.acao !== 'ALTERACAO' && (auditoriaDetalhes.valorAnterior || auditoriaDetalhes.valorNovo)">
            <h4>{{ tituloSecaoValores(auditoriaDetalhes) }}</h4>
            <div class="detalhe-row" *ngIf="auditoriaDetalhes.campoAlteradoLabel || auditoriaDetalhes.campoAlterado">
              <label>{{ 'os.auditoria.list.dialog.type' | translate }}</label>
              <span>{{ auditoriaDetalhes.campoAlteradoLabel || auditoriaDetalhes.campoAlterado }}</span>
            </div>
            <div class="valores-comparacao" [ngClass]="{ 'single-col': !auditoriaDetalhes.valorAnterior }">
              <div class="valor-box anterior" *ngIf="auditoriaDetalhes.valorAnterior">
                <label>{{ 'os.auditoria.list.dialog.prevValue' | translate }}</label>
                <pre class="json-pre">{{ formatJsonDisplay(auditoriaDetalhes.valorAnterior) }}</pre>
              </div>
              <div class="valor-box novo" *ngIf="auditoriaDetalhes.valorNovo">
                <label>{{ 'os.auditoria.list.dialog.newValue' | translate }}</label>
                <pre class="json-pre">{{ formatJsonDisplay(auditoriaDetalhes.valorNovo) }}</pre>
              </div>
            </div>
          </div>

          <div class="alteracao-section" *ngIf="auditoriaDetalhes.snapshotOs">
            <h4>{{ 'os.auditoria.list.section.snapshot' | translate }}</h4>
            <pre class="json-pre json-pre--wide">{{ formatJsonDisplay(auditoriaDetalhes.snapshotOs) }}</pre>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <button pButton [label]="'os.auditoria.list.dialog.close' | translate" icon="pi pi-times" (click)="showDetalhes = false"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .auditoria-page {
      padding: 1.25rem 1.5rem 1.5rem;
    }

    :host ::ng-deep .toolbar-card {
      margin-bottom: 1rem;
    }

    :host ::ng-deep .toolbar-card .p-card-body {
      padding: 1.1rem 1.25rem 1.15rem;
    }

    .toolbar-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      min-width: 0;
    }

    .title-section > i {
      font-size: 1.75rem;
      color: #0ea5e9;
      flex-shrink: 0;
    }

    .title-section h1 {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.25;
    }

    .title-section p {
      margin: 0.2rem 0 0;
      color: #64748b;
      font-size: 0.8125rem;
    }

    .toolbar-export {
      flex-shrink: 0;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: 7rem 1.35fr 10.5rem 10.5rem minmax(8rem, 1fr) auto;
      gap: 0.65rem 1rem;
      align-items: end;
    }

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      min-width: 0;
    }

    .filter-field label {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: #64748b;
      white-space: nowrap;
    }

    :host ::ng-deep .filter-field .p-inputnumber,
    :host ::ng-deep .filter-field .p-dropdown,
    :host ::ng-deep .filter-field .p-calendar,
    :host ::ng-deep .filter-field .p-inputtext {
      width: 100%;
    }

    :host ::ng-deep .filter-field .p-inputnumber-input {
      width: 100%;
    }

    .filter-field--user {
      padding-right: 0.35rem;
    }

    .filter-actions {
      display: flex;
      gap: 0.55rem;
      justify-content: flex-end;
      flex-wrap: nowrap;
      margin-left: 0.75rem;
      padding-left: 0.35rem;
    }

    :host ::ng-deep .filter-actions .p-button {
      white-space: nowrap;
    }

    @media (max-width: 1200px) {
      .filters-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .filter-actions {
        grid-column: 1 / -1;
        justify-content: flex-start;
      }
    }

    @media (max-width: 640px) {
      .filters-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    :host ::ng-deep .table-card .p-card-body {
      padding: 0;
    }

    :host ::ng-deep .auditoria-table .p-datatable-table {
      table-layout: fixed;
      width: 100%;
    }

    :host ::ng-deep .auditoria-table .p-datatable-thead > tr > th,
    :host ::ng-deep .auditoria-table .p-datatable-tbody > tr > td {
      padding: 0.5rem 0.65rem;
      vertical-align: middle;
      overflow: hidden;
    }

    :host ::ng-deep .auditoria-table .p-datatable-tbody > tr {
      height: 2.75rem;
    }

    :host ::ng-deep .auditoria-table .col-os { width: 5.5%; }
    :host ::ng-deep .auditoria-table .col-acao { width: 12%; }
    :host ::ng-deep .auditoria-table .col-campo { width: 14%; }
    :host ::ng-deep .auditoria-table .col-valor { width: 18%; }
    :host ::ng-deep .auditoria-table .col-user { width: 14%; }
    :host ::ng-deep .auditoria-table .col-data { width: 11%; }
    :host ::ng-deep .auditoria-table .col-detalhe { width: 4.5%; text-align: center; }

    .cell-ellipsis {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    :host ::ng-deep .tag-nowrap .p-tag {
      max-width: 100%;
      white-space: nowrap;
    }

    :host ::ng-deep .tag-nowrap .p-tag-value {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .os-number {
      font-weight: 600;
      color: #0ea5e9;
    }

    .valor-anterior {
      color: #dc2626;
      font-family: ui-monospace, monospace;
      font-size: 0.78rem;
    }

    .valor-novo {
      color: #16a34a;
      font-family: ui-monospace, monospace;
      font-size: 0.78rem;
    }

    .valor-cell-inner {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.12rem;
      min-width: 0;
      max-width: 100%;
    }

    .valor-cell-inner .cell-ellipsis {
      max-width: 100%;
    }

    .metadata-link {
      appearance: none;
      border: none;
      background: none;
      padding: 0;
      margin: 0;
      font: inherit;
      font-size: 0.7rem;
      font-weight: 500;
      color: #64748b;
      text-decoration: underline;
      text-underline-offset: 2px;
      cursor: pointer;
      white-space: nowrap;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .metadata-link:hover,
    .metadata-link:focus-visible {
      color: #0369a1;
    }

    .cell-empty {
      display: block;
      text-align: center;
      color: #e2e8f0;
      font-weight: 300;
      font-size: 0.85rem;
      line-height: 1;
      user-select: none;
    }

    .text-muted {
      color: #94a3b8;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      min-width: 0;
    }

    .user-cell i {
      color: #94a3b8;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .user-cell .cell-ellipsis {
      flex: 1;
      min-width: 0;
    }

    .empty-message {
      text-align: center;
      padding: 3rem !important;
    }

    .empty-message i {
      font-size: 3rem;
      color: #cbd5e1;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-message p {
      color: #64748b;
      margin: 0;
    }

    .detalhes-content .detalhe-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .detalhes-content .detalhe-row label {
      font-weight: 500;
      color: #475569;
      min-width: 100px;
    }

    .detalhes-content .alteracao-section {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .detalhes-content .alteracao-section h4 {
      margin: 0 0 1rem;
      color: #334155;
    }

    .detalhes-content .valores-comparacao {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-top: 0.75rem;
    }

    .detalhes-content .valor-box {
      padding: 0.75rem;
      border-radius: 8px;
    }

    .detalhes-content .valor-box label {
      display: block;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .detalhes-content .valor-box pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 0.875rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .detalhes-content .valor-box.anterior {
      background: #fef2f2;
    }

    .detalhes-content .valor-box.anterior label {
      color: #991b1b;
    }

    .detalhes-content .valor-box.anterior pre {
      color: #dc2626;
    }

    .detalhes-content .valor-box.novo {
      background: #f0fdf4;
    }

    .detalhes-content .valor-box.novo label {
      color: #166534;
    }

    .detalhes-content .valor-box.novo pre {
      color: #16a34a;
    }

    .detalhes-content .json-pre {
      max-height: 22rem;
      overflow: auto;
      font-size: 0.8125rem !important;
      line-height: 1.45;
    }

    .detalhes-content .json-pre--wide {
      max-height: 24rem;
    }

    .detalhes-content .valores-comparacao.single-col {
      grid-template-columns: 1fr;
    }
  `]
})
export class OSAuditoriaListComponent {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  @ViewChild('dt') table!: Table;
  
  auditorias: OSAuditoria[] = [];
  loading = true;
  totalRecords = 0;
  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  
  filtros: FiltroAuditoria = {};

  private readonly requestGuard = createStaleRequestGuard();

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }
  
  
  get acoesOptions() {
    return [
      { label: this.i18n.translate('os.auditoria.action.criacao'), value: 'CRIACAO' },
      { label: this.i18n.translate('os.auditoria.action.alteracao'), value: 'ALTERACAO' },
      { label: this.i18n.translate('os.auditoria.action.exclusao'), value: 'EXCLUSAO' },
      { label: this.i18n.translate('os.auditoria.action.restauracao'), value: 'RESTAURACAO' },
      { label: this.i18n.translate('os.auditoria.action.reabertura'), value: 'REABERTURA' },
      { label: this.i18n.translate('os.auditoria.action.upload'), value: 'UPLOAD_ARQUIVO' },
      { label: this.i18n.translate('os.auditoria.action.associacao'), value: 'ASSOCIACAO_ARQUIVO' },
      { label: this.i18n.translate('os.auditoria.action.exclusaoArquivo'), value: 'EXCLUSAO_ARQUIVO' }
    ];
  }
  
  showDetalhes = false;
  auditoriaDetalhes: OSAuditoria | null = null;

  private auditoriaService = inject(OSAuditoriaService);
  private dossieService = inject(DossieAuditoriaService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);
  exportandoDossie = false;

  onLazyLoad(event?: LazyLoadEvent): void {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    this.buscarDados(this.pageIndex, this.size);
  }

  onFiltroChange() {
    // Não faz mais busca automática - apenas quando clicar em "Buscar"
    // Mantido para compatibilidade com o template
  }

  buscar(): void {
    this.pageIndex = 0;
    this.onLazyLoad({ first: 0, rows: this.size });
  }

  buscarDados(page: number, size: number): void {
    const seq = this.requestGuard.bump();
    this.loading = true;

    const params: Record<string, string | number> = {
      page,
      size
    };

    const refOs = this.filtros.identificadorOs;
    if (refOs != null && !Number.isNaN(Number(refOs)) && Number(refOs) > 0) {
      params['refOs'] = refOs;
    }
    if (this.filtros.acao) {
      params.acao = this.filtros.acao;
    }
    if (this.filtros.dataInicio) {
      params.dataInicio = this.formatDateForApi(this.filtros.dataInicio);
    }
    if (this.filtros.dataFim) {
      params.dataFim = this.formatDateForApi(this.filtros.dataFim, true);
    }
    if (this.filtros.usuario) {
      params.usuario = this.filtros.usuario;
    }
    
    this.auditoriaService.buscarComFiltros(params).subscribe({
      next: response => {
        if (this.requestGuard.isStale(seq)) return;
        this.auditorias = response?.items ?? [];
        this.totalRecords = response?.totalElements ?? 0;
        this.loading = false;
      },
      error: err => {
        if (this.requestGuard.isStale(seq)) return;
        console.error('Failed to fetch audit log:', err);
        this.auditorias = [];
        this.totalRecords = 0;
        this.loading = false;
        this.toast.add({
          severity: 'error',
          summary: this.i18n.translate('os.auditoria.list.loadFailed')
        });
      }
    });
  }

  limparFiltros(): void {
    this.filtros = {};
    this.pageIndex = 0;
    this.onLazyLoad({ first: 0, rows: this.size });
  }

  verDetalhes(item: OSAuditoria) {
    this.auditoriaDetalhes = item;
    this.showDetalhes = true;
  }

  getSeverity(acao: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (acao) {
      case 'CRIACAO': return 'success';
      case 'REABERTURA': return 'warn';
      case 'ALTERACAO': return 'info';
      case 'EXCLUSAO': return 'danger';
      case 'RESTAURACAO': return 'warn';
      case 'UPLOAD_ARQUIVO': return 'success';
      case 'ASSOCIACAO_ARQUIVO': return 'info';
      case 'EXCLUSAO_ARQUIVO': return 'warn';
      default: return 'secondary';
    }
  }

  getIcon(acao: string): string {
    switch (acao) {
      case 'CRIACAO': return 'pi pi-plus-circle';
      case 'ALTERACAO': return 'pi pi-pencil';
      case 'EXCLUSAO': return 'pi pi-trash';
      case 'RESTAURACAO': return 'pi pi-refresh';
      case 'UPLOAD_ARQUIVO': return 'pi pi-upload';
      case 'ASSOCIACAO_ARQUIVO': return 'pi pi-link';
      case 'EXCLUSAO_ARQUIVO': return 'pi pi-times-circle';
      default: return 'pi pi-info-circle';
    }
  }

  formatDate(dateStr: string): string {
    return formatUiDateTime(this.i18n.getCurrentLanguage(), dateStr, 'dateTime');
  }

  formatDateFull(dateStr: string): string {
    return formatUiDateTime(this.i18n.getCurrentLanguage(), dateStr, 'dateTimeFull');
  }

  formatDateForApi(date: Date, endOfDay = false): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = endOfDay ? '23:59:59' : '00:00:00';
    return `${year}-${month}-${day}T${time}`;
  }

  truncateText(text: string, maxLength = 36): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  getValorDisplay(item: OSAuditoria, which: 'anterior' | 'novo'): ValorDisplay | null {
    const raw = which === 'anterior' ? item.valorAnterior : item.valorNovo;
    if (!raw?.trim()) {
      return null;
    }

    const friendly = this.tryFriendlyLabel(raw);
    if (friendly) {
      return {
        label: friendly.label,
        tooltip: friendly.tooltip,
        showMetadataLink: friendly.showMetadataLink
      };
    }

    if (this.looksLikeJson(raw)) {
      return {
        label: this.i18n.translate('os.auditoria.list.technicalPayload'),
        tooltip: raw,
        showMetadataLink: true
      };
    }

    return {
      label: raw,
      tooltip: raw,
      showMetadataLink: false
    };
  }

  private looksLikeJson(text: string): boolean {
    const trimmed = text.trim();
    return (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    );
  }

  private tryFriendlyLabel(raw: string): FriendlyLabel | null {
    if (!this.looksLikeJson(raw)) {
      return null;
    }
    try {
      const obj = JSON.parse(raw.trim()) as Record<string, unknown>;
      if (!obj || typeof obj !== 'object') {
        return null;
      }

      const fileName = this.pickFirstString(obj, [
        'originalName',
        'fileName',
        'multipartOriginalFileName',
        'name'
      ]);
      if (fileName) {
        const size = this.pickFileSizeLabel(obj);
        return {
          label: fileName,
          tooltip: size ? `${fileName} (${size})` : fileName,
          showMetadataLink: true
        };
      }

      const justificativa = this.pickFirstString(obj, ['justificativa']);
      if (justificativa) {
        return {
          label: justificativa,
          tooltip: justificativa,
          showMetadataLink: false
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private pickFirstString(obj: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  private pickFileSizeLabel(obj: Record<string, unknown>): string | null {
    const bytes =
      typeof obj.fileSizeBytes === 'number'
        ? obj.fileSizeBytes
        : typeof obj.multipartPartSizeBytesRecebido === 'number'
          ? obj.multipartPartSizeBytesRecebido
          : typeof obj.size === 'number'
            ? obj.size
            : null;
    if (bytes == null || bytes < 0) {
      return null;
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Se o texto for JSON válido, devolve indentado; senão devolve o texto original.
   */
  formatJsonDisplay(text: string | null | undefined): string {
    if (text == null || text === '') {
      return this.i18n.translate('os.auditoria.list.jsonEmpty');
    }
    const trimmed = text.trim();
    const looksJson =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (looksJson) {
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        return text;
      }
    }
    return text;
  }

  tituloSecaoValores(item: OSAuditoria): string {
    switch (item.acao) {
      case 'UPLOAD_ARQUIVO':
        return this.i18n.translate('os.auditoria.section.upload');
      case 'ASSOCIACAO_ARQUIVO':
        return this.i18n.translate('os.auditoria.section.associacao');
      case 'EXCLUSAO_ARQUIVO':
        return this.i18n.translate('os.auditoria.section.exclusaoArquivo');
      default:
        return this.i18n.translate('os.auditoria.section.valores');
    }
  }

  exportarDossie(): void {
    const n = this.filtros.identificadorOs;
    if (n == null) {
      return;
    }
    this.exportandoDossie = true;
    this.dossieService.downloadPdfByNumero(n).subscribe({
      next: blob => {
        this.dossieService.triggerDownload(blob, n);
        this.exportandoDossie = false;
      },
      error: () => {
        this.exportandoDossie = false;
      }
    });
  }
}
