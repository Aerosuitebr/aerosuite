import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TenantStatsDto } from '../organizacoes/tenant.service';
import { AccessAuditEntry } from '../organizacoes/access-audit.service';

export interface PlatformAuditSummary {
  loginSuccess24h: number;
  loginFailure24h: number;
  rbacDenied24h: number;
  total24h: number;
}

export interface PlatformBillingSummary {
  active: number;
  trialing: number;
  trialExpired: number;
  overdue: number;
  canceled: number;
  checkoutPending: number;
  other: number;
}

export interface PlatformControlOverview {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  platformStats: TenantStatsDto;
  auditSummary: PlatformAuditSummary;
  billingSummary: PlatformBillingSummary;
  recentAuditEvents: AccessAuditEntry[];
}

export interface PlatformBillingRow {
  tenantId: number;
  tenantCodigo: string;
  tenantNome: string;
  tenantAtivo: boolean;
  planoCodigo: string;
  status: string;
  effectiveStatus: string;
  trialEndsAt?: string;
  provedor: string;
  updatedAt?: string;
  stats: TenantStatsDto;
}

export interface PlatformBillingList {
  items: PlatformBillingRow[];
  summary: PlatformBillingSummary;
}

export interface PlatformTenantUser {
  id: number;
  tipo: 'interno' | 'externo';
  email: string;
  nome: string;
  ativo: boolean;
  perfilNome?: string;
  perfilCodigo?: string;
  dataCadastro?: string;
  ultimoAcesso?: string;
  mfaEnabled?: boolean;
}

export interface PlatformTenantUserList {
  tenantId: number;
  tenantCodigo: string;
  tenantNome: string;
  totalInternos: number;
  totalExternos: number;
  items: PlatformTenantUser[];
}

export interface PlatformOperatorRow {
  usuarioId: number;
  nome: string;
  email: string;
  perfilCodigo?: string;
  perfilNome?: string;
  usuarioAtivo: boolean;
  opsAccessEffective: boolean;
  opsAccessFromConfig: boolean;
  opsAccessFromGrant: boolean;
  grantAtivo: boolean;
  grantedAt?: string;
  revokedAt?: string;
}

export interface PlatformOperatorList {
  items: PlatformOperatorRow[];
  totalEffective: number;
  totalFromConfig: number;
  totalFromGrant: number;
}

export interface TenantOption {
  id: number;
  codigo: string;
  nome: string;
}

export interface PlatformChartPoint {
  label: string;
  value: number;
}

export interface PlatformInfraPoint {
  label: string;
  rpm: number;
  webhookSuccessRate: number;
}

export interface PlatformTelemetry {
  mrr: number;
  mrrCurrency: string;
  activeTenants: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  storageBytes: number;
  revenueSeries: PlatformChartPoint[];
  infraSeries: PlatformInfraPoint[];
}

export interface PlatformBackupHistoryRow {
  id: number;
  backupDate: string;
  fileSize: number;
  fileSizeLabel: string;
  contentHash: string;
  retentionStatus: 'stored' | 'purged' | string;
  dumpStatus: string;
}

export interface PlatformBackupPanel {
  lastSuccessAt?: string;
  nextScheduledAt?: string;
  scheduleEnabled: boolean;
  scheduleType?: string;
  scheduledTime?: string;
  cronPreset?: string;
  backupType?: string;
  storageTarget?: string;
  retentionDays?: number;
  compressBackup?: boolean;
  history: PlatformBackupHistoryRow[];
  totalHistory: number;
}

export interface PlatformBackupScheduleRequest {
  cronPreset?: string;
  backupType?: string;
  storageTarget?: string;
  scheduledTime?: string;
  retentionDays?: number;
  compressBackup?: boolean;
  enabled?: boolean;
}

export interface PlatformBillingHistoryEvent {
  id: number;
  eventType: string;
  title: string;
  detail?: string;
  status?: string;
  amountCents?: number;
  operatorEmail?: string;
  createdAt: string;
}

