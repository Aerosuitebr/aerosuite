import { Component, OnDestroy, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';

import { TagModule } from 'primeng/tag';

import { CardModule } from 'primeng/card';

import { CheckboxModule } from 'primeng/checkbox';

import { InputNumberModule } from 'primeng/inputnumber';

import { DropdownModule } from 'primeng/dropdown';

import { ChartModule } from 'primeng/chart';

import { TooltipModule } from 'primeng/tooltip';

import { ToastModule } from 'primeng/toast';

import { MessageService } from 'primeng/api';

import { Router, RouterModule } from '@angular/router';

import { Subscription } from 'rxjs';

import {

  ConformidadeEnforcementConfig,

  ConformidadePainel,

  ConformidadePainelItem,

  ConformidadeSmsIndicadores,

  ConformidadeSgqService

} from '../../core/conformidade-sgq.service';

import { TranslatePipe } from '../../core/translate.pipe';

import { TranslationService } from '../../core/translation.service';

import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';

import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';



type StatHighlight = 'none' | 'warn' | 'danger';



interface PainelStatCard {

  id: string;

  route: string;

  filterCategoria?: string;

  primary: number;

  primaryLabelKey: string;

  secondary?: number;

  secondaryLabelKey?: string;

  highlight: StatHighlight;

}



interface FilterOption {

  label: string;

  value: string;

}



@Component({

  selector: 'app-conformidade-painel',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    ButtonModule,

    TagModule,

    CardModule,

    CheckboxModule,

    InputNumberModule,

    DropdownModule,

    ChartModule,

    TooltipModule,

    ToastModule,

    RouterModule,

    TranslatePipe,

    PageHeroComponent,

    ListDataStatesComponent

  ],

  providers: [MessageService],

  template: `

    <div class="as-page page conformidade-module">

      <app-page-hero

        variant="navy"

        titleKey="conformidade.painel.title"

        subtitleKey="conformidade.painel.subtitle"

        titleIcon="pi-chart-bar"

        [hasActions]="true">

        <div actions class="painel-actions">

          <label class="dias-label" for="conformidade-painel-dias-janela">{{ 'conformidade.painel.diasJanela' | translate }}</label>

          <p-inputNumber

            inputId="conformidade-painel-dias-janela"

            [(ngModel)]="diasJanela"

            [min]="1"

            [max]="365"

            [useGrouping]="false"

            (onBlur)="carregar()"></p-inputNumber>

          <button pButton icon="pi pi-refresh" [label]="'common.actions.refresh' | translate" (click)="carregar()" [loading]="loading"></button>

          <button pButton icon="pi pi-download" class="p-button-outlined"

                  [label]="'conformidade.painel.relatorio.btn' | translate"

                  (click)="exportarRelatorio()" [loading]="loadingRelatorio"></button>

        </div>

      </app-page-hero>



      <div class="painel-grid" *ngIf="sms || painel">

        <div class="painel-main" *ngIf="sms">

          <p-card class="sms-card">

            <h3>{{ 'conformidade.painel.sms.title' | translate }}</h3>

            <p class="hint">{{ 'conformidade.painel.sms.subtitle' | translate }}</p>

            <div class="sms-kpis">

              <div class="sms-kpi">

                <span class="n" [class.risco-alto]="sms.scoreRisco >= 60" [class.risco-medio]="sms.scoreRisco >= 30 && sms.scoreRisco < 60">{{ sms.scoreRisco }}</span>

                <span class="sms-kpi-label">{{ 'conformidade.painel.sms.scoreRisco' | translate }}</span>

              </div>

              <div class="sms-kpi">

                <span class="n">{{ sms.taxaFechamentoPercent }}%</span>

                <span class="sms-kpi-label">{{ 'conformidade.painel.sms.taxaFechamento' | translate }}</span>

              </div>

              <div class="sms-kpi">

                <span class="n">{{ sms.ncMediaDiasAbertas }}</span>

                <span class="sms-kpi-label">{{ 'conformidade.painel.sms.mediaDias' | translate }}</span>

              </div>

              <div class="sms-kpi">

                <span class="n" [class.risco-alto]="sms.ncCriticasSemAcao > 0">{{ sms.ncCriticasSemAcao }}</span>

                <span class="sms-kpi-label">{{ 'conformidade.painel.sms.criticasSemAcao' | translate }}</span>

              </div>

              <div class="sms-kpi">

                <span class="n">{{ sms.ncFechadasPeriodo }}</span>

                <span class="sms-kpi-label">{{ 'conformidade.painel.sms.fechadasPeriodo' | translate }}</span>

              </div>

              <div class="sms-kpi">

                <span class="n">{{ sms.ncAbertasPeriodo }}</span>

                <span class="sms-kpi-label">{{ 'conformidade.painel.sms.abertasPeriodo' | translate }}</span>

              </div>

            </div>

            <div class="sms-breakdown">

              <div>

                <h4>{{ 'conformidade.painel.sms.porSeveridade' | translate }}</h4>

                <div class="chip-row">

                  <p-tag *ngFor="let e of smsMapEntries(sms.porSeveridade)" [value]="smsChipLabel(e.key, 'severidade') + ': ' + e.value" [severity]="sevTag(e.key)"></p-tag>

                </div>

              </div>

              <div>

                <h4>{{ 'conformidade.painel.sms.porCapa' | translate }}</h4>

                <div class="chip-row">

                  <p-tag *ngFor="let e of smsMapEntries(sms.porCapaFase)" [value]="smsChipLabel(e.key, 'capa') + ': ' + e.value" severity="info"></p-tag>

                </div>

              </div>

            </div>

            <div class="tendencia-section">

              <h4>{{ 'conformidade.painel.sms.tendencia' | translate }}</h4>

              <div class="tendencia-chart" *ngIf="tendenciaChartData">

                <p-chart type="line" [data]="tendenciaChartData" [options]="tendenciaChartOptions" height="260px"></p-chart>

              </div>

            </div>

          </p-card>

        </div>



        <aside class="painel-stats" *ngIf="painel">

          <p-card

            *ngFor="let card of statCards"

            class="stat-card"

            [class.stat-card--warn]="card.highlight === 'warn'"

            [class.stat-card--danger]="card.highlight === 'danger'"

            [class.stat-card--active]="filtroCardAtivo === card.id"

            (click)="onStatCardClick(card)"

            [attr.aria-label]="statCardAriaLabel(card)">

            <a

              [routerLink]="card.route"

              class="stat-card__module-link"

              (click)="$event.stopPropagation()"

              [attr.aria-label]="'conformidade.painel.card.openModule' | translate"

              [pTooltip]="'conformidade.painel.card.openModule' | translate"

              tooltipPosition="left">

              <i class="pi pi-arrow-right" aria-hidden="true"></i>

            </a>

            <div class="stat">

              <span class="n">{{ card.primary }}</span>

              <span class="stat-label">{{ card.primaryLabelKey | translate }}</span>

            </div>

            <div class="stat sub" *ngIf="card.secondaryLabelKey != null">

              <span class="n sub-n">{{ card.secondary }}</span>

              <span class="stat-label">{{ card.secondaryLabelKey | translate }}</span>

            </div>

          </p-card>

        </aside>

      </div>



      <p-card class="alerts-card" *ngIf="painel" id="painel-alerts">

        <div class="alerts-header">

          <div class="alerts-title-row">

            <h3>{{ 'conformidade.painel.alerts.title' | translate }}</h3>

            <span class="alerts-count" *ngIf="(painel.itens?.length ?? 0) > 0">

              {{ 'conformidade.painel.filter.count' | translate:{ shown: filteredItens.length, total: painel.itens.length } }}

            </span>

          </div>

          <div class="alerts-filters" *ngIf="(painel.itens?.length ?? 0) > 0">

            <div class="filter-field">

              <label for="painel-filtro-categoria">{{ 'conformidade.painel.filter.categoria' | translate }}</label>

              <p-dropdown

                inputId="painel-filtro-categoria"

                [(ngModel)]="filtroCategoria"

                (ngModelChange)="onFiltroManualChange()"

                [options]="categoriaFilterOptions"

                optionLabel="label"

                optionValue="value"

                styleClass="filter-dropdown"></p-dropdown>

            </div>

            <div class="filter-field">

              <label for="painel-filtro-severidade">{{ 'conformidade.painel.filter.severidade' | translate }}</label>

              <p-dropdown

                inputId="painel-filtro-severidade"

                [(ngModel)]="filtroSeveridade"

                (ngModelChange)="onFiltroManualChange()"

                [options]="severidadeFilterOptions"

                optionLabel="label"

                optionValue="value"

                styleClass="filter-dropdown"></p-dropdown>

            </div>

            <button

              *ngIf="hasActiveFilters"

              pButton

              type="button"

              class="p-button-text p-button-sm filter-clear-btn"

              icon="pi pi-filter-slash"

              [label]="'conformidade.painel.filter.clear' | translate"

              (click)="limparFiltros()"></button>

          </div>

        </div>



        <app-list-data-states

          [loading]="loading"

          [itemCount]="filteredItens.length"

          [skeletonRows]="8"

          [skeletonCols]="4"

          [emptyTitleKey]="alertsEmptyTitleKey"

          emptyDescriptionKey="ui.empty.description">

          <div class="alert-list">

            <div

              class="alert-row"

              *ngFor="let item of filteredItens"

              [class.alert-row--high]="item.severidade === 'VENCIDA' || item.severidade === 'CRITICA' || item.severidade === 'ALTA'">

              <div class="alert-row__tags">

                <p-tag [value]="labelCategoria(item.categoria)" severity="info"></p-tag>

                <p-tag *ngIf="item.severidade" [value]="labelSeveridade(item.severidade)" [severity]="sevTag(item.severidade)"></p-tag>

              </div>

              <div class="alert-row__body">

                <strong class="alert-row__title">{{ item.titulo }}</strong>

                <span class="det" *ngIf="item.detalhe">{{ item.detalhe }}</span>

              </div>

              <a *ngIf="item.rota" [routerLink]="item.rota" class="link">{{ 'conformidade.painel.ver' | translate }}</a>

            </div>

          </div>

        </app-list-data-states>

      </p-card>



      <p-card class="enforcement-card" *ngIf="enforcement">

        <h3>{{ 'conformidade.painel.enforcement.title' | translate }}</h3>

        <p class="hint">{{ 'conformidade.painel.enforcement.hint' | translate }}</p>

        <div class="enforcement-flags">

          <div class="flag">

            <p-checkbox [(ngModel)]="enforcement.bloquearCalibracaoVencida" [binary]="true" inputId="blkCalib"></p-checkbox>

            <label for="blkCalib">{{ 'conformidade.painel.enforcement.calibracao' | translate }}</label>

          </div>

          <div class="flag">

            <p-checkbox [(ngModel)]="enforcement.bloquearTreinoObrigatorio" [binary]="true" inputId="blkTreino"></p-checkbox>

            <label for="blkTreino">{{ 'conformidade.painel.enforcement.treino' | translate }}</label>

          </div>

          <div class="flag">

            <p-checkbox [(ngModel)]="enforcement.bloquearSubcontratacaoVencida" [binary]="true" inputId="blkSub"></p-checkbox>

            <label for="blkSub">{{ 'conformidade.painel.enforcement.subcontratacao' | translate }}</label>

          </div>

        </div>

        <button pButton type="button" class="p-button-outlined" icon="pi pi-save"

                [label]="'conformidade.painel.enforcement.btnSalvar' | translate"

                (click)="salvarEnforcement()" [loading]="savingEnforcement"></button>

      </p-card>

      <p-toast position="top-right"></p-toast>

    </div>

  `,

  styles: [

    `

      .painel-grid {

        display: grid;

        grid-template-columns: 1fr;

        gap: 16px;

        margin-bottom: 16px;

        align-items: start;

      }

      @media (min-width: 1024px) {

        .painel-grid {

          grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);

          gap: 20px;

        }

      }

      @media (min-width: 1280px) {

        .painel-grid {

          grid-template-columns: minmax(0, 1fr) 300px;

        }

      }

      .painel-stats {

        display: flex;

        flex-direction: column;

        gap: 12px;

      }

      .stat {

        display: flex;

        flex-direction: column;

        gap: 8px;

        padding-right: 1.75rem;

      }

      .stat .n {

        font-size: 1.75rem;

        font-weight: 700;

        line-height: 1;

        letter-spacing: -0.02em;

      }

      .stat .n.sub-n {

        font-size: 1.25rem;

        font-weight: 600;

        line-height: 1.1;

      }

      .stat-label {

        font-size: 0.8125rem;

        font-weight: 600;

        color: var(--text-color);

        opacity: 0.72;

        line-height: 1.35;

        letter-spacing: 0.01em;

      }

      .stat.sub {

        margin-top: 12px;

        padding-top: 12px;

        border-top: 1px solid var(--surface-border);

      }

      .stat-card {

        cursor: pointer;

        position: relative;

        transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.12s ease;

      }

      :host ::ng-deep .stat-card .p-card-body {

        padding: 1rem 1rem 1.125rem;

      }

      .stat-card:hover {

        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);

      }

      .stat-card--active {

        box-shadow: 0 0 0 2px var(--primary-color, #3b82f6);

        background: rgba(59, 130, 246, 0.04);

      }

      .stat-card--active.stat-card--warn {

        box-shadow: 0 0 0 2px var(--orange-500, #f97316);

        background: rgba(249, 115, 22, 0.08);

      }

      .stat-card--active.stat-card--danger {

        box-shadow: 0 0 0 2px var(--red-500, #ef4444);

        background: rgba(239, 68, 68, 0.06);

      }

      .stat-card__module-link {

        position: absolute;

        top: 8px;

        right: 8px;

        display: flex;

        align-items: center;

        justify-content: center;

        width: 1.75rem;

        height: 1.75rem;

        border-radius: 6px;

        color: var(--text-color-secondary);

        text-decoration: none;

        transition: background 0.12s ease, color 0.12s ease;

      }

      .stat-card__module-link:hover {

        background: var(--surface-100, rgba(0, 0, 0, 0.05));

        color: var(--primary-color, #3b82f6);

      }

      .stat-card--warn {

        border-left: 4px solid var(--orange-500, #f97316);

        background: rgba(249, 115, 22, 0.05);

      }

      .stat-card--warn .stat .n {

        color: var(--orange-600, #ea580c);

      }

      .stat-card--danger {

        border-left: 4px solid var(--red-500, #ef4444);

        background: rgba(239, 68, 68, 0.04);

      }

      .stat-card--danger .stat .n {

        color: var(--red-600, #dc2626);

      }

      .alerts-card {

        margin-bottom: 16px;

      }

      .alerts-card h3 {

        margin: 0;

        font-size: 1rem;

      }

      .alerts-header {

        display: flex;

        flex-direction: column;

        gap: 12px;

        margin-bottom: 12px;

      }

      .alerts-title-row {

        display: flex;

        align-items: baseline;

        gap: 12px;

        flex-wrap: wrap;

      }

      .alerts-count {

        font-size: 0.85rem;

        color: var(--text-color-secondary);

      }

      .alerts-filters {

        display: flex;

        flex-wrap: wrap;

        gap: 12px;

      }

      .filter-field {

        display: flex;

        flex-direction: column;

        gap: 4px;

        min-width: 160px;

        flex: 1;

        max-width: 240px;

      }

      .filter-field label {

        font-size: 0.8rem;

        font-weight: 500;

        color: var(--text-color-secondary);

      }

      .filter-clear-btn {

        align-self: flex-end;

        margin-bottom: 2px;

      }

      :host ::ng-deep .filter-dropdown {

        width: 100%;

      }

      .alert-list {

        display: flex;

        flex-direction: column;

        gap: 6px;

        max-height: min(28rem, calc(100vh - 20rem));

        overflow-y: auto;

        overscroll-behavior: contain;

        padding-right: 4px;

        scrollbar-gutter: stable;

      }

      .alert-list::-webkit-scrollbar {

        width: 6px;

      }

      .alert-list::-webkit-scrollbar-thumb {

        background: rgba(100, 116, 139, 0.35);

        border-radius: 999px;

      }

      .alert-row {

        display: grid;

        grid-template-columns: auto 1fr auto;

        align-items: center;

        gap: 8px 12px;

        padding: 6px 10px;

        border: 1px solid var(--surface-border);

        border-radius: 6px;

        font-size: 0.875rem;

      }

      .alert-row--high {

        border-color: rgba(239, 68, 68, 0.35);

        background: rgba(239, 68, 68, 0.03);

      }

      .alert-row__tags {

        display: flex;

        flex-wrap: wrap;

        gap: 4px;

        align-items: center;

      }

      .alert-row__body {

        display: flex;

        flex-direction: column;

        gap: 2px;

        min-width: 0;

      }

      .alert-row__title {

        font-size: 0.875rem;

        font-weight: 600;

      }

      .det {

        color: var(--text-color-secondary);

        font-size: 0.8rem;

        line-height: 1.35;

      }

      .link {

        font-size: 0.8rem;

        white-space: nowrap;

      }

      @media (max-width: 640px) {

        .alert-row {

          grid-template-columns: 1fr;

        }

        .link {

          justify-self: start;

        }

      }

      .enforcement-card {

        margin-top: 4px;

      }

      .enforcement-card h3 {

        margin: 0 0 8px;

        font-size: 1rem;

      }

      .enforcement-card .hint {

        color: var(--text-color-secondary);

        font-size: 0.9rem;

        margin: 0 0 12px;

      }

      .enforcement-flags {

        display: flex;

        flex-direction: column;

        gap: 10px;

        margin-bottom: 12px;

      }

      .flag {

        display: flex;

        align-items: center;

        gap: 8px;

      }

      .painel-actions {

        display: flex;

        align-items: center;

        gap: 8px;

        flex-wrap: wrap;

      }

      .dias-label {

        font-size: 0.85rem;

        color: var(--text-color-secondary);

      }

      .sms-card h3 {

        margin: 0 0 4px;

        font-size: 1rem;

      }

      .sms-card .hint {

        color: var(--text-color-secondary);

        font-size: 0.9rem;

        margin: 0 0 12px;

      }

      .sms-kpis {

        display: grid;

        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));

        gap: 12px;

        margin-bottom: 16px;

      }

      .sms-kpi {

        display: flex;

        flex-direction: column;

        gap: 6px;

      }

      .sms-kpi .n {

        font-size: 1.4rem;

        font-weight: 700;

        line-height: 1.1;

      }

      .sms-kpi-label {

        font-size: 0.8rem;

        font-weight: 500;

        color: var(--text-color-secondary);

        line-height: 1.3;

      }

      .sms-kpi .n.risco-alto {

        color: var(--red-500, #ef4444);

      }

      .sms-kpi .n.risco-medio {

        color: var(--orange-500, #f97316);

      }

      .sms-breakdown {

        display: grid;

        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));

        gap: 16px;

        margin-bottom: 16px;

      }

      .sms-breakdown h4,

      .tendencia-section h4 {

        margin: 0 0 8px;

        font-size: 0.9rem;

        font-weight: 600;

      }

      .chip-row {

        display: flex;

        flex-wrap: wrap;

        gap: 6px;

      }

      .tendencia-section {

        margin-top: 4px;

      }

      .tendencia-chart {

        min-height: 260px;

        padding: 4px 8px 8px;

        border-radius: 8px;

        background: var(--surface-50, rgba(248, 250, 252, 0.6));

        border: 1px solid var(--surface-border);

      }

    `

  ]

})

