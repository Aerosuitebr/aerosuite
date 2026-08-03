import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../auth.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { extractApiErrorMessage } from '../../core/backend-i18n-message.util';
import { AuthShellComponent } from '../../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../../shared/auth-brand-header/auth-brand-header.component';
import { sanitizeInternalReturnUrl } from '../auth-return-url.util';
import { PasswordPolicyPanelComponent } from '../../core/password-policy-panel/password-policy-panel.component';
import { passwordPolicyValidator } from '../../core/password-policy.util';

@Component({
  selector: 'app-change-password-first-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    MessageModule,
    ToastModule,
    TranslatePipe,
    AuthShellComponent,
    AuthBrandHeaderComponent,
    PasswordPolicyPanelComponent
  ],
  templateUrl: './change-password-first-login.component.html'
})
export class ChangePasswordFirstLoginComponent implements OnInit {
  private i18n = inject(TranslationService);

  changePasswordForm: FormGroup;
  loading = false;
  errorMessage = '';
  passwordChanged = false;
  userEmail = '';
  private returnUrl = '/';
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    this.changePasswordForm = this.fb.group({
      senhaTemporaria: ['', [Validators.required]],
      novaSenha: ['', [Validators.required, passwordPolicyValidator()]],
      confirmarSenha: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Verificar se está autenticado
    if (!this.authService.isAuthenticated()) {
      const returnUrl = sanitizeInternalReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
      this.router.navigate(['/login'], {
        queryParams: returnUrl !== '/' ? { returnUrl } : {}
      });
      return;
    }

    this.returnUrl = sanitizeInternalReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));

    // Obter email dos query params ou do usuário logado
    this.route.queryParams.subscribe(params => {
      this.returnUrl = sanitizeInternalReturnUrl(params['returnUrl']);
      if (params['email']) {
        this.userEmail = params['email'];
      } else {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          this.userEmail = currentUser.email;
        } else {
          // Se não tiver email, redirecionar para login
          this.router.navigate(['/login']);
        }
      }
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const novaSenha = control.get('novaSenha');
    const confirmarSenha = control.get('confirmarSenha');
    
    if (novaSenha && confirmarSenha && novaSenha.value !== confirmarSenha.value) {
      confirmarSenha.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmarSenha && confirmarSenha.errors?.['passwordMismatch']) {
      delete confirmarSenha.errors['passwordMismatch'];
      if (Object.keys(confirmarSenha.errors).length === 0) {
        confirmarSenha.setErrors(null);
      }
    }
    
    return null;
  }

  onSubmit() {
    if (this.changePasswordForm.valid && this.userEmail) {
      this.loading = true;
      this.errorMessage = '';
      
      const { senhaTemporaria, novaSenha } = this.changePasswordForm.value;
      
      this.authService.changePasswordForNewUser(this.userEmail, senhaTemporaria, novaSenha).subscribe({
        next: (response) => {
          this.loading = false;
          this.passwordChanged = true;
          const detail =
            typeof response.message === 'string' && response.message
              ? response.message
              : this.i18n.translate('auth.changeFirst.toastSuccessDetail');
          this.i18n.addToastLiteralDetail(this.messageService, 'success', 'common.toast.success', detail);

          if (response.token && response.user) {
            this.authService.applySessionFromLoginResponse(response);
          } else {
            const currentUser = this.authService.getCurrentUser();
            if (currentUser) {
              currentUser.precisaTrocarSenha = false;
              this.authService.updateCurrentUser(currentUser);
            }
          }

          setTimeout(() => {
            void this.router.navigateByUrl(this.returnUrl);
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          const errorMsg = extractApiErrorMessage(error, this.i18n, 'auth.changeFirst.errorGeneric');
          this.errorMessage = errorMsg;
          this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', errorMsg);
        }
      });
    }
  }

  goToLogin() {
    this.authService.logout();
  }
}