export interface PlatformBillingHistory {
  tenantId: number;
  tenantCodigo: string;
  tenantNome: string;
  events: PlatformBillingHistoryEvent[];
}

@Injectable({ providedIn: 'root' })
export class PlatformControlService {
  private http = inject(HttpClient);

  private apiBase(): string {
    return environment.apiUrl || '/api';
  }

  getOverview(): Observable<PlatformControlOverview> {
    return this.http.get<PlatformControlOverview>(`${this.apiBase()}/platform/control/overview`);
  }

  getTelemetry(): Observable<PlatformTelemetry> {
    return this.http.get<PlatformTelemetry>(`${this.apiBase()}/platform/control/telemetry`);
  }

  getBackupPanel(limit = 50, offset = 0): Observable<PlatformBackupPanel> {
    return this.http.get<PlatformBackupPanel>(
      `${this.apiBase()}/platform/control/backup?limit=${limit}&offset=${offset}`
    );
  }

  updateBackupSchedule(body: PlatformBackupScheduleRequest): Observable<PlatformBackupPanel> {
    return this.http.patch<PlatformBackupPanel>(`${this.apiBase()}/platform/control/backup/schedule`, body);
  }

  getBillingHistory(tenantId: number): Observable<PlatformBillingHistory> {
    return this.http.get<PlatformBillingHistory>(
      `${this.apiBase()}/platform/control/billing/${tenantId}/history`
    );
  }

  listBilling(): Observable<PlatformBillingList> {
    return this.http.get<PlatformBillingList>(`${this.apiBase()}/platform/control/billing`);
  }

  updateBilling(
    tenantId: number,
    body: { planoCodigo?: string; status?: string; trialExtensionDays?: number }
  ): Observable<PlatformBillingRow> {
    return this.http.patch<PlatformBillingRow>(`${this.apiBase()}/platform/control/billing/${tenantId}`, body);
  }

  listTenantUsers(tenantId: number, tipo?: string): Observable<PlatformTenantUserList> {
    const params = tipo ? `?tipo=${encodeURIComponent(tipo)}` : '';
    return this.http.get<PlatformTenantUserList>(
      `${this.apiBase()}/platform/control/tenants/${tenantId}/usuarios${params}`
    );
  }

  updateTenantUser(
    tenantId: number,
    userId: number,
    tipo: string,
    body: { ativo: boolean }
  ): Observable<PlatformTenantUser> {
    return this.http.patch<PlatformTenantUser>(
      `${this.apiBase()}/platform/control/tenants/${tenantId}/usuarios/${userId}?tipo=${encodeURIComponent(tipo)}`,
      body
    );
  }

  listOperators(): Observable<PlatformOperatorList> {
    return this.http.get<PlatformOperatorList>(`${this.apiBase()}/platform/control/operators`);
  }

  setOperatorAccess(usuarioId: number, ativo: boolean): Observable<PlatformOperatorRow> {
    return this.http.patch<PlatformOperatorRow>(
      `${this.apiBase()}/platform/control/operators/${usuarioId}`,
      { ativo }
    );
  }

  getOnboardingHub(): Observable<PlatformOnboardingHub> {
    return this.http.get<PlatformOnboardingHub>(`${this.apiBase()}/platform/control/onboarding`);
  }

  getOnboardingTemplates(): Observable<PlatformOnboardingTemplate[]> {
    return this.http.get<PlatformOnboardingTemplate[]>(`${this.apiBase()}/platform/control/onboarding/templates`);
  }

  getOnboardingDetail(tenantId: number): Observable<PlatformOnboardingDetail> {
    return this.http.get<PlatformOnboardingDetail>(`${this.apiBase()}/platform/control/onboarding/${tenantId}`);
  }

