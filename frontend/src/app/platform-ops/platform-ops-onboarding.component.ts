import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SidebarModule } from 'primeng/sidebar';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { createListSearch } from '../core/list-search.helper';
import { PlatformOpsTemplateEditorComponent } from './template-editor/platform-ops-template-editor.component';
import {
  PlatformControlService,
  PlatformOnboardingDetail,
  PlatformOnboardingHub,
  PlatformOnboardingRow,
  PlatformOnboardingTemplate
} from './platform-control.service';

const STATUS_KEYS: Record<string, string> = {
  PENDING_INFO: 'platformOps.onboarding.status.pendingInfo',
  IN_PROGRESS: 'platformOps.onboarding.status.inProgress',
  READY: 'platformOps.onboarding.status.ready',
  COMPLETED: 'platformOps.onboarding.status.completed',
  ON_HOLD: 'platformOps.onboarding.status.onHold'
};

const REQ_KEYS: Record<string, string> = {
  IDENTITY_CONFIRMED: 'platformOps.onboarding.req.identity',
  ADMIN_CONTACT: 'platformOps.onboarding.req.adminContact',
  SUPPORT_EMAIL: 'platformOps.onboarding.req.supportEmail',
  BILLING_CONTACT: 'platformOps.onboarding.req.billingContact',
  COMMERCIAL_TERMS: 'platformOps.onboarding.req.commercialTerms',
  TECHNICAL_KICKOFF: 'platformOps.onboarding.req.technicalKickoff',
  CREDENTIALS_DELIVERED: 'platformOps.onboarding.req.credentials',
  ACCESS_ENABLED: 'platformOps.onboarding.req.accessEnabled'
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type OnboardingPageSlot = number | 'ellipsis';
export type OnboardingKpiFilter = 'pending' | 'inProgress' | 'ready' | 'completed';

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

@Component({
  selector: 'app-platform-ops-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DropdownModule,
    ButtonModule,
    ToastModule,
    SidebarModule,
    DialogModule,
    CheckboxModule,
    InputTextModule,
    InputTextareaModule,
    TranslatePipe,
    PlatformOpsTemplateEditorComponent
  ],
  providers: [MessageService],
  templateUrl: './platform-ops-onboarding.component.html',
  styleUrls: ['./platform-ops-onboarding.component.scss']
})
export class PlatformOpsOnboardingComponent implements OnInit {
  private control = inject(PlatformControlService);
  private toast = inject(MessageService);
  private i18n = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  loading = true;
  sending = false;
  resendingWelcome = false;
  savingTemplate = false;
  hub: PlatformOnboardingHub | null = null;
  templates: PlatformOnboardingTemplate[] = [];
  kpiFilter: OnboardingKpiFilter | null = null;
  searchQuery = '';
  searchTerm = '';
  pageSize = 10;
  currentPage = 1;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS.map(v => ({ label: String(v), value: v }));
  private readonly listSearch = createListSearch(this.destroyRef, term => {
    this.searchTerm = term;
    this.resetPagination();
  });
  drawerVisible = false;
  detailLoading = false;
  detail: PlatformOnboardingDetail | null = null;

  sendChannel = 'EMAIL';
  sendTemplateCode = 'WELCOME';
  sendRecipientEmail = '';
  sendRecipientPhone = '';
  sendRecipientName = '';
  sendSubjectOverride = '';
  sendBodyOverride = '';
  welcomeResetPassword = false;

  templateDialogVisible = false;
  editingTemplate: PlatformOnboardingTemplate | null = null;
  templatePreviewVars: Record<string, string> = {};

  readonly channelOptions = [
    { value: 'EMAIL', labelKey: 'platformOps.onboarding.channel.email' },
    { value: 'WHATSAPP', labelKey: 'platformOps.onboarding.channel.whatsapp' }
  ];

  readonly statusOptions = Object.keys(STATUS_KEYS).map(value => ({
    value,
    labelKey: STATUS_KEYS[value]
  }));

