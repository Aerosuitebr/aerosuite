import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { environment } from '../../../environments/environment';
import { LocaleMoneyPipe } from '../../core/locale/locale-money.pipe';
import { LocaleCurrencyService } from '../../core/locale/locale-currency.service';
import { MoneyCurrency } from '../../core/locale/locale-region.config';
import { TranslatePipe } from '../../core/translate.pipe';

/**
 * Interface para Produto
 */
export interface Product {
  id: number;
  name: string;
  description?: string;
  productpn?: string;
  price?: number;
  quantity?: number;
  status?: string;
  local?: string;
  photoUrl?: string;
  idFabricante?: number;
}

/**
 * Interface para Item da Proposta (produto selecionado com quantidade e valor customizado)
 */
export interface PropostaItem {
  product: Product;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  produtoPn?: string; // P/N editável para este item
  produtoSn?: string; // S/N editável para este item
  observacao?: string;
}

@Component({
  selector: 'app-product-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TableModule,
    TagModule,
    TooltipModule,
    BadgeModule,
    ProgressSpinnerModule,
    LocaleMoneyPipe,
    TranslatePipe
  ],
  template: `
    <p-dialog 
      styleClass="as-hero-dialog product-selector-modal" [(visible)]="visible" 
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '95vw', maxWidth: '1000px', maxHeight: '90vh' }"
     
      (onShow)="onDialogShow()"
      (onHide)="onCancel()">
      
      <ng-template pTemplate="header">
        <div class="modal-header">
          <div class="header-icon">
            <i class="pi pi-box"></i>
          </div>
          <div class="header-content">
            <h2>{{ 'comercial.productSelector.hdrTitle' | translate }}</h2>
            <p>{{ 'comercial.productSelector.hdrSub' | translate }}</p>
          </div>
          <div class="cart-badge" *ngIf="selectedItems.length > 0">
            <i class="pi pi-shopping-cart"></i>
            <span class="badge">{{ selectedItems.length }}</span>
          </div>
        </div>
      </ng-template>

      <div class="selector-content">
        <!-- Barra de Busca -->
        <div class="search-section">
          <div class="search-wrapper">
            <i class="pi pi-search"></i>
            <input 
              pInputText 
              [(ngModel)]="searchTerm"
              [placeholder]="'comercial.productSelector.searchPh' | translate"
              class="search-input"
              (keyup.enter)="searchProducts()">
          </div>
          <button pButton 
                  type="button"
                  [label]="'comercial.productSelector.btnSearch' | translate" 
                  icon="pi pi-search"
                  (click)="searchProducts()"
                  [loading]="loading">
          </button>
        </div>

        <!-- Resultados da Busca -->
        <div class="results-section">
          <div class="results-header">
            <span class="results-count" *ngIf="!loading">
              {{ 'comercial.productSelector.resultsFound' | translate:{ n: '' + products.length } }}
            </span>
            <p class="rate-hint" *ngIf="proposalCurrency !== 'USD' && !carregandoRates">
              {{ rateHintText }}
            </p>
            <p class="rate-hint loading" *ngIf="carregandoRates">
              <i class="pi pi-spin pi-spinner"></i>
              {{ 'comercial.productSelector.loadingRates' | translate }}
            </p>
          </div>

          <div class="products-grid" *ngIf="!loading">
            <!-- Card para Produto Personalizado -->
            <div 
              class="product-card custom-product-card"
              (click)="openCustomProductDialog()">
              
              <div class="product-header">
                <div class="product-icon custom-icon">
                  <i class="pi pi-plus"></i>
                </div>
              </div>

              <div class="product-info">
                <h4 class="product-name">{{ 'comercial.productSelector.customTitle' | translate }}</h4>
                <p class="product-desc custom-desc">
                  {{ 'comercial.productSelector.customCardLead' | translate }}
                </p>
              </div>

              <div class="product-footer custom-footer">
                <span class="add-custom-label">
                  <i class="pi pi-pencil"></i> {{ 'comercial.productSelector.customCta' | translate }}
                </span>
              </div>
            </div>

            <!-- Cards dos produtos existentes -->
            <div 
              *ngFor="let product of products"
              class="product-card"
              [class.selected]="isProductSelected(product)"
              (click)="toggleProduct(product)">
              
              <div class="product-header">
                <div class="product-icon">
                  <i class="pi pi-box"></i>
                </div>
                <div class="selection-check" *ngIf="isProductSelected(product)">
                  <i class="pi pi-check"></i>
                </div>
              </div>

              <div class="product-info">
                <h4 class="product-name">{{ product.name }}</h4>
                <p class="product-pn" *ngIf="product.productpn">
                  <span class="label">{{ 'comercial.productSelector.lblPnShort' | translate }}</span> {{ product.productpn }}
                </p>
                <p class="product-desc" *ngIf="product.description">
                  {{ product.description | slice:0:80 }}{{ product.description && product.description.length > 80 ? '...' : '' }}
                </p>
              </div>

              <div class="product-footer">
                <span class="product-price" *ngIf="product.price">
                  {{ catalogPriceDisplay(product) | localeMoney:proposalCurrency:selectorMoneyOpts }}
                </span>
                <span class="product-price no-price" *ngIf="!product.price">
                  {{ 'comercial.productSelector.priceTbd' | translate }}
                </span>
                <p-tag 
                  *ngIf="product.quantity !== null && product.quantity !== undefined"
                  [value]="('comercial.productSelector.stock' | translate:{ n: '' + product.quantity })"
                  [severity]="product.quantity > 0 ? 'success' : 'danger'"
                  styleClass="stock-tag">
                </p-tag>
              </div>
            </div>
          </div>

          <!-- Estado vazio -->
          <div class="empty-state" *ngIf="!loading && products.length === 0 && searchTerm">
            <i class="pi pi-inbox"></i>
            <h3>{{ 'comercial.productSelector.emptySearchTitle' | translate }}</h3>
            <p>{{ 'comercial.productSelector.emptySearchSub' | translate }}</p>
          </div>

          <!-- Estado inicial -->
          <div class="initial-state" *ngIf="!loading && products.length === 0 && !searchTerm">
            <i class="pi pi-search"></i>
            <h3>{{ 'comercial.productSelector.initialTitle' | translate }}</h3>
            <p>{{ 'comercial.productSelector.initialSub' | translate }}</p>
          </div>

          <!-- Loading -->
          <div class="loading-state" *ngIf="loading">
            <p-progressSpinner 
              styleClass="custom-spinner"
              strokeWidth="3"
              animationDuration=".5s">
            </p-progressSpinner>
            <p>{{ 'comercial.productSelector.loading' | translate }}</p>
          </div>
        </div>

        <!-- Produtos Selecionados -->
        <div class="selected-section" *ngIf="selectedItems.length > 0">
          <div class="selected-header">
            <h3>
              <i class="pi pi-shopping-cart"></i>
              {{ 'comercial.productSelector.selectedTitle' | translate:{ n: '' + selectedItems.length } }}
            </h3>
            <span class="total-value">
              {{ 'comercial.productSelector.selectedTotal' | translate }} {{ getTotalValueDisplay() | localeMoney:proposalCurrency:selectorMoneyOpts }}
            </span>
          </div>

          <div class="selected-list">
            <div 
              *ngFor="let item of selectedItems; let i = index"
              class="selected-item">
              
              <div class="item-info">
                <span class="item-name">{{ item.product.name }}</span>
                <span class="item-pn" *ngIf="item.product.productpn">{{ 'comercial.productSelector.lblPnShort' | translate }} {{ item.product.productpn }}</span>
              </div>

              <div class="item-controls">
                <div class="control-group">
                  <label>{{ 'comercial.productSelector.qty' | translate }}</label>
                  <p-inputNumber 
                    [(ngModel)]="item.quantidade"
                    [min]="1"
                    [max]="999"
                    [showButtons]="true"
                    buttonLayout="horizontal"
                    spinnerMode="horizontal"
                    inputId="qty-{{i}}"
                    styleClass="qty-input"
                    (onInput)="updateItemTotal(item)">
                  </p-inputNumber>
                </div>

                <div class="control-group">
                  <label>{{ 'comercial.productSelector.unitCur' | translate:{ cur: proposalCurrency } }}</label>
                  <p-inputNumber 
                    [ngModel]="getItemUnitDisplay(item)"
                    (ngModelChange)="onItemUnitDisplayChange(item, $event)"
                    mode="currency"
                    [currency]="proposalCurrency"
                    [locale]="currencyInputLocale"
                    inputId="price-{{i}}"
                    styleClass="price-input">
                  </p-inputNumber>
                </div>

                <div class="item-total">
                  {{ getItemTotalDisplay(item) | localeMoney:proposalCurrency:selectorMoneyOpts }}
                </div>

                <button pButton 
                        type="button"
                        icon="pi pi-trash"
                        class="p-button-danger p-button-text p-button-sm"
                        [pTooltip]="'comercial.productSelector.tipRemove' | translate"
                        (click)="removeItem(item); $event.stopPropagation()">
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="modal-footer">
          <button pButton 
                  type="button"
                  [label]="'comercial.productSelector.btnCancel' | translate" 
                  icon="pi pi-times"
                  class="p-button-text"
                  (click)="onCancel()">
          </button>
          <button pButton 
                  type="button"
                  [label]="('comercial.productSelector.btnAdd' | translate:{ n: '' + selectedItems.length })"
                  icon="pi pi-check"
                  class="p-button-success"
                  [disabled]="selectedItems.length === 0"
                  (click)="onConfirm()">
          </button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Dialog para Produto Personalizado -->
    <p-dialog 
      styleClass="as-hero-dialog custom-product-dialog" [(visible)]="showCustomProductDialog" 
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [showHeader]="false"
      [style]="{ width: '450px' }"
     >
      
      <div class="custom-product-wrapper">
        <!-- Header -->
        <div class="custom-dialog-header">
          <div class="header-content">
            <div class="header-icon">
              <i class="pi pi-box"></i>
            </div>
            <div class="header-text">
              <h3>{{ 'comercial.productSelector.customDlgTitle' | translate }}</h3>
              <span>{{ 'comercial.productSelector.customDlgSub' | translate }}</span>
            </div>
          </div>
          <button type="button" class="close-btn" (click)="showCustomProductDialog = false">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Formulário -->
        <div class="custom-dialog-body">
          <div class="form-field">
            <label for="customName">{{ 'comercial.productSelector.customName' | translate }}</label>
            <input 
              pInputText 
              id="customName"
              [(ngModel)]="customProduct.name" 
              [placeholder]="'comercial.productSelector.customNamePh' | translate"
              class="w-full">
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="customPn">{{ 'comercial.productSelector.customPn' | translate }}</label>
              <input 
                pInputText 
                id="customPn"
                [(ngModel)]="customProduct.productpn" 
                [placeholder]="'comercial.productSelector.customPnPh' | translate"
                class="w-full">
            </div>
            <div class="form-field">
              <label for="customSn">{{ 'comercial.productSelector.customSn' | translate }}</label>
              <input 
                pInputText 
                id="customSn"
                [(ngModel)]="customProduct.productsn" 
                [placeholder]="'comercial.productSelector.customSnPh' | translate"
                class="w-full">
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="customQty">{{ 'comercial.productSelector.customQty' | translate }}</label>
              <p-inputNumber 
                id="customQty"
                [(ngModel)]="customProduct.quantidade"
                [min]="1"
                [max]="999"
                [showButtons]="true"
                buttonLayout="horizontal"
                spinnerMode="horizontal"
                styleClass="w-full">
              </p-inputNumber>
            </div>
            <div class="form-field">
              <label for="customPrice">{{ 'comercial.productSelector.customUnitCur' | translate:{ cur: proposalCurrency } }}</label>
              <p-inputNumber 
                id="customPrice"
                [(ngModel)]="customProduct.price"
                mode="currency"
                [currency]="proposalCurrency"
                [locale]="currencyInputLocale"
                styleClass="w-full">
              </p-inputNumber>
            </div>
          </div>

          <div class="form-field">
            <label for="customDesc">{{ 'comercial.productSelector.customDescLbl' | translate }}</label>
            <textarea 
              pInputText 
              id="customDesc"
              [(ngModel)]="customProduct.description" 
              [placeholder]="'comercial.productSelector.customDescPh' | translate"
              rows="3"
              class="w-full custom-textarea"></textarea>
          </div>

          <!-- Preview do Total -->
          <div class="custom-total-preview" *ngIf="customProduct.price && customProduct.quantidade">
            <span class="total-label">{{ 'comercial.productSelector.customTotalPrev' | translate }}</span>
            <span class="total-value">{{ customProduct.price * customProduct.quantidade | localeMoney:proposalCurrency:selectorMoneyOpts }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="custom-dialog-footer">
          <button pButton 
                  type="button"
                  [label]="'comercial.productSelector.btnCancel' | translate" 
                  icon="pi pi-times"
                  class="p-button-text"
                  (click)="showCustomProductDialog = false">
          </button>
          <button pButton 
                  type="button"
                  [label]="'comercial.productSelector.customBtnAdd' | translate" 
                  icon="pi pi-plus"
                  class="p-button-success"
                  [disabled]="!customProduct.name"
                  (click)="addCustomProduct()">
          </button>
        </div>
      </div>
    </p-dialog>
  `,
  styleUrls: ['./product-selector.component.scss']
})
export class ProductSelectorComponent implements OnInit {
  @Input() visible = false;
  @Input() existingItems: PropostaItem[] = [];
  /** Moeda de negociação da proposta — preços exibidos/editados nesta moeda; itens persistem valorUnitario em USD. */
  @Input() proposalCurrency: MoneyCurrency = 'USD';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() productsSelected = new EventEmitter<PropostaItem[]>();
  @Output() cancelled = new EventEmitter<void>();

