import { Component, OnInit, OnDestroy, inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { toastKey } from '../core/toast-i18n.util';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { DEFAULT_LIST_PAGE_SIZE } from '../core/list-pagination.constants';
import { TooltipModule } from 'primeng/tooltip';
import { RelatorioAnalyticsService, RelatorioResumo } from '../core/relatorio-analytics.service';

interface Relatorio {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
  icone: string;
  cor: string;
}

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule,
    ButtonModule,
    CardModule,
    ChartModule,
    TableModule,
    DropdownModule,
    CalendarModule,
    InputTextModule,
    FormsModule,
    ToastModule,
    DialogModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent,
    TooltipModule
  ],
  template: `
    <p-toast></p-toast>

    <div class="as-page relatorios-container">
      <app-page-hero
        variant="navy"
        titleKey="reports.title"
        subtitleKey="reports.subtitle"
        titleIcon="pi-chart-bar"
        [hasActions]="true">
        <button
          actions
          pButton
          type="button"
          [label]="'reports.btn.generate' | translate"
          icon="pi pi-download"
          class="p-button-primary"
          (click)="gerarRelatorio()"
          [disabled]="loading || !resumo">
        </button>
      </app-page-hero>

      <div class="filters-section">
        <div class="filter-card">
          <h3>{{ 'reports.filters' | translate }}</h3>
          <div class="filter-row">
            <div class="filter-item">
              <label for="tipoRelatorio">{{ 'reports.filter.type' | translate }}</label>
              <p-dropdown
                id="tipoRelatorio"
                [options]="tiposRelatorio"
                [(ngModel)]="filtros.tipoRelatorio"
                [placeholder]="'reports.filter.selectType' | translate"
                optionLabel="label"
                optionValue="value">
              </p-dropdown>
            </div>
            <div class="filter-item">
              <label for="dataInicio">{{ 'reports.filter.startDate' | translate }}</label>
              <p-calendar
                id="dataInicio"
                [(ngModel)]="filtros.dataInicio"
                [placeholder]="'reports.filter.selectDate' | translate"
                dateFormat="dd/mm/yy">
              </p-calendar>
            </div>
            <div class="filter-item">
              <label for="dataFim">{{ 'reports.filter.endDate' | translate }}</label>
              <p-calendar
                id="dataFim"
                [(ngModel)]="filtros.dataFim"
                [placeholder]="'reports.filter.selectDate' | translate"
                dateFormat="dd/mm/yy">
              </p-calendar>
            </div>
            <div class="filter-item">
              <button
                pButton
                type="button"
                [label]="'reports.filter.apply' | translate"
                icon="pi pi-filter"
                class="p-button-outlined"
                (click)="aplicarFiltros()">
              </button>
            </div>
          </div>
        </div>
      </div>

      <app-list-data-states
        [loading]="loading"
        [itemCount]="relatorios.length"
        [skeletonRows]="4"
        [skeletonCols]="4"
        emptyIcon="pi-chart-bar"
        emptyTitleKey="ui.empty.title"
        emptyDescriptionKey="ui.empty.description">
        <div class="relatorios-grid" *ngIf="relatorios.length > 0">
          <div class="relatorio-card" *ngFor="let relatorio of relatorios" (click)="selecionarRelatorio(relatorio)">
            <div class="card-header">
              <div class="card-icon" [style.background-color]="relatorio.cor">
                <i [class]="relatorio.icone"></i>
              </div>
              <div class="card-title">
                <h3>{{ relatorio.nome }}</h3>
                <p>{{ relatorio.descricao }}</p>
              </div>
            </div>
            <div class="card-actions">
              <button
                pButton
                type="button"
                icon="pi pi-eye"
                class="p-button-text p-button-sm"
                [pTooltip]="'reports.tooltip.view' | translate"
                [attr.aria-label]="'reports.tooltip.view' | translate"
                (click)="visualizarRelatorio(relatorio, $event)">
              </button>
              <button
                pButton
                type="button"
                icon="pi pi-download"
                class="p-button-text p-button-sm"
                [pTooltip]="'reports.export' | translate"
                [attr.aria-label]="'reports.export' | translate"
                (click)="exportarRelatorio(relatorio, $event)">
              </button>
            </div>
          </div>
        </div>
      </app-list-data-states>

      <div class="charts-section" #chartsSection *ngIf="chartFabricante || chartOs">
        <div class="chart-card">
          <h3>{{ 'reports.chart.byManufacturer' | translate }}</h3>
          <p *ngIf="!hasFabricanteData" class="chart-empty">{{ 'reports.chart.empty' | translate }}</p>
          <div *ngIf="chartFabricante" class="chart-wrap" [attr.aria-label]="'reports.chart.byManufacturer' | translate" role="img">
            <p-chart type="doughnut" [data]="chartFabricante" [options]="doughnutOptions"></p-chart>
          </div>
        </div>
        <div class="chart-card">
          <h3>{{ 'reports.chart.osByMonth' | translate }}</h3>
          <p *ngIf="!hasOsData" class="chart-empty">{{ chartEmptyMessage }}</p>
          <div *ngIf="chartOs" class="chart-wrap" [attr.aria-label]="'reports.chart.osByMonth' | translate" role="img">
            <p-chart type="bar" [data]="chartOs" [options]="barOptions"></p-chart>
          </div>
        </div>
      </div>

      <div class="table-section" *ngIf="dadosTabela.length > 0">
        <div class="table-card">
          <h3>{{ 'reports.table.detail' | translate }}</h3>
          <p-table appListScroll [value]="dadosTabela" [paginator]="true" [rows]="listPageSize" styleClass="modern-table">
            <ng-template pTemplate="header">
              <tr>
                <th>{{ 'reports.table.id' | translate }}</th>
                <th>{{ 'reports.table.name' | translate }}</th>
                <th>{{ 'reports.table.manufacturer' | translate }}</th>
                <th>{{ 'reports.table.status' | translate }}</th>
                <th>{{ 'reports.table.date' | translate }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td>{{ item.id }}</td>
                <td class="cell-truncate" [pTooltip]="item.nome" tooltipPosition="top">{{ item.nome }}</td>
                <td>{{ item.fabricante }}</td>
                <td>
                  <span class="status-badge" [class]="'status-' + (item.status || '').toLowerCase()">
                    {{ item.status }}
                  </span>
                </td>
                <td>{{ item.data }}</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>

    <p-dialog
      [(visible)]="viewDialogVisible"
      [header]="viewDialogTitle"
      [modal]="true"
      [style]="{ width: 'min(720px, 96vw)' }"
      styleClass="as-hero-dialog">
      <p *ngIf="viewDialogIntro">{{ viewDialogIntro }}</p>
      <ul class="view-stats" *ngIf="viewDialogStats.length">
        <li *ngFor="let stat of viewDialogStats">
          {{ stat.labelKey | translate }}: <strong>{{ stat.value }}</strong>
        </li>
      </ul>
      <div class="dialog-actions">
        <button pButton type="button" class="p-button-text" [label]="'common.actions.close' | translate" (click)="viewDialogVisible = false"></button>
      </div>
    </p-dialog>
  `,
  styleUrls: ['./relatorios.component.scss']
})
export class RelatoriosComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;

  @ViewChild('chartsSection') chartsSection?: ElementRef<HTMLElement>;

  private i18n = inject(TranslationService);
  private analytics = inject(RelatorioAnalyticsService);
  private destroy$ = new Subject<void>();

  relatorios: Relatorio[] = [];
  loading = true;
  resumo: RelatorioResumo | null = null;
  chartFabricante: { labels: string[]; datasets: unknown[] } | null = null;
  chartOs: { labels: string[]; datasets: unknown[] } | null = null;
  dadosTabela: RelatorioResumo['produtos'] = [];
  doughnutOptions: Record<string, unknown> = {};
  barOptions: Record<string, unknown> = {};
  viewDialogVisible = false;
  viewDialogTitle = '';
  viewDialogIntro = '';
  viewDialogStats: { labelKey: string; value: number }[] = [];

  get chartEmptyMessage(): string {
    const chunks: string[] = [];
    const tipo = this.filtros.tipoRelatorio;
    if (tipo) {
      const found = this.tiposRelatorio.find(t => t.value === tipo);
      chunks.push(found?.label ?? tipo);
    }
    if (this.filtros.dataInicio) {
      chunks.push(this.i18n.translate('reports.chart.filterFrom', { data: this.formatFilterDate(this.filtros.dataInicio) }));
    }
    if (this.filtros.dataFim) {
      chunks.push(this.i18n.translate('reports.chart.filterTo', { data: this.formatFilterDate(this.filtros.dataFim) }));
    }
    if (!chunks.length) {
      return this.i18n.translate('reports.chart.empty');
    }
    return this.i18n.translate('reports.chart.emptyFor', { filtros: chunks.join(' · ') });
  }

  get hasFabricanteData(): boolean {
    return (this.resumo?.produtosPorFabricante?.some(s => s.value > 0 && s.label !== '—')) ?? false;
  }

  get hasOsData(): boolean {
    return (this.resumo?.osPorMes?.some(s => s.value > 0 && s.label !== '—')) ?? false;
  }

  get tiposRelatorio() {
    return [
      { label: this.i18n.translate('reports.type.products'), value: 'produtos' },
      { label: this.i18n.translate('reports.type.os'), value: 'os' },
      { label: this.i18n.translate('reports.type.manufacturers'), value: 'fabricantes' },
      { label: this.i18n.translate('reports.type.fcu'), value: 'fcu' }
    ];
  }

  filtros = {
    tipoRelatorio: null as string | null,
    dataInicio: null as Date | null,
    dataFim: null as Date | null
  };

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.configurarGraficos();
    this.carregarRelatorios();
    this.carregarDados();
    this.i18n.getCurrentLanguage$().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.carregarRelatorios();
    });
  }

  ngAfterViewInit(): void {
    this.applyCanvasA11yLabels();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarRelatorios() {
    this.relatorios = [
      {
        id: 1,
        nome: this.i18n.translate('reports.card.products'),
        descricao: this.i18n.translate('reports.card.productsDesc'),
        tipo: 'produtos',
        icone: 'pi pi-box',
        cor: '#10b981'
      },
      {
        id: 2,
        nome: this.i18n.translate('reports.card.os'),
        descricao: this.i18n.translate('reports.card.osDesc'),
        tipo: 'os',
        icone: 'pi pi-file-edit',
        cor: '#06b6d4'
      },
      {
        id: 3,
        nome: this.i18n.translate('reports.card.manufacturers'),
        descricao: this.i18n.translate('reports.card.manufacturersDesc'),
        tipo: 'fabricantes',
        icone: 'pi pi-building',
        cor: '#f59e0b'
      },
      {
        id: 4,
        nome: this.i18n.translate('reports.card.fcu'),
        descricao: this.i18n.translate('reports.card.fcuDesc'),
        tipo: 'fcu',
        icone: 'pi pi-microchip',
        cor: '#ec4899'
      }
    ];
  }

  carregarDados() {
    this.loading = true;
    const query = {
      tipo: this.filtros.tipoRelatorio,
      dataInicio: this.filtros.dataInicio ? this.formatFilterDate(this.filtros.dataInicio) : null,
      dataFim: this.filtros.dataFim ? this.formatFilterDate(this.filtros.dataFim) : null
    };
    this.analytics.resumo(query).subscribe({
      next: res => {
        this.resumo = res;
        this.dadosTabela = res.produtos ?? [];
        this.chartFabricante = this.buildChart(res.produtosPorFabricante, '#10b981');
        this.chartOs = this.buildBarChart(res.osPorMes);
        this.loading = false;
        this.applyCanvasA11yLabels();
      },
      error: () => {
        this.loading = false;
        this.chartFabricante = null;
        this.chartOs = null;
        this.dadosTabela = [];
      }
    });
  }

  private buildChart(slices: { label: string; value: number }[] | undefined, color: string) {
    const items = (slices ?? []).filter(s => s.label !== '—' || s.value > 0);
    if (!items.length) {
      return null;
    }
    const palette = ['#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#64748b'];
    return {
      labels: items.map(s => s.label),
      datasets: [{
        data: items.map(s => s.value),
        backgroundColor: items.map((_, i) => palette[i % palette.length] ?? color)
      }]
    };
  }

  private buildBarChart(slices: { label: string; value: number }[] | undefined) {
    const items = (slices ?? []).filter(s => s.label !== '—' || s.value > 0);
    if (!items.length) {
      return null;
    }
    return {
      labels: items.map(s => s.label),
      datasets: [{
        label: this.i18n.translate('reports.chart.osCountLabel'),
        data: items.map(s => s.value),
        backgroundColor: '#06b6d4'
      }]
    };
  }

  configurarGraficos() {
    this.doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    };
    this.barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'bottom' } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          title: { display: true, text: this.i18n.translate('reports.chart.osCountLabel') }
        }
      }
    };
  }

  selecionarRelatorio(relatorio: Relatorio) {
    this.visualizarRelatorio(relatorio, new Event('click'));
  }

  visualizarRelatorio(relatorio: Relatorio, event: Event) {
    event.stopPropagation();
    this.viewDialogTitle = relatorio.nome;
    this.viewDialogIntro = relatorio.descricao;
    this.viewDialogStats = this.buildViewStats(relatorio.tipo);
    this.viewDialogVisible = true;
  }

  private buildViewStats(tipo: string): { labelKey: string; value: number }[] {
    if (!this.resumo) {
      return [];
    }
    switch (tipo) {
      case 'os':
        return [{ labelKey: 'reports.view.os', value: this.resumo.totalOs }];
      case 'fabricantes':
        return [{ labelKey: 'reports.view.manufacturers', value: this.resumo.totalFabricantes }];
      case 'fcu':
        return [{ labelKey: 'reports.view.fcu', value: this.resumo.totalFcu ?? 0 }];
      case 'produtos':
      default: {
        const ativos = this.dadosTabela.filter(r => /ativo/i.test(r.status)).length;
        const inativos = this.dadosTabela.filter(r => /inativ/i.test(r.status)).length;
        const fabricantesDistintos = new Set(
          this.dadosTabela.map(r => (r.fabricante || '').trim()).filter(Boolean)
        ).size;
        return [
          { labelKey: 'reports.view.products', value: this.resumo.totalProdutos },
          { labelKey: 'reports.view.productsActive', value: ativos },
          { labelKey: 'reports.view.productsInactive', value: inativos },
          { labelKey: 'reports.view.manufacturersDistinct', value: fabricantesDistintos },
        ];
      }
    }
  }

  private formatFilterDate(value: Date): string {
    const d = value.getDate().toString().padStart(2, '0');
    const m = (value.getMonth() + 1).toString().padStart(2, '0');
    const y = value.getFullYear();
    return `${d}/${m}/${y}`;
  }

  exportarRelatorio(relatorio: Relatorio, event: Event) {
    event.stopPropagation();
    if (!this.dadosTabela.length) {
      toastKey(this.messageService, this.i18n, 'warn', 'reports.toast.exportSummary', 'reports.toast.exportEmpty');
      return;
    }
    const header = [
      this.i18n.translate('reports.csv.col.id'),
      this.i18n.translate('reports.csv.col.name'),
      this.i18n.translate('reports.csv.col.manufacturer'),
      this.i18n.translate('reports.csv.col.status'),
      this.i18n.translate('reports.csv.col.createdAt'),
    ].join(';');
    const rows = this.dadosTabela.map(r =>
      [r.id, r.nome, r.fabricante, r.status, r.data].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')
    );
    const blob = new Blob(['\uFEFF' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${relatorio.tipo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastKey(this.messageService, this.i18n, 'success', 'reports.toast.exportSummary', 'reports.toast.exportDetail', { name: relatorio.nome });
  }

  aplicarFiltros() {
    this.carregarDados();
    toastKey(this.messageService, this.i18n, 'info', 'reports.toast.filtersSummary', 'reports.toast.filtersDetail');
  }

  gerarRelatorio() {
    this.exportarRelatorio(this.relatorios[0], new Event('click'));
  }

  private applyCanvasA11yLabels(): void {
    setTimeout(() => {
      const chartCards = document.querySelectorAll('.charts-section .chart-card');
      chartCards.forEach((card, index) => {
        const canvas = card.querySelector('canvas[role="img"]');
        if (!canvas) return;
        const key = index === 0 ? 'reports.chart.byManufacturer' : 'reports.chart.osByMonth';
        const label = this.i18n.translate(key);
        canvas.setAttribute('aria-label', label);
        canvas.setAttribute('title', label);
      });
    }, 0);
  }
}
