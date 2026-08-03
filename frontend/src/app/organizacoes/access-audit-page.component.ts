import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';

import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { RouterLink, ActivatedRoute } from '@angular/router';

import { TableModule } from 'primeng/table';

import { ButtonModule } from 'primeng/button';

import { InputTextModule } from 'primeng/inputtext';

import { DropdownModule } from 'primeng/dropdown';

import { TooltipModule } from 'primeng/tooltip';

import { TranslatePipe } from '../core/translate.pipe';

import { TranslationService } from '../core/translation.service';

import { AccessAuditEntry, AccessAuditService } from './access-audit.service';

import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';

import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';



export type AuditPageSlot = number | 'ellipsis';



@Component({

  selector: 'app-access-audit-page',

  standalone: true,

  imports: [

    ListTableScrollDirective,

    CommonModule,

    FormsModule,

    RouterLink,

    TableModule,

    ButtonModule,

    InputTextModule,

    DropdownModule,

    TooltipModule,

    TranslatePipe,

    ListDataStatesComponent

  ],

  templateUrl: './access-audit-page.component.html',

  styleUrls: ['./access-audit-page.component.scss']

})

export class AccessAuditPageComponent implements OnInit {

  readonly pageSizeOptions = LIST_ROWS_PER_PAGE_OPTIONS.map(v => ({ label: String(v), value: v }));



  private auditService = inject(AccessAuditService);

  private i18n = inject(TranslationService);

  private route = inject(ActivatedRoute);



  items: AccessAuditEntry[] = [];

  total = 0;

  loading = true;

  pageSize = DEFAULT_LIST_PAGE_SIZE;

  offset = 0;



  evento: string | null = null;

  email = '';

  tenantId: number | null = null;



  eventoOptions: { label: string; value: string }[] = [];



  ngOnInit(): void {

    this.eventoOptions = [

      { label: 'LOGIN_SUCCESS', value: 'LOGIN_SUCCESS' },

      { label: 'LOGIN_FAILURE', value: 'LOGIN_FAILURE' },

      { label: 'RBAC_DENIED', value: 'RBAC_DENIED' }

    ];

    const tenantFromUrl = this.route.snapshot.queryParamMap.get('tenantId');

    if (tenantFromUrl) {

      const parsed = Number(tenantFromUrl);

      if (Number.isFinite(parsed) && parsed > 0) {

        this.tenantId = parsed;

      }

    }

    const emailFromUrl = this.route.snapshot.queryParamMap.get('email');

    if (emailFromUrl) {

      this.email = emailFromUrl.trim();

    }

    const eventoFromUrl = this.route.snapshot.queryParamMap.get('evento');

    if (eventoFromUrl && this.eventoOptions.some(o => o.value === eventoFromUrl)) {

      this.evento = eventoFromUrl;

    }

    this.load();

  }



  currentPage(): number {

    return Math.floor(this.offset / this.pageSize) + 1;

  }



  totalPages(): number {

    return Math.max(1, Math.ceil(this.total / this.pageSize));

  }



  paginationSlots(): AuditPageSlot[] {

    const total = this.totalPages();

    const cur = this.currentPage();

    if (total <= 7) {

      return Array.from({ length: total }, (_, i) => i + 1);

    }

    const slots: AuditPageSlot[] = [1];

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



  goToPage(page: number): void {

    const clamped = Math.min(Math.max(1, page), this.totalPages());

    const nextOffset = (clamped - 1) * this.pageSize;

    if (nextOffset !== this.offset) {

      this.offset = nextOffset;

      this.load();

    }

  }



  onPageSizeChange(): void {

    this.offset = 0;

    this.load();

  }



  footerRangeText(): string {

    if (this.total <= 0) {

      return '';

    }

    const from = this.offset + 1;

    const to = Math.min(this.offset + this.items.length, this.total);

    return this.i18n.translate('audit.footer.range', {

      from: String(from),

      to: String(to),

      total: String(this.total)

    });

  }



  formatDetalhe(raw: string | null | undefined): string {

    if (!raw?.trim()) {

      return '—';

    }

    const text = raw.trim();

    const code = text.split(/[\s(]/)[0]?.trim();

    if (code && /^[A-Z0-9_]+$/.test(code)) {

      const key = `audit.detail.${code}`;

      const translated = this.i18n.translate(key);

      if (translated !== key) {

        const tenantSuffix = text.match(/tenant=([^\s)]+)/i);

        if (tenantSuffix) {

          return `${translated} (${tenantSuffix[1]})`;

        }

        return translated;

      }

    }

    return text;

  }



  detalheTooltip(row: AccessAuditEntry): string | undefined {

    const formatted = this.formatDetalhe(row.detalhe);

    const raw = row.detalhe?.trim();

    if (!raw || formatted === raw) {

      return undefined;

    }

    return raw;

  }



  search(): void {

    this.offset = 0;

    this.load();

  }



  onEventoChange(): void {

    this.search();

  }



  load(): void {

    this.loading = true;

    this.auditService

      .list({

        evento: this.evento ?? undefined,

        email: this.email.trim() || undefined,

        tenantId: this.tenantId ?? undefined,

        limit: this.pageSize,

        offset: this.offset

      })

      .subscribe({

        next: page => {

          this.items = page.items;

          this.total = page.total;

          this.loading = false;

        },

        error: () => {

          this.loading = false;

        }

      });

  }

}

