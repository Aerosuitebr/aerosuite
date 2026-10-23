import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  FluxoAberto, FluxoDashboard, FluxoEtapaMetrica, FluxoOsListaItem, OsFluxoService,
  dataIso, formatarDataHora, formatarDuracao, labelSituacao
} from './os-fluxo.service';

type PeriodoPreset = 'HOJE' | '7D' | '30D' | '90D' | 'CUSTOM';
type Aba = 'ABERTOS' | 'HISTORICO' | 'EQUIPE';

@Component({
  standalone: true,
  selector: 'app-os-fluxo-painel',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, ChartModule, TooltipModule, InputTextModule,
    ProgressSpinnerModule, ToastModule],
  providers: [MessageService],
  styleUrls: ['./fluxo-shared.css'],
  template: `
    <p-toast></p-toast>
    <div class="fx-shell">
      <header class="fx-hero pn-hero">
        <div class="pn-hero-row">
          <div class="pn-title">
            <a class="pn-back" routerLink="/os" pTooltip="Voltar para Ordens de serviço" aria-label="Voltar para Ordens de serviço">
              <i class="pi pi-arrow-left"></i>
            </a>
            <div>
              <p class="fx-eyebrow">Operação · Controle de fluxo</p>
              <h1>Fluxo das ordens de serviço</h1>
            </div>
            <i class="pi pi-info-circle pn-info" tooltipPosition="bottom"
               pTooltip="Tempo real de cada etapa, da entrada no Suprimento até a saída. Todas as métricas são calculadas a partir das leituras de código de barras registradas."></i>
          </div>
          <div class="pn-actions">
            <a class="fx-ghost-btn is-primary" routerLink="/os/fluxo/estacao"><i class="pi pi-qrcode"></i> Estação de bipagem</a>
            <a class="fx-ghost-btn" routerLink="/os/fluxo/codigos"><i class="pi pi-print"></i> Códigos e metas</a>
            <a class="fx-ghost-btn" routerLink="/os/fluxo/ajuste"><i class="pi pi-sliders-h"></i> Ajuste de etapas</a>
          </div>
        </div>
        <div class="pn-hero-row pn-toolbar">
          <div class="pn-audit">
            <span class="pn-scope">Busca global</span>
            <i class="pi pi-search"></i>
            <input #buscaGlobal [(ngModel)]="buscaOs" (keydown.enter)="auditarOs()" (keydown.escape)="buscaGlobal.blur()"
                   (focus)="buscaFocada = true" (blur)="buscaFocada = false"
                   aria-label="Busca global: abrir a auditoria de uma OS" aria-keyshortcuts="Control+K /"
                   placeholder="Abrir auditoria de qualquer OS: nº, BEL-2531/2026 ou OS2531" />
            <span class="pn-kbd" *ngIf="!buscaFocada && !buscaOs" aria-hidden="true"
                  pTooltip="Atalho: Ctrl + K ou / em qualquer ponto do painel" tooltipPosition="bottom">
              <kbd>Ctrl</kbd><kbd>K</kbd>
            </span>
            <button type="button" (click)="auditarOs()" [disabled]="!buscaOs.trim()">Auditar</button>
          </div>
          <div class="pn-hero-right">
          <div class="pn-period">
            <button type="button" *ngFor="let p of presets" [class.on]="preset === p.value" (click)="aplicarPreset(p.value)">{{ p.label }}</button>
          </div>
          <div class="pn-custom" *ngIf="preset === 'CUSTOM'">
            <input type="date" [(ngModel)]="de" (change)="carregar()" />
            <span>até</span>
            <input type="date" [(ngModel)]="ate" (change)="carregar()" />
          </div>
          <div class="pn-refresh">
            <span *ngIf="dash">Atualizado {{ dataHora(dash.geradoEm) }}</span>
            <button type="button" (click)="carregar()" [disabled]="loading" pTooltip="Atualizar agora">
              <i class="pi pi-refresh" [class.pi-spin]="loading"></i>
            </button>
            <label class="pn-auto"><input type="checkbox" [(ngModel)]="autoRefresh" (change)="configurarAutoRefresh()" /> auto 60s</label>
          </div>
          </div>
        </div>
      </header>

      <div class="fx-loading" *ngIf="loading && !dash">
        <p-progressSpinner strokeWidth="3" [style]="{ width: '44px', height: '44px' }"></p-progressSpinner>
      </div>

      <ng-container *ngIf="dash as d">
        <section class="fx-kpis">
          <div class="fx-kpi" style="--kpi-color:#b45309">
            <div class="fx-kpi-label">Em fluxo agora</div>
            <div class="fx-kpi-value">{{ d.kpis.osEmFluxo }}</div>
            <div class="fx-kpi-sub">{{ d.kpis.osEmEtapa }} em etapa · {{ d.kpis.osAguardando }} aguardando</div>
          </div>
          <div class="fx-kpi" style="--kpi-color:#0e7490">
            <div class="fx-kpi-label">Iniciadas no período</div>
            <div class="fx-kpi-value">{{ d.kpis.iniciadasPeriodo }}</div>
            <div class="fx-kpi-sub">{{ d.kpis.passagensConcluidas }} passagens de etapa concluídas</div>
          </div>
          <div class="fx-kpi" style="--kpi-color:#047857">
            <div class="fx-kpi-label">Fluxos concluídos</div>
            <div class="fx-kpi-value">{{ d.kpis.concluidasPeriodo }}</div>
            <div class="fx-kpi-sub">saída registrada na última etapa</div>
          </div>
          <div class="fx-kpi" style="--kpi-color:#6d28d9">
            <div class="fx-kpi-label">Ciclo médio</div>
            <div class="fx-kpi-value">{{ dur(d.kpis.cicloMedioSeg) }}</div>
            <div class="fx-kpi-sub">mediana {{ dur(d.kpis.cicloMedianoSeg) }} · p90 {{ dur(d.kpis.cicloP90Seg) }}</div>
          </div>
          <div class="fx-kpi" [style.--kpi-color]="corPct(d.kpis.noPrazoPct)">
            <div class="fx-kpi-label">Etapas dentro da meta</div>
            <div class="fx-kpi-value">{{ d.kpis.noPrazoPct != null ? (d.kpis.noPrazoPct | number:'1.0-1') + '%' : '—' }}</div>
            <div class="fx-kpi-sub">{{ d.kpis.noPrazoPct != null ? 'das passagens com meta definida' : 'defina metas em Códigos e metas' }}</div>
          </div>
          <div class="fx-kpi" [style.--kpi-color]="(d.kpis.taxaRejeicaoPct || 0) > 10 ? '#b91c1c' : '#334155'">
            <div class="fx-kpi-label">Leituras</div>
            <div class="fx-kpi-value">{{ d.kpis.bipagens }}</div>
            <div class="fx-kpi-sub">
              {{ d.kpis.rejeicoes }} recusadas{{ d.kpis.taxaRejeicaoPct != null ? ' (' + (d.kpis.taxaRejeicaoPct | number:'1.0-1') + '%)' : '' }}
              · {{ d.kpis.forcados }} forçadas · {{ d.kpis.estornos }} estornos
            </div>
          </div>
        </section>

        <section class="fx-card pn-pipeline-card">
          <div class="fx-card-head">
            <h2>Esteira de etapas</h2>
            <div class="pn-legend">
              <span><i class="sw live"></i> Na etapa (em execução)</span>
              <span><i class="sw wait"></i> Na fila (aguardando entrada)</span>
              <span class="fx-hint">Clique em uma etapa para filtrar a lista · tempos do período</span>
            </div>
          </div>
          <div class="pn-pipeline">
            <div class="pn-col" *ngFor="let m of d.etapas; let first = first; let last = last"
                 [class.sel]="filtroEtapaId === m.etapa.id" [style.--stage]="m.etapa.cor || '#334155'">
              <div class="pn-step" [class.first]="first" [class.last]="last" [class.busy]="m.emAndamento > 0">
                <span class="pn-step-num" tabindex="0" [attr.aria-label]="resumoEtapa(m)"
                      [pTooltip]="tooltipsEtapa[m.etapa.id]" [escape]="false" tooltipPosition="bottom"
                      tooltipStyleClass="pn-step-tip" [showDelay]="150">{{ m.etapa.ordem }}</span>
              </div>
              <button type="button" class="pn-stage" (click)="filtrarEtapa(m.etapa.id)" [attr.aria-pressed]="filtroEtapaId === m.etapa.id">
                <div class="pn-stage-head">
                  <span class="fx-stage-dot"><i [class]="m.etapa.icone || 'pi pi-circle'"></i></span>
                  <div class="pn-stage-title">
                    <div class="pn-stage-name">{{ m.etapa.nome }}</div>
                    <div class="pn-stage-setor">{{ m.etapa.setor || '—' }}</div>
                  </div>
                </div>
                <div class="pn-stage-nums">
                  <div class="pn-count live" [class.on]="m.emAndamento > 0" pTooltip="OS com entrada registrada e sem saída">
                    <strong>{{ m.emAndamento }}</strong><span>Na etapa</span>
                  </div>
                  <div class="pn-count wait" [class.on]="m.aguardando > 0" pTooltip="OS que saíram da etapa anterior e aguardam entrada nesta">
                    <strong>{{ m.aguardando }}</strong><span>Na fila</span>
                  </div>
                </div>
                <div class="pn-stage-time">
                  <div class="row"><span>Média</span><strong>{{ dur(m.mediaSeg) }}</strong></div>
                  <div class="row"><span>p90</span><strong>{{ dur(m.p90Seg) }}</strong></div>
                  <div class="row"><span>Meta</span><strong>{{ m.etapa.metaMinutos ? dur(m.etapa.metaMinutos * 60) : '—' }}</strong></div>
                  <div class="fx-bar" *ngIf="m.etapa.metaMinutos && m.mediaSeg != null"
                       [style.--bar]="(m.mediaSeg || 0) > m.etapa.metaMinutos * 60 ? '#dc2626' : '#10b981'">
                    <span [style.width.%]="pctMeta(m)"></span>
                  </div>
                </div>
                <div class="pn-stage-foot">
                  <span *ngIf="m.estouradosAbertos" class="fx-chip fx-chip--alert">{{ m.estouradosAbertos }} acima da meta</span>
                  <span *ngIf="!m.estouradosAbertos && m.maisAntigoAbertoSeg != null">mais antiga: {{ dur(m.maisAntigoAbertoSeg) }}</span>
                  <span *ngIf="!m.estouradosAbertos && m.maisAntigoAbertoSeg == null">{{ m.concluidas }} {{ m.concluidas === 1 ? 'saída' : 'saídas' }} no período</span>
                </div>
              </button>
            </div>
          </div>
        </section>

        <section class="pn-charts">
          <div class="fx-card">
            <div class="fx-card-head">
              <h2>Permanência por etapa</h2>
              <span class="fx-hint">média, p90 e meta (horas)</span>
            </div>
            <div class="fx-card-body pn-chart-box">
              <p-chart *ngIf="temDadosPermanencia; else semPermanencia" type="bar" [data]="chartPermanencia" [options]="chartPermanenciaOpts" height="320px"></p-chart>
              <ng-template #semPermanencia>
                <div class="fx-empty-state">
                  <span class="ico"><i class="pi pi-chart-bar"></i></span>
                  <strong>Nenhum dado registrado para o período selecionado</strong>
                  <span>A permanência aparece assim que alguma OS tiver entrada e saída registradas em uma etapa.</span>
                </div>
              </ng-template>
            </div>
          </div>
          <div class="fx-card">
            <div class="fx-card-head">
              <h2>Vazão diária</h2>
              <span class="fx-hint">entradas, saídas e fluxos concluídos</span>
            </div>
            <div class="fx-card-body pn-chart-box">
              <p-chart *ngIf="temDadosVazao; else semVazao" type="line" [data]="chartVazao" [options]="chartVazaoOpts" height="320px"></p-chart>
              <ng-template #semVazao>
                <div class="fx-empty-state">
                  <span class="ico"><i class="pi pi-chart-line"></i></span>
                  <strong>Nenhum dado registrado para o período selecionado</strong>
                  <span>Entradas, saídas e fluxos concluídos aparecem aqui conforme as leituras forem feitas na Estação de bipagem.</span>
                </div>
              </ng-template>
            </div>
          </div>
        </section>

        <section class="fx-card">
          <div class="fx-card-head pn-tabs-head">
            <div class="pn-tabs">
              <button type="button" [class.on]="aba === 'ABERTOS'" (click)="aba = 'ABERTOS'">
                Em aberto agora <span class="fx-chip fx-chip--muted">{{ d.abertos.length }}</span>
              </button>
              <button type="button" [class.on]="aba === 'HISTORICO'" (click)="abrirHistorico()">Todas as OS no fluxo</button>
              <button type="button" [class.on]="aba === 'EQUIPE'" (click)="aba = 'EQUIPE'">Equipe e leituras</button>
            </div>
            <div class="pn-filters" *ngIf="aba === 'ABERTOS'">
              <span class="fx-chip fx-chip--accent" *ngIf="filtroEtapaId">
                {{ nomeEtapa(filtroEtapaId) }} <i class="pi pi-times" style="cursor:pointer" (click)="filtroEtapaId = null"></i>
              </span>
              <div class="pn-seg">
                <button type="button" [class.on]="filtroTipo === null" (click)="filtroTipo = null">Todas</button>
                <button type="button" [class.on]="filtroTipo === 'EM_ETAPA'" (click)="filtroTipo = 'EM_ETAPA'">Em etapa</button>
                <button type="button" [class.on]="filtroTipo === 'AGUARDANDO'" (click)="filtroTipo = 'AGUARDANDO'">Aguardando</button>
                <button type="button" [class.on]="filtroTipo === 'ESTOURADO'" (click)="filtroTipo = 'ESTOURADO'">Acima da meta</button>
              </div>
              <div class="pn-search">
                <i class="pi pi-filter"></i>
                <input [(ngModel)]="filtroTexto" aria-label="Filtrar esta lista" placeholder="Filtrar esta lista: OS, cliente, PN, SN…" />
                <i class="pi pi-times pn-clear" *ngIf="filtroTexto" (click)="filtroTexto = ''" pTooltip="Limpar filtro"></i>
              </div>
            </div>
            <div class="pn-filters" *ngIf="aba === 'HISTORICO'">
              <div class="pn-seg">
                <button type="button" [class.on]="histSituacao === null" (click)="histSituacao = null; carregarHistorico(0)">Todas</button>
                <button type="button" [class.on]="histSituacao === 'EM_ETAPA'" (click)="histSituacao = 'EM_ETAPA'; carregarHistorico(0)">Em etapa</button>
                <button type="button" [class.on]="histSituacao === 'AGUARDANDO'" (click)="histSituacao = 'AGUARDANDO'; carregarHistorico(0)">Aguardando</button>
                <button type="button" [class.on]="histSituacao === 'CONCLUIDO'" (click)="histSituacao = 'CONCLUIDO'; carregarHistorico(0)">Concluídas</button>
              </div>
              <div class="pn-search"><i class="pi pi-filter"></i><input [(ngModel)]="histQ" (keydown.enter)="carregarHistorico(0)" aria-label="Filtrar esta lista" placeholder="Filtrar esta lista e Enter…" /></div>
            </div>
          </div>

          <div class="pn-table-wrap" *ngIf="aba === 'ABERTOS'">
            <table class="fx-table">
              <thead>
                <tr>
                  <th>OS</th><th>Cliente</th><th>PN / SN</th><th>Etapa</th><th>Situação</th>
                  <th>Desde</th><th class="r">Tempo</th><th>Registrado por</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of abertosFiltrados; trackBy: trackAberto" class="is-click" (click)="abrirDetalhe(a.os.id)">
                  <td><strong>{{ a.os.codigo }}</strong><div class="fx-muted pn-small" *ngIf="a.os.mecanicoNome"><i class="pi pi-wrench"></i> {{ a.os.mecanicoNome }}</div></td>
                  <td>{{ a.os.cliente || '—' }}</td>
                  <td class="fx-mono pn-small">{{ a.os.partNumber || '—' }}<br />{{ a.os.serialNumber || '—' }}</td>
                  <td>
                    <span class="pn-etapa-cell" *ngIf="a.etapa" [style.--stage]="a.etapa.cor || '#334155'">
                      <span class="sw"></span>{{ a.etapa.ordem }}. {{ a.etapa.nome }}
                    </span>
                  </td>
                  <td>
                    <span class="fx-chip" [ngClass]="a.tipo === 'EM_ETAPA' ? 'fx-chip--live' : 'fx-chip--wait'">
                      <span class="dot"></span>{{ a.tipo === 'EM_ETAPA' ? 'Em execução' : 'Na fila' }}
                    </span>
                  </td>
                  <td class="pn-small">{{ dataHora(a.desde) }}</td>
                  <td class="r">
                    <strong class="fx-num" [class.pn-late]="a.estourado">{{ dur(a.decorridoSeg) }}</strong>
                    <div class="pn-small fx-muted" *ngIf="a.metaMinutos">meta {{ dur(a.metaMinutos * 60) }}</div>
                  </td>
                  <td class="pn-small">{{ a.usuarioNome || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="fx-empty" *ngIf="!abertosFiltrados.length">
              <i class="pi pi-check-circle"></i>
              <span>Nenhuma OS em aberto para os filtros selecionados.</span>
            </div>
          </div>

          <div class="pn-table-wrap" *ngIf="aba === 'HISTORICO'">
            <div class="fx-loading" *ngIf="histLoading"><p-progressSpinner strokeWidth="3" [style]="{ width: '36px', height: '36px' }"></p-progressSpinner></div>
            <table class="fx-table" *ngIf="!histLoading">
              <thead>
                <tr><th>OS</th><th>Cliente</th><th>PN / SN</th><th>Etapa atual</th><th>Situação</th><th>Progresso</th><th>Início do fluxo</th><th class="r">Na situação há</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let it of histItens" class="is-click" (click)="abrirDetalhe(it.os.id)">
                  <td><strong>{{ it.os.codigo }}</strong></td>
                  <td>{{ it.os.cliente || '—' }}</td>
                  <td class="fx-mono pn-small">{{ it.os.partNumber || '—' }}<br />{{ it.os.serialNumber || '—' }}</td>
                  <td>
                    <span class="pn-etapa-cell" *ngIf="it.etapa" [style.--stage]="it.etapa.cor || '#334155'">
                      <span class="sw"></span>{{ it.etapa.ordem }}. {{ it.etapa.nome }}
                    </span>
                  </td>
                  <td><span class="fx-chip" [ngClass]="chipSituacao(it.os.fluxoSituacao)"><span class="dot"></span>{{ situacao(it.os.fluxoSituacao) }}</span></td>
                  <td style="min-width:140px">
                    <div class="fx-bar" [style.--bar]="it.os.fluxoSituacao === 'CONCLUIDO' ? '#10b981' : '#0e7490'">
                      <span [style.width.%]="it.totalEtapas ? (100 * it.etapasConcluidas / it.totalEtapas) : 0"></span>
                    </div>
                    <div class="pn-small fx-muted">{{ it.etapasConcluidas }}/{{ it.totalEtapas }} etapas</div>
                  </td>
                  <td class="pn-small">{{ dataHora(it.inicioFluxoEm) }}</td>
                  <td class="r fx-num">{{ it.os.fluxoSituacao === 'CONCLUIDO' ? '—' : dur(it.desdeSeg) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="fx-empty" *ngIf="!histLoading && !histItens.length"><i class="pi pi-inbox"></i><span>Nenhuma OS encontrada.</span></div>
            <div class="pn-pager" *ngIf="histTotal > histSize">
              <button type="button" [disabled]="histPage === 0" (click)="carregarHistorico(histPage - 1)"><i class="pi pi-angle-left"></i></button>
              <span>{{ histPage * histSize + 1 }}–{{ min((histPage + 1) * histSize, histTotal) }} de {{ histTotal }}</span>
              <button type="button" [disabled]="(histPage + 1) * histSize >= histTotal" (click)="carregarHistorico(histPage + 1)"><i class="pi pi-angle-right"></i></button>
            </div>
          </div>

          <div class="pn-team" *ngIf="aba === 'EQUIPE'">
            <div>
              <h3>Registros por usuário <small>no período</small></h3>
              <table class="fx-table">
                <thead><tr><th>Usuário</th><th class="r">Entradas</th><th class="r">Saídas</th><th class="r">Permanência média</th></tr></thead>
                <tbody>
                  <tr *ngFor="let u of d.porUsuario">
                    <td><span class="pn-avatar">{{ iniciais(u.nome) }}</span> {{ u.nome }}</td>
                    <td class="r fx-num">{{ u.entradas }}</td>
                    <td class="r fx-num">{{ u.saidas }}</td>
                    <td class="r fx-num">{{ dur(u.mediaEtapaSeg) }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="fx-empty" *ngIf="!d.porUsuario.length"><i class="pi pi-users"></i><span>Sem registros no período.</span></div>
            </div>
            <div>
              <h3>Últimas leituras <small>todas as estações</small></h3>
              <div class="pn-feed">
                <div class="pn-feed-item" *ngFor="let ev of d.ultimosEventos" [class.err]="!ev.sucesso"
                     [class.is-click]="!!ev.osId" (click)="ev.osId && abrirDetalhe(ev.osId)">
                  <span class="pn-feed-dot" [style.background]="ev.sucesso ? (ev.etapaCor || '#10b981') : '#dc2626'"></span>
                  <div class="pn-feed-body">
                    <div class="top">
                      <strong>{{ labelAcao(ev.acao) }}{{ ev.etapaNome ? ' · ' + ev.etapaNome : '' }}</strong>
                      <span class="fx-mono">{{ dataHora(ev.ocorridoEm) }}</span>
                    </div>
                    <div class="msg">{{ ev.mensagem }}</div>
                    <div class="who">{{ ev.usuarioNome || '—' }}{{ ev.estacao ? ' · ' + ev.estacao : '' }}{{ ev.codigoOsLido ? ' · lido: ' + ev.codigoOsLido : '' }}</div>
                  </div>
                </div>
                <div class="fx-empty" *ngIf="!d.ultimosEventos.length"><i class="pi pi-inbox"></i><span>Nenhuma leitura registrada ainda.</span></div>
              </div>
            </div>
          </div>
        </section>
      </ng-container>
    </div>
  `,
  styles: [`
    .pn-hero { position: sticky; top: 0; z-index: 30; flex-direction: column; align-items: stretch; gap: 14px; padding-top: 14px; padding-bottom: 14px; }
    @media (max-height: 760px), (max-width: 900px) { .pn-hero { position: relative; } }
    .pn-hero-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .pn-title { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .pn-title h1 { margin: 2px 0 0; font-size: clamp(1.25rem, 1.8vw, 1.6rem); }
    .pn-back {
      display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; flex: 0 0 auto;
      color: #e2e8f0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16); text-decoration: none;
    }
    .pn-back:hover { background: rgba(255,255,255,0.16); }
    .pn-info { color: #94a3b8; cursor: help; font-size: 0.95rem; }
    .pn-hero-right { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: flex-end; }
    .pn-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .pn-period { display: inline-flex; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); border-radius: 12px; padding: 3px; }
    .pn-period button { font: inherit; font-size: 0.82rem; font-weight: 600; color: #cbd5e1; background: transparent; border: 0; padding: 7px 12px; border-radius: 9px; cursor: pointer; }
    .pn-period button.on { background: #f8fafc; color: #0f172a; }
    .pn-custom { display: flex; gap: 8px; align-items: center; color: #cbd5e1; font-size: 0.84rem; }
    .pn-custom input { background: rgba(255,255,255,0.95); border: 0; border-radius: 8px; padding: 6px 8px; font: inherit; color: #0f172a; }
    .pn-refresh { display: flex; gap: 10px; align-items: center; color: #cbd5e1; font-size: 0.78rem; }
    .pn-refresh button { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); color: #e2e8f0; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; }
    .pn-auto { display: inline-flex; gap: 6px; align-items: center; cursor: pointer; }
    .pn-audit { display: flex; align-items: center; gap: 8px; background: #fff; border-radius: 12px; padding: 4px 4px 4px 4px; flex: 1 1 380px; max-width: 560px; color: #475569; }
    .pn-audit:focus-within { box-shadow: 0 0 0 3px rgba(20,184,166,0.45); }
    .pn-scope {
      flex: 0 0 auto; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
      color: #0f766e; background: #ccfbf1; border-radius: 8px; padding: 5px 8px;
    }
    .pn-audit input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: inherit; color: #0f172a; padding: 8px 0; }
    .pn-audit input::placeholder { color: #64748b; }
    .pn-kbd { display: inline-flex; gap: 3px; flex: 0 0 auto; cursor: help; }
    .pn-kbd kbd {
      font: 600 0.68rem/1 'IBM Plex Mono', Consolas, monospace; color: #334155; background: #f1f5f9;
      border: 1px solid #cbd5e1; border-bottom-width: 2px; border-radius: 5px; padding: 3px 6px;
    }
    .pn-audit button { border: 0; background: #0f766e; color: #fff; font: inherit; font-weight: 600; border-radius: 9px; padding: 8px 14px; cursor: pointer; }
    .pn-audit button:disabled { opacity: 0.5; cursor: default; }

    .pn-pipeline-card { margin-bottom: 18px; }
    .pn-legend { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 0.8rem; color: var(--muted); }
    .pn-legend span { display: inline-flex; align-items: center; gap: 6px; }
    .pn-legend .sw { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
    .pn-legend .sw.live { background: var(--live); }
    .pn-legend .sw.wait { background: var(--wait); }

    /* column-gap precisa bater com o recuo de ±7px das linhas da esteira (.pn-step::before/::after). */
    .pn-pipeline {
      display: grid; grid-auto-flow: column; grid-auto-columns: minmax(208px, 1fr); column-gap: 14px;
      overflow-x: auto; padding: 8px 20px 20px; scroll-snap-type: x proximity;
    }
    .pn-col { display: flex; flex-direction: column; gap: 10px; min-width: 0; scroll-snap-align: start; }
    .pn-step { position: relative; height: 34px; display: flex; align-items: center; justify-content: center; }
    .pn-step::before, .pn-step::after {
      content: ''; position: absolute; top: 50%; height: 4px; margin-top: -2px; background: var(--stage); opacity: 0.45;
    }
    .pn-step::before { left: -7px; right: 50%; }
    .pn-step::after { left: 50%; right: -7px; }
    .pn-step.first::before, .pn-step.last::after { display: none; }
    .pn-step-num {
      position: relative; z-index: 1; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center;
      font-family: Manrope, sans-serif; font-weight: 800; font-size: 0.9rem; color: #fff; background: var(--stage);
      border: 3px solid #fff; box-shadow: 0 0 0 1px var(--stage), 0 2px 6px rgba(15,23,42,0.18);
    }
    .pn-step.busy .pn-step-num::after {
      content: ''; position: absolute; inset: -6px; border-radius: 50%; border: 2px solid var(--stage); opacity: 0;
      animation: pn-pulse 2s ease-out infinite;
    }
    @keyframes pn-pulse { 0% { transform: scale(0.8); opacity: 0.7; } 100% { transform: scale(1.35); opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .pn-step.busy .pn-step-num::after { animation: none; opacity: 0.5; } }
    .pn-col.sel .pn-step-num { transform: scale(1.12); }
    .pn-step-num { cursor: help; }
    .pn-step-num:focus-visible { outline: 3px solid rgba(14,116,144,0.5); outline-offset: 2px; }
    ::ng-deep .pn-step-tip { max-width: 300px; }
    ::ng-deep .pn-step-tip .p-tooltip-text { background: #0f172a; color: #e2e8f0; font-size: 0.8rem; line-height: 1.45; padding: 10px 12px; border-radius: 10px; }
    ::ng-deep .pn-step-tip .p-tooltip-arrow { border-bottom-color: #0f172a !important; }
    ::ng-deep .pn-step-tip .tt-name { font-weight: 700; font-size: 0.88rem; color: #fff; margin-bottom: 2px; }
    ::ng-deep .pn-step-tip .tt-lbl { color: #94a3b8; }
    ::ng-deep .pn-step-tip .tt-sep { height: 1px; background: #334155; margin: 6px 0; }

    .pn-stage {
      flex: 1; text-align: left; font: inherit; color: inherit; cursor: pointer;
      background: #fff; border: 1px solid var(--line); border-top: 3px solid var(--stage);
      border-radius: 14px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;
      transition: box-shadow .15s ease, transform .15s ease, border-color .15s ease;
    }
    .pn-stage:hover { box-shadow: 0 10px 22px rgba(15,23,42,0.08); transform: translateY(-2px); }
    .pn-stage:focus-visible { outline: 3px solid rgba(14,116,144,0.45); outline-offset: 2px; }
    .pn-col.sel .pn-stage { box-shadow: 0 0 0 2px var(--stage), 0 10px 22px rgba(15,23,42,0.1); }
    .pn-stage-head { display: flex; gap: 10px; align-items: flex-start; }
    .pn-stage-title { min-width: 0; }
    .pn-stage-name { font-family: Manrope, sans-serif; font-weight: 800; font-size: 0.95rem; line-height: 1.2; color: var(--ink); min-height: 2.4em; }
    .pn-stage-setor { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); font-weight: 600; margin-top: 2px; }

    .pn-stage-nums { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .pn-count { border-radius: 10px; padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .pn-count strong {
      display: block; font-family: Manrope, sans-serif; font-size: 1.75rem; font-weight: 800; line-height: 1;
      color: #64748b; font-variant-numeric: tabular-nums;
    }
    .pn-count span { display: block; margin-top: 5px; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; }
    .pn-count.live.on { background: var(--live-soft); border-color: #fdba74; }
    .pn-count.live.on strong { color: var(--live); }
    .pn-count.live.on span { color: #9a3412; }
    .pn-count.wait.on { background: var(--wait-soft); border-color: #c4b5fd; }
    .pn-count.wait.on strong { color: var(--wait); }
    .pn-count.wait.on span { color: #5b21b6; }

    .pn-stage-time { display: flex; flex-direction: column; gap: 2px; font-size: 0.78rem; padding-top: 8px; border-top: 1px dashed #e2e8f0; }
    .pn-stage-time .row { display: flex; justify-content: space-between; color: var(--muted); }
    .pn-stage-time .row strong { color: #1e293b; font-weight: 600; font-variant-numeric: tabular-nums; }
    .pn-stage-time .fx-bar { margin-top: 5px; height: 6px; }
    .pn-stage-foot { font-size: 0.76rem; min-height: 22px; color: var(--muted); margin-top: auto; }

    .pn-charts { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; margin-bottom: 18px; }
    @media (max-width: 1100px) { .pn-charts { grid-template-columns: 1fr; } }
    .pn-chart-box { height: 340px; }

    .pn-tabs-head { border-bottom: 1px solid var(--line-soft); padding-bottom: 12px; }
    .pn-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
    .pn-tabs button { font: inherit; font-weight: 700; font-size: 0.9rem; color: var(--muted); background: transparent; border: 0; padding: 8px 12px; border-radius: 10px; cursor: pointer; display: inline-flex; gap: 8px; align-items: center; }
    .pn-tabs button.on { background: #0f172a; color: #fff; }
    .pn-tabs button.on .fx-chip { background: rgba(255,255,255,0.15); color: #fff; border-color: transparent; }
    .pn-filters { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .pn-seg { display: inline-flex; background: #f1f5f9; border-radius: 10px; padding: 3px; }
    .pn-seg button { font: inherit; font-size: 0.8rem; font-weight: 600; color: var(--muted); background: transparent; border: 0; padding: 6px 10px; border-radius: 8px; cursor: pointer; }
    .pn-seg button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 3px rgba(15,23,42,0.1); }
    .pn-search { display: flex; align-items: center; gap: 8px; border: 1px solid var(--line); border-radius: 10px; padding: 0 10px; color: var(--muted); background: #fff; }
    .pn-search input { border: 0; outline: none; font: inherit; padding: 7px 0; min-width: 240px; background: transparent; color: var(--ink); }
    .pn-search input::placeholder { color: #64748b; }
    .pn-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(14,116,144,0.15); }
    .pn-clear { cursor: pointer; font-size: 0.75rem; }

    .pn-table-wrap { max-height: 560px; overflow: auto; }
    .pn-small { font-size: 0.78rem; }
    .pn-late { color: var(--alert); }
    .pn-etapa-cell { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
    .pn-etapa-cell .sw { width: 10px; height: 10px; border-radius: 3px; background: var(--stage); }
    .pn-pager { display: flex; justify-content: flex-end; gap: 10px; align-items: center; padding: 12px 20px; color: var(--muted); font-size: 0.84rem; }
    .pn-pager button { border: 1px solid var(--line); background: #fff; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; }
    .pn-pager button:disabled { opacity: 0.4; cursor: default; }

    .pn-team { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 14px 20px 20px; }
    @media (max-width: 1000px) { .pn-team { grid-template-columns: 1fr; } }
    .pn-team h3 { margin: 0 0 10px; font-family: Manrope, sans-serif; font-size: 0.98rem; }
    .pn-team h3 small { color: var(--muted); font-weight: 500; font-family: 'IBM Plex Sans', sans-serif; }
    .pn-avatar { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 8px; background: #0f766e; color: #fff; font-size: 0.7rem; font-weight: 800; margin-right: 6px; }
    .pn-feed { display: flex; flex-direction: column; gap: 8px; max-height: 480px; overflow: auto; }
    .pn-feed-item { display: flex; gap: 10px; padding: 10px 12px; border: 1px solid var(--line-soft); border-radius: 12px; background: #fff; }
    .pn-feed-item.is-click { cursor: pointer; }
    .pn-feed-item.is-click:hover { border-color: #a5f3fc; }
    .pn-feed-item.err { background: #fffafa; border-color: #fee2e2; }
    .pn-feed-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex: 0 0 auto; }
    .pn-feed-body { min-width: 0; flex: 1; }
    .pn-feed-body .top { display: flex; justify-content: space-between; gap: 8px; font-size: 0.85rem; }
    .pn-feed-body .top span { color: var(--muted); font-size: 0.76rem; }
    .pn-feed-body .msg { font-size: 0.8rem; color: #334155; margin-top: 2px; }
    .pn-feed-body .who { font-size: 0.74rem; color: var(--muted); margin-top: 2px; }
  `]
})
export class OsFluxoPainelComponent implements OnInit, OnDestroy {
  private api = inject(OsFluxoService);
  private router = inject(Router);
  private messages = inject(MessageService);

