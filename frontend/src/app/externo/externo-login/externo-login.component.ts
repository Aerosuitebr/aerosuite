import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject, Subscription, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { TenantLoginOption, UsuarioExternoService } from '../../core/usuario-externo.service';
import { BrandingService } from '../../core/branding.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { extractApiErrorMessage } from '../../core/backend-i18n-message.util';
import { enrichTenantLoginOptions, defaultTenantOptionLabelParts } from '../../auth/tenant-login-option.util';
import { AuthShellComponent } from '../../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../../shared/auth-brand-header/auth-brand-header.component';

@Component({
  standalone: true,
  selector: 'app-externo-login',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DropdownModule,
    ToastModule,
    RouterLink,
    TranslatePipe,
    AuthShellComponent,
    AuthBrandHeaderComponent
  ],
  template: `
    <p-toast></p-toast>

    <app-auth-shell [cardMaxWidth]="480">
      <header authHeader class="auth-header">
        <app-auth-brand-header />
        <p class="auth-badge auth-badge--portal">{{ 'externo.auth.portalBadge' | translate }}</p>
        <p class="auth-header__subtitle">{{ 'externo.auth.subtitle' | translate }}</p>
      </header>

      <form class="login-form" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="email" class="form-label">{{ 'externo.auth.email' | translate }}</label>
          <input
            id="email"
            type="email"
            pInputText
            [(ngModel)]="email"
            (ngModelChange)="onEmailChange($event)"
            name="email"
            [placeholder]="'externo.auth.placeholderEmail' | translate"
            [disabled]="loading"
            class="form-input w-full"
            required>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">{{ 'externo.auth.password' | translate }}</label>
          <p-password
            id="password"
            [(ngModel)]="password"
            name="password"
            [placeholder]="'externo.auth.placeholderPassword' | translate"
            [feedback]="false"
            [toggleMask]="true"
            [disabled]="loading"
            styleClass="form-password w-full"
            inputStyleClass="form-input w-full"
            required>
          </p-password>
        </div>

        <div class="form-group" *ngIf="showTenantField">
          <label for="tenantCodigo" class="form-label">{{ 'externo.auth.tenant' | translate }}</label>
          <p-dropdown
            inputId="tenantCodigo"
            [(ngModel)]="tenantCodigo"
            (ngModelChange)="onTenantChange($event)"
            name="tenantCodigo"
            [options]="tenantOptions"
            optionLabel="label"
            optionValue="codigo"
            [placeholder]="'externo.auth.placeholderTenant' | translate"
            styleClass="w-full tenant-dropdown"
            [disabled]="loading"
            [showClear]="false">
            <ng-template pTemplate="item" let-item>
              <div class="tenant-option">
                <span class="tenant-option__name">{{ item.nome }}</span>
                <span class="tenant-option__meta">{{ item.codigo }}<ng-container *ngIf="item.criadoEm"> · {{ item.criadoEm }}</ng-container><ng-container *ngIf="item.id"> · #{{ item.id }}</ng-container></span>
              </div>
            </ng-template>
          </p-dropdown>
          <p class="form-hint">{{ 'externo.auth.tenantHintMulti' | translate }}</p>
        </div>

        <div class="form-actions">
          <button
            pButton
            type="submit"
            [label]="'externo.auth.submit' | translate"
            icon="pi pi-sign-in"
            class="login-button w-full"
            [loading]="loading"
            [disabled]="loading">
          </button>
        </div>
      </form>

      <div class="auth-showcase auth-showcase--in-card" aria-hidden="true">
        <div class="showcase-item">
          <i class="pi pi-wrench"></i>
          <span>{{ 'externo.auth.showcase.revision' | translate }}</span>
        </div>
        <div class="showcase-item">
          <i class="pi pi-cog"></i>
          <span>{{ 'externo.auth.showcase.repair' | translate }}</span>
        </div>
        <div class="showcase-item">
          <i class="pi pi-search"></i>
          <span>{{ 'externo.auth.showcase.inspection' | translate }}</span>
        </div>
        <div class="showcase-item">
          <i class="pi pi-check-circle"></i>
          <span>{{ 'externo.auth.showcase.test' | translate }}</span>
        </div>
      </div>

      <div authFooter class="login-footer">
        <a routerLink="/externo/forgot-password" class="forgot-password-link">{{ 'externo.auth.forgot' | translate }}</a>
        <div class="auth-footer-divider"></div>
        <p class="internal-link">
          {{ 'externo.auth.internalPrompt' | translate }}
          <a routerLink="/login">{{ 'externo.auth.internalLink' | translate }}</a>
        </p>
      </div>
    </app-auth-shell>
  `
})
export class ExternoLoginComponent implements OnInit, OnDestroy {
  protected branding = inject(BrandingService);
  private usuarioExternoService = inject(UsuarioExternoService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  tenantCodigo = '';
  tenantOptions: TenantLoginOption[] = [];
  showTenantField = false;
  loading = false;

  private emailChange$ = new Subject<string>();
  private emailSub?: Subscription;

  ngOnInit(): void {
    const tenantFromUrl = this.route.snapshot.queryParamMap.get('tenant')?.trim();
    if (tenantFromUrl) {
      this.tenantCodigo = tenantFromUrl;
      void this.branding.load({ tenantCodigo: tenantFromUrl });
    }
    this.emailSub = this.emailChange$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((value: string) => {
        if (!value || !value.includes('@')) {
          return of([] as TenantLoginOption[]);
        }
        return this.usuarioExternoService.listLoginTenants(value).pipe(
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
      this.tenantCodigo = options[0].codigo;
      this.showTenantField = false;
      void this.branding.load({ tenantCodigo: this.tenantCodigo });
    } else if (options.length > 1) {
      this.showTenantField = true;
      if (!options.some(o => o.codigo === this.tenantCodigo)) {
        this.tenantCodigo = '';
      }
    } else {
      this.showTenantField = false;
      this.tenantCodigo = '';
      void this.branding.load();
    }
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

  ngOnDestroy(): void {
    this.emailSub?.unsubscribe();
  }

  onEmailChange(value: string): void {
    this.emailChange$.next(value);
  }

  onTenantChange(codigo: string): void {
    void this.branding.load({ tenantCodigo: codigo?.trim() || undefined });
  }

  onSubmit(): void {
    if (this.loading) {
      return;
    }

    (document.activeElement as HTMLElement | null)?.blur();

    if (!this.email || !this.password || (this.showTenantField && !this.tenantCodigo?.trim())) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'externo.login.toast.warnFill');
      return;
    }

    this.loading = true;
    const tenant = this.tenantCodigo?.trim() || undefined;

    this.usuarioExternoService.login(this.email, this.password, tenant).subscribe({
      next: (response) => {
        this.loading = false;

        if (response.user.precisaTrocarSenha) {
          this.router.navigate(['/externo/change-password'], {
            queryParams: { email: this.email }
          });
        } else {
          this.router.navigate(['/externo']);
        }
      },
      error: (error) => {
        this.loading = false;
        const message = this.resolveErrorMessage(error);
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', message);
      }
    });
  }

  private resolveErrorMessage(error: unknown): string {
    const err = error as { error?: { code?: string; message?: string } };
    const code = err?.error?.code;
    if (code === 'TENANT_REQUIRED') {
      this.promptTenantSelection();
      return this.i18n.translate('externo.login.toast.tenantRequired');
    }
    if (code === 'TENANT_NOT_FOUND') {
      return this.i18n.translate('externo.login.toast.tenantNotFound');
    }
    return extractApiErrorMessage(error, this.i18n, 'externo.login.toast.errorFallback');
  }

  private promptTenantSelection(): void {
    if (!this.email?.includes('@')) {
      return;
    }
    this.usuarioExternoService.listLoginTenants(this.email).subscribe(options => {
      this.applyTenantOptions(options ?? []);
    });
  }
}
