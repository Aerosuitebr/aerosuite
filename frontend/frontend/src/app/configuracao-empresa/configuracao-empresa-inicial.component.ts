import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { AuthShellComponent } from '../shared/auth-shell/auth-shell.component';
import { AuthBrandHeaderComponent } from '../shared/auth-brand-header/auth-brand-header.component';
import { BrandPrimaryColorInputComponent } from '../shared/brand-primary-color-input/brand-primary-color-input.component';
import { firstValueFrom } from 'rxjs';
import { SistemaEmpresaService, SistemaEmpresaConfig } from '../core/sistema-empresa.service';
import { BrandingService } from '../core/branding.service';
import { bustStaticAssetUrl } from '../../environments/asset-cache-bust';
import { TranslatePipe } from '../core/translate.pipe';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import { TranslationService } from '../core/translation.service';
import { normalizeHex } from '../core/brand-colors.util';
import {
  digitsOnly,
  formatCep,
  formatCnpj,
  formatPhoneBr,
  isValidCepLength,
  isValidCnpjChecksum,
  isValidCnpjLength,
  isValidBusinessEmail,
  isValidHttpUrl,
  isValidPhoneBr,
  formatBrTitleCase,
  maskCpfInRazaoSocial,
  sanitizeAddressField,
} from '../core/br-input.util';
import { BrAddressLookupService } from '../core/br-address-lookup.service';
import { AuthService } from '../auth/auth.service';

const BRAZIL_UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
]);

const hasLetter = (value: string | null | undefined): boolean => /\p{L}/u.test((value ?? '').trim());
const hasAddressNumber = (value: string | null | undefined): boolean => /[\p{L}\p{N}]/u.test((value ?? '').trim());

type WizardFieldErrorKey =
  | 'displayName'
  | 'tagline'
  | 'supportEmail'
  | 'telefone'
  | 'siteUrl'
  | 'razaoSocial'
  | 'cnpj'
  | 'address';

