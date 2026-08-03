import { AfterViewChecked, Component, OnDestroy, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { InputTextModule } from 'primeng/inputtext';

import { TranslatePipe } from '../core/translate.pipe';

import { TranslationService } from '../core/translation.service';

import { PlatformOpsAuthService } from './platform-ops-auth.service';

import { PlatformOpsMfaEnrollComponent } from './platform-ops-mfa-enroll.component';

import { extractApiErrorMessage } from '../core/backend-i18n-message.util';



@Component({

  selector: 'app-platform-ops-revalidate',

  standalone: true,

  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TranslatePipe, PlatformOpsMfaEnrollComponent],

  templateUrl: './platform-ops-revalidate.component.html',

  styleUrls: ['./platform-ops-revalidate.component.scss']

})

export class PlatformOpsRevalidateComponent implements OnInit, OnDestroy, AfterViewChecked {

  private readonly opsAuth = inject(PlatformOpsAuthService);

  private readonly router = inject(Router);

  private readonly i18n = inject(TranslationService);



  visible = false;

  enrollmentMode = false;

  mfaSetupToken = '';

  totpCode = '';

  loading = false;

  errorMessage = '';

  showHelp = false;



  private pollId?: ReturnType<typeof setInterval>;

  private staleSub?: { unsubscribe(): void };

  private shouldFocusTotp = false;



  ngOnInit(): void {

    this.syncVisibility();

    this.pollId = setInterval(() => this.syncVisibility(), 15_000);

    this.staleSub = this.opsAuth.mfaStale$.subscribe(() => {

      this.visible = true;

      this.shouldFocusTotp = true;

    });

  }



  ngAfterViewChecked(): void {

    if (!this.shouldFocusTotp || !this.visible || this.enrollmentMode) {

      return;

    }

    this.shouldFocusTotp = false;

    this.focusTotpInput();

  }



  ngOnDestroy(): void {

    if (this.pollId) {

      clearInterval(this.pollId);

    }

    this.staleSub?.unsubscribe();

  }



  mfaRevalidateMinutes(): number {

    return this.opsAuth.getMfaRevalidateMinutes();

  }



  syncVisibility(): void {

    try {

      if (!this.opsAuth.isAuthenticated()) {

        this.visible = false;

        return;

      }

      if (this.opsAuth.isMfaStale()) {

        this.visible = true;

        this.shouldFocusTotp = true;

      }

    } catch {

      this.visible = false;

    }

  }



  submit(): void {

    const code = this.totpCode.trim();

    if (code.length < 6) {

      this.errorMessage = this.i18n.translate('platformOps.revalidate.codeRequired');

      return;

    }

    if (!this.opsAuth.isAuthenticated()) {

      this.errorMessage = this.i18n.translate('platformOps.revalidate.sessionExpired');

      void this.router.navigate(['/plataforma/acesso']);

      return;

    }

    this.loading = true;

    this.errorMessage = '';

    this.opsAuth.revalidateMfa(code).subscribe({

      next: () => {

        this.loading = false;

        this.totpCode = '';

        this.visible = false;

      },

      error: err => this.onError(err)

    });

  }



  onEnrollmentCompleted(): void {

    this.enrollmentMode = false;

    this.mfaSetupToken = '';

    this.visible = false;

  }



  onEnrollmentCancelled(): void {

    this.enrollmentMode = false;

    this.mfaSetupToken = '';

    this.logout();

  }



  goSetupMfa(): void {

    void this.router.navigate(['/plataforma/acesso']);

  }



  logout(): void {

    this.opsAuth.logout();

    void this.router.navigate(['/plataforma/acesso']);

  }



  toggleHelp(): void {

    this.showHelp = !this.showHelp;

  }



  private focusTotpInput(): void {

    setTimeout(() => {

      const el = document.getElementById('revalidate-totp');

      if (el instanceof HTMLInputElement) {

        el.focus();

        el.select();

      }

    });

  }



  private onError(err: unknown): void {

    this.loading = false;

    const apiErr = err as { error?: { code?: string; mfaSetupToken?: string }; status?: number };

    const code = apiErr?.error?.code;

    if (code === 'MFA_ENROLLMENT_REQUIRED') {

      const token = apiErr?.error?.mfaSetupToken;

      if (token) {

        this.mfaSetupToken = token;

        this.enrollmentMode = true;

      }

      return;

    }

    if (code === 'INVALID_MFA_CODE') {

      this.errorMessage = this.i18n.translate('platformOps.login.mfaInvalid');

      this.shouldFocusTotp = true;

      return;

    }

    if (apiErr?.status === 401 && !this.opsAuth.isAuthenticated()) {

      this.errorMessage = this.i18n.translate('platformOps.revalidate.sessionExpired');

      void this.router.navigate(['/plataforma/acesso']);

      return;

    }

    this.errorMessage = this.friendlyError(err);

    this.shouldFocusTotp = true;

  }



  private friendlyError(err: unknown): string {

    const raw = extractApiErrorMessage(err, this.i18n);

    if (!raw || /is not a function/i.test(raw) || /isAuthenticated/i.test(raw)) {

      return this.i18n.translate('platformOps.revalidate.failed');

    }

    return raw;

  }

}

