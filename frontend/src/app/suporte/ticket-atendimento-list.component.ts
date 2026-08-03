import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { MessageService } from 'primeng/api';
import { TranslationService } from '../core/translation.service';
import {
  TicketService,
  Ticket,
  TicketEstatisticasAtendimento,
  TICKET_STATUS,
  TICKET_PRIORIDADES
} from '../core/ticket.service';
import { AuthService, User } from '../auth/auth.service';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListRefreshOverlayComponent } from '../shared/list-refresh-overlay/list-refresh-overlay.component';
import { DisplayTextPipe } from '../core/display-text.pipe';

@Component({
  selector: 'app-ticket-atendimento-list',
  standalone: true,
  styleUrls: ['./suporte-shared.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    ToastModule,
    TooltipModule,
    TagModule,
    BadgeModule,
    TranslatePipe,
    PageHeroComponent,
    ListRefreshOverlayComponent,
    DisplayTextPipe
  ],
  template: `
    <p-toast></p-toast>

    <div class="as-page suporte-page">
      <app-page-hero
        variant="navy"
        kickerKey="suporte.atendimentoList.heroKicker"
        icon="pi-headphones"
        titleKey="suporte.atendimentoList.title"
        subtitleKey="suporte.atendimentoList.subtitle"
        titleIcon="pi-headphones" />

      <div class="suporte-page-content">
      <div class="stats-grid-premium">
        <div class="stat-tile stat-tile--agent" (click)="filtrarPorStatus('')" [class.active]="!filtros.status && viewMode === 'all'">
          <div class="stat-tile-icon stat-tile-icon--open"><i class="pi pi-chart-bar"></i></div>
          <div class="stat-tile-body">
            <div class="stat-tile-value">{{ stats.totalAtivos }}</div>
            <div class="stat-tile-label">{{ 'suporte.atendimentoList.stat.totalActive' | translate }}</div>
          </div>
        </div>
        <div class="stat-tile stat-tile--agent" (click)="filtrarPorStatus('ABERTO')" [class.active]="filtros.status === 'ABERTO'">
          <div class="stat-tile-icon stat-tile-icon--open"><i class="pi pi-inbox"></i></div>
          <div class="stat-tile-body">
            <div class="stat-tile-value">{{ stats.abertos }}</div>
            <div class="stat-tile-label">{{ 'suporte.atendimentoList.stat.waitingService' | translate }}</div>
          </div>
        </div>
        <div class="stat-tile stat-tile--agent" (click)="filtrarView('unassigned')">
          <div class="stat-tile-icon stat-tile-icon--wait"><i class="pi pi-user-plus"></i></div>
          <div class="stat-tile-body">
            <div class="stat-tile-value">{{ stats.semAtendente }}</div>
            <div class="stat-tile-label">{{ 'suporte.atendimentoList.stat.unassigned' | translate }}</div>
          </div>
        </div>
        <div class="stat-tile stat-tile--agent" (click)="filtrarView('mine')">
          <div class="stat-tile-icon stat-tile-icon--mine"><i class="pi pi-user"></i></div>
          <div class="stat-tile-body">
            <div class="stat-tile-value">{{ stats.meusAtendimentos }}</div>
            <div class="stat-tile-label">{{ 'suporte.atendimentoList.stat.myAssigned' | translate }}</div>
          </div>
        </div>
        <div class="stat-tile stat-tile--agent" (click)="filtrarSlaEstourado()">
          <div class="stat-tile-icon stat-tile-icon--sla"><i class="pi pi-exclamation-triangle"></i></div>
          <div class="stat-tile-body">
            <div class="stat-tile-value">{{ stats.slaEstourado }}</div>
            <div class="stat-tile-label">{{ 'suporte.atendimentoList.stat.slaBreached' | translate }}</div>
          </div>
        </div>
        <div class="stat-tile stat-tile--agent">
          <div class="stat-tile-icon stat-tile-icon--ok"><i class="pi pi-check"></i></div>
          <div class="stat-tile-body">
            <div class="stat-tile-value">{{ stats.resolvidos }}</div>
            <div class="stat-tile-label">{{ 'suporte.atendimentoList.stat.resolved' | translate }}</div>
          </div>
        </div>
      </div>

      <h2 class="panel-queue-title">{{ 'suporte.atendimentoList.panelQueue' | translate }}</h2>

      <div class="filters-bar-premium">
        <div class="search-wrap">
          <i class="pi pi-search"></i>
          <input type="text" 
                 pInputText 
                 [(ngModel)]="filtros.busca"
                 [placeholder]="'suporte.atendimentoList.searchPlaceholder' | translate"
                 (input)="buscarComDebounce()">
        </div>
        
        <div class="filter-group">
          <p-dropdown [options]="statusOptions" 
                      [(ngModel)]="filtros.status" 
                      [placeholder]="'suporte.atendimentoList.filter.status' | translate"
                      [showClear]="true"
                      optionLabel="label"
                      optionValue="value"
                      (onChange)="buscar()">
          </p-dropdown>

          <p-dropdown [options]="prioridadeOptions" 
                      [(ngModel)]="filtros.prioridade" 
                      [placeholder]="'suporte.atendimentoList.filter.priority' | translate"
                      [showClear]="true"
                      optionLabel="label"
                      optionValue="value"
                      (onChange)="buscar()">
          </p-dropdown>

          <button pButton type="button" 
                  icon="pi pi-filter-slash" 
                  class="btn-clear"
                  [pTooltip]="'common.list.tooltip.clearFilters' | translate"
                  (click)="limparFiltros()">
          </button>
        </div>
      </div>

      <!-- Tickets List -->
      <div class="loading-state" *ngIf="loading && tickets.length === 0">
        <i class="pi pi-spin pi-spinner"></i>
        <span>{{ 'suporte.atendimentoList.loading' | translate }}</span>
      </div>

      <div class="tickets-list tickets-list-full list-with-refresh" *ngIf="!loading || tickets.length > 0">
        <app-list-refresh-overlay [loading]="loading && tickets.length > 0"></app-list-refresh-overlay>
        <div class="ticket-card-premium" 
             *ngFor="let ticket of tickets" 
             (click)="abrirAtendimento(ticket)"
             [class.sla-warning]="ticket.slaPrimeiraRespostaEstourado || ticket.slaResolucaoEstourado"
             [class.meu-chamado]="ticket.atendenteId === currentUser?.id">
          
          <div class="ticket-status-strip" [class]="'status-' + (ticket.status || '').toLowerCase().replace('_', '-')"></div>
          
          <div class="ticket-card-body">
            <div class="ticket-header">
              <div class="ticket-number">
                <span class="number">{{ ticket.numero }}</span>
                <p-tag *ngIf="ticket.atendenteId === currentUser?.id" 
                       [value]="'suporte.atendimentoList.tag.mine' | translate" 
                       severity="info" 
                       [rounded]="true"
                       [pTooltip]="'suporte.atendimentoList.tooltip.mine' | translate"></p-tag>
              </div>
              <div class="ticket-meta">
                <p-tag [value]="getStatusLabel(ticket.status)" 
                       [severity]="getStatusSeverity(ticket.status)"
                       [rounded]="true"></p-tag>
                <p-tag [value]="getPrioridadeLabel(ticket.prioridade)" 
                       [severity]="getPrioridadeSeverity(ticket.prioridade)"
                       [rounded]="true"></p-tag>
              </div>
            </div>
            
            <h3 class="ticket-title">{{ ticket.titulo | displayText }}</h3>
            
            <div class="ticket-sla-alert" *ngIf="ticket.slaPrimeiraRespostaEstourado || ticket.slaResolucaoEstourado" role="alert">
              <span class="ticket-sla-alert__icon" aria-hidden="true"><i class="pi pi-exclamation-triangle"></i></span>
              <span class="ticket-sla-alert__body">
                <strong>{{ 'suporte.atendimentoList.sla.breached' | translate }}</strong>
                <span class="ticket-sla-alert__detail">
                  {{ (ticket.slaPrimeiraRespostaEstourado ? 'suporte.atendimentoList.sla.firstResponse' : 'suporte.atendimentoList.sla.resolution') | translate }}
                </span>
              </span>
            </div>

            <div class="ticket-info">
              <span class="info-item">
                <i class="pi pi-user"></i>
                {{ ticket.usuarioNome }}
              </span>
              <span class="info-item">
                <i class="pi pi-calendar"></i>
                {{ ticket.dataAbertura | date:'dd/MM/yyyy HH:mm' }}
              </span>
              <span class="info-item" *ngIf="ticket.atendenteNome">
                <i class="pi pi-headphones"></i>
                {{ ticket.atendenteNome }}
              </span>
            </div>
          </div>
        </div>

        <div class="empty-state-premium" *ngIf="tickets.length === 0">
          <div class="empty-icon"><i class="pi pi-check-circle"></i></div>
          <h3>{{ 'suporte.atendimentoList.empty.title' | translate }}</h3>
          <p>{{ (filtros.status || filtros.prioridade || filtros.busca || viewMode !== 'all') ? ('suporte.atendimentoList.empty.filters' | translate) : ('suporte.atendimentoList.empty.clear' | translate) }}</p>
        </div>
      </div>
      </div>
    </div>
  `,
  styles: [`
    .atendimento-list-container {
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
    }

    .page-header {
      margin-bottom: 24px;

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .header-text {
        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 4px 0;
          font-size: 24px;
          font-weight: 600;
          color: #0f172a;

          i {
            color: #0ea5e9;
          }
        }

        p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;

      @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 500px) {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 20px;
        }
      }

      .stat-info {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
        }

        .stat-label {
          font-size: 12px;
          color: #64748b;
        }
      }

      &.abertos .stat-icon {
        background: #e0f2fe;
        i { color: #0284c7; }
      }

      &.em-andamento .stat-icon {
        background: #fef3c7;
        i { color: #d97706; }
      }

      &.aguardando .stat-icon {
        background: #fce7f3;
        i { color: #db2777; }
      }

      &.sla-estourado {
        border-color: #fca5a5;
        background: #fef2f2;

        .stat-icon {
          background: #fee2e2;
          i { color: #dc2626; }
        }
      }
    }

    .filters-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;

      .search-box {
        flex: 1;
        min-width: 250px;
        position: relative;

        i {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        input {
          width: 100%;
          padding-left: 40px;
          height: 42px;
          border-radius: 8px;
        }
      }

      .filter-group {
        display: flex;
        gap: 8px;

        ::ng-deep .p-dropdown {
          min-width: 140px;
        }

        .btn-clear {
          background: white;
          border: 1px solid #e2e8f0;
          color: #64748b;

          &:hover {
            background: #f1f5f9;
          }
        }
      }
    }

    .tickets-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ticket-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
      display: flex;

      &:hover {
        border-color: #0ea5e9;
        box-shadow: 0 2px 8px rgba(14, 165, 233, 0.15);
      }

      &.sla-warning {
        border-color: #fbbf24;
        background: #fffbeb;
      }

      &.meu-chamado {
        border-left: 3px solid #0ea5e9;
      }

      .ticket-status-bar {
        width: 4px;
        flex-shrink: 0;

        &.status-aberto { background: #0ea5e9; }
        &.status-em-analise { background: #f59e0b; }
        &.status-em-andamento { background: #f59e0b; }
        &.status-aguardando-usuario { background: #ec4899; }
        &.status-resolvido { background: #22c55e; }
        &.status-fechado { background: #94a3b8; }
      }

      .ticket-content {
        flex: 1;
        padding: 16px 20px;
      }

      .ticket-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .ticket-number {
          display: flex;
          align-items: center;
          gap: 8px;

          .number {
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 13px;
            color: #64748b;
            background: #f1f5f9;
            padding: 4px 8px;
            border-radius: 4px;
          }
        }

        .ticket-meta {
          display: flex;
          gap: 6px;
        }
      }

      .ticket-title {
        margin: 0 0 12px 0;
        font-size: 15px;
        font-weight: 500;
        color: #0f172a;
        line-height: 1.4;
      }

      .ticket-info {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;

        .info-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;

          i {
            font-size: 12px;
          }
        }
      }

      .ticket-sla {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 12px;
        padding: 8px 12px;
        background: #fef2f2;
        border-radius: 6px;
        font-size: 12px;
        color: #dc2626;

        i {
          font-size: 14px;
        }
      }
    }

    .empty-state, .loading-state {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;

      i {
        font-size: 48px;
        margin-bottom: 16px;
        color: #22c55e;
      }

      h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        color: #334155;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .loading-state {
      i {
        color: #0ea5e9;
      }
    }
  `]
})
export class TicketAtendimentoListComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);

  tickets: Ticket[] = [];
  currentUser: User | null = null;
  loading = true;
  viewMode: 'all' | 'mine' | 'sla' | 'unassigned' = 'all';

  filtros = {
    busca: '',
    status: '',
    prioridade: ''
  };

  stats: TicketEstatisticasAtendimento = {
    totalAtivos: 0,
    abertos: 0,
    emAnalise: 0,
    emAndamento: 0,
    aguardandoUsuario: 0,
    semAtendente: 0,
    slaEstourado: 0,
    meusAtendimentos: 0,
    meusAbertos: 0,
    resolvidos: 0
  };

  get statusOptions() {
    return this.i18n.buildTranslatedOptions(
      'ticket.status',
      TICKET_STATUS.filter((s) => s.value !== 'FECHADO').map((s) => ({ label: s.value, value: s.value }))
    );
  }

  get prioridadeOptions() {
    return this.i18n.buildTranslatedOptions(
      'ticket.priority',
      TICKET_PRIORIDADES.map((p) => ({ label: p.value, value: p.value }))
    );
  }

  private debounceTimer: any;

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.carregarStats();
    });
    this.route.queryParams.subscribe((params) => {
      const view = params['view'];
      if (view === 'mine' || view === 'sla' || view === 'unassigned') {
        this.viewMode = view;
      } else {
        this.viewMode = 'all';
      }
      if (params['status']) {
        this.filtros.status = params['status'];
      }
      this.buscar();
    });
  }

  buscar() {
    this.loading = true;
    const params: Record<string, string | number | undefined> = {
      page: 0,
      size: 80,
      sort: 'prioridade,desc,dataAbertura,asc',
      q: this.filtros.busca || undefined,
      status: this.filtros.status || undefined,
      prioridade: this.filtros.prioridade || undefined
    };
    if (this.viewMode === 'mine' && this.currentUser?.id) {
      params['atendenteId'] = this.currentUser.id;
    }

    this.ticketService.list(params).subscribe({
      next: (result) => {
        let items = result.items.filter(
          (t) => t.status !== 'FECHADO' && t.status !== 'CANCELADO'
        );
        if (this.viewMode === 'sla') {
          items = items.filter(
            (t) =>
              (t.slaPrimeiraRespostaEstourado || t.slaResolucaoEstourado) &&
              t.status !== 'RESOLVIDO'
          );
        }
        if (this.viewMode === 'unassigned') {
          items = items.filter(
            (t) =>
              !t.atendenteId &&
              (t.status === 'ABERTO' || t.status === 'EM_ANALISE')
          );
        }
        this.tickets = items;
        this.loading = false;
      },
      error: (err: Error) => {
        console.error('Failed to search tickets:', err);
        this.loading = false;
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'suporte.ticketAtendimentoList.toast.loadError');
      }
    });
  }

  carregarStats() {
    this.ticketService.getEstatisticasAtendimento(this.currentUser?.id).subscribe({
      next: (s) => (this.stats = s),
      error: () => {}
    });
  }

  filtrarView(view: 'mine' | 'sla' | 'unassigned' | 'all') {
    this.viewMode = view;
    this.filtros.status = '';
    this.router.navigate(['/suporte/atendimento'], {
      queryParams: view === 'all' ? {} : { view }
    });
  }

  buscarComDebounce() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.buscar();
    }, 300);
  }

  limparFiltros() {
    this.filtros = { busca: '', status: '', prioridade: '' };
    this.buscar();
  }

  filtrarPorStatus(status: string) {
    this.viewMode = 'all';
    this.filtros.status = status;
    this.router.navigate(['/suporte/atendimento'], { queryParams: status ? { status } : {} });
    this.buscar();
  }

  filtrarSlaEstourado() {
    this.limparFiltros();
    this.filtrarView('sla');
  }

  getPrioridadeLabel(prioridade: string | undefined): string {
    return this.ticketService.getPrioridadeLabel(prioridade || '');
  }

  abrirAtendimento(ticket: Ticket) {
    this.router.navigate(['/suporte/atendimento', ticket.id]);
  }

  getStatusLabel(status: string | undefined): string {
    return this.ticketService.getStatusLabel(status || '');
  }

  getStatusSeverity(status: string | undefined): string {
    const severities: Record<string, string> = {
      'ABERTO': 'info',
      'EM_ANALISE': 'warning',
      'EM_ANDAMENTO': 'warning',
      'AGUARDANDO_USUARIO': 'danger',
      'RESOLVIDO': 'success',
      'FECHADO': 'secondary'
    };
    return severities[status || ''] || 'info';
  }

  getPrioridadeSeverity(prioridade: string | undefined): string {
    const severities: Record<string, string> = {
      'CRITICA': 'danger',
      'ALTA': 'warning',
      'MEDIA': 'info',
      'BAIXA': 'secondary'
    };
    return severities[prioridade || ''] || 'info';
  }
}
