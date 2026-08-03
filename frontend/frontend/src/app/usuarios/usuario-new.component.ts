import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { TranslatePipe } from '../core/translate.pipe';
import { UsuarioService } from '../core/usuarios.service';
import { PerfilService, Perfil } from '../core/perfil.service';
import { TranslationService } from '../core/translation.service';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import { toastKey } from '../core/toast-i18n.util';

@Component({
  selector: 'app-usuario-new',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    ToastModule,
    TranslatePipe,
    PageHeroComponent
  ],
  template: `
    <p-toast></p-toast>
    
    <div class="as-page usuario-new-container">
      <app-page-hero
        variant="navy"
        [titleKey]="isEditMode ? 'usuarios.new.titleEdit' : 'usuarios.new.titleNew'"
        [subtitleKey]="isEditMode ? 'usuarios.new.subtitleEdit' : 'usuarios.new.subtitleNew'"
        titleIcon="pi-user"
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
            [label]="(isEditMode ? 'usuarios.new.btnUpdate' : 'usuarios.new.btnSave') | translate"
            [icon]="isEditMode ? 'pi pi-check' : 'pi pi-save'"
            class="p-button-primary"
            (click)="salvarUsuario()"
            [disabled]="!canSave">
          </button>
        </div>
      </app-page-hero>

      <!-- Formulário -->
      <div class="form-container">
        <div class="form-card">
          <h3>{{ 'usuarios.new.form.section.user' | translate }}</h3>
          
          <!-- Modo de criação -->
          <form [formGroup]="usuarioForm" *ngIf="!isEditMode" class="form-grid">
            <div class="form-group">
              <label for="nome">{{ 'usuarios.new.form.label.fullName' | translate }} <span class="required">*</span></label>
              <input 
                pInputText 
                id="nome"
                formControlName="nome"
                [placeholder]="'usuarios.new.form.placeholder.fullName' | translate"
                class="form-input"
                [class.error]="usuarioForm.get('nome')?.invalid && usuarioForm.get('nome')?.touched">
              <small *ngIf="usuarioForm.get('nome')?.invalid && usuarioForm.get('nome')?.touched" class="error-message">
                {{ 'usuarios.new.form.validation.nameRequired' | translate }}
              </small>
            </div>

            <div class="form-group">
              <label for="email">{{ 'usuarios.new.form.label.email' | translate }} <span class="required">*</span></label>
              <input 
                pInputText 
                id="email"
                type="email"
                formControlName="email"
                [placeholder]="'usuarios.new.form.placeholder.email' | translate"
                class="form-input"
                [class.error]="usuarioForm.get('email')?.invalid && usuarioForm.get('email')?.touched">
              <small *ngIf="usuarioForm.get('email')?.invalid && usuarioForm.get('email')?.touched" class="error-message">
                <span *ngIf="usuarioForm.get('email')?.errors?.['required']">{{ 'usuarios.new.form.validation.emailRequired' | translate }}</span>
                <span *ngIf="usuarioForm.get('email')?.errors?.['email']">{{ 'usuarios.new.form.validation.emailInvalid' | translate }}</span>
              </small>
            </div>

            <div class="form-group">
              <label for="perfilId">{{ 'usuarios.new.form.label.profile' | translate }}</label>
              <p-dropdown 
                id="perfilId"
                formControlName="perfilId"
                [options]="perfis"
                optionLabel="nome"
                optionValue="id"
                [placeholder]="'usuarios.new.form.placeholder.profileOptional' | translate"
                [filter]="true"
                filterBy="nome"
                [showClear]="true"
                class="form-input">
              </p-dropdown>
            </div>
          </form>

          <!-- Modo de edição -->
          <form [formGroup]="usuarioForm" *ngIf="isEditMode" class="form-grid">
            <div class="form-group">
              <label for="nomeAtual">{{ 'usuarios.new.form.label.currentName' | translate }}</label>
              <input 
                pInputText 
                id="nomeAtual"
                [value]="usuarioAtual.nome"
                [disabled]="true"
                class="form-input disabled-input">
            </div>

            <div class="form-group">
              <label for="emailAtual">{{ 'usuarios.new.form.label.currentEmail' | translate }}</label>
              <input 
                pInputText 
                id="emailAtual"
                type="email"
                [value]="usuarioAtual.email"
                [disabled]="true"
                class="form-input disabled-input">
            </div>

            <div class="form-group">
              <label for="perfilAtual">{{ 'usuarios.new.form.label.currentProfile' | translate }}</label>
              <input 
                pInputText 
                id="perfilAtual"
                [value]="usuarioAtual.perfil?.nome || ('usuarios.new.form.noProfile' | translate)"
                [disabled]="true"
                class="form-input disabled-input">
            </div>

            <div class="form-group">
              <label for="novoNome">{{ 'usuarios.new.form.label.newName' | translate }}</label>
              <input 
                pInputText 
                id="novoNome"
                formControlName="novoNome"
                [placeholder]="'usuarios.new.form.placeholder.newName' | translate"
                class="form-input"
                [class.error]="usuarioForm.get('novoNome')?.invalid && usuarioForm.get('novoNome')?.touched">
            </div>

            <div class="form-group">
              <label for="novoEmail">{{ 'usuarios.new.form.label.newEmail' | translate }}</label>
              <input 
                pInputText 
                id="novoEmail"
                type="email"
                formControlName="novoEmail"
                [placeholder]="'usuarios.new.form.placeholder.newEmail' | translate"
                class="form-input"
                [class.error]="usuarioForm.get('novoEmail')?.invalid && usuarioForm.get('novoEmail')?.touched">
              <small *ngIf="usuarioForm.get('novoEmail')?.invalid && usuarioForm.get('novoEmail')?.touched" class="error-message">
                {{ 'usuarios.new.form.validation.emailInvalid' | translate }}
              </small>
            </div>

            <div class="form-group">
              <label for="novoPerfilId">{{ 'usuarios.new.form.label.newProfile' | translate }}</label>
              <p-dropdown 
                id="novoPerfilId"
                formControlName="novoPerfilId"
                [options]="perfis"
                optionLabel="nome"
                optionValue="id"
                [placeholder]="'usuarios.new.form.placeholder.newProfile' | translate"
                [filter]="true"
                filterBy="nome"
                [showClear]="true"
                class="form-input">
              </p-dropdown>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .usuario-new-container {
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

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
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

    .error-message {
      display: block;
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    @media (max-width: 768px) {
      .usuario-new-container {
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

      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UsuarioNewComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(UsuarioService);
  private perfilService = inject(PerfilService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  isEditMode = false;
  usuarioId: number | null = null;
  usuarioAtual: any = {};
  perfis: Perfil[] = [];
  usuarioForm!: FormGroup;
  submitted = false;
  loading = false;
  canSave = false;

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.usuarioId = +params['id'];
        this.initEditForm();
        this.carregarUsuario();
      } else {
        this.isEditMode = false;
        this.usuarioId = null;
        this.initCreateForm();
      }
      this.loadPerfis();
    });
  }

  initCreateForm() {
    this.usuarioForm = this.fb.group({
      nome: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      perfilId: [null]
    });

    // Observar mudanças nos campos para atualizar canSave
    this.usuarioForm.valueChanges.subscribe(() => {
      this.checkCanSave();
    });

    this.usuarioForm.statusChanges.subscribe(() => {
      this.checkCanSave();
    });

    // Verificar inicialmente
    this.checkCanSave();
  }

  initEditForm() {
    this.usuarioForm = this.fb.group({
      novoNome: [''],
      novoEmail: ['', [Validators.email]],
      novoPerfilId: [null]
    });

    // Observar mudanças nos campos para atualizar canSave
    this.usuarioForm.valueChanges.subscribe(() => {
      this.checkCanSave();
    });

    this.usuarioForm.statusChanges.subscribe(() => {
      this.checkCanSave();
    });
    this.checkCanSave();
  }

  checkCanSave() {
    if (!this.usuarioForm) {
      this.canSave = false;
      this.cdr.markForCheck();
      return;
    }

    if (!this.isEditMode) {
      // Modo criação: nome e email devem estar preenchidos e válidos
      const nome = this.usuarioForm.get('nome')?.value?.trim() || '';
      const email = this.usuarioForm.get('email')?.value?.trim() || '';
      const nomeControl = this.usuarioForm.get('nome');
      const emailControl = this.usuarioForm.get('email');
      // Usar Boolean() para garantir compatibilidade com Chrome
      const nomeValid = nomeControl ? Boolean(nomeControl.valid) : false;
      const emailValid = emailControl ? Boolean(emailControl.valid) : false;

      this.canSave = nome.length > 0 && email.length > 0 && nomeValid && emailValid;
    } else {
      // Modo edição: pelo menos um campo deve ter mudado
      if (!this.usuarioAtual || !this.usuarioAtual.id) {
        this.canSave = false;
        this.cdr.markForCheck();
        return;
      }

      const novoNome = this.usuarioForm.get('novoNome')?.value?.trim() || '';
      const novoEmail = this.usuarioForm.get('novoEmail')?.value?.trim() || '';
      const novoPerfilId = this.usuarioForm.get('novoPerfilId')?.value;

      const nomeAtual = this.usuarioAtual.nome?.trim() || '';
      const emailAtual = this.usuarioAtual.email?.trim() || '';
      const perfilAtualId = this.usuarioAtual.perfil?.id || null;

      const nomeMudou = novoNome.length > 0 && novoNome !== nomeAtual;
      const emailMudou = novoEmail.length > 0 && novoEmail.toLowerCase() !== emailAtual.toLowerCase();
      const perfilMudou = novoPerfilId !== null && novoPerfilId !== undefined && novoPerfilId !== perfilAtualId;

      const temMudanca = nomeMudou || emailMudou || perfilMudou;
      const novoNomeControl = this.usuarioForm.get('novoNome');
      const novoEmailControl = this.usuarioForm.get('novoEmail');
      // Usar Boolean() para garantir compatibilidade com Chrome
      const camposValidos = (!novoNome || Boolean(novoNomeControl?.valid)) &&
                           (!novoEmail || Boolean(novoEmailControl?.valid));

      this.canSave = temMudanca && Boolean(camposValidos);
    }

    this.cdr.markForCheck();
  }

  loadPerfis() {
    this.perfilService.listarTodos().subscribe({
      next: (perfis: Perfil[]) => {
        this.perfis = perfis;
      },
      error: (error: any) => {
        console.error('Failed to load profiles:', error);
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'usuarios.new.toast.loadPerfisError');
      }
    });
  }

  carregarUsuario() {
    if (!this.usuarioId) return;

    this.loading = true;
    this.api.getById(this.usuarioId).subscribe({
      next: (usuario) => {
        this.usuarioAtual = usuario;
        this.loading = false;
        this.checkCanSave();
      },
      error: (error) => {
        console.error('Failed to load user:', error);
        this.loading = false;
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'usuarios.new.toast.loadUsuarioError');
        this.router.navigate(['/usuarios']);
      }
    });
  }

  salvarUsuario() {
    if (!this.canSave || this.loading) return;

    this.submitted = true;
    this.loading = true;

    if (this.isEditMode) {
      this.atualizarUsuario();
    } else {
      this.criarUsuario();
    }
  }

  criarUsuario() {
    const formValue = this.usuarioForm.value;
    const usuarioData = {
      nome: formValue.nome.trim(),
      email: formValue.email.trim().toLowerCase(),
      perfilId: formValue.perfilId || null
    };

    this.api.create(usuarioData).subscribe({
      next: () => {
        this.loading = false;
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'usuarios.new.toast.criadoOk');
        // Aguardar um pouco para a notificação aparecer antes de navegar
        setTimeout(() => {
          this.router.navigate(['/usuarios']);
        }, 1500);
      },
      error: (error) => {
        console.error('Failed to create user:', error);
        this.loading = false;
        const errorMsg =
          extractApiErrorMessage(error, this.i18n, 'usuarios.new.toast.createErrorFallback');
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'usuarios.new.toast.errorDetail', { msg: errorMsg });
      }
    });
  }

  atualizarUsuario() {
    const formValue = this.usuarioForm.value;
    const updates: any = {};

    if (formValue.novoNome?.trim()) {
      updates.nome = formValue.novoNome.trim();
    }
    if (formValue.novoEmail?.trim()) {
      updates.email = formValue.novoEmail.trim().toLowerCase();
    }
    if (formValue.novoPerfilId !== null && formValue.novoPerfilId !== undefined) {
      updates.perfilId = formValue.novoPerfilId;
    }

    if (Object.keys(updates).length === 0) {
      toastKey(this.messageService, this.i18n, 'warn', 'common.toast.warn', 'usuarios.new.toast.noChanges');
      this.loading = false;
      return;
    }

    this.api.update(this.usuarioId!, updates).subscribe({
      next: () => {
        this.loading = false;
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'usuarios.new.toast.atualizadoOk');
        // Aguardar um pouco para a notificação aparecer antes de navegar
        setTimeout(() => {
          this.router.navigate(['/usuarios']);
        }, 1500);
      },
      error: (error) => {
        console.error('Failed to update user:', error);
        this.loading = false;
        const errorMsg =
          extractApiErrorMessage(error, this.i18n, 'usuarios.new.toast.updateErrorFallback');
        toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'usuarios.new.toast.errorDetail', { msg: errorMsg });
      }
    });
  }

  cancelar() {
    this.router.navigate(['/usuarios']);
  }
}
