import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { extractApiErrorMessage } from '../../core/backend-i18n-message.util';
import { BrandingService } from '../../core/branding.service';
import { AuthShellComponent } from '../../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../../shared/auth-brand-header/auth-brand-header.component';
import { toastKey } from '../../core/toast-i18n.util';
import { PasswordPolicyPanelComponent } from '../../core/password-policy-panel/password-policy-panel.component';
import { isPasswordPolicyValid } from '../../core/password-policy.util';

@Component({
  standalone: true,
  selector: 'app-externo-setup-password',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    RouterLink,
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
        <p class="auth-badge auth-badge--portal">{{ 'externo.auth.portalBadge' | translate }}</p>
        <p class="auth-header__subtitle">{{ 'externo.setupPassword.heading' | translate }}</p>
      </header>

      <p class="description">{{ 'externo.setupPassword.subtitle' | translate }}</p>

      <form class="setup-form" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="newPassword" class="form-label">{{ 'externo.setupPassword.newPassword' | translate }}</label>
          <p-password
            id="newPassword"
            [(ngModel)]="newPassword"
            name="newPassword"
            [placeholder]="'externo.setupPassword.placeholderNew' | translate"
            [toggleMask]="true"
            [disabled]="loading"
            styleClass="form-password w-full"
            inputStyleClass="form-input w-full"
            [feedback]="false"
            required>
          </p-password>
          <app-password-policy-panel
            [password]="newPassword"
            [confirmPassword]="confirmPassword"
            [showMatch]="true">
          </app-password-policy-panel>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">{{ 'externo.setupPassword.confirmPassword' | translate }}</label>
          <p-password
            id="confirmPassword"
            [(ngModel)]="confirmPassword"
            name="confirmPassword"
            [placeholder]="'externo.setupPassword.placeholderConfirm' | translate"
            [toggleMask]="true"
            [disabled]="loading"
            styleClass="form-password w-full"
            inputStyleClass="form-input w-full"
            [feedback]="false"
            required>
          </p-password>
        </div>

        <div class="form-actions">
          <button
            pButton
            type="submit"
            [label]="'externo.setupPassword.submit' | translate"
            icon="pi pi-check"
            class="submit-button w-full"
            [loading]="loading"
            [disabled]="loading || !isValid">
          </button>
        </div>
      </form>

      <div authFooter class="auth-footer">
        <a routerLink="/externo/login" class="forgot-password-link">{{ 'externo.setupPassword.backLogin' | translate }}</a>
      </div>
    </app-auth-shell>
  `
})
export class ExternoSetupPasswordComponent implements OnInit {
  protected branding = inject(BrandingService);
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private i18n = inject(TranslationService);

  newPassword = '';
  confirmPassword = '';
  loading = false;
  token = '';

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      toastKey(this.messageService, this.i18n, 'error', 'common.toast.error', 'externo.setupPassword.tokenInvalid');
    }
  }

  get passwordsMatch(): boolean {
    return this.newPassword.length > 0 && this.newPassword === this.confirmPassword;
  }

  get isValid(): boolean {
    return isPasswordPolicyValid(this.newPassword) && this.passwordsMatch && !!this.token;
  }

  onSubmit() {
    if (!this.isValid) return;

    this.loading = true;
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;

    this.http.post(`${apiUrl}/auth-externo/reset-password`, {
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.loading = false;
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'externo.setupPassword.successDetail');
        setTimeout(() => {
          this.router.navigate(['/externo/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.i18n.addToastLiteralDetail(
          this.messageService,
          'error',
          'common.toast.error',
          extractApiErrorMessage(err, this.i18n, 'externo.setupPassword.errorGeneric')
        );
      }
    });
  }
}
