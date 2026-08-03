import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule, Menu } from 'primeng/menu';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { TranslatePipe } from '../core/translate.pipe';
import { DisplayTextPipe } from '../core/display-text.pipe';
import { repairDisplayText } from '../core/display-text.util';
import { createListSearch } from '../core/list-search.helper';
import { TranslationService } from '../core/translation.service';
import {
  PlatformControlService,
  PlatformOperatorList,
  PlatformOperatorRow
} from './platform-control.service';
import {
  formatOpsConfirmMessage,
  OPS_CONFIRM_ACCEPT_CLASS,
  OPS_CONFIRM_ACCEPT_DANGER_CLASS,
  OPS_CONFIRM_REJECT_CLASS
} from './platform-ops-confirm.util';

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type OperatorsPageSlot = number | 'ellipsis';
export type OperatorsKpiFilter = 'effective' | 'config' | 'grant';

/** Espaço entre o ícone de ações e o popover (px). */
const ROW_MENU_OFFSET_Y_PX = 6;
/** Leve deslocamento horizontal para não colar na borda direita da linha. */
const ROW_MENU_OFFSET_X_PX = -6;

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

const PRIVILEGED_PERFIL_CODES = new Set([
  'ADMIN',
  'ADMINISTRADOR',
  'DIRETOR',
  'GERENTE',
  'PLATFORM_OPS'
]);

@Component({
  selector: 'app-platform-ops-operators',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    MenuModule,
    DropdownModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    TranslatePipe,
    DisplayTextPipe
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './platform-ops-operators.component.html',
  styleUrls: ['./platform-ops-operators.component.scss']
})
export class PlatformOpsOperatorsComponent implements OnInit {
  @ViewChild('rowMenu') rowMenu?: Menu;