export class ConformidadePainelComponent implements OnInit, OnDestroy {

  private svc = inject(ConformidadeSgqService);

  private i18n = inject(TranslationService);

  private toast = inject(MessageService);

  private router = inject(Router);

  private langSub?: Subscription;



  loading = false;

  loadingRelatorio = false;

  savingEnforcement = false;

  diasJanela = 60;

  painel: ConformidadePainel | null = null;

  sms: ConformidadeSmsIndicadores | null = null;

  enforcement: ConformidadeEnforcementConfig | null = null;



  statCards: PainelStatCard[] = [];

  filtroCardAtivo: string | null = null;

  filtroCategoria = '';

  filtroSeveridade = '';

  categoriaFilterOptions: FilterOption[] = [];

  severidadeFilterOptions: FilterOption[] = [];



  tendenciaChartData: Record<string, unknown> | null = null;

  tendenciaChartOptions: Record<string, unknown> = {};



  ngOnInit(): void {

    this.buildTendenciaChartOptions();

    this.langSub = this.i18n.getCurrentLanguage$().subscribe(() => {

      this.rebuildFilterOptions();

      this.buildTendenciaChart();

    });

    this.carregar();

    this.svc.enforcementConfig().subscribe({

      next: c => (this.enforcement = c ?? null),

      error: () => (this.enforcement = null)

    });

  }



