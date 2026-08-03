import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { BrandPrimaryColorInputComponent } from '../shared/brand-primary-color-input/brand-primary-color-input.component';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  SistemaEmpresaService,
  SistemaEmpresaConfig,
  SistemaEmpresaWritePayload,
} from '../core/sistema-empresa.service';
import { TranslationService } from '../core/translation.service';
import { BrandingService } from '../core/branding.service';
import { normalizeHex } from '../core/brand-colors.util';
import { bustStaticAssetUrl } from '../../environments/asset-cache-bust';
import { formatPhoneBr } from '../core/br-input.util';

@Component({
  selector: 'app-empresa-config-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AccordionModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputTextModule,
    InputTextareaModule,
    BrandPrimaryColorInputComponent,
    ToastModule,
  ],
  templateUrl: './empresa-config-panel.component.html',
  styleUrls: ['./empresa-config-panel.component.scss'],
})
export class EmpresaConfigPanelComponent implements OnInit {
  private readonly sistemaEmpresa = inject(SistemaEmpresaService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(TranslationService);
  private readonly branding = inject(BrandingService);

  loaded = false;
  saving = false;
  confirmPublish = false;
  onboardingCompleto = false;
  canEdit = false;
  canPublish = false;

  logoBust = Date.now();
  wordmarkBust = Date.now();

  draft: SistemaEmpresaConfig = this.emptyDraft();

  t(key: string): string {
    return this.i18n.translate(key);
  }

  introEmpresa(): string {
    return this.i18n.translate('empresa.panel.intro', { path: '/api/public/empresa-asset/logo' });
  }

  ngOnInit(): void {
    void this.load();
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

  private emptyDraft(): SistemaEmpresaConfig {
    return {
      displayName: '',
      tagline: '',
      emailSubjectSuffix: '',
      browserTitleSuffix: '',
      copyrightEntity: '',
      logoUrl: '',
      wordmarkUrl: '',
      primaryColor: '#0ea5e9',
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
      onboardingCompleto: false,
      lgpdTermosText: '',
      lgpdPrivacidadeText: '',
      lgpdTextosCustomizados: false,
    };
  }

  private applyConfig(cfg: SistemaEmpresaConfig): void {
    this.draft = { ...this.emptyDraft(), ...cfg };
    this.draft.primaryColor = normalizeHex(this.draft.primaryColor);
    this.draft.telefone = formatPhoneBr(this.draft.telefone ?? '');
  }

  onTelefoneInput(): void {
    this.draft.telefone = formatPhoneBr(this.draft.telefone ?? '');
  }

  private buildPayload(concluir: boolean): SistemaEmpresaWritePayload {
    const d = this.draft;
    return {
      displayName: d.displayName?.trim(),
      tagline: d.tagline?.trim(),
      emailSubjectSuffix: d.emailSubjectSuffix?.trim() || undefined,
      browserTitleSuffix: d.browserTitleSuffix?.trim() || undefined,
      copyrightEntity: d.copyrightEntity?.trim() || undefined,
      logoUrl: d.logoUrl?.trim() || undefined,
      wordmarkUrl: d.wordmarkUrl?.trim() || undefined,
      primaryColor: normalizeHex(d.primaryColor),
      supportEmail: d.supportEmail?.trim(),
      telefone: formatPhoneBr(d.telefone?.trim() ?? '') || undefined,
      siteUrl: d.siteUrl?.trim() || undefined,
      razaoSocial: d.razaoSocial?.trim(),
      cnpj: d.cnpj?.trim(),
      inscricaoEstadual: d.inscricaoEstadual?.trim() || undefined,
      inscricaoMunicipal: d.inscricaoMunicipal?.trim() || undefined,
      emailNfe: d.emailNfe?.trim() || undefined,
      enderecoLogradouro: d.enderecoLogradouro?.trim(),
      enderecoNumero: d.enderecoNumero?.trim() || undefined,
      enderecoComplemento: d.enderecoComplemento?.trim() || undefined,
      enderecoBairro: d.enderecoBairro?.trim() || undefined,
      cidade: d.cidade?.trim(),
      uf: (d.uf || '').trim().toUpperCase(),
      cep: d.cep?.trim(),
      concluirOnboarding: concluir,
      lgpdTermosText: d.lgpdTextosCustomizados ? d.lgpdTermosText?.trim() || undefined : undefined,
      lgpdPrivacidadeText: d.lgpdTextosCustomizados ? d.lgpdPrivacidadeText?.trim() || undefined : undefined,
      lgpdTextosCustomizados: !!d.lgpdTextosCustomizados,
    };
  }

  async load(): Promise<void> {
    try {
      const [st, cfg] = await Promise.all([
        firstValueFrom(this.sistemaEmpresa.getStatus()),
        firstValueFrom(this.sistemaEmpresa.getConfig()),
      ]);
      this.canEdit = !!st.canEdit;
      this.canPublish = !!st.canPublish && this.canEdit;
      this.applyConfig(cfg);
      this.onboardingCompleto = !!cfg.onboardingCompleto;
      this.loaded = true;
    } catch (e: unknown) {
      this.messages.add({
        severity: 'error',
        summary: this.t('empresa.toast.errorSummary'),
        detail: this.t('empresa.toast.loadError'),
      });
      this.loaded = true;
    }
  }

  async save(concluir: boolean): Promise<void> {
    await this.saveFromParent(concluir);
  }

  async saveFromParent(concluir: boolean, opts?: { silent?: boolean }): Promise<boolean> {
    if (!this.canEdit) {
      return true;
    }
    if (this.saving) {
      return false;
    }
    this.saving = true;
    try {
      const saved = await firstValueFrom(this.sistemaEmpresa.updateConfig(this.buildPayload(concluir)));
      this.applyConfig(saved);
      this.onboardingCompleto = !!saved.onboardingCompleto;
      this.confirmPublish = false;
      if (!opts?.silent) {
        this.messages.add({
          severity: 'success',
          summary: this.t('empresa.toast.savedOk'),
          detail: concluir ? this.t('empresa.toast.savedPublish') : this.t('empresa.toast.savedDraft'),
        });
      }
      await this.branding.load();
      return true;
    } catch (e: unknown) {
      if (e instanceof HttpErrorResponse && e.status === 403) {
        return false;
      }
      if (!opts?.silent) {
        let detail = this.t('empresa.toast.saveError');
        if (e instanceof HttpErrorResponse && e.status === 400) {
          const body = e.error as { message?: string } | string | null;
          if (body && typeof body === 'object' && typeof body.message === 'string') {
            detail = body.message;
          } else if (typeof body === 'string') {
            detail = body;
          }
        }
        this.messages.add({
          severity: 'error',
          summary: this.t('empresa.toast.errorSummary'),
          detail,
        });
      }
      return false;
    } finally {
      this.saving = false;
    }
  }

  async onLogoFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const res = await firstValueFrom(this.sistemaEmpresa.uploadLogo(file));
      this.draft.logoUrl = res.url;
      this.logoBust = Date.now();
      this.messages.add({
        severity: 'success',
        summary: this.t('empresa.toast.summaryLogo'),
        detail: this.t('empresa.toast.uploadLogoOk'),
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.t('empresa.toast.summaryLogo'),
        detail: this.t('empresa.toast.uploadLogoErr'),
      });
    }
  }

  async onWordmarkFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const res = await firstValueFrom(this.sistemaEmpresa.uploadWordmark(file));
      this.draft.wordmarkUrl = res.url;
      this.wordmarkBust = Date.now();
      this.messages.add({
        severity: 'success',
        summary: this.t('empresa.toast.summaryWm'),
        detail: this.t('empresa.toast.uploadWmOk'),
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.t('empresa.toast.summaryWm'),
        detail: this.t('empresa.toast.uploadWmErr'),
      });
    }
  }
}
