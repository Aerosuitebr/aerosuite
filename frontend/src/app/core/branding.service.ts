import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { catchError, firstValueFrom, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { bustStaticAssetUrl } from '../../environments/asset-cache-bust';
import { AuthService } from '../auth/auth.service';
import { displayPhoneBr } from './br-input.util';

/** Configuração comercial / white-label (arquivo `assets/branding.json` + override da API após onboarding). */
export interface BrandingConfig {
  commercialName: string;
  commercialTagline: string;
  /** Cor primária da marca (hex) — usada em auth shell e temas. */
  primaryColor: string;
  /** Ícone / marca circular (ex.: `assets/LOGO_AERO.png`). */
  logoUrl: string;
  /** Logotipo com texto — fundos claros (ex.: home). */
  wordmarkUrl: string;
  /** Logotipo branco — fundos escuros (ex.: rodapé). */
  wordmarkLightUrl: string;
  browserTitleSuffix: string;
  /** Texto curto para rodapé / © (nome da marca comercial ou do cliente). */
  copyrightEntity: string;
  /** E-mail de suporte exibido em diálogos de ajuda / saúde do sistema. */
  supportEmail?: string;
  /** Telefone de contato público (cadastro da empresa). */
  supportPhone?: string;
}

interface PublicBrandingPayload {
  configured: boolean;
  commercialName?: string;
  commercialTagline?: string;
  logoUrl?: string;
  wordmarkUrl?: string;
  wordmarkLightUrl?: string;
  primaryColor?: string;
  browserTitleSuffix?: string;
  copyrightEntity?: string;
  supportEmail?: string;
  telefone?: string;
}

const DEFAULT_PRIMARY = '#0ea5e9';

const DEFAULT_BRANDING: BrandingConfig = {
  commercialName: 'Aero Suite',
  commercialTagline: 'Management platform for MRO workshops',
  primaryColor: DEFAULT_PRIMARY,
  logoUrl: 'assets/LOGO_AERO.png',
  wordmarkUrl: 'assets/LOGO_LETRA.png',
  wordmarkLightUrl: 'assets/LOGO_LETRA_LIGHT.png',
  browserTitleSuffix: 'MRO management',
  copyrightEntity: 'Aero Suite',
  supportEmail: 'contato@aerosuite.com.br',
};

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly http = inject(HttpClient);
  private readonly title = inject(Title);
  private readonly auth = inject(AuthService, { optional: true });

  readonly config = signal<BrandingConfig>({ ...DEFAULT_BRANDING });
  /** Evita flash default ↔ marca do tenant em reloads do login (multi-org / trial). */
  private primed = false;
  private loadSeq = 0;

  /** Carrega defaults locais; branding de tenant só com código explícito ou sessão interna autenticada. */
  async load(options?: { tenantCodigo?: string | null; allowSessionTenant?: boolean }): Promise<void> {
    // Defaults só na 1ª carga — reloads no login não devem “piscar” a marca padrão.
    if (!this.primed) {
      this.applyBranding({ ...DEFAULT_BRANDING });
      this.primed = true;
    }
    await this.loadRemoteBranding(options);
  }

  private async loadRemoteBranding(options?: {
    tenantCodigo?: string | null;
    allowSessionTenant?: boolean;
  }): Promise<void> {
    const seq = ++this.loadSeq;
    let merged: BrandingConfig = { ...DEFAULT_BRANDING };
    try {
      const data = await firstValueFrom(
        this.http.get<Partial<BrandingConfig>>('assets/branding.json')
      );
      merged = {
        commercialName: data.commercialName?.trim() || DEFAULT_BRANDING.commercialName,
        commercialTagline:
          data.commercialTagline?.trim() || DEFAULT_BRANDING.commercialTagline,
        primaryColor: data.primaryColor?.trim() || DEFAULT_BRANDING.primaryColor,
        logoUrl: data.logoUrl?.trim() || DEFAULT_BRANDING.logoUrl,
        wordmarkUrl: data.wordmarkUrl?.trim() || DEFAULT_BRANDING.wordmarkUrl,
        wordmarkLightUrl:
          data.wordmarkLightUrl?.trim() || DEFAULT_BRANDING.wordmarkLightUrl,
        browserTitleSuffix:
          data.browserTitleSuffix?.trim() || DEFAULT_BRANDING.browserTitleSuffix,
        copyrightEntity: data.copyrightEntity?.trim() || DEFAULT_BRANDING.copyrightEntity,
        supportEmail: data.supportEmail?.trim() || DEFAULT_BRANDING.supportEmail,
      };
    } catch {
      merged = { ...DEFAULT_BRANDING };
    }

    let tenantCodigo = options?.tenantCodigo?.trim() || '';
    if (!tenantCodigo && options?.allowSessionTenant !== false && this.auth?.isAuthenticated()) {
      tenantCodigo = this.auth.getStoredTenantCodigo()?.trim() || '';
    }
    if (tenantCodigo) {
      const apiRoot = environment.getApiUrl?.() ?? environment.apiUrl;
      const brandingUrl =
        `${apiRoot}/public/sistema-empresa/branding?tenant=${encodeURIComponent(tenantCodigo)}`;
      try {
        const pub = await firstValueFrom(
          this.http.get<PublicBrandingPayload>(brandingUrl).pipe(
            catchError(() => of({ configured: false } as PublicBrandingPayload))
          )
        );
        if (pub.configured) {
          const apiWordmark = pub.wordmarkUrl?.trim() || '';
          const apiWordmarkLight = pub.wordmarkLightUrl?.trim() || '';
          merged = {
            ...merged,
            commercialName: pub.commercialName?.trim() || merged.commercialName,
            commercialTagline: pub.commercialTagline?.trim() || merged.commercialTagline,
            logoUrl: pub.logoUrl?.trim() || merged.logoUrl,
            wordmarkUrl: apiWordmark || merged.wordmarkUrl,
            wordmarkLightUrl: this.resolveWordmarkLightUrl(apiWordmarkLight, apiWordmark, merged.wordmarkLightUrl),
            primaryColor: pub.primaryColor?.trim() || merged.primaryColor,
            browserTitleSuffix: pub.browserTitleSuffix?.trim() || merged.browserTitleSuffix,
            copyrightEntity: pub.copyrightEntity?.trim() || merged.copyrightEntity,
            supportEmail: pub.supportEmail?.trim() || undefined,
            supportPhone: this.normalizeSupportPhone(pub.telefone),
          };
        }
      } catch {
        /* mantém só branding.json */
      }
    }

    // Descarta respostas antigas se o utilizador mudou de org/e-mail enquanto o pedido corria.
    if (seq !== this.loadSeq) {
      return;
    }
    this.applyBranding(merged);
  }

  private applyBranding(merged: BrandingConfig): void {
    this.config.set({
      ...merged,
      logoUrl: bustStaticAssetUrl(merged.logoUrl),
      wordmarkUrl: bustStaticAssetUrl(merged.wordmarkUrl),
      wordmarkLightUrl: bustStaticAssetUrl(merged.wordmarkLightUrl),
    });
    const c = this.config();
    this.applyThemeVariables(c);
    this.title.setTitle(`${c.commercialName} — ${c.browserTitleSuffix}`);
  }

  private applyThemeVariables(c: BrandingConfig): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const primary = c.primaryColor?.trim() || DEFAULT_PRIMARY;
    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--auth-accent', primary);
  }

  snapshot(): BrandingConfig {
    return this.config();
  }

  /**
   * A API legada devolvia o mesmo URL para wordmark claro e escuro; preserva o default do produto.
   */
  private normalizeSupportPhone(value: string | null | undefined): string | undefined {
    const formatted = displayPhoneBr(value);
    return formatted || undefined;
  }

  private resolveWordmarkLightUrl(apiLight: string, apiDark: string, fallbackLight: string): string {
    if (!apiLight) {
      return fallbackLight;
    }
    if (apiDark && apiLight === apiDark) {
      return fallbackLight;
    }
    return apiLight;
  }
}
