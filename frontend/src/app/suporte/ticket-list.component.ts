import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatorModule } from 'primeng/paginator';
import { 
  TicketService, 
  Ticket, 
  TicketEstatisticas,
  TICKET_TIPOS, 
  TICKET_PRIORIDADES, 
  TICKET_STATUS 
} from '../core/ticket.service';
import { TranslatePipe } from '../core/translate.pipe';
import { AuthService } from '../auth/auth.service';
import { TranslationService } from '../core/translation.service';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListRefreshOverlayComponent } from '../shared/list-refresh-overlay/list-refresh-overlay.component';
import { DisplayTextPipe } from '../core/display-text.pipe';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  styleUrls: ['./suporte-shared.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    TableModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
    PaginatorModule,
    TranslatePipe,
    PageHeroComponent,
    ListRefreshOverlayComponent,
    DisplayTextPipe
  ],
  template: `
    <div class="as-page suporte-page">
      <app-page-hero
        variant="gold"
        kickerKey="suporte.ticketList.scopeMine"
        icon="pi-user"
        titleKey="suporte.ticketList.heroTitle"
        subtitleKey="suporte.ticketList.heroSubtitle"
        titleIcon="pi-ticket"
        [hasActions]="true">
        <div actions class="header-actions">
          <button
            pButton
            type="button"
            [label]="'suporte.ticketList.btnNew' | translate"
            icon="pi pi-plus-circle"
            class="btn-suporte-primary"
            routerLink="/suporte/novo">
          </button>
        </div>
      </app-page-hero>

      <div class="suporte-page-content">
      <div class="stats-grid-premium">
        <button type="button" class="stat-tile" (click)="filtrarStatus(null)" [class.active]="!filtros.status" [class.stat-tile--zero]="!(estatisticas.total || 0)" [attr.aria-pressed]="!filtros.status">
          <div class="stat-tile-icon stat-tile-icon--open"><i class="pi pi-inbox"></i></div>
          <div class="stat-tile-body">
            <div class="stat-tile-value">{{ estatisticas.total || 0 }}</div>
            <div class="stat-tile-label">{{ 'suporte.ticketList.stat.total' | translate }}</div>
          </div>
        </button>
        <button type="button" class="stat-tile" (click)="filtrarStatus('ABERTO')" [class.active]="filtros.status === 'ABERTO'" [class.stat-tile--zero]="!(estatisticas.abertos || 0)" [attr.aria-pressed]="filtros.status === 'ABERTO'">
          <div class="stat-tile-icon stat-tile-icon--open"><i class="pi pi-folder-open"></i></div>
          <div class="stat-tile-body">
            <div class="stat-tile-value">{{ estatisticas.abertos || 0 }}</div>
            <div class="stat-tile-label">{{ 'suporte.ticketList.stat.open' | translate }}</div>
          </div>
        </button>
        <button type="button" class="stat-tile" (click)="filtrarStatus('EM_ANDAMENTO')" [class.active]="filtros.status === 'EM_ANDAMENTO'" [class.stat-tile--zero]="!countEmAndamento" [attr.aria-pressed]="filtros.status === 'EM_ANDAMENTO'">
          <div class="stat-tile-icon stat-tile-icon--progress"><i class="pi pi-sync"></i></div>
          <div class="stat-tile-body">
            <div class="stat-tile-value">{{ countEmAndamento }}</div>
            <div class="stat-tile-label">{{ 'suporte.ticketList.stat.inProgress' | translate }}</div>
          </div>
        </button>
        <button type="button" class="stat-tile" (click)="filtrarStatus('AGUARDANDO_USUARIO')" [class.active]="filtros.status === 'AGUARDANDO_USUARIO'" [class.stat-tile--zero]="!(estatisticas.aguardandoUsuario || 0)" [attr.aria-pressed]="filtros.status === 'AGUARDANDO_USUARIO'">
          <div class="stat-tile-icon stat-tile-icon--wait"><i class="pi pi-clock"></i></div>
          <div class="stat-tile-body">
            <div class="stat-tile-value">{{ estatisticas.aguardandoUsuario || 0 }}</div>
            <div class="stat-tile-label">{{ 'suporte.ticketList.stat.waiting' | translate }}</div>
          </div>
        </button>
        <button type="button" class="stat-tile" (click)="filtrarStatus('RESOLVIDO')" [class.active]="filtros.status === 'RESOLVIDO'" [class.stat-tile--zero]="!(estatisticas.resolvidos || 0)" [attr.aria-pressed]="filtros.status === 'RESOLVIDO'">
          <div class="stat-tile-icon stat-tile-icon--ok"><i class="pi pi-check-circle"></i></div>
          <div class="stat-tile-body">
            <div class="stat-tile-value">{{ estatisticas.resolvidos || 0 }}</div>
            <div class="stat-tile-label">{{ 'suporte.ticketList.stat.resolved' | translate }}</div>
          </div>
        </button>
      </div>

      <div class="filters-bar-premium">
        <div class="search-wrap">
          <i class="pi pi-search"></i>
          <input 
            pInputText 
            [(ngModel)]="filtros.q"
            (keyup.enter)="buscar()"
            [placeholder]="'suporte.ticketList.searchPlaceholder' | translate">
        </div>

        <div class="filter-group" style="display:flex;gap:0.5rem;align-items:center">
          <p-dropdown 
            [options]="statusOptions"
            [(ngModel)]="filtros.status"
            (onChange)="buscar()"
            [placeholder]="'suporte.ticketList.filter.status' | translate"
            [showClear]="true"
            optionLabel="label"
            optionValue="value">
          </p-dropdown>

          <p-dropdown 
            [options]="prioridadeOptions"
            [(ngModel)]="filtros.prioridade"
            (onChange)="buscar()"
            [placeholder]="'suporte.ticketList.filter.priority' | translate"
            [showClear]="true"
            optionLabel="label"
            optionValue="value">
          </p-dropdown>

          <button 
            pButton 
            type="button" 
            icon="pi pi-filter-slash" 
            class="btn-clear"
            (click)="limparFiltros()"
            [attr.aria-label]="'common.list.tooltip.clearFilters' | translate"
            [pTooltip]="'common.list.tooltip.clearFilters' | translate"
            tooltipPosition="top">
          </button>
        </div>
      </div>

      <!-- Loading inicial -->
      <div class="loading-state" *ngIf="loading && tickets.length === 0">
        <p-progressSpinner strokeWidth="3" animationDuration="1s"></p-progressSpinner>
        <p>{{ 'suporte.ticketList.loading' | translate }}</p>
      </div>

      <!-- Lista de Tickets -->
      <div class="tickets-section tickets-list-full list-with-refresh" *ngIf="!loading || tickets.length > 0">
        <app-list-refresh-overlay [loading]="loading && tickets.length > 0"></app-list-refresh-overlay>
        <div class="ticket-card-premium" 
             *ngFor="let ticket of tickets" 
             (click)="abrirTicket(ticket)"
             [class.sla-warning]="ticket.slaPrimeiraRespostaEstourado || ticket.slaResolucaoEstourado">
          
          <div class="ticket-status-strip" [class]="'status-' + (ticket.status || '').toLowerCase().replace('_', '-')"></div>
          
          <div class="ticket-card-body">
            <div class="ticket-header">
              <span class="ticket-id">{{ ticket.numero }}</span>
              <span class="ticket-date">{{ ticket.dataAbertura | date:'dd/MM/yyyy' }}</span>
            </div>
            
            <h3 class="ticket-title">{{ ticket.titulo | displayText }}</h3>
            
            <p class="ticket-description">
              {{ ticket.descricao | slice:0:120 }}{{ (ticket.descricao?.length || 0) > 120 ? '...' : '' }}
            </p>
            
            <div class="ticket-footer">
              <div class="ticket-tags">
                <span class="tag tipo" [class]="'tipo-' + (ticket.tipo || '').toLowerCase()">
                  {{ getTipoLabel(ticket.tipo || '') }}
                </span>
                <span class="tag prioridade" [class]="'prio-' + (ticket.prioridade || '').toLowerCase()">
                  {{ getPrioridadeLabel(ticket.prioridade || '') }}
                </span>
              </div>
              
              <div class="ticket-meta">
                <span class="status-badge" [class]="'status-' + (ticket.status || '').toLowerCase().replace('_', '-')">
                  {{ getStatusLabel(ticket.status || '') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state-premium" *ngIf="tickets.length === 0">
          <div class="empty-icon">
            <i class="pi pi-inbox"></i>
          </div>
          <h3>{{ 'suporte.ticketList.empty.title' | translate }}</h3>
          <p>{{ 'suporte.ticketList.empty.subtitle' | translate }}</p>
          <button 
            pButton 
            type="button" 
            [label]="'suporte.ticketList.empty.btn' | translate" 
            icon="pi pi-plus-circle"
            class="btn-suporte-primary"
            routerLink="/suporte/novo">
          </button>
        </div>
      </div>

      <!-- Paginação -->
      <div class="pagination-section" *ngIf="totalRecords > pageSize">
        <p-paginator 
          [rows]="pageSize"
          [totalRecords]="totalRecords"
          [first]="currentPage * pageSize"
          (onPageChange)="onPageChange($event)"
          [showCurrentPageReport]="true"
          [currentPageReportTemplate]="pageReportTemplate"
          [rowsPerPageOptions]="listRowsPerPageOptions">
        </p-paginator>
      </div>
      </div>
    </div>
  `,
  styles: [`
    .suporte-container {
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-text {
      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #0f172a;
      }

      p {
        margin: 0.25rem 0 0 0;
        font-size: 0.875rem;
        color: #475569;
      }
    }

    .btn-primary {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      border: none;
      padding: 0.625rem 1.25rem;
      font-weight: 500;
      border-radius: 8px;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

      &:hover {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
        transform: translateY(-1px);
      }
    }

    .stats-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .stat-card {
      flex: 1;
      min-width: 120px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      text-align: center;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      &.active {
        border-color: #0ea5e9;
        background: #f0f9ff;
      }

      .stat-number {
        font-size: 1.5rem;
        font-weight: 700;
        color: #0f172a;
      }

      .stat-label {
        font-size: 0.75rem;
        color: #475569;
        margin-top: 0.25rem;
      }

      &.aberto .stat-number { color: #0ea5e9; }
      &.andamento .stat-number { color: #f59e0b; }
      &.aguardando .stat-number { color: #f97316; }
      &.resolvido .stat-number { color: #22c55e; }
    }

    .filters-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-box {
      flex: 1;
      min-width: 250px;
      position: relative;

      i {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #475569;
      }

      input {
        width: 100%;
        padding: 0.625rem 0.875rem 0.625rem 2.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

        &:focus {
          outline: none;
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
      }
    }

    .filter-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn-clear {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      width: 38px;
      height: 38px;
      padding: 0;

      &:hover {
        background: #e2e8f0;
        color: #475569;
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #475569;

      p {
        margin-top: 1rem;
        font-size: 0.875rem;
      }
    }

    .tickets-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .ticket-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      display: flex;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      overflow: hidden;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        transform: translateY(-1px);
      }

      &.sla-warning {
        border-color: #fecaca;
        background: #fef2f2;
      }
    }

    .ticket-status-bar {
      width: 4px;
      flex-shrink: 0;

      &.status-aberto { background: #38bdf8; }
      &.status-em-analise { background: #a78bfa; }
      &.status-em-andamento { background: #fbbf24; }
      &.status-aguardando-usuario { background: #fb923c; }
      &.status-resolvido { background: #4ade80; }
      &.status-fechado { background: #94a3b8; }
    }

    .ticket-content {
      flex: 1;
      padding: 1rem 1.25rem;
    }

    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .ticket-id {
      font-family: 'SF Mono', 'Monaco', monospace;
      font-size: 0.75rem;
      color: #0ea5e9;
      font-weight: 600;
      background: #f0f9ff;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }

    .ticket-date {
      font-size: 0.75rem;
      color: #475569;
    }

    .ticket-title {
      margin: 0 0 0.5rem 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.4;
    }

    .ticket-description {
      margin: 0 0 0.75rem 0;
      font-size: 0.8125rem;
      color: #475569;
      line-height: 1.5;
    }

    .ticket-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ticket-tags {
      display: flex;
      gap: 0.375rem;
    }

    .tag {
      font-size: 0.6875rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;

      &.tipo-erro { background: #fee2e2; color: #dc2626; }
      &.tipo-melhoria { background: #e0f2fe; color: #0284c7; }
      &.tipo-duvida { background: #f3f4f6; color: #4b5563; }
      &.tipo-solicitacao { background: #dcfce7; color: #16a34a; }

      &.prio-critica { background: #fef2f2; color: #dc2626; }
      &.prio-alta { background: #fff7ed; color: #ea580c; }
      &.prio-media { background: #fefce8; color: #ca8a04; }
      &.prio-baixa { background: #f0fdf4; color: #16a34a; }
    }

    .status-badge {
      font-size: 0.6875rem;
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-weight: 500;

      &.status-aberto { background: #e0f2fe; color: #0369a1; }
      &.status-em-analise { background: #ede9fe; color: #7c3aed; }
      &.status-em-andamento { background: #fef3c7; color: #b45309; }
      &.status-aguardando-usuario { background: #ffedd5; color: #c2410c; }
      &.status-resolvido { background: #dcfce7; color: #15803d; }
      &.status-fechado { background: #f1f5f9; color: #475569; }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border: 1px dashed #e2e8f0;
      border-radius: 12px;

      .empty-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 1rem;
        background: #f1f5f9;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 1.75rem;
          color: #475569;
        }
      }

      h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        color: #0f172a;
      }

      p {
        margin: 0 0 1.5rem 0;
        font-size: 0.875rem;
        color: #475569;
      }
    }

    .pagination-section {
      margin-top: 1.5rem;
      display: flex;
      justify-content: center;
    }

    :host ::ng-deep {
      .p-dropdown {
        border-radius: 8px;
        border-color: #e2e8f0;

        &:hover {
          border-color: #cbd5e1;
        }

        &.p-focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
      }

      .p-paginator {
        background: transparent;
        border: none;
        padding: 0;

        .p-paginator-element {
          border-radius: 6px;
        }
      }

      .p-progressspinner-circle {
        stroke: #0ea5e9 !important;
      }
    }

    @media (max-width: 768px) {
      .suporte-container {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .stats-row {
        gap: 0.5rem;
      }

      .stat-card {
        min-width: calc(50% - 0.25rem);
        flex: none;
      }

      .filters-section {
        flex-direction: column;
      }

      .search-box {
        width: 100%;
      }

      .filter-group {
        width: 100%;
        justify-content: space-between;
      }
    }
  `]
})
export class TicketListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ticketService = inject(TicketService);
  private auth = inject(AuthService);
  private i18n = inject(TranslationService);
  private usuarioIdMe?: number;

  tickets: Ticket[] = [];
  estatisticas: TicketEstatisticas = {
    total: 0,
    abertos: 0,
    emAnalise: 0,
    emAndamento: 0,
    aguardandoUsuario: 0,
    resolvidos: 0,
    fechados: 0
  };

  loading = true;
  currentPage = 0;
  pageSize = DEFAULT_LIST_PAGE_SIZE;
  totalRecords = 0;

  filtros: {
    q?: string;
    status?: string;
    prioridade?: string;
    tipo?: string;
  } = {};

  get statusOptions() {
    return this.i18n.buildTranslatedOptions(
      'ticket.status',
      TICKET_STATUS.map((s) => ({ label: s.value, value: s.value }))
    );
  }

  get countEmAndamento(): number {
    return (this.estatisticas.emAnalise || 0) + (this.estatisticas.emAndamento || 0);
  }

  get prioridadeOptions() {
    return this.i18n.buildTranslatedOptions(
      'ticket.priority',
      TICKET_PRIORIDADES.map((p) => ({ label: p.value, value: p.value }))
    );
  }

  get tipoOptions() {
    return this.i18n.buildTranslatedOptions(
      'ticket.type',
      TICKET_TIPOS.map((t) => ({ label: t.value, value: t.value }))
    );
  }

  ngOnInit() {
    this.usuarioIdMe = this.auth.getCurrentUser()?.id;
    this.carregarEstatisticas();
    
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.filtros.status = params['status'];
      }
      if (params['prioridade']) {
        this.filtros.prioridade = params['prioridade'];
      }
      if (params['tipo']) {
        this.filtros.tipo = params['tipo'];
      }
      this.buscar();
    });
  }

  carregarEstatisticas() {
    this.ticketService.getEstatisticas(this.usuarioIdMe).subscribe({
      next: (stats) => this.estatisticas = stats,
      error: (err) => console.error('Failed to load statistics:', err)
    });
  }

  buscar() {
    this.loading = true;
    
    this.ticketService.list({
      page: this.currentPage,
      size: this.pageSize,
      sort: 'dataAbertura,desc',
      usuarioId: this.usuarioIdMe,
      ...this.filtros
    }).subscribe({
      next: (result) => {
        this.tickets = result.items;
        this.totalRecords = result.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load tickets:', err);
        this.loading = false;
      }
    });
  }

  filtrarStatus(status: string | null) {
    this.filtros.status = status || undefined;
    this.currentPage = 0;
    this.buscar();
  }

  limparFiltros() {
    this.filtros = {};
    this.currentPage = 0;
    this.buscar();
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.buscar();
  }

  abrirTicket(ticket: Ticket) {
    this.router.navigate(['/suporte/chamados', ticket.id]);
  }

  get pageReportTemplate(): string {
    return this.i18n.translate('suporte.ticketList.pageReport');
  }

  getStatusLabel(status: string): string {
    return this.ticketService.getStatusLabel(status);
  }

  getTipoLabel(tipo: string): string {
    return this.ticketService.getTipoLabel(tipo);
  }

  getPrioridadeLabel(prioridade: string): string {
    return this.ticketService.getPrioridadeLabel(prioridade);
  }
}
