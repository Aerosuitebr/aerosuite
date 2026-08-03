import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../core/lazy-list-pagination.helper';
import { Component, OnInit, inject } from '@angular/core';
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
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PublicacaoTecnicaService, PublicacaoTecnica } from '../core/publicacao-tecnica.service';
import { FabricanteService, Fabricante } from '../core/fabricantes.service';
import { TranslationService } from '../core/translation.service';
import { formatUiDateTime } from '../core/locale/locale-intl.util';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';


@Component({
  standalone: true,
  selector: 'app-publicacao-tecnica-list',
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
    DropdownModule,
    CalendarModule,
    DialogModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  styleUrls: ['./publicacao-tecnica-list.component.scss'],
  template: `
    <div class="as-page list-container">
      <app-page-hero
        variant="navy"
        titleKey="publicacoes.list.title"
        subtitleKey="publicacoes.list.subtitle"
        titleIcon="pi-book"
        [hasActions]="true">
        <div actions class="header-actions">
          <button
            pButton
            type="button"
            [label]="'publicacoes.list.btnNew' | translate"
            icon="pi pi-plus"
            class="p-button-primary add-btn"
            (click)="openNewDialog()">
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
                [placeholder]="'publicacoes.list.searchPlaceholder' | translate" 
                (keyup.enter)="reload()"
                class="search-input">
            </div>
            <button 
              pButton 
              type="button" 
              icon="pi pi-search" 
              class="p-button-outlined search-btn"
              (click)="reload()"
              [pTooltip]="'publicacoes.list.tooltipSearch' | translate"
              tooltipPosition="top">
            </button>
            <button 
              pButton 
              type="button" 
              icon="pi pi-times" 
              class="p-button-text clear-btn"
              (click)="clear()"
              [pTooltip]="'publicacoes.list.tooltipClear' | translate"
              tooltipPosition="top">
            </button>
          </div>
          
          <div class="stats-container">
            <div class="stat-item">
              <div class="stat-number">{{ total }}</div>
              <div class="stat-label">{{ 'publicacoes.list.statTotal' | translate }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ getDisplayedCount() }}</div>
              <div class="stat-label">{{ 'publicacoes.list.statDisplaying' | translate }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-section">
        <div class="table-card">
          <div class="table-container">
            <app-list-data-states
              [loading]="loading"
              [itemCount]="total"
              [skeletonRows]="8"
              [skeletonCols]="7"
              [mountContentWhileLoading]="true"
              emptyTitleKey="publicacoes.list.empty.title"
              emptyDescriptionKey="ui.empty.description">
              <button
                emptyAction
                pButton
                type="button"
                [label]="'publicacoes.list.empty.btn' | translate"
                icon="pi pi-plus"
                class="p-button-outlined"
                (click)="openNewDialog()"></button>
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
                <th pSortableColumn="id" class="col-id">
                  <div class="header-cell">
                    <span>{{ 'publicacoes.list.col.id' | translate }}</span>
                    <p-sortIcon field="id"></p-sortIcon>
                  </div>
                </th>
                <th pSortableColumn="fabricante.nome" class="col-fabricante">
                  <div class="header-cell">
                    <span>{{ 'publicacoes.list.col.fabricante' | translate }}</span>
                    <p-sortIcon field="fabricante.nome"></p-sortIcon>
                  </div>
                </th>
                <th pSortableColumn="ataManual" class="col-ata">
                  <div class="header-cell">
                    <span>{{ 'publicacoes.list.col.ata' | translate }}</span>
                    <p-sortIcon field="ataManual"></p-sortIcon>
                  </div>
                </th>
                <th pSortableColumn="dataRevisaoManual" class="col-data">
                  <div class="header-cell">
                    <span>{{ 'publicacoes.list.col.dataRevisao' | translate }}</span>
                    <p-sortIcon field="dataRevisaoManual"></p-sortIcon>
                  </div>
                </th>
                <th pSortableColumn="numeroRevisao" class="col-revisao">
                  <div class="header-cell">
                    <span>{{ 'publicacoes.list.col.numRevisao' | translate }}</span>
                    <p-sortIcon field="numeroRevisao"></p-sortIcon>
                  </div>
                </th>
                <th class="col-tipo-manual">
                  <div class="header-cell">
                    <span>{{ 'publicacoes.list.col.tipoManual' | translate }}</span>
                  </div>
                </th>
                <th class="col-actions">
                  <div class="header-cell">
                    <span>{{ 'publicacoes.list.col.actions' | translate }}</span>
                  </div>
                </th>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="body" let-row>
              <tr class="table-row">
                <td>
                  <div class="id-cell">
                    <p-badge 
                      [value]="row.id" 
                      severity="info" 
                      size="small">
                    </p-badge>
                  </div>
                </td>
                <td>
                  <div class="cell-content">
                    <span>{{ row.fabricanteNome || '-' }}</span>
                  </div>
                </td>
                <td>
                  <div class="cell-content">
                    <span class="ata-code">{{ row.ataManual || '-' }}</span>
                  </div>
                </td>
                <td>
                  <div class="cell-content">
                    <span>{{ formatDate(row.dataRevisaoManual) }}</span>
                  </div>
                </td>
                <td>
                  <div class="cell-content">
                    <span>{{ row.numeroRevisao || '-' }}</span>
                  </div>
                </td>
                <td class="col-tipo-manual">
                  <span
                    class="tipo-manual-text"
                    [pTooltip]="row.tipoManual"
                    tooltipPosition="top">{{ row.tipoManual || '-' }}</span>
                </td>
                <td class="col-actions">
                  <div class="actions-cell">
                    <div class="action-buttons">
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-pencil" 
                        class="p-button-text edit-btn"
                        (click)="openEditDialog(row)"
                        [pTooltip]="'publicacoes.list.tooltipEdit' | translate"
                        tooltipPosition="top">
                      </button>
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-trash" 
                        class="p-button-text delete-btn"
                        (click)="confirmDelete(row)"
                        [pTooltip]="'publicacoes.list.tooltipDelete' | translate"
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

    <!-- Dialog de Cadastro/Edição -->
    <p-dialog 
      styleClass="as-hero-dialog" [(visible)]="showDialog" 
      [header]="(isEditMode ? 'publicacoes.dialog.editTitle' : 'publicacoes.dialog.newTitle') | translate"
      [modal]="true"
      [style]="{width: '600px'}"
      [closable]="true"
      [draggable]="false">
      
      <div class="dialog-form">
        <div class="form-group">
          <label for="fabricante">{{ 'publicacoes.dialog.fabricante' | translate }} <span class="required">*</span></label>
          <p-dropdown
            id="fabricante"
            [options]="fabricantes"
            [(ngModel)]="publicacao.fabricanteId"
            optionLabel="nome"
            optionValue="id"
            [placeholder]="'publicacoes.dialog.fabricantePh' | translate"
            [filter]="true"
            filterBy="nome"
            [showClear]="true"
            [style]="{width: '100%'}">
          </p-dropdown>
        </div>

        <div class="form-group">
          <label for="ataManual">{{ 'publicacoes.dialog.ata' | translate }} <span class="required">*</span></label>
          <input 
            pInputText 
            id="ataManual"
            [(ngModel)]="publicacao.ataManual"
            [placeholder]="'publicacoes.dialog.ataPh' | translate"
            maxlength="20"
            class="w-full">
        </div>

        <div class="form-group">
          <label for="dataRevisao">{{ 'publicacoes.dialog.dataRevisao' | translate }} <span class="required">*</span></label>
          <p-calendar
            id="dataRevisao"
            [(ngModel)]="dataRevisaoDate"
            dateFormat="dd/mm/yy"
            [placeholder]="'publicacoes.dialog.dataPh' | translate"
            [showIcon]="true"
            [style]="{width: '100%'}">
          </p-calendar>
        </div>

        <div class="form-group">
          <label for="numeroRevisao">{{ 'publicacoes.dialog.numRevisao' | translate }} <span class="required">*</span></label>
          <input 
            pInputText 
            id="numeroRevisao"
            [(ngModel)]="publicacao.numeroRevisao"
            [placeholder]="'publicacoes.dialog.numRevisaoPh' | translate"
            maxlength="20"
            class="w-full">
        </div>

        <div class="form-group">
          <label for="tipoManual">{{ 'publicacoes.dialog.tipoManual' | translate }}</label>
          <textarea 
            pInputText 
            id="tipoManual"
            [(ngModel)]="publicacao.tipoManual"
            [placeholder]="'publicacoes.dialog.tipoManualPh' | translate"
            maxlength="1000"
            rows="3"
            class="w-full"
            style="resize: vertical; min-height: 80px;">
          </textarea>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button 
          pButton 
          type="button" 
          [label]="'publicacoes.dialog.btnCancel' | translate" 
          icon="pi pi-times" 
          class="p-button-text"
          (click)="closeDialog()">
        </button>
        <button 
          pButton 
          type="button" 
          [label]="(isEditMode ? 'publicacoes.dialog.btnUpdate' : 'publicacoes.dialog.btnSave') | translate" 
          [icon]="isEditMode ? 'pi pi-check' : 'pi pi-save'" 
          class="p-button-primary"
          (click)="save()"
          [disabled]="!isFormValid">
        </button>
      </ng-template>
    </p-dialog>

    <p-confirmDialog icon="pi pi-exclamation-triangle"></p-confirmDialog>

    <p-toast></p-toast>
  `
})
export class PublicacaoTecnicaListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;


  private api = inject(PublicacaoTecnicaService);
  private fabricanteService = inject(FabricanteService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  rows: PublicacaoTecnica[] = [];
  total = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  pageIndex = 0;
  sortField = 'id';
  sortOrder: 1 | -1 = -1;
  q = '';
  loading = true;

  // Dialog
  showDialog = false;
  isEditMode = false;
  publicacao: PublicacaoTecnica = {};
  dataRevisaoDate: Date | null = null;
  fabricantes: Fabricante[] = [];

  private readonly requestGuard = createStaleRequestGuard();

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  get isFormValid(): boolean {
    return !!(
      this.publicacao.fabricanteId &&
      this.publicacao.ataManual?.trim() &&
      this.dataRevisaoDate &&
      this.publicacao.numeroRevisao?.trim()
    );
  }

  ngOnInit() {
    this.loadFabricantes();
  }

  loadFabricantes() {
    this.fabricanteService.list({ size: 1000 }).subscribe({
      next: (response) => {
        this.fabricantes = response.items || [];
      },
      error: (error) => {
        console.error('Failed to load manufacturers:', error);
      }
    });
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
    const params = { 
      page: this.pageIndex, 
      size: this.size, 
      sort: this.toSort(), 
      q: this.q || undefined 
    };
    
    this.api.search(params).subscribe({
      next: (response) => {
        if (this.requestGuard.isStale(seq)) return;
        this.rows = response.items || [];
        this.total = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        if (this.requestGuard.isStale(seq)) return;
        console.error('Failed to load publications:', error);
        this.loading = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'publicacoes.toast.loadError');
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

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
      return formatUiDateTime(this.i18n.getCurrentLanguage(), dateStr, 'date');
    } catch {
      return dateStr;
    }
  }

  truncateText(text?: string, maxLength: number = 50): string {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  openNewDialog() {
    this.isEditMode = false;
    this.publicacao = {};
    this.dataRevisaoDate = null;
    this.showDialog = true;
  }

  openEditDialog(row: PublicacaoTecnica) {
    this.isEditMode = true;
    this.publicacao = { ...row };
    if (row.dataRevisaoManual) {
      this.dataRevisaoDate = new Date(row.dataRevisaoManual);
    } else {
      this.dataRevisaoDate = null;
    }
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
    this.publicacao = {};
    this.dataRevisaoDate = null;
  }

  save() {
    if (!this.isFormValid) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'publicacoes.toast.fillRequired');
      return;
    }

    // Converter data para formato ISO
    if (this.dataRevisaoDate) {
      const year = this.dataRevisaoDate.getFullYear();
      const month = String(this.dataRevisaoDate.getMonth() + 1).padStart(2, '0');
      const day = String(this.dataRevisaoDate.getDate()).padStart(2, '0');
      this.publicacao.dataRevisaoManual = `${year}-${month}-${day}`;
    }

    this.loading = true;

    if (this.isEditMode && this.publicacao.id) {
      this.api.update(this.publicacao.id, this.publicacao).subscribe({
        next: () => {
          this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'publicacoes.toast.updateSuccess');
          this.closeDialog();
          this.loadLazy({ first: this.pageIndex * this.size, rows: this.size });
        },
        error: (error) => {
          console.error('Failed to update publication:', error);
          this.loading = false;
          this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'publicacoes.toast.updateError');
        }
      });
    } else {
      this.api.create(this.publicacao).subscribe({
        next: () => {
          this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'publicacoes.toast.createSuccess');
          this.closeDialog();
          this.loadLazy({ first: this.pageIndex * this.size, rows: this.size });
        },
        error: (error) => {
          console.error('Failed to create publication:', error);
          this.loading = false;
          this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'publicacoes.toast.createError');
        }
      });
    }
  }

  confirmDelete(row: PublicacaoTecnica) {
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.publicacao.message', { name: String(row?.ataManual ?? '') }),
      header: 'confirm.header.delete',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesDelete',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.delete(row);
      }
    });
  }

  delete(row: PublicacaoTecnica) {
    if (!row.id) return;

    this.loading = true;
    this.api.delete(row.id).subscribe({
      next: () => {
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'publicacoes.toast.deleteSuccess');
        this.loadLazy({ first: this.pageIndex * this.size, rows: this.size });
      },
      error: (error) => {
        console.error('Failed to delete publication:', error);
        this.loading = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'publicacoes.toast.deleteError');
      }
    });
  }

  getDisplayedCount(): string {
    if (this.total === 0) return '0–0';
    const startIndex = this.pageIndex * this.size + 1;
    const endIndex = this.pageIndex * this.size + (this.rows?.length || 0);
    return `${startIndex}–${endIndex}`;
  }
}