  ngOnInit(): void {
    this.reload();
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.control.getOnboardingTemplates().subscribe({
      next: t => (this.templates = t),
      error: () => {}
    });
  }

  get filteredTemplates(): PlatformOnboardingTemplate[] {
    return this.templates.filter(t => t.channel === this.sendChannel);
  }

  reload(): void {
    this.loading = true;
    this.control.getOnboardingHub().subscribe({
      next: hub => {
        this.hub = hub;
        this.resetPagination();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translate('platformOps.common.error') });
      }
    });
  }

  statusLabel(status: string): string {
    return this.i18n.translate(STATUS_KEYS[status] ?? 'platformOps.onboarding.status.pendingInfo');
  }

  requirementLabel(key: string): string {
    return this.i18n.translate(REQ_KEYS[key] ?? key);
  }

  progressLabel(row: PlatformOnboardingRow): string {
    return `${row.requirementsFulfilled}/${row.requirementsTotal}`;
  }

  allItems(): PlatformOnboardingRow[] {
    return this.hub?.items ?? [];
  }

  filteredItems(): PlatformOnboardingRow[] {
    return this.allItems().filter(row => this.matchesKpiFilter(row) && this.matchesSearch(row));
  }

  paginatedItems(): PlatformOnboardingRow[] {
    const items = this.filteredItems();
    const start = (this.currentPage - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  totalCount(): number {
    return this.filteredItems().length;
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  }

  hasActiveFilters(): boolean {
    return this.kpiFilter != null || this.searchTerm.length > 0;
  }

  toggleKpiFilter(filter: OnboardingKpiFilter): void {
    this.kpiFilter = this.kpiFilter === filter ? null : filter;
    this.resetPagination();
  }

  isKpiSelected(filter: OnboardingKpiFilter): boolean {
    return this.kpiFilter === filter;
  }

  clearFilters(): void {
    this.kpiFilter = null;
    this.searchQuery = '';
    this.searchTerm = '';
    this.resetPagination();
  }

  kpiFilterLabelKey(): string | null {
    switch (this.kpiFilter) {
      case 'pending':
        return 'platformOps.onboarding.kpi.pending';
      case 'inProgress':
        return 'platformOps.onboarding.kpi.inProgress';
      case 'ready':
        return 'platformOps.onboarding.kpi.ready';
      case 'completed':
        return 'platformOps.onboarding.kpi.completed';
      default:
        return null;
    }
  }

  activeSearchTerm(): string {
    return this.searchTerm;
  }

  onSearchChange(value: string | null | undefined): void {
    this.listSearch.fromModel(value);
  }

  onPageSizeChange(): void {
    this.resetPagination();
  }

  goToPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages());
    if (clamped !== this.currentPage) {
      this.currentPage = clamped;
    }
  }

  paginationSlots(): OnboardingPageSlot[] {
    const total = this.totalPages();
    const cur = this.currentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const slots: OnboardingPageSlot[] = [1];
    if (cur > 3) {
      slots.push('ellipsis');
    }
    const start = Math.max(2, cur - 1);
    const end = Math.min(total - 1, cur + 1);
    for (let p = start; p <= end; p++) {
      slots.push(p);
    }
    if (cur < total - 2) {
      slots.push('ellipsis');
    }
    slots.push(total);
    return slots;
  }

  footerRangeText(): string {
    const total = this.totalCount();
    if (total <= 0) {
      return '';
    }
    const from = (this.currentPage - 1) * this.pageSize + 1;
    const to = Math.min(this.currentPage * this.pageSize, total);
    return this.i18n.translate('audit.footer.range', {
      from: String(from),
      to: String(to),
      total: String(total)
    });
  }

  private matchesKpiFilter(row: PlatformOnboardingRow): boolean {
    switch (this.kpiFilter) {
      case 'pending':
        return row.status === 'PENDING_INFO' || row.status === 'ON_HOLD';
      case 'inProgress':
        return row.status === 'IN_PROGRESS';
      case 'ready':
        return row.status === 'READY';
      case 'completed':
        return row.status === 'COMPLETED';
      default:
        return true;
    }
  }

  private matchesSearch(row: PlatformOnboardingRow): boolean {
    const term = normalizeSearchText(this.searchTerm);
    if (!term) {
      return true;
    }
    const haystack = normalizeSearchText(
      [
        row.tenantNome,
        row.tenantCodigo,
        row.primaryContactEmail ?? '',
        row.primaryContactName ?? '',
        this.statusLabel(row.status),
        row.status
      ].join(' ')
    );
    const tokens = term.split(/\s+/).filter(Boolean);
    return tokens.every(token => haystack.includes(token));
  }

  private resetPagination(): void {
    this.currentPage = 1;
  }

  openDrawer(row: PlatformOnboardingRow): void {
    this.drawerVisible = true;
    this.loadDetail(row.tenantId);
  }

  closeDrawer(): void {
    this.drawerVisible = false;
    this.detail = null;
  }

  loadDetail(tenantId: number): void {
    this.detailLoading = true;
    this.control.getOnboardingDetail(tenantId).subscribe({
      next: d => {
        this.detail = d;
        this.sendRecipientEmail = d.primaryContactEmail ?? '';
        this.sendRecipientPhone = d.primaryContactPhone ?? '';
        this.sendRecipientName = d.primaryContactName ?? '';
        this.syncTemplateForChannel();
        this.applyTemplatePreview();
        this.detailLoading = false;
      },
      error: () => {
        this.detailLoading = false;
      }
    });
  }

  onChannelChange(): void {
    this.syncTemplateForChannel();
    this.applyTemplatePreview();
  }

  syncTemplateForChannel(): void {
    const list = this.filteredTemplates;
    if (!list.length) {
      return;
    }
    if (!list.some(t => t.code === this.sendTemplateCode)) {
      this.sendTemplateCode = list[0].code;
    }
  }

  onTemplateChange(): void {
    this.applyTemplatePreview();
  }

  applyTemplatePreview(): void {
    if (!this.detail) return;
    const tpl = this.templates.find(t => t.code === this.sendTemplateCode);
    if (!tpl) return;
    const vars = this.buildVars();
    this.sendSubjectOverride = this.interpolate(tpl.subjectTemplate, vars);
    this.sendBodyOverride = this.interpolate(tpl.bodyTemplate, vars);
  }

  buildVars(): Record<string, string> {
    return {
      organizacaoNome: this.detail?.tenantNome ?? '',
      organizacaoCodigo: this.detail?.tenantCodigo ?? '',
      contatoNome: this.sendRecipientName || 'equipe',
      operadorNome: 'Aero Suite',
      portalUrl: window.location.origin,
      onboardingFormUrl: this.detail?.publicFormUrl ?? ''
    };
  }

  interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
  }

  toggleRequirement(key: string, fulfilled: boolean): void {
    if (!this.detail) return;
    this.control.updateOnboardingRequirement(this.detail.tenantId, key, { fulfilled }).subscribe({
      next: d => {
        this.detail = d;
        this.reload();
      }
    });
  }

  saveDetailMeta(): void {
    if (!this.detail) return;
    this.control
      .updateOnboarding(this.detail.tenantId, {
        status: this.detail.status,
        primaryContactName: this.detail.primaryContactName,
        primaryContactEmail: this.detail.primaryContactEmail,
        primaryContactPhone: this.detail.primaryContactPhone,
        notes: this.detail.notes
      })
      .subscribe({
        next: d => {
          this.detail = d;
          this.reload();
          this.toast.add({ severity: 'success', summary: this.i18n.translate('platformOps.onboarding.saved') });
        }
      });
  }

  copyPublicLink(): void {
    const url = this.detail?.publicFormUrl;
    if (!url) return;
    void navigator.clipboard.writeText(url).then(() => {
      this.toast.add({ severity: 'success', summary: this.i18n.translate('platformOps.onboarding.linkCopied') });
    });
  }

  resendWelcome(): void {
    if (!this.detail) return;
    this.resendingWelcome = true;
    this.control
      .resendOnboardingWelcome(this.detail.tenantId, { resetAdminPassword: this.welcomeResetPassword })
      .subscribe({
        next: res => {
          this.resendingWelcome = false;
          if (res.sent) {
            this.toast.add({
              severity: 'success',
              summary: this.i18n.translate('platformOps.onboarding.welcomeSent', { email: res.recipientEmail ?? '' })
            });
          } else {
            this.toast.add({ severity: 'warn', summary: this.i18n.translate('platformOps.onboarding.welcomeFailed') });
          }
        },
        error: () => {
          this.resendingWelcome = false;
          this.toast.add({ severity: 'error', summary: this.i18n.translate('platformOps.onboarding.welcomeFailed') });
        }
      });
  }

  sendMessage(): void {
    if (!this.detail) return;
    if (this.sendChannel === 'EMAIL' && !this.sendRecipientEmail.trim()) return;
    if (this.sendChannel === 'WHATSAPP' && !this.sendRecipientPhone.trim()) return;

    this.sending = true;
    this.control
      .sendOnboardingMessage(this.detail.tenantId, {
        templateCode: this.sendTemplateCode,
        channel: this.sendChannel,
        recipientEmail: this.sendRecipientEmail.trim() || undefined,
        recipientPhone: this.sendRecipientPhone.trim() || undefined,
        recipientName: this.sendRecipientName.trim() || undefined,
        subjectOverride: this.sendSubjectOverride.trim() || undefined,
        bodyOverride: this.sendBodyOverride.trim() || undefined
      })
      .subscribe({
        next: res => {
          this.sending = false;
          if (res.sent) {
            if (res.whatsappUrl) {
              window.open(res.whatsappUrl, '_blank', 'noopener');
            }
            this.toast.add({
              severity: 'success',
              summary: this.i18n.translate(
                res.whatsappUrl ? 'platformOps.onboarding.whatsappReady' : 'platformOps.onboarding.messageSent'
              )
            });
            this.loadDetail(this.detail!.tenantId);
            this.reload();
          } else {
            this.toast.add({ severity: 'error', summary: this.i18n.translate('platformOps.onboarding.messageFailed') });
          }
        },
        error: () => {
          this.sending = false;
          this.toast.add({ severity: 'error', summary: this.i18n.translate('platformOps.onboarding.messageFailed') });
        }
      });
  }

  openTemplateEditor(): void {
    const tpl = this.templates.find(t => t.code === this.sendTemplateCode);
    if (!tpl) return;
    this.templatePreviewVars = this.buildVars();
    this.editingTemplate = { ...tpl };
    this.templateDialogVisible = true;
  }

  saveTemplate(): void {
    if (!this.editingTemplate) return;
    this.savingTemplate = true;
    this.control
      .updateOnboardingTemplate(this.editingTemplate.code, {
        nameLabel: this.editingTemplate.nameLabel,
        subjectTemplate: this.editingTemplate.subjectTemplate,
        bodyTemplate: this.editingTemplate.bodyTemplate
      })
      .subscribe({
        next: updated => {
          this.savingTemplate = false;
          const idx = this.templates.findIndex(t => t.code === updated.code);
          if (idx >= 0) {
            this.templates[idx] = updated;
          }
          this.templateDialogVisible = false;
          this.applyTemplatePreview();
          this.toast.add({ severity: 'success', summary: this.i18n.translate('platformOps.onboarding.templateSaved') });
        },
        error: () => {
          this.savingTemplate = false;
        }
      });
  }

  messageRecipientLabel(msg: { channel: string; recipientEmail?: string; recipientPhone?: string }): string {
    if (msg.channel === 'WHATSAPP') {
      return msg.recipientPhone ?? '—';
    }
    return msg.recipientEmail ?? '—';
  }
}
