import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SidebarModule } from 'primeng/sidebar';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import {
  PlatformBillingHistory,
  PlatformBillingHistoryEvent,
  PlatformBillingList,
  PlatformBillingRow,
  PlatformBillingSummary,
  PlatformControlService
} from './platform-control.service';

const PLAN_LABEL_KEYS: Record<string, string> = {
  trial: 'platformOps.billing.plan.trial',
  professional: 'platformOps.billing.plan.professional',
  enterprise: 'platformOps.billing.plan.enterprise',
  platform: 'platformOps.billing.plan.platform'
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  trialing: 'platformOps.billing.status.trialing',
  active: 'platformOps.billing.status.active',
  canceled: 'platformOps.billing.status.canceled',
  checkout_pending: 'platformOps.billing.status.checkout_pending',
  trial_expired: 'platformOps.billing.status.trial_expired',
  past_due: 'platformOps.billing.status.past_due'
};

const OVERDUE_EFFECTIVE_STATUSES = new Set(['past_due', 'canceled', 'checkout_pending']);

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export type BillingPageSlot = number | 'ellipsis';

export type BillingKpiFilter = 'active' | 'trialing' | 'trial_expired' | 'overdue';

export type BillingBulkPanelMode = 'trial' | 'plan' | 'status';

@Component({
  selector: 'app-platform-ops-billing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DropdownModule,
    ButtonModule,
    ToastModule,
    SidebarModule,
    InputNumberModule,
    CheckboxModule,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './platform-ops-billing.component.html',
  styleUrls: ['./platform-ops-billing.component.scss']
})
export class PlatformOpsBillingComponent implements OnInit {
  private control = inject(PlatformControlService);
  private toast = inject(MessageService);
  private i18n = inject(TranslationService);

  loading = true;
  saving = false;
  data: PlatformBillingList | null = null;
  statusFilter: BillingKpiFilter | null = null;
  pageSize = 10;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS.map(v => ({ label: String(v), value: v }));
  currentPage = 1;
  readonly selectedTenantIds = new Set<number>();
  bulkPanelMode: BillingBulkPanelMode | null = null;
  bulkTrialDays = 7;
  bulkPlan = '';
  bulkStatus = '';
  bulkApplying = false;

  drawerVisible = false;
  selectedRow: PlatformBillingRow | null = null;
  draftPlan = '';
  draftStatus = '';
  trialBonusDays = 0;

  historyDrawerVisible = false;
  historyLoading = false;
  historyRow: PlatformBillingRow | null = null;
  historyData: PlatformBillingHistory | null = null;

  planOptions = [
    { labelKey: 'platformOps.billing.plan.trial', value: 'trial' },
    { labelKey: 'platformOps.billing.plan.professional', value: 'professional' },
    { labelKey: 'platformOps.billing.plan.enterprise', value: 'enterprise' },
    { labelKey: 'platformOps.billing.plan.platform', value: 'platform' }
  ];