  ngOnDestroy(): void {

    this.langSub?.unsubscribe();

  }



  get hasActiveFilters(): boolean {

    return !!this.filtroCategoria || !!this.filtroSeveridade;

  }



  get filteredItens(): ConformidadePainelItem[] {

    const itens = this.painel?.itens ?? [];

    return itens.filter(item => {

      if (this.filtroCategoria && item.categoria !== this.filtroCategoria) return false;

      if (this.filtroSeveridade && item.severidade !== this.filtroSeveridade) return false;

      return true;

    });

  }



  get alertsEmptyTitleKey(): string {

    if ((this.painel?.itens?.length ?? 0) > 0 && this.filteredItens.length === 0) {

      return 'conformidade.painel.filter.empty';

    }

    return 'conformidade.painel.empty';

  }



  carregar(): void {

    this.loading = true;

    this.limparFiltros();

    this.svc.painel(this.diasJanela).subscribe({

      next: p => {

        this.painel = p;

        this.rebuildStatCards();

        this.rebuildFilterOptions();

        this.loading = false;

      },

      error: () => {

        this.loading = false;

      }

    });

    this.svc.smsIndicadores(this.diasJanela).subscribe({

      next: s => {

        this.sms = s;

        this.buildTendenciaChart();

      },

      error: () => {

        this.sms = null;

        this.tendenciaChartData = null;

      }

    });

  }