  private http = inject(HttpClient);
  private readonly localeCurrency = inject(LocaleCurrencyService);

  readonly selectorMoneyOpts = { showFootnote: false };
  carregandoRates = false;

  products: Product[] = [];
  selectedItems: PropostaItem[] = [];
  searchTerm = '';
  loading = false;

  // Produto Personalizado
  showCustomProductDialog = false;
  customProduct: {
    name: string;
    productpn: string;
    productsn: string;
    description: string;
    price: number;
    quantidade: number;
  } = this.getEmptyCustomProduct();

  private customProductIdCounter = -1; // IDs negativos para produtos personalizados

  ngOnInit() {
    // Inicializar com itens existentes se houver
    if (this.existingItems && this.existingItems.length > 0) {
      this.selectedItems = [...this.existingItems];
    }
  }

  get currencyInputLocale(): string {
    switch (this.proposalCurrency) {
      case 'BRL':
        return 'pt-BR';
      case 'EUR':
        return 'de-DE';
      default:
        return 'en-US';
    }
  }

  get rateHintText(): string {
    return this.localeCurrency.getRateSourcesLine('USD');
  }

  onDialogShow() {
    this.ensureRates();
    if (this.products.length === 0) {
      this.loadInitialProducts();
    }
    if (this.existingItems && this.existingItems.length > 0) {
      this.selectedItems = this.existingItems.map((item) => ({ ...item }));
    }
  }

