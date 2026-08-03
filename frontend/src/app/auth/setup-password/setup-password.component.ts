import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../auth.service';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { extractApiErrorMessage } from '../../core/backend-i18n-message.util';
import { AuthShellComponent } from '../../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../../shared/auth-brand-header/auth-brand-header.component';
import { toastKey } from '../../core/toast-i18n.util';
import { PasswordPolicyPanelComponent } from '../../core/password-policy-panel/password-policy-panel.component';
import { passwordPolicyValidator } from '../../core/password-policy.util';

@Component({
  selector: 'app-setup-password',
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
  templateUrl: './setup-password.component.html'
})
export class SetupPasswordComponent implements OnInit {
  private i18n = inject(TranslationService);

  setupPasswordForm: FormGroup;
  loading = false;
  loadingToken = true;
  errorMessage = '';
  tokenValid = false;
  passwordSetup = false;
  userEmail = '';
  token = '';
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    this.setupPasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, passwordPolicyValidator()]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Verificar se já está logado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }

    // Obter token da URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.validateToken();
      } else {
        this.loadingToken = false;
        this.tokenValid = false;
      }
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword && confirmPassword.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  validateToken() {
    this.loadingToken = true;
    this.authService.validateResetToken(this.token).subscribe({
      next: (response) => {
        this.loadingToken = false;
        this.tokenValid = response.valid;
        if (response.valid && response.email) {
          this.userEmail = response.email;
        }
      },
      error: (error) => {
        this.loadingToken = false;
        this.tokenValid = false;
        console.error('Failed to validate token:', error);
      }
    });
  }

  onSubmit() {
    if (this.setupPasswordForm.valid && this.token && this.userEmail) {
      this.loading = true;
      this.errorMessage = '';
      
      const { currentPassword, newPassword } = this.setupPasswordForm.value;
      
      // Primeiro validar a senha atual
      this.http.post(`${environment.apiUrl}/auth/validate-current-password`, {
        email: this.userEmail,
        currentPassword: currentPassword
      }).subscribe({
        next: () => {
          // Se senha atual é válida, fazer reset com token
          this.authService.resetPassword(this.token, newPassword).subscribe({
            next: (response) => {
              this.loading = false;
              this.passwordSetup = true;
              toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'auth.setup.toastSuccessDetail');
            },
            error: (error) => {
              this.loading = false;
              this.errorMessage = extractApiErrorMessage(error, this.i18n, 'auth.setup.errorSetup');
              this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', this.errorMessage);
            }
          });
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = extractApiErrorMessage(error, this.i18n, 'auth.setup.errorCurrentPassword');
          this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', this.errorMessage);
        }
      });
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

