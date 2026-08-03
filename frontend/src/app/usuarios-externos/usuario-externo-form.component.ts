import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UsuarioExternoService, UsuarioExterno } from '../core/usuario-externo.service';
import { AuthService } from '../auth/auth.service';
import { TranslationService } from '../core/translation.service';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import { toastKey } from '../core/toast-i18n.util';
import { TranslatePipe } from '../core/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-usuario-externo-form',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    CardModule,
    ToastModule,
    TranslatePipe
  ],
  template: `
    <p-toast></p-toast>
    
    <div class="form-container">
      <div class="form-header">
        <button pButton icon="pi pi-arrow-left" [label]="'formsMisc.externo.btnBack' | translate"
                class="p-button-text" routerLink="/usuarios-externos">
        </button>
        <h1>{{ (isEditing ? 'formsMisc.externo.titleEdit' : 'formsMisc.externo.titleNew') | translate }}</h1>
      </div>

      <div class="form-content">
        <p-card>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <!-- Informações Básicas -->
            <div class="form-section">
              <h3>
                <i class="pi pi-user"></i>
                {{ 'formsMisc.externo.sectionBasic' | translate }}
              </h3>
              
              <div class="p-fluid">
                <div class="form-grid">
                  <div class="field">
                    <label for="nome">{{ 'formsMisc.externo.labelNome' | translate }} *</label>
                    <input id="nome" type="text" pInputText formControlName="nome" 
                           [placeholder]="'formsMisc.externo.placeholderNome' | translate">
                    <small class="p-error" *ngIf="form.get('nome')?.touched && form.get('nome')?.errors?.['required']">
                      {{ 'formsMisc.externo.errorNomeRequired' | translate }}
                    </small>
                    <small class="p-error" *ngIf="form.get('nome')?.touched && form.get('nome')?.errors?.['meaningfulText']">
                      Informe um nome com letras, sem conteúdo composto apenas por números ou símbolos.
                    </small>
                  </div>
                  
                  <div class="field">
                    <label for="email">{{ 'formsMisc.externo.labelEmail' | translate }} *</label>
                    <input id="email" type="email" pInputText formControlName="email" 
                           [placeholder]="'formsMisc.externo.placeholderEmail' | translate">
                    <small class="p-error" *ngIf="form.get('email')?.touched && form.get('email')?.errors?.['required']">
                      {{ 'formsMisc.externo.errorEmailRequired' | translate }}
                    </small>
                    <small class="p-error" *ngIf="form.get('email')?.touched && form.get('email')?.errors?.['email']">
                      {{ 'formsMisc.externo.errorEmailInvalid' | translate }}
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Informações da Empresa -->
            <div class="form-section">
              <h3>
                <i class="pi pi-building"></i>
                {{ 'formsMisc.externo.sectionCompany' | translate }}
              </h3>
              
              <div class="p-fluid">
                <div class="form-grid">
                  <div class="field">
                    <label for="empresa">{{ 'formsMisc.externo.labelEmpresa' | translate }}</label>
                    <input id="empresa" type="text" pInputText formControlName="empresa" 
                           [placeholder]="'formsMisc.externo.placeholderEmpresa' | translate">
                    <small class="p-error" *ngIf="form.get('empresa')?.touched && form.get('empresa')?.errors?.['meaningfulText']">
                      Informe uma empresa com conteúdo legível.
                    </small>
                  </div>
                  
                  <div class="field">
                    <label for="cargo">{{ 'formsMisc.externo.labelCargo' | translate }}</label>
                    <input id="cargo" type="text" pInputText formControlName="cargo" 
                           [placeholder]="'formsMisc.externo.placeholderCargo' | translate">
                  </div>
                  
                  <div class="field">
                    <label for="telefone">{{ 'formsMisc.externo.labelTelefone' | translate }}</label>
                    <input id="telefone" type="text" pInputText formControlName="telefone" 
                           [placeholder]="'formsMisc.externo.placeholderTelefone' | translate">
                  </div>
                </div>
              </div>
            </div>

            <!-- Observações -->
            <div class="form-section">
              <h3>
                <i class="pi pi-comment"></i>
                {{ 'formsMisc.externo.sectionNotes' | translate }}
              </h3>
              
              <div class="p-fluid">
                <div class="field">
                  <label for="observacoes">{{ 'formsMisc.externo.labelObservacoes' | translate }}</label>
                  <textarea id="observacoes" pInputTextarea formControlName="observacoes" 
                            rows="4" [placeholder]="'formsMisc.externo.placeholderObservacoes' | translate">
                  </textarea>
                </div>
              </div>
            </div>

            <!-- Info Box -->
            <div class="info-box" *ngIf="!isEditing">
              <i class="pi pi-info-circle"></i>
              <div>
                <strong>{{ 'formsMisc.externo.infoCreate' | translate }}</strong>
                <p>{{ 'formsMisc.externo.infoCreateDetail' | translate }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <button pButton type="button" [label]="'formsMisc.externo.btnCancel' | translate"
                      class="p-button-outlined" routerLink="/usuarios-externos">
              </button>
              <button pButton type="submit" 
                      [label]="(isEditing ? 'formsMisc.externo.btnSaveEdit' : 'formsMisc.externo.btnCreate') | translate"
                      icon="pi pi-check"
                      [loading]="saving"
                      [disabled]="form.invalid || saving">
              </button>
            </div>
          </form>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      padding: 24px 24px calc(96px + env(safe-area-inset-bottom));
      max-width: 900px;
    }

    .form-header {
      margin-bottom: 24px;

      h1 {
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
        margin: 16px 0 0;
      }
    }

    .form-section {
      margin-bottom: 32px;

      h3 {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: 600;
        color: #334155;
        margin: 0 0 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e2e8f0;

        i {
          color: #0ea5e9;
        }
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-size: 14px;
        font-weight: 500;
        color: #334155;
      }

      input, textarea {
        border-radius: 10px;
      }
    }

    .info-box {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      margin-bottom: 24px;

      i {
        color: #0ea5e9;
        font-size: 20px;
        margin-top: 2px;
      }

      strong {
        color: #0369a1;
        display: block;
        margin-bottom: 4px;
      }

      p {
        color: #0c4a6e;
        margin: 0;
        font-size: 14px;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UsuarioExternoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioExternoService = inject(UsuarioExternoService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form!: FormGroup;
  isEditing = false;
  saving = false;
  usuarioId: number | null = null;

  ngOnInit() {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(150), meaningfulTextValidator]],
      email: ['', [Validators.required, Validators.email]],
      empresa: ['', [Validators.maxLength(150), optionalMeaningfulTextValidator]],
      cargo: ['', [Validators.maxLength(100), optionalMeaningfulTextValidator]],
      telefone: ['', [Validators.maxLength(30), Validators.pattern(/^\+?[0-9()\s.-]{8,30}$/)]],
      observacoes: ['', Validators.maxLength(2000)]
    });

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditing = true;
      this.usuarioId = +id;
      this.loadUsuario();
    }
  }

  loadUsuario() {
    if (!this.usuarioId) return;

    this.usuarioExternoService.getById(this.usuarioId).subscribe({
      next: (usuario) => {
        this.form.patchValue({
          nome: usuario.nome,
          email: usuario.email,
          empresa: usuario.empresa || '',
          cargo: usuario.cargo || '',
          telefone: usuario.telefone || '',
          observacoes: usuario.observacoes || ''
        });
      },
      error: (err) => {
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'usuariosExternos.form.toast.loadUserError');
        console.error('Failed to load user:', err);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const data = this.form.value;

    if (this.isEditing && this.usuarioId) {
      this.usuarioExternoService.update(this.usuarioId, data).subscribe({
        next: () => {
          this.saving = false;
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'usuariosExternos.form.toast.updatedSuccess');
          setTimeout(() => {
            this.router.navigate(['/usuarios-externos']);
          }, 1500);
        },
        error: (err) => {
          this.saving = false;
          toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'usuariosExternos.form.toast.updateError', {
            error: extractApiErrorMessage(err, this.i18n)
          });
        }
      });
    } else {
      // Get current user ID for criadoPor
      const currentUser = this.authService.getCurrentUser();
      const criadoPor = currentUser?.id || 0;

      this.usuarioExternoService.create(data, criadoPor).subscribe({
        next: () => {
          this.saving = false;
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'usuariosExternos.form.toast.createdSuccess');
          setTimeout(() => {
            this.router.navigate(['/usuarios-externos']);
          }, 2000);
        },
        error: (err) => {
          this.saving = false;
          toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'usuariosExternos.form.toast.createError', {
            error: extractApiErrorMessage(err, this.i18n)
          });
        }
      });
    }
  }
}

function meaningfulTextValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return value && /\p{L}/u.test(value) ? null : { meaningfulText: true };
}

function optionalMeaningfulTextValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return !value || /\p{L}/u.test(value) ? null : { meaningfulText: true };
}
