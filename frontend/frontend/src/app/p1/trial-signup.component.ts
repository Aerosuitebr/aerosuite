import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '../core/translate.pipe';
import { P1ApiService } from './p1-api.service';
import { AuthShellComponent } from '../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../shared/auth-brand-header/auth-brand-header.component';
import { AuthService } from '../auth/auth.service';
import { TranslationService } from '../core/translation.service';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import { MessageModule } from 'primeng/message';
import { PasswordPolicyPanelComponent } from '../core/password-policy-panel/password-policy-panel.component';
import { passwordPolicyValidator } from '../core/password-policy.util';

@Component({
  selector: 'app-trial-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    ButtonModule,
    TranslatePipe,
    AuthShellComponent,
    AuthBrandHeaderComponent,
    MessageModule,
    PasswordPolicyPanelComponent
  ],
  template: `
    <app-auth-shell [cardWide]="true" [cardMaxWidth]="560">
      <header authHeader class="auth-header">
        <app-auth-brand-header />
        <p class="auth-header__subtitle">{{ 'p1.signup.title' | translate }}</p>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()" class="setup-password-form trial-signup-form" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="signup-admin-nome">{{ 'p1.signup.adminNome' | translate }}</label>
          <input id="signup-admin-nome" pInputText formControlName="adminNome" class="form-input w-full" autocomplete="name" />
        </div>
        <div class="form-group">
          <label class="form-label" for="signup-email">{{ 'p1.signup.adminEmail' | translate }}</label>
          <input id="signup-email" pInputText type="email" formControlName="adminEmail" class="form-input w-full" autocomplete="off" />
        </div>
        <div class="form-group">
          <label class="form-label" for="signup-nome">{{ 'p1.signup.nome' | translate }}</label>
          <input id="signup-nome" pInputText formControlName="nome" class="form-input w-full" autocomplete="organization" />
        </div>
        <div class="form-group">
          <label class="form-label" for="signup-senha">{{ 'p1.signup.password' | translate }}</label>
          <p-password
            inputId="signup-senha"
            formControlName="adminSenha"
            [feedback]="false"
            styleClass="form-password w-full"
            inputStyleClass="form-input w-full"
            autocomplete="new-password">
          </p-password>
          <app-password-policy-panel [password]="form.get('adminSenha')?.value ?? ''"></app-password-policy-panel>
        </div>
        <div class="form-group auth-modulos" [class.auth-modulos--error]="modulosError">
          <span class="form-label">{{ 'p1.signup.modulos' | translate }} <span class="req-mark" aria-hidden="true">*</span></span>
          <p class="form-hint auth-modulos__hint">{{ 'p1.signup.modulosHint' | translate }}</p>
          <label class="auth-modulo-option">
            <input type="checkbox" formControlName="modMro" />
            <span>{{ 'p1.signup.moduloMro' | translate }}</span>
          </label>
          <label class="auth-modulo-option">
            <input type="checkbox" formControlName="modEstoque" />
            <span>{{ 'p1.signup.moduloEstoque' | translate }}</span>
          </label>
          <label class="auth-modulo-option">
            <input type="checkbox" formControlName="modComercial" />
            <span>{{ 'p1.signup.moduloComercial' | translate }}</span>
          </label>
          <p class="form-hint form-hint--error" *ngIf="modulosError">{{ 'p1.signup.modulosRequired' | translate }}</p>
        </div>

        <section class="auth-legal-panel" aria-labelledby="signup-legal-heading">
          <h3 id="signup-legal-heading" class="auth-legal-panel__title">{{ 'p1.signup.legalSection' | translate }}</h3>
          <div class="auth-legal-panel__actions">
            <a href="/termos" target="_blank" rel="noopener noreferrer" class="auth-legal-btn" (click)="markLegalDocOpened('terms')">
              <i class="pi pi-file" aria-hidden="true"></i>
              {{ 'p1.signup.legalReadTerms' | translate }}
            </a>
            <a href="/privacidade" target="_blank" rel="noopener noreferrer" class="auth-legal-btn" (click)="markLegalDocOpened('privacy')">
              <i class="pi pi-shield" aria-hidden="true"></i>
              {{ 'p1.signup.legalReadPrivacy' | translate }}
            </a>
          </div>
          <p class="form-hint">{{ 'p1.signup.acceptHint' | translate }}</p>
        </section>

        <div class="auth-accept" [class.auth-accept--locked]="!legalDocsOpened">
          <p-checkbox formControlName="aceito" [binary]="true" inputId="signup-aceito"></p-checkbox>
          <label for="signup-aceito" class="auth-accept-text" [class.auth-accept-text--locked]="!legalDocsOpened">
            {{ 'p1.signup.acceptPrefix' | translate }}
            <a href="/termos" target="_blank" rel="noopener noreferrer" class="auth-link">{{ 'p1.legal.termos' | translate }}</a>
            {{ 'p1.signup.acceptAnd' | translate }}
            <a href="/privacidade" target="_blank" rel="noopener noreferrer" class="auth-link">{{ 'p1.legal.privacidade' | translate }}</a>
          </label>
        </div>

        <div class="form-actions">
          <button pButton type="submit" class="submit-button w-full" [label]="'p1.signup.submit' | translate" [disabled]="form.invalid || loading" [loading]="loading"></button>
        </div>
        <div *ngIf="errorMessage" class="form-group">
          <p-message severity="error" [text]="errorMessage"></p-message>
        </div>
        <p class="trial-signup-footer">
          <a routerLink="/login" class="forgot-password-link">{{ 'p1.signup.linkLogin' | translate }}</a>
        </p>
      </form>
    </app-auth-shell>
  `
})
export class TrialSignupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private p1 = inject(P1ApiService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private i18n = inject(TranslationService);

  form = this.fb.group({
    nome: ['', Validators.required],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminNome: [''],
    adminSenha: ['', [Validators.required, passwordPolicyValidator()]],
    modMro: [false],
    modEstoque: [false],
    modComercial: [false],
    aceito: [{ value: false, disabled: true }, Validators.requiredTrue]
  }, { validators: [TrialSignupComponent.requireAtLeastOneModule] });

  modulosError = false;

  termosVersao = '';
  privVersao = '';
  termsOpened = false;
  privacyOpened = false;
  loading = false;
  errorMessage = '';

  get legalDocsOpened(): boolean {
    return this.termsOpened && this.privacyOpened;
  }

  private static readonly TRIAL_EMAIL_STORAGE_KEY = 'aerosuite.trialSignupEmail';

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.auth.logout();
      this.form.reset({
        nome: '',
        adminEmail: '',
        adminNome: '',
        adminSenha: '',
        modMro: false,
        modEstoque: false,
        modComercial: false,
        aceito: false,
      });
      this.form.get('aceito')?.disable();
    }
    this.p1.getTermos().subscribe((t) => (this.termosVersao = t.versao));
    this.p1.getPrivacidade().subscribe((p) => (this.privVersao = p.versao));
  }

  private static requireAtLeastOneModule(control: AbstractControl): ValidationErrors | null {
    const mro = control.get('modMro')?.value;
    const est = control.get('modEstoque')?.value;
    const com = control.get('modComercial')?.value;
    return mro || est || com ? null : { modulosRequired: true };
  }

  markLegalDocOpened(doc: 'terms' | 'privacy'): void {
    if (doc === 'terms') {
      this.termsOpened = true;
    } else {
      this.privacyOpened = true;
    }
    if (this.legalDocsOpened) {
      this.form.get('aceito')?.enable({ emitEvent: false });
    }
  }

  submit(): void {
    this.modulosError = !!this.form.errors?.['modulosRequired'];
    if (!this.legalDocsOpened) {
      this.errorMessage = this.i18n.translate('p1.signup.legalRequired');
      return;
    }
    if (this.modulosError) {
      this.errorMessage = this.i18n.translate('p1.signup.modulosRequired');
      return;
    }
    if (this.form.invalid) return;
    this.errorMessage = '';
    const v = this.form.getRawValue();
    const modulos: string[] = [];
    if (v.modMro) modulos.push('MRO');
    if (v.modEstoque) modulos.push('ESTOQUE');
    if (v.modComercial) modulos.push('COMERCIAL');
    this.loading = true;
    this.p1
      .signupTrial({
        nome: v.nome,
        adminEmail: v.adminEmail,
        adminNome: v.adminNome,
        adminSenha: v.adminSenha,
        modulosHabilitados: modulos,
        aceitoTermos: v.aceito,
        versaoTermos: this.termosVersao,
        versaoPrivacidade: this.privVersao
      })
      .subscribe({
        next: () => {
          this.loading = false;
          const email = v.adminEmail?.trim();
          if (email) {
            try {
              sessionStorage.setItem(TrialSignupComponent.TRIAL_EMAIL_STORAGE_KEY, email);
            } catch {
              /* ignore */
            }
          }
          // Dá tempo para a confirmação da nova organização ficar visível em
          // ambientes com leitura replicada antes de liberar o primeiro login.
          setTimeout(() => {
            void this.router.navigate(['/login'], {
              queryParams: { trialCreated: '1' },
            });
          }, 800);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = extractApiErrorMessage(
            err,
            this.i18n,
            'api.tenant.signup.emailExists'
          );
        }
      });
  }
}
