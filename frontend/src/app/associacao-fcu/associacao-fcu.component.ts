import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';

import { AssociacaoFcuService, AssociacaoFcu } from '../core/associacao-fcu.service';
import { Fcu } from '../core/fcu.service';
import { Product } from '../core/product.service';
import { FcuService } from '../core/fcu.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslationService } from '../core/translation.service';
import { toastKey } from '../core/toast-i18n.util';
import { TranslatePipe } from '../core/translate.pipe';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ListboxModule } from 'primeng/listbox';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { bustStaticAssetUrl } from '../../environments/asset-cache-bust';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';

@Component({
  selector: 'app-associacao-fcu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    ListboxModule,
    CheckboxModule,
    InputNumberModule,
    ProgressSpinnerModule,
    TagModule,
    DividerModule,
    TooltipModule,
    ConfirmDialogModule,
    TranslatePipe,
    PageHeroComponent,
  ],
  templateUrl: './associacao-fcu.component.html',
  styleUrls: ['./associacao-fcu.component.scss']
})
export class AssociacaoFcuComponent implements OnInit, OnDestroy {
  readonly fcuBannerImageUrl = bustStaticAssetUrl('assets/original.png');
  private associacaoService = inject(AssociacaoFcuService);
  private fcuService = inject(FcuService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);

  // Propriedades simples
  selectedFcu: Fcu | null = null;
  availableProducts: Product[] = [];
  associatedProducts: AssociacaoFcu[] = [];
  loading = false;
  searchTerm = '';
  associatedSearchTerm = '';
  defaultQuantity = 1;
  loadingFcus: boolean = false;
  loadingProducts: boolean = false;
  loadingAssociations: boolean = false;
  savingAssociations: boolean = false;

  // Dados para dropdowns
  fcuOptions: Fcu[] = [];
  selectedProducts: Product[] = [];
  selectAllAvailable = false;
  selectAllAssociated = false;

  // Observables para busca
  private searchSubject = new Subject<string>();
  public fcuSearchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Observable para debounce de quantidade
  private quantityUpdateSubject = new Subject<{association: AssociacaoFcu, quantity: number}>();
  
  // Mapa para rastrear estado de salvamento por associação
  savingStates: Map<number, 'idle' | 'saving' | 'saved' | 'error'> = new Map();
  
  // Propriedades computadas para contadores dinâmicos
  get availableProductsCount(): number {
    // Retornar o tamanho da lista de produtos disponíveis
    // O backend já filtra produtos associados, então podemos confiar no array
    return this.availableProducts?.length || 0;
  }
  
  get associatedProductsCount(): number {
    // Contar todas as associações carregadas (já filtradas pelo backend para apenas ativas)
    return this.associatedProducts?.length || 0;
  }

