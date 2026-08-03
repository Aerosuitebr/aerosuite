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
import { FcuService } from '../core/fcu.service';
import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../core/lazy-list-pagination.helper';
import { TranslationService } from '../core/translation.service';
import { toastKey } from '../core/toast-i18n.util';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import { PageHelpComponent } from '../shared/page-help/page-help.component';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { TranslatePipe } from '../core/translate.pipe';

@Component({
  selector: 'app-fcu-list',
  standalone: true,
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

  templateUrl: './fcu-list.component.html',
  styleUrls: ['./fcu-list.component.scss', '../shared/styles/list-styles.scss']
})
export class FcuListComponent {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private api = inject(FcuService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private i18n = inject(TranslationService);
  private readonly requestGuard = createStaleRequestGuard();

  rows: any[] = [];
  total = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  pageIndex = 0;
  sortField = 'id';
  sortOrder: 1 | -1 = 1;
  q = '';
  loading = true;
  editingRow: any = null;

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  loadLazy(event?: LazyLoadEvent) {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    if (event?.sortField) this.sortField = event.sortField;
    if (event?.sortOrder) this.sortOrder = event.sortOrder;
    this.reload();
  }

  reload() {
    const seq = this.requestGuard.bump();
    this.loading = true;
    this.api.list({ 
      page: this.pageIndex, 
      size: this.size, 
      sort: this.toSort(), 
      q: this.q.trim() || undefined 
    }).subscribe({
      next: (response) => {
        if (this.requestGuard.isStale(seq)) {
          return;
        }
        this.rows = response.items || [];
        this.total = response.totalElements || 0;
        this.loading = false;
      },
      error: () => {
        if (this.requestGuard.isStale(seq)) {
          return;
        }
        this.loading = false;
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'fcu.list.toast.loadDataError');
      }
    });
  }

  buscar() {
    this.pageIndex = 0;
    this.loadLazy({ first: 0, rows: this.size });
  }

  toSort() {
    return `${this.sortField},${this.sortOrder === 1 ? 'asc' : 'desc'}`;
  }

  clear() {
    this.q = '';
    this.buscar();
  }

  getDisplayedCount(): string {
    const total = this.total ?? 0;
    if (total === 0) return '0–0';
    
    const startIndex = (this.pageIndex || 0) * (this.size || DEFAULT_LIST_PAGE_SIZE) + 1;
    const endIndex = Math.min((this.pageIndex || 0) * (this.size || DEFAULT_LIST_PAGE_SIZE) + (this.rows?.length || 0), total);
    
    return `${startIndex}–${endIndex}`;
  }

  addNew() {
    // Navegar para a tela de novo FCU
    this.router.navigate(['/fcu/new']);
  }

  initRowEdit(row: any, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    if (!row || !row.id) {
      console.error('Invalid FCU for edit:', row);
      toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'fcu.list.toast.invalidForEdit');
      return;
    }
    
    // Navegar para a tela de edição do FCU
    this.router.navigate(['fcu', 'edit', row.id], { relativeTo: null }).then(
      (success) => {
        if (!success) {
          console.error('Navigation failed');
          toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'fcu.list.toast.openEditFormError');
        }
      }
    ).catch(error => {
      console.error('Failed to navigate to edit:', error);
      toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'fcu.list.toast.openEditFormErrorDetail', {
        error: String(error?.message || this.i18n.translate('common.unknownError'))
      });
    });
  }

  cancelRowEdit() {
    this.editingRow = null;
  }

  save(row: any) {
    // Este método não é mais usado, mas mantido para compatibilidade
    // A edição agora é feita através do formulário completo
  }

  confirmDelete(row: any) {
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.fcu.message', {
        name: String((row?.fcuCodigo || row?.nome || row?.id) ?? '')
      }),
      header: 'confirm.header.inactivate',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesInactivate',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.deleteFcu(row);
      }
    });
  }

  deleteFcu(row: any) {
    if (!row.id) {
      console.error('ERROR: FCU ID not found for deactivation.');
      toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'fcu.list.toast.idNotFound');
      return;
    }
    
    this.loading = true;
    this.api.delete(row.id).subscribe({
      next: (response) => {
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'fcu.list.toast.inactivateSuccess');
        // Adicionar um pequeno delay antes de recarregar para garantir que o backend processou
        setTimeout(() => {
          this.reload();
        }, 300);
      },
      error: (error) => {
        console.error('Failed to deactivate FCU:', error);
        this.loading = false;
        const errorMessage = extractApiErrorMessage(error, this.i18n, 'fcu.list.toast.inactivateErrorFallback');
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'fcu.list.toast.inactivateError', {
          error: String(errorMessage)
        });
      }
    });
  }

  getStatusLabel(row: any): string {
    const code =
      row.isActive === false ? 'INATIVO' : row.isActive === true ? 'ATIVO' : String(row.status || 'ATIVO');
    return this.i18n.translateCatalog('fcu.status', code, code);
  }

  getStatusSeverity(status: string) {
    switch (status?.toUpperCase()) {
      case 'ATIVO':
        return 'success';
      case 'INATIVO':
        return 'danger';
      default:
        return 'info';
    }
  }

  getTableHeight(): string {
    // Scroll da tabela via appListScroll no template (ListTableScrollDirective).
    // O SCSS já controla a altura através do max-height no wrapper
    return 'flex';
  }
}
