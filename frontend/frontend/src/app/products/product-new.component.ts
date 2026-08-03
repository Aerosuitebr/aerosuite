import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { TranslatePipe } from '../core/translate.pipe';
import { ToastModule } from 'primeng/toast';
import { ProductService } from '../core/product.service';
import { TranslationService } from '../core/translation.service';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import { toastKey } from '../core/toast-i18n.util';
import { DialogModule } from 'primeng/dialog';
import { FabricanteService } from '../core/fabricantes.service';
import { LocaleMoneyPipe } from '../core/locale/locale-money.pipe';
import { environment } from '../../environments/environment';
import {
  decodeProductLocal,
  encodeProductLocal,
  PRODUCT_CODE_MAX,
  PRODUCT_NAME_MAX,
  PRODUCT_DESC_MAX,
  PRODUCT_NOTES_MAX,
  PRODUCT_SPEC_TEXT_MAX,
  PRODUCT_WEIGHT_MAX,
  FABRICANTE_NAME_MAX,
  ProductCurrency,
} from './product-meta.util';
import { isValidProductPn, normalizeProductPnInput, isDuplicateProductPn } from '../core/br-input.util';

interface FabricanteLocal {
  id: number;
  nome: string;
}

interface ProdutoLocal {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  productpn: string;
  status: string;
  idFabricante?: number;
}

interface NovoProduto {
  nome: string;
  codigo: string;
  descricao: string;
  fabricanteId: number;
  preco: number;
  estoque: number;
  ativo: boolean;
  observacoes: string;
}

