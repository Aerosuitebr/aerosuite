import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../auth.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { extractApiErrorMessage } from '../../core/backend-i18n-message.util';
import { AuthShellComponent } from '../../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../../shared/auth-brand-header/auth-brand-header.component';
import { sanitizeInternalReturnUrl } from '../auth-return-url.util';

const MFA_SETUP_TOKEN_KEY = 'aerosuite_mfa_setup_token';

@Component({
  selector: 'app-mfa-setup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    TranslatePipe,
    AuthShellComponent,
    AuthBrandHeaderComponent
  ],
  template: `
    <app-auth-shell [cardMaxWidth]="520">
      <header authHeader class="auth-header">
        <app-auth-brand-header />
        <h2 class="auth-header__title">{{ 'mfaSetup.title' | translate }}</h2>
        <p class="auth-header__subtitle">{{ 'mfaSetup.subtitle' | translate }}</p>
      </header>

      <div *ngIf="setupSecret" class="mfa-setup-block">
        <label class="form-label">{{ 'mfaSetup.secretLabel' | translate }}</label>
        <code class="mfa-secret">{{ setupSecret }}</code>
        <p class="form-hint otp-uri" *ngIf="otpAuthUri">{{ otpAuthUri }}</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
        <div class="form-group">
          <label for="totpCode" class="form-label">{{ 'mfaSetup.codeLabel' | translate }}</label>
          <input
            id="totpCode"
            pInputText
            formControlName="totpCode"
            maxlength="6"
            inputmode="numeric"
            autocomplete="one-time-code"
            [placeholder]="'login.mfaCodePlaceholder' | translate"
            class="form-input" />
        </div>
        <div class="form-actions">
          <button type="submit" pButton [label]="'mfaSetup.submit' | translate"
            [disabled]="loading" [loading]="loading"></button>
        </div>
        <div *ngIf="errorMessage" class="error-message">
          <p-message severity="error" [text]="errorMessage"></p-message>
        </div>
      </form>
    </app-auth-shell>
  `,
  styles: [`
    .mfa-setup-block { margin-bottom: 1.25rem; }
    .mfa-secret {
      display: block;
      word-break: break-all;
      padding: 0.5rem;
      background: var(--surface-100, #f4f4f5);
      border-radius: 6px;
      font-size: 0.85rem;
    }
    .otp-uri { font-size: 0.75rem; word-break: break-all; opacity: 0.8; }
    .auth-header__title { margin: 0.5rem 0 0; font-size: 1.15rem; }
    .auth-header__subtitle { margin: 0.25rem 0 0; font-size: 0.9rem; opacity: 0.85; }
  `]
})
export class MfaSetupComponent implements OnInit {
  private i18n = inject(TranslationService);
  form: FormGroup;
  loading = false;
  errorMessage = '';
  setupSecret = '';
  otpAuthUri = '';
  private returnUrl = '/';
  private setupToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      totpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit(): void {
    this.returnUrl = sanitizeInternalReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    this.setupToken = sessionStorage.getItem(MFA_SETUP_TOKEN_KEY) ?? '';
    if (!this.setupToken) {
      void this.router.navigate(['/login']);
      return;
    }
    this.loading = true;
    this.authService.mfaSetup(this.setupToken).subscribe({
      next: (res) => {
        this.loading = false;
        this.setupSecret = res.secret ?? '';
        this.otpAuthUri = res.otpAuthUri ?? '';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = extractApiErrorMessage(err, this.i18n, 'mfaSetup.error.generic');
      }
    });
  }

  onSubmit(): void {
    if (!this.form.valid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const totpCode = this.form.value.totpCode as string;
    this.authService.mfaConfirm(this.setupToken, totpCode).subscribe({
      next: () => {
        sessionStorage.removeItem(MFA_SETUP_TOKEN_KEY);
        this.loading = false;
        void this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = extractApiErrorMessage(err, this.i18n, 'mfaSetup.error.generic');
      }
    });
  }

  static storeSetupToken(token: string): void {
    sessionStorage.setItem(MFA_SETUP_TOKEN_KEY, token);
  }
}
