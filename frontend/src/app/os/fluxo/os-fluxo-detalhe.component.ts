import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService, SharedModule } from 'primeng/api';
import { Subscription } from 'rxjs';
import { OsEtiquetaDialogComponent } from './os-etiqueta-dialog.component';
import { OS_FLUXO_FUNCIONALIDADE } from '../../auth/fluxo-os.guard';
import { OsFluxoPermissaoService } from './os-fluxo-permissao.service';
import {
  FluxoDetalhe, FluxoEtapaStatus, FluxoEvento, FluxoRegistro, OsFluxoService, formatarDataHora,
  formatarDuracao, labelSituacao, parseDataLocal
} from './os-fluxo.service';

interface CicloFluxo {
  numero: number;
  atual: boolean;
  registros: FluxoRegistro[];
  inicioEm: string | null;
  fimEm: string | null;
  zeradoPor: string | null;
  zeradoIp: string | null;
  motivo: string | null;
  tempoSeg: number;
  etapasConcluidas: number;
}

interface GanttLinha {
  etapa: FluxoEtapaStatus;
  barras: { left: number; width: number; aberto: boolean; forcado: boolean; estourado: boolean; tip: string }[];
}

@Component({
  standalone: true,
  selector: 'app-os-fluxo-detalhe',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DialogModule, InputTextareaModule, TooltipModule,
    ProgressSpinnerModule, ToastModule, SharedModule, OsEtiquetaDialogComponent],
  providers: [MessageService],
  styleUrls: ['./fluxo-shared.css'],
  template: `
    <p-toast></p-toast>
    <div class="fx-shell">
      <div class="fx-loading" *ngIf="loading && !det">
        <p-progressSpinner strokeWidth="3" [style]="{ width: '44px', height: '44px' }"></p-progressSpinner>
      </div>

      <div class="fx-card fx-empty dt-notfound" *ngIf="!loading && erro">
        <i class="pi pi-exclamation-circle"></i>
        <span>{{ erro }}</span>
        <a routerLink="/os/fluxo">Voltar ao painel</a>
      </div>

      <ng-container *ngIf="det as d">
        <header class="fx-hero">
          <div>
            <button pButton type="button" icon="pi pi-arrow-left" class="p-button-text p-button-sm fx-back"
                    label="Painel do fluxo" routerLink="/os/fluxo"></button>
            <p class="fx-eyebrow">Auditoria do fluxo</p>
            <h1>{{ d.os.codigo }}</h1>
            <div class="dt-meta">
              <span><i class="pi pi-building"></i> {{ d.os.cliente || 'Cliente não informado' }}</span>
              <span class="fx-mono">PN {{ d.os.partNumber || '—' }}</span>
              <span class="fx-mono">SN {{ d.os.serialNumber || '—' }}</span>
              <span *ngIf="d.os.numOsOriginal">OS original {{ d.os.numOsOriginal }}</span>
              <span *ngIf="d.os.mecanicoNome"><i class="pi pi-wrench"></i> {{ d.os.mecanicoNome }}</span>
            </div>
            <div class="dt-state">
              <span class="dt-sit" [attr.data-s]="d.os.fluxoSituacao || 'NAO'">
                <span class="dot"></span>{{ situacao(d.os.fluxoSituacao) }}
                <ng-container *ngIf="etapaAtualNome"> · {{ etapaAtualNome }}</ng-container>
              </span>
              <span class="dt-next" *ngIf="d.proximaEtapa && d.os.fluxoSituacao !== 'CONCLUIDO'">
                Próxima etapa: <strong>{{ d.proximaEtapa.nome }}</strong>
              </span>
            </div>
          </div>
          <div class="fx-hero-actions">
            <button type="button" class="fx-ghost-btn" (click)="mostrarEtiqueta = true"><i class="pi pi-tag"></i> Etiqueta da OS</button>
            <button type="button" class="fx-ghost-btn" (click)="abrirOs()"><i class="pi pi-external-link"></i> Abrir OS</button>
            <a class="fx-ghost-btn" *ngIf="podeAjustar" [routerLink]="['/os/fluxo/ajuste', d.os.id]"><i class="pi pi-sliders-h"></i> Ajustar etapas</a>
            <button type="button" class="fx-ghost-btn" *ngIf="d.podeGerir && d.registros.length" (click)="abrirEstorno()">
              <i class="pi pi-undo"></i> Estornar última leitura
            </button>
            <button type="button" class="fx-ghost-btn" (click)="carregar()" pTooltip="Atualizar"><i class="pi pi-refresh" [class.pi-spin]="loading"></i></button>
          </div>
        </header>

        <section class="fx-kpis">
          <div class="fx-kpi" style="--kpi-color:#0e7490">
            <div class="fx-kpi-label">Início do fluxo</div>
            <div class="fx-kpi-value dt-kpi-sm">{{ dataHora(d.resumo.inicioEm) }}</div>
            <div class="fx-kpi-sub">{{ d.resumo.fimEm ? 'Concluído em ' + dataHora(d.resumo.fimEm) : 'em andamento' }}</div>
          </div>
          <div class="fx-kpi" style="--kpi-color:#6d28d9">
            <div class="fx-kpi-label">{{ d.resumo.fimEm ? 'Ciclo total' : 'Ciclo decorrido' }}</div>
            <div class="fx-kpi-value">{{ dur(d.resumo.cicloSeg) }}</div>
            <div class="fx-kpi-sub">da 1ª entrada {{ d.resumo.fimEm ? 'à saída final' : 'até agora' }}</div>
          </div>
          <div class="fx-kpi" style="--kpi-color:#b45309">
            <div class="fx-kpi-label">Tempo em etapas</div>
            <div class="fx-kpi-value">{{ dur(d.resumo.tempoEmEtapasSeg) }}</div>
            <div class="fx-kpi-sub">trabalho efetivo registrado</div>
          </div>
          <div class="fx-kpi" style="--kpi-color:#7c3aed">
            <div class="fx-kpi-label">Tempo em fila</div>
            <div class="fx-kpi-value">{{ dur(d.resumo.tempoEsperaSeg) }}</div>
            <div class="fx-kpi-sub">entre saída e próxima entrada</div>
          </div>
          <div class="fx-kpi" [style.--kpi-color]="corEficiencia(d.resumo.eficienciaPct)">
            <div class="fx-kpi-label">Eficiência do fluxo</div>
            <div class="fx-kpi-value">{{ d.resumo.eficienciaPct != null ? (d.resumo.eficienciaPct | number:'1.0-1') + '%' : '—' }}</div>
            <div class="fx-kpi-sub">tempo em etapas ÷ ciclo</div>
          </div>
          <div class="fx-kpi" [style.--kpi-color]="(d.resumo.forcados + d.resumo.anulados) ? '#b91c1c' : '#047857'">
            <div class="fx-kpi-label">Etapas concluídas</div>
            <div class="fx-kpi-value">{{ d.resumo.etapasConcluidas }}/{{ d.resumo.totalEtapas }}</div>
            <div class="fx-kpi-sub">{{ d.resumo.forcados }} forçadas · {{ d.resumo.anulados }} anuladas · {{ d.resumo.rejeicoes }} recusas</div>
          </div>
        </section>

        <section class="fx-card dt-block">
          <div class="fx-card-head"><h2>Etapas</h2><span class="fx-hint">permanência acumulada por etapa (inclui retrabalho)</span></div>
          <div class="dt-stepper">
            <div class="dt-step" *ngFor="let s of d.etapas" [attr.data-status]="s.status" [class.late]="s.estourado"
                 [style.--stage]="s.etapa.cor || '#334155'">
              <div class="dt-step-icon">
                <i class="pi" [ngClass]="s.status === 'CONCLUIDA' ? 'pi-check' : (s.status === 'EM_ANDAMENTO' ? 'pi-spin pi-cog' : '')"></i>
                <span *ngIf="s.status === 'PENDENTE'">{{ s.etapa.ordem }}</span>
              </div>
              <div class="dt-step-name">{{ s.etapa.nome }}</div>
              <div class="dt-step-time fx-num">{{ s.totalSeg != null ? dur(s.totalSeg) : '—' }}</div>
              <div class="dt-step-sub">
                <span *ngIf="s.etapa.metaMinutos">meta {{ dur(s.etapa.metaMinutos * 60) }}</span>
                <span *ngIf="s.passagens > 1" class="fx-chip fx-chip--wait">{{ s.passagens }} passagens</span>
              </div>
            </div>
          </div>
        </section>

        <section class="fx-card dt-block" *ngIf="gantt.length && totalGanttSeg > 0">
          <div class="fx-card-head">
            <h2>Linha do tempo<ng-container *ngIf="ciclos.length > 1"> · ciclo {{ ciclos.length }} (atual)</ng-container></h2>
            <span class="fx-hint">{{ dataHora(d.resumo.inicioEm) }} → {{ d.resumo.fimEm ? dataHora(d.resumo.fimEm) : 'agora' }} · espaços vazios = fila entre etapas</span>
          </div>
          <div class="fx-card-body">
            <div class="dt-gantt">
              <div class="dt-g-row" *ngFor="let g of gantt" [style.--stage]="g.etapa.etapa.cor || '#334155'">
                <div class="dt-g-label">{{ g.etapa.etapa.ordem }}. {{ g.etapa.etapa.nome }}</div>
                <div class="dt-g-track">
                  <span class="dt-g-bar" *ngFor="let b of g.barras" [class.open]="b.aberto" [class.forced]="b.forcado" [class.late]="b.estourado"
                        [style.left.%]="b.left" [style.width.%]="b.width" [pTooltip]="b.tip" tooltipPosition="top"></span>
                </div>
              </div>
              <div class="dt-g-axis">
                <span *ngFor="let t of ganttTicks" [style.left.%]="t.left">{{ t.label }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="fx-card dt-block">
          <div class="fx-card-head">
            <h2>Registros de entrada e saída</h2>
            <span class="fx-hint">{{ d.registros.length }} passagens<ng-container *ngIf="ciclos.length > 1"> em {{ ciclos.length }} ciclos</ng-container> · horários com segundos</span>
          </div>
          <div class="dt-cycles-note" *ngIf="ciclos.length > 1">
            <i class="pi pi-info-circle"></i>
            <span>O fluxo desta OS foi zerado {{ ciclos.length - 1 === 1 ? 'uma vez' : (ciclos.length - 1) + ' vezes' }}. As passagens dos ciclos anteriores
              continuam aqui para auditoria, mas não contam no status, no tempo de ciclo nem nas métricas.</span>
          </div>
          <div class="dt-table-wrap">
            <table class="fx-table">
              <thead>
                <tr>
                  <th>#</th><th>Etapa</th><th>Entrada</th><th>Saída</th>
                  <th class="r">Permanência</th><th class="r">Fila antes</th><th>Ocorrências</th>
                </tr>
              </thead>
              <tbody>
               <ng-container *ngFor="let c of ciclos; trackBy: trackCiclo">
                <tr class="dt-cycle" *ngIf="ciclos.length > 1" [class.is-current]="c.atual">
                  <td colspan="7">
                    <button type="button" class="dt-cycle-head" (click)="alternarCiclo(c)" [attr.aria-expanded]="!recolhido(c)">
                      <i class="pi dt-cycle-chev" [ngClass]="recolhido(c) ? 'pi-chevron-right' : 'pi-chevron-down'"></i>
                      <span class="dt-cycle-tag">Ciclo {{ c.numero }}</span>
                      <span class="dt-cycle-state">{{ c.atual ? 'Ciclo atual' : 'Zerado' }}</span>
                      <span class="dt-cycle-period fx-mono">
                        {{ c.inicioEm ? dataHora(c.inicioEm) : 'sem passagens' }}
                        <i class="pi pi-arrow-right"></i>
                        {{ c.atual ? 'agora' : dataHora(c.fimEm) }}
                      </span>
                      <span class="dt-cycle-stats">
                        {{ c.registros.length }} passage{{ c.registros.length === 1 ? 'm' : 'ns' }}
                        <ng-container *ngIf="c.tempoSeg"> · {{ dur(c.tempoSeg) }} em etapas</ng-container>
                        <ng-container *ngIf="c.etapasConcluidas"> · {{ c.etapasConcluidas }} etapa{{ c.etapasConcluidas === 1 ? '' : 's' }} concluída{{ c.etapasConcluidas === 1 ? '' : 's' }}</ng-container>
                      </span>
                    </button>
                    <div class="dt-cycle-reset" *ngIf="!c.atual">
                      <i class="pi pi-refresh"></i>
                      <span>Fluxo zerado em <b class="fx-mono">{{ dataHora(c.fimEm, true) }}</b> por <b>{{ c.zeradoPor || '—' }}</b><ng-container *ngIf="c.zeradoIp"> ({{ c.zeradoIp }})</ng-container><ng-container *ngIf="c.motivo">. Motivo: “{{ c.motivo }}”</ng-container></span>
                    </div>
                  </td>
                </tr>
                <ng-container *ngIf="!recolhido(c)">
                <tr class="dt-cycle-empty" *ngIf="ciclos.length > 1 && !c.registros.length">
                  <td colspan="7"><i class="pi pi-hourglass"></i> Nenhuma passagem neste ciclo ainda. A próxima leitura deve ser a entrada em <strong>{{ d.proximaEtapa?.nome || 'primeira etapa' }}</strong>.</td>
                </tr>
                <tr *ngFor="let r of c.registros" [class.dt-void]="r.anulado" [class.dt-in-old]="!c.atual">
                  <td class="fx-mono">{{ r.sequencia }}</td>
                  <td>
                    <span class="dt-etapa" [style.--stage]="r.etapaCor || '#334155'"><span class="sw"></span>{{ r.etapaNome }}</span>
                  </td>
                  <td>
                    <div class="fx-mono">{{ dataHora(r.entradaEm, true) }}</div>
                    <div class="dt-who"><i class="pi pi-user"></i> {{ r.entradaUsuarioNome || '—' }}</div>
                    <div class="dt-origin">{{ origem(r.entradaOrigem) }}{{ r.entradaEstacao ? ' · ' + r.entradaEstacao : '' }}</div>
                  </td>
                  <td>
                    <ng-container *ngIf="r.saidaEm; else semSaida">
                      <div class="fx-mono">{{ dataHora(r.saidaEm, true) }}</div>
                      <div class="dt-who"><i class="pi pi-user"></i> {{ r.saidaUsuarioNome || '—' }}</div>
                      <div class="dt-origin">{{ origem(r.saidaOrigem) }}{{ r.saidaEstacao ? ' · ' + r.saidaEstacao : '' }}</div>
                    </ng-container>
                    <ng-template #semSaida>
                      <span class="fx-chip" [ngClass]="r.anulado ? 'fx-chip--muted' : 'fx-chip--live'"><span class="dot"></span>{{ r.anulado ? 'sem saída' : 'em andamento' }}</span>
                    </ng-template>
                  </td>
                  <td class="r">
                    <strong class="fx-num" [class.dt-late]="estourou(r)">{{ r.saidaEm ? dur(r.duracaoSegundos) : (r.anulado ? '—' : dur(decorrido(r.entradaEm)) + ' ↻') }}</strong>
                    <div class="dt-origin" *ngIf="r.metaMinutos">meta {{ dur(r.metaMinutos * 60) }}</div>
                  </td>
                  <td class="r fx-num">{{ r.esperaAnteriorSegundos != null ? dur(r.esperaAnteriorSegundos) : '—' }}</td>
                  <td class="dt-flags">
                    <span class="fx-chip fx-chip--alert" *ngIf="r.forcado"><i class="pi pi-unlock"></i> forçada</span>
                    <span class="fx-chip fx-chip--muted" *ngIf="r.anulado" [pTooltip]="'Anulado por ' + (r.anuladoUsuarioNome || '—') + ' em ' + dataHora(r.anuladoEm) + ': ' + (r.anuladoMotivo || '')">
                      <i class="pi pi-ban"></i> anulado
                    </span>
                    <div class="dt-obs" *ngIf="r.observacao">{{ r.observacao }}</div>
                    <div class="dt-obs" *ngIf="r.anulado && r.anuladoMotivo">Motivo: {{ r.anuladoMotivo }}</div>
                  </td>
                </tr>
                </ng-container>
               </ng-container>
              </tbody>
            </table>
            <div class="fx-empty" *ngIf="!d.registros.length">
              <i class="pi pi-qrcode"></i>
              <span>Esta OS ainda não entrou no fluxo. A primeira leitura deve ser a entrada em <strong>{{ d.proximaEtapa?.nome }}</strong>.</span>
            </div>
          </div>
        </section>

        <section class="fx-card dt-block">
          <div class="fx-card-head">
            <h2>Log de leituras e ajustes</h2>
            <div class="dt-log-filter">
              <button type="button" [class.on]="filtroLog === 'TODOS'" (click)="filtroLog = 'TODOS'">Todos ({{ d.eventos.length }})</button>
              <button type="button" [class.on]="filtroLog === 'OK'" (click)="filtroLog = 'OK'">Aceitos</button>
              <button type="button" [class.on]="filtroLog === 'ERRO'" (click)="filtroLog = 'ERRO'">Recusados ({{ d.resumo.rejeicoes }})</button>
            </div>
          </div>
          <div class="dt-table-wrap">
            <table class="fx-table">
              <thead><tr><th>Data/hora</th><th>Ação</th><th>Resultado</th><th>Mensagem</th><th>Usuário</th><th>Origem</th><th>Código lido</th></tr></thead>
              <tbody>
                <tr *ngFor="let ev of eventosFiltrados" [class.dt-log-reset]="ehZeragem(ev)">
                  <td class="fx-mono">{{ dataHora(ev.ocorridoEm, true) }}</td>
                  <td>{{ acao(ev.acao) }}<div class="dt-origin" *ngIf="ev.etapaNome">{{ ev.etapaNome }}</div></td>
                  <td><span class="fx-chip" [ngClass]="ev.sucesso ? 'fx-chip--done' : 'fx-chip--alert'">{{ ev.sucesso ? 'aceito' : 'recusado' }}</span></td>
                  <td class="dt-msg">{{ ev.mensagem }}</td>
                  <td>{{ ev.usuarioNome || '—' }}<div class="dt-origin">{{ ev.ip }}</div></td>
                  <td>{{ origem(ev.origem) }}<div class="dt-origin" *ngIf="ev.estacao">{{ ev.estacao }}</div></td>
                  <td class="fx-mono dt-origin">{{ ev.codigoOsLido || '—' }}{{ ev.codigoEtapaLido ? ' / ' + ev.codigoEtapaLido : '' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="fx-empty" *ngIf="!eventosFiltrados.length"><i class="pi pi-inbox"></i><span>Sem eventos.</span></div>
          </div>
        </section>
      </ng-container>
    </div>

    <app-os-etiqueta-dialog [(visible)]="mostrarEtiqueta" [os]="det?.os || null"></app-os-etiqueta-dialog>

    <p-dialog [(visible)]="mostrarEstorno" [modal]="true" [draggable]="false" [resizable]="false" header="Estornar última leitura"
              [style]="{ width: '520px', maxWidth: '95vw' }">
      <ng-container *ngIf="ultimoRegistro as u">
        <p class="dlg-text">
          <ng-container *ngIf="u.saidaEm">A <strong>saída</strong> de <strong>{{ u.etapaNome }}</strong> em {{ dataHora(u.saidaEm, true) }} ({{ u.saidaUsuarioNome }}) será desfeita e a etapa voltará a ficar aberta.</ng-container>
          <ng-container *ngIf="!u.saidaEm">A <strong>entrada</strong> em <strong>{{ u.etapaNome }}</strong> em {{ dataHora(u.entradaEm, true) }} ({{ u.entradaUsuarioNome }}) será anulada.</ng-container>
          O estorno fica registrado no log com seu usuário e motivo — nada é apagado.
        </p>
      </ng-container>
      <textarea pInputTextarea [(ngModel)]="motivoEstorno" rows="3" class="dlg-area" placeholder="Motivo (mínimo 5 caracteres)"></textarea>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" (click)="mostrarEstorno = false"></button>
        <button pButton type="button" label="Confirmar estorno" icon="pi pi-undo" class="p-button-danger"
                [disabled]="motivoEstorno.trim().length < 5 || estornando" [loading]="estornando" (click)="confirmarEstorno()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .dt-notfound { margin-top: 40px; }
    .dt-meta { display: flex; flex-wrap: wrap; gap: 8px 18px; color: #cbd5e1; font-size: 0.9rem; }
    .dt-meta i { opacity: 0.7; margin-right: 4px; }
    .dt-state { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-top: 14px; }
    .dt-sit { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; font-weight: 700; font-size: 0.86rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); }
    .dt-sit .dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
    .dt-sit[data-s='EM_ETAPA'] .dot { background: #f59e0b; box-shadow: 0 0 0 4px rgba(245,158,11,0.25); }
    .dt-sit[data-s='AGUARDANDO'] .dot { background: #a78bfa; }
    .dt-sit[data-s='CONCLUIDO'] .dot { background: #34d399; }
    .dt-next { color: #cbd5e1; font-size: 0.88rem; }
    .dt-kpi-sm { font-size: 1.1rem !important; }
    .dt-block { margin-bottom: 18px; }

    .dt-stepper { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(118px, 1fr); gap: 0; overflow-x: auto; padding: 8px 20px 20px; }
    .dt-step { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; padding: 0 6px; }
    .dt-step::before { content: ''; position: absolute; top: 19px; left: -50%; width: 100%; height: 3px; background: #e2e8f0; z-index: 0; }
    .dt-step:first-child::before { display: none; }
    .dt-step[data-status='CONCLUIDA']::before, .dt-step[data-status='EM_ANDAMENTO']::before { background: var(--stage); }
    .dt-step-icon {
      position: relative; z-index: 1; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
      background: #fff; border: 2px solid #cbd5e1; color: #94a3b8; font-weight: 800; font-family: Manrope, sans-serif;
    }
    .dt-step[data-status='CONCLUIDA'] .dt-step-icon { background: var(--stage); border-color: var(--stage); color: #fff; }
    .dt-step[data-status='EM_ANDAMENTO'] .dt-step-icon { border-color: var(--stage); color: var(--stage); box-shadow: 0 0 0 6px color-mix(in srgb, var(--stage) 18%, transparent); }
    .dt-step.late .dt-step-icon { box-shadow: 0 0 0 3px #fecaca; }
    .dt-step-name { font-size: 0.8rem; font-weight: 700; line-height: 1.2; min-height: 2.4em; }
    .dt-step-time { font-family: Manrope, sans-serif; font-weight: 800; font-size: 0.98rem; }
    .dt-step.late .dt-step-time { color: var(--alert); }
    .dt-step[data-status='PENDENTE'] .dt-step-time, .dt-step[data-status='PENDENTE'] .dt-step-name { color: #94a3b8; }
    .dt-step-sub { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.72rem; color: var(--muted); }

    .dt-gantt { position: relative; }
    .dt-g-row { display: grid; grid-template-columns: 210px 1fr; align-items: center; gap: 12px; height: 30px; }
    .dt-g-label { font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dt-g-track { position: relative; height: 16px; background: repeating-linear-gradient(90deg, #f8fafc 0 1px, transparent 1px 10%); border-radius: 6px; background-color: #f8fafc; }
    .dt-g-bar { position: absolute; top: 0; height: 100%; min-width: 4px; border-radius: 5px; background: var(--stage); opacity: 0.9; cursor: default; }
    .dt-g-bar.open { background: repeating-linear-gradient(45deg, var(--stage) 0 8px, color-mix(in srgb, var(--stage) 60%, #fff) 8px 16px); animation: slide 1s linear infinite; background-size: 22px 22px; }
    .dt-g-bar.forced { outline: 2px dashed #dc2626; outline-offset: 1px; }
    .dt-g-bar.late { box-shadow: 0 0 0 2px #fecaca; }
    @keyframes slide { from { background-position: 0 0; } to { background-position: 22px 0; } }
    .dt-g-axis { position: relative; margin-left: 222px; height: 22px; border-top: 1px solid var(--line); margin-top: 6px; }
    .dt-g-axis span { position: absolute; top: 4px; transform: translateX(-50%); font-size: 0.7rem; color: var(--muted); white-space: nowrap; }
    .dt-g-axis span:first-child { transform: none; }
    .dt-g-axis span:last-child { transform: translateX(-100%); }
    @media (max-width: 720px) { .dt-g-row { grid-template-columns: 110px 1fr; } .dt-g-axis { margin-left: 122px; } }

    .dt-table-wrap { overflow: auto; max-height: 620px; }
    .dt-etapa { display: inline-flex; gap: 8px; align-items: center; font-weight: 700; }
    .dt-etapa .sw { width: 10px; height: 10px; border-radius: 3px; background: var(--stage); }
    .dt-who { font-size: 0.8rem; color: #334155; margin-top: 2px; }
    .dt-who i { font-size: 0.7rem; opacity: 0.6; }
    .dt-origin { font-size: 0.74rem; color: var(--muted); }
    .dt-late { color: var(--alert); }
    .dt-flags { display: flex; flex-wrap: wrap; gap: 6px; align-items: flex-start; max-width: 320px; }
    .dt-obs { width: 100%; font-size: 0.76rem; color: var(--muted); }
    tr.dt-void td { background: repeating-linear-gradient(135deg, #fafafa 0 8px, #f4f4f5 8px 16px); color: #94a3b8; }
    tr.dt-void .dt-etapa { text-decoration: line-through; }

    .dt-cycles-note {
      display: flex; gap: 10px; align-items: flex-start; margin: 0 20px 12px; padding: 10px 14px; border-radius: 12px;
      background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a; font-size: 0.84rem; line-height: 1.45;
    }
    .dt-cycles-note i { margin-top: 2px; }
    tr.dt-cycle td { padding: 0 !important; background: #f8fafc; border-top: 2px solid #cbd5e1; }
    tr.dt-cycle.is-current td { background: #eff6ff; border-top-color: #2563eb; }
    .dt-cycle-head {
      width: 100%; display: flex; align-items: center; flex-wrap: wrap; gap: 8px 14px; padding: 12px 16px; text-align: left;
      background: transparent; border: 0; cursor: pointer; font: inherit; color: #1f2937;
    }
    .dt-cycle-head:hover { background: rgba(15, 23, 42, 0.03); }
    .dt-cycle-chev { font-size: 0.78rem; color: #64748b; }
    .dt-cycle-tag { font-family: Manrope, sans-serif; font-weight: 800; font-size: 0.98rem; color: #111827; }
    .dt-cycle-state {
      padding: 2px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase;
      background: #e5e7eb; color: #374151;
    }
    tr.dt-cycle.is-current .dt-cycle-state { background: #2563eb; color: #fff; }
    tr.dt-cycle:not(.is-current) .dt-cycle-state { background: #fee2e2; color: #991b1b; }
    .dt-cycle-period { display: inline-flex; align-items: center; gap: 8px; font-size: 0.84rem; color: #374151; }
    .dt-cycle-period i { font-size: 0.66rem; color: #94a3b8; }
    .dt-cycle-stats { margin-left: auto; font-size: 0.82rem; color: #4b5563; }
    .dt-cycle-reset {
      display: flex; gap: 8px; align-items: flex-start; margin: -4px 16px 12px 38px; padding: 8px 12px; border-radius: 10px;
      background: #fef2f2; border: 1px dashed #fca5a5; color: #7f1d1d; font-size: 0.82rem; line-height: 1.45;
    }
    .dt-cycle-reset i { margin-top: 3px; font-size: 0.74rem; }
    tr.dt-cycle-empty td { color: #4b5563; font-size: 0.86rem; padding: 14px 16px 14px 38px !important; }
    tr.dt-cycle-empty i { margin-right: 6px; color: #94a3b8; }
    tr.dt-log-reset td { background: #fef2f2; }
    tr.dt-log-reset td:first-child { box-shadow: inset 3px 0 0 #dc2626; }
    .dt-msg { max-width: 420px; font-size: 0.82rem; }
    .dt-log-filter { display: inline-flex; background: #f1f5f9; border-radius: 10px; padding: 3px; }
    .dt-log-filter button { font: inherit; font-size: 0.8rem; font-weight: 600; color: var(--muted); background: transparent; border: 0; padding: 6px 10px; border-radius: 8px; cursor: pointer; }
    .dt-log-filter button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 3px rgba(15,23,42,0.1); }

    .dlg-text { margin: 0 0 12px; color: #475569; line-height: 1.5; }
    .dlg-area { width: 100%; }
  `]
})
export class OsFluxoDetalheComponent implements OnInit, OnDestroy {
  private api = inject(OsFluxoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messages = inject(MessageService);
  readonly podeAjustar = inject(OsFluxoPermissaoService).has(OS_FLUXO_FUNCIONALIDADE.AJUSTE);

  osId = 0;
  det: FluxoDetalhe | null = null;
  loading = false;
  erro: string | null = null;

  gantt: GanttLinha[] = [];
  ganttTicks: { left: number; label: string }[] = [];
  totalGanttSeg = 0;

  filtroLog: 'TODOS' | 'OK' | 'ERRO' = 'TODOS';

  ciclos: CicloFluxo[] = [];
  private ciclosRecolhidos = new Set<number>();

  mostrarEtiqueta = false;
  mostrarEstorno = false;
  motivoEstorno = '';
  estornando = false;

  private sub?: Subscription;
  private timer: any;

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(pm => {
      this.osId = Number(pm.get('id'));
      this.det = null;
      this.carregar();
    });
    this.timer = setInterval(() => {
      if (!document.hidden && this.det?.os.fluxoSituacao === 'EM_ETAPA' && !this.mostrarEstorno) this.carregar(true);
    }, 60000);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    clearInterval(this.timer);
  }