@Component({
  selector: 'app-product-new',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    InputNumberModule,
    CheckboxModule,
    FileUploadModule,
    AutoCompleteModule,
    FormsModule,
    ToastModule,
    DialogModule,
    LocaleMoneyPipe,
    TranslatePipe,
    PageHeroComponent
  ],
  template: `
    
    <div class="as-page product-new-container">
      <app-page-hero
        variant="sky"
        [titleKey]="isEditMode ? 'products.new.titleEdit' : 'products.new.titleNew'"
        [subtitleKey]="isEditMode ? 'products.new.subtitleEdit' : 'products.new.subtitleNew'"
        titleIcon="pi-plus"
        [hasActions]="true">
        <div actions class="header-actions">
          <button
            pButton
            type="button"
            [label]="'common.actions.cancel' | translate"
            icon="pi pi-times"
            class="p-button-outlined"
            (click)="cancelar()">
          </button>
          <button
            pButton
            type="button"
            [label]="(isEditMode ? 'products.new.btnUpdate' : 'products.new.btnSave') | translate"
            [icon]="isEditMode ? 'pi pi-check' : 'pi pi-save'"
            class="p-button-primary"
            (click)="salvarProduto()">
          </button>
        </div>
      </app-page-hero>

      <div class="as-page-body">
      <div class="form-container">
        <div class="form-card">
          <h3>{{ 'products.new.form.section.basic' | translate }}</h3>
          
          <div class="form-grid">
            <!-- Código do Produto -->
            <div class="form-group">
              <label for="codigo">{{ 'products.new.form.label.code' | translate }}</label>
              <input 
                pInputText 
                id="codigo"
                [(ngModel)]="produto.codigo"
                (ngModelChange)="onCodigoInput()"
                [placeholder]="'products.new.form.placeholder.code' | translate"
                [maxlength]="productCodeMax"
                class="w-full"
                [class.p-invalid]="fieldInvalid('codigo')"
                required>
              <small class="field-hint">{{ 'products.new.form.hint.code' | translate }}</small>
              <small class="field-warn" *ngIf="codigoDuplicado">{{ 'products.new.form.warn.duplicatePn' | translate:{ pn: produto.codigo } }}</small>
            </div>

            <!-- Nome do Produto -->
            <div class="form-group">
              <label for="nome">{{ 'products.new.form.label.name' | translate }}</label>
              <input 
                pInputText 
                id="nome"
                [(ngModel)]="produto.nome"
                (ngModelChange)="onFormChange()"
                [placeholder]="'products.new.form.placeholder.name' | translate"
                [maxlength]="productNameMax"
                class="w-full"
                [class.p-invalid]="fieldInvalid('nome')"
                required>
              <small class="char-counter">{{ produto.nome.length }}/{{ productNameMax }}</small>
            </div>

            <!-- Fabricante -->
            <div class="form-group">
              <label for="fabricante">{{ 'products.new.form.label.manufacturer' | translate }}</label>
              <p-dropdown 
                id="fabricante"
                [options]="fabricantes"
                [(ngModel)]="produto.fabricanteId"
                (ngModelChange)="onFormChange()"
                [placeholder]="'products.new.form.placeholder.manufacturer' | translate"
                optionLabel="nome"
                optionValue="id"
                class="w-full fabricante-dropdown"
                [class.p-invalid]="fieldInvalid('fabricante')"
                required>
                <ng-template pTemplate="selectedItem" let-selected>
                  <span class="fabricante-label-truncate" [title]="selected?.nome">{{ selected?.nome }}</span>
                </ng-template>
                <ng-template pTemplate="item" let-item>
                  <span class="fabricante-label-truncate" [title]="item.nome">{{ item.nome }}</span>
                </ng-template>
              </p-dropdown>
              <button
                type="button"
                pButton
                class="p-button-text p-button-sm fabricante-quick-add"
                [label]="'products.new.form.action.addManufacturer' | translate"
                icon="pi pi-plus"
                (click)="openFabricanteDialog()">
              </button>
            </div>

            <p-dialog
              [(visible)]="fabricanteDialogVisible"
              [modal]="true"
              [header]="'products.new.dialog.addManufacturer.title' | translate"
              [style]="{ width: 'min(420px, 96vw)' }"
              [draggable]="false"
              [resizable]="false">
              <div class="form-group">
                <label for="novoFabricanteNome">{{ 'formsMisc.fabricante.labelNovoNome' | translate }}</label>
                <input
                  pInputText
                  id="novoFabricanteNome"
                  [(ngModel)]="novoFabricanteNome"
                  [placeholder]="'formsMisc.fabricante.placeholderNovoNome' | translate"
                  [maxlength]="fabricanteNomeMax"
                  class="w-full"
                  (keyup.enter)="saveNovoFabricante()" />
              </div>
              <ng-template pTemplate="footer">
                <button
                  type="button"
                  pButton
                  class="p-button-text"
                  [label]="'common.actions.cancel' | translate"
                  (click)="fabricanteDialogVisible = false">
                </button>
                <button
                  type="button"
                  pButton
                  [label]="'products.new.dialog.addManufacturer.save' | translate"
                  icon="pi pi-check"
                  [loading]="savingFabricante"
                  (click)="saveNovoFabricante()">
                </button>
              </ng-template>
            </p-dialog>

            <!-- Moeda do preço -->
            <div class="form-group">
              <label for="moeda">{{ 'products.new.form.label.currency' | translate }}</label>
              <p-dropdown
                id="moeda"
                [options]="moedaOpcoes"
                [(ngModel)]="moedaPreco"
                (ngModelChange)="onFormChange()"
                optionLabel="label"
                optionValue="value"
                class="w-full">
              </p-dropdown>
            </div>

            <!-- Preço -->
            <div class="form-group">
              <label for="preco">{{ 'products.new.form.label.priceWithCurrency' | translate:{ currency: moedaPreco } }}</label>
              <p-inputNumber 
                id="preco"
                [(ngModel)]="produto.preco"
                (ngModelChange)="onPrecoUserChange($event)"
                [min]="0"
                [max]="999999.99"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                [useGrouping]="false"
                [placeholder]="'products.new.form.placeholder.price' | translate"
                class="w-full"
                [class.p-invalid]="fieldInvalid('preco')"
                required>
              </p-inputNumber>
            </div>

            <!-- Estoque Inicial -->
            <div class="form-group">
              <label for="estoque">{{ 'products.new.form.label.stock' | translate }}</label>
              <p-inputNumber 
                id="estoque"
                [(ngModel)]="produto.estoque"
                (ngModelChange)="onEstoqueUserChange($event)"
                [min]="0"
                [max]="999999"
                [placeholder]="'products.new.form.placeholder.stock' | translate"
                class="w-full"
                [class.p-invalid]="fieldInvalid('estoque')"
                required>
              </p-inputNumber>
            </div>
          </div>

          <!-- Descrição -->
          <div class="form-group">
            <label for="descricao">{{ 'products.new.form.label.description' | translate }}</label>
            <textarea 
              pInputTextarea 
              id="descricao"
              [(ngModel)]="produto.descricao"
              [placeholder]="'products.new.form.placeholder.description' | translate"
              [maxlength]="productDescMax"
              rows="4"
              class="w-full product-textarea">
            </textarea>
            <small class="char-counter">{{ produto.descricao.length }}/{{ productDescMax }}</small>
          </div>

          <!-- Observações -->
          <div class="form-group">
            <label for="observacoes">{{ 'products.new.form.label.notes' | translate }}</label>
            <textarea 
              pInputTextarea 
              id="observacoes"
              [(ngModel)]="produto.observacoes"
              [placeholder]="'products.new.form.placeholder.notes' | translate"
              [maxlength]="productNotesMax"
              rows="3"
              class="w-full product-textarea">
            </textarea>
            <small class="char-counter">{{ produto.observacoes.length }}/{{ productNotesMax }}</small>
          </div>

          <!-- Status -->
          <div class="form-group">
            <div class="checkbox-group">
              <p-checkbox 
                [(ngModel)]="produto.ativo"
                [binary]="true"
                inputId="ativo">
              </p-checkbox>
              <label for="ativo">{{ 'products.new.form.label.active' | translate }}</label>
            </div>
          </div>
        </div>

        <!-- Upload de Imagens -->
        <div class="form-card">
          <h3>{{ 'products.new.form.section.images' | translate }}</h3>
          <div *ngIf="existingPhotoUrl" class="existing-photo">
            <p class="existing-photo__label">{{ 'products.new.form.existingPhoto' | translate }}</p>
            <img [src]="existingPhotoPreview" [attr.alt]="'products.new.form.existingPhoto' | translate" class="existing-photo__img" />
            <button
              type="button"
              pButton
              class="p-button-text p-button-sm"
              icon="pi pi-times"
              [label]="'products.new.form.removePhoto' | translate"
              (click)="clearExistingPhoto()">
            </button>
          </div>
          <div *ngIf="selectedImagePreviews.length" class="selected-previews">
            <p class="selected-previews__label">{{ 'products.new.form.previewSelected' | translate }}</p>
            <div class="selected-previews__grid">
              <div *ngFor="let preview of selectedImagePreviews; let i = index" class="selected-previews__item">
                <img [src]="preview" alt="" />
                <button type="button" pButton icon="pi pi-times" class="p-button-text p-button-sm" (click)="removeSelectedImage(i)"></button>
              </div>
            </div>
          </div>
          <p-fileUpload 
            #photoUpload
            mode="basic"
            name="imagens[]"
            accept="image/*"
            maxFileSize="5000000"
            [multiple]="true"
            [chooseLabel]="'products.new.form.upload.choose' | translate"
            [cancelLabel]="'products.new.form.upload.cancel' | translate"
            (onSelect)="onImagensSelecionadas($event)"
            class="w-full">
          </p-fileUpload>
          <p class="upload-info">
            <i class="pi pi-info-circle"></i>
            {{ 'products.new.form.upload.info' | translate }}
          </p>
        </div>

        <!-- Especificações Técnicas -->
        <div class="form-card">
          <h3>{{ 'products.new.form.section.specs' | translate }}</h3>
          <div class="specs-grid">
            <div class="spec-item">
              <label for="peso">{{ 'products.new.form.label.weight' | translate }}</label>
              <p-inputNumber 
                id="peso"
                [(ngModel)]="especificacoes.peso"
                [min]="0"
                [max]="productWeightMax"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                [placeholder]="'products.new.form.placeholder.price' | translate"
                class="w-full">
              </p-inputNumber>
            </div>
            <div class="spec-item">
              <label for="largura">{{ 'products.new.form.label.width' | translate }}</label>
              <p-inputNumber
                id="largura"
                [(ngModel)]="especificacoes.largura"
                [min]="0"
                [max]="99999"
                [minFractionDigits]="0"
                [maxFractionDigits]="2"
                [useGrouping]="false"
                [placeholder]="'products.new.form.placeholder.dimension' | translate"
                class="w-full">
              </p-inputNumber>
            </div>
            <div class="spec-item">
              <label for="altura">{{ 'products.new.form.label.height' | translate }}</label>
              <p-inputNumber
                id="altura"
                [(ngModel)]="especificacoes.altura"
                [min]="0"
                [max]="99999"
                [minFractionDigits]="0"
                [maxFractionDigits]="2"
                [useGrouping]="false"
                [placeholder]="'products.new.form.placeholder.dimension' | translate"
                class="w-full">
              </p-inputNumber>
            </div>
            <div class="spec-item">
              <label for="profundidade">{{ 'products.new.form.label.depth' | translate }}</label>
              <p-inputNumber
                id="profundidade"
                [(ngModel)]="especificacoes.profundidade"
                [min]="0"
                [max]="99999"
                [minFractionDigits]="0"
                [maxFractionDigits]="2"
                [useGrouping]="false"
                [placeholder]="'products.new.form.placeholder.dimension' | translate"
                class="w-full">
              </p-inputNumber>
            </div>
            <div class="spec-item">
              <label for="material">{{ 'products.new.form.label.material' | translate }}</label>
              <input 
                pInputText 
                id="material"
                [(ngModel)]="especificacoes.material"
                [placeholder]="'products.new.form.placeholder.material' | translate"
                [maxlength]="productSpecTextMax"
                class="w-full">
            </div>
            <div class="spec-item">
              <label for="cor">{{ 'products.new.form.label.color' | translate }}</label>
              <input 
                pInputText 
                id="cor"
                [(ngModel)]="especificacoes.cor"
                [placeholder]="'products.new.form.placeholder.color' | translate"
                [maxlength]="productSpecTextMax"
                class="w-full">
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  `,
  styleUrls: ['./product-new.component.scss']
})
export class ProductNewComponent implements OnInit, OnDestroy {
  readonly productNewUsdOpts = { showFootnote: true, footnoteStyle: 'short' as const };
  readonly productCodeMax = PRODUCT_CODE_MAX;
  readonly productNameMax = PRODUCT_NAME_MAX;
  readonly productDescMax = PRODUCT_DESC_MAX;
  readonly fabricanteNomeMax = FABRICANTE_NAME_MAX;
  readonly productNotesMax = PRODUCT_NOTES_MAX;
  readonly productSpecTextMax = PRODUCT_SPEC_TEXT_MAX;
  readonly productWeightMax = PRODUCT_WEIGHT_MAX;