  constructor() {
    // Configurar busca com debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(search => {
      this.searchTerm = search as string;
      this.loadAvailableProducts();
    });

    // Configurar busca de FCUs
    this.fcuSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => this.searchFcus(search)),
      takeUntil(this.destroy$)
    ).subscribe((response: any) => {
      this.fcuOptions = response.items || response;
    });

    // Configurar salvamento automático de quantidade com debounce
    this.quantityUpdateSubject.pipe(
      debounceTime(800), // Aguarda 800ms após parar de digitar
      distinctUntilChanged((prev, curr) => 
        prev.association.id === curr.association.id && prev.quantity === curr.quantity
      ),
      takeUntil(this.destroy$)
    ).subscribe(({association, quantity}) => {
      this.saveQuantitySilently(association, quantity);
    });
  }

  ngOnInit() {
    this.loadFcus();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFcus() {
    this.loadingFcus = true;
    this.fcuService.list({ page: 0, size: 200, sort: 'fcuCodigo,asc' }).subscribe({
      next: (response: any) => {
        this.fcuOptions = response.items || response;
        this.loadingFcus = false;
      },
      error: (error: any) => {
        console.error('Failed to load FCUs:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'associacao.fcu.toast.loadFcusError', {
          error: String(error?.message || '')
        });
        this.loadingFcus = false;
      }
    });
  }

  searchFcus(search: string): any {
    if (!search) {
      return this.fcuService.list({ page: 0, size: 200, q: search || undefined, sort: 'fcuCodigo,asc' });
    }
    return this.fcuService.list({ page: 0, size: 200, q: search, sort: 'fcuCodigo,asc' });
  }

  onFcuSelect(fcu: Fcu) {
    this.selectedFcu = fcu;
    this.resetProductSelection();
    this.loadAssociatedProducts();
    this.loadAvailableProducts();
  }

  clearFcuSelection() {
    this.selectedFcu = null;
    this.resetProductSelection();
    this.availableProducts = [];
    this.associatedProducts = [];
  }

  loadAvailableProducts() {
    if (!this.selectedFcu?.id) {
      this.availableProducts = [];
      this.selectedProducts = [];
      this.selectAllAvailable = false;
      return;
    }
    this.loadingProducts = true;
    
    this.associacaoService.getAvailableProducts(this.selectedFcu.id, this.searchTerm).subscribe({
      next: (products) => {
        this.availableProducts = products || [];
        
        // Remover produtos selecionados que não estão mais disponíveis
        this.selectedProducts = this.selectedProducts.filter(
          selected => this.availableProducts.some(av => av.id === selected.id)
        );
        
        // Atualizar o estado do checkbox "Selecionar todos" após carregar produtos
        this.updateSelectAllState();
        this.loadingProducts = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Failed to load available products:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'associacao.fcu.toast.loadAvailableProductsError', {
          error: String(error?.message || '')
        });
        this.availableProducts = [];
        this.selectedProducts = [];
        this.selectAllAvailable = false;
        this.loadingProducts = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAssociatedProducts() {
    if (!this.selectedFcu?.id) {
      this.associatedProducts = [];
      this.selectAllAssociated = false;
      return;
    }
    this.loadingAssociations = true;
    
    this.associacaoService.getByFcuId(this.selectedFcu.id).subscribe({
      next: (associations) => {
        this.associatedProducts = (associations || []).map(association => ({
          ...association,
          selected: association.selected || false
        }));
        // Atualizar o estado do checkbox "Selecionar todos" após carregar produtos
        this.updateSelectAllAssociatedState();
        this.loadingAssociations = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Failed to load associations:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'associacao.fcu.toast.loadAssociationsError', {
          error: String(error?.message || '')
        });
        this.associatedProducts = [];
        this.selectAllAssociated = false;
        this.loadingAssociations = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(searchTerm: string) {
    this.searchTerm = searchTerm;
    this.loadAvailableProducts();
  }

  onAssociatedSearchChange(searchTerm: string) {
    this.associatedSearchTerm = searchTerm;
    // Filtrar produtos associados localmente
    this.filterAssociatedProducts();
  }

  filterAssociatedProducts() {
    if (!this.associatedSearchTerm) {
      return;
    }
    // A lógica de filtro será implementada no template usando pipe
  }

  onSelectAllAvailableToggle() {
    // Alternar entre selecionar todos e desselecionar todos
    if (this.selectAllAvailable) {
      // Selecionar todos os produtos disponíveis (backend já filtra associados)
      this.selectedProducts = [...this.availableProducts];
    } else {
      // Desmarcar todos os produtos selecionados
      this.selectedProducts = [];
    }
    // Forçar detecção de mudanças para atualizar a UI
    this.cdr.detectChanges();
  }

  toggleSelectAll() {
    // Alternar o estado do checkbox quando clicar no label
    this.selectAllAvailable = !this.selectAllAvailable;
    this.onSelectAllAvailableToggle();
  }

  onSelectAllAssociatedToggle() {
    // Alternar entre selecionar todos e desselecionar todos
    if (this.selectAllAssociated) {
      // Selecionar todos os produtos associados
      this.associatedProducts.forEach(association => {
        association.selected = true;
      });
    } else {
      // Desmarcar todos os produtos associados
      this.associatedProducts.forEach(association => {
        association.selected = false;
      });
    }
    // Forçar detecção de mudanças para atualizar a UI
    this.cdr.detectChanges();
  }

  toggleSelectAllAssociated() {
    // Alternar o estado do checkbox quando clicar no label
    this.selectAllAssociated = !this.selectAllAssociated;
    this.onSelectAllAssociatedToggle();
  }

  onAssociatedItemSelect(association: AssociacaoFcu) {
    // Atualizar o estado do checkbox "Selecionar todos" baseado na seleção atual
    this.updateSelectAllAssociatedState();
  }

  private updateSelectAllAssociatedState() {
    // Marcar "Selecionar todos" apenas se todos os produtos associados estiverem selecionados
    this.selectAllAssociated = this.associatedProducts.length > 0 && 
                              this.associatedProducts.every(assoc => assoc.selected);
  }

  isAssociatedSelected(association: AssociacaoFcu): boolean {
    return association.selected || false;
  }

  getFilteredAssociatedProducts(): AssociacaoFcu[] {
    if (!this.associatedSearchTerm) {
      return this.associatedProducts;
    }
    
    const searchTerm = this.associatedSearchTerm.toLowerCase();
    return this.associatedProducts.filter(association => 
      association.productName?.toLowerCase().includes(searchTerm) ||
      association.productDescription?.toLowerCase().includes(searchTerm) ||
      association.productPn?.toLowerCase().includes(searchTerm)
    );
  }

  toggleProductSelection(product: Product) {
    // Verificar se o produto já está associado
    if (this.isProductTransferred(product)) {
      return; // Não permitir selecionar produtos já associados
    }
    
    const index = this.selectedProducts.findIndex(p => p.id === product.id);
    if (index > -1) {
      this.selectedProducts.splice(index, 1);
    } else {
      this.selectedProducts.push(product);
    }
    // Atualizar o estado do checkbox "Selecionar todos" baseado na seleção atual
    this.updateSelectAllState();
    this.cdr.detectChanges();
  }

  private updateSelectAllState() {
    // O backend já filtra produtos associados, então podemos confiar em availableProducts
    // Marcar "Selecionar todos" apenas se todos os produtos disponíveis estiverem selecionados
    this.selectAllAvailable = this.availableProducts.length > 0 && 
                              this.selectedProducts.length === this.availableProducts.length &&
                              this.availableProducts.every(product => 
                                this.selectedProducts.some(sp => sp.id === product.id)
                              );
  }

  addSelectedProducts() {
    if (this.selectedProducts.length === 0) {
      toastKey(this.messageService, this.i18n, 'warn', 'common.toast.warn', 'associacao.fcu.toast.noProductsSelected');
      return;
    }

    const fcu = this.selectedFcu;
    if (!fcu?.id) {
      toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'associacao.fcu.toast.noFcuSelected');
      return;
    }

    this.savingAssociations = true;
    const productIds = this.selectedProducts.map(p => p.id!);
    const selectedCount = this.selectedProducts.length;
    
    // Salvar os IDs dos produtos selecionados antes de resetar
    const selectedProductIds = [...productIds];

    this.associacaoService.associateProducts(fcu.id, productIds, this.defaultQuantity).subscribe({
      next: () => {
        
        // Remover produtos da lista local IMEDIATAMENTE para feedback visual
        this.availableProducts = this.availableProducts.filter(
          product => !selectedProductIds.includes(product.id!)
        );
        
        // Remover produtos selecionados
        this.selectedProducts = [];
        this.selectAllAvailable = false;
        
        // Forçar atualização da UI imediatamente
        this.cdr.detectChanges();
        
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'associacao.fcu.toast.associateSuccess', {
          count: String(selectedCount)
        });
        
        // Adicionar efeito de seleção aos produtos transferidos
        selectedProductIds.forEach(productId => {
          const productElement = document.querySelector(`[data-product-id="${productId}"]`);
          if (productElement) {
            productElement.classList.remove('transferring');
            productElement.classList.add('transferred');
          }
        });
        
        // Recarregar associações do backend
        if (!fcu.id) {
          console.error('❌ FCU ID not found');
          this.savingAssociations = false;
          return;
        }
        
        this.loadingAssociations = true;
        this.associacaoService.getByFcuId(fcu.id).subscribe({
          next: (associations) => {
            this.associatedProducts = (associations || []).map(association => ({
              ...association,
              selected: association.selected || false
            }));
            this.updateSelectAllAssociatedState();
            this.loadingAssociations = false;
            
            // Marcar novos itens como recém-adicionados
            this.associatedProducts.forEach(association => {
              if (selectedProductIds.includes(association.idProduct!)) {
                if (association.id) {
                  this.newlyAddedIds.add(association.id);
                  setTimeout(() => {
                    this.newlyAddedIds.delete(association.id!);
                    this.cdr.detectChanges();
                  }, 3000);
                }
              }
            });
            
            // Recarregar produtos disponíveis do backend para garantir sincronização
            if (!fcu.id) {
              console.error('❌ FCU ID not found when reloading available products');
              this.loadingProducts = false;
              this.savingAssociations = false;
              return;
            }
            
            this.loadingProducts = true;
            this.associacaoService.getAvailableProducts(fcu.id, this.searchTerm).subscribe({
              next: (products) => {
                this.availableProducts = products || [];
                this.updateSelectAllState();
                this.loadingProducts = false;
                
                this.savingAssociations = false;
                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('❌ Failed to reload available products:', error);
                this.loadingProducts = false;
                this.savingAssociations = false;
                this.cdr.detectChanges();
              }
            });
          },
          error: (error) => {
            console.error('❌ Failed to reload associations:', error);
            this.loadingAssociations = false;
            this.savingAssociations = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (error) => {
        console.error('Failed to associate products:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'associacao.fcu.toast.associateError');
        this.savingAssociations = false;
        
        // Remover animação de transferência em caso de erro
        selectedProductIds.forEach(productId => {
          const productElement = document.querySelector(`[data-product-id="${productId}"]`);
          if (productElement) {
            productElement.classList.remove('transferring');
          }
        });
      }
    });
  }

  transferSelectedProducts() {
    if (this.selectedProducts.length === 0) {
      toastKey(this.messageService, this.i18n, 'warn', 'common.toast.warn', 'associacao.fcu.toast.selectAtLeastOne');
      return;
    }

    // Adicionar animação de transferência aos produtos selecionados
    this.selectedProducts.forEach(product => {
      const productElement = document.querySelector(`[data-product-id="${product.id}"]`);
      if (productElement) {
        productElement.classList.add('transferring');
      }
    });

    // Após a animação, executar a transferência
    setTimeout(() => {
      this.addSelectedProducts();
    }, 800);
  }

  onQuantityChange(association: AssociacaoFcu) {
    // Validação básica
    if (association.qtdProduct == null || association.qtdProduct < 1) {
      association.qtdProduct = 1;
    }
    
    // Dispara o salvamento automático com debounce
    if (association.id) {
      this.quantityUpdateSubject.next({
        association: association,
        quantity: association.qtdProduct || 1
      });
      // Marca como salvando
      this.savingStates.set(association.id, 'saving');
    }
  }

  updateQuantity(association: AssociacaoFcu, newQuantity: number) {
    if (newQuantity == null || newQuantity < 1) {
      newQuantity = 1;
      association.qtdProduct = 1;
    }
    
    // Atualiza o valor localmente
    association.qtdProduct = newQuantity;
    
    // Dispara o salvamento automático com debounce
    if (association.id) {
      this.quantityUpdateSubject.next({
        association: association,
        quantity: newQuantity
      });
      // Marca como salvando
      this.savingStates.set(association.id, 'saving');
    }
  }

  // Método para salvar quantidade de forma silenciosa (sem toast de sucesso)
  private saveQuantitySilently(association: AssociacaoFcu, quantity: number) {
    if (!association.id) {
      return;
    }

    // Validação
    if (quantity == null || quantity < 1) {
      quantity = 1;
    }

    // Se a quantidade não mudou em relação ao valor salvo, não precisa atualizar
    const savedQty = association.qtdProduct || 1;
    const associationId = association.id!;
    if (savedQty === quantity && this.savingStates.get(associationId) !== 'saving') {
      return;
    }

    // Marca como salvando
    this.savingStates.set(associationId, 'saving');
    this.cdr.detectChanges();

    const updatedAssociation = { ...association, qtdProduct: quantity };
    this.associacaoService.update(associationId, updatedAssociation).subscribe({
      next: () => {
        // Atualizar apenas a associação específica sem recarregar tudo
        const index = this.associatedProducts.findIndex(a => a.id === associationId);
        if (index > -1) {
          this.associatedProducts[index].qtdProduct = quantity;
        }
        
        // Marca como salvo e depois volta para idle após 2 segundos
        this.savingStates.set(associationId, 'saved');
        this.cdr.detectChanges();
        
        setTimeout(() => {
          if (this.savingStates.get(associationId) === 'saved') {
            this.savingStates.set(associationId, 'idle');
            this.cdr.detectChanges();
          }
        }, 2000);
      },
      error: (error) => {
        console.error('Failed to update quantity:', error);
        // Marca como erro
        this.savingStates.set(associationId, 'error');
        this.cdr.detectChanges();
        
        // Mostra mensagem de erro apenas em caso de falha
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'associacao.fcu.toast.saveQuantityError');
        
        // Reverte para idle após 3 segundos
        setTimeout(() => {
          this.savingStates.set(associationId, 'idle');
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  // Método auxiliar para obter o estado de salvamento
  getSavingState(associationId?: number): 'idle' | 'saving' | 'saved' | 'error' {
    if (!associationId) return 'idle';
    return this.savingStates.get(associationId) || 'idle';
  }

  savingTooltip(associationId?: number): string {
    const state = this.getSavingState(associationId);
    if (state === 'saving') return this.i18n.translate('associacao.fcu.saving');
    if (state === 'saved') return this.i18n.translate('associacao.fcu.saved');
    if (state === 'error') return this.i18n.translate('associacao.fcu.saveError');
    return '';
  }

  removeAssociation(association: AssociacaoFcu) {
    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.associacaoFcu.message', {
        name: String(association.productName ?? '')
      }),
      header: 'confirm.header.inactivate',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesInactivate',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.savingAssociations = true;
        
        this.associacaoService.delete(association.id!).subscribe({
          next: () => {
            
            // Remover da lista local IMEDIATAMENTE para feedback visual
            const index = this.associatedProducts.findIndex(a => a.id === association.id);
            if (index > -1) {
              this.associatedProducts.splice(index, 1);
            }
            
            // Forçar atualização da UI imediatamente
            this.cdr.detectChanges();
            
            toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'associacao.fcu.toast.deactivateSuccess');
            
            // Recarregar associações do backend
            if (!this.selectedFcu?.id) {
              console.error('❌ FCU ID not found');
              this.savingAssociations = false;
              return;
            }
            
            this.loadingAssociations = true;
            this.associacaoService.getByFcuId(this.selectedFcu.id).subscribe({
              next: (associations) => {
                this.associatedProducts = (associations || []).map(a => ({
                  ...a,
                  selected: a.selected || false
                }));
                this.updateSelectAllAssociatedState();
                this.loadingAssociations = false;
                
                // Recarregar produtos disponíveis para que o produto volte à lista
                if (!this.selectedFcu?.id) {
                  console.error('❌ FCU ID not found when reloading available products');
                  this.loadingProducts = false;
                  this.savingAssociations = false;
                  return;
                }
                
                this.loadingProducts = true;
                this.associacaoService.getAvailableProducts(this.selectedFcu.id, this.searchTerm).subscribe({
                  next: (products) => {
                    this.availableProducts = products || [];
                    this.updateSelectAllState();
                    this.loadingProducts = false;
                    this.savingAssociations = false;
                    this.cdr.detectChanges();
                  },
                  error: (error) => {
                    console.error('❌ Failed to reload available products:', error);
                    this.loadingProducts = false;
                    this.savingAssociations = false;
                    this.cdr.detectChanges();
                  }
                });
              },
              error: (error) => {
                console.error('❌ Failed to reload associations:', error);
                this.loadingAssociations = false;
                this.savingAssociations = false;
                this.cdr.detectChanges();
              }
            });
          },
          error: (error) => {
            console.error('❌ Failed to deactivate association:', error);
            toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'associacao.fcu.toast.deactivateError');
            this.savingAssociations = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  undoAssociation(association: AssociacaoFcu) {
    if (this.savingAssociations) {
      return;
    }

    this.savingAssociations = true;
    
    // Adicionar animação de retorno
    const associationElement = document.querySelector(`[data-association-id="${association.id}"]`);
    if (associationElement) {
      associationElement.classList.add('undoing');
    }

    this.associacaoService.delete(association.id!).subscribe({
      next: () => {
        
        // Remover da lista local IMEDIATAMENTE para feedback visual
        const index = this.associatedProducts.findIndex(a => a.id === association.id);
        if (index > -1) {
          this.associatedProducts.splice(index, 1);
        }
        
        // Forçar atualização da UI imediatamente
        this.cdr.detectChanges();
        
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'associacao.fcu.toast.undoSuccess', {
          product: String(association.productName || '')
        });
        
        // Recarregar associações do backend
        if (!this.selectedFcu?.id) {
          console.error('❌ FCU ID not found');
          this.savingAssociations = false;
          return;
        }
        
        this.loadingAssociations = true;
        this.associacaoService.getByFcuId(this.selectedFcu.id).subscribe({
          next: (associations) => {
            this.associatedProducts = (associations || []).map(a => ({
              ...a,
              selected: a.selected || false
            }));
            this.updateSelectAllAssociatedState();
            this.loadingAssociations = false;
            
            // Recarregar produtos disponíveis para que o produto volte à lista
            if (!this.selectedFcu?.id) {
              console.error('❌ FCU ID not found when reloading available products');
              this.loadingProducts = false;
              this.savingAssociations = false;
              if (associationElement) {
                associationElement.classList.remove('undoing');
              }
              return;
            }
            
            this.loadingProducts = true;
            this.associacaoService.getAvailableProducts(this.selectedFcu.id, this.searchTerm).subscribe({
              next: (products) => {
                this.availableProducts = products || [];
                this.updateSelectAllState();
                this.loadingProducts = false;
                
                // Remover animação
                if (associationElement) {
                  associationElement.classList.remove('undoing');
                }
                
                this.savingAssociations = false;
                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('❌ Failed to reload available products:', error);
                this.loadingProducts = false;
                this.savingAssociations = false;
                if (associationElement) {
                  associationElement.classList.remove('undoing');
                }
                this.cdr.detectChanges();
              }
            });
          },
          error: (error) => {
            console.error('❌ Failed to reload associations:', error);
            this.loadingAssociations = false;
            this.savingAssociations = false;
            if (associationElement) {
              associationElement.classList.remove('undoing');
            }
            this.cdr.detectChanges();
          }
        });
      },
      error: (error) => {
        console.error('❌ Failed to undo association:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'associacao.fcu.toast.undoError');
        
        // Remover animação em caso de erro
        if (associationElement) {
          associationElement.classList.remove('undoing');
        }
        
        this.savingAssociations = false;
        this.cdr.detectChanges();
      }
    });
  }

  resetProductSelection() {
    this.selectedProducts = [];
    this.selectAllAvailable = false;
    this.searchTerm = '';
    this.cdr.detectChanges();
  }

  getStatusSeverity(status?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    switch (status?.toLowerCase()) {
      case 'ativo':
      case 'active':
        return 'success';
      case 'inativo':
      case 'inactive':
        return 'danger';
      case 'pendente':
      case 'pending':
        return 'warning';
      default:
        return 'info';
    }
  }

  trackByProductId(index: number, product: Product): number {
    return product.id || index;
  }

  trackByAssociationId(index: number, association: AssociacaoFcu): number {
    return association.id || index;
  }

  isProductSelected(product: Product): boolean {
    return this.selectedProducts.some((p) => p.id === product.id);
  }

  isProductTransferred(product: Product): boolean {
    // Verificar se o produto está na lista de associados (apenas para efeito visual)
    // O backend já filtra produtos associados da lista de disponíveis
    return this.associatedProducts.some(ap => ap.idProduct === product.id);
  }

  private newlyAddedIds: Set<number> = new Set();

  isNewlyAdded(association: AssociacaoFcu): boolean {
    return this.newlyAddedIds.has(association.id!);
  }
}
