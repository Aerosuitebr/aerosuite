import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UsuarioExternoService } from '../../core/usuario-externo.service';
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
  selector: 'app-externo-change-password',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
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
        <p class="auth-badge auth-badge--portal">{{ 'externo.auth.portalBadge' | translate }}</p>
        <p class="auth-header__subtitle">{{ 'externo.changePassword.title' | translate }}</p>
      </header>

      <p class="description">{{ 'externo.changePassword.intro' | translate }}</p>

      <form class="change-password-form" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="tempPassword" class="form-label">{{ 'externo.changePassword.tempLabel' | translate }}</label>
          <p-password
            id="tempPassword"
            [(ngModel)]="tempPassword"
            name="tempPassword"
            [placeholder]="'externo.changePassword.tempPlaceholder' | translate"
            [toggleMask]="true"
            [disabled]="loading"
            [feedback]="false"
            styleClass="form-password w-full"
            inputStyleClass="form-input w-full"
            required>
          </p-password>
        </div>

        <div class="form-group">
          <label for="newPassword" class="form-label">{{ 'externo.changePassword.newLabel' | translate }}</label>
          <p-password
            id="newPassword"
            [(ngModel)]="newPassword"
            name="newPassword"
            [placeholder]="'externo.changePassword.newPlaceholder' | translate"
            [toggleMask]="true"
            [disabled]="loading"
            [feedback]="false"
            styleClass="form-password w-full"
            inputStyleClass="form-input w-full"
            required>
          </p-password>
          <app-password-policy-panel
            [password]="newPassword"
            [confirmPassword]="confirmPassword"
            [showMatch]="true">
          </app-password-policy-panel>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">{{ 'externo.changePassword.confirmLabel' | translate }}</label>
          <p-password
            id="confirmPassword"
            [(ngModel)]="confirmPassword"
            name="confirmPassword"
            [placeholder]="'externo.changePassword.confirmPlaceholder' | translate"
            [toggleMask]="true"
            [disabled]="loading"
            [feedback]="false"
            styleClass="form-password w-full"
            inputStyleClass="form-input w-full"
            required>
          </p-password>
        </div>

        <div class="form-actions">
          <button
            pButton
            type="submit"
            [label]="'externo.changePassword.submit' | translate"
            icon="pi pi-check"
            class="submit-button w-full"
            [loading]="loading"
            [disabled]="loading || !isValid">
          </button>
        </div>
      </form>
    </app-auth-shell>
  `
})
export class ExternoChangePasswordComponent implements OnInit {
  protected branding = inject(BrandingService);
  private usuarioExternoService = inject(UsuarioExternoService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private i18n = inject(TranslationService);

  email = '';
  tempPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;

  ngOnInit() {
    this.email = this.route.snapshot.queryParams['email'] || '';
    if (!this.email) {
      this.router.navigate(['/externo/login']);
    }
  }

  get isValid(): boolean {
    return this.tempPassword.length > 0 &&
           isPasswordPolicyValid(this.newPassword) &&
           this.newPassword === this.confirmPassword;
  }

  onSubmit() {
    if (!this.isValid) return;

    this.loading = true;

    this.usuarioExternoService.changePasswordForNewUser(
      this.email,
      this.tempPassword,
      this.newPassword
    ).subscribe({
      next: () => {
        this.loading = false;
        toastKey(this.messageService, this.i18n, 'success', 'common.toast.success', 'externo.changePassword.successDetail');
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
          extractApiErrorMessage(err, this.i18n, 'externo.changePassword.errorGeneric')
        );
      }
    });
  }
}
