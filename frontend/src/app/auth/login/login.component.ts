import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { DropdownModule } from 'primeng/dropdown';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError, map } from 'rxjs';
import { AuthApiErrorBody, AuthService, TenantLoginOption } from '../auth.service';
import { BrandingService } from '../../core/branding.service';
import { TranslationService } from '../../core/translation.service';
import { extractApiErrorMessage } from '../../core/backend-i18n-message.util';
import { TranslatePipe } from '../../core/translate.pipe';
import { AuthShellComponent } from '../../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../../shared/auth-brand-header/auth-brand-header.component';
import { VitrineLoginPreviewComponent } from '../../vitrine/vitrine-login-preview.component';
import { sanitizeInternalReturnUrl } from '../auth-return-url.util';
import { MfaSetupComponent } from '../mfa-setup/mfa-setup.component';
import { enrichTenantLoginOptions, defaultTenantOptionLabelParts } from '../tenant-login-option.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    MessageModule,
    DropdownModule,
    TranslatePipe,
    AuthShellComponent,
    AuthBrandHeaderComponent,
    VitrineLoginPreviewComponent
  ],
  template: `
    <app-auth-shell [cardMaxWidth]="480">
      <header authHeader class="auth-header">
        <app-auth-brand-header />
        <p class="auth-header__subtitle">{{ 'login.tagline' | translate }}</p>
      </header>

      <div *ngIf="trialCreatedMessage" class="login-trial-banner" role="status">
        <p-message severity="success" [text]="trialCreatedMessage"></p-message>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
        <div class="form-group">
          <label for="email" class="form-label">{{ 'login.email' | translate }}</label>
          <input
            type="email"
            id="email"
            pInputText
            formControlName="email"
            [placeholder]="'login.placeholderEmail' | translate"
            class="form-input"
            [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
        </div>

        <div class="form-group">
          <div class="password-header">
            <label for="password" class="form-label">{{ 'login.password' | translate }}</label>
            <a routerLink="/forgot-password" class="forgot-password-link">{{ 'login.forgotPassword' | translate }}</a>
          </div>
          <p-password
            id="password"
            formControlName="password"
            [placeholder]="'login.placeholderPassword' | translate"
            [feedback]="false"
            [toggleMask]="true"
            styleClass="form-password"
            inputStyleClass="form-input"
            [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
          </p-password>
        </div>

        <div class="form-group" *ngIf="showMfaField">
          <label for="totpCode" class="form-label">{{ 'login.mfaCode' | translate }}</label>
          <input
            type="text"
            id="totpCode"
            pInputText
            formControlName="totpCode"
            maxlength="6"
            inputmode="numeric"
            autocomplete="one-time-code"
            [placeholder]="'login.mfaCodePlaceholder' | translate"
            class="form-input">
          <p class="form-hint">{{ 'login.mfaHint' | translate }}</p>
        </div>

        <div class="form-group" *ngIf="showTenantField">
          <label for="tenantCodigo" class="form-label">{{ 'login.tenant' | translate }}</label>
          <p-dropdown
            inputId="tenantCodigo"
            formControlName="tenantCodigo"
            [options]="tenantOptions"
            optionLabel="label"
            optionValue="codigo"
            [placeholder]="'login.placeholderTenant' | translate"
            styleClass="w-full tenant-dropdown"
            [showClear]="false">
            <ng-template pTemplate="selectedItem" let-item>
              <span *ngIf="item" class="tenant-option__selected">{{ item.label }}</span>
            </ng-template>
            <ng-template pTemplate="item" let-item>
              <div class="tenant-option">
                <span class="tenant-option__name">{{ item.nome }}</span>
                <span class="tenant-option__meta">{{ item.codigo }}<ng-container *ngIf="item.criadoEm"> · {{ item.criadoEm }}</ng-container><ng-container *ngIf="item.id"> · #{{ item.id }}</ng-container></span>
              </div>
            </ng-template>
          </p-dropdown>
          <p class="form-hint">{{ 'login.tenantHintMulti' | translate }}</p>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            pButton
            class="login-button"
            data-testid="login-submit"
            [disabled]="loading"
            [loading]="loading">
            {{ 'login.submit' | translate }}
          </button>
        </div>

        <div *ngIf="errorMessage" class="error-message">
          <p-message severity="error" [text]="errorMessage"></p-message>
        </div>

        <div *ngIf="subscriptionInactive" class="subscription-cta">
          <a routerLink="/billing" pButton class="p-button-outlined w-full subscription-cta__btn">{{ 'login.subscribeNow' | translate }}</a>
          <a href="mailto:contato@aerosuite.com.br" class="subscription-cta__contact">{{ 'login.contactCommercial' | translate }}</a>
        </div>
      </form>

      <p authFooter class="trial-link-wrap" *ngIf="showStartTrialLink">
        <a routerLink="/cadastro-trial" class="trial-link">{{ 'login.startTrial' | translate }}</a>
      </p>

      <div authFooter class="auth-footer">
        <p class="auth-copyright">© {{ currentYear }} {{ branding.config().copyrightEntity }} — {{ 'login.copyrightReserved' | translate }}</p>
      </div>

      <app-vitrine-login-preview authBelow />
    </app-auth-shell>
  `
})
export class LoginComponent implements OnInit {
  protected branding = inject(BrandingService);
  private i18n = inject(TranslationService);
  private route = inject(ActivatedRoute);
  loginForm: FormGroup;
  private returnUrl = '/';
  loading = false;
  errorMessage = '';
  currentYear = new Date().getFullYear();
  tenantOptions: TenantLoginOption[] = [];
  showTenantField = false;
  showMfaField = false;
  trialCreatedMessage = '';
  subscriptionInactive = false;

