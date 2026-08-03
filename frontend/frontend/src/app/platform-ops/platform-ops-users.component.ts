import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { TableModule } from 'primeng/table';

import { DropdownModule } from 'primeng/dropdown';

import { ButtonModule } from 'primeng/button';

import { TooltipModule } from 'primeng/tooltip';

import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ToastModule } from 'primeng/toast';

import { ConfirmationService, MessageService } from 'primeng/api';

import { TranslatePipe } from '../core/translate.pipe';

import { DisplayTextPipe } from '../core/display-text.pipe';

import { repairDisplayText } from '../core/display-text.util';

import { TranslationService } from '../core/translation.service';

import { TenantService } from '../organizacoes/tenant.service';

import {

  PlatformControlService,

  PlatformTenantUser,

  PlatformTenantUserList

} from './platform-control.service';

import {
  formatOpsConfirmMessage,
  OPS_CONFIRM_ACCEPT_DANGER_CLASS,
  OPS_CONFIRM_REJECT_CLASS
} from './platform-ops-confirm.util';



const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type UsersPageSlot = number | 'ellipsis';



const PRIVILEGED_PERFIL_CODES = new Set([

  'ADMIN',

  'ADMINISTRADOR',

  'DIRETOR',

  'GERENTE'

]);



@Component({

  selector: 'app-platform-ops-users',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    TableModule,

    DropdownModule,

    ButtonModule,

    TooltipModule,

    ConfirmDialogModule,

    ToastModule,

    TranslatePipe,

    DisplayTextPipe

  ],

  providers: [MessageService, ConfirmationService],

  templateUrl: './platform-ops-users.component.html',

  styleUrls: ['./platform-ops-users.component.scss']

})

export class PlatformOpsUsersComponent implements OnInit {

  private control = inject(PlatformControlService);

  private tenants = inject(TenantService);

  private route = inject(ActivatedRoute);

  private router = inject(Router);

  private toast = inject(MessageService);

  private confirm = inject(ConfirmationService);

  private i18n = inject(TranslationService);



  loadingTenants = true;

  loadingUsers = false;

  tenantOptions: { label: string; value: number }[] = [];

  selectedTenantId: number | null = null;

  /** Vazio = todos (internos + externos). */

  tipoFilter = '';

  userList: PlatformTenantUserList | null = null;

  togglingId: number | null = null;

  pageSize = 10;

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS.map(v => ({ label: String(v), value: v }));

  currentPage = 1;



  readonly tipoOptions = [

    { labelKey: 'platformOps.users.filter.all', value: '' },

    { labelKey: 'platformOps.users.filter.internal', value: 'interno' },

    { labelKey: 'platformOps.users.filter.external', value: 'externo' }

  ];



  ngOnInit(): void {

    this.tenants.list().subscribe({

      next: res => {

        this.tenantOptions = (res.items ?? []).map(t => ({

          label: repairDisplayText(`${t.nome} (${t.codigo})`),

          value: t.id

        }));

        this.loadingTenants = false;

        const qTenant = Number(this.route.snapshot.queryParamMap.get('tenantId'));

        if (qTenant && this.tenantOptions.some(o => o.value === qTenant)) {

          this.selectedTenantId = qTenant;

          this.loadUsers();

        } else if (this.tenantOptions.length) {

          this.selectedTenantId = this.tenantOptions[0].value;

          this.loadUsers();

        }

      },

      error: () => {

        this.loadingTenants = false;

      }

    });

  }



  onTenantChange(): void {

    this.resetPagination();

    void this.router.navigate([], {

      relativeTo: this.route,

      queryParams: { tenantId: this.selectedTenantId },

      queryParamsHandling: 'merge'

    });

    this.loadUsers();

  }



  onTipoChange(): void {

    this.resetPagination();

    this.loadUsers();

  }



  loadUsers(): void {

    if (!this.selectedTenantId) {

      return;

    }

    this.loadingUsers = true;

    this.control.listTenantUsers(this.selectedTenantId, this.resolveTipoParam()).subscribe({

      next: res => {

        this.userList = res;

        this.resetPagination();

        this.loadingUsers = false;

      },

      error: () => {

        this.loadingUsers = false;

      }

    });

  }



