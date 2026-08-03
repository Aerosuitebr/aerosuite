import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { AuthService } from '../auth/auth.service';
import { PlatformOpsAuthService } from './platform-ops-auth.service';
import { PlatformOpsMfaEnrollComponent } from './platform-ops-mfa-enroll.component';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';

type OpsLoginField = 'email' | 'password' | 'totp';

@Component({
  selector: 'app-platform-ops-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    TranslatePipe,
    PlatformOpsMfaEnrollComponent
  ],
  providers: [MessageService],
  templateUrl: './platform-ops-login.component.html',
  styleUrls: ['./platform-ops-login.component.scss']
})
export class PlatformOpsLoginComponent implements OnInit, AfterViewInit {
  private opsAuth = inject(PlatformOpsAuthService);
  private appAuth = inject(AuthService);
  private router = inject(Router);
  private messages = inject(MessageService);
  private i18n = inject(TranslationService);

  stepUpMode = false;
  mfaRequired = true;
  enrollmentMode = false;
  mfaSetupToken = '';

  email = '';
  password = '';
  totpCode = '';
  loading = false;

  ngOnInit(): void {
    if (this.appAuth.isAuthenticated()) {
      const user = this.appAuth.getCurrentUser();
      if (user?.email) {
        this.stepUpMode = true;
        this.email = user.email;
      }
    }
  }

  ngAfterViewInit(): void {
    this.focusFirstRequiredField();
  }

  onFormEnter(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const field = this.fieldFromInput(target);
    if (!field) {
      return;
    }
    event.preventDefault();
    const order = this.requiredFieldOrder();
    const index = order.indexOf(field);
    if (index < 0) {
      return;
    }
    if (index < order.length - 1) {
      this.focusField(order[index + 1]);
      return;
    }
    this.submit();
  }

  private requiredFieldOrder(): OpsLoginField[] {
    const fields: OpsLoginField[] = [];
    if (!this.stepUpMode) {
      fields.push('email');
    }
    fields.push('password');
    if (this.mfaRequired) {
      fields.push('totp');
    }
    return fields;
  }

  private fieldFromInput(input: HTMLInputElement): OpsLoginField | null {
    switch (input.id) {
      case 'ops-email':
        return 'email';
      case 'ops-password':
        return 'password';
      case 'ops-totp':
        return 'totp';
      default:
        return null;
    }
  }

  private focusFirstRequiredField(): void {
    const first = this.requiredFieldOrder()[0];
    if (first) {
      this.focusField(first);
    }
  }

  private focusField(field: OpsLoginField): void {
    setTimeout(() => {
      const id =
        field === 'email' ? 'ops-email' : field === 'password' ? 'ops-password' : 'ops-totp';
      const el = document.getElementById(id);
      if (el instanceof HTMLInputElement) {
        el.focus();
        if (field === 'totp') {
          el.select();
        }
      }
    });
  }

  submit(): void {
    if (this.stepUpMode) {
      this.submitStepUp();
      return;
    }
    if (!this.email.trim() || !this.password) {
      return;
    }
    this.loading = true;
    this.opsAuth
      .login({
        email: this.email.trim(),
        password: this.password,
        totpCode: this.totpCode.trim() || undefined
      })
      .subscribe({
        next: () => this.onSuccess(),
        error: err => this.onAuthError(err)
      });
  }

  private submitStepUp(): void {
    if (!this.password) {
      return;
    }
    this.loading = true;
    this.opsAuth
      .elevate({
        password: this.password,
        totpCode: this.totpCode.trim() || undefined
      })
      .subscribe({
        next: () => this.onSuccess(),
        error: err => this.onAuthError(err)
      });
  }

  onEnrollmentCompleted(): void {
    void this.router.navigate(['/plataforma']);
  }

  onEnrollmentCancelled(): void {
    this.enrollmentMode = false;
    this.mfaSetupToken = '';
    this.totpCode = '';
    this.focusFirstRequiredField();
  }

  private onSuccess(): void {
    this.loading = false;
    void this.router.navigate(['/plataforma']);
  }

  private onAuthError(err: unknown): void {
    this.loading = false;
    const apiErr = err as { error?: { code?: string; mfaSetupToken?: string } };
    const code = apiErr?.error?.code;

    if (code === 'MFA_REQUIRED') {
      this.mfaRequired = true;
      this.i18n.addToastLiteralDetail(
        this.messages,
        'warn',
        'common.toast.warn',
        this.i18n.translate('platformOps.login.mfaRequired')
      );
      this.focusField('totp');
      return;
    }
    if (code === 'INVALID_MFA_CODE') {
      this.mfaRequired = true;
      this.i18n.addToastLiteralDetail(
        this.messages,
        'error',
        'common.toast.error',
        this.i18n.translate('platformOps.login.mfaInvalid')
      );
      this.focusField('totp');
      return;
    }
    if (code === 'MFA_ENROLLMENT_REQUIRED') {
      const token = apiErr?.error?.mfaSetupToken;
      if (token) {
        this.mfaSetupToken = token;
        this.enrollmentMode = true;
      } else {
        this.i18n.addToastLiteralDetail(
          this.messages,
          'warn',
          'common.toast.warn',
          this.i18n.translate('platformOps.login.mfaEnrollment')
        );
      }
      return;
    }

    const msg = extractApiErrorMessage(err, this.i18n);
    this.i18n.addToastLiteralDetail(
      this.messages,
      'error',
      'common.toast.error',
      msg || this.i18n.translate('platformOps.login.denied')
    );
  }
}
