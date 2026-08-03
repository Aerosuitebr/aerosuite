import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../auth/auth.service';

export interface TenantFeaturesResponse {
  enabled: string[];
}

/**
 * Feature flags do tenant corrente (espelho do backend {@code TenantFeatureCatalog}).
 */
@Injectable({ providedIn: 'root' })
export class TenantFeatureService {
  private readonly http = inject(HttpClient);
  private static readonly UI_PREMIUM_CLASS = 'as-ui-premium';

  private enabled = new Set<string>();

  /** Sincroniza a partir do utilizador em sessão (login / auth/me). */
  syncFromUser(user: User | null | undefined): void {
    this.enabled = new Set((user?.tenantFeatures ?? []).map(c => c.trim().toLowerCase()));
    this.applyUiVariants();
  }

  /** Flag habilitada para o tenant atual. */
  isOn(code: string): boolean {
    if (!code?.trim()) {
      return false;
    }
    return this.enabled.has(code.trim().toLowerCase());
  }

  /** Qualquer uma das flags. */
  isAnyOn(...codes: string[]): boolean {
    return codes.some(c => this.isOn(c));
  }

  /** Todas as flags. */
  areAllOn(...codes: string[]): boolean {
    return codes.length > 0 && codes.every(c => this.isOn(c));
  }

  /** Lista imutável dos códigos ativos. */
  enabledCodes(): string[] {
    return [...this.enabled];
  }

  /** Recarrega do backend (útil após admin alterar flags sem novo login). */
  refreshFromServer(): Observable<TenantFeaturesResponse> {
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.get<TenantFeaturesResponse>(`${apiUrl}/tenant/features`).pipe(
      tap(res => {
        this.enabled = new Set((res.enabled ?? []).map(c => c.trim().toLowerCase()));
        this.applyUiVariants();
      })
    );
  }

  /** Aplica variante visual premium no documento (flag platform.ui.variantePremium). */
  applyUiVariants(): void {
    if (typeof document === 'undefined') {
      return;
    }
    const premium = this.isOn('platform.ui.variantePremium');
    document.body.classList.toggle(TenantFeatureService.UI_PREMIUM_CLASS, premium);
  }
}
