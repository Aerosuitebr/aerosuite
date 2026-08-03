import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FabricanteService, Fabricante } from '../core/fabricantes.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { toastKey } from '../core/toast-i18n.util';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';

@Component({
  selector: 'app-fabricante-new',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    ToastModule,
    TranslatePipe,
    PageHeroComponent
  ],
  template: `
    
    <div class="as-page fabricante-new-container">
      <app-page-hero
        variant="sky"
        [titleKey]="isEditMode ? 'fabricantes.new.titleEdit' : 'fabricantes.new.titleNew'"
        [subtitleKey]="isEditMode ? 'fabricantes.new.subtitleEdit' : 'fabricantes.new.subtitleNew'"
        titleIcon="pi-building"
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
            [label]="(isEditMode ? 'fabricantes.new.btnUpdate' : 'fabricantes.new.btnSave') | translate"
            [icon]="isEditMode ? 'pi pi-check' : 'pi pi-save'"
            class="p-button-primary"
            (click)="salvarFabricante()"
            [disabled]="!isFormValid">
          </button>
        </div>
      </app-page-hero>

      <!-- Formulário -->
      <div class="form-container">
        <div class="form-card">
          <h3>{{ 'formsMisc.fabricante.sectionTitle' | translate }}</h3>
          
          <!-- Modo de criação -->
          <div *ngIf="!isEditMode" class="form-group">
            <label for="nome">{{ 'formsMisc.fabricante.labelNome' | translate }} <span class="required">*</span></label>
            <input 
              pInputText 
              id="nome"
              [(ngModel)]="fabricante.nome"
              (ngModelChange)="onFormChange()"
              (input)="onNomeInput($event)"
              [placeholder]="'formsMisc.fabricante.placeholderNome' | translate"
              class="form-input uppercase-input"
              [class.error]="!fabricante.nome?.trim() && submitted"
              maxlength="255">
            <small *ngIf="!fabricante.nome?.trim() && submitted" class="error-message">
              {{ 'formsMisc.fabricante.errorNomeRequired' | translate }}
            </small>
          </div>

          <!-- Modo de edição -->
          <div *ngIf="isEditMode">
            <div class="form-group">
              <label for="nomeAtual">{{ 'formsMisc.fabricante.labelNomeAtual' | translate }}</label>
              <input 
                pInputText 
                id="nomeAtual"
                [value]="fabricante.nome"
                [disabled]="true"
                class="form-input disabled-input">
            </div>

            <div class="form-group">
              <label for="novoFabricante">{{ 'formsMisc.fabricante.labelNovoNome' | translate }} <span class="required">*</span></label>
              <input 
                pInputText 
                id="novoFabricante"
                [(ngModel)]="novoFabricanteNome"
                (ngModelChange)="onNovoFabricanteNomeChange()"
                (input)="onNovoFabricanteNomeInput($event)"
                [placeholder]="'formsMisc.fabricante.placeholderNovoNome' | translate"
                class="form-input uppercase-input"
                [class.error]="!novoFabricanteNome?.trim() && submitted"
                maxlength="255">
              <small *ngIf="!novoFabricanteNome?.trim() && submitted" class="error-message">
                {{ 'formsMisc.fabricante.errorNovoNomeRequired' | translate }}
              </small>
              <small *ngIf="novoFabricanteNome?.trim()" class="info-message">
                {{ 'formsMisc.fabricante.infoSubstituicao' | translate }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fabricante-new-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
    }

    .header-text h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    .header-text p {
      margin: 0.25rem 0 0 0;
      color: #64748b;
      font-size: 0.95rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .form-container {
      margin-top: 2rem;
    }

    .form-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .form-card h3 {
      margin: 0 0 1.5rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
      font-size: 0.95rem;
    }

    .required {
      color: #ef4444;
    }

    .form-input {
      width: 100%;
    }

    .form-input.error {
      border-color: #ef4444;
    }

    .disabled-input {
      background-color: #f1f5f9;
      color: #64748b;
      cursor: not-allowed;
    }

    .uppercase-input {
      text-transform: uppercase;
    }

    .uppercase-input::placeholder {
      text-transform: none;
    }

    .error-message {
      display: block;
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .info-message {
      display: block;
      color: #0ea5e9;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    @media (max-width: 768px) {
      .fabricante-new-container {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class FabricanteNewComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(FabricanteService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);

  isEditMode = false;
  fabricanteId: number | null = null;
  fabricante: { nome: string } = { nome: '' };
  novoFabricanteNome: string = '';
  submitted = false;
  loading = false;

  get isFormValid(): boolean {
    if (!this.isEditMode) {
      return !!this.fabricante.nome?.trim();
    } else {
      return !!this.novoFabricanteNome?.trim();
    }
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.fabricanteId = +params['id'];
        this.carregarFabricante();
      }
    });
  }

  carregarFabricante() {
    if (!this.fabricanteId) return;

    this.loading = true;
    this.api.getById(this.fabricanteId).subscribe({
      next: (fabricante) => {
        this.fabricante = { nome: fabricante.nome || '' };
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load manufacturer:', error);
        this.loading = false;
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'fabricantes.new.toast.loadError');
        this.cancelar();
      }
    });
  }

  onNovoFabricanteNomeChange() {
    this.submitted = false;
    // Garantir que o valor está em maiúsculas
    if (this.novoFabricanteNome) {
      this.novoFabricanteNome = this.novoFabricanteNome.toUpperCase();
    }
  }

  onNovoFabricanteNomeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    const oldValue = input.value;
    const newValue = oldValue.toUpperCase();
    
    // Atualizar o valor
    this.novoFabricanteNome = newValue;
    
    // Restaurar a posição do cursor
    setTimeout(() => {
      input.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  }

  onFormChange() {
    this.submitted = false;
    // Garantir que o valor está em maiúsculas
    if (this.fabricante.nome) {
      this.fabricante.nome = this.fabricante.nome.toUpperCase();
    }
  }

  onNomeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    const oldValue = input.value;
    const newValue = oldValue.toUpperCase();
    
    // Atualizar o valor
    this.fabricante.nome = newValue;
    
    // Restaurar a posição do cursor
    setTimeout(() => {
      input.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  }

  salvarFabricante() {
    this.submitted = true;

    if (!this.isFormValid) {
      if (!this.isEditMode) {
        toastKey(this.messageService, this.i18n, 'warn', 'common.toast.warn', 'fabricantes.new.toast.warnNameCreate');
      } else {
        toastKey(this.messageService, this.i18n, 'warn', 'common.toast.warn', 'fabricantes.new.toast.warnNameEdit');
      }
      return;
    }

    this.loading = true;

    if (this.isEditMode && this.fabricanteId && this.novoFabricanteNome?.trim()) {
      // Atualizar: substituir pelo novo nome digitado
      const dados = { nome: this.novoFabricanteNome.trim().toUpperCase() };
      
      this.api.update(this.fabricanteId, dados).subscribe({
        next: () => {
          this.loading = false;
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'fabricantes.new.toast.updateSuccess');
          setTimeout(() => {
            this.router.navigate(['/fabricantes']);
          }, 1000);
        },
        error: (error) => {
          this.loading = false;
          console.error('Failed to update manufacturer:', error);
          const errorMessage = error?.error?.message || error?.message || this.i18n.translate('common.unknownError');
          toastKey(
            this.messageService,
            this.i18n,
            'error',
            'common.toast.error',
            'fabricantes.new.toast.updateError',
            { msg: errorMessage }
          );
        }
      });
    } else {
      // Criar
      const dados = { nome: this.fabricante.nome.trim().toUpperCase() };
      this.api.create(dados).subscribe({
        next: () => {
          this.loading = false;
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'fabricantes.new.toast.createSuccess');
          setTimeout(() => {
            this.router.navigate(['/fabricantes']);
          }, 1000);
        },
        error: (error) => {
          this.loading = false;
          console.error('Failed to create manufacturer:', error);
          const errorMessage = error?.error?.message || error?.message || this.i18n.translate('common.unknownError');
          toastKey(
            this.messageService,
            this.i18n,
            'error',
            'common.toast.error',
            'fabricantes.new.toast.createError',
            { msg: errorMessage }
          );
        }
      });
    }
  }

  cancelar() {
    this.router.navigate(['/fabricantes']);
  }
}

