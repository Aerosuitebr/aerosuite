import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TenantDto {
  id: number;
  codigo: string;
  nome: string;
  ativo: boolean;
}

export interface TenantStatsDto {
  usuariosInternos: number;
  usuariosExternos: number;
  ordensServico: number;
  propostasComerciais: number;
}

export interface TenantSummaryDto extends TenantDto {
  displayName?: string;
  supportEmail?: string;
  stats?: TenantStatsDto;
}

export interface TenantFeatureCatalogItemDto {
  code: string;
  modulo: string;
  experimental: boolean;
  owner?: string;
  pilotTenant?: string | null;
  reviewDate?: string | null;
  enabled: boolean;
}

export interface TenantFeaturesAdminDto {
  tenantId: number;
  items: TenantFeatureCatalogItemDto[];
}

export interface TenantDetailDto extends TenantSummaryDto {
  createdAt?: string;
  copyrightEntity?: string;
  statsPlatformTotal?: TenantStatsDto;
  modulosHabilitados?: string[];
  tenantFeatures?: TenantFeatureCatalogItemDto[];
}

export interface TenantListResponse {
  items: TenantSummaryDto[];
  platformStats: TenantStatsDto;
}

export interface CodigoAvailability {
  codigo: string;
  available: boolean;
  reason?: string | null;
  suggestion?: string | null;
}

export interface CreateTenantRequest {
  codigo: string;
  nome: string;
  adminEmail?: string;
  adminNome?: string;
  adminSenha?: string;
  displayName?: string;
  supportEmail?: string;
  sendWelcomeEmail?: boolean;
  modulosHabilitados?: string[];
}

export interface UpdateTenantRequest {
  nome?: string;
  ativo?: boolean;
  displayName?: string;
  supportEmail?: string;
  modulosHabilitados?: string[];
  featuresHabilitadas?: string[];
}

export interface UpdateTenantFeaturesRequest {
  enabled: string[];
}

export interface WelcomeEmailRequest {
  adminEmail?: string;
  resetAdminPassword?: boolean;
}

export interface WelcomeEmailResponse {
  sent: boolean;
  recipientEmail?: string;
  message?: string;
  adminSenhaTemporaria?: string | null;
}

export interface ProvisionTenantResponse {
  tenant: TenantDto;
  adminUserId?: number | null;
  adminEmail?: string | null;
  adminCreated: boolean;
  adminSenhaTemporaria?: string | null;
  senhaGeradaAutomaticamente?: boolean;
  welcomeEmailSent?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private apiBase(): string {
    return environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
  }

  list(): Observable<TenantListResponse> {
    return this.http.get<TenantListResponse>(`${this.apiBase()}/tenants`);
  }

  getDetail(id: number): Observable<TenantDetailDto> {
    return this.http.get<TenantDetailDto>(`${this.apiBase()}/tenants/${id}`);
  }

  checkCodigo(codigo: string): Observable<CodigoAvailability> {
    const params = new HttpParams().set('codigo', codigo);
    return this.http.get<CodigoAvailability>(`${this.apiBase()}/tenants/check-codigo`, { params });
  }

  provision(body: CreateTenantRequest): Observable<ProvisionTenantResponse> {
    return this.http.post<ProvisionTenantResponse>(`${this.apiBase()}/tenants`, body);
  }

  update(id: number, body: UpdateTenantRequest): Observable<TenantSummaryDto> {
    return this.http.put<TenantSummaryDto>(`${this.apiBase()}/tenants/${id}`, body);
  }

  getFeatures(id: number): Observable<TenantFeaturesAdminDto> {
    return this.http.get<TenantFeaturesAdminDto>(`${this.apiBase()}/tenants/${id}/features`);
  }

  updateFeatures(id: number, body: UpdateTenantFeaturesRequest): Observable<TenantFeaturesAdminDto> {
    return this.http.put<TenantFeaturesAdminDto>(`${this.apiBase()}/tenants/${id}/features`, body);
  }

  resendWelcome(id: number, body: WelcomeEmailRequest): Observable<WelcomeEmailResponse> {
    return this.http.post<WelcomeEmailResponse>(`${this.apiBase()}/tenants/${id}/welcome-email`, body);
  }

  getOnboardingLink(id: number): Observable<{ publicFormUrl: string }> {
    return this.http.get<{ publicFormUrl: string }>(`${this.apiBase()}/tenants/${id}/onboarding-link`);
  }

  uploadLogo(tenantId: number, file: File): Observable<{ logoUrl: string }> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<{ logoUrl: string }>(`${this.apiBase()}/tenants/${tenantId}/logo`, fd);
  }

  constructor(private http: HttpClient) {}
}