  carregar(silencioso = false): void {
    if (!this.osId) {
      this.erro = 'OS inválida.';
      return;
    }
    if (!silencioso) this.loading = true;
    this.api.detalhe(this.osId).subscribe({
      next: (d) => {
        this.det = d;
        this.erro = null;
        this.loading = false;
        this.montarGantt(d);
      },
      error: (err) => {
        this.loading = false;
        this.erro = err?.error?.mensagem || 'Não foi possível carregar o fluxo desta OS.';
      }
    });
  }

  get etapaAtualNome(): string | null {
    const d = this.det;
    if (!d?.os.fluxoEtapaId) return null;
    return d.etapas.find(s => s.etapa.id === d.os.fluxoEtapaId)?.etapa.nome || null;
  }

  get eventosFiltrados() {
    const ev = this.det?.eventos || [];
    if (this.filtroLog === 'OK') return ev.filter(e => e.sucesso);
    if (this.filtroLog === 'ERRO') return ev.filter(e => !e.sucesso);
    return ev;
  }

  get ultimoRegistro(): FluxoRegistro | null {
    const validos = (this.det?.registros || []).filter(r => !r.anulado);
    return validos.length ? validos[validos.length - 1] : null;
  }

  /** Zeramento = ajuste sem etapa de destino (o backend grava etapaId nulo apenas para ZERAR). */
  ehZeragem(ev: FluxoEvento): boolean {
    return ev.acao === 'AJUSTE' && ev.sucesso && !ev.etapaId;
  }