  private ensureRates(): void {
    if (this.proposalCurrency === 'USD') {
      return;
    }
    this.carregandoRates = true;
    this.localeCurrency.refreshRates().subscribe({
      next: () => {
        this.carregandoRates = false;
      },
      error: () => {
        this.carregandoRates = false;
      }
    });
  }

  private roundMoney(value: number, digits = 2): number {
    const f = 10 ** digits;
    return Math.round(value * f) / f;
  }

  catalogPriceDisplay(product: Product): number {
    return this.convertFromUsd(product.price ?? 0);
  }

  private convertFromUsd(usd: number): number {
    if (this.proposalCurrency === 'USD') {
      return usd;
    }
    return this.roundMoney(this.localeCurrency.convertBetween(usd, 'USD', this.proposalCurrency));
  }

  private convertToUsd(amount: number): number {
    if (this.proposalCurrency === 'USD') {
      return amount;
    }
    return this.roundMoney(this.localeCurrency.convertBetween(amount, this.proposalCurrency, 'USD'));
  }

  getItemUnitDisplay(item: PropostaItem): number {
    return this.convertFromUsd(item.valorUnitario || 0);
  }

  onItemUnitDisplayChange(item: PropostaItem, value: number | null): void {
    item.valorUnitario = this.convertToUsd(value ?? 0);
    this.updateItemTotal(item);
  }