  private loadedProductId: number | null = null;
  private precoTouched = false;
  private estoqueTouched = false;
  formAttempted = false;

  @ViewChild('photoUpload') photoUpload?: FileUpload;

  readonly moedaOpcoes: { label: string; value: ProductCurrency }[] = [
    { label: 'USD', value: 'USD' },
    { label: 'BRL', value: 'BRL' },
    { label: 'EUR', value: 'EUR' },
  ];
  moedaPreco: ProductCurrency = 'USD';

  produto: NovoProduto = {
    nome: '',
    codigo: '',
    descricao: '',
    fabricanteId: 0,
    preco: 0,
    estoque: 0,
    ativo: true,
    observacoes: ''
  };
  
  // Variável para debug - mostrar valores no template
  debugInfo: any = {};

  fabricantes: FabricanteLocal[] = [];
  fabricanteDialogVisible = false;
  novoFabricanteNome = '';
  savingFabricante = false;
  produtosExistentes: ProdutoLocal[] = [];
  produtosFiltrados: ProdutoLocal[] = [];
  produtoSelecionado: ProdutoLocal | null = null;
  buscaProduto: string = '';

  isEditMode = false;
  productId: number | null = null;
  
  // Especificações técnicas
  especificacoes = {
    peso: 0,
    largura: null as number | null,
    altura: null as number | null,
    profundidade: null as number | null,
    material: '',
    cor: ''
  };
  
