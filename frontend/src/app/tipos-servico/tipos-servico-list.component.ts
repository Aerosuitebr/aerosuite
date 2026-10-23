import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TipoServicoService } from '../core/tipos-servico.service';
import { TranslationService } from '../core/translation.service';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import { toastKey } from '../core/toast-i18n.util';
import { PageHelpComponent } from '../shared/page-help/page-help.component';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { TranslatePipe } from '../core/translate.pipe';
import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../core/lazy-list-pagination.helper';

@Component({
  standalone: true,
  selector: 'app-tipos-servico-list',
  imports: [
    ListTableScrollDirective,
    CommonModule, 
    FormsModule, 
    TableModule, 
    InputTextModule, 
    ButtonModule,
    CardModule,
    TagModule,
    BadgeModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    PaginatorModule,
    PageHelpComponent,
    PageHeroComponent,
    ListDataStatesComponent,
    TranslatePipe
  ],

  template: `
    <div class="as-page list-container">
      <app-page-hero
        variant="navy"
        titleKey="tiposServico.list.title"
        subtitleKey="tiposServico.list.subtitle"
        titleIcon="pi-cog"
        [hasActions]="true">
        <div actions class="header-actions">
          <app-page-help></app-page-help>
          <button
            pButton
            type="button"
            [label]="'tiposServico.list.btnNew' | translate"
            icon="pi pi-plus"
            class="p-button-primary add-btn"
            (click)="addNew()">
          </button>
        </div>
      </app-page-hero>

      <!-- Filters Section -->
      <div class="filters-section">
        <div class="filters-card">
          <div class="search-container">
            <div class="search-input-wrapper">
              <i class="pi pi-search search-icon"></i>
              <input 
                type="text" 
                pInputText 
                [(ngModel)]="q" 
                [placeholder]="'tiposServico.list.searchPlaceholder' | translate" 
                (keyup.enter)="reload()"
                class="search-input">
            </div>
            <button 
              pButton 
              type="button" 
              icon="pi pi-search" 
              class="p-button-outlined search-btn"
              (click)="reload()"
              [pTooltip]="'common.list.tooltip.search' | translate"
              tooltipPosition="top">
            </button>
            <button 
              pButton 
              type="button" 
              icon="pi pi-times" 
              class="p-button-text clear-btn"
              (click)="clear()"
              [pTooltip]="'common.list.tooltip.clearFilters' | translate"
              tooltipPosition="top">
            </button>
          </div>
          
          <div class="stats-container">
            <div class="stat-item">
              <div class="stat-number">{{ total }}</div>
              <div class="stat-label">{{ 'tiposServico.list.statTotal' | translate }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ getDisplayedCount() }}</div>
              <div class="stat-label">{{ 'common.list.stat.displaying' | translate }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Types Table -->
      <div class="table-section">
        <div class="table-card">
          <div class="table-container">
            <app-list-data-states
              [loading]="loading"
              [itemCount]="total"
              [skeletonRows]="8"
              [skeletonCols]="3"
              [mountContentWhileLoading]="true"
              emptyTitleKey="tiposServico.list.empty.title"
              emptyDescriptionKey="ui.empty.description">
              <button
                emptyAction
                pButton
                type="button"
                [label]="'tiposServico.list.empty.btn' | translate"
                icon="pi pi-plus"
                class="p-button-outlined"
                (click)="addNew()"></button>
              <p-table appListScroll
            [first]="tableFirst"
                [value]="rows" 
            [lazy]="true" 
            [paginator]="true"
            [rows]="size" 
            [totalRecords]="total" 
            [loading]="loading"
            (onLazyLoad)="loadLazy($event)"
            [sortField]="sortField" 
            [sortOrder]="sortOrder"
            [rowsPerPageOptions]="listRowsPerPageOptions" 
            dataKey="id" 
            responsiveLayout="scroll"
            styleClass="modern-table">
            
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="id" style="width: 80px;">
                  <div class="header-cell">
                    <span>{{ 'common.list.col.id' | translate }}</span>
                    <p-sortIcon field="id"></p-sortIcon>
                  </div>
                </th>
                <th pSortableColumn="nome">
                  <div class="header-cell">
                    <span>{{ 'tiposServico.list.col.name' | translate }}</span>
                    <p-sortIcon field="nome"></p-sortIcon>
                  </div>
                </th>
                <th style="width: 200px;">
                  <div class="header-cell">
                    <span>{{ 'common.list.col.actions' | translate }}</span>
                  </div>
                </th>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="body" let-row let-rowIndex="rowIndex">
              <tr class="table-row">
                <td>
                  <div class="id-cell">
                    <p-badge 
                      [value]="row.id" 
                      severity="warning" 
                      badgeSize="small">
                    </p-badge>
                  </div>
                </td>
                
                <td>
                  <div class="service-type-name">
                    <div class="service-type-info">
                      <span class="name-text">{{ row.nome || '-' }}</span>
                    </div>
                  </div>
                </td>
                
                <td>
                  <div class="actions-cell">
                    <div class="action-buttons">
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-pencil" 
                        class="p-button-text edit-btn"
                        (click)="initRowEdit(row, $event)"
                        [pTooltip]="'common.list.tooltip.edit' | translate"
                        tooltipPosition="top">
                      </button>
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-trash" 
                        class="p-button-text delete-btn"
                        (click)="confirmDelete(row)"
                        [pTooltip]="'common.list.tooltip.delete' | translate"
                        tooltipPosition="top">
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </ng-template>
            
          </p-table>
            </app-list-data-states>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <p-confirmDialog 
      [header]="'confirm.header.delete' | translate" 
      icon="pi pi-exclamation-triangle"
      acceptLabel="Sim, excluir"
      rejectLabel="Cancelar">
    </p-confirmDialog>

    <!-- Toast Messages -->
    <p-toast></p-toast>
  `,
  styleUrls: ['./tipos-servico-list.component.scss', '../shared/styles/list-styles.scss']
})
export class TipoServicoListComponent {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private api = inject(TipoServicoService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private i18n = inject(TranslationService);
  
  // Expor Math para o template
  Math = Math;

  rows: any[] = [];
  total = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  pageIndex = 0;
  sortField = 'id';
  sortOrder: 1 | -1 = 1;
  q = '';
  loading = true;

  private readonly requestGuard = createStaleRequestGuard();

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  toSort() {
    return `${this.sortField},${this.sortOrder === 1 ? 'asc' : 'desc'}`;
  }

  reload() {
    this.pageIndex = 0;
    this.loadLazy({ first: 0, rows: this.size });
  }

  private fetchList(): void {
    const seq = this.requestGuard.bump();
    this.loading = true;
    this.api.list({ 
      page: this.pageIndex, 
      size: this.size, 
      sort: this.toSort(), 
      q: this.q || undefined 
    }).subscribe({
      next: r => {
        if (this.requestGuard.isStale(seq)) return;
        this.rows = r.items;
        this.total = r.totalElements;
        this.size = r.size;
        this.pageIndex = r.page;
        this.loading = false;
      },
      error: () => {
        if (this.requestGuard.isStale(seq)) return;
        this.loading = false;
      }
    });
  }

  loadLazy(e?: LazyLoadEvent) {
    const req = resolveLazyPageRequest(e, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    if (e?.sortField) this.sortField = e.sortField;
    if (e?.sortOrder) this.sortOrder = e.sortOrder;
    this.fetchList();
  }

  clear() {
    this.q = '';
    this.pageIndex = 0;
    this.loadLazy({ first: 0, rows: this.size });
  }

  getDisplayedCount(): string {
    const total = this.total ?? 0;
    if (total === 0) return '0–0';
    
    const startIndex = (this.pageIndex || 0) * (this.size || 0) + 1;
    const endIndex = (this.pageIndex || 0) * (this.size || 0) + (this.rows?.length || 0);
    
    return `${startIndex}–${endIndex}`;
  }

  initRowEdit(row: any, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    if (!row || !row.id) {
      console.error('Invalid service type for edit:', row);
      toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'tiposServico.list.toast.editInvalid');
      return;
    }
    
    // Navegar para a tela de edição do tipo de serviço
    this.router.navigate(['tipos-servico', 'edit', row.id], { relativeTo: null }).then(
      (success) => {
        if (!success) {
          console.error('Navigation failed');
          toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'tiposServico.list.toast.editNavigateFail');
        }
      }
    ).catch(error => {
      console.error('Failed to navigate to edit:', error);
      toastKey(
        this.messageService,
        this.i18n,
        'error',
        'common.toast.error',
        'tiposServico.list.toast.editNavigateError',
        { msg: extractApiErrorMessage(error, this.i18n, 'common.unknownError') }
      );
    });
  }

  confirmDelete(row: any) {
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.tipoServico.message', { name: String(row?.nome ?? '') }),
      header: 'confirm.header.inactivate',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesInactivate',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.remove(row);
      }
    });
  }

  remove(row: any) {
    if (!row.id) return;
    
    this.loading = true;
    this.api.delete(row.id).subscribe({
      next: () => {
        this.reload();
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'tiposServico.list.toast.inactivateSuccess');
      },
      error: () => {
        this.loading = false;
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'tiposServico.list.toast.inactivateError');
      }
    });
  }

  addNew() {
    // Navegar para a tela de novo tipo de serviço
    this.router.navigate(['/tipos-servico/new']);
  }
}