  private rebuildStatCards(): void {

    if (!this.painel) {

      this.statCards = [];

      return;

    }

    const p = this.painel;

    this.statCards = [

      {

        id: 'documento',

        route: '/conformidade/documentos',

        filterCategoria: 'DOCUMENTO',

        primary: p.totalDocumentosVencidos,

        primaryLabelKey: 'conformidade.painel.doc.vencidos',

        secondary: p.totalDocumentosProximos,

        secondaryLabelKey: 'conformidade.painel.doc.proximos',

        highlight: this.highlightLevel(p.totalDocumentosVencidos, p.totalDocumentosProximos)

      },

      {

        id: 'treinamento',

        route: '/conformidade/treinamentos',

        filterCategoria: 'TREINAMENTO',

        primary: p.totalTreinamentosVencidos,

        primaryLabelKey: 'conformidade.painel.treino.vencidos',

        secondary: p.totalTreinamentosProximos,

        secondaryLabelKey: 'conformidade.painel.treino.proximos',

        highlight: this.highlightLevel(p.totalTreinamentosVencidos, p.totalTreinamentosProximos)

      },

      {

        id: 'calibracao',

        route: '/conformidade/calibracao',

        filterCategoria: 'CALIBRACAO',

        primary: p.totalCalibracaoVencida,

        primaryLabelKey: 'conformidade.painel.calib.vencida',

        secondary: p.totalCalibracaoProxima,

        secondaryLabelKey: 'conformidade.painel.calib.proxima',

        highlight: this.highlightLevel(p.totalCalibracaoVencida, p.totalCalibracaoProxima)

      },

      {

        id: 'nc',

        route: '/conformidade/nao-conformidades',

        primary: p.totalNcAbertas,

        primaryLabelKey: 'conformidade.painel.nc.abertas',

        highlight: p.totalNcAbertas > 0 ? 'warn' : 'none'

      },

      {

        id: 'asl',

        route: '/estoque/fornecedores',

        filterCategoria: 'ASL',

        primary: p.totalAslPendente + p.totalAslVencido,

        primaryLabelKey: 'conformidade.painel.asl.alertas',

        highlight: p.totalAslPendente + p.totalAslVencido > 0 ? 'warn' : 'none'

      }

    ];

  }