  /** Trial expirado/inativo: exibir CTA de assinatura e ocultar link de novo cadastro trial (F01). */
  get showStartTrialLink(): boolean {
    return !this.subscriptionInactive;
  }

  private static readonly TRIAL_EMAIL_STORAGE_KEY = 'aerosuite.trialSignupEmail';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      tenantCodigo: ['', [Validators.maxLength(64)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      totpCode: ['', [Validators.maxLength(6)]]
    });
  }

  ngOnInit() {
    this.returnUrl = sanitizeInternalReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    const tenantFromUrl = this.route.snapshot.queryParamMap.get('tenant')?.trim();
    const emailFromTrial = this.consumeTrialSignupEmail();
    if (emailFromTrial) {
      this.loginForm.patchValue({ email: emailFromTrial }, { emitEvent: false });
    }
    if (this.route.snapshot.queryParamMap.get('trialCreated') === '1') {
      this.trialCreatedMessage = this.i18n.translate('login.trialCreated');
    }
    if (tenantFromUrl) {
      this.loginForm.patchValue({ tenantCodigo: tenantFromUrl }, { emitEvent: false });
      void this.branding.load({ tenantCodigo: tenantFromUrl, allowSessionTenant: false });
    }

    if (this.authService.isAuthenticated()) {
      void this.router.navigateByUrl(this.returnUrl);
      return;
    }
    void this.reloadBrandingForTenantField();
    this.loginForm.get('tenantCodigo')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => void this.reloadBrandingForTenantField());

    this.loginForm.get('email')?.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((email: string) => {
        if (!email || !email.includes('@')) {
          return of({ kind: 'clear' as const });
        }
        return this.authService.listLoginTenants(email).pipe(
          map(options => ({ kind: 'ok' as const, options: options ?? [] })),
          // Falha transitória da API não deve limpar o seletor de organização (evita flicker).
          catchError(() => of({ kind: 'error' as const }))
        );
      })
    ).subscribe(result => {
      if (result.kind === 'error') {
        return;
      }
      if (result.kind === 'clear') {
        this.applyTenantOptions([]);
        return;
      }
      this.applyTenantOptions(result.options);
    });
  }

  private applyTenantOptions(options: TenantLoginOption[]): void {
    this.tenantOptions = enrichTenantLoginOptions(options ?? [], o => this.formatTenantOptionLabel(o));
    if (options.length === 1) {
      this.loginForm.patchValue({ tenantCodigo: options[0].codigo }, { emitEvent: false });
      this.showTenantField = false;
    } else if (options.length > 1) {
      this.showTenantField = true;
      const current = this.loginForm.get('tenantCodigo')?.value as string;
      if (!options.some(o => o.codigo === current)) {
        this.loginForm.patchValue({ tenantCodigo: '' }, { emitEvent: false });
      }
    } else {
      this.showTenantField = false;
      this.loginForm.patchValue({ tenantCodigo: '' }, { emitEvent: false });
    }
    this.syncTenantValidators();
    void this.reloadBrandingForTenantField();
  }

  private syncTenantValidators(): void {
    const ctrl = this.loginForm.get('tenantCodigo');
    if (this.showTenantField && this.tenantOptions.length > 1) {
      ctrl?.setValidators([Validators.required, Validators.maxLength(64)]);
    } else {
      ctrl?.setValidators([Validators.maxLength(64)]);
    }
    ctrl?.updateValueAndValidity({ emitEvent: false });
  }

  private formatTenantOptionLabel(o: TenantLoginOption): string {
    const p = defaultTenantOptionLabelParts(o);
    if (p.codigo && p.id && p.criadoEm) {
      return this.i18n.translate('login.tenantOptionLabel', p);
    }
    if (p.codigo && p.id) {
      return this.i18n.translate('login.tenantOptionLabelNoDate', p);
    }
    return o.label?.trim() || `${p.nome} · ${p.codigo}`;
  }

  private reloadBrandingForTenantField(): void {
    const codigo = (this.loginForm.get('tenantCodigo')?.value as string | undefined)?.trim();
    void this.branding.load({ tenantCodigo: codigo || null, allowSessionTenant: false });
  }

  onSubmit() {
    if (this.loading) {
      return;
    }

    // Garante valor do p-password e fecha teclado móvel antes de validar (evita 2º clique).
    (document.activeElement as HTMLElement | null)?.blur();
    this.loginForm.markAllAsTouched();
    this.loginForm.updateValueAndValidity();

    if (!this.loginForm.valid) {
      const tenantCtrl = this.loginForm.get('tenantCodigo');
      if (this.showTenantField && tenantCtrl?.hasError('required')) {
        this.errorMessage = this.i18n.translate('login.error.tenantRequired');
      }
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.subscriptionInactive = false;

    const { email, password, tenantCodigo, totpCode } = this.loginForm.value;

    const loginTimeout = setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.errorMessage = this.i18n.translate('login.error.timeout');
      }
    }, 45_000);

    this.authService.login(email, password, tenantCodigo, totpCode).subscribe({
      next: (response) => {
        clearTimeout(loginTimeout);
        this.loading = false;

        void this.branding.load({
          tenantCodigo: response.user?.tenantCodigo ?? tenantCodigo ?? null,
          allowSessionTenant: false,
        });

        if (response.user?.precisaTrocarSenha === true) {
          this.router.navigate(['/change-password-first-login'], {
            queryParams: { email: response.user.email, returnUrl: this.returnUrl }
          });
        } else {
          void this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: (error) => {
        clearTimeout(loginTimeout);
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private resolveErrorMessage(error: unknown): string {
    const err = error as { status?: number; error?: AuthApiErrorBody };
    const code = err?.error?.code;
    if (code === 'TENANT_REQUIRED') {
      this.promptTenantSelection();
      return this.i18n.translate('login.error.tenantRequired');
    }
    if (code === 'TENANT_NOT_FOUND') {
      return this.i18n.translate('login.error.tenantNotFound');
    }
    if (code === 'SUBSCRIPTION_INACTIVE') {
      this.subscriptionInactive = true;
      return extractApiErrorMessage(error, this.i18n, 'login.subscriptionInactive');
    }
    if (code === 'MFA_REQUIRED') {
      this.showMfaField = true;
      this.loginForm.get('totpCode')?.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
      this.loginForm.get('totpCode')?.updateValueAndValidity({ emitEvent: false });
      return this.i18n.translate('login.error.mfaRequired');
    }
    if (code === 'INVALID_MFA_CODE') {
      this.showMfaField = true;
      return this.i18n.translate('login.error.mfaInvalid');
    }
    if (code === 'MFA_ENROLLMENT_REQUIRED') {
      const token = err?.error?.mfaSetupToken;
      if (token) {
        MfaSetupComponent.storeSetupToken(token);
        void this.router.navigate(['/mfa-setup'], { queryParams: { returnUrl: this.returnUrl } });
      }
      return extractApiErrorMessage(error, this.i18n, 'api.auth.mfaEnrollmentRequired');
    }
    if (err?.status === 0 || !err?.status) {
      return this.i18n.translate('login.error.connection');
    }
    if (err?.status === 401) {
      return this.i18n.translate('login.error.invalidCredentials');
    }
    if (err?.status === 503) {
      return this.i18n.translate('login.error.serviceUnavailable');
    }
    if (err?.status === 500) {
      return this.i18n.translate('login.error.serverError');
    }
    return extractApiErrorMessage(error, this.i18n, 'login.error.generic');
  }

  private consumeTrialSignupEmail(): string {
    try {
      const email = sessionStorage.getItem(LoginComponent.TRIAL_EMAIL_STORAGE_KEY)?.trim();
      if (email) {
        sessionStorage.removeItem(LoginComponent.TRIAL_EMAIL_STORAGE_KEY);
        return email;
      }
    } catch {
      /* ignore */
    }
    return '';
  }

  private promptTenantSelection(): void {
    const email = this.loginForm.get('email')?.value as string;
    if (!email?.includes('@')) {
      return;
    }
    this.authService.listLoginTenants(email).subscribe(options => {
      this.applyTenantOptions(options ?? []);
    });
  }
}