  // Imagens selecionadas para upload
  imagensSelecionadas: File[] = [];
  selectedImagePreviews: string[] = [];
  existingPhotoUrl: string | null = null;
  clearPhotoOnSave = false;
  
  // Getter para validação do formulário (reavaliado automaticamente)
  get isFormValid(): boolean {
    return this.formularioValido();
  }

  get existingPhotoPreview(): string {
    if (!this.existingPhotoUrl) {
      return '';
    }
    if (this.existingPhotoUrl.startsWith('http://') || this.existingPhotoUrl.startsWith('https://')) {
      return this.existingPhotoUrl;
    }
    if (this.existingPhotoUrl.startsWith('/')) {
      return `${environment.apiUrl}${this.existingPhotoUrl}`;
    }
    return this.existingPhotoUrl;
  }

  constructor(
    private productService: ProductService,
    private fabricanteService: FabricanteService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private i18n: TranslationService
  ) {}

  ngOnInit() {
    // Verificar se está em modo de edição usando snapshot primeiro
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.productId = +id;
    }

    // Também escutar mudanças nos parâmetros (caso navegue entre produtos)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = +params['id'];
        if (this.productId) {
          this.carregarProdutoParaEdicao(this.productId);
        }
      } else {
        this.isEditMode = false;
        this.productId = null;
      }
    });

    // Carregar fabricantes primeiro, depois produtos
    this.carregarFabricantes();
    this.carregarProdutosExistentes();
    
    // Se já temos o ID do snapshot, carregar o produto (route.params também dispara)
    if (id && this.productId && this.loadedProductId !== this.productId) {
      this.carregarProdutoParaEdicao(this.productId);
    }
  }

  get codigoDuplicado(): boolean {
    return this.isPnDuplicate(this.produto.codigo);
  }

  onCodigoInput(): void {
    this.produto.codigo = normalizeProductPnInput(this.produto.codigo);
    this.onFormChange();
  }

  carregarProdutoParaEdicao(id: number) {
    if (this.loadedProductId === id) {
      return;
    }
    this.loadedProductId = id;
    this.productService.getById(id).subscribe({
      next: (produto) => {
        // Preencher o formulário com os dados do produto
        this.produto = {
          nome: produto.name || '',
          codigo: produto.productpn || '',
          descricao: produto.description || '',
          fabricanteId: produto.idFabricante || 0,
          preco: produto.price || 0,
          estoque: produto.quantity || 0,
          ativo: produto.status === 'ATIVO' || produto.isActive === true,
          observacoes: ''
        };
        const meta = decodeProductLocal(produto.local);
        this.moedaPreco = meta.m ?? 'USD';
        this.especificacoes = {
          peso: meta.pw ?? 0,
          largura: meta.w ?? null,
          altura: meta.h ?? null,
          profundidade: meta.d ?? null,
          material: meta.mt ?? '',
          cor: meta.cr ?? ''
        };
        if (meta.obs) {
          this.produto.observacoes = meta.obs;
        }
        this.existingPhotoUrl = produto.photoUrl || null;
        
        // Carregar produto selecionado se houver productpn
        if (produto.productpn) {
          this.produtoSelecionado = {
            id: produto.id || 0,
            name: produto.name || '',
            description: produto.description || '',
            price: produto.price || 0,
            quantity: produto.quantity || 0,
            productpn: produto.productpn,
            status: produto.status || 'ATIVO',
            idFabricante: produto.idFabricante
          };
          this.buscaProduto = produto.name || '';
        }
        
        // Forçar detecção de mudanças para atualizar o estado do botão
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        
        // Garantir que o botão seja habilitado após carregar os dados
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      },
      error: () => {
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'products.new.toast.loadEditError');
        this.router.navigate(['/products']);
      }
    });
  }

  carregarProdutosExistentes() {
    this.productService.list({ page: 0, size: 1000 }).subscribe({
      next: (response) => {
        
        this.produtosExistentes = (response.items || []).map(produto => {
          const produtoMapeado = {
            id: produto.id || 0,
            name: produto.name || '',
            description: produto.description || '',
            price: produto.price || 0,
            quantity: produto.quantity || 0,
            productpn: produto.productpn || '',
            status: produto.status || 'ATIVO',
            idFabricante: produto.idFabricante || undefined
          };
          return produtoMapeado;
        });
        
      },
      error: (error) => {
        console.error('❌ Failed to load existing products:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'products.new.toast.loadExistingError');
      }
    });
  }

  carregarFabricantes() {
    // Carregar todos os fabricantes (size grande para pegar todos)
    this.fabricanteService.list({ page: 0, size: 9999, sort: 'nome,asc' }).subscribe({
      next: (response) => {
        this.fabricantes = (response.items || []).map(fabricante => ({
          id: fabricante.id || 0,
          nome: fabricante.nome || ''
        }));
      },
      error: (error) => {
        console.error('Failed to load manufacturers:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'products.new.toast.loadManufacturersError');
      }
    });
  }

  openFabricanteDialog(): void {
    this.novoFabricanteNome = '';
    this.fabricanteDialogVisible = true;
  }

  saveNovoFabricante(): void {
    const nome = this.novoFabricanteNome?.trim().toUpperCase();
    if (!nome) {
      toastKey(this.messageService, this.i18n, 'warn', 'common.toast.warning', 'formsMisc.fabricante.errorNovoNomeRequired');
      return;
    }
    this.savingFabricante = true;
    this.fabricanteService.create({ nome }).subscribe({
      next: (created) => {
        this.savingFabricante = false;
        this.fabricanteDialogVisible = false;
        const id = created?.id ?? 0;
        if (id) {
          this.fabricantes = [...this.fabricantes, { id, nome: created.nome || nome }].sort((a, b) =>
            a.nome.localeCompare(b.nome),
          );
          this.produto.fabricanteId = id;
          this.onFormChange();
        } else {
          this.carregarFabricantes();
        }
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'products.new.toast.manufacturerCreated');
      },
      error: (error) => {
        this.savingFabricante = false;
        toastKey(
          this.messageService,
          this.i18n,
          'error',
          'common.toast.error',
          'products.new.toast.manufacturerCreateError',
          { msg: extractApiErrorMessage(error, this.i18n, 'common.unknownError') },
        );
      },
    });
  }

  onBuscaProdutoChange(value: any) {
    // Garantir que sempre seja string
    if (typeof value === 'string') {
      this.buscaProduto = value;
    } else if (value && typeof value === 'object' && value.name) {
      // Se receber um objeto, extrair o nome e selecionar o produto
      this.buscaProduto = value.name;
      this.selecionarProduto(value);
    } else {
      this.buscaProduto = '';
    }
  }

  filtrarProdutos(event: any) {
    const query = typeof event.query === 'string' ? event.query.toLowerCase() : '';
    
    if (!query || query.length < 2) {
      this.produtosFiltrados = [];
      return;
    }
    
    this.produtosFiltrados = this.produtosExistentes.filter(produto => 
      (produto.name && produto.name.toLowerCase().includes(query)) ||
      (produto.description && produto.description.toLowerCase().includes(query)) ||
      (produto.productpn && produto.productpn.toLowerCase().includes(query))
    );
    
  }

  selecionarProdutoDireto(produto: ProdutoLocal) {
    this.preencherFormularioComProduto(produto);
  }

  selecionarProduto(event: any) {
    
    // O evento pode vir como objeto ou como valor string
    let produto: ProdutoLocal | null = null;
    
    if (typeof event === 'string') {
      // Se veio como string, buscar o produto completo na lista filtrada primeiro, depois na lista completa
      produto = this.produtosFiltrados.find(p => 
        p.name === event || 
        p.productpn === event ||
        (p.name && p.name.toLowerCase() === event.toLowerCase())
      ) || this.produtosExistentes.find(p => 
        p.name === event || 
        p.productpn === event ||
        (p.name && p.name.toLowerCase() === event.toLowerCase())
      ) || null;
    } else if (event && typeof event === 'object' && event.id) {
      // Se veio como objeto, usar diretamente
      produto = event as ProdutoLocal;
    }
    
    if (!produto) {
      console.error('❌ Product not found. Event:', event);
      return;
    }
    
    this.preencherFormularioComProduto(produto);
  }

  private preencherFormularioComProduto(produto: ProdutoLocal) {
    
    // Criar uma nova referência do objeto produto
    this.produtoSelecionado = { ...produto };
    
    // IMPORTANTE: Atualizar o campo de busca PRIMEIRO com apenas o nome (string)
    // Isso evita que o AutoComplete mostre [object Object]
    this.buscaProduto = produto.name || '';
    
    // Preencher campos do formulário - criar novo objeto para garantir detecção de mudanças
    this.produto = {
      ...this.produto,
      nome: produto.name || '',
      codigo: produto.productpn || '',
      descricao: produto.description || '',
      preco: produto.price ? Number(produto.price) : 0,
      estoque: produto.quantity ? Number(produto.quantity) : 0,
      fabricanteId: 0, // Será preenchido abaixo se disponível
      ativo: true,
      observacoes: ''
    };
    
    // Preencher fabricante se disponível
    if (produto.idFabricante) {
      const fabricanteExiste = this.fabricantes.find(f => f.id === produto.idFabricante);
      if (fabricanteExiste) {
        this.produto.fabricanteId = Number(produto.idFabricante);
      } else {
        console.warn(`⚠️ Manufacturer with ID ${produto.idFabricante} not found`);
        // Tentar carregar fabricantes novamente se ainda não foram carregados
        if (this.fabricantes.length === 0) {
          this.carregarFabricantes();
          setTimeout(() => {
            const fabricante = this.fabricantes.find(f => f.id === produto.idFabricante);
            if (fabricante) {
              this.produto.fabricanteId = Number(produto.idFabricante);
              this.cdr.detectChanges();
            }
          }, 500);
        }
      }
    }
    
    // Forçar detecção de mudanças múltiplas vezes para garantir
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    
    // Verificar novamente após um ciclo
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 50);
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 200);
    
    toastKey(
      this.messageService,
      this.i18n,
      'success',
      'products.new.toast.productSelectedSummary',
      'products.new.toast.productSelected',
      { name: produto.name || '' }
    );
  }

  limparSelecao() {
    this.produtoSelecionado = null;
    this.buscaProduto = '';
    
    // Criar novo objeto para garantir detecção de mudanças
    this.produto = {
      nome: '',
      codigo: '',
      descricao: '',
      fabricanteId: 0,
      preco: 0,
      estoque: 0,
      ativo: true,
      observacoes: ''
    };
    this.precoTouched = false;
    this.estoqueTouched = false;
    
    this.cdr.detectChanges();
  }

  onPrecoUserChange(value: number | null): void {
    this.precoTouched = true;
    this.produto.preco = value ?? 0;
    this.onFormChange();
  }

  onEstoqueUserChange(value: number | null): void {
    this.estoqueTouched = true;
    this.produto.estoque = value ?? 0;
    this.onFormChange();
  }

  onFormChange() {
    // Forçar detecção de mudanças quando o formulário é alterado
    this.cdr.markForCheck();
  }

  fieldInvalid(field: 'codigo' | 'nome' | 'fabricante' | 'preco' | 'estoque'): boolean {
    if (!this.formAttempted) {
      return false;
    }
    switch (field) {
      case 'codigo':
        return !this.produto.codigo?.trim() || this.codigoDuplicado;
      case 'nome':
        return !this.produto.nome?.trim();
      case 'fabricante':
        return !this.produto.fabricanteId || this.produto.fabricanteId <= 0;
      case 'preco':
        return this.produto.preco == null || this.produto.preco < 0;
      case 'estoque':
        return this.produto.estoque == null || this.produto.estoque < 0;
      default:
        return false;
    }
  }

  formularioValido(): boolean {
    // Em modo de edição, validar de forma mais flexível
    if (this.isEditMode) {
      // Para edição, nome e código são obrigatórios
      return !!(
        this.produto.nome &&
        this.produto.nome.trim().length > 0 &&
        this.produto.codigo &&
        this.produto.codigo.trim().length > 0
      );
    }
    
    // Para criação, validar todos os campos obrigatórios
    return !!(
      this.produto.codigo &&
      this.produto.codigo.trim().length > 0 &&
      this.produto.nome &&
      this.produto.nome.trim().length > 0 &&
      this.produto.fabricanteId &&
      this.produto.fabricanteId > 0 &&
      this.produto.preco != null &&
      this.produto.preco >= 0 &&
      this.produto.estoque != null &&
      this.produto.estoque >= 0
    );
  }

  private isPnDuplicate(pn: string | null | undefined): boolean {
    return isDuplicateProductPn(pn, this.produtosExistentes, this.productId);
  }

  salvarProduto() {
    this.formAttempted = true;
    if (!isValidProductPn(this.produto.codigo)) {
      toastKey(this.messageService, this.i18n, 'warn', 'products.new.toast.formIncompleteSummary', 'products.new.toast.invalidPn');
      return;
    }
    if (this.isPnDuplicate(this.produto.codigo)) {
      toastKey(
        this.messageService,
        this.i18n,
        'warn',
        'products.new.toast.formIncompleteSummary',
        'products.new.toast.duplicatePn',
        { pn: this.produto.codigo.trim() }
      );
      return;
    }
    if (!this.formularioValido()) {
      toastKey(
        this.messageService,
        this.i18n,
        'warn',
        'products.new.toast.formIncompleteSummary',
        this.isEditMode ? 'products.new.toast.formIncompleteEdit' : 'products.new.toast.formIncompleteCreate'
      );
      return;
    }

    // Preparar dados para envio - apenas campos que existem na tabela do banco
    // Garantindo que valores não sejam undefined ou strings vazias para evitar NULL no banco
    const produtoData: any = {};
    
    // Campos obrigatórios e principais - garantir que não sejam undefined
    if (this.produto.nome && this.produto.nome.trim()) {
      produtoData.name = this.produto.nome.trim();
    } else {
      produtoData.name = null;
    }
    
    if (this.produto.descricao && this.produto.descricao.trim()) {
      produtoData.description = this.produto.descricao.trim();
    } else {
      produtoData.description = null;
    }
    
    produtoData.price = (this.produto.preco !== undefined && this.produto.preco !== null) ? Number(this.produto.preco) : 0;
    produtoData.quantity = (this.produto.estoque !== undefined && this.produto.estoque !== null) ? Number(this.produto.estoque) : 0;
    
    // Usar código informado pelo usuário ou gerar se não houver
    const productpn = this.produto.codigo?.trim() || this.produtoSelecionado?.productpn || this.gerarCodigoProduto();
    if (productpn && productpn.trim()) {
      produtoData.productpn = productpn.trim();
    } else {
      produtoData.productpn = null;
    }
    
    produtoData.status = this.produto.ativo ? 'ATIVO' : 'INATIVO';
    produtoData.invoice = 0;
    produtoData.local = encodeProductLocal({
      m: this.moedaPreco,
      pw: this.especificacoes.peso > 0 ? this.especificacoes.peso : undefined,
      w: this.especificacoes.largura ?? undefined,
      h: this.especificacoes.altura ?? undefined,
      d: this.especificacoes.profundidade ?? undefined,
      mt: this.especificacoes.material,
      cr: this.especificacoes.cor,
      obs: this.produto.observacoes,
    });
    
    // Adicionar idFabricante apenas se estiver definido e válido
    if (this.produto.fabricanteId && this.produto.fabricanteId > 0) {
      produtoData.idFabricante = Number(this.produto.fabricanteId);
    }
    
    // Adicionar isActive sempre (boolean)
    produtoData.isActive = this.produto.ativo !== undefined ? Boolean(this.produto.ativo) : true;

    // Não enviar placeholder; upload real definirá photoUrl após criação


    // Se estiver em modo de edição, fazer update; caso contrário, criar novo
    if (this.isEditMode && this.productId) {
      // Atualizar produto existente
      this.productService.update(this.productId, produtoData).subscribe({
        next: (response) => {
          const id = response.id ?? this.productId;
          if (id) {
            this.finalizarSalvo(id, true);
          } else {
            this.mostrarSucesso(true);
          }
        },
        error: (error) => {
          console.error('Failed to update product:', error);
          
          const errorMessage =
            extractApiErrorMessage(error, this.i18n, 'products.toast.updateError');
          toastKey(
            this.messageService,
            this.i18n,
            'error',
            'products.new.toast.saveErrorSummary',
            'products.new.toast.saveErrorDetail',
            { msg: errorMessage }
          );
        }
      });
    } else {
      // Chamar API para criar produto
      this.productService.create(produtoData).subscribe({
        next: (response) => {
          
          // Verificar se o produto foi criado com sucesso e tem ID
          if (response.id) {
            this.finalizarSalvo(response.id, false);
          } else {
            console.error('Produto criado mas sem ID:', response);
            toastKey(
              this.messageService,
              this.i18n,
              'error',
              'products.new.toast.saveErrorSummary',
              'products.new.toast.noValidId'
            );
          }
        },
        error: (error) => {
          console.error('Failed to create product:', error);
          console.error('Resposta completa do erro:', JSON.stringify(error, null, 2));
          
          const errorMessage =
            extractApiErrorMessage(error, this.i18n, 'products.toast.updateError');
          toastKey(
            this.messageService,
            this.i18n,
            'error',
            'products.new.toast.saveErrorSummary',
            'products.new.toast.saveErrorDetail',
            { msg: errorMessage }
          );
        }
      });
    }
  }

  private gerarCodigoProduto(): string {
    // Gerar código único baseado no nome e timestamp
    const timestamp = Date.now().toString().slice(-6);
    const nomeCodigo = this.produto.nome.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    return `${nomeCodigo}-${timestamp}`;
  }

  private mostrarSucesso(isEdit: boolean) {
    toastKey(
      this.messageService,
      this.i18n,
      'success',
      'products.new.toast.savedSummary',
      isEdit ? 'products.new.toast.savedUpdate' : 'products.new.toast.savedCreate'
    );

    setTimeout(() => {
      this.router.navigate(['/products']);
    }, 1500);
  }

  private finalizarSalvo(productId: number, isEdit: boolean): void {
    this.fazerUploadImagens(productId, () => this.mostrarSucesso(isEdit));
  }

  onImagensSelecionadas(event: { files?: File[] }) {
    if (event.files && event.files.length > 0) {
      this.imagensSelecionadas = Array.from(event.files).slice(0, 5);
      this.revokeSelectedPreviews();
      this.selectedImagePreviews = this.imagensSelecionadas.map(file => URL.createObjectURL(file));
    }
  }

  removeSelectedImage(index: number): void {
    const url = this.selectedImagePreviews[index];
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.imagensSelecionadas.splice(index, 1);
    this.selectedImagePreviews.splice(index, 1);
    this.photoUpload?.clear();
  }

  clearExistingPhoto(): void {
    this.existingPhotoUrl = null;
    this.clearPhotoOnSave = true;
    this.imagensSelecionadas = [];
    this.revokeSelectedPreviews();
    this.photoUpload?.clear();
  }

  private revokeSelectedPreviews(): void {
    for (const url of this.selectedImagePreviews) {
      URL.revokeObjectURL(url);
    }
    this.selectedImagePreviews = [];
  }

  ngOnDestroy(): void {
    this.revokeSelectedPreviews();
  }

  fazerUploadImagens(productId: number, onComplete: () => void) {
    if (this.imagensSelecionadas.length === 0) {
      onComplete();
      return;
    }

    this.productService.uploadPhoto(productId, this.imagensSelecionadas).subscribe({
      next: () => {
        this.imagensSelecionadas = [];
        onComplete();
      },
      error: (err) => {
        console.error('Photo upload error:', err);
        toastKey(
          this.messageService,
          this.i18n,
          'warn',
          'products.photo.uploadWarnTitle',
          'products.photo.uploadWarnDetail'
        );
        onComplete();
      }
    });
  }

  cancelar() {
    this.router.navigate(['/products']);
  }
}
