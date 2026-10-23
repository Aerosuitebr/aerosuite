import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { OSService, OS, OSCargaDashboard, OSCargaMecanico } from '../core/os.service';
import { AuthService } from '../auth/auth.service';
import { ListFontScaleControlComponent } from '../shared/list-font-scale/list-font-scale-control.component';
import { ListFontScaleService } from '../shared/list-font-scale/list-font-scale.service';

type TipoCarga = 'ATRIBUIDAS' | 'EM_ANDAMENTO' | 'CONCLUIDAS' | 'CARGA_ATUAL' | 'ALERTA_5_DIAS' | 'SEM_ATRIBUICAO';

@Component({
  standalone: true,
  selector: 'app-os-carga-mecanicos',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    TagModule,
    SelectButtonModule,
    DialogModule,
    ToastModule,
    TooltipModule,
    InputTextModule,
    ProgressSpinnerModule,
    ListFontScaleControlComponent
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="carga-shell">
      <header class="hero">
        <div class="hero-copy">
          <button pButton type="button" icon="pi pi-arrow-left" class="p-button-text p-button-sm back-btn"
                  label="Ordens de serviço" routerLink="/os"></button>
          <p class="eyebrow">Operação · Oficina</p>
          <h1>Carga de mecânicos</h1>
          <p class="lead">Acompanhe atribuições, execução e conclusão por período. Clique em qualquer quantidade para detalhar as OS.</p>
        </div>
        <div class="hero-controls">
          <span class="periodo-label">Período</span>
          <p-selectButton
            [options]="periodos"
            [(ngModel)]="periodo"
            optionLabel="label"
            optionValue="value"
            (onChange)="carregar()">
          </p-selectButton>
        </div>
      </header>

      <section class="kpi-row" *ngIf="dashboard">
        <button type="button" class="kpi kpi--alert kpi--click"
                [class.is-zero]="!dashboard.totalAlertaSemAtribuicao5Dias"
                [disabled]="!dashboard.totalAlertaSemAtribuicao5Dias"
                (click)="abrirFila('ALERTA_5_DIAS')"
                pTooltip="Ver OS sem mecânico há mais de 5 dias">
          <div class="kpi-icon"><i class="pi pi-exclamation-triangle"></i></div>
          <div>
            <div class="kpi-value">{{ dashboard.totalAlertaSemAtribuicao5Dias }}</div>
            <div class="kpi-label">Sem atribuição &gt; 5 dias</div>
          </div>
        </button>
        <button type="button" class="kpi kpi--click"
                [class.is-zero]="!dashboard.totalSemAtribuicao"
                [disabled]="!dashboard.totalSemAtribuicao"
                (click)="abrirFila('SEM_ATRIBUICAO')"
                pTooltip="Ver OS aguardando distribuição (a partir de 14/09/2026)">
          <div class="kpi-icon"><i class="pi pi-inbox"></i></div>
          <div>
            <div class="kpi-value">{{ dashboard.totalSemAtribuicao }}</div>
            <div class="kpi-label">Aguardando distribuição</div>
          </div>
        </button>
        <article class="kpi kpi--live">
          <div class="kpi-icon"><i class="pi pi-bolt"></i></div>
          <div>
            <div class="kpi-value">{{ dashboard.totalEmAndamento }}</div>
            <div class="kpi-label">Em andamento (geral)</div>
          </div>
        </article>
        <article class="kpi kpi--range">
          <div class="kpi-icon"><i class="pi pi-calendar"></i></div>
          <div>
            <div class="kpi-value kpi-value--sm">{{ labelPeriodo }}</div>
            <div class="kpi-label">{{ formatPeriodoCurto(dashboard.dataInicio) }} → {{ formatPeriodoCurto(dashboard.dataFim) }}</div>
          </div>
        </article>
      </section>

      <section class="board" *ngIf="dashboard">
        <div class="board-head">
          <h2>Equipe</h2>
          <span class="board-hint">Toque nas métricas para abrir a lista detalhada</span>
        </div>

        <div class="loading-block" *ngIf="loading">
          <p-progressSpinner strokeWidth="3" [style]="{width: '42px', height: '42px'}"></p-progressSpinner>
        </div>

        <div class="mech-list" *ngIf="!loading">
          <article class="mech-card" *ngFor="let row of dashboard.mecanicos">
            <div class="mech-identity">
              <div class="avatar" [attr.data-tone]="toneFor(row.mecanicoNome)">{{ iniciais(row.mecanicoNome) }}</div>
              <div>
                <h3>{{ row.mecanicoNome }}</h3>
                <p>Responsável · carga ativa {{ row.cargaAtual }}</p>
              </div>
            </div>

            <div class="metrics">
              <button type="button" class="metric" [class.is-zero]="!row.atribuidasPeriodo"
                      [disabled]="!row.atribuidasPeriodo"
                      (click)="abrirLista(row, 'ATRIBUIDAS')"
                      pTooltip="OS atribuídas neste período">
                <span class="metric-value">{{ row.atribuidasPeriodo }}</span>
                <span class="metric-label">Atribuídas</span>
              </button>
              <button type="button" class="metric metric--live" [class.is-zero]="!row.emAndamentoPeriodo"
                      [disabled]="!row.emAndamentoPeriodo"
                      (click)="abrirLista(row, 'EM_ANDAMENTO')"
                      pTooltip="OS com execução iniciada (em andamento ou pausada)">
                <span class="metric-value">{{ row.emAndamentoPeriodo }}</span>
                <span class="metric-label">Em execução</span>
              </button>
              <button type="button" class="metric metric--done" [class.is-zero]="!row.concluidasPeriodo"
                      [disabled]="!row.concluidasPeriodo"
                      (click)="abrirLista(row, 'CONCLUIDAS')"
                      pTooltip="OS concluídas/fechadas neste período">
                <span class="metric-value">{{ row.concluidasPeriodo }}</span>
                <span class="metric-label">Concluídas</span>
              </button>
              <button type="button" class="metric metric--load" [class.is-zero]="!row.cargaAtual"
                      [disabled]="!row.cargaAtual"
                      (click)="abrirLista(row, 'CARGA_ATUAL')"
                      pTooltip="Todas as OS ainda abertas com este mecânico (inclui não iniciadas)">
                <span class="metric-value">{{ row.cargaAtual }}</span>
                <span class="metric-label">Carga atual</span>
              </button>
            </div>
          </article>

          <div class="empty-board" *ngIf="!dashboard.mecanicos?.length">
            <i class="pi pi-users"></i>
            <p>Nenhum mecânico ativo com perfil MECANICO.</p>
          </div>
        </div>
      </section>
    </div>

    <p-dialog
      [(visible)]="showModal"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{width: '1080px', maxWidth: '96vw'}"
      [contentStyle]="{padding: '0'}"
      styleClass="carga-os-dialog"
      [showHeader]="false"
      (onHide)="fecharModal()">

      <div class="sheet" *ngIf="showModal">
        <div class="sheet-hero" [attr.data-tipo]="tipoSelecionado">
          <div class="sheet-hero-top">
            <div class="sheet-identity">
              <div class="avatar avatar--lg"
                   *ngIf="mecanicoSelecionado"
                   [attr.data-tone]="toneFor(mecanicoSelecionado.mecanicoNome)">
                {{ iniciais(mecanicoSelecionado.mecanicoNome) }}
              </div>
              <div class="avatar avatar--lg" *ngIf="!mecanicoSelecionado" data-tone="4">
                <i class="pi" [ngClass]="tipoSelecionado === 'ALERTA_5_DIAS' ? 'pi-exclamation-triangle' : 'pi-inbox'"></i>
              </div>
              <div>
                <p class="sheet-eyebrow">{{ labelTipo(tipoSelecionado) }}</p>
                <h2>{{ tituloModal }}</h2>
                <p class="sheet-period" *ngIf="dashboard && isTipoMecanico">
                  {{ labelPeriodo }} · {{ formatPeriodoCurto(dashboard.dataInicio) }} → {{ formatPeriodoCurto(dashboard.dataFim) }}
                </p>
                <p class="sheet-period" *ngIf="tipoSelecionado === 'CARGA_ATUAL'">Snapshot atual · OS ainda abertas</p>
                <p class="sheet-period" *ngIf="tipoSelecionado === 'ALERTA_5_DIAS'">
                  OS criadas a partir de 14/09/2026 · sem mecânico há mais de 5 dias
                </p>
                <p class="sheet-period" *ngIf="tipoSelecionado === 'SEM_ATRIBUICAO'">
                  Somente OS a partir de 14/09/2026 (início da carga de mecânicos)
                </p>
              </div>
            </div>
            <button pButton type="button" icon="pi pi-times" class="p-button-rounded p-button-text close-btn"
                    (click)="fecharModal()" aria-label="Fechar"></button>
          </div>

          <div class="sheet-stats">
            <div class="stat-pill">
              <strong>{{ osLista.length }}</strong>
              <span>OS na lista</span>
            </div>
            <div class="stat-pill" *ngIf="resumoStatus as rs">
              <strong>{{ rs.execucao }}</strong>
              <span>Em execução</span>
            </div>
            <div class="stat-pill" *ngIf="resumoStatus as rs">
              <strong>{{ rs.pausada }}</strong>
              <span>Pausadas</span>
            </div>
            <div class="search-wrap">
              <i class="pi pi-search"></i>
              <input pInputText [(ngModel)]="filtroModal" placeholder="Filtrar por OS, cliente, PN ou SN..." />
            </div>
            <app-list-font-scale-control></app-list-font-scale-control>
          </div>
        </div>

        <div class="sheet-body">
          <div class="sheet-loading" *ngIf="loadingModal">
            <p-progressSpinner strokeWidth="3" [style]="{width: '40px', height: '40px'}"></p-progressSpinner>
            <span>Carregando OS…</span>
          </div>

          <div class="os-cards list-results-scaled"
               [style.--list-result-font-scale]="listFontScale.scale()"
               *ngIf="!loadingModal">
            <button type="button" class="os-card" *ngFor="let os of osFiltradas; trackBy: trackOs"
                    (click)="abrirOs(os)">
              <div class="os-card-main">
                <div class="os-id-block">
                  <span class="os-badge">OS</span>
                  <strong>{{ formatOsLabel(os) }}</strong>
                </div>
                <p-tag [value]="labelStatus(os.statusOperacional)"
                       [severity]="severityStatus(os.statusOperacional)"></p-tag>
              </div>

              <div class="os-card-grid">
                <div>
                  <span class="meta-label">Cliente</span>
                  <span class="meta-value">{{ os.clienteNome || '—' }}</span>
                </div>
                <div>
                  <span class="meta-label">Tipo de serviço</span>
                  <span class="meta-value">{{ os.tipoServico || os.tipoServicoObj?.nome || '—' }}</span>
                </div>
                <div>
                  <span class="meta-label">P/N</span>
                  <span class="meta-value mono">{{ os.partNumber || '—' }}</span>
                </div>
                <div>
                  <span class="meta-label">S/N</span>
                  <span class="meta-value mono">{{ os.serialNumber || '—' }}</span>
                </div>
                <div>
                  <span class="meta-label">Abertura</span>
                  <span class="meta-value">{{ formatDateBr(os.dtAbertura) }}</span>
                </div>
                <div>
                  <span class="meta-label">{{ metaDataLabel }}</span>
                  <span class="meta-value">{{ metaDataValue(os) }}</span>
                </div>
              </div>

              <div class="os-card-foot">
                <span class="hint-open"><i class="pi pi-arrow-right"></i> Abrir ordem de serviço</span>
                <span class="exec">{{ labelExecucaoDetalhe(os.statusExecucao) }}</span>
              </div>
            </button>

            <div class="empty-list" *ngIf="!osFiltradas.length">
              <i class="pi pi-inbox"></i>
              <p *ngIf="filtroModal.trim()">Nenhuma OS corresponde ao filtro.</p>
              <p *ngIf="!filtroModal.trim()">Nenhuma OS neste recorte.</p>
            </div>
          </div>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

    :host {
      display: block;
      --ink: #0b1220;
      --muted: #5b6b7c;
      --line: #d7e0ea;
      --surface: #f3f6f9;
      --card: #ffffff;
      --accent: #0e7490;
      --accent-soft: #ecfeff;
      --live: #b45309;
      --done: #047857;
      --alert: #b91c1c;
      font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
      color: var(--ink);
    }

    .carga-shell {
      padding: 20px 24px 48px;
    }

    .hero {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-end;
      padding: 28px 32px;
      border-radius: 22px;
      background:
        radial-gradient(1200px 280px at 10% -40%, rgba(14, 116, 144, 0.28), transparent 55%),
        linear-gradient(145deg, #0f172a 0%, #1e293b 55%, #0f766e 140%);
      color: #f8fafc;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.22);
      margin-bottom: 18px;
      flex-wrap: wrap;
    }

    .back-btn { color: #cbd5e1 !important; margin: 0 0 8px -8px; }
    .eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
    }
    .hero h1 {
      margin: 6px 0 8px;
      font-family: Manrope, sans-serif;
      font-size: clamp(1.7rem, 2.4vw, 2.2rem);
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .lead {
      margin: 0;
      max-width: 520px;
      color: #cbd5e1;
      line-height: 1.5;
      font-size: 0.95rem;
    }

    .hero-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }
    .periodo-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #94a3b8;
      font-weight: 600;
    }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    @media (max-width: 960px) {
      .kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .kpi-row { grid-template-columns: 1fr; }
    }

    .kpi {
      display: flex;
      gap: 14px;
      align-items: center;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 16px 18px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      text-align: left;
      width: 100%;
      font: inherit;
      color: inherit;
    }
    .kpi--click {
      cursor: pointer;
      transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
    }
    .kpi--click:hover:not(:disabled) {
      border-color: #99f6e4;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
      transform: translateY(-1px);
    }
    .kpi--alert.kpi--click:hover:not(:disabled) {
      border-color: #fca5a5;
    }
    .kpi--click.is-zero,
    .kpi--click:disabled {
      opacity: 0.55;
      cursor: default;
      transform: none;
      box-shadow: none;
    }
    .kpi-icon {
      width: 42px; height: 42px; border-radius: 12px;
      display: grid; place-items: center;
      background: #eef2f7; color: #334155; font-size: 1rem;
    }
    .kpi--alert .kpi-icon { background: #fef2f2; color: var(--alert); }
    .kpi--live .kpi-icon { background: #fff7ed; color: var(--live); }
    .kpi--range .kpi-icon { background: var(--accent-soft); color: var(--accent); }
    .kpi-value {
      font-family: Manrope, sans-serif;
      font-size: 1.7rem;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .kpi-value--sm { font-size: 1.15rem; }
    .kpi-label { margin-top: 4px; color: var(--muted); font-size: 0.82rem; }

    .board {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 18px 18px 10px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
    }
    .board-head {
      display: flex; justify-content: space-between; align-items: baseline;
      gap: 12px; padding: 4px 8px 14px; flex-wrap: wrap;
    }
    .board-head h2 {
      margin: 0; font-family: Manrope, sans-serif; font-size: 1.15rem; font-weight: 750;
    }
    .board-hint { color: var(--muted); font-size: 0.85rem; }

    .loading-block {
      display: grid; place-items: center; padding: 48px 0;
    }

    .mech-list { display: flex; flex-direction: column; gap: 10px; }
    .mech-card {
      display: grid;
      grid-template-columns: minmax(220px, 1.1fr) 2fr;
      gap: 16px;
      align-items: center;
      padding: 14px 16px;
      border-radius: 16px;
      border: 1px solid #e8eef4;
      background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
      transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
    }
    .mech-card:hover {
      border-color: #c5d4e2;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
      transform: translateY(-1px);
    }
    @media (max-width: 860px) {
      .mech-card { grid-template-columns: 1fr; }
    }

    .mech-identity { display: flex; gap: 12px; align-items: center; }
    .avatar {
      width: 46px; height: 46px; border-radius: 14px;
      display: grid; place-items: center;
      font-family: Manrope, sans-serif; font-weight: 800; color: #fff; letter-spacing: 0.02em;
      background: #334155;
    }
    .avatar--lg { width: 58px; height: 58px; border-radius: 16px; font-size: 1.1rem; }
    .avatar[data-tone='0'] { background: linear-gradient(145deg, #0f766e, #155e75); }
    .avatar[data-tone='1'] { background: linear-gradient(145deg, #1d4ed8, #0e7490); }
    .avatar[data-tone='2'] { background: linear-gradient(145deg, #b45309, #92400e); }
    .avatar[data-tone='3'] { background: linear-gradient(145deg, #047857, #115e59); }
    .avatar[data-tone='4'] { background: linear-gradient(145deg, #334155, #0f172a); }

    .mech-identity h3 {
      margin: 0; font-family: Manrope, sans-serif; font-size: 1.05rem; font-weight: 750;
    }
    .mech-identity p { margin: 2px 0 0; color: var(--muted); font-size: 0.82rem; }

    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }
    @media (max-width: 640px) {
      .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    .metric {
      appearance: none; border: 1px solid #e2e8f0; background: #fff;
      border-radius: 14px; padding: 12px 10px; text-align: left; cursor: pointer;
      transition: background .15s ease, border-color .15s ease, transform .15s ease;
    }
    .metric:hover:not(:disabled) {
      border-color: #99f6e4; background: var(--accent-soft); transform: translateY(-1px);
    }
    .metric--live:hover:not(:disabled) { border-color: #fdba74; background: #fff7ed; }
    .metric--done:hover:not(:disabled) { border-color: #6ee7b7; background: #ecfdf5; }
    .metric--load:hover:not(:disabled) { border-color: #93c5fd; background: #eff6ff; }
    .metric.is-zero, .metric:disabled {
      opacity: 0.55; cursor: default; transform: none;
    }
    .metric-value {
      display: block; font-family: Manrope, sans-serif; font-size: 1.35rem; font-weight: 800;
      letter-spacing: -0.03em; color: var(--ink);
    }
    .metric-label {
      display: block; margin-top: 2px; font-size: 0.72rem; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--muted); font-weight: 600;
    }

    .empty-board, .empty-list {
      display: grid; place-items: center; gap: 8px; padding: 40px 16px; color: var(--muted);
    }
    .empty-board i, .empty-list i { font-size: 1.6rem; opacity: 0.7; }

    :host ::ng-deep .carga-os-dialog .p-dialog {
      border-radius: 22px; overflow: hidden; border: none;
      box-shadow: 0 30px 80px rgba(15, 23, 42, 0.28);
    }
    :host ::ng-deep .carga-os-dialog .p-dialog-content { padding: 0; }

    .sheet { background: #f7fafc; }
    .sheet-hero {
      padding: 22px 24px 18px;
      background:
        radial-gradient(800px 200px at 90% -30%, rgba(14, 116, 144, 0.18), transparent 50%),
        linear-gradient(160deg, #0f172a, #1e293b 70%);
      color: #f8fafc;
    }
    .sheet-hero[data-tipo='EM_ANDAMENTO'] {
      background: linear-gradient(160deg, #1c1917, #78350f 120%);
    }
    .sheet-hero[data-tipo='CONCLUIDAS'] {
      background: linear-gradient(160deg, #052e2b, #065f46 120%);
    }
    .sheet-hero[data-tipo='CARGA_ATUAL'] {
      background: linear-gradient(160deg, #0c1a2e, #1e3a5f 120%);
    }
    .sheet-hero[data-tipo='ALERTA_5_DIAS'] {
      background: linear-gradient(160deg, #450a0a, #991b1b 120%);
    }
    .sheet-hero[data-tipo='SEM_ATRIBUICAO'] {
      background: linear-gradient(160deg, #0f172a, #334155 120%);
    }

    .sheet-hero-top {
      display: flex; justify-content: space-between; gap: 12px; align-items: flex-start;
    }
    .sheet-identity { display: flex; gap: 14px; align-items: center; }
    .sheet-eyebrow {
      margin: 0; text-transform: uppercase; letter-spacing: 0.12em;
      font-size: 11px; color: #94a3b8; font-weight: 600;
    }
    .sheet-identity h2 {
      margin: 4px 0; font-family: Manrope, sans-serif; font-size: 1.45rem; font-weight: 800;
    }
    .sheet-period { margin: 0; color: #cbd5e1; font-size: 0.88rem; }
    .close-btn { color: #e2e8f0 !important; }

    .sheet-stats {
      display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 18px;
    }
    .stat-pill {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 999px;
      padding: 8px 14px;
      display: flex; gap: 8px; align-items: baseline;
    }
    .stat-pill strong { font-family: Manrope, sans-serif; font-size: 1.05rem; }
    .stat-pill span { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

    .search-wrap {
      margin-left: auto; min-width: min(320px, 100%);
      display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.95); border-radius: 12px; padding: 0 12px;
      color: #64748b;
    }
    .search-wrap input {
      border: none !important; box-shadow: none !important; width: 100%;
      background: transparent; color: #0f172a; padding: 10px 0;
    }

    .sheet-body { padding: 16px 18px 22px; max-height: min(62vh, 640px); overflow: auto; }
    .sheet-loading {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 48px 0; color: var(--muted);
    }

    .os-cards { display: flex; flex-direction: column; gap: 10px; }
    .os-cards.list-results-scaled {
      --carga-fs: var(--list-result-font-scale, 1);
    }
    .os-cards.list-results-scaled .os-id-block strong {
      font-size: calc(1.15rem * var(--carga-fs)) !important;
    }
    .os-cards.list-results-scaled .meta-label {
      font-size: calc(0.7rem * var(--carga-fs)) !important;
    }
    .os-cards.list-results-scaled .meta-value {
      font-size: calc(0.92rem * var(--carga-fs)) !important;
    }
    .os-cards.list-results-scaled .hint-open,
    .os-cards.list-results-scaled .exec {
      font-size: calc(0.85rem * var(--carga-fs)) !important;
    }
    .os-cards.list-results-scaled .p-tag {
      font-size: calc(0.75rem * var(--carga-fs)) !important;
    }
    .os-card {
      width: 100%; text-align: left; appearance: none; cursor: pointer;
      border: 1px solid #dde5ee; background: #fff; border-radius: 16px;
      padding: 14px 16px; transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
    }
    .os-card:hover {
      border-color: #67e8f9;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
      transform: translateY(-1px);
    }
    .os-card-main {
      display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px;
    }
    .os-id-block { display: flex; align-items: center; gap: 10px; }
    .os-badge {
      font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
      background: #ecfeff; color: #0e7490; border-radius: 999px; padding: 4px 8px;
    }
    .os-id-block strong {
      font-family: Manrope, sans-serif; font-size: 1.15rem; letter-spacing: -0.02em;
    }

    .os-card-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px 14px;
    }
    @media (max-width: 720px) {
      .os-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .search-wrap { margin-left: 0; width: 100%; }
    }
    .meta-label {
      display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em;
      color: #94a3b8; font-weight: 600; margin-bottom: 2px;
    }
    .meta-value { display: block; color: #0f172a; font-size: 0.92rem; font-weight: 500; }
    .meta-value.mono { font-variant-numeric: tabular-nums; letter-spacing: 0.01em; }

    .os-card-foot {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 12px; padding-top: 10px; border-top: 1px solid #eef2f7;
      gap: 10px; flex-wrap: wrap;
    }
    .hint-open {
      color: var(--accent); font-weight: 600; font-size: 0.85rem;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .exec { color: var(--muted); font-size: 0.8rem; }
  `]
})
export class OsCargaMecanicosComponent implements OnInit {
  private api = inject(OSService);
  private auth = inject(AuthService);
  readonly listFontScale = inject(ListFontScaleService);
  private router = inject(Router);
  private messages = inject(MessageService);

  periodo: 'DIA' | 'SEMANA' | 'MES' = 'DIA';
  periodos = [
    { label: 'Diário', value: 'DIA' },
    { label: 'Semanal', value: 'SEMANA' },
    { label: 'Mensal', value: 'MES' }
  ];
  dashboard: OSCargaDashboard | null = null;
  loading = false;

  showModal = false;
  loadingModal = false;
  mecanicoSelecionado: OSCargaMecanico | null = null;
  tipoSelecionado: TipoCarga = 'ATRIBUIDAS';
  osLista: OS[] = [];
  filtroModal = '';

  get labelPeriodo(): string {
    return this.periodos.find(p => p.value === this.periodo)?.label || this.periodo;
  }

  get isTipoMecanico(): boolean {
    return ['ATRIBUIDAS', 'EM_ANDAMENTO', 'CONCLUIDAS'].includes(this.tipoSelecionado);
  }

  get tituloModal(): string {
    if (this.mecanicoSelecionado?.mecanicoNome) return this.mecanicoSelecionado.mecanicoNome;
    if (this.tipoSelecionado === 'ALERTA_5_DIAS') return 'Fila de alerta';
    if (this.tipoSelecionado === 'SEM_ATRIBUICAO') return 'Aguardando distribuição';
    return 'Ordens de serviço';
  }

  get metaDataLabel(): string {
    switch (this.tipoSelecionado) {
      case 'CONCLUIDAS': return 'Conclusão / fechamento';
      case 'ALERTA_5_DIAS': return 'Dias sem mecânico';
      case 'SEM_ATRIBUICAO': return 'Abertura';
      case 'CARGA_ATUAL': return 'Atribuída em';
      case 'EM_ANDAMENTO': return 'Atribuída em';
      default: return 'Atribuída em';
    }
  }

  get osFiltradas(): OS[] {
    const q = this.filtroModal.trim().toLowerCase();
    if (!q) return this.osLista;
    return this.osLista.filter(os => {
      const blob = [
        this.formatOsLabel(os),
        os.clienteNome,
        os.partNumber,
        os.serialNumber,
        os.tipoServico,
        os.tipoServicoObj?.nome,
        os.statusOperacional
      ].map(v => (v || '').toString().toLowerCase()).join(' ');
      return blob.includes(q);
    });
  }

  get resumoStatus(): { execucao: number; pausada: number } | null {
    if (!this.osLista.length) return null;
    return {
      execucao: this.osLista.filter(o => (o.statusOperacional || '').toUpperCase() === 'EM_EXECUCAO').length,
      pausada: this.osLista.filter(o => (o.statusOperacional || '').toUpperCase() === 'PAUSADA').length
    };
  }

  ngOnInit(): void {
    if (!['ADMIN', 'ADMINISTRADOR', 'COORDENADOR', 'DIRETOR'].includes(this.auth.getCurrentUser()?.perfil?.codigo?.toUpperCase() || '')) {
      this.messages.add({
        severity: 'warn',
        summary: 'Acesso',
        detail: 'Somente Coordenador, Administrador ou Diretor acessam este painel.'
      });
      this.router.navigate(['/os']);
      return;
    }
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.api.dashboardCarga(this.periodo).subscribe({
      next: (d) => {
        this.dashboard = d;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.messages.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Falha ao carregar carga de mecânicos.'
        });
      }
    });
  }

  abrirLista(row: OSCargaMecanico, tipo: TipoCarga): void {
    const count = tipo === 'ATRIBUIDAS' ? row.atribuidasPeriodo
      : tipo === 'EM_ANDAMENTO' ? row.emAndamentoPeriodo
      : tipo === 'CONCLUIDAS' ? row.concluidasPeriodo
      : row.cargaAtual;
    if (!count || !row.mecanicoId) return;

    this.mecanicoSelecionado = row;
    this.tipoSelecionado = tipo;
    this.filtroModal = '';
    this.showModal = true;
    this.loadingModal = true;
    this.osLista = [];

    this.api.listarOsCargaMecanico(row.mecanicoId, this.periodo, tipo as any).subscribe({
      next: (list) => {
        this.osLista = list || [];
        this.loadingModal = false;
      },
      error: (err) => {
        this.loadingModal = false;
        this.messages.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Falha ao carregar a lista de OS.'
        });
      }
    });
  }

  abrirFila(tipo: 'ALERTA_5_DIAS' | 'SEM_ATRIBUICAO'): void {
    const count = tipo === 'ALERTA_5_DIAS'
      ? this.dashboard?.totalAlertaSemAtribuicao5Dias
      : this.dashboard?.totalSemAtribuicao;
    if (!count) return;

    this.mecanicoSelecionado = null;
    this.tipoSelecionado = tipo;
    this.filtroModal = '';
    this.showModal = true;
    this.loadingModal = true;
    this.osLista = [];

    const call = tipo === 'ALERTA_5_DIAS'
      ? this.api.listarAlertaSemAtribuicaoOs()
      : this.api.listarSemAtribuicaoOs();

    call.subscribe({
      next: (list) => {
        this.osLista = list || [];
        this.loadingModal = false;
      },
      error: (err) => {
        this.loadingModal = false;
        this.messages.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Falha ao carregar a fila de OS.'
        });
      }
    });
  }

  fecharModal(): void {
    this.showModal = false;
    this.mecanicoSelecionado = null;
    this.osLista = [];
    this.filtroModal = '';
  }

  /** Abre a tela da OS (modal de edição na lista). */
  abrirOs(os: OS): void {
    const id = os?.id;
    if (id == null) {
      this.messages.add({ severity: 'warn', summary: 'OS', detail: 'Identificador da OS não encontrado.' });
      return;
    }
    this.fecharModal();
    this.router.navigate(['/os'], { queryParams: { editId: String(id) } });
  }

  trackOs(_index: number, os: OS): number | string {
    return os.id ?? os.idOs ?? _index;
  }

  iniciais(nome?: string | null): string {
    const parts = (nome || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  toneFor(nome?: string | null): number {
    const s = nome || '';
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 1)) % 5;
    return h;
  }

  labelTipo(tipo: TipoCarga): string {
    switch (tipo) {
      case 'EM_ANDAMENTO': return 'Em execução no período';
      case 'CONCLUIDAS': return 'Concluídas no período';
      case 'CARGA_ATUAL': return 'Carga atual (OS abertas)';
      case 'ALERTA_5_DIAS': return 'Sem atribuição > 5 dias';
      case 'SEM_ATRIBUICAO': return 'Aguardando distribuição';
      default: return 'Atribuídas no período';
    }
  }

  formatOsLabel(os: OS): string {
    // Mesmo padrão da lista de OS: BEL-{id}/{ano} (usa PK, não idOs legado)
    const yearSource = os.dtAbertura || (os as any).dataAbertura || '';
    let yearStr = '';
    if (yearSource) {
      const s = String(yearSource);
      yearStr = s.includes('-') ? s.split('-')[0] : s.substring(0, 4);
    } else {
      yearStr = String(new Date().getFullYear());
    }
    if (os.id != null) return `BEL-${os.id}/${yearStr}`;
    if (os.idOs != null) return `BEL-${os.idOs}/${yearStr}`;
    return '—';
  }

  labelExecucao(status?: string | null): string {
    switch ((status || '').toUpperCase()) {
      case 'EM_ANDAMENTO': return 'Em andamento';
      case 'PAUSADA': return 'Pausada';
      case 'FINALIZADA': return 'Finalizada';
      default: return 'Não iniciada';
    }
  }

  labelExecucaoDetalhe(status?: string | null): string {
    switch ((status || '').toUpperCase()) {
      case 'EM_ANDAMENTO': return 'Execução em andamento';
      case 'PAUSADA': return 'Execução pausada';
      case 'FINALIZADA': return 'Execução finalizada';
      default: return 'Aguardando início da execução';
    }
  }

  formatPeriodoCurto(value?: string | null): string {
    if (!value) return '—';
    const raw = value.trim();
    let d: Date;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const [y, m, day] = raw.slice(0, 10).split('-').map(Number);
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(raw);
    }
    if (Number.isNaN(d.getTime())) return value;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  formatDateBr(value?: string | null): string {
    if (!value) return '—';
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const [y, m, day] = raw.slice(0, 10).split('-').map(Number);
      return `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return value;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  formatDateTimeBr(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  }

  metaDataValue(os: OS): string {
    if (this.tipoSelecionado === 'CONCLUIDAS') {
      return this.formatDateBr(os.dataFechamento || os.dataConclusaoServ);
    }
    if (this.tipoSelecionado === 'ALERTA_5_DIAS') {
      const dias = os.diasSemAtribuicao;
      if (dias != null) return `${dias} dia(s)`;
      return this.formatDateBr(os.dtAbertura);
    }
    if (this.tipoSelecionado === 'SEM_ATRIBUICAO') {
      return this.formatDateBr(os.dtAbertura);
    }
    return this.formatDateTimeBr(os.mecanicoAtribuidoEm);
  }

  labelStatus(status?: string | null): string {
    switch ((status || '').toUpperCase()) {
      case 'ATRIBUIDA': return 'Atribuída';
      case 'EM_EXECUCAO': return 'Em execução';
      case 'PAUSADA': return 'Pausada';
      case 'CONCLUIDA': return 'Concluída';
      case 'FECHADA': return 'Fechada';
      case 'CANCELADA': return 'Cancelada';
      default: return 'Aguardando';
    }
  }

  severityStatus(status?: string | null): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    switch ((status || '').toUpperCase()) {
      case 'ATRIBUIDA': return 'info';
      case 'EM_EXECUCAO': return 'info';
      case 'PAUSADA': return 'warning';
      case 'CONCLUIDA': return 'success';
      case 'FECHADA': return 'secondary';
      case 'CANCELADA': return 'danger';
      default: return 'warning';
    }
  }
}
