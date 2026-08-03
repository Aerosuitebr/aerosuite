import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';

/**
 * Interface para estilo de assinatura
 */
export interface SignatureStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  fontStyle: string;
  letterSpacing: string;
  textTransform?: string;
  color: string;
  previewClass: string;
}

/**
 * Interface para dados da assinatura
 */
export interface SignatureData {
  name: string;
  styleId: string;
  style: SignatureStyle;
  timestamp: Date;
  svgData?: string;
}

@Component({
  selector: 'app-signature-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    TooltipModule,
    TranslatePipe
  ],
  template: `
    <p-dialog 
      styleClass="as-hero-dialog signature-modal" [(visible)]="visible" 
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '90vw', maxWidth: '700px', maxHeight: '90vh' }"
     
      (onHide)="onCancel()"
      (onShow)="onDialogShow()">
      
      <ng-template pTemplate="header">
        <div class="modal-header">
          <div class="header-icon">
            <i class="pi pi-pencil"></i>
          </div>
          <div class="header-content">
            <h2>{{ 'formsMisc.signature.title' | translate }}</h2>
            <p>{{ 'formsMisc.signature.subtitle' | translate }}</p>
          </div>
        </div>
      </ng-template>

      <div class="signature-content">
        <!-- Input de Nome -->
        <div class="name-input-section">
          <label for="signerName" class="input-label">
            <i class="pi pi-user"></i>
            {{ 'formsMisc.signature.labelName' | translate }}
          </label>
          <div class="input-wrapper">
            <input 
              pInputText 
              id="signerName"
              [(ngModel)]="signerName"
              [placeholder]="'formsMisc.signature.placeholderSignerName' | translate"
              class="name-input"
              maxlength="40">
          </div>
        </div>

        <!-- Preview da Assinatura -->
        <div class="signature-preview-section" *ngIf="signerName">
          <div class="preview-header">
            <span class="preview-label">
              <i class="pi pi-eye"></i>
              {{ 'formsMisc.signature.preview' | translate }}
            </span>
            <span class="selected-style" *ngIf="currentStyle">
              {{ currentStyle.name }}
            </span>
          </div>
          <div class="signature-preview-box">
            <div class="preview-paper">
              <div class="signature-line">
                <span 
                  class="signature-text"
                  [style.font-family]="currentStyle?.fontFamily"
                  [style.font-weight]="currentStyle?.fontWeight"
                  [style.font-size]="'24px'"
                  [style.letter-spacing]="currentStyle?.letterSpacing"
                  [style.color]="currentStyle?.color">
                  {{ signerName }}
                </span>
              </div>
              <div class="preview-label-text">{{ 'formsMisc.signature.previewResponsible' | translate }}</div>
            </div>
          </div>
        </div>

        <!-- Grade de Estilos -->
        <div class="styles-section" *ngIf="signerName">
          <div class="styles-header">
            <h3>
              <i class="pi pi-palette"></i>
              {{ 'formsMisc.signature.chooseStyle' | translate }}
            </h3>
          </div>

          <div class="styles-grid">
            <div 
              *ngFor="let style of signatureStyles; let i = index"
              class="signature-style-card"
              [class.selected]="selectedStyleId === style.id"
              (click)="selectStyle(style)">
              
              <div class="style-badge" *ngIf="i === 0">
                <i class="pi pi-star-fill"></i>
              </div>
              
              <div class="card-content">
                <div class="style-preview" 
                     [style.font-family]="style.fontFamily"
                     [style.font-weight]="style.fontWeight"
                     [style.font-size]="'18px'"
                     [style.letter-spacing]="style.letterSpacing"
                     [style.color]="style.color">
                  {{ signerName.length > 15 ? signerName.substring(0, 15) + '...' : signerName }}
                </div>
                <div class="style-name">{{ style.name }}</div>
              </div>
              
              <div class="selection-indicator" *ngIf="selectedStyleId === style.id">
                <i class="pi pi-check"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Mensagem quando não há nome -->
        <div class="empty-state" *ngIf="!signerName">
          <div class="empty-icon">
            <i class="pi pi-pencil"></i>
          </div>
          <h3>{{ 'formsMisc.signature.emptyTitle' | translate }}</h3>
          <p>{{ 'formsMisc.signature.emptyDesc' | translate }}</p>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="modal-footer">
          <button 
            pButton 
            type="button"
            [label]="'formsMisc.signature.btnCancel' | translate" 
            icon="pi pi-times"
            class="p-button-text p-button-secondary"
            (click)="onCancel()">
          </button>
          <button 
            pButton 
            type="button"
            [label]="'formsMisc.signature.btnConfirm' | translate" 
            icon="pi pi-check"
            class="p-button-primary confirm-btn"
            [disabled]="!canConfirm()"
            (click)="onConfirm()">
          </button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['./signature-modal.component.scss']
})
export class SignatureModalComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() initialName = '';
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() signatureConfirmed = new EventEmitter<SignatureData>();
  @Output() cancelled = new EventEmitter<void>();

  signerName = '';
  selectedStyleId = '';
  currentStyle: SignatureStyle | null = null;

  private cdr = inject(ChangeDetectorRef);
  private i18n = inject(TranslationService);

  // Estilos de assinatura disponíveis (nomes via i18n em initializeComponent)
  signatureStyles: SignatureStyle[] = [
    {
      id: 'elegant-script',
      name: '',
      fontFamily: "'Great Vibes', cursive",
      fontWeight: '400',
      fontSize: '28px',
      fontStyle: 'normal',
      letterSpacing: '1px',
      color: '#1a365d',
      previewClass: 'style-elegant-script'
    },
    {
      id: 'classic-cursive',
      name: '',
      fontFamily: "'Tangerine', cursive",
      fontWeight: '700',
      fontSize: '32px',
      fontStyle: 'normal',
      letterSpacing: '1px',
      color: '#2d3748',
      previewClass: 'style-classic-cursive'
    },
    {
      id: 'modern-signature',
      name: '',
      fontFamily: "'Pacifico', cursive",
      fontWeight: '400',
      fontSize: '24px',
      fontStyle: 'normal',
      letterSpacing: '0',
      color: '#1e40af',
      previewClass: 'style-modern'
    },
    {
      id: 'artistic-brush',
      name: '',
      fontFamily: "'Kaushan Script', cursive",
      fontWeight: '400',
      fontSize: '26px',
      fontStyle: 'normal',
      letterSpacing: '1px',
      color: '#7c3aed',
      previewClass: 'style-artistic'
    },
    {
      id: 'professional-serif',
      name: '',
      fontFamily: "'Pinyon Script', cursive",
      fontWeight: '400',
      fontSize: '28px',
      fontStyle: 'normal',
      letterSpacing: '1px',
      color: '#374151',
      previewClass: 'style-professional'
    },
    {
      id: 'handwritten-casual',
      name: '',
      fontFamily: "'Caveat', cursive",
      fontWeight: '600',
      fontSize: '26px',
      fontStyle: 'normal',
      letterSpacing: '0',
      color: '#1f2937',
      previewClass: 'style-handwritten'
    },
    {
      id: 'dancing-script',
      name: '',
      fontFamily: "'Dancing Script', cursive",
      fontWeight: '700',
      fontSize: '28px',
      fontStyle: 'normal',
      letterSpacing: '1px',
      color: '#0ea5e9',
      previewClass: 'style-dancing'
    },
    {
      id: 'sacramento',
      name: '',
      fontFamily: "'Sacramento', cursive",
      fontWeight: '400',
      fontSize: '32px',
      fontStyle: 'normal',
      letterSpacing: '1px',
      color: '#7c3aed',
      previewClass: 'style-sacramento'
    },
    {
      id: 'alex-brush',
      name: '',
      fontFamily: "'Alex Brush', cursive",
      fontWeight: '400',
      fontSize: '30px',
      fontStyle: 'normal',
      letterSpacing: '1px',
      color: '#dc2626',
      previewClass: 'style-alex-brush'
    },
    {
      id: 'bold-professional',
      name: '',
      fontFamily: "'Arial', sans-serif",
      fontWeight: '700',
      fontSize: '22px',
      fontStyle: 'normal',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color: '#1e293b',
      previewClass: 'style-bold-professional'
    },
    {
      id: 'italic-elegant',
      name: '',
      fontFamily: "'Georgia', serif",
      fontWeight: '400',
      fontSize: '24px',
      fontStyle: 'italic',
      letterSpacing: '1px',
      color: '#059669',
      previewClass: 'style-italic-elegant'
    }
  ];

  ngOnInit() {
    this.initializeComponent();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && changes['visible'].currentValue === true) {
      this.initializeComponent();
    }
  }

  onDialogShow() {
    this.initializeComponent();
  }

  private initializeComponent() {
    for (const style of this.signatureStyles) {
      style.name = this.i18n.translate(`formsMisc.signature.style.${style.id}`);
    }
    this.signerName = this.initialName || '';
    if (this.signatureStyles.length > 0 && !this.selectedStyleId) {
      this.selectedStyleId = this.signatureStyles[0].id;
      this.currentStyle = this.signatureStyles[0];
    }
  }

  selectStyle(style: SignatureStyle) {
    this.selectedStyleId = style.id;
    this.currentStyle = style;
    this.cdr.detectChanges();
  }

  canConfirm(): boolean {
    return !!this.signerName && this.signerName.trim().length >= 3 && !!this.selectedStyleId && !!this.currentStyle;
  }

  onConfirm() {
    if (!this.canConfirm() || !this.currentStyle) return;

    const signatureData: SignatureData = {
      name: this.signerName.trim(),
      styleId: this.selectedStyleId,
      style: this.currentStyle,
      timestamp: new Date()
    };

    this.signatureConfirmed.emit(signatureData);
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onCancel() {
    this.cancelled.emit();
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