  private highlightLevel(vencido: number, proximo = 0): StatHighlight {

    if (vencido > 0) return 'danger';

    if (proximo > 0) return 'warn';

    return 'none';

  }



  private rebuildFilterOptions(): void {

    const itens = this.painel?.itens ?? [];

    const allLabel = this.i18n.translate('conformidade.painel.filter.all');



    const cats = [...new Set(itens.map(i => i.categoria).filter((c): c is string => !!c?.trim()))].sort();

    this.categoriaFilterOptions = [

      { label: allLabel, value: '' },

      ...cats.map(c => ({ label: this.labelCategoria(c), value: c }))

    ];



    const sevs = [...new Set(itens.map(i => i.severidade).filter((s): s is string => !!s?.trim()))].sort();

    this.severidadeFilterOptions = [

      { label: allLabel, value: '' },

      ...sevs.map(s => ({ label: this.labelSeveridade(s), value: s }))

    ];

  }



  private buildTendenciaChartOptions(): void {

    this.tendenciaChartOptions = {

      responsive: true,

      maintainAspectRatio: false,

      interaction: { mode: 'index', intersect: false },

      layout: {

        padding: { top: 0, right: 4, bottom: 0, left: 0 }

      },

      plugins: {

        legend: {

          position: 'top',

          align: 'end',

          labels: {

            boxWidth: 8,

            boxHeight: 8,

            padding: 10,

            color: '#64748b',

            usePointStyle: true,

            pointStyle: 'circle',

            font: { size: 11, weight: '500' }

          }

        }

      },

      scales: {

        x: {

          ticks: { color: '#94a3b8', maxRotation: 45, padding: 4 },

          grid: { color: 'rgba(148, 163, 184, 0.12)' }

        },

        y: {

          beginAtZero: true,

          ticks: { color: '#94a3b8', precision: 0, padding: 6 },

          grid: { color: 'rgba(148, 163, 184, 0.12)' }

        }

      }

    };

  }



