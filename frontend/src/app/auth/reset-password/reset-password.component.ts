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
import { AuthShellComponent } from '../../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../../shared/auth-brand-header/auth-brand-header.component';
import { toastKey } from '../../core/toast-i18n.util';
import { extractApiErrorMessage } from '../../core/backend-i18n-message.util';
import { PasswordPolicyPanelComponent } from '../../core/password-policy-panel/password-policy-panel.component';
import { passwordPolicyValidator } from '../../core/password-policy.util';

@Component({
  selector: 'app-reset-password',
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
  template: `
    <p-toast></p-toast>
    
    <app-auth-shell [cardMaxWidth]="480">
      <header authHeader class="auth-header">
        <app-auth-brand-header />
        <p class="auth-header__subtitle">{{ 'auth.reset.subtitle' | translate }}</p>
      </header>

      <div *ngIf="loadingToken" class="loading-container">
            <i class="pi pi-spin pi-spinner" style="font-size: 3rem; color: #0ea5e9;"></i>
            <p>{{ 'auth.reset.validating' | translate }}</p>
          </div>
          
          <div *ngIf="!loadingToken && !tokenValid" class="error-container">
            <div class="error-icon">
              <i class="pi pi-times-circle"></i>
            </div>
            <h2 class="error-title">{{ 'auth.reset.tokenInvalidTitle' | translate }}</h2>
            <p class="error-message">{{ 'auth.reset.tokenInvalidBody' | translate }}</p>
            <div class="error-actions">
              <button
                type="button"
                pButton
                [label]="'auth.reset.requestNewLink' | translate"
                class="request-button"
                (click)="goToForgotPassword()">
              </button>
              <button
                type="button"
                pButton
                [label]="'auth.reset.backLogin' | translate"
                class="back-button"
                (click)="goToLogin()">
              </button>
            </div>
          </div>
          
          <div *ngIf="!loadingToken && tokenValid && !passwordReset" class="reset-password-form-container">
            <p class="description" *ngIf="userEmail">
              {{ 'auth.reset.forLabel' | translate }} <strong>{{ userEmail }}</strong>
            </p>
            
            <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="reset-password-form">
              <div class="form-group">
                <label for="newPassword" class="form-label">{{ 'auth.reset.newPassword' | translate }}</label>
                <p-password
                  id="newPassword"
                  formControlName="newPassword"
                  [placeholder]="'auth.reset.newPasswordPh' | translate"
                  [feedback]="false"
                  [toggleMask]="true"
                  styleClass="form-password"
                  inputStyleClass="form-input"
                  [class.error]="resetPasswordForm.get('newPassword')?.invalid && resetPasswordForm.get('newPassword')?.touched">
                </p-password>
                <app-password-policy-panel
                  [password]="resetPasswordForm.get('newPassword')?.value ?? ''"
                  [confirmPassword]="resetPasswordForm.get('confirmPassword')?.value ?? ''"
                  [showMatch]="true">
                </app-password-policy-panel>
                <small 
                  *ngIf="resetPasswordForm.get('newPassword')?.invalid && resetPasswordForm.get('newPassword')?.touched"
                  class="error-text">
                  <span *ngIf="resetPasswordForm.get('newPassword')?.errors?.['required']">{{ 'auth.password.required' | translate }}</span>
                  <span *ngIf="resetPasswordForm.get('newPassword')?.errors?.['passwordPolicy']">{{ 'auth.password.policy.invalid' | translate }}</span>
                </small>
              </div>
              
              <div class="form-group">
                <label for="confirmPassword" class="form-label">{{ 'auth.reset.confirmPassword' | translate }}</label>
                <p-password
                  id="confirmPassword"
                  formControlName="confirmPassword"
                  [placeholder]="'auth.reset.confirmPasswordPh' | translate"
                  [feedback]="false"
                  [toggleMask]="true"
                  styleClass="form-password"
                  inputStyleClass="form-input"
                  [class.error]="resetPasswordForm.get('confirmPassword')?.invalid && resetPasswordForm.get('confirmPassword')?.touched">
                </p-password>
                <small 
                  *ngIf="resetPasswordForm.get('confirmPassword')?.invalid && resetPasswordForm.get('confirmPassword')?.touched"
                  class="error-text">
                  <span *ngIf="resetPasswordForm.get('confirmPassword')?.errors?.['required']">{{ 'auth.password.confirmRequired' | translate }}</span>
                  <span *ngIf="resetPasswordForm.get('confirmPassword')?.errors?.['passwordMismatch']">{{ 'auth.password.mismatch' | translate }}</span>
                </small>
              </div>
              
              <div class="form-actions">
                <button
                  type="submit"
                  pButton
                  [label]="'auth.reset.submit' | translate"
                  class="submit-button"
                  [disabled]="resetPasswordForm.invalid || loading"
                  [loading]="loading">
                </button>
                
                <button
                  type="button"
                  pButton
                  [label]="'auth.reset.cancel' | translate"
                  class="cancel-button"
                  (click)="goToLogin()"
                  [disabled]="loading">
                </button>
              </div>
              
              <div *ngIf="errorMessage" class="error-message">
                <p-message severity="error" [text]="errorMessage"></p-message>
              </div>
            </form>
          </div>
          
          <div *ngIf="passwordReset" class="success-container">
            <div class="success-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <h2 class="success-title">{{ 'auth.reset.successTitle' | translate }}</h2>
            <p class="success-message">{{ 'auth.reset.successBody' | translate }}</p>
            <div class="success-actions">
              <button
                type="button"
                pButton
                [label]="'auth.reset.goLogin' | translate"
                class="login-button"
                (click)="goToLogin()">
              </button>
            </div>
          </div>
          
      <div authFooter class="auth-footer">
        <p class="auth-copyright">{{ 'auth.footer.copyright' | translate: { year: currentYear + '' } }}</p>
      </div>
    </app-auth-shell>
  `
})
export class ResetPasswordComponent implements OnInit {
  private i18n = inject(TranslationService);

  resetPasswordForm: FormGroup;
  loading = false;
  loadingToken = true;
  errorMessage = '';
  tokenValid = false;
  passwordReset = false;
  userEmail = '';
  token = '';
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    this.resetPasswordForm = this.fb.group({
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
    
    if (this.resetPasswordForm.valid && this.token) {
      this.loading = true;
      this.errorMessage = '';
      
      const newPassword = this.resetPasswordForm.get('newPassword')?.value;
      
      this.authService.resetPassword(this.token, newPassword).subscribe({
        next: (response) => {
          this.loading = false;
          this.passwordReset = true;
          toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'auth.reset.toastSuccessDetail');
        },
        error: (error) => {
          console.error('resetPassword erro:', error);
          this.loading = false;
          this.errorMessage = extractApiErrorMessage(error, this.i18n, 'auth.reset.errorGeneric');
          this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', this.errorMessage);
        }
      });
    } else {
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}