interface WizardDraft {
  displayName: string;
  tagline: string;
  emailSubjectSuffix: string;
  browserTitleSuffix: string;
  logoUrl: string;
  wordmarkUrl: string;
  primaryColor: string;
  copyrightEntity: string;
  supportEmail: string;
  telefone: string;
  siteUrl: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  emailNfe: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento: string;
  enderecoBairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

@Component({
  selector: 'app-configuracao-empresa-inicial',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    TranslatePipe,
    AuthShellComponent,
    AuthBrandHeaderComponent,
    BrandPrimaryColorInputComponent,
  ],
  templateUrl: './configuracao-empresa-inicial.component.html',
  styleUrls: ['./configuracao-empresa-inicial.component.scss'],
})
export class ConfiguracaoEmpresaInicialComponent implements OnInit {
  private readonly api = inject(SistemaEmpresaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly branding = inject(BrandingService);
  private readonly i18n = inject(TranslationService);
  private readonly brLookup = inject(BrAddressLookupService);
  private readonly auth = inject(AuthService);

  @ViewChild('numeroInput') numeroInput?: ElementRef<HTMLInputElement>;

  step = 0;
  saving = false;
  blocked = false;
  completed = false;
  confirmFinal = false;
  returnUrl = '/';
  cepLookupLoading = false;
  cnpjLookupLoading = false;
  private cepLookupTimer?: ReturnType<typeof setTimeout>;
  private cnpjLookupTimer?: ReturnType<typeof setTimeout>;
  private lastCepLookupDigits = '';
  private lastCnpjLookupDigits = '';
  private lastCnpjNotFoundDigits = '';
  private cnpjLookupInFlight = false;
  telefoneFormatError = false;

  fieldErrors: Record<WizardFieldErrorKey, boolean> = {
    displayName: false,
    tagline: false,
    supportEmail: false,
    telefone: false,
    siteUrl: false,
    razaoSocial: false,
    cnpj: false,
    address: false,
  };

  logoBust = Date.now();
  wordmarkBust = Date.now();

  draft: WizardDraft = {
    displayName: '',
    tagline: '',
    emailSubjectSuffix: '',
    browserTitleSuffix: '',
    logoUrl: '',
    wordmarkUrl: '',
    primaryColor: '#0ea5e9',
    copyrightEntity: '',
    supportEmail: '',
    telefone: '',
    siteUrl: '',
    razaoSocial: '',
    cnpj: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    emailNfe: '',
    enderecoLogradouro: '',
    enderecoNumero: '',
    enderecoComplemento: '',
    enderecoBairro: '',
    cidade: '',
    uf: '',
    cep: '',
  };

  async ngOnInit(): Promise<void> {
    const ru = this.route.snapshot.queryParamMap.get('returnUrl');
    if (ru && ru.startsWith('/')) {
      this.returnUrl = ru;
    }
    try {
      const st = await firstValueFrom(this.api.getStatus());
      if (!st.needsCompletion) {
        await this.router.navigateByUrl(this.returnUrl);
        return;
      }
      if (!st.canEdit) {
        this.blocked = true;
        return;
      }
      const cfg = await firstValueFrom(this.api.getConfig());
      this.applyConfig(cfg);
    } catch {
      this.i18n.addToast(this.messages, 'error', 'empresaWizard.toast.summary.error', 'empresaWizard.toast.loadError');
    }
  }

  private applyConfig(c: SistemaEmpresaConfig): void {
    const s = (v: string | null | undefined) => (v == null ? '' : String(v));
    const displayName = s(c.displayName);
    let tagline = s(c.tagline);
    if (tagline && displayName && tagline.trim().toLowerCase() === displayName.trim().toLowerCase()) {
      tagline = '';
    }
    this.draft = {
      displayName,
      tagline,
      emailSubjectSuffix: s(c.emailSubjectSuffix),
      browserTitleSuffix: s(c.browserTitleSuffix),
      logoUrl: this.sanitizeTenantAssetUrl(s(c.logoUrl)),
      wordmarkUrl: this.sanitizeTenantAssetUrl(s(c.wordmarkUrl)),
      primaryColor: normalizeHex(c.primaryColor),
      copyrightEntity: s(c.copyrightEntity),
      supportEmail: s(c.supportEmail),
      telefone: formatPhoneBr(s(c.telefone)),
      siteUrl: s(c.siteUrl),
      razaoSocial: s(c.razaoSocial),
      cnpj: formatCnpj(s(c.cnpj)),
      inscricaoEstadual: s(c.inscricaoEstadual),
      inscricaoMunicipal: s(c.inscricaoMunicipal),
      emailNfe: s(c.emailNfe),
      enderecoLogradouro: s(c.enderecoLogradouro),
      enderecoNumero: s(c.enderecoNumero),
      enderecoComplemento: s(c.enderecoComplemento),
      enderecoBairro: s(c.enderecoBairro),
      cidade: s(c.cidade),
      uf: s(c.uf).toUpperCase(),
      cep: formatCep(s(c.cep)),
    };
  }

  onTelefoneInput(): void {
    const raw = this.draft.telefone ?? '';
    this.telefoneFormatError = /[a-zA-Z]/.test(raw);
    this.draft.telefone = formatPhoneBr(raw);
    if (!this.telefoneFormatError && this.draft.telefone && !isValidPhoneBr(this.draft.telefone)) {
      this.telefoneFormatError = true;
    }
    this.clearFieldError('telefone');
  }

  onCnpjInput(): void {
    this.draft.cnpj = formatCnpj(this.draft.cnpj);
    this.clearFieldError('cnpj');
    const digits = digitsOnly(this.draft.cnpj);
    if (digits !== this.lastCnpjLookupDigits) {
      this.lastCnpjLookupDigits = '';
    }
    this.scheduleCnpjLookup();
  }

  onCepInput(): void {
    this.draft.cep = formatCep(this.draft.cep);
    this.clearFieldError('address');
    const digits = digitsOnly(this.draft.cep);
    if (digits !== this.lastCepLookupDigits) {
      this.lastCepLookupDigits = '';
    }
    this.scheduleCepLookup();
  }

  onUfInput(): void {
    this.draft.uf = this.draft.uf.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
    this.clearFieldError('address');
  }

  private scheduleCepLookup(): void {
    clearTimeout(this.cepLookupTimer);
    if (!isValidCepLength(this.draft.cep)) {
      return;
    }
    this.cepLookupTimer = setTimeout(() => void this.lookupCep(), 450);
  }

  private scheduleCnpjLookup(): void {
    clearTimeout(this.cnpjLookupTimer);
    if (!isValidCnpjLength(this.draft.cnpj)) {
      return;
    }
    this.cnpjLookupTimer = setTimeout(() => void this.lookupCnpj(), 850);
  }

  async lookupCep(): Promise<void> {
    const digits = digitsOnly(this.draft.cep);
    if (!isValidCepLength(this.draft.cep) || this.cepLookupLoading || digits === this.lastCepLookupDigits) {
      return;
    }
    clearTimeout(this.cepLookupTimer);
    this.cepLookupLoading = true;
    try {
      const res = await firstValueFrom(this.brLookup.lookupCep(this.draft.cep));
      if (!res) {
        this.i18n.addToast(this.messages, 'warn', 'empresaWizard.toast.summary.address', 'empresaWizard.lookup.cepNotFound');
        return;
      }
      this.lastCepLookupDigits = digits;
      this.draft.cep = res.cep;
      if (res.logradouro) {
        this.draft.enderecoLogradouro = formatBrTitleCase(res.logradouro);
      }
      if (res.bairro) {
        this.draft.enderecoBairro = sanitizeAddressField(formatBrTitleCase(res.bairro));
      }
      if (res.cidade) {
        this.draft.cidade = formatBrTitleCase(res.cidade);
      }
      if (res.uf) {
        this.draft.uf = res.uf;
      }
      if (res.complemento && !this.draft.enderecoComplemento.trim()) {
        this.draft.enderecoComplemento = res.complemento;
      }
      this.clearFieldError('address');
      setTimeout(() => this.numeroInput?.nativeElement?.focus(), 50);
    } finally {
      this.cepLookupLoading = false;
    }
  }

  async lookupCnpj(): Promise<void> {
    const digits = digitsOnly(this.draft.cnpj);
    if (
      !isValidCnpjLength(this.draft.cnpj) ||
      this.cnpjLookupLoading ||
      this.cnpjLookupInFlight ||
      digits === this.lastCnpjLookupDigits
    ) {
      return;
    }
    clearTimeout(this.cnpjLookupTimer);
    this.cnpjLookupLoading = true;
    this.cnpjLookupInFlight = true;
    try {
      const res = await firstValueFrom(this.brLookup.lookupCnpj(this.draft.cnpj));
      if (!res) {
        if (digits !== this.lastCnpjNotFoundDigits) {
          this.lastCnpjNotFoundDigits = digits;
          this.i18n.addToast(this.messages, 'warn', 'empresaWizard.toast.summary.cnpj', 'empresaWizard.lookup.cnpjNotFound');
        }
        return;
      }
      this.lastCnpjNotFoundDigits = '';
      this.lastCnpjLookupDigits = digits;
      if (res.razaoSocial) {
        const razao = maskCpfInRazaoSocial(res.razaoSocial);
        this.draft.razaoSocial = razao;
        if (!this.draft.copyrightEntity.trim()) {
          this.draft.copyrightEntity = razao;
        }
      }
      if (res.cep) {
        this.draft.cep = res.cep;
        this.lastCepLookupDigits = digitsOnly(res.cep);
      }
      if (res.logradouro) {
        this.draft.enderecoLogradouro = formatBrTitleCase(res.logradouro);
      }
      if (res.numero) {
        this.draft.enderecoNumero = res.numero;
      }
      if (res.complemento) {
        this.draft.enderecoComplemento = res.complemento;
      }
      if (res.bairro) {
        this.draft.enderecoBairro = sanitizeAddressField(formatBrTitleCase(res.bairro));
      }
      if (res.cidade) {
        this.draft.cidade = formatBrTitleCase(res.cidade);
      }
      if (res.uf) {
        this.draft.uf = res.uf;
      }
      if (res.telefone && !this.draft.telefone.trim()) {
        this.draft.telefone = formatPhoneBr(res.telefone);
      }
      if (res.email && !this.draft.emailNfe.trim()) {
        this.draft.emailNfe = res.email;
      }
      this.clearFieldError('cnpj');
      this.clearFieldError('razaoSocial');
      this.clearFieldError('address');
      setTimeout(() => {
        if (!this.draft.enderecoNumero.trim()) {
          this.numeroInput?.nativeElement?.focus();
        }
      }, 50);
    } finally {
      this.cnpjLookupLoading = false;
      this.cnpjLookupInFlight = false;
    }
  }

  get displayRazaoSocial(): string {
    return maskCpfInRazaoSocial(this.draft.razaoSocial);
  }

  get displayAddressLine(): string {
    const log = this.draft.enderecoLogradouro?.trim();
    const num = this.draft.enderecoNumero?.trim();
    const comp = this.draft.enderecoComplemento?.trim();
    const bairro = this.draft.enderecoBairro?.trim();
    const city = this.draft.cidade?.trim();
    const uf = this.draft.uf?.trim().toUpperCase();
    const cep = this.draft.cep?.trim();
    const street = [log, num].filter(Boolean).join(', ');
    const district = [bairro, comp].filter(Boolean).join(' — ');
    const cityLine = [district, `${city}/${uf}`].filter(Boolean).join(' · ');
    return `${street} — ${cityLine} · CEP ${cep}`;
  }

  prev(): void {
    this.step = Math.max(0, this.step - 1);
  }

  clearFieldError(field: WizardFieldErrorKey): void {
    this.fieldErrors[field] = false;
    this.messages.clear();
  }

  get taglineDuplicatesName(): boolean {
    const name = this.draft.displayName.trim().toLowerCase();
    const tag = this.draft.tagline.trim().toLowerCase();
    return !!name && name === tag;
  }

  private resetFieldErrors(): void {
    (Object.keys(this.fieldErrors) as WizardFieldErrorKey[]).forEach((key) => {
      this.fieldErrors[key] = false;
    });
  }

  next(): void {
    this.resetFieldErrors();
    if (this.step === 0) {
      const displayNameError = !this.draft.displayName.trim();
      const taglineError = !this.draft.tagline.trim();
      this.fieldErrors.displayName = displayNameError;
      this.fieldErrors.tagline = taglineError;
      if (displayNameError || taglineError) {
        this.i18n.addToast(
          this.messages,
          'warn',
          'empresaWizard.toast.summary.required',
          'empresaWizard.toast.requiredFields'
        );
        return;
      }
    }
    if (this.step === 1) {
      const supportEmailError =
        !this.draft.supportEmail.trim() || !isValidBusinessEmail(this.draft.supportEmail);
      const telefoneError = this.telefoneFormatError || !isValidPhoneBr(this.draft.telefone);
      const siteUrlError =
        !!this.draft.siteUrl.trim() && !isValidHttpUrl(this.draft.siteUrl);
      this.fieldErrors.supportEmail = supportEmailError;
      this.fieldErrors.telefone = telefoneError;
      this.fieldErrors.siteUrl = siteUrlError;
      if (supportEmailError) {
        this.i18n.addToast(
          this.messages,
          'warn',
          'empresaWizard.toast.summary.email',
          'empresaWizard.toast.invalidSupportEmail'
        );
        return;
      }
      if (telefoneError) {
        this.i18n.addToast(
          this.messages,
          'warn',
          'empresaWizard.toast.summary.phone',
          this.telefoneFormatError ? 'empresaWizard.toast.invalidPhoneFormat' : 'empresaWizard.toast.phoneRequired'
        );
        return;
      }
      if (siteUrlError) {
        this.i18n.addToast(
          this.messages,
          'warn',
          'empresaWizard.toast.summary.website',
          'empresaWizard.toast.invalidWebsite'
        );
        return;
      }
      if (!this.draft.emailNfe.trim() && this.draft.supportEmail.trim()) {
        this.draft.emailNfe = this.draft.supportEmail.trim();
      }
    }
    if (this.step === 2) {
      const razaoSocialError = !this.draft.razaoSocial.trim();
      const cnpjError = !isValidCnpjLength(this.draft.cnpj) || !isValidCnpjChecksum(this.draft.cnpj);
      const addressError =
        !hasLetter(this.draft.enderecoLogradouro) ||
        !hasAddressNumber(this.draft.enderecoNumero) ||
        !hasLetter(this.draft.cidade) ||
        !BRAZIL_UFS.has(this.draft.uf.trim().toUpperCase()) ||
        !isValidCepLength(this.draft.cep);
      this.fieldErrors.razaoSocial = razaoSocialError;
      this.fieldErrors.cnpj = cnpjError;
      this.fieldErrors.address = addressError;
      if (razaoSocialError) {
        this.i18n.addToast(
          this.messages,
          'warn',
          'empresaWizard.toast.summary.legalName',
          'empresaWizard.toast.legalNameRequired'
        );
        return;
      }
      if (cnpjError) {
        this.i18n.addToast(
          this.messages,
          'warn',
          'empresaWizard.toast.summary.cnpj',
          'empresaWizard.toast.cnpjInvalid'
        );
        return;
      }
      if (addressError) {
        this.i18n.addToast(
          this.messages,
          'warn',
          'empresaWizard.toast.summary.address',
          'empresaWizard.toast.addressIncomplete'
        );
        return;
      }
    }
    this.step = Math.min(3, this.step + 1);
  }

  private buildPayload(concluir: boolean) {
    this.draft.uf = (this.draft.uf || '').trim().toUpperCase();
    return {
      displayName: this.draft.displayName.trim(),
      tagline: this.draft.tagline.trim(),
      emailSubjectSuffix: this.draft.emailSubjectSuffix.trim() || undefined,
      supportEmail: this.draft.supportEmail.trim(),
      copyrightEntity: this.draft.copyrightEntity.trim() || undefined,
      browserTitleSuffix: this.draft.browserTitleSuffix.trim() || undefined,
      logoUrl: this.draft.logoUrl.trim() || undefined,
      wordmarkUrl: this.draft.wordmarkUrl.trim() || undefined,
      primaryColor: normalizeHex(this.draft.primaryColor),
      razaoSocial: this.draft.razaoSocial.trim(),
      cnpj: this.draft.cnpj.trim(),
      inscricaoEstadual: this.draft.inscricaoEstadual.trim() || undefined,
      inscricaoMunicipal: this.draft.inscricaoMunicipal.trim() || undefined,
      emailNfe: this.draft.emailNfe.trim() || undefined,
      enderecoLogradouro: this.draft.enderecoLogradouro.trim(),
      enderecoNumero: this.draft.enderecoNumero.trim() || undefined,
      enderecoComplemento: this.draft.enderecoComplemento.trim() || undefined,
      enderecoBairro: this.draft.enderecoBairro.trim() || undefined,
      cidade: this.draft.cidade.trim(),
      uf: this.draft.uf.trim(),
      cep: this.draft.cep.trim(),
      telefone: this.draft.telefone.trim(),
      siteUrl: this.draft.siteUrl.trim() || undefined,
      concluirOnboarding: concluir,
    };
  }

  async saveDraft(): Promise<void> {
    this.saving = true;
    try {
      const saved = await firstValueFrom(this.api.saveConfig(this.buildPayload(false)));
      this.applyConfig(saved);
      this.i18n.addToast(this.messages, 'success', 'empresaWizard.toast.summary.draft', 'empresaWizard.toast.draftSaved');
    } catch (e: unknown) {
      this.showHttpError(e);
    } finally {
      this.saving = false;
    }
  }

  async saveComplete(): Promise<void> {
    if (!this.confirmFinal) {
      return;
    }
    this.saving = true;
    try {
      const saved = await firstValueFrom(this.api.saveConfig(this.buildPayload(true)));
      this.applyConfig(saved);
      await this.branding.load();
      this.api.invalidateStatusCache();
      this.completed = true;
      this.i18n.addToast(this.messages, 'success', 'empresaWizard.toast.summary.done', 'empresaWizard.toast.completed');
      setTimeout(() => void this.enterSystem(), 2500);
    } catch (e: unknown) {
      this.showHttpError(e);
    } finally {
      this.saving = false;
    }
  }

  enterSystem(): void {
    void this.router.navigateByUrl('/');
  }

  backToLogin(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  private showHttpError(e: unknown): void {
    const err = e as { error?: { message?: string } };
    const msg = extractApiErrorMessage(err, this.i18n, 'empresaWizard.toast.saveError');
    this.i18n.addToastLiteralDetail(this.messages, 'error', 'empresaWizard.toast.summary.error', msg);
  }

  goHome(): void {
    void this.router.navigateByUrl('/');
  }

  get previewLogo(): string {
    return this.previewUrl(this.draft.logoUrl, this.logoBust);
  }

  get previewWordmark(): string {
    return this.previewUrl(this.draft.wordmarkUrl, this.wordmarkBust);
  }

  get previewPrimaryColor(): string {
    return normalizeHex(this.draft.primaryColor);
  }

  private previewUrl(url: string | undefined, bust: number): string {
    if (!url) return '';
    const abs = this.absUrl(url);
    if (abs.includes('/api/public/empresa-asset')) {
      return abs + (abs.includes('?') ? '&' : '?') + 't=' + bust;
    }
    return bustStaticAssetUrl(abs);
  }

  private absUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) {
      return typeof window !== 'undefined' ? window.location.origin + url : url;
    }
    return url;
  }