  private buildTendenciaChart(): void {

    const meses = this.sms?.tendenciaMensal ?? [];

    if (!meses.length) {

      this.tendenciaChartData = null;

      return;

    }

    this.tendenciaChartData = {

      labels: meses.map(m => m.mes),

      datasets: [

        {

          label: this.i18n.translate('conformidade.painel.sms.chartAbertas'),

          data: meses.map(m => m.abertas),

          borderColor: '#ea580c',

          backgroundColor: 'rgba(234, 88, 12, 0.14)',

          tension: 0.35,

          fill: true,

          pointRadius: 4,

          pointBackgroundColor: '#ea580c',

          pointHoverRadius: 6

        },

        {

          label: this.i18n.translate('conformidade.painel.sms.chartFechadas'),

          data: meses.map(m => m.fechadas),

          borderColor: '#059669',

          backgroundColor: 'rgba(5, 150, 105, 0.14)',

          tension: 0.35,

          fill: true,

          pointRadius: 4,

          pointBackgroundColor: '#059669',

          pointHoverRadius: 6

        }

      ]

    };

  }



  onStatCardClick(card: PainelStatCard): void {

    if (card.filterCategoria) {

      if (this.filtroCardAtivo === card.id) {

        this.limparFiltros();

        return;

      }

      this.filtroCardAtivo = card.id;

      this.filtroCategoria = card.filterCategoria;

      this.filtroSeveridade = '';

      this.scrollToAlerts();

      return;

    }

    void this.router.navigateByUrl(card.route);

  }



