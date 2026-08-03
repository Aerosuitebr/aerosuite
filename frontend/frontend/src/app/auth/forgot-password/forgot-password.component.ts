import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { AuthService, TenantLoginOption } from '../auth.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { BrandingService } from '../../core/branding.service';
import { AuthShellComponent } from '../../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../../shared/auth-brand-header/auth-brand-header.component';
import { enrichTenantLoginOptions, defaultTenantOptionLabelParts } from '../tenant-login-option.util';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    MessageModule,
    ToastModule,
    DropdownModule,
    TranslatePipe,
    AuthShellComponent,
    AuthBrandHeaderComponent
  ],
  template: `
    <p-toast></p-toast>

    <app-auth-shell [cardMaxWidth]="480">
      <header authHeader class="auth-header">
        <app-auth-brand-header />
        <p class="auth-header__subtitle">{{ 'auth.forgot.subtitle' | translate }}</p>
      </header>

      <div *ngIf="!emailSent" class="forgot-password-form-container">
        <p class="description">{{ 'auth.forgot.description' | translate }}</p>

        <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="forgot-password-form">
          <div class="form-group">
            <label for="email" class="form-label">{{ 'auth.forgot.emailLabel' | translate }}</label>
            <input
              type="email"
              id="email"
              pInputText
              formControlName="email"
              [placeholder]="'auth.forgot.emailPlaceholder' | translate"
              class="form-input"
              [class.error]="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched"
              autocomplete="email">
            <small
              *ngIf="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched"
              class="error-text">
              {{ 'auth.forgot.emailInvalid' | translate }}
            </small>
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
              [label]="'auth.forgot.submit' | translate"
              class="submit-button"
              [disabled]="forgotPasswordForm.invalid || loading"
              [loading]="loading">
            </button>

            <button
              type="button"
              pButton
              [label]="'auth.forgot.backLogin' | translate"
              class="back-button"
              (click)="goToLogin()"
              [disabled]="loading">
            </button>
          </div>

          <div *ngIf="errorMessage" class="error-message">
            <p-message severity="error" [text]="errorMessage"></p-message>
          </div>
        </form>
      </div>

      <div *ngIf="emailSent" class="success-container">
        <div class="success-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <h2 class="success-title">{{ 'auth.forgot.successTitle' | translate }}</h2>
        <p class="success-message">
          {{ 'auth.forgot.successLine1' | translate }}
          <strong>{{ forgotPasswordForm.get('email')?.value }}</strong>.
          {{ 'auth.forgot.successLine2' | translate }}
        </p>
        <p class="success-note">
          <small>{{ 'auth.forgot.successNote' | translate }}</small>
        </p>
        <div class="success-actions">
          <button
            type="button"
            pButton
            [label]="'auth.forgot.backLogin' | translate"
            class="back-button"
            (click)="goToLogin()">
          </button>
          <button
            type="button"
            pButton
            [label]="'auth.forgot.resend' | translate"
            class="resend-button"
            (click)="resendEmail()"
            [loading]="loading">
          </button>
        </div>
      </div>

      <div authFooter class="auth-footer">
        <p class="auth-copyright">{{ 'auth.footer.copyright' | translate: { year: currentYear + '' } }}</p>
      </div>
    </app-auth-shell>
  `
})
export class ForgotPasswordComponent implements OnInit {
  protected branding = inject(BrandingService);
  private i18n = inject(TranslationService);

  forgotPasswordForm: FormGroup;
  loading = false;
  errorMessage = '';
  emailSent = false;
  currentYear = new Date().getFullYear();
  tenantOptions: TenantLoginOption[] = [];
  showTenantField = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.forgotPasswordForm = this.fb.group({
      tenantCodigo: ['', [Validators.maxLength(64)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }
    void this.reloadBrandingForTenantField();
    this.forgotPasswordForm.get('tenantCodigo')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => void this.reloadBrandingForTenantField());

    this.forgotPasswordForm.get('email')?.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((email: string) => {
        if (!email || !email.includes('@')) {
          return of([] as TenantLoginOption[]);
        }
        return this.authService.listLoginTenants(email).pipe(
          catchError(() => of([] as TenantLoginOption[]))
        );
      })
    ).subscribe(options => {
      this.applyTenantOptions(options ?? []);
    });
  }

  private applyTenantOptions(options: TenantLoginOption[]): void {
    this.tenantOptions = enrichTenantLoginOptions(options ?? [], o => this.formatTenantOptionLabel(o));
    if (options.length === 1) {
      this.forgotPasswordForm.patchValue({ tenantCodigo: options[0].codigo }, { emitEvent: false });
      this.showTenantField = false;
    } else if (options.length > 1) {
      this.showTenantField = true;
      const current = this.forgotPasswordForm.get('tenantCodigo')?.value as string;
      if (!options.some(o => o.codigo === current)) {
        this.forgotPasswordForm.patchValue({ tenantCodigo: '' }, { emitEvent: false });
      }
    } else {
      this.showTenantField = false;
      this.forgotPasswordForm.patchValue({ tenantCodigo: '' }, { emitEvent: false });
    }
    this.syncTenantValidators();
    void this.reloadBrandingForTenantField();
  }

  private syncTenantValidators(): void {
    const ctrl = this.forgotPasswordForm.get('tenantCodigo');
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
    const codigo = this.forgotPasswordForm.get('tenantCodigo')?.value as string | undefined;
    void this.branding.load({ tenantCodigo: codigo });
  }

  onSubmit() {
    if (!this.forgotPasswordForm.valid) {
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    const email = this.forgotPasswordForm.get('email')?.value;
    const tenantCodigo = this.forgotPasswordForm.get('tenantCodigo')?.value;

    this.authService.requestPasswordReset(email, tenantCodigo).subscribe({
      next: () => {
        this.loading = false;
        this.emailSent = true;
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          'auth.forgot.toastSuccessDetail'
        );
      },
      error: (error) => {
        this.loading = false;
        const code = error?.error?.code;
        if (code === 'TENANT_REQUIRED') {
          this.errorMessage = this.i18n.translate('login.error.tenantRequired');
          this.promptTenantSelection();
        } else {
          this.errorMessage = this.i18n.translate('auth.forgot.errorGeneric');
          this.i18n.addToast(
            this.messageService,
            'info',
            'common.toast.info',
            'auth.forgot.errorGeneric'
          );
        }
      }
    });
  }

  private promptTenantSelection(): void {
    const email = this.forgotPasswordForm.get('email')?.value as string;
    if (!email?.includes('@')) {
      return;
    }
    this.authService.listLoginTenants(email).subscribe(options => {
      this.applyTenantOptions(options ?? []);
    });
  }

  resendEmail() {
    this.emailSent = false;
    this.onSubmit();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