  private resolveTenantCodigoForAssets(): string {
    const fromUser = this.auth.getCurrentUser()?.tenantCodigo?.trim().toLowerCase();
    if (fromUser) {
      return fromUser;
    }
    const stored = this.auth.getStoredTenantCodigo().trim().toLowerCase();
    return stored === 'default' ? '' : stored;
  }

  private sanitizeTenantAssetUrl(url: string): string {
    const trimmed = (url ?? '').trim();
    if (!trimmed) {
      return '';
    }
    const lower = trimmed.toLowerCase();
    if (
      lower === '/api/public/empresa-asset/logo' ||
      lower === '/api/public/empresa-asset/wordmark' ||
      lower.endsWith('/empresa-asset/logo') ||
      lower.endsWith('/empresa-asset/wordmark')
    ) {
      return '';
    }
    const tenantCodigo = this.resolveTenantCodigoForAssets();
    if (tenantCodigo && lower.includes('/api/public/empresa-asset/') && !lower.includes(`/empresa-asset/${tenantCodigo}/`)) {
      return '';
    }
    return trimmed;
  }

  async onLogoFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const res = await firstValueFrom(this.api.uploadLogo(file));
      this.draft.logoUrl = res.url;
      this.logoBust = Date.now();
      this.i18n.addToast(this.messages, 'success', 'empresaWizard.toast.summary.logo', 'empresaWizard.toast.logoUploaded');
    } catch {
      this.i18n.addToast(this.messages, 'error', 'empresaWizard.toast.summary.logo', 'empresaWizard.toast.logoUploadError');
    }
  }

  async onWordmarkFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const res = await firstValueFrom(this.api.uploadWordmark(file));
      this.draft.wordmarkUrl = res.url;
      this.wordmarkBust = Date.now();
      this.i18n.addToast(this.messages, 'success', 'empresaWizard.toast.summary.wordmark', 'empresaWizard.toast.wordmarkUploaded');
    } catch {
      this.i18n.addToast(this.messages, 'error', 'empresaWizard.toast.summary.wordmark', 'empresaWizard.toast.wordmarkUploadError');
    }
  }
}
