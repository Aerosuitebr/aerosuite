import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { PublicacaoTecnicaService, PublicacaoTecnica, PublicacaoFcu } from '../core/publicacao-tecnica.service';
import { Fcu } from '../core/fcu.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslationService } from '../core/translation.service';
import { formatUiDateTime } from '../core/locale/locale-intl.util';
import { toastKey } from '../core/toast-i18n.util';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ListboxModule } from 'primeng/listbox';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';

@Component({
  selector: 'app-associar-pn',
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
    ProgressSpinnerModule,
    TagModule,
    DividerModule,
    TooltipModule,
    ConfirmDialogModule,
    TranslatePipe,
    PageHeroComponent
  ],
  styleUrls: ['./associar-pn.component.scss'],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="modern-associacao-container">
      <app-page-hero
        variant="gold"
        titleKey="publicacoes.associarPn.title"
        subtitleKey="publicacoes.associarPn.subtitle"
        titleIcon="pi-book"
        [hasActions]="false">
      </app-page-hero>

      <div class="page-top__selector" *ngIf="!selectedPublicacao">
          <span class="selector-label">{{ 'publicacoes.associarPn.selectTitle' | translate }}</span>
          <div class="fcu-selector">
            <div class="selector-wrapper">
              <i class="pi pi-search selector-icon"></i>
              <p-dropdown
              [options]="publicacaoOptions"
              [(ngModel)]="selectedPublicacao"
              [filter]="true"
              filterBy="ataManual,numeroRevisao,tipoManual,fabricanteNome"
              [showClear]="true"
              [placeholder]="'publicacoes.associarPn.selectPh' | translate"
              (onChange)="onPublicacaoSelect($event.value)"
              (onFilter)="publicacaoSearchSubject.next($event.query)"
              [loading]="loadingPublicacoes"
              [disabled]="loadingPublicacoes"
              class="modern-dropdown"
              [style]="{'width': '100%'}">
              
              <ng-template pTemplate="selectedItem">
                <div *ngIf="selectedPublicacao" class="selected-fcu">
                  <div class="fcu-badge">
                    <i class="pi pi-book"></i>
                    <span>{{ selectedPublicacao.ataManual }}</span>
                  </div>
                  <div class="fcu-info">{{ selectedPublicacao.tipoManual }}</div>
                </div>
              </ng-template>

              <ng-template pTemplate="item" let-pub>
                <div class="fcu-option">
                  <div class="fcu-main">
                    <div class="fcu-code">{{ pub.ataManual }}</div>
                    <div class="fcu-desc">{{ pub.tipoManual || noDescriptionLabel }}</div>
                  </div>
                  <div class="fcu-tags">
                    <span *ngIf="pub.fabricanteNome" class="tag">
                      <i class="pi pi-building"></i> {{ pub.fabricanteNome }}
                    </span>
                    <span *ngIf="pub.numeroRevisao" class="tag">
                      <i class="pi pi-tag"></i> Rev. {{ pub.numeroRevisao }}
                    </span>
                  </div>
                </div>
              </ng-template>
            </p-dropdown>
            </div>
          </div>
        </div>

      <div class="page-empty" *ngIf="!selectedPublicacao">
        <i class="pi pi-book"></i>
        <p>{{ 'publicacoes.associarPn.emptyHint' | translate }}</p>
      </div>

      <!-- Publicação Selected Banner - Only show when publicação is selected -->
      <div class="pub-banner" *ngIf="selectedPublicacao">
        <div class="banner-content">
          <div class="banner-icon">
            <i class="pi pi-book banner-icon-main"></i>
          </div>
          <div class="banner-info">
            <h2>{{ selectedPublicacao.ataManual }}</h2>
            <p>{{ selectedPublicacao.tipoManual || noDescriptionLabel }}</p>
            <div class="banner-tags">
              <span *ngIf="selectedPublicacao.fabricanteNome" class="tag">
                <i class="pi pi-building"></i> {{ selectedPublicacao.fabricanteNome }}
              </span>
              <span *ngIf="selectedPublicacao.numeroRevisao" class="tag">
                <i class="pi pi-tag"></i> Rev. {{ selectedPublicacao.numeroRevisao }}
              </span>
              <span *ngIf="selectedPublicacao.dataRevisaoManual" class="tag">
                <i class="pi pi-calendar"></i> {{ formatDate(selectedPublicacao.dataRevisaoManual) }}
              </span>
            </div>
          </div>
          <div class="banner-actions">
            <p-button
              icon="pi pi-times"
              (onClick)="clearPublicacaoSelection()"
              styleClass="p-button-text p-button-danger"
              [pTooltip]="'publicacoes.associarPn.tooltip.change' | translate"
              tooltipPosition="top">
            </p-button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="association-workspace" *ngIf="selectedPublicacao">
        <div class="content-layout">
          
          <!-- Transfer Arrow -->
          <div class="transfer-arrow" (click)="transferSelectedFcus()" *ngIf="selectedFcus.length > 0">
            <i class="pi pi-arrow-right"></i>
          </div>
          
          <!-- Available FCUs (Produtos Aeronáuticos) -->
          <div class="products-section">
            <div class="section-header">
              <div class="section-icon">
                <i class="pi pi-cog"></i>
              </div>
              <div class="section-title">
                <h2>{{ 'publicacoes.associarPn.available' | translate }}</h2>
                <span class="count-badge">{{ availableFcusCount }}</span>
              </div>
            </div>

            <div class="section-content">
              <!-- Search and Controls -->
              <div class="search-controls">
                <div class="search-input-container">
                  <i class="pi pi-search search-icon"></i>
                  <input
                    type="text"
                    [(ngModel)]="searchTerm"
                    (ngModelChange)="onSearchChange($event)"
                    [placeholder]="'publicacoes.associarPn.searchAvailable' | translate"
                    class="search-input"
                  />
                </div>
                
                <div class="selection-controls">
                  <p-checkbox
                    [binary]="true"
                    [(ngModel)]="selectAllAvailable"
                    (onChange)="onSelectAllAvailableToggle()">
                  </p-checkbox>
                  <label (click)="toggleSelectAll()">{{ 'publicacoes.associarPn.selectAll' | translate }}</label>
                </div>
              </div>

              <!-- FCU List -->
              <div class="products-container">
                <div *ngIf="loadingFcus" class="loading">
                  <p-progressSpinner [style]="{'width': '40px', 'height': '40px'}"></p-progressSpinner>
                  <p>{{ 'publicacoes.associarPn.loadingProducts' | translate }}</p>
                </div>

                <div *ngIf="!loadingFcus && availableFcus.length === 0" class="empty">
                  <i class="pi pi-inbox"></i>
                  <h3>{{ 'publicacoes.associarPn.noProducts' | translate }}</h3>
                  <p>{{ 'publicacoes.associarPn.noProductsHint' | translate }}</p>
                </div>

                <div class="products-grid" *ngIf="!loadingFcus && availableFcus.length > 0">
                  <div
                    class="product-item"
                    *ngFor="let fcu of availableFcus; trackBy: trackByFcuId"
                    [class.selected]="isFcuSelected(fcu)"
                    [data-fcu-id]="fcu.id"
                    (click)="toggleFcuSelection(fcu)">
                    <div class="product-checkbox">
                      <p-checkbox
                        [ngModel]="isFcuSelected(fcu)"
                        (ngModelChange)="toggleFcuSelection(fcu)">
                      </p-checkbox>
                    </div>

                    <div class="product-info">
                      <div class="product-header">
                        <h4>{{ fcu.fcuDescription || fcu.fcuCodigo }}</h4>
                      </div>

                      <div class="product-details">
                        <div *ngIf="fcu.pn" class="detail">
                          <i class="pi pi-tag"></i>
                          <span>PN: {{ fcu.pn }}</span>
                        </div>
                        <div *ngIf="fcu.modelo" class="detail">
                          <i class="pi pi-box"></i>
                          <span>{{ fcu.modelo }}</span>
                        </div>
                        <div *ngIf="fcu.serialNumber" class="detail">
                          <i class="pi pi-hashtag"></i>
                          <span>S/N: {{ fcu.serialNumber }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="product-action">
                      <p-button
                        [icon]="isFcuSelected(fcu) ? 'pi pi-check' : 'pi pi-plus'"
                        [styleClass]="isFcuSelected(fcu) ? 'p-button-success' : 'p-button-outlined'"
                        [text]="true"
                        [rounded]="true"
                        size="small">
                      </p-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Associated FCUs -->
          <div class="associated-section">
            <div class="section-header">
              <div class="section-icon">
                <i class="pi pi-link"></i>
              </div>
              <div class="section-title">
                <h2>{{ 'publicacoes.associarPn.associated' | translate }}</h2>
                <span class="count-badge">{{ associatedFcusCount }}</span>
              </div>
            </div>

            <div class="section-content">
              <!-- Search for Associated FCUs -->
              <div class="search-controls" *ngIf="associatedFcus.length > 4">
                <div class="search-input-container">
                  <i class="pi pi-search search-icon"></i>
                  <input
                    type="text"
                    [(ngModel)]="associatedSearchTerm"
                    (ngModelChange)="onAssociatedSearchChange($event)"
                    [placeholder]="'publicacoes.associarPn.searchAssociated' | translate"
                    class="search-input"
                  />
                </div>
              </div>

              <div *ngIf="loadingAssociations" class="loading">
                <p-progressSpinner [style]="{'width': '40px', 'height': '40px'}"></p-progressSpinner>
                <p>{{ 'publicacoes.associarPn.loadingAssoc' | translate }}</p>
              </div>

              <div *ngIf="!loadingAssociations && associatedFcus.length === 0" class="empty">
                <i class="pi pi-link"></i>
                <h3>{{ 'publicacoes.associarPn.noAssoc' | translate }}</h3>
                <p>{{ 'publicacoes.associarPn.noAssocHint' | translate }}</p>
              </div>

              <div class="associated-list" *ngIf="!loadingAssociations && associatedFcus.length > 0">
                <div
                  class="associated-item"
                  *ngFor="let association of getFilteredAssociatedFcus(); trackBy: trackByAssociationId"
                  [class.newly-added]="isNewlyAdded(association)"
                  [data-association-id]="association.id">
                  
                  <div class="item-info">
                    <div class="item-header">
                      <h4>{{ association.fcuDescription || association.fcuCodigo }}</h4>
                      <p-tag 
                        *ngIf="!association.fcuIsActive" 
                        [value]="'publicacoes.associarPn.inactive' | translate" 
                        severity="danger" 
                        [rounded]="true">
                      </p-tag>
                    </div>

                    <div class="item-details">
                      <div *ngIf="association.fcuPn" class="detail">
                        <i class="pi pi-tag"></i>
                        <span>PN: {{ association.fcuPn }}</span>
                      </div>
                      <div *ngIf="association.fcuModelo" class="detail">
                        <i class="pi pi-box"></i>
                        <span>{{ association.fcuModelo }}</span>
                      </div>
                      <div *ngIf="association.fcuSerialNumber" class="detail">
                        <i class="pi pi-hashtag"></i>
                        <span>S/N: {{ association.fcuSerialNumber }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="item-controls">
                    <div class="undo-arrow" 
                      (click)="undoAssociation(association)"
                      [class.disabled]="savingAssociations"
                      [pTooltip]="'publicacoes.associarPn.tooltip.undo' | translate"
                      tooltipPosition="top">
                      <i class="pi pi-times"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class AssociarPnComponent implements OnInit, OnDestroy {
  private publicacaoService = inject(PublicacaoTecnicaService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);

  selectedPublicacao: PublicacaoTecnica | null = null;
  availableFcus: Fcu[] = [];
  associatedFcus: PublicacaoFcu[] = [];
  loading = false;
  searchTerm = '';
  associatedSearchTerm = '';
  loadingPublicacoes = false;
  loadingFcus = false;
  loadingAssociations = false;
  savingAssociations = false;

  publicacaoOptions: PublicacaoTecnica[] = [];
  selectedFcus: Fcu[] = [];
  selectAllAvailable = false;

  public publicacaoSearchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private newlyAddedIds: Set<number> = new Set();

  get availableFcusCount(): number {
    return this.availableFcus?.length || 0;
  }

  get associatedFcusCount(): number {
    return this.associatedFcus?.length || 0;
  }

  get noDescriptionLabel(): string {
    return this.i18n.translate('publicacoes.associarPn.noDescription');
  }

  ngOnInit() {
    this.loadPublicacoes();
    
    this.publicacaoSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(search => {
      this.searchPublicacoes(search);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPublicacoes() {
    this.loadingPublicacoes = true;
    this.publicacaoService.findAll().subscribe({
      next: (publicacoes) => {
        this.publicacaoOptions = publicacoes || [];
        this.loadingPublicacoes = false;
      },
      error: (error) => {
        console.error('Failed to load publications:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'publicacoes.associarPn.toast.loadPublicacoesError');
        this.loadingPublicacoes = false;
      }
    });
  }

  searchPublicacoes(search: string) {
    if (!search) {
      this.loadPublicacoes();
      return;
    }
    
    this.publicacaoService.search({ q: search, size: 1000 }).subscribe({
      next: (response) => {
        this.publicacaoOptions = response.items || [];
      },
      error: (error) => {
        console.error('Failed to search publications:', error);
      }
    });
  }

  onPublicacaoSelect(publicacao: PublicacaoTecnica) {
    this.selectedPublicacao = publicacao;
    this.resetFcuSelection();
    this.loadAssociatedFcus();
    this.loadAvailableFcus();
  }

  clearPublicacaoSelection() {
    this.selectedPublicacao = null;
    this.resetFcuSelection();
    this.availableFcus = [];
    this.associatedFcus = [];
  }

  loadAvailableFcus() {
    if (!this.selectedPublicacao?.id) {
      this.availableFcus = [];
      this.selectedFcus = [];
      this.selectAllAvailable = false;
      return;
    }
    
    this.loadingFcus = true;
    this.publicacaoService.getAvailableFcus(this.selectedPublicacao.id, this.searchTerm).subscribe({
      next: (fcus) => {
        this.availableFcus = fcus || [];
        this.selectedFcus = this.selectedFcus.filter(
          selected => this.availableFcus.some(av => av.id === selected.id)
        );
        this.updateSelectAllState();
        this.loadingFcus = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load available FCUs:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'publicacoes.associarPn.toast.loadFcusError');
        this.availableFcus = [];
        this.selectedFcus = [];
        this.selectAllAvailable = false;
        this.loadingFcus = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAssociatedFcus() {
    if (!this.selectedPublicacao?.id) {
      this.associatedFcus = [];
      return;
    }
    
    this.loadingAssociations = true;
    this.publicacaoService.getByPublicacaoId(this.selectedPublicacao.id).subscribe({
      next: (associations) => {
        this.associatedFcus = associations || [];
        this.loadingAssociations = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load associations:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'publicacoes.associarPn.toast.loadAssociacoesError');
        this.associatedFcus = [];
        this.loadingAssociations = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(searchTerm: string) {
    this.searchTerm = searchTerm;
    this.loadAvailableFcus();
  }

  onAssociatedSearchChange(searchTerm: string) {
    this.associatedSearchTerm = searchTerm;
  }

  onSelectAllAvailableToggle() {
    if (this.selectAllAvailable) {
      this.selectedFcus = [...this.availableFcus];
    } else {
      this.selectedFcus = [];
    }
    this.cdr.detectChanges();
  }

  toggleSelectAll() {
    this.selectAllAvailable = !this.selectAllAvailable;
    this.onSelectAllAvailableToggle();
  }

  toggleFcuSelection(fcu: Fcu) {
    const index = this.selectedFcus.findIndex(f => f.id === fcu.id);
    if (index > -1) {
      this.selectedFcus.splice(index, 1);
    } else {
      this.selectedFcus.push(fcu);
    }
    this.updateSelectAllState();
    this.cdr.detectChanges();
  }

  private updateSelectAllState() {
    this.selectAllAvailable = this.availableFcus.length > 0 && 
                              this.selectedFcus.length === this.availableFcus.length;
  }

  transferSelectedFcus() {
    if (this.selectedFcus.length === 0) {
      toastKey(this.messageService, this.i18n, 'warn', 'common.toast.warn', 'publicacoes.associarPn.toast.selectAtLeastOne');
      return;
    }

    if (!this.selectedPublicacao?.id) {
      toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'publicacoes.associarPn.toast.noPublicacaoSelected');
      return;
    }

    this.savingAssociations = true;
    const fcuIds = this.selectedFcus.map(f => f.id!);
    const selectedCount = this.selectedFcus.length;

    this.publicacaoService.associateFcus(this.selectedPublicacao.id, fcuIds).subscribe({
      next: () => {
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'publicacoes.associarPn.toast.associateSuccess', {
          count: String(selectedCount)
        });
        
        // Marcar como recém-adicionados
        fcuIds.forEach(id => this.newlyAddedIds.add(id));
        setTimeout(() => {
          fcuIds.forEach(id => this.newlyAddedIds.delete(id));
          this.cdr.detectChanges();
        }, 3000);
        
        this.selectedFcus = [];
        this.selectAllAvailable = false;
        this.loadAssociatedFcus();
        this.loadAvailableFcus();
        this.savingAssociations = false;
      },
      error: (error) => {
        console.error('Failed to associate FCUs:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'publicacoes.associarPn.toast.associateError');
        this.savingAssociations = false;
      }
    });
  }

  undoAssociation(association: PublicacaoFcu) {
    if (this.savingAssociations || !association.id) return;

    this.confirmationService.confirm({
      message: this.i18n.translate('confirm.associarPn.message', {
        name: String(association.fcuDescription || association.fcuCodigo || '')
      }),
      header: 'confirm.header.removeFile',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'common.confirm.yesRemove',
      rejectLabel: 'common.confirm.cancel',
      accept: () => {
        this.savingAssociations = true;
        this.publicacaoService.deleteAssociacao(association.id!).subscribe({
          next: () => {
            toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'publicacoes.associarPn.toast.removeSuccess');
            this.loadAssociatedFcus();
            this.loadAvailableFcus();
            this.savingAssociations = false;
          },
          error: (error) => {
            console.error('Failed to remove association:', error);
            toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'publicacoes.associarPn.toast.removeError');
            this.savingAssociations = false;
          }
        });
      }
    });
  }

  getFilteredAssociatedFcus(): PublicacaoFcu[] {
    if (!this.associatedSearchTerm) {
      return this.associatedFcus;
    }
    
    const searchTerm = this.associatedSearchTerm.toLowerCase();
    return this.associatedFcus.filter(association => 
      association.fcuDescription?.toLowerCase().includes(searchTerm) ||
      association.fcuCodigo?.toLowerCase().includes(searchTerm) ||
      association.fcuPn?.toLowerCase().includes(searchTerm) ||
      association.fcuModelo?.toLowerCase().includes(searchTerm)
    );
  }

  resetFcuSelection() {
    this.selectedFcus = [];
    this.selectAllAvailable = false;
    this.searchTerm = '';
    this.cdr.detectChanges();
  }

  isFcuSelected(fcu: Fcu): boolean {
    return this.selectedFcus.some(f => f.id === fcu.id);
  }

  isNewlyAdded(association: PublicacaoFcu): boolean {
    return this.newlyAddedIds.has(association.fcuId!);
  }

  trackByFcuId(index: number, fcu: Fcu): number {
    return fcu.id || index;
  }

  trackByAssociationId(index: number, association: PublicacaoFcu): number {
    return association.id || index;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return formatUiDateTime(this.i18n.getCurrentLanguage(), date, 'date');
    } catch {
      return dateStr;
    }
  }

  truncateText(text?: string, maxLength: number = 50): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
