import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../core/lazy-list-pagination.helper';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PropostaComercialService, PropostaComercial, PropostaDisponibilizarPortalResult } from '../core/proposta-comercial.service';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../core/translate.pipe';
import { LocaleMoneyPipe } from '../core/locale/locale-money.pipe';
import { LocaleDateTimePipe } from '../core/locale/locale-datetime.pipe';
import { IsoLocalDatePipe } from '../core/locale/iso-local-date.pipe';
import { LocaleCurrencyService } from '../core/locale/locale-currency.service';
import { coerceMoneyCurrency, MoneyCurrency } from '../core/locale/locale-region.config';
import { PageHelpComponent } from '../shared/page-help/page-help.component';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { PropostaPortalDialogComponent } from './proposta-portal-dialog.component';
import { propostaPodeAcaoPortal, propostaTemEmailCliente } from './proposta-portal.util';

@Component({
  standalone: true,
  selector: 'app-proposta-comercial-list',
  imports: [
    ListTableScrollDirective,
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    DropdownModule,
    PageHelpComponent,
    PageHeroComponent,
    ListDataStatesComponent,
    PropostaPortalDialogComponent,
    TranslatePipe,
    LocaleMoneyPipe,
    LocaleDateTimePipe,
    IsoLocalDatePipe
  ],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    
    <div class="as-page propostas-container">
      <app-page-hero
        variant="slate"
        titleKey="comercial.list.propostas.title"
        subtitleKey="comercial.list.propostas.subtitle"
        titleIcon="pi-file-edit"
        [hasActions]="true">
        <div actions class="header-actions">
          <app-page-help></app-page-help>
          <button
            pButton
            [label]="'comercial.list.propostas.btnNew' | translate"
            icon="pi pi-plus"
            routerLink="/propostas-comerciais/new">
          </button>
        </div>
      </app-page-hero>

      <!-- Filtros -->
      <div class="filter-bar">
        <span class="p-input-icon-left search-wrapper">
          <i class="pi pi-search"></i>
          <input type="text" pInputText [(ngModel)]="searchTerm" 
                 [placeholder]="'comercial.list.propostas.searchPlaceholder' | translate"
                (input)="onSearchInput()" class="search-input">
        </span>
        <p-dropdown [(ngModel)]="statusFilter" [options]="statusOptions"
                    [placeholder]="'comercial.list.propostas.filterStatusPlaceholder' | translate" [showClear]="true"
                    (onChange)="onSearch()" class="status-filter">
        </p-dropdown>
      </div>
      <p class="list-money-sources" *ngIf="listMoneySourcesLine">{{ listMoneySourcesLine }}</p>

      <!-- Tabela -->
      <div class="table-container">
        <app-list-data-states
          [loading]="loading"
          [itemCount]="totalRecords"
          [skeletonRows]="8"
          [skeletonCols]="8"
          [mountContentWhileLoading]="true"
          emptyTitleKey="comercial.list.propostas.empty"
          emptyDescriptionKey="ui.empty.description">
          <button
            emptyAction
            pButton
            [label]="'comercial.list.propostas.emptyBtn' | translate"
            icon="pi pi-plus"
            class="p-button-outlined"
            routerLink="/propostas-comerciais/new"></button>
          <p-table appListScroll
            [first]="tableFirst"
            [value]="propostas"
            [loading]="loading"
            [paginator]="true"
            [rows]="size"
            [rowsPerPageOptions]="listRowsPerPageOptions"
            [showCurrentPageReport]="true"
            [currentPageReportTemplate]="propostasPageReport"
            styleClass="p-datatable-striped propostas-table"
            responsiveLayout="stack"
            breakpoint="768px"
            [totalRecords]="totalRecords"
            [lazy]="true"
            dataKey="id"
            (onLazyLoad)="loadPropostas($event)">
          <ng-template pTemplate="header">
            <tr>
              <th class="col-numero">{{ 'comercial.list.propostas.col.number' | translate }}</th>
              <th class="col-cliente">{{ 'comercial.list.propostas.col.client' | translate }}</th>
              <th class="col-produto">{{ 'comercial.list.propostas.col.product' | translate }}</th>
              <th class="col-valor">{{ 'comercial.list.propostas.col.value' | translate }}</th>
              <th class="col-data">{{ 'comercial.list.propostas.col.date' | translate }}</th>
              <th class="col-status">{{ 'comercial.list.propostas.col.status' | translate }}</th>
              <th class="col-os">{{ 'comercial.list.propostas.col.os' | translate }}</th>
              <th class="col-actions">{{ 'comercial.list.propostas.col.actions' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-proposta>
            <tr [class.row-hover-preview]="proposta.id === hoveredPropostaId"
                (mouseenter)="onRowMouseEnter(proposta)"
                (mouseleave)="onRowMouseLeave()">
              <td class="col-numero" [attr.data-label]="'comercial.list.propostas.col.number' | translate">
                <span class="p-column-title">{{ 'comercial.list.propostas.col.number' | translate }}</span>
                <span class="numero-badge">{{ proposta.numeroProposta }}</span>
              </td>
              <td class="col-cliente" [attr.data-label]="'comercial.list.propostas.col.client' | translate">
                <span class="p-column-title">{{ 'comercial.list.propostas.col.client' | translate }}</span>
                <div class="cliente-cell"
                     [pTooltip]="proposta.clienteEmail || undefined"
                     tooltipPosition="top">
                  <strong class="cell-primary">{{ proposta.clienteNome || '—' }}</strong>
                  <small class="cell-secondary" *ngIf="proposta.clienteEmail">{{ proposta.clienteEmail }}</small>
                </div>
              </td>
              <td class="col-produto" [attr.data-label]="'comercial.list.propostas.col.product' | translate">
                <span class="p-column-title">{{ 'comercial.list.propostas.col.product' | translate }}</span>
                <div class="produto-cell"
                     [pTooltip]="proposta.produtoPn ? (('comercial.list.propostas.preview.pn' | translate) + ' ' + proposta.produtoPn) : undefined"
                     tooltipPosition="top">
                  <strong class="cell-primary">{{ proposta.produtoNome || '—' }}</strong>
                  <small class="cell-secondary" *ngIf="proposta.produtoPn">{{ 'comercial.list.propostas.preview.pn' | translate }} {{ proposta.produtoPn }}</small>
                </div>
              </td>
              <td class="col-valor" [attr.data-label]="'comercial.list.propostas.col.value' | translate">
                <span class="p-column-title">{{ 'comercial.list.propostas.col.value' | translate }}</span>
                <span class="valor-amount">{{ propostaValor(proposta) | localeMoney:propostaMoeda(proposta) }}</span>
              </td>
              <td class="col-data" [attr.data-label]="'comercial.list.propostas.col.date' | translate">
                <span class="p-column-title">{{ 'comercial.list.propostas.col.date' | translate }}</span>
                <span class="data-text">{{ proposta.dataProposta ? (proposta.dataProposta | isoLocalDate) : '—' }}</span>
              </td>
              <td class="col-status" [attr.data-label]="'comercial.list.propostas.col.status' | translate">
                <span class="p-column-title">{{ 'comercial.list.propostas.col.status' | translate }}</span>
                <p-tag [value]="getStatusLabel(proposta.status)"
                       [severity]="getStatusSeverity(proposta.status)">
                </p-tag>
              </td>
              <td class="col-os" [attr.data-label]="'comercial.list.propostas.col.os' | translate">
                <span class="p-column-title">{{ 'comercial.list.propostas.col.os' | translate }}</span>
                <a *ngIf="proposta.osId" class="os-link" [routerLink]="['/os']"
                   [queryParams]="{ editId: proposta.osId }"
                   [pTooltip]="'comercial.proposta.gerarOs.badgeTip' | translate">
                  {{ 'comercial.list.propostas.osLink' | translate:{ id: proposta.osId + '' } }}
                </a>
                <span *ngIf="!proposta.osId" class="os-empty">—</span>
              </td>
              <td class="col-actions" [attr.data-label]="'comercial.list.propostas.col.actions' | translate">
                <span class="p-column-title">{{ 'comercial.list.propostas.col.actions' | translate }}</span>
                <div class="action-buttons">
                  <button pButton icon="pi pi-eye" 
                          class="p-button-text p-button-rounded p-button-sm"
                          [pTooltip]="'comercial.list.propostas.tooltipView' | translate"
                          [routerLink]="['/propostas-comerciais', proposta.id]">
                  </button>
                  <button pButton icon="pi pi-pencil" 
                          class="p-button-text p-button-rounded p-button-sm p-button-info"
                          [pTooltip]="'comercial.list.propostas.tooltipEdit' | translate"
                          [routerLink]="['/propostas-comerciais', proposta.id]">
                  </button>
                  <button pButton icon="pi pi-copy" 
                          class="p-button-text p-button-rounded p-button-sm p-button-secondary"
                          [pTooltip]="'comercial.list.propostas.tooltipDuplicate' | translate"
                          (click)="duplicar(proposta)">
                  </button>
                  <button pButton icon="pi pi-print" 
                          class="p-button-text p-button-rounded p-button-sm p-button-help"
                          [pTooltip]="'comercial.list.propostas.tooltipPrint' | translate"
                          (click)="imprimir(proposta)">
                  </button>
                  <button *ngIf="podeAcaoPortalLista(proposta)" pButton icon="pi pi-globe"
                          class="p-button-text p-button-rounded p-button-sm p-button-info"
                          [pTooltip]="'comercial.list.propostas.tooltipPortal' | translate"
                          (click)="abrirPortalLista(proposta)">
                  </button>
                  <button pButton icon="pi pi-trash" 
                          class="p-button-text p-button-rounded p-button-sm p-button-danger"
                          [pTooltip]="'comercial.list.propostas.tooltipDelete' | translate"
                          (click)="confirmarExclusao(proposta)">
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
        </app-list-data-states>
      </div>

      <!-- Preview ao passar o mouse -->
      <div class="preview-overlay" *ngIf="previewProposta || previewLoading">
        <div class="preview-panel"
             (mouseenter)="onPreviewMouseEnter()"
             (mouseleave)="onPreviewMouseLeave()">
          <div class="preview-header">
            <i class="pi pi-file-edit"></i>
            <span>{{ 'comercial.list.propostas.previewPrefix' | translate }} {{ previewProposta?.numeroProposta || '...' }}</span>
          </div>
          <div class="preview-body" *ngIf="previewLoading">
            <div class="preview-loading"><i class="pi pi-spin pi-spinner"></i> {{ 'comercial.list.propostas.loading' | translate }}</div>
          </div>
          <div class="preview-body" *ngIf="previewProposta && !previewLoading">
            <div class="preview-section">
              <strong>{{ 'comercial.list.propostas.preview.client' | translate }}</strong>
              <p>{{ previewProposta.clienteNome || '-' }}</p>
              <small *ngIf="previewProposta.clienteEmail">{{ previewProposta.clienteEmail }}</small>
            </div>
            <div class="preview-section">
              <strong>{{ 'comercial.list.propostas.preview.product' | translate }}</strong>
              <p>{{ previewProposta.produtoNome || '-' }}</p>
              <small *ngIf="previewProposta.produtoPn">{{ 'comercial.list.propostas.preview.pn' | translate }} {{ previewProposta.produtoPn }}</small>
            </div>
            <div class="preview-section preview-section--items" *ngIf="previewProposta.itens?.length || previewItensLoading">
              <strong>{{ 'comercial.list.propostas.preview.items' | translate }}</strong>
              <div class="preview-loading preview-loading--inline" *ngIf="previewItensLoading && !previewProposta.itens?.length">
                <i class="pi pi-spin pi-spinner"></i> {{ 'comercial.list.propostas.loading' | translate }}
              </div>
              <div class="preview-itens">
                <div class="preview-item-row" *ngFor="let item of previewProposta.itens; let i = index">
                  <span class="preview-item-num">{{ i + 1 }}</span>
                  <div class="preview-item-main">
                    <span class="preview-item-desc">{{ item.produtoNome }}</span>
                    <div class="preview-item-meta">
                      <span class="preview-item-qtd">{{ 'comercial.list.propostas.preview.itemQty' | translate }} {{ item.quantidade }}</span>
                      <span class="preview-item-valor">{{ item.valorTotal | localeMoney:propostaMoeda(previewProposta) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="preview-section preview-totais">
              <strong>{{ 'comercial.list.propostas.preview.totalUsd' | translate }}</strong>
              <p class="preview-total-value">{{ propostaValor(previewProposta) | localeMoney:propostaMoeda(previewProposta) }}</p>
              <small class="preview-footnote" *ngIf="listMoneySourcesLine">{{ listMoneySourcesLine }}</small>
            </div>
            <div class="preview-section preview-meta">
              <span>{{ 'comercial.list.propostas.preview.date' | translate }} {{ previewProposta.dataProposta ? (previewProposta.dataProposta | isoLocalDate) : '-' }}</span>
              <p-tag [value]="getStatusLabel(previewProposta.status)" [severity]="getStatusSeverity(previewProposta.status)" styleClass="preview-tag"></p-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-proposta-portal-dialog
      [(visible)]="showPortalDialog"
      [propostaId]="portalProposta?.id ?? null"
      [clienteEmail]="portalProposta?.clienteEmail ?? ''"
      [nomeContatoDefault]="portalProposta?.clienteContato || portalProposta?.clienteNome || ''"
      (published)="onPortalPublicadoLista($event)">
    </app-proposta-portal-dialog>
  `,
  styles: [`
    .propostas-container {
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      background: white;
      border-radius: 12px;
      padding: 20px 24px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .header-left {
      h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 24px;
        font-weight: 700;
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .filter-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .list-money-sources {
      margin: 0 0 16px;
      padding: 10px 12px;
      font-size: 12px;
      line-height: 1.4;
      color: #64748b;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
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

    .status-filter {
      width: 200px;
    }

    .table-container {
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .numero-badge {
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #0ea5e9;
      white-space: nowrap;
    }

    .data-text,
    .os-empty {
      white-space: nowrap;
    }

    .cliente-cell,
    .produto-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      max-width: 100%;
    }

    .cell-primary {
      font-size: 13px;
      color: #0f172a;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
      max-width: 100%;
    }

    .cell-secondary {
      font-size: 11px;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
      max-width: 100%;
    }

    .valor-cell {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 3px;
      min-width: 0;
    }

    .valor-amount {
      font-weight: 600;
      color: #059669;
      font-size: 13px;
      line-height: 1.2;
      white-space: nowrap;
    }

    .valor-footnote {
      font-size: 0.65rem;
      line-height: 1.28;
      color: #64748b;
      font-weight: 400;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    }

    .action-buttons {
      display: flex;
      gap: 2px;
      flex-wrap: nowrap;
      justify-content: flex-end;
    }

    .empty-message {
      text-align: center;
      padding: 48px 24px !important;
      color: #64748b;

      i {
        font-size: 48px;
        margin-bottom: 16px;
        display: block;
      }

      p {
        margin: 0 0 16px;
        font-size: 16px;
      }
    }

    .preview-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(15, 23, 42, 0.35);
      pointer-events: none;
      animation: previewFadeIn 0.2s ease-out;
    }

    .preview-overlay .preview-panel {
      pointer-events: auto;
      width: 100%;
      max-width: 480px;
      max-height: min(85vh, 640px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
      border: 1px solid #e2e8f0;
      animation: previewScaleIn 0.2s ease-out;
    }

    @keyframes previewFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes previewScaleIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    .preview-panel .preview-header {
      flex-shrink: 0;
      padding: 14px 18px;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: white;
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .preview-panel .preview-body {
      flex: 1;
      min-height: 0;
      padding: 16px 18px;
      overflow-y: auto;
    }

    .preview-loading {
      text-align: center;
      padding: 24px;
      color: #64748b;
    }

    .preview-loading i {
      font-size: 24px;
      margin-right: 8px;
    }

    .preview-loading--inline {
      text-align: left;
      padding: 8px 0 0;
    }

    .preview-loading--inline i {
      font-size: 1rem;
    }

    .preview-section {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }

    .preview-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .preview-section strong {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 8px;
    }

    .preview-section p,
    .preview-section small {
      margin: 0;
      font-size: 13px;
      color: #0f172a;
      line-height: 1.45;
    }

    .preview-section small {
      color: #64748b;
      display: block;
      margin-top: 4px;
    }

    .preview-section--items {
      min-height: 0;
    }

    .preview-itens {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .preview-item-row {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr);
      gap: 10px;
      align-items: start;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .preview-item-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .preview-item-num {
      color: #64748b;
      font-weight: 600;
      font-size: 12px;
      line-height: 1.45;
      padding-top: 1px;
    }

    .preview-item-main {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }

    .preview-item-desc {
      color: #0f172a;
      font-size: 13px;
      line-height: 1.45;
      word-break: break-word;
    }

    .preview-item-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 12px;
    }

    .preview-item-qtd {
      color: #64748b;
      white-space: nowrap;
    }

    .preview-item-valor {
      font-weight: 600;
      color: #059669;
      white-space: nowrap;
    }

    .preview-totais .preview-total-value {
      font-size: 18px;
      font-weight: 700;
      color: #059669;
      margin: 0;
    }

    .preview-footnote {
      display: block;
      margin-top: 8px;
      font-size: 11px;
      line-height: 1.4;
      color: #64748b;
    }

    .preview-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }

    .preview-meta .preview-tag {
      font-size: 11px;
    }

    :host ::ng-deep {
      .propostas-table table {
        table-layout: fixed;
        width: 100%;
      }

      .propostas-table .col-numero {
        width: 11%;
        min-width: 148px;
      }

      .propostas-table .col-cliente {
        width: 18%;
        min-width: 140px;
      }

      .propostas-table .col-produto {
        width: 16%;
        min-width: 128px;
      }

      .propostas-table .col-valor {
        width: 22%;
        min-width: 200px;
      }

      .propostas-table .col-data {
        width: 9%;
        min-width: 96px;
      }

      .propostas-table .col-status {
        width: 10%;
        min-width: 108px;
      }

      .propostas-table .col-os {
        width: 7%;
        min-width: 72px;
      }

      .propostas-table .col-actions {
        width: 7%;
        min-width: 192px;
        max-width: 204px;
      }

      .propostas-table .p-datatable-thead > tr > th {
        white-space: nowrap;
      }

      .propostas-table .p-datatable {
        .p-datatable-thead > tr > th {
          background: #f8fafc;
          color: #334155;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.02em;
          padding: 16px;
          border-bottom: 2px solid #e2e8f0;
        }

        .p-datatable-tbody > tr > td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .p-datatable-tbody > tr:hover {
          background: #f8fafc;
        }

        .p-datatable-tbody > tr.row-hover-preview {
          background: #e0f2fe !important;
          outline: 1px solid #0ea5e9;
          outline-offset: -1px;
          z-index: 1;
          position: relative;
        }
      }

      .p-dropdown {
        height: 44px;

        .p-dropdown-label {
          display: flex;
          align-items: center;
        }
      }

      /* Desktop: títulos de coluna só no stack (mobile) */
      .propostas-table .p-column-title {
        display: none;
      }

      .propostas-table.p-datatable-responsive-stack .p-column-title {
        display: block;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #64748b;
        margin-bottom: 4px;
      }

      .propostas-table.p-datatable-responsive-stack .p-datatable-thead {
        display: none;
      }

      .propostas-table.p-datatable-responsive-stack .p-datatable-tbody > tr {
        display: block;
        margin: 0 0 12px;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        background: #fff;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
        overflow: hidden;
      }

      .propostas-table.p-datatable-responsive-stack .p-datatable-tbody > tr > td {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        padding: 10px 14px !important;
        border: none !important;
        border-bottom: 1px solid #f1f5f9 !important;
        text-align: left !important;
        white-space: normal !important;
      }

      .propostas-table.p-datatable-responsive-stack .p-datatable-tbody > tr > td:last-child {
        border-bottom: none !important;
      }

      .propostas-table.p-datatable-responsive-stack .col-actions .action-buttons {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 6px;
        justify-content: stretch;
        width: 100%;
      }

      .propostas-table.p-datatable-responsive-stack .col-actions .p-button {
        width: 100%;
        min-height: 2.5rem;
        margin: 0;
      }

      .propostas-table.p-datatable-responsive-stack .cliente-cell,
      .propostas-table.p-datatable-responsive-stack .produto-cell {
        max-width: 100%;
      }

      .propostas-table.p-datatable-responsive-stack .cell-primary,
      .propostas-table.p-datatable-responsive-stack .cell-secondary {
        white-space: normal;
        word-break: break-word;
      }

      .propostas-table.p-datatable-responsive-stack .p-paginator {
        border-top: 1px solid #e2e8f0;
        flex-wrap: wrap;
        gap: 0.35rem;
        padding: 0.75rem !important;
      }
    }

    @media (max-width: 767px) {
      .propostas-container {
        padding: 0.75rem;
      }

      .filter-bar {
        flex-direction: column;
        gap: 0.65rem;
      }

      .search-wrapper {
        min-width: 0;
        width: 100%;
      }

      .search-wrapper .search-input {
        font-size: 16px;
      }

      .status-filter {
        width: 100%;
      }

      .table-container {
        overflow-x: auto;
        overflow-y: visible;
        -webkit-overflow-scrolling: touch;
        border-radius: 12px;
      }

      :host ::ng-deep .propostas-table table {
        table-layout: auto;
      }

      :host ::ng-deep .propostas-table .col-numero,
      :host ::ng-deep .propostas-table .col-cliente,
      :host ::ng-deep .propostas-table .col-produto,
      :host ::ng-deep .propostas-table .col-valor,
      :host ::ng-deep .propostas-table .col-data,
      :host ::ng-deep .propostas-table .col-status,
      :host ::ng-deep .propostas-table .col-os,
      :host ::ng-deep .propostas-table .col-actions {
        width: auto !important;
        min-width: 0 !important;
        max-width: none !important;
      }
    }

    @media (hover: none) {
      .preview-overlay {
        display: none !important;
      }
    }
  `]
})
export class PropostaComercialListComponent implements OnInit, OnDestroy {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private propostaService = inject(PropostaComercialService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private router = inject(Router);
  private localeCurrency = inject(LocaleCurrencyService);
  private readonly requestGuard = createStaleRequestGuard();

  propostas: PropostaComercial[] = [];
  loading = true;
  totalRecords = 0;
  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  searchTerm = '';
  statusFilter: string | null = null;
  showPortalDialog = false;
  portalProposta: PropostaComercial | null = null;

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  /** Preview ao passar o mouse na linha */
  hoveredPropostaId: number | null = null;
  previewProposta: PropostaComercial | null = null;
  previewLoading = false;
  previewItensLoading = false;
  private showPreviewTimeout: ReturnType<typeof setTimeout> | null = null;
  private itensFetchTimeout: ReturnType<typeof setTimeout> | null = null;
  private hidePreviewTimeout: ReturnType<typeof setTimeout> | null = null;
  private previewPanelHovered = false;
  private searchSubject = new Subject<string>();

  get propostasPageReport(): string {
    return this.i18n.translate('comercial.list.propostas.pageReport');
  }

  get statusOptions(): { label: string; value: string }[] {
    return [
      { label: this.i18n.translate('comercial.proposta.status.RASCUNHO'), value: 'RASCUNHO' },
      { label: this.i18n.translate('comercial.proposta.status.ENVIADA'), value: 'ENVIADA' },
      { label: this.i18n.translate('comercial.proposta.status.APROVADA'), value: 'APROVADA' },
      { label: this.i18n.translate('comercial.proposta.status.REJEITADA'), value: 'REJEITADA' },
      { label: this.i18n.translate('comercial.proposta.status.CANCELADA'), value: 'CANCELADA' }
    ];
  }

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageIndex = 0;
      this.loadPropostas({ first: 0, rows: this.size });
    });
  }

  ngOnDestroy() {
    this.searchSubject.complete();
    this.clearPreviewTimers();
    if (this.hidePreviewTimeout) clearTimeout(this.hidePreviewTimeout);
  }

  onSearchInput() {
    this.searchSubject.next(this.searchTerm);
  }

  propostaMoeda(proposta: PropostaComercial): MoneyCurrency {
    return coerceMoneyCurrency(proposta.moedaProposta);
  }

  propostaValor(proposta: PropostaComercial): number {
    const moeda = this.propostaMoeda(proposta);
    if (moeda === 'BRL' && proposta.totalGeralBrl != null) {
      return proposta.totalGeralBrl;
    }
    if (moeda === 'EUR' && proposta.totalGeralEur != null) {
      return proposta.totalGeralEur;
    }
    return proposta.totalGeralUsd ?? proposta.valorTotalFinal ?? proposta.produtoValor ?? 0;
  }

  /** Fontes de conversão (idioma da interface) — uma vez acima da tabela. */
  get listMoneySourcesLine(): string {
    return this.localeCurrency.getCatalogPriceFootnote(null, 'USD');
  }

  loadPropostas(event?: LazyLoadEvent) {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    const seq = this.requestGuard.bump();
    this.loading = true;

    this.propostaService.list({
      page: this.pageIndex,
      size: this.size,
      sort: 'createdAt,desc',
      q: this.searchTerm || undefined,
      status: this.statusFilter || undefined
    }).subscribe({
      next: (result) => {
        if (this.requestGuard.isStale(seq)) return;
        this.propostas = result.content ?? [];
        this.totalRecords = result.totalElements;
        this.loading = false;
      },
      error: (err) => {
        if (this.requestGuard.isStale(seq)) return;
        console.error('Failed to load proposals:', err);
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.list.propostas.loadError');
        this.loading = false;
      }
    });
  }

  onSearch() {
    this.pageIndex = 0;
    this.loadPropostas({ first: 0, rows: this.size });
  }

  getStatusLabel(status: string): string {
    const key = `comercial.proposta.status.${status}`;
    const t = this.i18n.translate(key);
    return t === key ? status : t;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' } = {
      'RASCUNHO': 'secondary',
      'ENVIADA': 'info',
      'APROVADA': 'success',
      'REJEITADA': 'danger',
      'CANCELADA': 'warning'
    };
    return severityMap[status] || 'secondary';
  }

  podeAcaoPortalLista(proposta: PropostaComercial): boolean {
    return !!proposta.id
      && propostaPodeAcaoPortal(proposta.status)
      && propostaTemEmailCliente(proposta.clienteEmail);
  }

  abrirPortalLista(proposta: PropostaComercial): void {
    if (!this.podeAcaoPortalLista(proposta)) {
      return;
    }
    this.portalProposta = proposta;
    this.showPortalDialog = true;
  }

  onPortalPublicadoLista(result: PropostaDisponibilizarPortalResult): void {
    const idx = this.propostas.findIndex(p => p.id === result.proposta.id);
    if (idx >= 0) {
      this.propostas[idx] = { ...this.propostas[idx], ...result.proposta };
    }
    this.portalProposta = null;
    this.loadPropostas({ first: this.pageIndex * this.size, rows: this.size });
  }

  onRowMouseEnter(proposta: PropostaComercial) {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) {
      return;
    }
    if (!proposta?.id) return;
    this.clearPreviewTimers();
    this.hoveredPropostaId = proposta.id;
    this.showPreviewTimeout = setTimeout(() => this.showPreviewInstant(proposta), 400);
  }

  private clearPreviewTimers() {
    if (this.showPreviewTimeout) {
      clearTimeout(this.showPreviewTimeout);
      this.showPreviewTimeout = null;
    }
    if (this.itensFetchTimeout) {
      clearTimeout(this.itensFetchTimeout);
      this.itensFetchTimeout = null;
    }
  }

  private showPreviewInstant(proposta: PropostaComercial) {
    if (!proposta?.id || this.hoveredPropostaId !== proposta.id) return;
    this.previewProposta = { ...proposta };
    this.previewLoading = false;
    this.previewItensLoading = false;
    if (proposta.itens?.length) return;
    this.itensFetchTimeout = setTimeout(() => this.loadPreviewItens(proposta), 500);
  }

  onRowMouseLeave() {
    this.hoveredPropostaId = null;
    this.clearPreviewTimers();
    if (!this.previewPanelHovered) {
      if (this.hidePreviewTimeout) clearTimeout(this.hidePreviewTimeout);
      this.hidePreviewTimeout = setTimeout(() => {
        this.previewProposta = null;
        this.previewLoading = false;
        this.previewItensLoading = false;
        this.hidePreviewTimeout = null;
      }, 150);
    }
  }

  onPreviewMouseEnter() {
    this.previewPanelHovered = true;
    if (this.hidePreviewTimeout) {
      clearTimeout(this.hidePreviewTimeout);
      this.hidePreviewTimeout = null;
    }
  }

  onPreviewMouseLeave() {
    this.previewPanelHovered = false;
    if (this.hidePreviewTimeout) clearTimeout(this.hidePreviewTimeout);
    this.hidePreviewTimeout = setTimeout(() => {
      this.previewProposta = null;
      this.previewLoading = false;
      this.previewItensLoading = false;
      this.hidePreviewTimeout = null;
    }, 120);
  }

  private loadPreviewItens(proposta: PropostaComercial) {
    if (!proposta.id || this.hoveredPropostaId !== proposta.id) return;
    this.previewItensLoading = true;
    this.propostaService.listItens(proposta.id).subscribe({
      next: (itens) => {
        if (this.hoveredPropostaId === proposta.id && this.previewProposta) {
          this.previewProposta = {
            ...this.previewProposta,
            itens
          };
        }
        this.previewItensLoading = false;
      },
      error: () => {
        this.previewItensLoading = false;
      }
    });
  }

  duplicar(proposta: PropostaComercial) {
    if (!proposta.id) return;

    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.proposta.duplicate', {
        numero: String(proposta.numeroProposta ?? '')
      }),
      header: 'confirm.header.duplicateProposal',
      icon: 'pi pi-copy',
      acceptLabel: 'common.confirm.yesDuplicate',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.propostaService.duplicate(proposta.id!).subscribe({
          next: (nova) => {
            this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'comercial.list.propostas.toast.duplicateSuccess');
            this.router.navigate(['/propostas-comerciais', nova.id]);
          },
          error: () => {
            this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.list.propostas.toast.duplicateError');
          }
        });
      }
    });
  }

  imprimir(proposta: PropostaComercial) {
    // Navegar para a proposta e abrir impressão
    this.router.navigate(['/propostas-comerciais', proposta.id]);
  }

  confirmarExclusao(proposta: PropostaComercial) {
    if (!proposta.id) return;

    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.proposta.delete', {
        numero: String(proposta.numeroProposta ?? '')
      }),
      header: 'confirm.header.delete',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesDelete',
      rejectLabel: 'common.confirm.cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.propostaService.delete(proposta.id!).subscribe({
          next: () => {
            this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'comercial.list.propostas.toast.deleteSuccess');
            this.onSearch();
          },
          error: () => {
            this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'comercial.list.propostas.toast.deleteError');
          }
        });
      }
    });
  }
}
