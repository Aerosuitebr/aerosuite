import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
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
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductService } from '../core/product.service';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../core/translate.pipe';
import { LocaleMoneyPipe } from '../core/locale/locale-money.pipe';
import { LocaleCurrencyService } from '../core/locale/locale-currency.service';
import { decodeProductLocal, ProductCurrency } from './product-meta.util';
import { BarcodeSvgComponent } from '../shared/barcode-svg/barcode-svg.component';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import JsBarcode from 'jsbarcode';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { environment } from '../../environments/environment';
import { normalizeDateSearchTerm } from '../core/br-input.util';
import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../core/lazy-list-pagination.helper';
// import { PageHelpComponent } from '../shared/page-help/page-help.component';

@Component({
  standalone: true,
  selector: 'app-product-list',
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
    DialogModule,
    DropdownModule,
    TranslatePipe,
    LocaleMoneyPipe,
    BarcodeSvgComponent,
    ListDataStatesComponent,
    PageHeroComponent
    // PageHelpComponent - Temporariamente removido para resolver erro de bundle
  ],
  template: `
    <div class="as-page list-container">
      <app-page-hero
        variant="navy"
        titleKey="products.list.title"
        subtitleKey="products.list.subtitle"
        titleIcon="pi-box"
        [hasActions]="true">
        <div actions class="header-actions">
          <button
            pButton
            type="button"
            [label]="'products.list.btnNew' | translate"
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
            <div class="search-input-wrapper"
                 [pTooltip]="'products.list.searchTooltip' | translate"
                 tooltipPosition="bottom"
                 [tooltipStyleClass]="'search-tooltip'">
              <i class="pi pi-search search-icon" *ngIf="!searching"></i>
              <i class="pi pi-spin pi-spinner search-icon" *ngIf="searching"></i>
              <input 
                type="text" 
                pInputText 
                [(ngModel)]="q"
                [attr.aria-label]="'products.list.searchPlaceholder' | translate"
                [placeholder]="'products.list.searchPlaceholder' | translate" 
                (input)="onSearchChange($event)"
                class="search-input">
            </div>
            <button 
              pButton 
              type="button" 
              icon="pi pi-search" 
              class="p-button-outlined search-btn"
              (click)="buscar()"
              [pTooltip]="'products.list.tooltipSearch' | translate"
              [attr.aria-label]="'products.list.tooltipSearch' | translate"
              tooltipPosition="top">
            </button>
            <button 
              pButton 
              type="button" 
              icon="pi pi-times" 
              class="p-button-text clear-btn"
              (click)="clear()"
              [pTooltip]="'products.list.tooltipClear' | translate"
              [attr.aria-label]="'products.list.tooltipClear' | translate"
              tooltipPosition="top">
            </button>
          </div>

          <p-dropdown
            [(ngModel)]="statusFilter"
            [options]="statusFilterOptions"
            optionLabel="label"
            optionValue="value"
            (onChange)="onStatusFilterChange()"
            [placeholder]="'products.list.filter.status' | translate"
            [attr.aria-label]="'products.list.filter.status' | translate"
            styleClass="status-filter">
          </p-dropdown>
          
          <div class="stats-container">
            <div class="stat-item">
              <div class="stat-number">{{ total }}</div>
              <div class="stat-label">{{ 'products.list.statTotal' | translate }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ getDisplayedCount() }}</div>
              <div class="stat-label">{{ 'products.list.statDisplaying' | translate }}</div>
            </div>
          </div>
        </div>
      </div>

      <p class="list-money-sources" *ngIf="listMoneySourcesLine">{{ listMoneySourcesLine }}</p>

      <!-- Products Table -->
      <div class="table-section">
        <div class="table-card">
          <app-list-data-states
            [loading]="loading"
            [itemCount]="total"
            [skeletonRows]="8"
            [skeletonCols]="9"
            [mountContentWhileLoading]="true"
            emptyTitleKey="products.list.empty.title"
            emptyDescriptionKey="products.list.empty.subtitle">
            <button emptyAction pButton type="button" [label]="'products.list.empty.btn' | translate"
                    icon="pi pi-plus" class="p-button-primary" (click)="addNew()"></button>
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
                    <span>{{ 'products.list.col.id' | translate }}</span>
                    <p-sortIcon field="id"></p-sortIcon>
                  </div>
                </th>
                <th class="col-photo">
                  <div class="header-cell">
                    <span>{{ 'products.list.col.photo' | translate }}</span>
                  </div>
                </th>
                <th pSortableColumn="name" class="col-name">
                  <div class="header-cell">
                    <span>{{ 'products.list.col.name' | translate }}</span>
                    <p-sortIcon field="name"></p-sortIcon>
                  </div>
                </th>
                <th class="col-manufacturer">
                  <div class="header-cell">
                    <span>{{ 'products.list.col.manufacturer' | translate }}</span>
                  </div>
                </th>
                <th pSortableColumn="isActive" class="col-status" style="width: 110px;">
                  <div class="header-cell">
                    <span>{{ 'products.list.col.status' | translate }}</span>
                    <p-sortIcon field="isActive"></p-sortIcon>
                  </div>
                </th>
                <th pSortableColumn="description" class="col-description">
                  <div class="header-cell">
                    <span>{{ 'products.list.col.description' | translate }}</span>
                    <p-sortIcon field="description"></p-sortIcon>
                  </div>
                </th>
                <th pSortableColumn="price" class="col-price">
                  <div class="header-cell">
                    <span>{{ 'products.list.col.price' | translate }}</span>
                    <p-sortIcon field="price"></p-sortIcon>
                  </div>
                </th>
                <th pSortableColumn="quantity" class="col-quantity">
                  <div class="header-cell">
                    <span>{{ 'products.list.col.quantity' | translate }}</span>
                    <p-sortIcon field="quantity"></p-sortIcon>
                  </div>
                </th>
                <th pSortableColumn="productpn" style="width: 150px;">
                  <div class="header-cell">
                    <span>{{ 'products.list.col.code' | translate }}</span>
                    <p-sortIcon field="productpn"></p-sortIcon>
                  </div>
                </th>
                <th class="col-barcode">
                  <div class="header-cell">
                    <span>{{ 'products.list.col.barcode' | translate }}</span>
                  </div>
                </th>
                <th class="col-actions">
                  <div class="header-cell">
                    <span>{{ 'products.list.col.actions' | translate }}</span>
                  </div>
                </th>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="body" let-row let-rowIndex="rowIndex">
              <tr class="table-row" (dblclick)="initRowEdit(row, $event)">
                <td>
                  <div class="id-cell">
                    <p-badge 
                      [value]="row.id" 
                      severity="info" 
                      badgeSize="small">
                    </p-badge>
                  </div>
                </td>
                
                <td class="col-photo">
                  <div class="photo-cell">
                    <div class="photo-preview" 
                         (click)="showPhotoModal(row)"
                         (mouseenter)="showHoverPreview(row, $event)"
                         (mouseleave)="hideHoverPreview(row)"
                         [class.has-photo]="hasRowPhoto(row)"
                         [class.no-photo]="!hasRowPhoto(row)">
                      <ng-container *ngIf="getRowPhotoPreview(row) as preview; else noPhotoTemplate">
                        <img 
                          [src]="preview" 
                          [alt]="'products.list.alt.productPhoto' | translate: { name: row.name || '-' }"
                          class="preview-image">
                      </ng-container>
                      <ng-template #noPhotoTemplate>
                        <div class="no-photo-placeholder">
                          <i class="pi pi-image"></i>
                          <span>{{ 'products.list.noPhoto' | translate }}</span>
                        </div>
                      </ng-template>
                    </div>
                  </div>
                </td>
                
                <td>
                  <div *ngIf="editingRow === row" class="edit-input-wrapper">
                    <input 
                      pInputText 
                      type="text" 
                      [(ngModel)]="editingRow.name"
                      [placeholder]="'products.list.placeholderName' | translate"
                      class="edit-input">
                  </div>
                  <div *ngIf="editingRow !== row" class="product-name">
                    <span class="name-text cell-truncate" [pTooltip]="row.name" tooltipPosition="top">{{ row.name || '-' }}</span>
                  </div>
                </td>

                <td>
                  <span class="cell-truncate" [pTooltip]="row.fabricanteNome" tooltipPosition="top">{{ row.fabricanteNome || '—' }}</span>
                </td>

                <td>
                  <p-tag
                    [severity]="row.isActive !== false ? 'success' : 'secondary'"
                    [value]="(row.isActive !== false ? 'products.list.status.active' : 'products.list.status.inactive') | translate">
                  </p-tag>
                </td>
                
                <td>
                  <div *ngIf="editingRow === row" class="edit-input-wrapper">
                    <input 
                      pInputText 
                      type="text" 
                      [(ngModel)]="editingRow.description"
                      [placeholder]="'products.list.placeholderDescription' | translate"
                      class="edit-input">
                  </div>
                  <div *ngIf="editingRow !== row" class="product-description">
                    <span class="description-text">{{ row.description || '-' }}</span>
                  </div>
                </td>
                
                <td>
                  <div class="price-cell">
                    <span class="price-text">{{ row.price | localeMoney:rowCurrency(row):listMoneyPipeOpts }}</span>
                  </div>
                </td>
                
                <td>
                  <div class="quantity-cell">
                    <span class="quantity-text">{{ row.quantity || 0 }}</span>
                  </div>
                </td>
                
                <td>
                  <div class="code-cell">
                    <span class="code-text">{{ row.productpn || '-' }}</span>
                  </div>
                </td>
                
                <td class="col-barcode">
                  <div class="barcode-cell" *ngIf="row.codigoBarras">
                    <div class="barcode-preview"
                         (click)="showBarcodeModal(row)"
                         (mouseenter)="onBarcodeHover($event, row)"
                         (mouseleave)="onBarcodeLeave()"
                         [pTooltip]="'products.list.tooltipBarcodeZoom' | translate"
                         tooltipPosition="top">
                      <app-barcode-svg
                        [code]="row.codigoBarras"
                        [barHeight]="32"
                        [barWidth]="1.1">
                      </app-barcode-svg>
                    </div>
                  </div>
                  <div class="barcode-cell" *ngIf="!row.codigoBarras">
                    <span class="no-barcode">-</span>
                  </div>
                </td>
                
                <td class="col-actions">
                  <div class="actions-cell">
                    <div *ngIf="editingRow !== row" class="action-buttons">
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-pencil" 
                        class="p-button-text edit-btn"
                        (click)="initRowEdit(row, $event)"
                        [pTooltip]="'products.list.tooltipEdit' | translate"
                        [attr.aria-label]="'products.list.tooltipEdit' | translate"
                        tooltipPosition="top">
                      </button>
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-ban" 
                        class="p-button-text delete-btn"
                        (click)="confirmDelete(row)"
                        [pTooltip]="'products.list.tooltipDelete' | translate"
                        [attr.aria-label]="'products.list.tooltipDelete' | translate"
                        tooltipPosition="top">
                      </button>
                    </div>
                    
                    <div *ngIf="editingRow === row" class="edit-buttons">
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-check" 
                        class="p-button-success save-btn"
                        (click)="save(row)"
                        [pTooltip]="'products.list.tooltipSave' | translate"
                        [attr.aria-label]="'products.list.tooltipSave' | translate"
                        tooltipPosition="top">
                      </button>
                      <button 
                        pButton 
                        type="button" 
                        icon="pi pi-times" 
                        class="p-button-text cancel-btn"
                        (click)="cancelRowEdit()"
                        [pTooltip]="'products.list.tooltipCancel' | translate"
                        [attr.aria-label]="'products.list.tooltipCancel' | translate"
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

    <!-- Confirmation Dialog -->
    <p-confirmDialog icon="pi pi-exclamation-triangle"></p-confirmDialog>

    <!-- Photo Modal -->
    <p-dialog 
      styleClass="as-hero-dialog photo-modal" [header]="'products.photoModal.title' | translate" 
      [(visible)]="photoModalVisible" 
      [modal]="true" 
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
     
      [style]="{width: '80vw', maxWidth: '800px'}"
      (onHide)="onPhotoModalHide()">
      
      <div class="photo-modal-content" *ngIf="selectedProduct">
        <div class="product-info">
          <h3>{{ selectedProduct.name }}</h3>
          <p class="product-description">{{ selectedProduct.description || ('products.photoModal.noDescription' | translate) }}</p>
          <div class="product-details">
            <span class="product-code">{{ 'products.photoModal.code' | translate }} {{ selectedProduct.productpn || 'N/A' }}</span>
            <span class="product-price">{{ selectedProduct.price | localeMoney:rowCurrency(selectedProduct):listMoneyPipeOpts }}</span>
          </div>
          <p class="list-money-sources list-money-sources--compact" *ngIf="listMoneySourcesLine">{{ listMoneySourcesLine }}</p>
        </div>
        
        <div class="photo-container">
          <!-- Foto atual (se existir) -->
          <div *ngIf="photoPreviewUrl && !loadingPhoto" class="current-photo-wrapper">
            <img 
              [src]="photoPreviewUrl" 
              [alt]="'products.photoModal.altLarge' | translate: { name: selectedProduct.name || '-' }"
              class="enlarged-photo">
            <div class="photo-overlay">
              <button 
                pButton 
                type="button" 
                icon="pi pi-refresh" 
                [label]="'products.photoModal.replace' | translate"
                class="p-button-primary replace-photo-btn"
                (click)="triggerFileInput()"
                [disabled]="uploadingPhoto"
                [pTooltip]="'products.photoModal.replaceTooltip' | translate"
                tooltipPosition="top">
              </button>
            </div>
          </div>
          
          <!-- Loading state -->
          <div *ngIf="loadingPhoto && !photoPreviewUrl" class="no-photo-large">
            <i class="pi pi-spin pi-spinner"></i>
            <p>{{ 'products.photoModal.loading' | translate }}</p>
          </div>
          
          <!-- Sem foto ou área de upload -->
          <div *ngIf="!photoPreviewUrl && !loadingPhoto" class="no-photo-large">
            <i class="pi pi-image"></i>
            <h4>{{ 'products.photoModal.noPhotoTitle' | translate }}</h4>
            <p>{{ 'products.photoModal.noPhotoText' | translate }}</p>
          </div>
          
          <!-- Área de upload (sempre visível quando não está fazendo upload) -->
          <div 
            *ngIf="!uploadingPhoto"
            class="upload-dropzone"
            [class.drag-over]="dragOver"
            [class.has-photo]="!!photoPreviewUrl"
            (click)="triggerFileInput()"
            (dragover)="onPhotoDragOver($event)"
            (dragleave)="onPhotoDragLeave($event)"
            (drop)="onPhotoDrop($event)">
            <i class="pi pi-upload"></i>
            <p *ngIf="!photoPreviewUrl">{{ 'products.photoModal.dropNoPhoto' | translate }}</p>
            <p *ngIf="photoPreviewUrl">{{ 'products.photoModal.dropReplace' | translate }}</p>
            <span class="dropzone-hint">{{ 'products.photoModal.formatsHint' | translate }}</span>
          </div>
          
          <!-- Estado de upload -->
          <div *ngIf="uploadingPhoto" class="upload-progress-container">
            <i class="pi pi-spin pi-spinner"></i>
            <p>{{ 'products.photoModal.uploading' | translate }}</p>
            <p class="upload-hint">{{ 'products.photoModal.uploadWait' | translate }}</p>
          </div>
          
          <input 
            #photoInput
            type="file" 
            accept="image/*"
            (change)="onPhotoSelected($event)"
            hidden>
        </div>
      </div>
    </p-dialog>
    
    <div 
      *ngIf="hoverPreview" 
      class="image-hover-preview" 
      [ngStyle]="{'top.px': hoverPreview.y, 'left.px': hoverPreview.x}">
      <img 
        [src]="hoverPreview.url" 
        [alt]="'products.hover.alt' | translate: { name: hoverPreview.name || '-' }" />
    </div>

    <!-- Barcode Modal - Modern Design -->
    <p-dialog 
      styleClass="as-hero-dialog barcode-modal-modern" [(visible)]="barcodeModalVisible" 
      [modal]="true" 
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [showHeader]="false"
     
      [style]="{width: '420px'}"
      (onHide)="onBarcodeModalHide()">
      
      <div class="barcode-modal-wrapper" *ngIf="selectedBarcodeProduct">
        <!-- Header com barra azul -->
        <div class="barcode-modal-header">
          <div class="header-content">
            <div class="header-icon">
              <i class="pi pi-barcode"></i>
            </div>
            <div class="header-text">
              <h3>{{ 'products.barcodeModal.title' | translate }}</h3>
              <span class="header-subtitle">{{ 'products.barcodeModal.subtitle' | translate }}</span>
            </div>
          </div>
          <button 
            type="button" 
            class="close-btn"
            (click)="barcodeModalVisible = false"
            [pTooltip]="'products.barcodeModal.closeTooltip' | translate"
            [attr.aria-label]="'products.barcodeModal.closeTooltip' | translate"
            tooltipPosition="left">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Conteúdo principal -->
        <div class="barcode-modal-body">
          <!-- Info do produto -->
          <div class="product-info-section">
            <div class="product-badge">
              <i class="pi pi-box"></i>
              <span>{{ 'products.barcodeModal.badgeProduct' | translate }}</span>
            </div>
            <h4 class="product-title">{{ selectedBarcodeProduct.name }}</h4>
            <div class="product-meta" *ngIf="selectedBarcodeProduct.productpn">
              <span class="meta-label">{{ 'products.barcodeModal.metaPn' | translate }}</span>
              <span class="meta-value">{{ selectedBarcodeProduct.productpn }}</span>
            </div>
          </div>

          <!-- Container do código de barras -->
          <div class="barcode-display-area">
            <div class="barcode-image-wrapper">
              <app-barcode-svg
                class="barcode-img"
                [code]="selectedBarcodeProduct.codigoBarras"
                [barHeight]="100"
                [barWidth]="1.4"
                [showValue]="true">
              </app-barcode-svg>
            </div>
            
            <!-- Número do código -->
            <div class="barcode-code-display">
              <span class="code-number">{{ selectedBarcodeProduct.codigoBarras }}</span>
            </div>
          </div>

          <!-- Ações -->
          <div class="barcode-modal-actions">
            <button 
              pButton 
              type="button" 
              icon="pi pi-copy" 
              [label]="'products.barcodeModal.copyCode' | translate"
              class="copy-action-btn"
              (click)="copyBarcodeToClipboard(selectedBarcodeProduct.codigoBarras)"
              [pTooltip]="'products.barcodeModal.copyTooltip' | translate"
              tooltipPosition="top">
            </button>
            <button 
              pButton 
              type="button" 
              icon="pi pi-print" 
              [label]="'products.barcodeModal.print' | translate"
              class="print-action-btn p-button-outlined"
              (click)="printBarcode(selectedBarcodeProduct)"
              [pTooltip]="'products.barcodeModal.printTooltip' | translate"
              tooltipPosition="top">
            </button>
          </div>
        </div>
      </div>
    </p-dialog>

    <!-- Barcode Hover Preview -->
    <div 
      *ngIf="barcodeHoverPreview" 
      class="barcode-hover-preview" 
      [ngStyle]="{'top.px': barcodeHoverPreview.y, 'left.px': barcodeHoverPreview.x}">
      <app-barcode-svg
        [code]="barcodeHoverPreview.codigo"
        [barHeight]="72"
        [barWidth]="1.25">
      </app-barcode-svg>
      <div class="barcode-hover-number">{{ barcodeHoverPreview.codigo }}</div>
    </div>
  `,
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;
  readonly listMoneyPipeOpts = { showFootnote: false };

  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;

  constructor(
    private api: ProductService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router,
    private i18n: TranslationService,
    private localeCurrency: LocaleCurrencyService
  ) {}

  get listMoneySourcesLine(): string {
    return this.localeCurrency.getCatalogPriceFootnote(null, 'USD');
  }

  rows: any[] = [];
  total = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  pageIndex = 0;
  sortField = 'id';
  sortOrder: 1 | -1 = 1;
  q = '';
  statusFilter: 'true' | 'false' | 'all' = 'true';
  statusFilterOptions: { label: string; value: 'true' | 'false' | 'all' }[] = [];
  loading = true;
  searching = false;
  editingRow: any = null;
  photoModalVisible = false;
  selectedProduct: any = null;
  uploadingPhoto = false;
  dragOver = false;
  loadingPhoto = false;
  photoPreviewUrl: string | null = null;
  private photoPreviewObjectUrl: string | null = null;
  private rowPhotoCache = new Map<number, string | null>();
  private rowPhotoObjectUrls = new Map<number, string>();
  hoverPreview: { id: number; url: string; name: string; x: number; y: number } | null = null;
  
  // Barcode modal
  barcodeModalVisible = false;
  selectedBarcodeProduct: any = null;
  barcodeHoverPreview: { codigo: string; x: number; y: number } | null = null;

  private searchSubject = new Subject<string>();
  private readonly requestGuard = createStaleRequestGuard();

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  ngOnInit() {
    this.statusFilterOptions = [
      { label: this.i18n.translate('products.list.filter.active'), value: 'true' },
      { label: this.i18n.translate('products.list.filter.inactive'), value: 'false' },
      { label: this.i18n.translate('products.list.filter.all'), value: 'all' },
    ];
    
    // Configurar busca em tempo real com debounce
    this.searchSubject.pipe(
      debounceTime(300), // Aguarda 300ms após o usuário parar de digitar
      distinctUntilChanged() // Só executa se o valor mudou
    ).subscribe(searchTerm => {
      this.q = searchTerm;
      this.loadLazy({ first: 0, rows: this.size });
    });
  }

  onSearchChange(event: any) {
    this.searching = true;
    this.searchSubject.next(event.target.value);
  }

  getStatusSeverity(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ATIVO':
      case 'EM_ESTOQUE':
        return 'success';
      case 'INATIVO':
      case 'FORA_ESTOQUE':
        return 'danger';
      case 'DESCONTINUADO':
        return 'warning';
      default:
        return 'success';
    }
  }

  toSort() {
    return `${this.sortField},${this.sortOrder === 1 ? 'asc' : 'desc'}`;
  }

  onStatusFilterChange(): void {
    this.loadLazy({ first: 0, rows: this.size });
  }

  reload() {
    const seq = this.requestGuard.bump();
    this.loading = true;
    const normalizedQ = normalizeDateSearchTerm(this.q) ?? this.q;
    this.api.list({ 
      page: this.pageIndex, 
      size: this.size, 
      sort: this.toSort(), 
      q: normalizedQ || undefined,
      isActive: this.statusFilter,
    }).subscribe(r => {
      if (this.requestGuard.isStale(seq)) {
        return;
      }
      this.rows = r.items;
      this.total = r.totalElements;
      this.size = r.size;
      this.pageIndex = r.page;
      this.loading = false;
      this.searching = false;
      this.prepareRowPhotos(this.rows);
      if (this.selectedProduct?.id) {
        const updated = r.items.find(item => item.id === this.selectedProduct.id);
        if (updated) {
          this.selectedProduct = updated;
          this.updatePhotoPreviewFromProduct(updated);
        } else {
          this.clearPhotoPreview();
          this.loadingPhoto = false;
        }
      } else {
        this.clearPhotoPreview();
        this.loadingPhoto = false;
      }
    });
  }

  loadLazy(e?: LazyLoadEvent) {
    const req = resolveLazyPageRequest(e, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    if (e?.sortField) this.sortField = e.sortField;
    if (e?.sortOrder) this.sortOrder = e.sortOrder;
    this.reload();
  }

  buscar() {
    this.pageIndex = 0;
    this.loadLazy({ first: 0, rows: this.size });
  }

  clear() {
    this.q = '';
    this.searchSubject.next('');
    this.loadLazy({ first: 0, rows: this.size });
  }

  initRowEdit(row: any, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    if (!row || !row.id) {
      console.error('Invalid product for edit:', row);
      this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'products.toast.editInvalid');
      return;
    }
    
    // Navegar para a tela de edição do produto usando rota absoluta
    this.router.navigate(['products', 'edit', row.id], { relativeTo: null }).then(
      (success) => {
        if (!success) {
          console.error('Navigation failed');
          this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'products.toast.editNavigateFail');
        }
      }
    ).catch(error => {
      console.error('Failed to navigate to edit:', error);
      const msg = error?.message || this.i18n.translate('products.toast.editNavigateError');
      this.i18n.addToastLiteralDetail(
        this.messageService,
        'error',
        'common.toast.error',
        this.i18n.translate('products.toast.editNavigateErrorDetail', { msg })
      );
    });
  }

  cancelRowEdit() {
    this.editingRow = null;
  }

  save(row: any) {
    if (!this.editingRow || !this.editingRow.id) return;
    
    this.loading = true;
    // Atualizar o objeto original com os valores editados
    Object.assign(row, this.editingRow);
    
    this.api.update(this.editingRow.id, this.editingRow).subscribe({
      next: () => {
        this.editingRow = null;
        this.reload();
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'products.toast.updateSuccess');
      },
      error: () => {
        this.loading = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'products.toast.updateError');
      }
    });
  }

  confirmDelete(row: any) {
    this.confirmationService.confirm({
      message: this.i18n.translate('products.confirm.inactivate.message', {
        name: String(row?.name ?? '')
      }),
      header: 'products.confirm.inactivate.header',
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
        this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'products.toast.inactivateSuccess');
      },
      error: () => {
        this.loading = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'products.toast.inactivateError');
      }
    });
  }

  addNew() {
    // Redirecionar para a tela de novo produto
    this.router.navigate(['/products/new']);
  }

  getDisplayedCount(): string {
    const total = this.total ?? 0;
    if (total === 0) return '0–0';
    
    const startIndex = (this.pageIndex || 0) * (this.size || 0) + 1;
    const endIndex = (this.pageIndex || 0) * (this.size || 0) + (this.rows?.length || 0);
    
    return `${startIndex}–${endIndex}`;
  }

  showPhotoModal(product: any) {
    this.clearPhotoPreview();
    this.loadingPhoto = false;
    this.selectedProduct = product;
    this.photoModalVisible = true;
    this.uploadingPhoto = false;
    this.dragOver = false;
    if (!product?.photoUrl && product?.id != null) {
      this.invalidateRowPhotoCache(product.id);
    }
    this.updatePhotoPreviewFromProduct(product);
  }

  rowCurrency(row: { local?: string | null } | null | undefined): ProductCurrency {
    return decodeProductLocal(row?.local).m ?? 'USD';
  }

  onPhotoModalHide() {
    this.photoModalVisible = false;
    this.clearPhotoPreview();
    this.loadingPhoto = false;
  }

  triggerFileInput() {
    if (this.uploadingPhoto) {
      return;
    }
    this.photoInput?.nativeElement.click();
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input?.files;
    if (files && files.length) {
      this.handlePhotoUpload(files);
    }
    if (input) {
      input.value = '';
    }
  }

  onPhotoDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onPhotoDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }

  onPhotoDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length) {
      this.handlePhotoUpload(files);
    }
  }

  private handlePhotoUpload(fileList: FileList | File[]) {
    if (!this.selectedProduct?.id) {
      this.i18n.addToast(this.messageService, 'warn', 'products.toast.photoNoProductSummary', 'products.toast.photoNoProduct');
      return;
    }

    const files = Array.from(fileList).filter(file => file.type.startsWith('image/'));

    if (!files.length) {
      this.i18n.addToast(this.messageService, 'warn', 'products.toast.photoInvalidSummary', 'products.toast.photoInvalidType');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    const oversized = files.find(file => file.size > MAX_SIZE);
    if (oversized) {
      this.i18n.addToast(this.messageService, 'warn', 'products.toast.photoTooLargeSummary', 'products.toast.photoTooLarge', {
        name: oversized.name
      });
      return;
    }

    this.uploadingPhoto = true;

    this.api.uploadPhoto(this.selectedProduct.id, files)
      .pipe(finalize(() => {
        this.uploadingPhoto = false;
      }))
      .subscribe({
        next: (response: any) => {
          // Atualizar photoUrl do produto com a resposta do backend
          if (response?.photoUrl) {
            this.selectedProduct.photoUrl = response.photoUrl;
          } else if (response?.data?.photoUrl) {
            this.selectedProduct.photoUrl = response.data.photoUrl;
          }
          
          this.i18n.addToast(this.messageService, 'success', 'products.toast.photoUploadSummary', 'products.toast.photoUploadSuccess');
          
          if (this.selectedProduct?.id != null) {
            this.invalidateRowPhotoCache(this.selectedProduct.id);
            // Atualizar o cache com a photoUrl persistente
            if (this.selectedProduct.photoUrl) {
              this.updateRowPhotoPreview(this.selectedProduct.id, this.selectedProduct.photoUrl);
              this.photoPreviewUrl = this.selectedProduct.photoUrl;
            }
          }
          
          // Recarregar a lista para atualizar os dados do backend
          this.reload();
        },
        error: (error) => {
          console.error('Failed to upload product image:', error);
          this.i18n.addToast(this.messageService, 'error', 'products.toast.photoUploadErrorSummary', 'products.toast.photoUploadError');
        }
      });
  }

  ngOnDestroy(): void {
    this.clearPhotoPreview();
    this.loadingPhoto = false;
    this.searchSubject.complete();
    this.clearRowPhotoCache();
    this.hoverPreview = null;
  }

  private loadPhotoPreview(productId: number) {
    // Primeiro verificar se já temos photoUrl no produto selecionado
    if (this.selectedProduct?.photoUrl) {
      let photoUrl = this.selectedProduct.photoUrl;
      
      // Se for um caminho relativo, construir URL completa
      if (!this.isAccessibleUrl(photoUrl)) {
        if (photoUrl.startsWith('/')) {
          photoUrl = `${environment.apiUrl}${photoUrl}`;
        } else if (!photoUrl.startsWith('http')) {
          photoUrl = `${environment.apiUrl}/${photoUrl}`;
        }
      }
      
      this.photoPreviewUrl = photoUrl;
      this.updateRowPhotoPreview(productId, photoUrl);
      this.loadingPhoto = false;
      return;
    }
    
    // Fallback: buscar via blob apenas se não houver photoUrl
    this.loadingPhoto = true;
    this.revokePhotoObjectUrl();
    this.api.getPhoto(productId)
      .pipe(finalize(() => {
        this.loadingPhoto = false;
      }))
      .subscribe({
        next: (blob) => {
          if (blob && blob.size > 0) {
            // Criar URL temporária apenas como último recurso
            this.photoPreviewObjectUrl = URL.createObjectURL(blob);
            this.photoPreviewUrl = this.photoPreviewObjectUrl;
            const rowUrl = this.createOrReplaceRowObjectUrl(productId, blob);
            this.updateRowPhotoPreview(productId, rowUrl);
          } else {
            const fallback = this.selectedProduct?.photoUrl ?? null;
            this.photoPreviewUrl = fallback;
            this.updateRowPhotoPreview(productId, fallback);
          }
        },
        error: (error) => {
          console.warn('Could not load product photo.', error);
          const fallback = this.selectedProduct?.photoUrl ?? null;
          this.photoPreviewUrl = fallback;
          this.updateRowPhotoPreview(productId, fallback);
        }
      });
  }

  private clearPhotoPreview() {
    this.revokePhotoObjectUrl();
    this.photoPreviewUrl = null;
  }

  private revokePhotoObjectUrl() {
    if (this.photoPreviewObjectUrl) {
      URL.revokeObjectURL(this.photoPreviewObjectUrl);
      this.photoPreviewObjectUrl = null;
    }
  }

  private updatePhotoPreviewFromProduct(product: any) {
    this.loadingPhoto = false;
    const id = product?.id;
    if (id != null) {
      if (this.rowPhotoCache.has(id)) {
        const cached = this.rowPhotoCache.get(id);
        this.revokePhotoObjectUrl();
        this.photoPreviewUrl = cached || null;
        return;
      }
    }

    // Priorizar photoUrl persistente do backend
    if (product?.photoUrl) {
      this.revokePhotoObjectUrl();
      let photoUrl = product.photoUrl;
      
      // Se for um caminho relativo, construir URL completa
      if (!this.isAccessibleUrl(photoUrl)) {
        if (photoUrl.startsWith('/')) {
          photoUrl = `${environment.apiUrl}${photoUrl}`;
        } else if (!photoUrl.startsWith('http')) {
          photoUrl = `${environment.apiUrl}/${photoUrl}`;
        }
      }
      
      this.photoPreviewUrl = photoUrl;
      if (id != null) {
        this.updateRowPhotoPreview(id, photoUrl);
      }
    } else if (id != null) {
      // Fallback: buscar via blob apenas se não houver photoUrl
      this.loadPhotoPreview(id);
    } else {
      this.clearPhotoPreview();
      this.loadingPhoto = false;
    }
  }

  private prepareRowPhotos(rows: any[]) {
    rows?.forEach(row => this.ensureRowPhoto(row));
  }

  private ensureRowPhoto(row: any) {
    const id = row?.id;
    if (!id) return;

    if (this.rowPhotoCache.has(id)) return;

    // Priorizar photoUrl persistente do backend
    if (row.photoUrl) {
      if (this.isAccessibleUrl(row.photoUrl)) {
        // URL completa (http/https) - usar diretamente
        this.updateRowPhotoPreview(id, row.photoUrl);
        return;
      } else if (row.photoUrl.startsWith('/') || row.photoUrl.startsWith('./')) {
        // Caminho relativo - construir URL completa
        const fullUrl = row.photoUrl.startsWith('/') 
          ? `${environment.apiUrl}${row.photoUrl}`
          : `${environment.apiUrl}/${row.photoUrl}`;
        this.updateRowPhotoPreview(id, fullUrl);
        return;
      } else {
        // Tentar usar como URL completa mesmo que não comece com http
        this.updateRowPhotoPreview(id, row.photoUrl);
        return;
      }
    }

    // Se não houver photoUrl, buscar via blob como fallback
    this.fetchRowPhoto(id);
  }

  private fetchRowPhoto(id: number) {
    this.api.getPhoto(id).subscribe({
      next: (blob) => {
        if (blob && blob.size > 0) {
          const url = this.createOrReplaceRowObjectUrl(id, blob);
          this.updateRowPhotoPreview(id, url);
        } else {
          this.updateRowPhotoPreview(id, null);
        }
      },
      error: () => {
        this.updateRowPhotoPreview(id, null);
      }
    });
  }

  private updateRowPhotoPreview(id: number, url: string | null) {
    this.rowPhotoCache.set(id, url);
    if (this.selectedProduct?.id === id && !this.photoPreviewObjectUrl) {
      this.photoPreviewUrl = url;
    }
  }

  private createOrReplaceRowObjectUrl(id: number, blob: Blob): string {
    const previous = this.rowPhotoObjectUrls.get(id);
    if (previous) {
      URL.revokeObjectURL(previous);
    }
    const url = URL.createObjectURL(blob);
    this.rowPhotoObjectUrls.set(id, url);
    return url;
  }

  private clearRowPhotoCache() {
    for (const url of this.rowPhotoObjectUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.rowPhotoObjectUrls.clear();
    this.rowPhotoCache.clear();
  }

  private isAccessibleUrl(url?: string | null): boolean {
    if (!url) return false;
    return /^https?:\/\//i.test(url);
  }

  private invalidateRowPhotoCache(id: number) {
    const existing = this.rowPhotoObjectUrls.get(id);
    if (existing) {
      URL.revokeObjectURL(existing);
      this.rowPhotoObjectUrls.delete(id);
    }
    this.rowPhotoCache.delete(id);
  }

  getRowPhotoPreview(row: any): string | null {
    const id = row?.id;
    if (!id) return null;
    const value = this.rowPhotoCache.get(id);
    return value ?? null;
  }

  hasRowPhoto(row: any): boolean {
    return !!this.getRowPhotoPreview(row);
  }

  showHoverPreview(row: any, event: MouseEvent) {
    const preview = this.getRowPhotoPreview(row);
    if (!preview) {
      this.hoverPreview = null;
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    const rect = target?.getBoundingClientRect();
    const spacing = 12;
    const previewWidth = 300;
    const previewHeight = 300;

    let left = rect ? rect.right + spacing : event.clientX + spacing;
    let top = rect ? rect.top : event.clientY;

    if (left + previewWidth > window.innerWidth - spacing) {
      left = (rect ? rect.left : event.clientX) - previewWidth - spacing;
    }

    if (top + previewHeight > window.innerHeight - spacing) {
      top = window.innerHeight - previewHeight - spacing;
    }

    if (top < spacing) {
      top = spacing;
    }

    this.hoverPreview = {
      id: row.id,
      url: preview,
      name: row.name,
      x: left,
      y: top
    };
  }

  hideHoverPreview(row: any) {
    if (!this.hoverPreview) return;
    if (!row?.id || this.hoverPreview.id === row.id) {
      this.hoverPreview = null;
    }
  }

  // ====== Barcode Methods ======

  /** PNG em base64 para impressão (renderização local, sem API). */
  private barcodePngDataUrl(code: string, _width: number, barHeight: number): string | null {
    const raw = (code ?? '').trim();
    if (!raw) return null;
    const canvas = document.createElement('canvas');
    try {
      const digits = raw.replace(/\D/g, '');
      let format: string = 'CODE128';
      let value = raw;
      if (digits.length === 12 || digits.length === 13) {
        format = 'EAN13';
        value = digits.length === 12 ? digits : digits;
      }
      JsBarcode(canvas, value, {
        format,
        width: 1.5,
        height: barHeight,
        displayValue: true,
        fontSize: 14,
        margin: 8
      });
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }

  showBarcodeModal(product: any) {
    this.selectedBarcodeProduct = product;
    this.barcodeModalVisible = true;
    this.barcodeHoverPreview = null;
  }

  onBarcodeModalHide() {
    this.barcodeModalVisible = false;
    this.selectedBarcodeProduct = null;
  }

  onBarcodeHover(event: MouseEvent, row: any) {
    if (!row?.codigoBarras) {
      this.barcodeHoverPreview = null;
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    const rect = target?.getBoundingClientRect();
    const spacing = 12;
    const previewWidth = 280;
    const previewHeight = 120;

    let left = rect ? rect.right + spacing : event.clientX + spacing;
    let top = rect ? rect.top - 20 : event.clientY - 20;

    // Ajustar se sair da tela à direita
    if (left + previewWidth > window.innerWidth - spacing) {
      left = (rect ? rect.left : event.clientX) - previewWidth - spacing;
    }

    // Ajustar se sair da tela embaixo
    if (top + previewHeight > window.innerHeight - spacing) {
      top = window.innerHeight - previewHeight - spacing;
    }

    // Ajustar se sair da tela em cima
    if (top < spacing) {
      top = spacing;
    }

    this.barcodeHoverPreview = {
      codigo: row.codigoBarras,
      x: left,
      y: top
    };
  }

  onBarcodeLeave() {
    this.barcodeHoverPreview = null;
  }

  printBarcode(product: any) {
    if (!product?.codigoBarras) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const barcodeUrl = this.barcodePngDataUrl(product.codigoBarras, 400, 120);
      if (!barcodeUrl) return;
      const title = this.i18n.translate('products.print.docTitle', { name: product.name || '' });
      const imgAlt = this.i18n.translate('products.print.imgAlt');
      const pnLine = product.productpn
        ? this.i18n.translate('products.print.metaPn', { pn: product.productpn })
        : '';
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                min-height: 100vh;
                padding: 20px;
              }
              .container {
                text-align: center;
                padding: 30px;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
              }
              .product-name {
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 8px;
              }
              .product-pn {
                font-size: 12px;
                color: #64748b;
                margin-bottom: 20px;
              }
              .barcode-img {
                max-width: 100%;
                height: auto;
                margin-bottom: 15px;
              }
              .barcode-number {
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: 700;
                letter-spacing: 3px;
                color: #1e293b;
              }
              @media print {
                body { padding: 0; }
                .container { border: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="product-name">${product.name}</div>
              ${product.productpn ? `<div class="product-pn">${pnLine}</div>` : ''}
              <img src="${barcodeUrl}" alt="${imgAlt}" class="barcode-img" onload="window.print();">
              <div class="barcode-number">${product.codigoBarras}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  copyBarcodeToClipboard(codigo: string) {
    if (!codigo) return;
    
    navigator.clipboard.writeText(codigo).then(() => {
      this.i18n.addToast(this.messageService, 'success', 'products.toast.copySummary', 'products.toast.copySuccess', {
        code: codigo
      });
    }).catch(() => {
      // Fallback para navegadores antigos
      const textArea = document.createElement('textarea');
      textArea.value = codigo;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      this.i18n.addToast(this.messageService, 'success', 'products.toast.copySummary', 'products.toast.copySuccess', {
        code: codigo
      });
    });
  }
}