  private resolveTipoParam(): string | undefined {

    const raw = (this.tipoFilter ?? '').trim().toLowerCase();

    if (!raw || raw === 'todos') {

      return undefined;

    }

    return raw;

  }



  perfilLabel(user: PlatformTenantUser): string {

    if (user.tipo === 'externo') {

      return '';

    }

    const raw = user.perfilCodigo

      ? this.i18n.translatePerfil(user.perfilCodigo, user.perfilNome)

      : (user.perfilNome ?? '');

    return repairDisplayText(raw);

  }



  tipoBadgeClass(user: PlatformTenantUser): string {

    return user.tipo === 'externo' ? 'ops-tipo-badge--external' : 'ops-tipo-badge--internal';

  }



  perfilBadgeClass(user: PlatformTenantUser): string {

    const code = (user.perfilCodigo ?? '').trim().toUpperCase();

    return PRIVILEGED_PERFIL_CODES.has(code)

      ? 'ops-perfil-badge--privileged'

      : 'ops-perfil-badge--operational';

  }



  filteredUsers(): PlatformTenantUser[] {

    return this.userList?.items ?? [];

  }



  totalFilteredCount(): number {

    return this.filteredUsers().length;

  }



  totalPages(): number {

    return Math.max(1, Math.ceil(this.totalFilteredCount() / this.pageSize));

  }



  paginatedUsers(): PlatformTenantUser[] {

    const items = this.filteredUsers();

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



  paginationSlots(): UsersPageSlot[] {

    const total = this.totalPages();

    const cur = this.currentPage;

    if (total <= 7) {

      return Array.from({ length: total }, (_, i) => i + 1);

    }

    const slots: UsersPageSlot[] = [1];

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



  private resetPagination(): void {

    this.currentPage = 1;

  }



  isRowBusy(user: PlatformTenantUser): boolean {

    return this.togglingId === user.id;

  }



  confirmToggleActive(user: PlatformTenantUser): void {

    if (!this.selectedTenantId || this.isRowBusy(user)) {

      return;

    }

    if (user.ativo) {

      this.confirm.confirm({

        message: formatOpsConfirmMessage(this.i18n, 'platformOps.users.confirm.deactivate', {
          name: repairDisplayText(user.nome),
          email: user.email
        }),

        header: this.i18n.translate('platformOps.users.confirm.deactivateTitle'),

        icon: 'pi pi-exclamation-triangle',

        acceptLabel: this.i18n.translate('platformOps.users.action.deactivate'),

        rejectLabel: this.i18n.translate('platformOps.common.cancel'),

        acceptButtonStyleClass: OPS_CONFIRM_ACCEPT_DANGER_CLASS,

        rejectButtonStyleClass: OPS_CONFIRM_REJECT_CLASS,

        accept: () => this.setActive(user, false)

      });

      return;

    }

    this.setActive(user, true);

  }



  setActive(user: PlatformTenantUser, active: boolean): void {

    if (!this.selectedTenantId || user.ativo === active) {

      return;

    }

    const prev = user.ativo;

    user.ativo = active;

    this.togglingId = user.id;

    this.control.updateTenantUser(this.selectedTenantId, user.id, user.tipo, { ativo: active }).subscribe({

      next: updated => {

        user.ativo = updated.ativo;

        this.togglingId = null;

        this.toast.add({

          severity: 'success',

          summary: '',

          detail: this.i18n.translate('platformOps.users.saved')

        });

      },

      error: () => {

        user.ativo = prev;

        this.togglingId = null;

      }

    });

  }



  openAuditTrail(user: PlatformTenantUser): void {

    if (!this.selectedTenantId) {

      return;

    }

    void this.router.navigate(['/plataforma/auditoria'], {

      queryParams: {

        tenantId: this.selectedTenantId,

        email: user.email

      }

    });

  }



  copyEmail(user: PlatformTenantUser): void {

    const email = user.email?.trim();

    if (!email) {

      return;

    }

    void navigator.clipboard.writeText(email).then(() => {

      this.toast.add({

        severity: 'info',

        summary: '',

        detail: this.i18n.translate('platformOps.users.emailCopied')

      });

    });

  }

}