  updateOnboarding(tenantId: number, body: PlatformOnboardingUpdate): Observable<PlatformOnboardingDetail> {
    return this.http.patch<PlatformOnboardingDetail>(
      `${this.apiBase()}/platform/control/onboarding/${tenantId}`,
      body
    );
  }

  updateOnboardingRequirement(
    tenantId: number,
    requirementKey: string,
    body: { fulfilled?: boolean; operatorNotes?: string }
  ): Observable<PlatformOnboardingDetail> {
    return this.http.patch<PlatformOnboardingDetail>(
      `${this.apiBase()}/platform/control/onboarding/${tenantId}/requirements/${encodeURIComponent(requirementKey)}`,
      body
    );
  }

  sendOnboardingMessage(
    tenantId: number,
    body: PlatformOnboardingSendMessage
  ): Observable<PlatformOnboardingSendResult> {
    return this.http.post<PlatformOnboardingSendResult>(
      `${this.apiBase()}/platform/control/onboarding/${tenantId}/messages`,
      body
    );
  }

  updateOnboardingTemplate(
    code: string,
    body: PlatformOnboardingTemplateUpdate
  ): Observable<PlatformOnboardingTemplate> {
    return this.http.patch<PlatformOnboardingTemplate>(
      `${this.apiBase()}/platform/control/onboarding/templates/${encodeURIComponent(code)}`,
      body
    );
  }

  resendOnboardingWelcome(
    tenantId: number,
    body: { resetAdminPassword?: boolean } = {}
  ): Observable<{ sent: boolean; recipientEmail?: string }> {
    return this.http.post<{ sent: boolean; recipientEmail?: string }>(
      `${this.apiBase()}/platform/control/onboarding/${tenantId}/welcome-email`,
      body
    );
  }
}

export interface PlatformOnboardingHub {
  items: PlatformOnboardingRow[];
  total: number;
  pendingInfo: number;
  inProgress: number;
  ready: number;
  completed: number;
}

export interface PlatformOnboardingRow {
  tenantId: number;
  tenantCodigo: string;
  tenantNome: string;
  tenantAtivo: boolean;
  status: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  requirementsTotal: number;
  requirementsFulfilled: number;
  lastMessageAt?: string;
  updatedAt?: string;
}

export interface PlatformOnboardingTemplate {
  id?: number;
  code: string;
  channel: string;
  nameLabel: string;
  subjectTemplate: string;
  bodyTemplate: string;
}

export interface PlatformOnboardingTemplateUpdate {
  nameLabel?: string;
  subjectTemplate?: string;
  bodyTemplate?: string;
}

export interface PlatformOnboardingDetail {
  tenantId: number;
  tenantCodigo: string;
  tenantNome: string;
  tenantAtivo: boolean;
  status: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  notes?: string;
  publicFormUrl?: string;
  publicSubmittedAt?: string;
  legalName?: string;
  legalDocument?: string;
  adminEmail?: string;
  supportEmail?: string;
  billingContactName?: string;
  billingContactEmail?: string;
  updatedAt?: string;
  requirements: PlatformOnboardingRequirement[];
  messages: PlatformOnboardingMessage[];
}

export interface PlatformOnboardingRequirement {
  requirementKey: string;
  fulfilled: boolean;
  fulfilledAt?: string;
  operatorNotes?: string;
}

export interface PlatformOnboardingMessage {
  id: number;
  templateCode?: string;
  channel: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  subject: string;
  deliveryStatus: string;
  operatorEmail?: string;
  createdAt?: string;
}

export interface PlatformOnboardingUpdate {
  status?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  notes?: string;
}

export interface PlatformOnboardingSendMessage {
  templateCode?: string;
  channel?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  subjectOverride?: string;
  bodyOverride?: string;
}

export interface PlatformOnboardingSendResult {
  sent: boolean;
  message: string;
  whatsappUrl?: string;
  record?: PlatformOnboardingMessage;
}