  onFiltroManualChange(): void {

    if (this.filtroSeveridade) {

      this.filtroCardAtivo = null;

      return;

    }

    const match = this.statCards.find(c => c.filterCategoria === this.filtroCategoria);

    this.filtroCardAtivo = match?.id ?? null;

  }



  limparFiltros(): void {

    this.filtroCardAtivo = null;

    this.filtroCategoria = '';

    this.filtroSeveridade = '';

  }



  statCardAriaLabel(card: PainelStatCard): string {

    const label = this.i18n.translate(card.primaryLabelKey);

    if (card.filterCategoria) {

      return this.i18n.translate('conformidade.painel.card.filterBy', { label });

    }

    return label;

  }



  private scrollToAlerts(): void {

    requestAnimationFrame(() => {

      document.getElementById('painel-alerts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    });

  }



  exportarRelatorio(): void {

    this.loadingRelatorio = true;

    this.svc.downloadRelatorioSgq(this.diasJanela).subscribe({

      next: blob => {

        this.svc.triggerRelatorioSgqDownload(blob);

        this.loadingRelatorio = false;

        this.toast.add({

          severity: 'success',

          summary: this.i18n.translate('conformidade.painel.relatorio.toastOk')

        });

      },

      error: () => {

        this.loadingRelatorio = false;

        this.toast.add({

          severity: 'error',

          summary: this.i18n.translate('conformidade.painel.relatorio.toastErr')

        });

      }

    });

  }



  smsMapEntries(map: Record<string, number> | undefined): { key: string; value: number }[] {

    if (!map) return [];

    return Object.keys(map).map(key => ({ key, value: map[key] ?? 0 }));

  }



  smsChipLabel(key: string, kind: 'severidade' | 'capa'): string {

    if (kind === 'capa') {

      return this.i18n.translateCatalog('conformidade.nc.capa', key, key);

    }

    return this.i18n.translateCatalog('conformidade.nc.sev', key, key);

  }



  labelCategoria(categoria: string | null | undefined): string {

    const c = (categoria ?? '').trim();

    if (!c) return '';

    return this.i18n.translateCatalog('conformidade.painel.cat', c, c);

  }



  labelSeveridade(severidade: string | null | undefined): string {

    const s = (severidade ?? '').trim();

    if (!s) return '';

    const nc = this.i18n.translateCatalog('conformidade.nc.sev', s, '');

    if (nc && nc !== s) return nc;

    return this.i18n.translateCatalog('conformidade.sev', s, s);

  }



  salvarEnforcement(): void {

    if (!this.enforcement) return;

    this.savingEnforcement = true;

    this.svc.updateEnforcementConfig(this.enforcement).subscribe({

      next: c => {

        this.enforcement = c;

        this.savingEnforcement = false;

        this.toast.add({

          severity: 'success',

          summary: this.i18n.translate('conformidade.painel.enforcement.toastOk')

        });

      },

      error: () => {

        this.savingEnforcement = false;

        this.toast.add({

          severity: 'error',

          summary: this.i18n.translate('conformidade.painel.enforcement.toastErr')

        });

      }

    });

  }



  sevTag(sev: string): 'success' | 'info' | 'warning' | 'danger' | undefined {

    if (sev === 'VENCIDA' || sev === 'CRITICA' || sev === 'ALTA') return 'danger';

    if (sev === 'PROXIMA') return 'warning';

    return 'info';

  }

}