  statusOptions = [
    { labelKey: 'platformOps.billing.status.trialing', value: 'trialing' },
    { labelKey: 'platformOps.billing.status.active', value: 'active' },
    { labelKey: 'platformOps.billing.status.canceled', value: 'canceled' },
    { labelKey: 'platformOps.billing.status.checkout_pending', value: 'checkout_pending' },
    { labelKey: 'platformOps.billing.status.trial_expired', value: 'trial_expired' },
    { labelKey: 'platformOps.billing.status.past_due', value: 'past_due' }
  ];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.control.listBilling().subscribe({
      next: res => {
        this.data = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  overdueCount(s: PlatformBillingSummary): number {
    if (s.overdue != null) {
      return s.overdue;
    }
    return (s.canceled ?? 0) + (s.checkoutPending ?? 0);
  }

  toggleFilter(filter: BillingKpiFilter): void {
    this.statusFilter = this.statusFilter === filter ? null : filter;
    this.resetPagination();
  }

  clearFilter(): void {
    this.statusFilter = null;
    this.resetPagination();
  }

  isFilterSelected(filter: BillingKpiFilter): boolean {
    return this.statusFilter === filter;
  }

  filterSummaryKey(): string | null {
    if (!this.statusFilter) {
      return null;
    }
    switch (this.statusFilter) {
      case 'active':
        return 'platformOps.billing.summary.active';
      case 'trialing':
        return 'platformOps.billing.summary.trialing';
      case 'trial_expired':
        return 'platformOps.billing.summary.trialExpired';
      case 'overdue':
        return 'platformOps.billing.summary.overdue';
      default:
        return null;
    }
  }

  filterBarText(): string {
    const key = this.filterSummaryKey();
    if (!key) {
      return '';
    }
    return this.i18n.translate('platformOps.billing.filter.showing', {
      label: this.i18n.translate(key),
      count: String(this.filteredItems().length)
    });
  }

  filteredItems(): PlatformBillingRow[] {
    const items = this.data?.items ?? [];
    if (!this.statusFilter) {
      return items;
    }
    return items.filter(row => this.matchesStatusFilter(row));
  }

  totalFilteredCount(): number {
    return this.filteredItems().length;
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFilteredCount() / this.pageSize));
  }

  paginatedItems(): PlatformBillingRow[] {
    const items = this.filteredItems();
    const start = (this.currentPage - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
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

  paginationSlots(): BillingPageSlot[] {
    const total = this.totalPages();
    const cur = this.currentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const slots: BillingPageSlot[] = [1];
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

  isRowSelected(row: PlatformBillingRow): boolean {
    return this.selectedTenantIds.has(row.tenantId);
  }

  isAllPageSelected(): boolean {
    const page = this.paginatedItems();
    return page.length > 0 && page.every(row => this.selectedTenantIds.has(row.tenantId));
  }

  isSomePageSelected(): boolean {
    const page = this.paginatedItems();
    const selectedOnPage = page.filter(row => this.selectedTenantIds.has(row.tenantId)).length;
    return selectedOnPage > 0 && selectedOnPage < page.length;
  }

  toggleRowSelection(row: PlatformBillingRow, checked: boolean): void {
    if (checked) {
      this.selectedTenantIds.add(row.tenantId);
    } else {
      this.selectedTenantIds.delete(row.tenantId);
      if (this.selectedTenantIds.size === 0) {
        this.closeBulkPanel();
      }
    }
  }

  toggleSelectAllPage(checked: boolean): void {
    for (const row of this.paginatedItems()) {
      if (checked) {
        this.selectedTenantIds.add(row.tenantId);
      } else {
        this.selectedTenantIds.delete(row.tenantId);
      }
    }
    if (this.selectedTenantIds.size === 0) {
      this.closeBulkPanel();
    }
  }

  selectedCount(): number {
    return this.selectedTenantIds.size;
  }

  selectedRows(): PlatformBillingRow[] {
    const items = this.data?.items ?? [];
    return items.filter(row => this.selectedTenantIds.has(row.tenantId));
  }

  clearSelection(): void {
    this.selectedTenantIds.clear();
    this.closeBulkPanel();
  }

  openBulkPanel(mode: BillingBulkPanelMode): void {
    this.bulkPanelMode = this.bulkPanelMode === mode ? null : mode;
    if (mode === 'plan') {
      this.bulkPlan = '';
    }
    if (mode === 'status') {
      this.bulkStatus = '';
    }
  }

  closeBulkPanel(): void {
    this.bulkPanelMode = null;
    this.bulkTrialDays = 7;
    this.bulkPlan = '';
    this.bulkStatus = '';
  }

  applyBulkTrial(): void {
    if (this.bulkTrialDays < 1) {
      this.toast.add({
        severity: 'warn',
        summary: '',
        detail: this.i18n.translate('platformOps.billing.bulk.trialMin')
      });
      return;
    }
    this.runBulkUpdate(
      id => ({ trialExtensionDays: this.bulkTrialDays }),
      () => this.closeBulkPanel()
    );
  }

  applyBulkPlan(): void {
    if (!this.bulkPlan) {
      this.toast.add({
        severity: 'warn',
        summary: '',
        detail: this.i18n.translate('platformOps.billing.bulk.selectPlan')
      });
      return;
    }
    this.runBulkUpdate(
      () => ({ planoCodigo: this.bulkPlan }),
      () => this.closeBulkPanel()
    );
  }

  applyBulkStatus(): void {
    if (!this.bulkStatus) {
      this.toast.add({
        severity: 'warn',
        summary: '',
        detail: this.i18n.translate('platformOps.billing.bulk.selectStatus')
      });
      return;
    }
    this.runBulkUpdate(
      () => ({ status: this.bulkStatus }),
      () => this.closeBulkPanel()
    );
  }

  exportSelectedCsv(): void {
    const rows = this.selectedRows();
    if (rows.length === 0) {
      return;
    }
    const header = [
      this.i18n.translate('platformOps.billing.col.org'),
      this.i18n.translate('platformOps.billing.col.plan'),
      this.i18n.translate('platformOps.billing.col.status'),
      this.i18n.translate('platformOps.billing.col.trialEnds'),
      this.i18n.translate('platformOps.billing.col.provider')
    ];
    const lines = [
      header.map(csvEscape).join(','),
      ...rows.map(row =>
        [
          `${row.tenantNome} (${row.tenantCodigo})`,
          this.i18n.translate(this.planLabelKey(row.planoCodigo)),
          this.i18n.translate(this.statusLabelKey(row.effectiveStatus)),
          row.trialEndsAt ? row.trialEndsAt.slice(0, 10) : '',
          row.provedor
        ]
          .map(csvEscape)
          .join(',')
      )
    ];
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `aerosuite-billing-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.toast.add({
      severity: 'success',
      summary: '',
      detail: this.i18n.translate('platformOps.billing.bulk.exported')
    });
  }

  private runBulkUpdate(
    bodyFor: (tenantId: number) => { planoCodigo?: string; status?: string; trialExtensionDays?: number },
    onSuccess?: () => void
  ): void {
    const ids = [...this.selectedTenantIds];
    if (ids.length === 0 || this.bulkApplying) {
      return;
    }
    this.bulkApplying = true;
    const calls = ids.map(id =>
      this.control.updateBilling(id, bodyFor(id)).pipe(catchError(() => of(null)))
    );
    forkJoin(calls).subscribe(results => {
      const updated = results.filter((r): r is PlatformBillingRow => r != null);
      updated.forEach(row => this.applyUpdatedRow(row));
      const failed = ids.length - updated.length;
      this.bulkApplying = false;
      if (failed === 0) {
        this.toast.add({
          severity: 'success',
          summary: '',
          detail: this.i18n.translate('platformOps.billing.bulk.success', {
            count: String(updated.length)
          })
        });
        onSuccess?.();
      } else if (updated.length > 0) {
        this.toast.add({
          severity: 'warn',
          summary: '',
          detail: this.i18n.translate('platformOps.billing.bulk.partial', {
            ok: String(updated.length),
            fail: String(failed)
          })
        });
        onSuccess?.();
      }
    });
  }

  private resetPagination(): void {
    this.currentPage = 1;
  }

  private matchesStatusFilter(row: PlatformBillingRow): boolean {
    const eff = row.effectiveStatus ?? 'other';
    switch (this.statusFilter) {
      case 'active':
        return eff === 'active';
      case 'trialing':
        return eff === 'trialing';
      case 'trial_expired':
        return eff === 'trial_expired';
      case 'overdue':
        return OVERDUE_EFFECTIVE_STATUSES.has(eff);
      default:
        return true;
    }
  }

  planLabelKey(planoCodigo: string): string {
    return PLAN_LABEL_KEYS[planoCodigo] ?? 'platformOps.billing.plan.trial';
  }

  statusLabelKey(effectiveStatus: string): string {
    return STATUS_LABEL_KEYS[effectiveStatus] ?? 'platformOps.billing.status.other';
  }

  statusBadgeClass(effectiveStatus: string): string {
    switch (effectiveStatus) {
      case 'active':
        return 'ops-status-badge--active';
      case 'trialing':
        return 'ops-status-badge--trial';
      case 'trial_expired':
        return 'ops-status-badge--trial-expired';
      case 'past_due':
      case 'canceled':
      case 'checkout_pending':
        return 'ops-status-badge--overdue';
      default:
        return 'ops-status-badge--neutral';
    }
  }

  openDrawer(row: PlatformBillingRow): void {
    this.selectedRow = row;
    this.draftPlan = row.planoCodigo;
    this.draftStatus = row.status;
    this.trialBonusDays = 0;
    this.drawerVisible = true;
  }

  openHistoryDrawer(row: PlatformBillingRow): void {
    this.historyRow = row;
    this.historyDrawerVisible = true;
    this.historyLoading = true;
    this.historyData = null;
    this.control.getBillingHistory(row.tenantId).subscribe({
      next: res => {
        this.historyData = res;
        this.historyLoading = false;
      },
      error: () => {
        this.historyLoading = false;
      }
    });
  }

  closeHistoryDrawer(): void {
    this.historyDrawerVisible = false;
    this.historyRow = null;
    this.historyData = null;
  }

  historyPinClass(event: PlatformBillingHistoryEvent): string {
    const status = (event.status ?? '').toLowerCase();
    if (status === 'active' || event.eventType === 'invoice_paid') {
      return 'ops-timeline-pin--paid';
    }
    if (
      status === 'trialing' ||
      status === 'checkout_pending' ||
      event.eventType === 'operator_override'
    ) {
      return 'ops-timeline-pin--pending';
    }
    if (
      status === 'past_due' ||
      status === 'trial_expired' ||
      status === 'canceled'
    ) {
      return 'ops-timeline-pin--danger';
    }
    return 'ops-timeline-pin--pending';
  }

  formatHistoryAmount(cents?: number): string {
    if (cents == null || cents <= 0) {
      return '';
    }
    return new Intl.NumberFormat(this.i18n.getCurrentLanguage(), {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  }

  closeDrawer(): void {
    this.drawerVisible = false;
    this.selectedRow = null;
    this.trialBonusDays = 0;
  }

  saveDrawer(): void {
    const row = this.selectedRow;
    if (!row) {
      return;
    }
    this.saving = true;
    const body: { planoCodigo?: string; status?: string; trialExtensionDays?: number } = {};
    if (this.draftPlan && this.draftPlan !== row.planoCodigo) {
      body.planoCodigo = this.draftPlan;
    }
    if (this.draftStatus && this.draftStatus !== row.status) {
      body.status = this.draftStatus;
    }
    if (this.trialBonusDays > 0) {
      body.trialExtensionDays = this.trialBonusDays;
    }
    if (!body.planoCodigo && !body.status && !body.trialExtensionDays) {
      this.saving = false;
      this.closeDrawer();
      return;
    }
    this.control.updateBilling(row.tenantId, body).subscribe({
      next: updated => {
        this.applyUpdatedRow(updated);
        this.saving = false;
        this.toast.add({
          severity: 'success',
          summary: '',
          detail: this.i18n.translate('platformOps.billing.saved')
        });
        this.closeDrawer();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  private applyUpdatedRow(updated: PlatformBillingRow): void {
    if (!this.data) {
      return;
    }
    const idx = this.data.items.findIndex(i => i.tenantId === updated.tenantId);
    if (idx >= 0) {
      this.data.items[idx] = updated;
    }
    this.data.summary = this.buildSummary(this.data.items);
  }

  private buildSummary(items: PlatformBillingRow[]): PlatformBillingSummary {
    const s: PlatformBillingSummary = {
      active: 0,
      trialing: 0,
      trialExpired: 0,
      overdue: 0,
      canceled: 0,
      checkoutPending: 0,
      other: 0
    };
    for (const row of items) {
      const eff = row.effectiveStatus ?? 'other';
      switch (eff) {
        case 'active':
          s.active++;
          break;
        case 'trialing':
          s.trialing++;
          break;
        case 'trial_expired':
          s.trialExpired++;
          break;
        case 'canceled':
          s.canceled++;
          s.overdue++;
          break;
        case 'checkout_pending':
          s.checkoutPending++;
          s.overdue++;
          break;
        case 'past_due':
          s.overdue++;
          break;
        default:
          s.other++;
      }
    }
    return s;
  }
}

function csvEscape(value: string): string {
  const text = value ?? '';
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
