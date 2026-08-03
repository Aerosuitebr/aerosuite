import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FcuService, Fcu } from '../core/fcu.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import { toastKey } from '../core/toast-i18n.util';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';

interface NovoFcu {
  fcuCodigo: string;
  fcuDescription: string;
  modelo: string;
  pn: string;
  serialNumber?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-fcu-new',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    CheckboxModule,
    FormsModule,
    ToastModule,
    TranslatePipe,
    PageHeroComponent
  ],
  template: `
    <p-toast></p-toast>
    
    <div class="as-page fcu-new-container">
      <app-page-hero
        variant="sky"
        [titleKey]="isEditMode ? 'fcu.new.titleEdit' : 'fcu.new.titleNew'"
        [subtitleKey]="isEditMode ? 'fcu.new.subtitleEdit' : 'fcu.new.subtitleNew'"
        titleIcon="pi-microchip"
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
            [label]="(isEditMode ? 'fcu.new.btnUpdate' : 'fcu.new.btnSave') | translate"
            [icon]="isEditMode ? 'pi pi-check' : 'pi pi-save'"
            class="p-button-primary"
            (click)="salvarFcu()"
            [disabled]="!isFormValid">
          </button>
        </div>
      </app-page-hero>

      <!-- Formulário -->
      <div class="form-container">
        <div class="form-card">
          <h3>{{ 'fcu.new.form.section.basic' | translate }}</h3>
          
          <div class="form-row">
            <!-- Código do Produto Aeronáutico -->
            <div class="form-group">
              <label for="fcuCodigo">{{ 'fcu.new.form.label.code' | translate }}</label>
              <input 
                pInputText 
                id="fcuCodigo"
                [(ngModel)]="fcu.fcuCodigo"
                (ngModelChange)="onFormChange()"
                [placeholder]="'fcu.new.form.placeholder.code' | translate"
                class="w-full">
            </div>

            <!-- Modelo -->
            <div class="form-group">
              <label for="modelo">{{ 'fcu.new.form.label.model' | translate }}</label>
              <input 
                pInputText 
                id="modelo"
                [(ngModel)]="fcu.modelo"
                (ngModelChange)="onFormChange()"
                [placeholder]="'fcu.new.form.placeholder.model' | translate"
                class="w-full"
                required>
            </div>
          </div>

          <div class="form-row">
            <!-- PN -->
            <div class="form-group">
              <label for="pn">{{ 'fcu.new.form.label.pn' | translate }}</label>
              <input 
                pInputText 
                id="pn"
                [(ngModel)]="fcu.pn"
                (ngModelChange)="onFormChange()"
                [placeholder]="'fcu.new.form.placeholder.pn' | translate"
                class="w-full">
            </div>

            <!-- Serial Number -->
            <div class="form-group">
              <label for="serialNumber">{{ 'fcu.new.form.label.serial' | translate }}</label>
              <input 
                pInputText 
                id="serialNumber"
                [(ngModel)]="fcu.serialNumber"
                (ngModelChange)="onFormChange()"
                [placeholder]="'fcu.new.form.placeholder.serial' | translate"
                class="w-full">
            </div>
          </div>

          <!-- Descrição -->
          <div class="form-group">
            <label for="fcuDescription">{{ 'fcu.new.form.label.description' | translate }}</label>
            <textarea 
              pInputTextarea 
              id="fcuDescription"
              [(ngModel)]="fcu.fcuDescription"
              (ngModelChange)="onFormChange()"
              [placeholder]="'fcu.new.form.placeholder.description' | translate"
              rows="4"
              class="w-full"
              required>
            </textarea>
          </div>

          <!-- Status -->
          <div class="form-group">
            <div class="checkbox-group">
              <p-checkbox 
                [(ngModel)]="fcu.isActive"
                (ngModelChange)="onFormChange()"
                [binary]="true"
                inputId="ativo">
              </p-checkbox>
              <label for="ativo">{{ 'fcu.new.form.label.active' | translate }}</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./fcu-new.component.scss']
})
export class FcuNewComponent implements OnInit {
  fcu: NovoFcu = {
    fcuCodigo: '',
    fcuDescription: '',
    modelo: '',
    pn: '',
    serialNumber: '',
    isActive: true
  };

  isEditMode = false;
  fcuId: number | null = null;
  
  // Getter para validação do formulário (reavaliado automaticamente)
  get isFormValid(): boolean {
    const valido = this.formularioValido();
    // Forçar detecção de mudanças quando a validação é verificada
    this.cdr.markForCheck();
    return valido;
  }

  constructor(
    private fcuService: FcuService,
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
      this.fcuId = +id;
    }

    // Também escutar mudanças nos parâmetros (caso navegue entre FCUs)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.fcuId = +params['id'];
        if (this.fcuId) {
          this.carregarFcuParaEdicao(this.fcuId);
        }
      } else {
        this.isEditMode = false;
        this.fcuId = null;
      }
    });
    
    // Se já temos o ID do snapshot, carregar o FCU
    if (id && this.fcuId) {
      this.carregarFcuParaEdicao(this.fcuId);
    }
  }

  carregarFcuParaEdicao(id: number) {
    this.fcuService.get(id).subscribe({
      next: (fcuData) => {
        
        // Preencher o formulário com os dados do Produto Aeronáutico
        this.fcu = {
          fcuCodigo: fcuData.fcuCodigo ? String(fcuData.fcuCodigo).trim() : '',
          fcuDescription: (fcuData.fcuDescription && String(fcuData.fcuDescription).trim()) || '',
          modelo: (fcuData.modelo && String(fcuData.modelo).trim()) || '',
          pn: (fcuData.pn && String(fcuData.pn).trim()) || '',
          serialNumber: (fcuData.serialNumber && String(fcuData.serialNumber).trim()) || '',
          isActive: fcuData.isActive !== undefined ? fcuData.isActive : true
        };
        
        // Forçar detecção de mudanças para atualizar o estado do botão
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        
        // Garantir que o botão seja habilitado após carregar os dados
        // Usar múltiplos timeouts para garantir que a validação seja reavaliada
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 50);
        
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 200);
        
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 500);
      },
      error: () => {
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'fcu.new.toast.loadEditError');
        this.router.navigate(['/fcu']);
      }
    });
  }

  onFormChange() {
    // Forçar detecção de mudanças quando o formulário é alterado
    this.cdr.markForCheck();
    // Pequeno delay para garantir que o ngModel foi atualizado
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  formularioValido(): boolean {
    // Em modo de edição, validar de forma mais flexível
    if (this.isEditMode) {
      // Para edição, apenas descrição e modelo são obrigatórios (código pode estar vazio)
      // O FCU já existe, então não precisamos validar o código
      const descricaoValida = !!(this.fcu.fcuDescription && typeof this.fcu.fcuDescription === 'string' && this.fcu.fcuDescription.trim().length > 0);
      const modeloValido = !!(this.fcu.modelo && typeof this.fcu.modelo === 'string' && this.fcu.modelo.trim().length > 0);
      
      const resultado = descricaoValida && modeloValido;
      return resultado;
    }
    
    // Para criação, validar apenas descrição e modelo (fcuCodigo não é obrigatório)
    const descricaoValida = !!(this.fcu.fcuDescription && typeof this.fcu.fcuDescription === 'string' && this.fcu.fcuDescription.trim().length > 0);
    const modeloValido = !!(this.fcu.modelo && typeof this.fcu.modelo === 'string' && this.fcu.modelo.trim().length > 0);
    
    const resultado = descricaoValida && modeloValido;
    return resultado;
  }

  salvarFcu() {
    if (!this.formularioValido()) {
      toastKey(
        this.messageService,
        this.i18n,
        'warn',
        'fcu.new.toast.formIncompleteSummary',
        this.isEditMode ? 'fcu.new.toast.formIncompleteEdit' : 'fcu.new.toast.formIncompleteCreate'
      );
      return;
    }

    // Preparar dados para envio
    const fcuData: any = {
      fcuDescription: this.fcu.fcuDescription.trim(),
      modelo: this.fcu.modelo.trim()
    };

    // Adicionar fcuCodigo apenas se estiver preenchido (não é obrigatório)
    if (this.fcu.fcuCodigo && this.fcu.fcuCodigo.trim().length > 0) {
      fcuData.fcuCodigo = this.fcu.fcuCodigo.trim();
    }

    // Adicionar campos opcionais apenas se estiverem preenchidos
    if (this.fcu.pn && this.fcu.pn.trim().length > 0) {
      fcuData.pn = this.fcu.pn.trim();
    }
    
    if (this.fcu.serialNumber && this.fcu.serialNumber.trim().length > 0) {
      fcuData.serialNumber = this.fcu.serialNumber.trim();
    }


    // Se estiver em modo de edição, fazer update; caso contrário, criar novo
    if (this.isEditMode && this.fcuId) {
      // Atualizar Produto Aeronáutico existente
      this.fcuService.update(this.fcuId, fcuData).subscribe({
        next: (response) => {
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'fcu.new.toast.updateSuccess');
          this.router.navigate(['/fcu']);
        },
        error: (error) => {
          console.error('Failed to update aeronautical product:', error);
          const errorMessage =
            extractApiErrorMessage(error, this.i18n, 'fcu.new.toast.saveErrorUpdate');
          toastKey(
            this.messageService,
            this.i18n,
            'error',
            'fcu.new.toast.saveErrorSummary',
            'fcu.new.toast.saveErrorDetail',
            { msg: errorMessage }
          );
        }
      });
    } else {
      // Chamar API para criar Produto Aeronáutico
      this.fcuService.create(fcuData).subscribe({
        next: (response) => {
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'fcu.new.toast.createSuccess');
          this.router.navigate(['/fcu']);
        },
        error: (error) => {
          console.error('Failed to create aeronautical product:', error);
          console.error('Resposta completa do erro:', JSON.stringify(error, null, 2));
          const errorMessage =
            extractApiErrorMessage(error, this.i18n, 'fcu.new.toast.saveErrorCreate');
          toastKey(
            this.messageService,
            this.i18n,
            'error',
            'fcu.new.toast.saveErrorSummary',
            'fcu.new.toast.saveErrorDetail',
            { msg: errorMessage }
          );
        }
      });
    }
  }

  cancelar() {
    this.router.navigate(['/fcu']);
  }
}