  private montarCiclos(d: FluxoDetalhe): void {
    const t = (v?: string | null) => parseDataLocal(v)?.getTime() ?? 0;
    const zeragens = d.eventos.filter(ev => this.ehZeragem(ev)).sort((a, b) => t(a.ocorridoEm) - t(b.ocorridoEm));
    const ciclos: CicloFluxo[] = [...zeragens, null].map((z, i) => {
      const msg = z?.mensagem || '';
      const pos = msg.indexOf('Motivo: ');
      return {
        numero: i + 1, atual: !z, registros: [], inicioEm: null, fimEm: z?.ocorridoEm ?? null,
        zeradoPor: z?.usuarioNome ?? null, zeradoIp: z?.ip ?? null,
        motivo: pos >= 0 ? msg.slice(pos + 8).trim() || null : null, tempoSeg: 0, etapasConcluidas: 0
      };
    });
    for (const r of d.registros) {
      const ent = t(r.entradaEm);
      const idx = zeragens.filter(z => t(z.ocorridoEm) <= ent).length;
      ciclos[Math.min(idx, ciclos.length - 1)].registros.push(r);
    }
    for (const c of ciclos) {
      c.inicioEm = c.registros[0]?.entradaEm ?? null;
      const fim = t(c.fimEm);
      const efetivos = c.registros.filter(r => !r.anulado || (!c.atual && t(r.anuladoEm) >= fim - 1000));
      c.tempoSeg = efetivos.filter(r => r.saidaEm && r.entradaOrigem !== 'AJUSTE')
        .reduce((s, r) => s + (r.duracaoSegundos ?? 0), 0);
      c.etapasConcluidas = new Set(efetivos.filter(r => r.saidaEm).map(r => r.etapaId)).size;
    }
    this.ciclos = ciclos;
  }

