import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SistemaEmpresaStatus {
  needsCompletion: boolean;
  canEdit: boolean;
  canPublish?: boolean;
}

export interface SistemaEmpresaConfig {
  displayName: string;
  tagline: string;
  emailSubjectSuffix: string;
  supportEmail: string;
  copyrightEntity: string;
  browserTitleSuffix: string;
  logoUrl: string;
  wordmarkUrl: string;
  primaryColor?: string;
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
  telefone: string;
  siteUrl: string;
  onboardingCompleto: boolean;
  lgpdTermosText?: string;
  lgpdPrivacidadeText?: string;
  lgpdTextosCustomizados?: boolean;
}

export interface SistemaEmpresaWritePayload {
  displayName?: string;
  tagline?: string;
  emailSubjectSuffix?: string;
  supportEmail?: string;
  copyrightEntity?: string;
  browserTitleSuffix?: string;
  logoUrl?: string;
  wordmarkUrl?: string;
  primaryColor?: string;
  razaoSocial?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  emailNfe?: string;
  enderecoLogradouro?: string;
  enderecoNumero?: string;
  enderecoComplemento?: string;
  enderecoBairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  siteUrl?: string;
  concluirOnboarding: boolean;
  lgpdTermosText?: string;
  lgpdPrivacidadeText?: string;
  lgpdTextosCustomizados?: boolean;
}

export interface EmpresaAssetUploadResult {
  url: string;
}

@Injectable({ providedIn: 'root' })
export class SistemaEmpresaService {
  private readonly http = inject(HttpClient);
  private statusCache$?: Observable<SistemaEmpresaStatus>;

  private apiBase(): string {
    return environment.getApiUrl?.() ?? environment.apiUrl;
  }

  getStatus(): Observable<SistemaEmpresaStatus> {
    return this.http.get<SistemaEmpresaStatus>(`${this.apiBase()}/sistema-empresa/status`);
  }

  /** Status de onboarding em cache (evita bloquear o layout em cada navegação). */
  getStatusCached(): Observable<SistemaEmpresaStatus> {
    if (!this.statusCache$) {
      this.statusCache$ = this.getStatus().pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
    return this.statusCache$;
  }

  invalidateStatusCache(): void {
    this.statusCache$ = undefined;
  }

  getConfig(): Observable<SistemaEmpresaConfig> {
    return this.http.get<SistemaEmpresaConfig>(`${this.apiBase()}/sistema-empresa/config`);
  }

  saveConfig(body: SistemaEmpresaWritePayload): Observable<SistemaEmpresaConfig> {
    return this.http.put<SistemaEmpresaConfig>(`${this.apiBase()}/sistema-empresa/config`, body);
  }

  /** Alias de {@link saveConfig} para painéis de edição. */
  updateConfig(body: SistemaEmpresaWritePayload): Observable<SistemaEmpresaConfig> {
    return this.saveConfig(body);
  }

  uploadLogo(file: File): Observable<EmpresaAssetUploadResult> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<EmpresaAssetUploadResult>(`${this.apiBase()}/sistema-empresa/logo`, fd);
  }

  uploadWordmark(file: File): Observable<EmpresaAssetUploadResult> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<EmpresaAssetUploadResult>(`${this.apiBase()}/sistema-empresa/wordmark`, fd);
  }
}
