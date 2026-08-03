import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { PlatformOpsAuthService } from './platform-ops-auth.service';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import QRCode from 'qrcode';

@Component({
  selector: 'app-platform-ops-mfa-enroll',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TranslatePipe],
  templateUrl: './platform-ops-mfa-enroll.component.html',
  styleUrls: ['./platform-ops-mfa-enroll.component.scss']
})
export class PlatformOpsMfaEnrollComponent implements OnChanges {
  private opsAuth = inject(PlatformOpsAuthService);
  private i18n = inject(TranslationService);

  @Input({ required: true }) setupToken = '';
  @Output() completed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  loadingSetup = false;
  loadingConfirm = false;
  errorMessage = '';
  setupSecret = '';
  otpAuthUri = '';
  qrDataUrl = '';
  totpCode = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['setupToken'] && this.setupToken) {
      this.loadSetup();
    }
  }

  loadSetup(): void {
    this.loadingSetup = true;
    this.errorMessage = '';
    this.opsAuth.beginMfaEnrollment(this.setupToken).subscribe({
      next: res => {
        this.loadingSetup = false;
        this.setupSecret = res.secret ?? '';
        this.otpAuthUri = res.otpAuthUri ?? '';
        void this.renderQr(this.otpAuthUri);
      },
      error: err => {
        this.loadingSetup = false;
        const apiErr = err as { status?: number; error?: { code?: string; message?: string } };
        if (apiErr?.error?.code === 'INVALID_CREDENTIALS' || apiErr?.status === 401) {
          this.errorMessage = this.i18n.translate('platformOps.enroll.tokenExpired');
          return;
        }
        this.errorMessage = extractApiErrorMessage(err, this.i18n, 'platformOps.enroll.setupFailed');
      }
    });
  }

  confirm(): void {
    const code = this.totpCode.trim();
    if (code.length < 6) {
      this.errorMessage = this.i18n.translate('platformOps.revalidate.codeRequired');
      return;
    }
    this.loadingConfirm = true;
    this.errorMessage = '';
    this.opsAuth.confirmMfaEnrollment(this.setupToken, code).subscribe({
      next: () => {
        this.loadingConfirm = false;
        this.completed.emit();
      },
      error: err => {
        this.loadingConfirm = false;
        const apiErr = err as { error?: { code?: string } };
        if (apiErr?.error?.code === 'INVALID_MFA_CODE') {
          this.errorMessage = this.i18n.translate('platformOps.login.mfaInvalid');
          return;
        }
        this.errorMessage =
          extractApiErrorMessage(err, this.i18n) || this.i18n.translate('platformOps.enroll.confirmFailed');
      }
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  private async renderQr(uri: string): Promise<void> {
    if (!uri) {
      this.qrDataUrl = '';
      return;
    }
    try {
      this.qrDataUrl = await QRCode.toDataURL(uri, {
        width: 200,
        margin: 1,
        color: { dark: '#0f172a', light: '#f8fafc' }
      });
    } catch {
      this.qrDataUrl = '';
    }
  }
}