  presets: { label: string; value: PeriodoPreset }[] = [
    { label: 'Hoje', value: 'HOJE' },
    { label: '7 dias', value: '7D' },
    { label: '30 dias', value: '30D' },
    { label: '90 dias', value: '90D' },
    { label: 'Período', value: 'CUSTOM' }
  ];
  preset: PeriodoPreset = '30D';
  de = '';
  ate = '';

  dash: FluxoDashboard | null = null;
  loading = false;
  autoRefresh = true;
  private timer: any;

  aba: Aba = 'ABERTOS';
  filtroEtapaId: number | null = null;
  filtroTipo: 'EM_ETAPA' | 'AGUARDANDO' | 'ESTOURADO' | null = null;
  filtroTexto = '';
  buscaOs = '';
  buscaFocada = false;
  tooltipsEtapa: Record<number, string> = {};
  @ViewChild('buscaGlobal') private buscaGlobalRef?: ElementRef<HTMLInputElement>;

  histItens: FluxoOsListaItem[] = [];
  histTotal = 0;
  histPage = 0;
  histSize = 25;
  histSituacao: string | null = null;
  histQ = '';
  histLoading = false;
  private histCarregado = false;

  chartPermanencia: any = null;
  chartVazao: any = null;
  temDadosPermanencia = false;
  temDadosVazao = false;
  chartPermanenciaOpts: any = {
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: '#334155', font: { size: 12 } } },
      tooltip: { callbacks: { label: (c: any) => `${c.dataset.label}: ${this.horasLabel(c.raw)}` } }
    },
    scales: {
      x: { beginAtZero: true, title: { display: true, text: 'horas', color: '#475569' }, grid: { color: '#e2e8f0' }, ticks: { color: '#475569' } },
      y: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#334155' } }
    }
  };
  chartVazaoOpts: any = {
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: '#334155', font: { size: 12 } } } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0, color: '#475569' }, grid: { color: '#e2e8f0' } },
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12, color: '#475569' } }
    }
  };

  ngOnInit(): void {
    this.aplicarPreset('30D');
    this.configurarAutoRefresh();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  @HostListener('document:keydown', ['$event'])
  onAtalho(ev: KeyboardEvent): void {
    const ctrlK = (ev.ctrlKey || ev.metaKey) && !ev.altKey && ev.key.toLowerCase() === 'k';
    const barra = ev.key === '/' && !ev.ctrlKey && !ev.metaKey && !ev.altKey && !this.editando(ev.target);
    if (!ctrlK && !barra) return;
    const input = this.buscaGlobalRef?.nativeElement;
    if (!input) return;
    ev.preventDefault();
    input.focus();
    input.select();
  }

  private editando(alvo: EventTarget | null): boolean {
    const el = alvo as HTMLElement | null;
    if (!el) return false;
    return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
  }

  aplicarPreset(p: PeriodoPreset): void {
    this.preset = p;
    const hoje = new Date();
    if (p !== 'CUSTOM') {
      const dias = p === 'HOJE' ? 0 : p === '7D' ? 6 : p === '30D' ? 29 : 89;
      const ini = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dias);
      this.de = dataIso(ini);
      this.ate = dataIso(hoje);
    } else if (!this.de || !this.ate) {
      this.de = dataIso(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
      this.ate = dataIso(hoje);
    }
    this.carregar();
  }

  configurarAutoRefresh(): void {
    clearInterval(this.timer);
    if (this.autoRefresh) {
      this.timer = setInterval(() => {
        if (!document.hidden && !this.loading) this.carregar(true);
      }, 60000);
    }
  }

  carregar(silencioso = false): void {
    if (!silencioso) this.loading = true;
    this.api.dashboard(this.de, this.ate).subscribe({
      next: (d) => {
        this.dash = d;
        this.loading = false;
        this.montarGraficos(d);
        this.montarTooltipsEtapa(d);
        if (this.aba === 'HISTORICO' && silencioso) this.carregarHistorico(this.histPage, true);
      },
      error: (err) => {
        this.loading = false;
        this.messages.add({ severity: 'error', summary: 'Fluxo', detail: err?.error?.mensagem || 'Falha ao carregar o painel do fluxo.' });
      }
    });
  }

  abrirHistorico(): void {
    this.aba = 'HISTORICO';
    if (!this.histCarregado) this.carregarHistorico(0);
  }

  carregarHistorico(page: number, silencioso = false): void {
    if (!silencioso) this.histLoading = true;
    this.api.listarOs({ situacao: this.histSituacao, q: this.histQ.trim() || null, page, size: this.histSize }).subscribe({
      next: (p) => {
        this.histItens = p.items;
        this.histTotal = p.total;
        this.histPage = p.page;
        this.histLoading = false;
        this.histCarregado = true;
      },
      error: (err) => {
        this.histLoading = false;
        this.messages.add({ severity: 'error', summary: 'Fluxo', detail: err?.error?.mensagem || 'Falha ao listar OS.' });
      }
    });
  }

  get abertosFiltrados(): FluxoAberto[] {
    const lista = this.dash?.abertos || [];
    const q = this.filtroTexto.trim().toLowerCase();
    return lista.filter(a => {
      if (this.filtroEtapaId && a.etapa?.id !== this.filtroEtapaId) return false;
      if (this.filtroTipo === 'EM_ETAPA' && a.tipo !== 'EM_ETAPA') return false;
      if (this.filtroTipo === 'AGUARDANDO' && a.tipo !== 'AGUARDANDO') return false;
      if (this.filtroTipo === 'ESTOURADO' && !a.estourado) return false;
      if (!q) return true;
      return [a.os.codigo, a.os.cliente, a.os.partNumber, a.os.serialNumber, a.os.numOsOriginal, a.usuarioNome, a.etapa?.nome]
        .some(v => (v || '').toString().toLowerCase().includes(q));
    });
  }

  filtrarEtapa(id: number): void {
    this.filtroEtapaId = this.filtroEtapaId === id ? null : id;
    this.aba = 'ABERTOS';
  }

  auditarOs(): void {
    const raw = this.buscaOs.trim().toUpperCase().replace(/\s+/g, '');
    const m = /^(?:OS[-_]?|BEL[-_/]?)?0*(\d{1,12})(?:[/\-_]\d{2,4})?$/.exec(raw);
    if (!m) {
      this.messages.add({ severity: 'warn', summary: 'Auditar OS', detail: 'Informe o número da OS (ex.: 2531 ou BEL-2531/2026).' });
      return;
    }
    this.abrirDetalhe(Number(m[1]));
  }

  abrirDetalhe(id: number): void {
    this.router.navigate(['/os/fluxo/os', id]);
  }

  private montarGraficos(d: FluxoDashboard): void {
    const horas = (s?: number | null) => (s == null ? null : Math.round((s / 3600) * 100) / 100);
    this.temDadosPermanencia = d.etapas.some(m => m.mediaSeg != null || m.p90Seg != null);
    this.temDadosVazao = d.throughput.some(t => (t.entradas || 0) + (t.saidas || 0) + (t.concluidas || 0) > 0);
    this.chartPermanencia = {
      labels: d.etapas.map(m => `${m.etapa.ordem}. ${m.etapa.nome}`),
      datasets: [
        { label: 'Média', data: d.etapas.map(m => horas(m.mediaSeg)), backgroundColor: d.etapas.map(m => (m.etapa.cor || '#0e7490') + 'cc'), borderRadius: 6, barPercentage: 0.8 },
        { label: 'p90', data: d.etapas.map(m => horas(m.p90Seg)), backgroundColor: '#8492a6', borderRadius: 6, barPercentage: 0.8 },
        { label: 'Meta', data: d.etapas.map(m => (m.etapa.metaMinutos ? Math.round((m.etapa.metaMinutos / 60) * 100) / 100 : null)), backgroundColor: 'rgba(0,0,0,0)', borderColor: '#dc2626', borderWidth: 2, borderDash: [4, 3], borderRadius: 6, barPercentage: 0.8 }
      ]
    };
    this.chartVazao = {
      labels: d.throughput.map(t => this.diaCurto(t.dia)),
      datasets: [
        { label: 'Entradas', data: d.throughput.map(t => t.entradas), borderColor: '#0e7490', backgroundColor: 'rgba(14,116,144,0.12)', fill: true, tension: 0.35, pointRadius: 2 },
        { label: 'Saídas', data: d.throughput.map(t => t.saidas), borderColor: '#b45309', backgroundColor: 'rgba(180,83,9,0.06)', fill: false, tension: 0.35, pointRadius: 2 },
        { label: 'Fluxos concluídos', data: d.throughput.map(t => t.concluidas), borderColor: '#047857', backgroundColor: '#047857', type: 'bar', borderRadius: 4, barPercentage: 0.5 }
      ]
    };
  }

  private operadoresAgora(d: FluxoDashboard, etapaId: number): string[] {
    const nomes = d.abertos
      .filter(a => a.tipo === 'EM_ETAPA' && a.etapa?.id === etapaId && a.usuarioNome)
      .map(a => a.usuarioNome as string);
    return [...new Set(nomes)];
  }

  private montarTooltipsEtapa(d: FluxoDashboard): void {
    const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    const mapa: Record<number, string> = {};
    for (const m of d.etapas) {
      const e = m.etapa;
      const operadores = this.operadoresAgora(d, e.id);
      const ultima = d.ultimosEventos.find(ev => ev.sucesso && ev.etapaId === e.id);
      mapa[e.id] = [
        `<div class="tt-name">${e.ordem}. ${esc(e.nome)}</div>`,
        `<div><span class="tt-lbl">Setor responsável:</span> ${esc(e.setor || 'não definido')}</div>`,
        `<div class="tt-sep"></div>`,
        `<div><span class="tt-lbl">Em execução por:</span> ${operadores.length ? esc(operadores.join(', ')) : 'ninguém no momento'}</div>`,
        `<div><span class="tt-lbl">Última leitura:</span> ${ultima ? esc(`${ultima.usuarioNome || '—'} · ${this.dataHora(ultima.ocorridoEm)}`) : 'sem leituras recentes'}</div>`,
        `<div><span class="tt-lbl">Meta:</span> ${e.metaMinutos ? this.dur(e.metaMinutos * 60) : 'não definida'}</div>`
      ].join('');
    }
    this.tooltipsEtapa = mapa;
  }

  resumoEtapa(m: FluxoEtapaMetrica): string {
    const operadores = this.dash ? this.operadoresAgora(this.dash, m.etapa.id) : [];
    return `Etapa ${m.etapa.ordem}: ${m.etapa.nome}. Setor responsável: ${m.etapa.setor || 'não definido'}. `
      + `${m.emAndamento} na etapa, ${m.aguardando} na fila.`
      + (operadores.length ? ` Em execução por ${operadores.join(', ')}.` : '');
  }

  pctMeta(m: FluxoEtapaMetrica): number {
    if (!m.etapa.metaMinutos || m.mediaSeg == null) return 0;
    return Math.min(100, (100 * m.mediaSeg) / (m.etapa.metaMinutos * 60));
  }

  corPct(p?: number | null): string {
    if (p == null) return '#94a3b8';
    if (p >= 85) return '#047857';
    if (p >= 60) return '#b45309';
    return '#b91c1c';
  }

  chipSituacao(s?: string | null): string {
    return s === 'EM_ETAPA' ? 'fx-chip--live' : s === 'AGUARDANDO' ? 'fx-chip--wait' : s === 'CONCLUIDO' ? 'fx-chip--done' : 'fx-chip--muted';
  }

  nomeEtapa(id: number): string {
    return this.dash?.etapas.find(m => m.etapa.id === id)?.etapa.nome || '';
  }

  labelAcao(a: string): string {
    return a === 'ENTRADA' ? 'Entrada' : a === 'SAIDA' ? 'Saída' : a === 'ESTORNO' ? 'Estorno' : a === 'AJUSTE' ? 'Ajuste' : a === 'AUTO' ? 'Leitura' : 'Leitura';
  }

  trackAberto(_: number, a: FluxoAberto): string {
    return `${a.tipo}-${a.registroId ?? a.os.id}`;
  }

  iniciais(nome?: string | null): string {
    const parts = (nome || '?').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  dur(s?: number | null): string {
    return formatarDuracao(s);
  }

  dataHora(v?: string | null): string {
    return formatarDataHora(v);
  }

  situacao(s?: string | null): string {
    return labelSituacao(s);
  }

  private diaCurto(iso: string): string {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  }

  private horasLabel(h: number | null): string {
    if (h == null) return '—';
    return formatarDuracao(h * 3600);
  }
}
