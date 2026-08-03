import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { catchError, filter, forkJoin, of, Subscription } from 'rxjs';
import { HomeDashboardService } from '../core/home-dashboard.service';
import { ConformidadeSgqService, ConformidadePainelItem } from '../core/conformidade-sgq.service';
import { AuthService } from '../auth/auth.service';
import { canonFuncionalidadeCodigo, passesPermissaoRota, PermissaoRota } from '../auth/permissao.util';
import { OSService, OS, OsPainelResumo } from '../core/os.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { LocaleCurrencyService } from '../core/locale/locale-currency.service';
import { BrandStackComponent } from '../shared/brand-stack/brand-stack.component';

interface HomeKpiCard {
  labelKey: string;
  hintKey: string;
  route: string;
  icon: string;
  color: string;
  value: () => number;
}

interface HomeQuickAction {
  labelKey: string;
  descKey: string;
  route: string;
  icon: string;
  color: string;
  perm?: PermissaoRota;
}

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, RouterModule, TranslatePipe, ChartModule, BrandStackComponent],
  template: `
    <div class="home-container">
      <div class="home-content-shell">
      <header class="home-hero">
        <div class="home-hero__cluster">
          <div class="home-hero__mark" [attr.aria-label]="'home.brand.aria' | translate">
            <app-brand-stack surface="dark" size="home-hero" [showWordmark]="false" />
          </div>
          <div class="home-hero__rail" aria-hidden="true"></div>
          <div class="home-hero__body">
            <p class="home-hero__welcome">
              {{ 'home.hero.hello' | translate }}
              <span class="home-hero__welcome-name">{{ welcomeUserName }}</span>
            </p>
            <h1 class="home-hero__title">{{ 'home.pageTitle' | translate }}</h1>
            <p class="home-hero__lead">{{ 'home.hero.lead' | translate }}</p>
          </div>
        </div>
        <p class="home-hero__tagline">{{ 'login.tagline' | translate }}</p>
      </header>

      <section class="home-kpis" [attr.aria-label]="'home.aria.panel' | translate">
        <a
          *ngFor="let card of kpiCards"
          [routerLink]="card.route"
          class="home-kpi"
          [style.--home-kpi-accent]="card.color">
          <div class="home-kpi__icon"><i [class]="card.icon"></i></div>
          <div class="home-kpi__body">
            <span class="home-kpi__value">
              <i *ngIf="loadingMetrics" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
              <ng-container *ngIf="!loadingMetrics">{{ formatCount(card.value()) }}</ng-container>
            </span>
            <span class="home-kpi__label">{{ card.labelKey | translate }}</span>
            <span class="home-kpi__hint">{{ card.hintKey | translate }}</span>
          </div>
        </a>
      </section>

      <section class="home-quick" [attr.aria-label]="'home.aria.quickActions' | translate">
        <div class="home-section-head">
          <h2 class="home-section-title"><i class="pi pi-bolt"></i> {{ 'home.quickActions.title' | translate }}</h2>
          <p class="home-section-sub">{{ 'home.quickActions.subtitle' | translate }}</p>
        </div>
        <div class="home-quick__grid">
          <a
            *ngFor="let action of quickActionsVisible"
            [routerLink]="action.route"
            class="home-quick__card"
            [style.--home-quick-accent]="action.color">
            <span class="home-quick__icon"><i [class]="action.icon"></i></span>
            <span class="home-quick__label">{{ action.labelKey | translate }}</span>
            <span class="home-quick__desc">{{ action.descKey | translate }}</span>
          </a>
        </div>
      </section>

      <section class="home-chart" *ngIf="osChartData">
        <div class="home-section-head">
          <h2 class="home-section-title"><i class="pi pi-chart-bar"></i> {{ 'home.chart.osTitle' | translate }}</h2>
          <p class="home-section-sub">{{ 'home.chart.osSubtitle' | translate }}</p>
        </div>
        <div class="home-chart__canvas" [attr.aria-label]="'home.chart.osTitle' | translate" role="img">
          <p-chart type="bar" [data]="osChartData" [options]="osChartOptions" height="220px"></p-chart>
        </div>
      </section>

      <section class="home-feed">
        <article class="home-panel">
          <header class="home-panel__head">
            <h2 class="home-panel__title">{{ 'home.recentOs.title' | translate }}</h2>
            <a routerLink="/os" class="home-panel__link">{{ 'home.recentOs.viewAll' | translate }}</a>
          </header>
          <div class="home-panel__body">
            <div *ngIf="loadingRecentOs" class="home-panel__loading">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <table *ngIf="!loadingRecentOs && recentOs.length" class="home-table">
              <thead>
                <tr>
                  <th>{{ 'home.recentOs.colOs' | translate }}</th>
                  <th>{{ 'home.recentOs.colClient' | translate }}</th>
                  <th>{{ 'home.recentOs.colOpened' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let os of recentOs">
                  <td><strong>{{ formatOsNumber(os) }}</strong></td>
                  <td>{{ os.clienteNome || '—' }}</td>
                  <td class="home-table__muted">{{ formatDate(os.dtAbertura) }}</td>
                </tr>
              </tbody>
            </table>
            <p *ngIf="!loadingRecentOs && !recentOs.length" class="home-panel__empty">
              {{ 'home.recentOs.empty' | translate }}
            </p>
          </div>
        </article>

        <article class="home-panel">
          <header class="home-panel__head">
            <h2 class="home-panel__title">{{ 'home.alerts.title' | translate }}</h2>
            <a routerLink="/conformidade/painel" class="home-panel__link" *ngIf="userHasConformidadeKpi()">
              {{ 'home.alerts.viewPanel' | translate }}
            </a>
          </header>
          <div class="home-panel__body">
            <div *ngIf="loadingAlerts" class="home-panel__loading">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <ul *ngIf="!loadingAlerts && alertItems.length" class="home-alerts">
              <li *ngFor="let alert of alertItems" class="home-alerts__item" [class.home-alerts__item--high]="alert.severidade === 'ALTA'">
                <span class="home-alerts__dot" aria-hidden="true"></span>
                <div class="home-alerts__copy">
                  <strong>{{ alert.titulo || '—' }}</strong>
                  <span>{{ alert.detalhe || alert.categoria || '' }}</span>
                </div>
              </li>
            </ul>
            <p *ngIf="!loadingAlerts && !alertItems.length" class="home-panel__empty home-panel__empty--ok">
              <i class="pi pi-check-circle"></i> {{ 'home.alerts.none' | translate }}
            </p>
          </div>
        </article>
      </section>
      </div>
    </div>
  `,
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private homeDashboard = inject(HomeDashboardService);
  private conformidadeSgq = inject(ConformidadeSgqService);
  private osService = inject(OSService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private i18n = inject(TranslationService);
  private localeCurrency = inject(LocaleCurrencyService);

  private routerSubscription?: Subscription;

  get welcomeUserName(): string {
    const nome = this.authService.getCurrentUser()?.nome?.trim();
    return nome || this.i18n.translate('home.hero.userFallback');
  }

  readonly kpiCards: HomeKpiCard[] = [
    {
      labelKey: 'home.kpi.catalog',
      hintKey: 'home.kpi.catalogHint',
      route: '/products',
      icon: 'pi pi-box',
      color: '#0ea5e9',
      value: () => this.productsCount,
    },
    {
      labelKey: 'home.kpi.partners',
      hintKey: 'home.kpi.partnersHint',
      route: '/fabricantes',
      icon: 'pi pi-building',
      color: '#10b981',
      value: () => this.fabricantesCount,
    },
    {
      labelKey: 'home.kpi.workshop',
      hintKey: 'home.kpi.workshopHint',
      route: '/os',
      icon: 'pi pi-file-edit',
      color: '#f59e0b',
      value: () => this.osCount,
    },
    {
      labelKey: 'home.kpi.team',
      hintKey: 'home.kpi.teamHint',
      route: '/usuarios',
      icon: 'pi pi-users',
      color: '#8b5cf6',
      value: () => this.usuariosCount,
    },
    {
      labelKey: 'home.kpi.sgq',
      hintKey: 'home.kpi.sgqHint',
      route: '/conformidade/painel',
      icon: 'pi pi-shield',
      color: '#dc2626',
      value: () => this.sgqAlertasCount,
    },
  ];

  readonly quickActionsCatalog: HomeQuickAction[] = [
    {
      labelKey: 'home.quick.newOs',
      descKey: 'home.quick.newOsDesc',
      route: '/os',
      icon: 'pi pi-file-edit',
      color: '#f59e0b',
      perm: { funcionalidadesAny: ['ORDEM_SERVICO'] },
    },
    {
      labelKey: 'home.quick.newProduct',
      descKey: 'home.quick.newProductDesc',
      route: '/products/new',
      icon: 'pi pi-box',
      color: '#0ea5e9',
      perm: { funcionalidadesAll: ['PRODUTOS'] },
    },
    {
      labelKey: 'home.quick.fleet',
      descKey: 'home.quick.fleetDesc',
      route: '/fcu',
      icon: 'pi pi-send',
      color: '#38bdf8',
      perm: { funcionalidadesAll: ['FCU'] },
    },
    {
      labelKey: 'home.quick.proposals',
      descKey: 'home.quick.proposalsDesc',
      route: '/propostas-comerciais',
      icon: 'pi pi-file',
      color: '#8b5cf6',
      perm: { funcionalidadesAny: ['propostas-comerciais'] },
    },
    {
      labelKey: 'home.quick.stockQr',
      descKey: 'home.quick.stockQrDesc',
      route: '/estoque/consulta-qr',
      icon: 'pi pi-qrcode',
      color: '#22c55e',
      perm: { funcionalidadesPrefix: ['ESTOQUE'] },
    },
    {
      labelKey: 'home.quick.library',
      descKey: 'home.quick.libraryDesc',
      route: '/biblioteca',
      icon: 'pi pi-book',
      color: '#64748b',
    },
  ];

  loadingMetrics = true;
  loadingRecentOs = true;
  loadingAlerts = true;

  productsCount = 0;
  fabricantesCount = 0;
  osCount = 0;
  usuariosCount = 0;
  sgqAlertasCount = 0;

  recentOs: OS[] = [];
  alertItems: ConformidadePainelItem[] = [];

  osChartData: Record<string, unknown> | null = null;
  osChartOptions: Record<string, unknown> = {};

  get quickActionsVisible(): HomeQuickAction[] {
    const user = this.authService.getCurrentUser();
    return this.quickActionsCatalog.filter((a) => passesPermissaoRota(user, a.perm));
  }

  ngOnInit(): void {
    this.buildChartOptions();
    this.loadDashboard();
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const e = event as NavigationEnd;
        if (e.url === '/' || e.urlAfterRedirects === '/') {
          this.loadDashboard();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  userHasConformidadeKpi(): boolean {
    const codes = this.authService.getCurrentUser()?.funcionalidadeCodigos ?? [];
    const allowed = new Set(['CONFORMIDADE_PAINEL', 'SGQ_DOCUMENTO_CONTROLADO', 'CONFORMIDADE_NC']);
    return codes.some((c) => allowed.has(canonFuncionalidadeCodigo(c)));
  }

  loadDashboard(): void {
    this.loadMetrics();
    this.loadRecentOs();
    this.loadAlertsAndChart();
  }

  loadMetrics(): void {
    this.loadingMetrics = true;
    this.homeDashboard.loadMetrics({ suppressForbiddenToast: true }).subscribe({
      next: (m) => {
        this.productsCount = m.products ?? 0;
        this.fabricantesCount = m.fabricantes ?? 0;
        this.osCount = m.ordensServico ?? 0;
        this.usuariosCount = m.usuarios ?? 0;
        this.loadingMetrics = false;
        this.cdr.markForCheck();
      },
    });
    if (this.userHasConformidadeKpi()) {
      setTimeout(() => this.loadSgqKpi(), 2_000);
    } else {
      this.sgqAlertasCount = 0;
    }
  }

  private loadSgqKpi(): void {
    this.conformidadeSgq.painel(60).pipe(catchError(() => of(null))).subscribe((p) => {
      if (!p) {
        this.sgqAlertasCount = 0;
      } else {
        this.sgqAlertasCount =
          (p.totalNcAbertas ?? 0) +
          (p.totalAslPendente ?? 0) +
          (p.totalAslVencido ?? 0) +
          (p.totalCalibracaoVencida ?? 0) +
          (p.totalTreinamentosVencidos ?? 0) +
          (p.totalDocumentosVencidos ?? 0);
      }
      this.cdr.markForCheck();
    });
  }

  private loadRecentOs(): void {
    this.loadingRecentOs = true;
    this.osService
      .list({ page: 0, size: 5, sort: 'id,desc' }, { suppressForbiddenToast: true })
      .pipe(catchError(() => of({ items: [] as OS[] })))
      .subscribe((page) => {
        this.recentOs = page.items ?? [];
        this.loadingRecentOs = false;
        this.cdr.markForCheck();
      });
  }

  private loadAlertsAndChart(): void {
    this.loadingAlerts = true;
    const user = this.authService.getCurrentUser();
    const canOs = passesPermissaoRota(user, { funcionalidadesAny: ['ORDEM_SERVICO'] });
    const canSgq = this.userHasConformidadeKpi();

    const osPainel$ = canOs
      ? this.osService.painelResumo().pipe(catchError(() => of(null)))
      : of(null);
    const painel$ = canSgq
      ? this.conformidadeSgq.painel(60).pipe(catchError(() => of(null)))
      : of(null);

    forkJoin({ osPainel: osPainel$, painel: painel$ }).subscribe(({ osPainel, painel }) => {
      if (osPainel) {
        this.applyOsChart(osPainel);
      } else {
        this.osChartData = null;
      }
      if (painel?.itens?.length) {
        this.alertItems = painel.itens.slice(0, 6);
      } else {
        this.alertItems = [];
      }
      this.loadingAlerts = false;
      this.cdr.markForCheck();
      this.applyCanvasA11yLabels();
    });
  }

  private applyOsChart(resumo: OsPainelResumo): void {
    const labels = [
      this.i18n.translate('home.chart.label.waiting'),
      this.i18n.translate('home.chart.label.executing'),
      this.i18n.translate('home.chart.label.parts'),
      this.i18n.translate('home.chart.label.inspection'),
      this.i18n.translate('home.chart.label.aog'),
      this.i18n.translate('home.chart.label.crs'),
    ];
    const values = [
      resumo.aguardando ?? 0,
      resumo.emExecucao ?? 0,
      resumo.aguardandoPecas ?? 0,
      resumo.inspecao ?? 0,
      resumo.prioridadeAog ?? 0,
      resumo.crsPendente ?? 0,
    ];
    this.osChartData = {
      labels,
      datasets: [
        {
          label: this.i18n.translate('home.chart.dataset'),
          data: values,
          backgroundColor: [
            'rgba(56, 189, 248, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(139, 92, 246, 0.85)',
            'rgba(239, 68, 68, 0.9)',
            'rgba(100, 116, 139, 0.85)',
          ],
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
    this.applyCanvasA11yLabels();
  }

  private applyCanvasA11yLabels(): void {
    setTimeout(() => {
      const canvas = document.querySelector('.home-chart__canvas canvas[role="img"]');
      if (!canvas) return;
      const label = this.i18n.translate('home.chart.osTitle');
      canvas.setAttribute('aria-label', label);
      canvas.setAttribute('title', label);
    }, 0);
  }

  private buildChartOptions(): void {
    this.osChartOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: '#94a3b8', precision: 0 },
          grid: { color: 'rgba(148, 163, 184, 0.12)' },
        },
        y: {
          ticks: { color: '#cbd5e1' },
          grid: { display: false },
        },
      },
    };
  }

  formatCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M+`;
    }
    if (count >= 1000) {
      const k = (count / 1000).toFixed(1);
      return `${k.replace(/\.0$/, '')}K+`;
    }
    return count.toString();
  }

  formatOsNumber(os: OS): string {
    const n = os.idOs ?? os.id;
    return n ? `OS ${n}` : '—';
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(this.localeCurrency.getIntlLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
