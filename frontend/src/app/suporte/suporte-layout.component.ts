import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe } from '../core/translate.pipe';
import { RouteLoadingBarComponent } from '../shared/route-loading-bar/route-loading-bar.component';
import { AuthService } from '../auth/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-suporte-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TooltipModule, TranslatePipe, RouteLoadingBarComponent],
  template: `
    <div class="suporte-layout" [class.agent-mode]="agentMode">
      <aside class="suporte-sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="sidebar-header">
          <div class="brand" *ngIf="!sidebarCollapsed">
            <div class="brand-icon">
              <i class="pi" [ngClass]="agentMode ? 'pi-headphones' : 'pi-life-ring'"></i>
            </div>
            <div class="brand-text">
              <h2>{{ (agentMode ? 'suporte.layout.brandAgent' : 'suporte.layout.brandUser') | translate }}</h2>
              <span>{{ (agentMode ? 'suporte.layout.taglineAgent' : 'suporte.layout.taglineUser') | translate }}</span>
            </div>
          </div>
          <div class="brand-collapsed" *ngIf="sidebarCollapsed">
            <i class="pi" [ngClass]="agentMode ? 'pi-headphones' : 'pi-life-ring'"></i>
          </div>
          <button
            pButton
            type="button"
            [icon]="sidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"
            class="p-button-text p-button-rounded collapse-btn"
            [attr.aria-label]="'suporte.layout.toggleSidebar' | translate"
            (click)="toggleSidebar()">
          </button>
        </div>

        <nav class="sidebar-nav">
          <ng-container *ngIf="!agentMode">
            <a
              routerLink="/suporte"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-item"
              [pTooltip]="sidebarCollapsed ? ('suporte.layout.myTickets' | translate) : ''"
              tooltipPosition="right">
              <i class="pi pi-inbox"></i>
              <span *ngIf="!sidebarCollapsed">{{ 'suporte.layout.myTickets' | translate }}</span>
            </a>

            <a
              routerLink="/suporte/novo"
              routerLinkActive="active"
              class="nav-item highlight"
              [pTooltip]="sidebarCollapsed ? ('suporte.layout.newTicketTooltip' | translate) : ''"
              tooltipPosition="right">
              <i class="pi pi-plus-circle"></i>
              <span *ngIf="!sidebarCollapsed">{{ 'suporte.layout.newTicket' | translate }}</span>
            </a>

            <a
              *ngIf="canAtendimento"
              routerLink="/suporte/atendimento"
              class="nav-item agent-link"
              [pTooltip]="sidebarCollapsed ? ('suporte.layout.agentDesk' | translate) : ''"
              tooltipPosition="right">
              <i class="pi pi-headphones"></i>
              <span *ngIf="!sidebarCollapsed">{{ 'suporte.layout.agentDesk' | translate }}</span>
            </a>

            <div class="nav-divider" *ngIf="!sidebarCollapsed">
              <span>{{ 'suporte.layout.filters' | translate }}</span>
            </div>

            <a (click)="navegarComFiltro('ABERTO')" class="nav-item secondary">
              <span class="status-dot aberto"></span>
              <span *ngIf="!sidebarCollapsed">{{ 'suporte.layout.open' | translate }}</span>
            </a>
            <a (click)="navegarComFiltro('EM_ANDAMENTO')" class="nav-item secondary">
              <span class="status-dot andamento"></span>
              <span *ngIf="!sidebarCollapsed">{{ 'suporte.layout.inProgress' | translate }}</span>
            </a>
            <a (click)="navegarComFiltro('AGUARDANDO_USUARIO')" class="nav-item secondary">
              <span class="status-dot aguardando"></span>
              <span *ngIf="!sidebarCollapsed">{{ 'suporte.layout.waitingYou' | translate }}</span>
            </a>
            <a (click)="navegarComFiltro('RESOLVIDO')" class="nav-item secondary">
              <span class="status-dot resolvido"></span>
              <span *ngIf="!sidebarCollapsed">{{ 'suporte.layout.resolved' | translate }}</span>
            </a>
          </ng-container>

          <ng-container *ngIf="agentMode">
            <a
              routerLink="/suporte/atendimento"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-item"
              [pTooltip]="sidebarCollapsed ? ('suporte.layout.agentDesk' | translate) : ''"
              tooltipPosition="right">
              <i class="pi pi-list"></i>
              <span *ngIf="!sidebarCollapsed">{{ 'suporte.layout.agentDesk' | translate }}</span>
            </a>

            <a
              (click)="navegarAtendimentoFiltro('mine')"
              class="nav-item secondary"
              [pTooltip]="sidebarCollapsed ? ('suporte.layout.myAssigned' | translate) : ''"
              tooltipPosition="right">
              <i class="pi pi-user"></i>
              <span *ngIf="!sidebarCollapsed">{{ 'suporte.layout.myAssigned' | translate }}</span>
            </a>

            <a
              (click)="navegarAtendimentoFiltro('sla')"
              class="nav-item secondary danger"
              [pTooltip]="sidebarCollapsed ? ('suporte.atendimentoList.stat.slaBreached' | translate) : ''"
              tooltipPosition="right">
              <i class="pi pi-exclamation-triangle"></i>
              <span *ngIf="!sidebarCollapsed">{{ 'suporte.atendimentoList.stat.slaBreached' | translate }}</span>
            </a>

            <a
              routerLink="/suporte"
              class="nav-item portal-link"
              [pTooltip]="sidebarCollapsed ? ('suporte.layout.backPortal' | translate) : ''"
              tooltipPosition="right">
              <i class="pi pi-inbox"></i>
              <span *ngIf="!sidebarCollapsed">{{ 'suporte.layout.backPortal' | translate }}</span>
            </a>
          </ng-container>
        </nav>

        <div class="sidebar-footer">
          <div class="help-card" *ngIf="!sidebarCollapsed && !agentMode">
            <i class="pi pi-shield"></i>
            <div>
              <strong>{{ 'suporte.layout.trustTitle' | translate }}</strong>
              <p>{{ 'suporte.layout.trustSla' | translate }} · {{ 'suporte.layout.trustTrack' | translate }}</p>
            </div>
          </div>
          <a
            routerLink="/"
            class="nav-item back"
            [pTooltip]="sidebarCollapsed ? ('suporte.layout.back' | translate) : ''"
            tooltipPosition="right">
            <i class="pi pi-arrow-left"></i>
            <span *ngIf="!sidebarCollapsed">{{ 'suporte.layout.back' | translate }}</span>
          </a>
        </div>
      </aside>

      <main class="suporte-main" [class.sidebar-collapsed]="sidebarCollapsed">
        <app-route-loading-bar></app-route-loading-bar>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
    }

    .suporte-layout {
      display: flex;
      width: 100%;
      min-height: 100vh;
      background: #f1f5f9;
    }

      .suporte-sidebar {
        width: 272px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        transition: width 0.3s ease;
        position: fixed;
        height: 100vh;
        z-index: 100;
        border-right: 1px solid #e2e8f0;
        box-shadow: 4px 0 24px rgba(15, 23, 42, 0.06);

        &.collapsed {
          width: 72px;
        }
      }

      .suporte-layout.agent-mode .suporte-sidebar {
        background: linear-gradient(180deg, #0f172a 0%, #1e3a5f 52%, #0c4a6e 100%);
        border-right-color: rgba(255, 255, 255, 0.08);
        box-shadow: 4px 0 32px rgba(15, 23, 42, 0.35);
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1rem;
        border-bottom: 1px solid #f1f5f9;
      }

      .agent-mode .sidebar-header {
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }

      .brand {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        min-width: 0;
      }

      .brand-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        i {
          font-size: 1.2rem;
          color: #0369a1;
        }
      }

      .agent-mode .brand-icon {
        background: linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%);

        i {
          color: #fff;
        }
      }

      .brand-text {
        min-width: 0;

        h2 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }

        .brand-tagline-user,
        span {
          display: block;
          font-size: 0.68rem;
          color: #475569;
          line-height: 1.35;
          margin-top: 2px;
        }
      }

      .agent-mode .brand-text h2 {
        color: #fff;
      }

      .agent-mode .brand-text span,
      .agent-mode .brand-text .brand-tagline-user {
        color: #bae6fd;
      }

      .brand-collapsed {
        width: 100%;
        text-align: center;

        i {
          font-size: 1.35rem;
          color: #0284c7;
        }
      }

      .agent-mode .brand-collapsed i {
        color: #7dd3fc;
      }

      .collapse-btn {
        color: #64748b !important;
      }

      .agent-mode .collapse-btn {
        color: #bae6fd !important;
      }

      .sidebar-nav {
        flex: 1;
        padding: 1rem 0.75rem;
        overflow-y: auto;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.65rem 0.9rem;
        color: #475569;
        text-decoration: none;
        border-radius: 10px;
        margin-bottom: 0.25rem;
        cursor: pointer;
        transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
        font-size: 0.875rem;
        font-weight: 500;

        i {
          font-size: 1rem;
          width: 20px;
          text-align: center;
        }

        &:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        &.active {
          background: #e0f2fe;
          color: #0369a1;
        }

        &.highlight {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.35);

          &:hover {
            filter: brightness(1.05);
            color: #fff;
          }
        }

        &.agent-link {
          border: 1px dashed #7dd3fc;
          color: #0369a1;
        }

        &.secondary {
          font-size: 0.8125rem;
          font-weight: 400;
          padding-left: 1.35rem;

          .status-dot {
            flex: 0 0 20px;
            width: 8px;
            height: 8px;
            margin-left: 6px;
            margin-right: 6px;
          }
        }

        &.danger {
          color: #b91c1c;

          &:hover {
            background: #fef2f2;
          }
        }

        &.portal-link {
          margin-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 0.85rem;
          color: #bae6fd;
        }

        &.back {
          border: 1px solid #e2e8f0;
          margin-top: 0.25rem;
        }
      }

      .agent-mode .nav-item {
        color: #e0f2fe;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        &.active {
          background: rgba(14, 165, 233, 0.35);
          color: #fff;
        }

        &.back {
          border-color: rgba(255, 255, 255, 0.15);
          color: #bae6fd;
        }
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .status-dot.aberto {
        background: #38bdf8;
      }
      .status-dot.andamento {
        background: #fbbf24;
      }
      .status-dot.aguardando {
        background: #fb923c;
      }
      .status-dot.resolvido {
        background: #4ade80;
      }

      .nav-divider {
        display: flex;
        align-items: center;
        margin: 1rem 0 0.5rem;
        padding: 0 0.9rem;

        span {
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      }

      .sidebar-footer {
        padding: 0.75rem;
        border-top: 1px solid #f1f5f9;
      }

      .agent-mode .sidebar-footer {
        border-top-color: rgba(255, 255, 255, 0.1);
      }

      .help-card {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border: 1px solid #bae6fd;
        border-radius: 12px;
        padding: 0.85rem;
        margin-bottom: 0.75rem;
        display: flex;
        gap: 0.6rem;
        align-items: flex-start;

        i {
          color: #0284c7;
          margin-top: 2px;
        }

        strong {
          display: block;
          font-size: 0.75rem;
          color: #0c4a6e;
        }

        p {
          margin: 0.2rem 0 0;
          font-size: 0.7rem;
          color: #0c4a6e;
          line-height: 1.4;
        }
      }

      .suporte-main {
        position: relative;
        flex: 1;
        margin-left: 272px;
        min-height: 100vh;
        width: calc(100% - 272px);
        max-width: none;
        transition: margin-left 0.3s ease, width 0.3s ease;
        display: flex;
        flex-direction: column;
        overflow-x: hidden;
        box-sizing: border-box;
      }

      .suporte-main.sidebar-collapsed {
        margin-left: 72px;
        width: calc(100% - 72px);
      }

      .suporte-main ::ng-deep router-outlet + * {
        display: flex;
        flex-direction: column;
        flex: 1;
        width: 100%;
        min-width: 0;
        min-height: 100%;
      }

      .suporte-sidebar.collapsed .brand,
      .suporte-sidebar.collapsed .nav-divider span,
      .suporte-sidebar.collapsed .help-card,
      .suporte-sidebar.collapsed .nav-item span:not(.status-dot) {
        display: none;
      }

      @media (max-width: 768px) {
        .suporte-sidebar {
          width: 72px;
        }
        .suporte-main {
          margin-left: 72px;
        }
      }
    `
  ]
})
export class SuporteLayoutComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  sidebarCollapsed = false;
  agentMode = false;
  canAtendimento = false;

  constructor() {
    this.syncMode(this.router.url);
    this.canAtendimento = this.hasAtendimentoAccess();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.syncMode(this.router.url);
      this.canAtendimento = this.hasAtendimentoAccess();
    });
  }

  private syncMode(url: string) {
    this.agentMode = url.includes('/suporte/atendimento');
  }

  private hasAtendimentoAccess(): boolean {
    const user = this.auth.getCurrentUser();
    const codes = user?.funcionalidadeCodigos ?? [];
    return codes.some((c) => c === 'suporte-atendimento' || c === 'suporte' || c === 'GERENCIAR_PERMISSOES');
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  navegarComFiltro(status: string) {
    this.router.navigate(['/suporte'], { queryParams: { status } });
  }

  navegarAtendimentoFiltro(view: string) {
    this.router.navigate(['/suporte/atendimento'], { queryParams: { view } });
  }
}
