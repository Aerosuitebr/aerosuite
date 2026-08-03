import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TpFilesService, TpFiles } from '../core/tpfiles.service';
import { TranslationService } from '../core/translation.service';
import { toastKey } from '../core/toast-i18n.util';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../core/lazy-list-pagination.helper';

@Component({
  selector: 'app-tpfiles-list',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    DropdownModule,
    ButtonModule,
    CardModule,
    TagModule,
    BadgeModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule,
    ToastModule,
    PaginatorModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],

  template: `
    <div class="as-page list-container">
      <app-page-hero
        variant="navy"
        titleKey="tpfiles.list.title"
        subtitleKey="tpfiles.list.subtitle"
        titleIcon="pi-file"
        [hasActions]="true">
        <button
          actions
          pButton
          type="button"
          [label]="'tpfiles.list.btnNew' | translate"
          icon="pi pi-plus"
          class="add-btn"
          (click)="addNew()">
        </button>
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
                [placeholder]="'tpfiles.list.searchPlaceholder' | translate" 
                (keyup.enter)="reload()"
                class="search-input">
            </div>
            <button 
              pButton 
              type="button" 
              icon="pi pi-search" 
              class="search-btn"
              (click)="reload()"
              [pTooltip]="'common.list.tooltip.search' | translate"
              tooltipPosition="top">
            </button>
            <button 
              pButton 
              type="button" 
              icon="pi pi-times" 
              class="clear-btn"
              (click)="clear()"
              [pTooltip]="'common.list.tooltip.clearFilters' | translate"
              tooltipPosition="top">
            </button>
          </div>
          
          <div class="stats-container">
            <div class="stat-item">
              <div class="stat-number">{{ total }}</div>
              <div class="stat-label">{{ 'tpfiles.list.statTotal' | translate }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ getDisplayedCount() }}</div>
              <div class="stat-label">{{ 'common.list.stat.displaying' | translate }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-section">
        <div class="table-card">
        <div class="table-container">
          <app-list-data-states
            [loading]="loading"
            [itemCount]="total"
            [skeletonRows]="8"
            [skeletonCols]="8"
            [mountContentWhileLoading]="true"
            emptyTitleKey="tpfiles.list.empty"
            emptyDescriptionKey="ui.empty.description">
            <button
              emptyAction
              pButton
              type="button"
              [label]="'tpfiles.list.btnNew' | translate"
              icon="pi pi-plus"
              class="p-button-outlined"
              (click)="addNew()"></button>
            <p-table appListScroll
            [first]="tableFirst"
            [value]="rows" 
            [loading]="loading"
            [paginator]="true"
            [rows]="size"
            [totalRecords]="total"
            [lazy]="true"
            (onLazyLoad)="loadLazy($event)"
            [sortField]="sortField"
            [sortOrder]="sortOrder"
            [showCurrentPageReport]="true"
            [currentPageReportTemplate]="'common.list.pageReport' | translate"
            [rowsPerPageOptions]="listRowsPerPageOptions"
            dataKey="id"
            styleClass="p-datatable-sm">
            
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="fileName">
                  {{ 'tpfiles.list.col.fileName' | translate }}
                  <p-sortIcon field="fileName"></p-sortIcon>
                </th>
                <th pSortableColumn="originalName">
                  {{ 'tpfiles.list.col.originalName' | translate }}
                  <p-sortIcon field="originalName"></p-sortIcon>
                </th>
                <th pSortableColumn="fileSize">
                  {{ 'tpfiles.list.col.size' | translate }}
                  <p-sortIcon field="fileSize"></p-sortIcon>
                </th>
                <th pSortableColumn="contentType">
                  {{ 'tpfiles.list.col.mime' | translate }}
                  <p-sortIcon field="contentType"></p-sortIcon>
                </th>
                <th pSortableColumn="fileExtension">
                  {{ 'tpfiles.list.col.extension' | translate }}
                  <p-sortIcon field="fileExtension"></p-sortIcon>
                </th>
                <th pSortableColumn="tipoServicoId">
                  {{ 'tpfiles.list.col.serviceTypeId' | translate }}
                  <p-sortIcon field="tipoServicoId"></p-sortIcon>
                </th>
                <th pSortableColumn="isActive">
                  {{ 'common.list.col.status' | translate }}
                  <p-sortIcon field="isActive"></p-sortIcon>
                </th>
                <th style="width: 120px;">{{ 'common.list.col.actions' | translate }}</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-row>
              <tr>
                <td>
                  <div class="file-name">
                    <strong>{{ row.fileName }}</strong>
                  </div>
                </td>
                <td>
                  <div class="original-name">
                    {{ row.originalName }}
                  </div>
                </td>
                <td>
                  <div class="file-size">
                    {{ formatFileSize(row.fileSize) }}
                  </div>
                </td>
                <td>
                  <div class="content-type">
                    {{ row.contentType || '-' }}
                  </div>
                </td>
                <td>
                  <div class="file-extension">
                    <p-tag 
                      [value]="row.fileExtension || '-'"
                      severity="info">
                    </p-tag>
                  </div>
                </td>
                <td>
                  <div class="tipo-servico-id">
                    {{ row.tipoServicoId || '-' }}
                  </div>
                </td>
                <td>
                  <p-tag 
                    [value]="(row.isActive ? 'common.status.active' : 'common.status.inactive') | translate"
                    [severity]="row.isActive ? 'success' : 'danger'">
                  </p-tag>
                </td>
                <td>
                  <div class="action-buttons">
                    <button 
                      pButton 
                      type="button" 
                      icon="pi pi-pencil" 
                      class="p-button-text p-button-sm edit-btn"
                      [pTooltip]="'common.list.tooltip.edit' | translate"
                      (click)="editTpFile(row)">
                    </button>
                    <button 
                      pButton 
                      type="button" 
                      icon="pi pi-trash" 
                      class="p-button-text p-button-sm delete-btn"
                      [pTooltip]="'common.list.tooltip.delete' | translate"
                      (click)="confirmDelete(row)">
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>

          </p-table>
          </app-list-data-states>
        </div>
        </div>
      </div>

      <!-- TpFiles Modal -->
      <p-dialog 
        styleClass="as-hero-dialog" [(visible)]="showTpFileModal" 
        [modal]="true" 
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
        [style]="{width: '600px'}"
        [header]="isEditing ? 'Editar Arquivo' : 'Novo Arquivo'"
        (onHide)="closeTpFileModal()">
        
        <form [formGroup]="tpFileForm" (ngSubmit)="saveTpFile()" class="tpfile-form">
          <div class="form-grid">
            <!-- Nome do Arquivo -->
            <div class="form-field">
              <label for="fileName" class="field-label">
                <i class="pi pi-file"></i>
                Nome do Arquivo *
              </label>
              <input 
                pInputText 
                id="fileName"
                formControlName="fileName"
                [placeholder]="'formsMisc.tpfiles.placeholderFileName' | translate"
                class="form-input"
                [class.p-invalid]="tpFileForm.get('fileName')?.invalid && tpFileForm.get('fileName')?.touched">
              <small 
                *ngIf="tpFileForm.get('fileName')?.invalid && tpFileForm.get('fileName')?.touched" 
                class="p-error">
                Nome do arquivo é obrigatório
              </small>
            </div>

            <!-- Nome Original -->
            <div class="form-field">
              <label for="originalName" class="field-label">
                <i class="pi pi-file-edit"></i>
                Nome Original *
              </label>
              <input 
                pInputText 
                id="originalName"
                formControlName="originalName"
                [placeholder]="'formsMisc.tpfiles.placeholderOriginalName' | translate"
                class="form-input"
                [class.p-invalid]="tpFileForm.get('originalName')?.invalid && tpFileForm.get('originalName')?.touched">
              <small 
                *ngIf="tpFileForm.get('originalName')?.invalid && tpFileForm.get('originalName')?.touched" 
                class="p-error">
                Nome original é obrigatório
              </small>
            </div>

            <!-- Caminho do Arquivo -->
            <div class="form-field full-width">
              <label for="filePath" class="field-label">
                <i class="pi pi-folder"></i>
                Caminho do Arquivo *
              </label>
              <input 
                pInputText 
                id="filePath"
                formControlName="filePath"
                [placeholder]="'formsMisc.tpfiles.placeholderFilePath' | translate"
                class="form-input"
                [class.p-invalid]="tpFileForm.get('filePath')?.invalid && tpFileForm.get('filePath')?.touched">
              <small 
                *ngIf="tpFileForm.get('filePath')?.invalid && tpFileForm.get('filePath')?.touched" 
                class="p-error">
                Caminho do arquivo é obrigatório
              </small>
            </div>

            <!-- Tamanho do Arquivo -->
            <div class="form-field">
              <label for="fileSize" class="field-label">
                <i class="pi pi-database"></i>
                Tamanho (bytes)
              </label>
              <p-inputNumber 
                id="fileSize"
                formControlName="fileSize"
                [min]="0"
                [step]="1"
                [placeholder]="'formsMisc.tpfiles.placeholderFileSize' | translate"
                class="form-input">
              </p-inputNumber>
            </div>

            <!-- Tipo de Conteúdo -->
            <div class="form-field">
              <label for="contentType" class="field-label">
                <i class="pi pi-info-circle"></i>
                Tipo de Conteúdo
              </label>
              <input 
                pInputText 
                id="contentType"
                formControlName="contentType"
                [placeholder]="'formsMisc.tpfiles.placeholderMimeType' | translate"
                class="form-input">
            </div>

            <!-- Extensão do Arquivo -->
            <div class="form-field">
              <label for="fileExtension" class="field-label">
                <i class="pi pi-tag"></i>
                Extensão
              </label>
              <input 
                pInputText 
                id="fileExtension"
                formControlName="fileExtension"
                [placeholder]="'formsMisc.tpfiles.placeholderExtension' | translate"
                class="form-input">
            </div>

            <!-- ID Tipo Serviço -->
            <div class="form-field">
              <label for="tipoServicoId" class="field-label">
                <i class="pi pi-cog"></i>
                ID Tipo Serviço
              </label>
              <p-inputNumber 
                id="tipoServicoId"
                formControlName="tipoServicoId"
                [min]="0"
                [step]="1"
                [placeholder]="'formsMisc.tpfiles.placeholderFileSize' | translate"
                class="form-input">
              </p-inputNumber>
            </div>

            <!-- Descrição -->
            <div class="form-field full-width">
              <label for="description" class="field-label">
                <i class="pi pi-align-left"></i>
                {{ 'formsMisc.tpfiles.labelDescription' | translate }}
              </label>
              <textarea 
                pInputTextarea 
                id="description"
                formControlName="description"
                [placeholder]="'formsMisc.tpfiles.placeholderDescription' | translate"
                rows="3"
                class="form-input">
              </textarea>
            </div>
          </div>

          <div class="form-actions">
            <button 
              pButton 
              type="button" 
              label="Cancelar" 
              icon="pi pi-times"
              class="p-button-text"
              (click)="closeTpFileModal()">
            </button>
            <button 
              pButton 
              type="submit" 
              [label]="isEditing ? 'Atualizar' : 'Criar'"
              [icon]="isEditing ? 'pi pi-check' : 'pi pi-plus'"
              class="p-button-primary"
              [disabled]="tpFileForm.invalid || saving">
            </button>
          </div>
        </form>
      </p-dialog>

      <!-- Toast Messages -->
      <p-toast></p-toast>
      
      <!-- Confirmation Dialog -->
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styleUrls: ['./tpfiles-list.component.scss', '../shared/styles/list-styles.scss']
})
export class TpFilesListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private api = inject(TpFilesService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  
  // Expor Math para o template
  Math = Math;
  private fb = inject(FormBuilder);

  rows: any[] = [];
  total = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  pageIndex = 0;
  sortField = 'id';
  sortOrder: 1 | -1 = 1;
  q = '';
  loading = true;

  // Modal properties
  showTpFileModal = false;
  isEditing = false;
  saving = false;
  currentTpFile: TpFiles | null = null;

  // Form
  tpFileForm!: FormGroup;

  private readonly requestGuard = createStaleRequestGuard();

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.tpFileForm = this.fb.group({
      fileName: ['', [Validators.required, Validators.minLength(2)]],
      originalName: ['', [Validators.required, Validators.minLength(2)]],
      filePath: ['', [Validators.required, Validators.minLength(2)]],
      fileSize: [null, [Validators.min(0)]],
      contentType: [''],
      fileExtension: [''],
      description: [''],
      tipoServicoId: [null, [Validators.min(0)]]
    });
  }

  formatFileSize(bytes: number | null | undefined): string {
    if (!bytes) return '-';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  toSort(event: any) {
    this.sortField = event.field;
    this.sortOrder = event.order;
    this.reload();
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
      sort: this.sortField + ',' + (this.sortOrder === 1 ? 'asc' : 'desc'),
      q: this.q
    }).subscribe({
      next: (response) => {
        if (this.requestGuard.isStale(seq)) return;
        this.rows = response.items;
        this.total = response.totalElements;
        this.loading = false;
      },
      error: () => {
        if (this.requestGuard.isStale(seq)) return;
        this.loading = false;
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'tpfiles.list.toast.loadError');
      }
    });
  }

  loadLazy(event?: LazyLoadEvent) {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    if (event?.sortField) this.sortField = event.sortField;
    if (event?.sortOrder) this.sortOrder = event.sortOrder;
    this.fetchList();
  }

  clear() {
    this.q = '';
    this.pageIndex = 0;
    this.loadLazy({ first: 0, rows: this.size });
  }

  getDisplayedCount(): string {
    const total = this.total ?? 0;
    const startIndex = total === 0 ? 0 : (this.pageIndex || 0) * (this.size || 0) + (this.rows?.length ? 1 : 0);
    const endIndex = (this.pageIndex || 0) * (this.size || 0) + (this.rows?.length || 0);
    return total === 0 ? '0–0' : `${startIndex}–${endIndex}`;
  }

  addNew() {
    this.isEditing = false;
    this.currentTpFile = null;
    this.tpFileForm.reset();
    this.showTpFileModal = true;
  }

  editTpFile(tpFile: any) {
    this.isEditing = true;
    this.currentTpFile = tpFile;
    this.tpFileForm.patchValue(tpFile);
    this.showTpFileModal = true;
  }

  saveTpFile() {
    if (this.tpFileForm.invalid) {
      this.tpFileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const tpFileData = this.tpFileForm.value;

    const operation = this.isEditing 
      ? this.api.update(this.currentTpFile!.id!, tpFileData)
      : this.api.create(tpFileData);

    operation.subscribe({
      next: () => {
        this.saving = false;
        this.closeTpFileModal();
        this.loadLazy({ first: this.pageIndex * this.size, rows: this.size });
        toastKey(
          this.messageService,
          this.i18n,
          'success',
          'common.toast.success',
          this.isEditing ? 'tpfiles.list.toast.updateSuccess' : 'tpfiles.list.toast.createSuccess'
        );
      },
      error: () => {
        this.saving = false;
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'tpfiles.list.toast.saveError');
      }
    });
  }

  closeTpFileModal() {
    this.showTpFileModal = false;
    this.isEditing = false;
    this.currentTpFile = null;
    this.tpFileForm.reset();
  }

  confirmDelete(tpFile: any) {
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.tpfile.message', { name: String(tpFile?.nome ?? '') }),
      header: 'confirm.header.inactivate',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesInactivate',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.deleteTpFile(tpFile);
      }
    });
  }

  deleteTpFile(tpFile: any) {
    this.api.delete(tpFile.id!).subscribe({
      next: () => {
        this.loadLazy({ first: this.pageIndex * this.size, rows: this.size });
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'tpfiles.list.toast.inactivateSuccess');
      },
      error: () => {
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'tpfiles.list.toast.inactivateError');
      }
    });
  }
}