  recolhido(c: CicloFluxo): boolean {
    return this.ciclosRecolhidos.has(c.numero);
  }

  alternarCiclo(c: CicloFluxo): void {
    if (!this.ciclosRecolhidos.delete(c.numero)) this.ciclosRecolhidos.add(c.numero);
  }

  trackCiclo = (_: number, c: CicloFluxo) => c.numero;

  private montarGantt(d: FluxoDetalhe): void {
    this.montarCiclos(d);
    const inicio = parseDataLocal(d.resumo.inicioEm);
    if (!inicio) {
      this.gantt = [];
      this.totalGanttSeg = 0;
      return;
    }
    const fim = parseDataLocal(d.resumo.fimEm) || parseDataLocal(d.geradoEm) || new Date();
    const total = Math.max(1, (fim.getTime() - inicio.getTime()) / 1000);
    this.totalGanttSeg = total;
    const validos = d.registros.filter(r => !r.anulado);
    this.gantt = d.etapas.map(s => ({
      etapa: s,
      barras: validos.filter(r => r.etapaId === s.etapa.id).map(r => {
        const ent = parseDataLocal(r.entradaEm)!;
        const sai = parseDataLocal(r.saidaEm) || fim;
        const left = Math.max(0, ((ent.getTime() - inicio.getTime()) / 1000 / total) * 100);
        const width = Math.max(0.4, Math.min(100 - left, (((sai.getTime() - ent.getTime()) / 1000) / total) * 100));
        const durSeg = r.saidaEm ? (r.duracaoSegundos ?? 0) : (sai.getTime() - ent.getTime()) / 1000;
        return {
          left, width, aberto: !r.saidaEm, forcado: !!r.forcado,
          estourado: !!r.metaMinutos && durSeg > r.metaMinutos * 60,
          tip: `${r.etapaNome}: ${this.dataHora(r.entradaEm)} → ${r.saidaEm ? this.dataHora(r.saidaEm) : 'em andamento'} (${this.dur(durSeg)})`
        };
      })
    }));
    const ticks = 6;
    this.ganttTicks = Array.from({ length: ticks + 1 }, (_, i) => {
      const t = new Date(inicio.getTime() + (total * 1000 * i) / ticks);
      const p = (n: number) => String(n).padStart(2, '0');
      const label = total > 3 * 86400
        ? `${p(t.getDate())}/${p(t.getMonth() + 1)}`
        : `${p(t.getDate())}/${p(t.getMonth() + 1)} ${p(t.getHours())}:${p(t.getMinutes())}`;
      return { left: (100 * i) / ticks, label };
    });
  }