  private control = inject(PlatformControlService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  loading = true;
  savingId: number | null = null;
  data: PlatformOperatorList | null = null;
  rowMenuItems: MenuItem[] = [];
  kpiFilter: OperatorsKpiFilter | null = null;
  searchQuery = '';
  private searchTerm = '';

  private readonly listSearch = createListSearch(this.destroyRef, term => {
    this.searchTerm = term;
    this.resetPagination();
  });

  pageSize = 10;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS.map(v => ({ label: String(v), value: v }));
  readonly menuPanelStyle = {
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#f8fafc'
  };
  currentPage = 1;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.control.listOperators().subscribe({
      next: res => {
        this.data = res;
        this.resetPagination();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  allItems(): PlatformOperatorRow[] {
    return this.data?.items ?? [];
  }

  filteredItems(): PlatformOperatorRow[] {
    return this.allItems().filter(row => this.matchesKpiFilter(row) && this.matchesSearch(row));
  }

  totalCount(): number {
    return this.filteredItems().length;
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  }

  paginatedItems(): PlatformOperatorRow[] {
    const items = this.filteredItems();
    const start = (this.currentPage - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  hasActiveFilters(): boolean {
    return this.kpiFilter != null || this.searchTerm.length > 0;
  }

  toggleKpiFilter(filter: OperatorsKpiFilter): void {
    this.kpiFilter = this.kpiFilter === filter ? null : filter;
    this.resetPagination();
  }

  isKpiSelected(filter: OperatorsKpiFilter): boolean {
    return this.kpiFilter === filter;
  }

  clearFilters(): void {
    this.kpiFilter = null;
    this.searchQuery = '';
    this.searchTerm = '';
    this.resetPagination();
  }

  activeSearchTerm(): string {
    return this.searchTerm;
  }

  kpiFilterLabelKey(): string | null {
    switch (this.kpiFilter) {
      case 'effective':
        return 'platformOps.operators.kpi.effective';
      case 'config':
        return 'platformOps.operators.kpi.config';
      case 'grant':
        return 'platformOps.operators.kpi.grant';
      default:
        return null;
    }
  }

  onSearchChange(value: string | null | undefined): void {
    this.listSearch.fromModel(value);
  }

  private matchesKpiFilter(row: PlatformOperatorRow): boolean {
    switch (this.kpiFilter) {
      case 'effective':
        return row.opsAccessEffective;
      case 'config':
        return row.opsAccessFromConfig;
      case 'grant':
        return row.opsAccessFromGrant && row.grantAtivo;
      default:
        return true;
    }
  }

  private matchesSearch(row: PlatformOperatorRow): boolean {
    const term = normalizeSearchText(this.searchTerm);
    if (!term) {
      return true;
    }
    const haystack = this.rowSearchHaystack(row);
    const tokens = term.split(/\s+/).filter(Boolean);
    return tokens.every(token => haystack.includes(token));
  }

  private rowSearchHaystack(row: PlatformOperatorRow): string {
    const statusAliases = row.usuarioAtivo
      ? 'ativo active actif activo'
      : 'inativo inactive inactif inactivo';
    const statusLabel = this.i18n.translate(
      row.usuarioAtivo
        ? 'platformOps.operators.status.active'
        : 'platformOps.operators.status.inactive'
    );
    const parts = [
      repairDisplayText(row.nome),
      row.email,
      row.perfilCodigo ?? '',
      row.perfilNome ?? '',
      this.perfilLabel(row),
      statusLabel,
      statusAliases
    ];
    return normalizeSearchText(parts.join(' '));
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

  paginationSlots(): OperatorsPageSlot[] {
    const total = this.totalPages();
    const cur = this.currentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const slots: OperatorsPageSlot[] = [1];
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

  private resetPagination(): void {
    this.currentPage = 1;
  }

  perfilLabel(row: PlatformOperatorRow): string {
    const raw = row.perfilCodigo
      ? this.i18n.translatePerfil(row.perfilCodigo, row.perfilNome)
      : (row.perfilNome ?? '');
    return repairDisplayText(raw);
  }

  perfilBadgeClass(row: PlatformOperatorRow): string {
    const code = (row.perfilCodigo ?? '').trim().toUpperCase();
    if (code === 'PLATFORM_OPS') {
      return 'ops-perfil-badge--ops';
    }
    return PRIVILEGED_PERFIL_CODES.has(code)
      ? 'ops-perfil-badge--privileged'
      : 'ops-perfil-badge--operational';
  }

  hasOpsAccess(row: PlatformOperatorRow): boolean {
    return row.opsAccessEffective;
  }

  hasSource(row: PlatformOperatorRow): boolean {
    return row.opsAccessFromConfig || row.opsAccessFromGrant;
  }

  sourceLabelKey(row: PlatformOperatorRow): string | null {
    if (!this.hasSource(row)) {
      return null;
    }
    if (row.opsAccessFromConfig && row.opsAccessFromGrant) {
      return 'platformOps.operators.source.both';
    }
    if (row.opsAccessFromConfig) {
      return 'platformOps.operators.source.config';
    }
    return 'platformOps.operators.source.grant';
  }

  sourceBadgeClass(row: PlatformOperatorRow): string {
    if (row.opsAccessFromConfig && row.opsAccessFromGrant) {
      return 'ops-source-badge--both';
    }
    if (row.opsAccessFromConfig) {
      return 'ops-source-badge--config';
    }
    return 'ops-source-badge--grant';
  }

  isConfigProtected(row: PlatformOperatorRow): boolean {
    return row.opsAccessFromConfig;
  }

  canGrant(row: PlatformOperatorRow): boolean {
    return row.usuarioAtivo && !row.grantAtivo && !row.opsAccessFromConfig;
  }

  canRevoke(row: PlatformOperatorRow): boolean {
    return row.grantAtivo && !row.opsAccessFromConfig;
  }

  hasRowActions(row: PlatformOperatorRow): boolean {
    return this.canGrant(row) || this.canRevoke(row);
  }

  isRowBusy(row: PlatformOperatorRow): boolean {
    return this.savingId === row.usuarioId;
  }

  openRowMenu(event: Event, row: PlatformOperatorRow): void {
    if (!this.hasRowActions(row) || this.isRowBusy(row)) {
      return;
    }
    this.rowMenuItems = this.buildRowMenuItems(row);
    this.rowMenu?.toggle(event);
  }

  onRowMenuShow(): void {
    setTimeout(() => this.nudgeRowMenuPanel(), 0);
  }

  private nudgeRowMenuPanel(): void {
    const panel = document.querySelector(
      '.p-menu.p-menu-overlay.ops-row-action-menu'
    ) as HTMLElement | null;
    if (!panel) {
      return;
    }
    const top = parseFloat(panel.style.top);
    const left = parseFloat(panel.style.left);
    if (!Number.isNaN(top)) {
      panel.style.top = `${top + ROW_MENU_OFFSET_Y_PX}px`;
    }
    if (!Number.isNaN(left)) {
      panel.style.left = `${left + ROW_MENU_OFFSET_X_PX}px`;
    }
  }

  private buildRowMenuItems(row: PlatformOperatorRow): MenuItem[] {
    const items: MenuItem[] = [];
    if (this.canGrant(row)) {
      items.push({
        label: this.i18n.translate('platformOps.operators.action.grant'),
        icon: 'pi pi-shield',
        command: () => this.confirmToggle(row, true)
      });
    }
    if (this.canRevoke(row)) {
      items.push({
        label: this.i18n.translate('platformOps.operators.action.revoke'),
        icon: 'pi pi-ban',
        command: () => this.confirmToggle(row, false)
      });
    }
    return items;
  }

  confirmToggle(row: PlatformOperatorRow, grant: boolean): void {
    if (this.isRowBusy(row)) {
      return;
    }
    if (grant) {
      this.confirm.confirm({
        message: formatOpsConfirmMessage(this.i18n, 'platformOps.operators.confirm.grant', {
          name: repairDisplayText(row.nome),
          email: row.email
        }),
        header: this.i18n.translate('platformOps.operators.confirm.grantTitle'),
        icon: 'pi pi-shield',
        acceptLabel: this.i18n.translate('platformOps.operators.action.grant'),
        rejectLabel: this.i18n.translate('platformOps.common.cancel'),
        acceptButtonStyleClass: OPS_CONFIRM_ACCEPT_CLASS,
        rejectButtonStyleClass: OPS_CONFIRM_REJECT_CLASS,
        accept: () => this.applyAccess(row, true)
      });
      return;
    }
    this.confirm.confirm({
      message: formatOpsConfirmMessage(this.i18n, 'platformOps.operators.confirm.revoke', {
        name: repairDisplayText(row.nome),
        email: row.email
      }),
      header: this.i18n.translate('platformOps.operators.confirm.revokeTitle'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.translate('platformOps.operators.action.revoke'),
      rejectLabel: this.i18n.translate('platformOps.common.cancel'),
      acceptButtonStyleClass: OPS_CONFIRM_ACCEPT_DANGER_CLASS,
      rejectButtonStyleClass: OPS_CONFIRM_REJECT_CLASS,
      accept: () => this.applyAccess(row, false)
    });
  }

  private applyAccess(row: PlatformOperatorRow, ativo: boolean): void {
    this.savingId = row.usuarioId;
    this.control.setOperatorAccess(row.usuarioId, ativo).subscribe({
      next: updated => {
        Object.assign(row, updated);
        if (this.data) {
          this.recountTotals();
        }
        this.savingId = null;
        this.toast.add({
          severity: 'success',
          summary: '',
          detail: this.i18n.translate(
            ativo ? 'platformOps.operators.savedGrant' : 'platformOps.operators.savedRevoke'
          )
        });
      },
      error: () => {
        this.savingId = null;
      }
    });
  }

  private recountTotals(): void {
    if (!this.data) {
      return;
    }
    let effective = 0;
    let config = 0;
    let grant = 0;
    for (const row of this.data.items) {
      if (row.opsAccessEffective) {
        effective++;
      }
      if (row.opsAccessFromConfig) {
        config++;
      }
      if (row.opsAccessFromGrant && row.grantAtivo) {
        grant++;
      }
    }
    this.data.totalEffective = effective;
    this.data.totalFromConfig = config;
    this.data.totalFromGrant = grant;
  }
}
