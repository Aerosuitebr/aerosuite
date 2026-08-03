import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartModule, UIChart } from 'primeng/chart';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { PlatformControlService, PlatformTelemetry } from './platform-control.service';
import { PlatformOpsAuthService } from './platform-ops-auth.service';

@Component({
  selector: 'app-platform-ops-console',
  standalone: true,
  imports: [CommonModule, RouterLink, ChartModule, TranslatePipe],
  templateUrl: './platform-ops-console.component.html',
  styleUrls: ['./platform-ops-console.component.scss']
})
export class PlatformOpsConsoleComponent implements OnInit, AfterViewInit {
  private control = inject(PlatformControlService);
  private i18n = inject(TranslationService);
  private opsAuth = inject(PlatformOpsAuthService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  @ViewChild('revenueChart') revenueChart?: UIChart;
  @ViewChild('infraChart') infraChart?: UIChart;

  loading = true;
  chartsReady = false;
  telemetry: PlatformTelemetry | null = null;
  revenueChartData: Record<string, unknown> | null = null;
  infraChartData: Record<string, unknown> | null = null;
  revenueChartOptions: Record<string, unknown> | null = null;
  infraChartOptions: Record<string, unknown> | null = null;

  private chartsNeedRefresh = false;
  private viewInitialized = false;

  ngOnInit(): void {
    this.opsAuth.sessionElevated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());

    this.reload();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.refreshChartsIfReady();
  }

  reload(): void {
    this.loading = true;
    this.chartsReady = false;
    this.revenueChartData = null;
    this.infraChartData = null;
    this.control.getTelemetry().subscribe({
      next: res => {
        this.telemetry = res;
        this.buildCharts(res);
        this.loading = false;
      },
      error: () => {
        this.telemetry = null;
        this.loading = false;
        this.chartsReady = false;
      }
    });
  }

  formatMrr(value: number): string {
    return new Intl.NumberFormat(this.i18n.getCurrentLanguage(), {
      style: 'currency',
      currency: this.telemetry?.mrrCurrency ?? 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  }

  formatStorage(bytes: number): string {
    if (bytes >= 1_073_741_824) {
      return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
    }
    if (bytes >= 1_048_576) {
      return `${(bytes / 1_048_576).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${bytes} B`;
  }

  clusterUsageLabel(): string {
    if (!this.telemetry) {
      return '—';
    }
    return `${this.telemetry.cpuUsagePercent.toFixed(1)}% / ${this.telemetry.memoryUsagePercent.toFixed(1)}%`;
  }

  private buildCharts(data: PlatformTelemetry): void {
    const tooltip = this.opsChartTooltip();
    const labels = data.revenueSeries.map(p => p.label);
    this.revenueChartData = {
      labels,
      datasets: [
        {
          label: this.i18n.translate('platformOps.telemetry.chart.revenue'),
          data: data.revenueSeries.map(p => p.value),
          fill: true,
          tension: 0.35,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.18)',
          pointBackgroundColor: '#0284c7',
          pointBorderColor: '#f8fafc',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
    this.revenueChartOptions = {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip },
      scales: this.opsChartScales()
    };

    const infraLabels = data.infraSeries.map(p => p.label);
    this.infraChartData = {
      labels: infraLabels,
      datasets: [
        {
          label: this.i18n.translate('platformOps.telemetry.chart.rpm'),
          data: data.infraSeries.map(p => p.rpm),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: this.i18n.translate('platformOps.telemetry.chart.webhooks'),
          data: data.infraSeries.map(p => p.webhookSuccessRate),
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    };
    this.infraChartOptions = {
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8' } }, tooltip },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51, 65, 85, 0.45)' } },
        y: {
          position: 'left',
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(51, 65, 85, 0.35)' }
        },
        y1: {
          position: 'right',
          min: 90,
          max: 100,
          ticks: { color: '#94a3b8', callback: (v: number) => `${v}%` },
          grid: { drawOnChartArea: false }
        }
      }
    };

    this.scheduleChartsMount();
  }

  private scheduleChartsMount(): void {
    this.chartsReady = false;
    this.chartsNeedRefresh = true;
    this.cdr.detectChanges();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.chartsReady = true;
        this.cdr.detectChanges();
        this.refreshChartsIfReady();
      });
    });
  }

  private refreshChartsIfReady(): void {
    if (!this.viewInitialized || !this.chartsReady || !this.chartsNeedRefresh) {
      return;
    }
    setTimeout(() => {
      this.revenueChart?.refresh();
      this.infraChart?.refresh();
      this.chartsNeedRefresh = false;
    }, 0);
  }

  private opsChartTooltip() {
    return {
      backgroundColor: '#0f172a',
      titleColor: '#f8fafc',
      bodyColor: '#f8fafc',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 10,
      displayColors: true
    };
  }

  private opsChartScales() {
    return {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51, 65, 85, 0.45)' } },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(51, 65, 85, 0.35)' }
      }
    };
  }
}