  abrirOs(): void {
    this.router.navigate(['/os'], { queryParams: { editId: String(this.osId) } });
  }

  abrirEstorno(): void {
    this.motivoEstorno = '';
    this.mostrarEstorno = true;
  }

  confirmarEstorno(): void {
    this.estornando = true;
    this.api.estornar(this.osId, this.motivoEstorno.trim()).subscribe({
      next: (d) => {
        this.estornando = false;
        this.mostrarEstorno = false;
        this.det = d;
        this.montarGantt(d);
        this.messages.add({ severity: 'success', summary: 'Estorno registrado', detail: 'A última leitura foi estornada e registrada no log.' });
      },
      error: (err) => {
        this.estornando = false;
        this.messages.add({ severity: 'error', summary: 'Estorno', detail: err?.error?.mensagem || 'Falha ao estornar.' });
      }
    });
  }

  estourou(r: FluxoRegistro): boolean {
    if (!r.metaMinutos || r.anulado) return false;
    const seg = r.saidaEm ? (r.duracaoSegundos ?? 0) : this.decorrido(r.entradaEm);
    return seg > r.metaMinutos * 60;
  }

  decorrido(v?: string | null): number {
    const d = parseDataLocal(v);
    return d ? Math.max(0, (Date.now() - d.getTime()) / 1000) : 0;
  }

  corEficiencia(p?: number | null): string {
    if (p == null) return '#94a3b8';
    if (p >= 70) return '#047857';
    if (p >= 40) return '#b45309';
    return '#b91c1c';
  }

  origem(o?: string | null): string {
    switch (o) {
      case 'SCANNER': return 'Leitor';
      case 'MANUAL': return 'Digitação manual';
      case 'AJUSTE': return 'Ajuste administrativo';
      default: return o || '—';
    }
  }

  acao(a: string): string {
    switch (a) {
      case 'ENTRADA': return 'Entrada';
      case 'SAIDA': return 'Saída';
      case 'ESTORNO': return 'Estorno';
      case 'AJUSTE': return 'Ajuste de etapa';
      case 'AUTO': return 'Leitura automática';
      default: return 'Leitura';
    }
  }

  dur(s?: number | null): string {
    return formatarDuracao(s);
  }

  dataHora(v?: string | null, seg = false): string {
    return formatarDataHora(v, seg);
  }

  situacao(s?: string | null): string {
    return labelSituacao(s);
  }
}