  getItemTotalDisplay(item: PropostaItem): number {
    return this.convertFromUsd(item.valorTotal || 0);
  }

  getTotalValueDisplay(): number {
    return this.convertFromUsd(this.getTotalValue());
  }

  loadInitialProducts() {
    this.loading = true;
    const params = new HttpParams()
      .set('page', '0')
      .set('size', '20')
      .set('isActive', 'true');

    this.http.get<any>(`${environment.apiUrl}/products`, { params }).subscribe({
      next: (response) => {
        this.products = response.items || response.content || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.loading = false;
      }
    });
  }

  searchProducts() {
    this.loading = true;
    let params = new HttpParams()
      .set('page', '0')
      .set('size', '50')
      .set('isActive', 'true');

    if (this.searchTerm && this.searchTerm.trim()) {
      params = params.set('q', this.searchTerm.trim());
    }

    this.http.get<any>(`${environment.apiUrl}/products`, { params }).subscribe({
      next: (response) => {
        this.products = response.items || response.content || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to search products:', err);
        this.loading = false;
      }
    });
  }

  isProductSelected(product: Product): boolean {
    return this.selectedItems.some(item => item.product.id === product.id);
  }

  toggleProduct(product: Product) {
    const existingIndex = this.selectedItems.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      // Remover se já está selecionado
      this.selectedItems.splice(existingIndex, 1);
    } else {
      // Preço do cadastro de produtos já está em USD (campo price na API / tabela products).
      const valorUnitarioUsd = product.price ?? 0;
      const newItem: PropostaItem = {
        product: product,
        quantidade: 1,
        valorUnitario: valorUnitarioUsd,
        valorTotal: valorUnitarioUsd,
        produtoPn: product.productpn || '',
        produtoSn: ''
      };
      this.selectedItems.push(newItem);
    }
  }

  updateItemTotal(item: PropostaItem) {
    item.valorTotal = item.quantidade * item.valorUnitario;
  }

  removeItem(item: PropostaItem) {
    const index = this.selectedItems.indexOf(item);
    if (index >= 0) {
      this.selectedItems.splice(index, 1);
    }
  }

  getTotalValue(): number {
    return this.selectedItems.reduce((total, item) => total + item.valorTotal, 0);
  }

  // ========== PRODUTO PERSONALIZADO ==========

  getEmptyCustomProduct() {
    return {
      name: '',
      productpn: '',
      productsn: '',
      description: '',
      price: 0,
      quantidade: 1
    };
  }

  openCustomProductDialog() {
    this.customProduct = this.getEmptyCustomProduct();
    this.showCustomProductDialog = true;
  }

  addCustomProduct() {
    if (!this.customProduct.name) return;

    // Criar produto com ID negativo (personalizado)
    const product: Product = {
      id: this.customProductIdCounter--,
      name: this.customProduct.name,
      productpn: this.customProduct.productpn || '',
      description: this.customProduct.description || '',
      price: this.customProduct.price || 0
    };

    // Criar item da proposta
    const valorUnitarioUsd = this.convertToUsd(this.customProduct.price || 0);
    const quantidade = this.customProduct.quantidade || 1;

    const newItem: PropostaItem = {
      product: product,
      quantidade: quantidade,
      valorUnitario: valorUnitarioUsd,
      valorTotal: valorUnitarioUsd * quantidade,
      produtoPn: this.customProduct.productpn || '',
      produtoSn: this.customProduct.productsn || ''
    };

    this.selectedItems.push(newItem);
    this.showCustomProductDialog = false;
    this.customProduct = this.getEmptyCustomProduct();
  }

  onConfirm() {
    this.productsSelected.emit([...this.selectedItems]);
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onCancel() {
    this.cancelled.emit();
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
