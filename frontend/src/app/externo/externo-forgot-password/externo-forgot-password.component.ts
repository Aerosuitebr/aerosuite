import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { BrandingService } from '../../core/branding.service';
import { AuthShellComponent } from '../../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../../shared/auth-brand-header/auth-brand-header.component';

@Component({
  standalone: true,
  selector: 'app-externo-forgot-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    RouterLink,
    TranslatePipe,
    AuthShellComponent,
    AuthBrandHeaderComponent
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <app-auth-shell [cardMaxWidth]="480">
      <header authHeader class="auth-header">
        <app-auth-brand-header />
        <p class="auth-badge auth-badge--portal">{{ 'externo.auth.portalBadge' | translate }}</p>
        <p class="auth-header__subtitle">{{ 'auth.forgot.subtitle' | translate }}</p>
      </header>

      <div *ngIf="!emailSent" class="forgot-password-form-container">
        <p class="description">{{ 'auth.forgot.description' | translate }}</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="forgot-form">
          <label for="email" class="form-label">{{ 'auth.forgot.emailLabel' | translate }}</label>
          <input
            id="email"
            type="email"
            pInputText
            formControlName="email"
            class="form-input w-full"
            [placeholder]="'auth.forgot.emailPlaceholder' | translate"
            autocomplete="email" />
          <small *ngIf="form.get('email')?.invalid && form.get('email')?.touched" class="error-text">
            {{ 'auth.forgot.emailInvalid' | translate }}
          </small>

          <div class="form-actions">
            <button
              pButton
              type="submit"
              class="submit-button w-full"
              [label]="'auth.forgot.submit' | translate"
              [loading]="loading"
              [disabled]="form.invalid || loading">
            </button>
          </div>

          <a routerLink="/externo/login" class="forgot-password-link">{{ 'auth.forgot.backLogin' | translate }}</a>
        </form>
      </div>

      <div *ngIf="emailSent" class="success-container">
        <h2 class="success-title">{{ 'auth.forgot.successTitle' | translate }}</h2>
        <p class="success-message">{{ 'auth.forgot.successLine1' | translate }} <strong>{{ submittedEmail }}</strong></p>
        <p class="success-message">{{ 'auth.forgot.successLine2' | translate }}</p>
        <p class="description">{{ 'auth.forgot.successNote' | translate }}</p>
        <div class="success-actions">
          <button pButton type="button" class="login-button w-full" [label]="'auth.forgot.backLogin' | translate" routerLink="/externo/login"></button>
        </div>
      </div>
    </app-auth-shell>
  `
})
export class ExternoForgotPasswordComponent {
  protected branding = inject(BrandingService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);

  loading = false;
  emailSent = false;
  submittedEmail = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    const email = (this.form.value.email ?? '').trim().toLowerCase();
    this.loading = true;
    this.http
      .post(`${environment.apiUrl}/auth-externo/forgot-password`, { email })
      .subscribe({
        next: () => {
          this.loading = false;
          this.submittedEmail = email;
          this.emailSent = true;
          this.i18n.addToast(
            this.messageService,
            'success',
            'common.toast.success',
            'auth.forgot.toastSuccessDetail'
          );
        },
        error: () => {
          this.loading = false;
          this.submittedEmail = email;
          this.emailSent = true;
          this.i18n.addToast(
            this.messageService,
            'info',
            'common.toast.info',
            'auth.forgot.errorGeneric'
          );
        }
      });
  }
}
