import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService, SharedModule } from 'primeng/api';
import { Subject, Subscription, catchError, debounceTime, map, of, switchMap, tap } from 'rxjs';
import {
  FluxoAjusteDirecao, FluxoAjusteEfeitoTipo, FluxoAjustePlano, FluxoAjusteRequest, FluxoDetalhe, FluxoEtapa,
  FluxoEtapaStatus, FluxoEvento, FluxoSugestaoOs, OsFluxoService, formatarDataHora, formatarDuracao, labelSituacao
} from './os-fluxo.service';

/** Posição linear no fluxo: 0 = não iniciada; cada etapa tem "em andamento" e "concluída". */
interface Posicao {
  idx: number;
  tipo: 'ZERO' | 'EM' | 'CONC';
  etapa?: FluxoEtapa;
}

interface LinhaEtapa {
  status: FluxoEtapaStatus;
  em: Posicao;
  conc: Posicao;
}

const DIRECOES: Record<FluxoAjusteDirecao, { titulo: string; icone: string; verbo: string }> = {
  AVANCO: { titulo: 'Avançar etapas', icone: 'pi-forward', verbo: 'Aplicar avanço' },
  RETROCESSO: { titulo: 'Voltar etapas', icone: 'pi-backward', verbo: 'Aplicar retorno' },
  ZERAR: { titulo: 'Zerar fluxo', icone: 'pi-refresh', verbo: 'Zerar fluxo' },
  REPOSICIONAR: { titulo: 'Reposicionar', icone: 'pi-arrows-h', verbo: 'Aplicar ajuste' },
  SEM_MUDANCA: { titulo: 'Sem mudança', icone: 'pi-minus-circle', verbo: 'Aplicar ajuste' }
};

const EFEITOS: Record<FluxoAjusteEfeitoTipo, { rotulo: string; icone: string }> = {
  ANULAR: { rotulo: 'Anular passagem', icone: 'pi-ban' },
  FECHAR: { rotulo: 'Registrar saída', icone: 'pi-sign-out' },
  REABRIR: { rotulo: 'Reabrir etapa', icone: 'pi-replay' },
  CRIAR_ABERTO: { rotulo: 'Registrar entrada', icone: 'pi-sign-in' },
  CRIAR_CONCLUIDO: { rotulo: 'Marcar concluída', icone: 'pi-check-circle' }
};

@Component({
  standalone: true,
  selector: 'app-os-fluxo-ajuste',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DialogModule, InputTextareaModule, TooltipModule,
    ToastModule, SharedModule],
  providers: [MessageService],
  styleUrls: ['./fluxo-shared.css'],
  template: `
    <p-toast></p-toast>
    <div class="fx-shell aj">
      <header class="fx-hero aj-hero">
        <div class="aj-hero-main">
          <button pButton type="button" icon="pi pi-arrow-left" class="p-button-text p-button-sm fx-back"
                  label="Painel do fluxo" routerLink="/os/fluxo"></button>
          <p class="fx-eyebrow">Administração do fluxo da OS</p>
          <h1 class="aj-title">Ajuste de etapas<span class="fx-mono" *ngIf="det?.os?.codigo">OS: {{ det!.os.codigo }}</span></h1>
          <p class="fx-lead">
            Zere, volte ou avance a posição de uma OS no fluxo. Todo ajuste é simulado antes de ser aplicado,
            exige motivo e fica registrado na auditoria. Nada é apagado.
          </p>
        </div>
        <div class="aj-role"><i class="pi pi-shield"></i><span>Requer a permissão<br><strong>Ajuste de Etapas</strong></span></div>
      </header>

      <section class="aj-finder">
        <div class="aj-search" #buscaBox [class.is-open]="painelBusca && busca.trim()">
          <i class="pi pi-search aj-search-ico"></i>
          <input #buscaInput type="text" [(ngModel)]="busca" (ngModelChange)="onBusca($event)" (focus)="painelBusca = true"
                 (keydown)="onBuscaKey($event)" placeholder="Buscar OS por número, SN, PN ou cliente" autocomplete="off"
                 spellcheck="false" aria-label="Buscar OS" role="combobox" [attr.aria-expanded]="painelBusca && !!sugestoes.length" />
          <i class="pi pi-spin pi-spinner aj-search-spin" *ngIf="buscando"></i>
          <kbd class="aj-kbd" *ngIf="!busca">/</kbd>
          <button type="button" class="aj-search-clear" *ngIf="busca" (click)="limparBusca()" aria-label="Limpar busca"><i class="pi pi-times"></i></button>

          <div class="aj-sugg" *ngIf="painelBusca && busca.trim()" role="listbox">
            <button type="button" class="aj-sugg-item" *ngFor="let s of sugestoes; let i = index" role="option"
                    [class.is-active]="i === sugAtiva" [attr.aria-selected]="i === sugAtiva"
                    (mouseenter)="sugAtiva = i" (mousedown)="$event.preventDefault()" (click)="abrirOs(s.os.id)">
              <span class="aj-sugg-code fx-mono">{{ s.os.codigo }}</span>
              <span class="aj-sugg-main">
                <strong>{{ s.os.cliente || 'Cliente não informado' }}</strong>
                <small>PN {{ s.os.partNumber || '—' }} · SN {{ s.os.serialNumber || '—' }}<ng-container *ngIf="s.os.numOsOriginal"> · {{ s.os.numOsOriginal }}</ng-container></small>
              </span>
              <span class="aj-sugg-state" [style.--stage]="s.etapa?.cor || '#94a3b8'">
                <span class="sw"></span>{{ s.etapa ? s.etapa.ordem + '. ' + s.etapa.nome : 'Não iniciada' }}
              </span>
            </button>
            <div class="aj-sugg-empty" *ngIf="!buscando && !sugestoes.length">
              <i class="pi pi-inbox"></i> Nenhuma OS encontrada para "{{ busca.trim() }}"
            </div>
          </div>
        </div>
      </section>

      <section class="aj-intro" *ngIf="!osId">
        <div class="aj-intro-card" data-d="RETROCESSO">
          <span class="ico"><i class="pi pi-backward"></i></span>
          <strong>Voltar etapas</strong>
          <p>Desfaz passagens posteriores ao destino. Elas ficam anuladas, com motivo, visíveis na auditoria.</p>
        </div>
        <div class="aj-intro-card" data-d="AVANCO">
          <span class="ico"><i class="pi pi-forward"></i></span>
          <strong>Avançar etapas</strong>
          <p>Leva a OS adiante. As etapas puladas podem ser marcadas como concluídas, sem contar tempo nas métricas.</p>
        </div>
        <div class="aj-intro-card" data-d="ZERAR">
          <span class="ico"><i class="pi pi-refresh"></i></span>
          <strong>Zerar fluxo</strong>
          <p>Devolve a OS ao início, como não iniciada. Todas as passagens são anuladas e preservadas no histórico.</p>
        </div>
      </section>

      <div class="aj-loading" *ngIf="carregando && !det">
        <div class="aj-skel aj-skel--os"></div>
        <div class="aj-grid"><div class="aj-skel aj-skel--track"></div><div class="aj-skel aj-skel--side"></div></div>
      </div>

      <div class="fx-card fx-empty aj-error" *ngIf="!carregando && erro">
        <i class="pi pi-exclamation-circle"></i>
        <span>{{ erro }}</span>
      </div>

      <ng-container *ngIf="det as d">
        <div class="aj-done" *ngIf="ultimoAjuste as u" [attr.data-d]="u.direcao" role="status">
          <span class="ico"><i class="pi pi-check"></i></span>
          <div>
            <strong>{{ tituloDirecao(u.direcao) }} aplicado</strong>
            <span>{{ u.de }} <i class="pi pi-arrow-right"></i> {{ u.para }}</span>
          </div>
          <a [routerLink]="['/os/fluxo/os', d.os.id]">Ver auditoria <i class="pi pi-angle-right"></i></a>
          <button type="button" (click)="ultimoAjuste = null" aria-label="Fechar aviso"><i class="pi pi-times"></i></button>
        </div>

        <section class="fx-card aj-os" [class.is-busy]="carregando">
          <div class="aj-os-top">
            <div class="aj-os-id">
              <span class="aj-os-label">Ordem de serviço</span>
              <h2 class="fx-mono">{{ d.os.codigo }}</h2>
            </div>
            <dl class="aj-os-facts">
              <div><dt>Cliente</dt><dd>{{ d.os.cliente || 'Não informado' }}</dd></div>
              <div><dt>PN</dt><dd class="fx-mono">{{ d.os.partNumber || '—' }}</dd></div>
              <div><dt>SN</dt><dd class="fx-mono">{{ d.os.serialNumber || '—' }}</dd></div>
              <div *ngIf="d.os.numOsOriginal"><dt>OS original</dt><dd class="fx-mono">{{ d.os.numOsOriginal }}</dd></div>
              <div *ngIf="d.os.mecanicoNome"><dt>Mecânico</dt><dd>{{ d.os.mecanicoNome }}</dd></div>
            </dl>
            <div class="aj-os-now">
              <span class="aj-os-label">Posição atual</span>
              <span class="aj-now" [attr.data-s]="d.os.fluxoSituacao || 'NAO'">
                <i class="pi" [ngClass]="iconePosicao(posicoes[posAtual])"></i>
                <span>
                  <strong>{{ tituloPosicao(posicoes[posAtual]) }}</strong>
                  <small>{{ situacaoPosicao(posicoes[posAtual]) }}</small>
                </span>
              </span>
            </div>
            <div class="aj-os-actions">
              <a class="aj-link" [routerLink]="['/os/fluxo/os', d.os.id]"><i class="pi pi-history"></i> Auditoria completa</a>
              <button type="button" class="aj-icon-btn" (click)="carregar(d.os.id, true)" pTooltip="Atualizar" aria-label="Atualizar">
                <i class="pi pi-refresh" [class.pi-spin]="carregando"></i>
              </button>
            </div>
          </div>

          <ol class="aj-pipe" aria-label="Linha do tempo das etapas">
            <li *ngFor="let l of linhas; trackBy: trackLinha" [attr.data-status]="l.status.status" [style.--stage]="l.status.etapa.cor || '#64748b'"
                [class.is-current]="linhaAtual(l)" [class.is-target]="linhaAlvo(l)" [class.in-path]="afetada(l)"
                [pTooltip]="l.status.etapa.ordem + '. ' + l.status.etapa.nome + ' · ' + rotuloStatus(l.status.status)" tooltipPosition="top">
              <span class="dot">
                <i class="pi pi-check" *ngIf="l.status.status === 'CONCLUIDA' && !linhaAtual(l)"></i>
                <ng-container *ngIf="l.status.status !== 'CONCLUIDA' || linhaAtual(l)">{{ l.status.etapa.ordem }}</ng-container>
              </span>
              <span class="nm">{{ l.status.etapa.nome }}</span>
            </li>
          </ol>
          <div class="aj-pipe-foot">
            <div class="fx-bar"><span [style.width.%]="progresso"></span></div>
            <span><b>{{ d.resumo.etapasConcluidas }}</b> de {{ d.resumo.totalEtapas }} etapas concluídas</span>
          </div>
        </section>

        <div class="aj-grid">
          <section class="fx-card aj-track">
            <div class="aj-track-head">
              <div>
                <h3>Selecione a nova etapa</h3>
                <p>Clique na linha da etapa de destino. A situação nela (em andamento ou concluída) é escolhida no painel ao lado.</p>
              </div>
              <div class="aj-quick" role="group" aria-label="Atalhos">
                <button type="button" (click)="passo(-1)" [disabled]="!podeVoltar" pTooltip="Uma posição para trás" tooltipPosition="top">
                  <i class="pi pi-angle-left"></i> Voltar
                </button>
                <button type="button" (click)="passo(1)" [disabled]="!podeAvancar" pTooltip="Uma posição para frente" tooltipPosition="top">
                  Avançar <i class="pi pi-angle-right"></i>
                </button>
                <button type="button" class="is-danger" (click)="selecionar(0)" [disabled]="posAtual === 0">
                  <i class="pi pi-refresh"></i> Zerar
                </button>
              </div>
            </div>

            <div class="aj-legend" aria-hidden="true">
              <span><i class="lg lg-done"><i class="pi pi-check"></i></i> Concluída</span>
              <span><i class="lg lg-now"></i> Posição atual</span>
              <span><i class="lg lg-pend"></i> Pendente</span>
              <span><i class="lg lg-dest"></i> Destino selecionado</span>
            </div>

            <div class="aj-list" role="radiogroup" aria-label="Nova posição da OS" [attr.data-d]="direcaoLocal">
              <button type="button" role="radio" class="aj-item aj-item--zero" [attr.aria-checked]="alvo === 0"
                      [class.is-current]="posAtual === 0" [class.is-target]="alvo === 0" [disabled]="posAtual === 0 || aplicando"
                      (click)="selecionar(0)">
                <span class="aj-radio"></span>
                <span class="aj-node"><i class="pi pi-power-off"></i></span>
                <span class="aj-name">
                  <strong>0. Não iniciada</strong>
                  <small>OS fora do fluxo, aguardando a primeira entrada</small>
                </span>
                <span class="aj-status" data-s="ZERO">Início do fluxo</span>
                <span class="aj-when"><span class="muted">Zerar anula todas as passagens</span></span>
                <span class="aj-flag">
                  <b class="is-now" *ngIf="posAtual === 0">Atual</b>
                  <b class="is-dest" *ngIf="alvo === 0">Destino</b>
                </span>
              </button>

              <button type="button" role="radio" class="aj-item" *ngFor="let l of linhas; trackBy: trackLinha"
                      [style.--stage]="l.status.etapa.cor || '#64748b'" [attr.data-status]="l.status.status"
                      [class.is-current]="linhaAtual(l)" [class.is-target]="linhaAlvo(l)" [class.in-path]="afetada(l)"
                      [attr.aria-checked]="linhaAlvo(l)" [attr.aria-label]="rotuloLinha(l)" [disabled]="aplicando"
                      (click)="selecionarLinha(l)">
                <span class="aj-radio"></span>
                <span class="aj-node">
                  <i class="pi pi-check" *ngIf="l.status.status === 'CONCLUIDA'"></i>
                  <i class="pi pi-cog" *ngIf="l.status.status === 'EM_ANDAMENTO'"></i>
                  <ng-container *ngIf="l.status.status === 'PENDENTE'">{{ l.status.etapa.ordem }}</ng-container>
                </span>
                <span class="aj-name">
                  <strong>{{ l.status.etapa.ordem }}. {{ l.status.etapa.nome }}</strong>
                  <small>{{ l.status.etapa.setor || 'Sem setor' }}<ng-container *ngIf="l.status.passagens > 1"> · {{ l.status.passagens }} passagens</ng-container></small>
                </span>
                <span class="aj-status" [attr.data-s]="l.status.status">{{ rotuloStatusTitulo(l.status.status) }}</span>
                <span class="aj-when">
                  <ng-container *ngIf="l.status.primeiraEntradaEm; else semPassagem">
                    <span><i class="pi pi-sign-in"></i>{{ dataHora(l.status.primeiraEntradaEm) }}</span>
                    <span *ngIf="l.status.ultimaSaidaEm"><i class="pi pi-sign-out"></i>{{ dataHora(l.status.ultimaSaidaEm) }}</span>
                    <span *ngIf="l.status.totalSeg"><i class="pi pi-clock"></i>{{ duracao(l.status.totalSeg) }}</span>
                  </ng-container>
                  <ng-template #semPassagem><span class="muted">Sem passagem registrada</span></ng-template>
                </span>
                <span class="aj-flag">
                  <b class="is-now" *ngIf="linhaAtual(l)">Atual · {{ posicoes[posAtual].tipo === 'EM' ? 'em andamento' : 'concluída' }}</b>
                  <b class="is-dest" *ngIf="linhaAlvo(l)">Destino · {{ posicoes[alvo!].tipo === 'EM' ? 'em andamento' : 'concluída' }}</b>
                </span>
              </button>
            </div>
          </section>

          <aside class="aj-side">
            <section class="fx-card aj-plan" [attr.data-d]="direcao">
              <ng-container *ngIf="alvo !== null; else semAlvo">
                <div class="aj-plan-head">
                  <div>
                    <span class="aj-os-label">Destino selecionado</span>
                    <span class="aj-dir-chip"><i class="pi" [ngClass]="iconeDirecao(direcao)"></i> {{ tituloDirecao(direcao) }}</span>
                    <small>{{ distanciaTexto }}</small>
                  </div>
                  <button type="button" class="aj-icon-btn aj-icon-btn--light" (click)="limparAlvo()" pTooltip="Limpar seleção" aria-label="Limpar seleção">
                    <i class="pi pi-times"></i>
                  </button>
                </div>

                <div class="aj-compare">
                  <div class="aj-cmp is-from" [style.--stage]="posicoes[posAtual]?.etapa?.cor || '#64748b'">
                    <span class="aj-os-label">Posição atual</span>
                    <strong>{{ tituloPosicao(posicoes[posAtual]) }}</strong>
                    <small>{{ situacaoPosicao(posicoes[posAtual]) }}</small>
                  </div>
                  <span class="aj-cmp-arrow"><i class="pi pi-arrow-right"></i></span>
                  <div class="aj-cmp is-to" [style.--stage]="posicoes[alvo]?.etapa?.cor || '#64748b'">
                    <span class="aj-os-label">Nova posição</span>
                    <strong>{{ tituloPosicao(posicoes[alvo]) }}</strong>
                    <small>{{ situacaoPosicao(posicoes[alvo]) }}</small>
                  </div>
                </div>

                <dl class="aj-dest">
                  <div class="is-main"><dt>Nova etapa</dt><dd>{{ tituloPosicao(posicoes[alvo]) }}</dd></div>
                  <div><dt>Setor</dt><dd>{{ posicoes[alvo]?.etapa?.setor || (alvo === 0 ? 'Fora do fluxo' : 'Sem setor') }}</dd></div>
                  <div><dt>Situação</dt><dd>{{ situacaoPosicao(posicoes[alvo]) }}</dd></div>
                </dl>

                <div class="aj-sit" *ngIf="linhaDoAlvo as la">
                  <span class="aj-os-label">Situação da OS nessa etapa</span>
                  <div class="aj-seg" role="radiogroup" aria-label="Situação na etapa de destino">
                    <button type="button" role="radio" [class.on]="alvo === la.em.idx" [attr.aria-checked]="alvo === la.em.idx"
                            [disabled]="la.em.idx === posAtual || aplicando" (click)="selecionar(la.em.idx)">
                      <i class="pi pi-play-circle"></i>
                      <span><b>Em andamento</b><small>{{ la.em.idx === posAtual ? 'É a posição atual' : 'Entrada registrada, aguardando saída' }}</small></span>
                    </button>
                    <button type="button" role="radio" [class.on]="alvo === la.conc.idx" [attr.aria-checked]="alvo === la.conc.idx"
                            [disabled]="la.conc.idx === posAtual || aplicando" (click)="selecionar(la.conc.idx)">
                      <i class="pi pi-check-circle"></i>
                      <span><b>Concluída</b><small>{{ la.conc.idx === posAtual ? 'É a posição atual' : posicoes[la.conc.idx + 1] ? 'Saída registrada, aguarda a próxima etapa' : 'Encerra o fluxo da OS' }}</small></span>
                    </button>
                  </div>
                </div>

                <label class="aj-switch" *ngIf="plano?.etapasPuladas">
                  <input type="checkbox" [(ngModel)]="preencherIntermediarias" (ngModelChange)="simular()" />
                  <span class="track"><span class="thumb"></span></span>
                  <span class="txt">
                    Marcar {{ plano!.etapasPuladas === 1 ? 'a etapa pulada' : 'as ' + plano!.etapasPuladas + ' etapas puladas' }} como concluída{{ plano!.etapasPuladas === 1 ? '' : 's' }}
                    <small>Passagens de ajuste, sem tempo, fora das métricas.</small>
                  </span>
                </label>

                <div class="aj-effects">
                  <div class="aj-effects-head">
                    <span class="aj-os-label">Resumo do impacto</span>
                    <span class="aj-counts" *ngIf="plano && !simulando">
                      <span *ngIf="plano.anulados" class="is-void">{{ plano.anulados }} anulada{{ plano.anulados > 1 ? 's' : '' }}</span>
                      <span *ngIf="plano.criados" class="is-new">{{ plano.criados }} criada{{ plano.criados > 1 ? 's' : '' }}</span>
                    </span>
                  </div>
                  <ul *ngIf="!simulando && plano; else carregandoPlano">
                    <li *ngFor="let e of plano.efeitos" [attr.data-t]="e.tipo" [style.--stage]="e.etapaCor || '#94a3b8'">
                      <span class="ef-ico"><i class="pi" [ngClass]="iconeEfeito(e.tipo)"></i></span>
                      <span class="ef-txt"><b>{{ rotuloEfeito(e.tipo) }}</b>{{ e.descricao }}</span>
                    </li>
                    <li class="is-none" *ngIf="!plano.efeitos.length"><span class="ef-ico"><i class="pi pi-info-circle"></i></span>
                      <span class="ef-txt">A OS já está nessa posição. Nada a ajustar.</span></li>
                  </ul>
                  <ng-template #carregandoPlano>
                    <div class="aj-effects-err" *ngIf="erroSimulacao && !simulando"><i class="pi pi-exclamation-triangle"></i> {{ erroSimulacao }}</div>
                    <div class="aj-shimmer" *ngIf="simulando || !erroSimulacao"><span></span><span></span><span></span></div>
                  </ng-template>
                </div>

                <div class="aj-reason" [class.is-ok]="motivoOk">
                  <label for="ajMotivo">Motivo da alteração <em>obrigatório</em></label>
                  <textarea id="ajMotivo" pInputTextarea [(ngModel)]="motivo" rows="3" maxlength="400"
                            placeholder="Ex.: leitura registrada na etapa errada pela estação da limpeza"></textarea>
                  <div class="aj-reason-foot">
                    <span [class.ok]="motivoOk"><i class="pi" [ngClass]="motivoOk ? 'pi-check-circle' : 'pi-info-circle'"></i>
                      {{ motivoOk ? 'Motivo registrado na auditoria' : 'Mínimo de 10 caracteres' }}</span>
                    <span class="fx-num">{{ motivo.length }}/400</span>
                  </div>
                </div>

                <div class="aj-actions">
                  <button type="button" class="aj-apply" [disabled]="!podeAplicar" (click)="abrirConfirmacao()">
                    <i class="pi" [ngClass]="aplicando ? 'pi-spin pi-spinner' : iconeDirecao(direcao)"></i>
                    {{ direcao === 'ZERAR' ? 'Confirmar e zerar fluxo' : 'Confirmar e mover OS' }}
                  </button>
                  <button type="button" class="aj-cancel" [disabled]="aplicando" (click)="limparAlvo()">Cancelar</button>
                  <p class="aj-apply-hint" *ngIf="!podeAplicar && !aplicando">
                    <i class="pi pi-info-circle"></i>
                    {{ simulando ? 'Calculando o impacto…' : !plano ? 'Aguardando a simulação do impacto' : !plano.efeitos.length ? 'A OS já está nessa posição' : 'Informe o motivo (mínimo de 10 caracteres) para liberar a confirmação' }}
                  </p>
                </div>
              </ng-container>

              <ng-template #semAlvo>
                <div class="aj-idle">
                  <div class="aj-idle-art" aria-hidden="true">
                    <span class="n n-done"><i class="pi pi-check"></i></span>
                    <span class="ln"></span>
                    <span class="n n-now"></span>
                    <span class="ln ln-dash"></span>
                    <span class="n n-dest"><i class="pi pi-map-marker"></i></span>
                  </div>
                  <strong>Nenhum destino selecionado</strong>
                  <p>Clique em uma das etapas da lista para mover esta OS.</p>
                  <ul>
                    <li><i class="pi pi-eye"></i> O impacto é simulado antes, sem gravar nada</li>
                    <li><i class="pi pi-pencil"></i> O motivo da alteração é obrigatório</li>
                    <li><i class="pi pi-lock"></i> Passagens desfeitas são anuladas, nunca apagadas</li>
                  </ul>
                </div>
              </ng-template>
            </section>
            <p class="aj-foot"><i class="pi pi-shield"></i> Registrado com seu usuário, IP e horário no log do fluxo desta OS.</p>
          </aside>
        </div>

        <section class="fx-card aj-hist">
          <div class="fx-card-head">
            <h2>Histórico de ajustes e estornos</h2>
            <span class="fx-hint">{{ historico.length }} registro{{ historico.length === 1 ? '' : 's' }}</span>
          </div>
          <ul class="aj-hist-list" *ngIf="historico.length; else semHist">
            <li *ngFor="let ev of historico" [attr.data-a]="ev.acao">
              <span class="h-ico"><i class="pi" [ngClass]="ev.acao === 'AJUSTE' ? 'pi-sliders-h' : 'pi-undo'"></i></span>
              <div class="h-body">
                <div class="h-top">
                  <strong>{{ ev.acao === 'AJUSTE' ? 'Ajuste de etapa' : 'Estorno de leitura' }}</strong>
                  <span class="fx-mono">{{ dataHora(ev.ocorridoEm) }}</span>
                </div>
                <p>{{ ev.mensagem }}</p>
                <small><i class="pi pi-user"></i> {{ ev.usuarioNome || '—' }}<ng-container *ngIf="ev.ip"> · {{ ev.ip }}</ng-container></small>
              </div>
            </li>
          </ul>
          <ng-template #semHist>
            <div class="fx-empty"><i class="pi pi-inbox"></i><span>Nenhum ajuste ou estorno nesta OS.</span></div>
          </ng-template>
        </section>
      </ng-container>
    </div>

    <p-dialog [(visible)]="mostrarConfirmar" [modal]="true" [draggable]="false" [resizable]="false" [dismissableMask]="!aplicando"
              [closable]="!aplicando" styleClass="aj-dlg" [style]="{ width: '520px', maxWidth: '95vw' }" header="Confirmar ajuste">
      <ng-container *ngIf="plano && alvo !== null">
        <div class="aj-dlg-dir" [attr.data-d]="plano.direcao">
          <span class="aj-dir-ico"><i class="pi" [ngClass]="iconeDirecao(plano.direcao)"></i></span>
          <div>
            <strong>{{ tituloDirecao(plano.direcao) }} · {{ det?.os?.codigo }}</strong>
            <span>{{ rotulo(posicoes[posAtual]) }} <i class="pi pi-arrow-right"></i> {{ rotulo(posicoes[alvo]) }}</span>
          </div>
        </div>
        <ul class="aj-dlg-facts">
          <li><i class="pi pi-ban"></i> {{ plano.anulados }} passage{{ plano.anulados === 1 ? 'm' : 'ns' }} anulada{{ plano.anulados === 1 ? '' : 's' }}</li>
          <li><i class="pi pi-plus-circle"></i> {{ plano.criados }} passage{{ plano.criados === 1 ? 'm' : 'ns' }} de ajuste criada{{ plano.criados === 1 ? '' : 's' }}</li>
          <li><i class="pi pi-comment"></i> "{{ motivo.trim() }}"</li>
        </ul>
        <div class="aj-dlg-guard" *ngIf="plano.direcao === 'ZERAR'">
          <label for="ajConfirma">Para confirmar, digite o número da OS <b class="fx-mono">{{ osId }}</b></label>
          <input id="ajConfirma" type="text" [(ngModel)]="confirmacao" autocomplete="off" inputmode="numeric" [placeholder]="'' + osId" />
        </div>
      </ng-container>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" [disabled]="aplicando" (click)="mostrarConfirmar = false"></button>
        <button pButton type="button" [label]="verboDirecao(plano?.direcao || 'REPOSICIONAR')" icon="pi pi-check"
                [class.p-button-danger]="plano?.direcao === 'ZERAR' || plano?.direcao === 'RETROCESSO'"
                [disabled]="!confirmacaoOk || aplicando" [loading]="aplicando" (click)="aplicar()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host { --adv: #0f766e; --adv-soft: #ecfdf5; --back: #b45309; --back-soft: #fff7ed; --zero: #b91c1c; --zero-soft: #fef2f2;
      --repo: #4f46e5; --repo-soft: #eef2ff; }
    [data-d="AVANCO"] { --dir: var(--adv); --dir-soft: var(--adv-soft); }
    [data-d="RETROCESSO"] { --dir: var(--back); --dir-soft: var(--back-soft); }
    [data-d="ZERAR"] { --dir: var(--zero); --dir-soft: var(--zero-soft); }
    [data-d="REPOSICIONAR"] { --dir: var(--repo); --dir-soft: var(--repo-soft); }
    [data-d="SEM_MUDANCA"] { --dir: #475569; --dir-soft: #f1f5f9; }

    .aj-hero { align-items: flex-end; }
    .aj-role {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; font-size: 0.8rem; line-height: 1.35;
      color: #cbd5e1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
    }
    .aj-role i { font-size: 1.3rem; color: #fbbf24; }
    .aj-role strong { color: #f8fafc; font-weight: 700; }

    .aj-finder { position: relative; z-index: 5; margin-bottom: 18px; }
    .aj-search {
      position: relative; display: flex; align-items: center; gap: 12px; height: 58px; padding: 0 16px 0 18px;
      background: var(--card); border: 1px solid var(--line); border-radius: 18px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); transition: border-color .15s ease, box-shadow .15s ease;
    }
    .aj-search:focus-within { border-color: #0e7490; box-shadow: 0 0 0 4px rgba(14,116,144,.12), 0 10px 30px rgba(15,23,42,.06); }
    .aj-search.is-open { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
    .aj-search-ico { color: var(--muted-2); font-size: 1.05rem; }
    .aj-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font: inherit; font-size: 1.02rem; color: var(--ink); }
    .aj-search input::placeholder { color: var(--muted-2); }
    .aj-search-spin { color: var(--accent); }
    .aj-kbd {
      font-family: 'IBM Plex Mono', monospace; font-size: 0.74rem; color: var(--muted); padding: 2px 8px; border-radius: 6px;
      border: 1px solid var(--line); background: #f8fafc;
    }
    .aj-search-clear { border: 0; background: #f1f5f9; color: var(--muted); width: 30px; height: 30px; border-radius: 9px; cursor: pointer; }
    .aj-search-clear:hover { background: #e2e8f0; color: var(--ink); }
    .aj-sugg {
      position: absolute; left: -1px; right: -1px; top: 100%; max-height: 380px; overflow-y: auto; padding: 6px;
      background: var(--card); border: 1px solid #0e7490; border-top-color: var(--line-soft);
      border-radius: 0 0 18px 18px; box-shadow: 0 24px 48px rgba(15, 23, 42, 0.14);
    }
    .aj-sugg-item {
      width: 100%; display: grid; grid-template-columns: 150px 1fr auto; align-items: center; gap: 14px; text-align: left;
      padding: 10px 12px; border: 0; border-radius: 12px; background: transparent; cursor: pointer; font: inherit; color: var(--ink);
    }
    .aj-sugg-item.is-active { background: #f0f9ff; }
    .aj-sugg-code { font-weight: 600; font-size: 0.92rem; }
    .aj-sugg-main { display: flex; flex-direction: column; min-width: 0; }
    .aj-sugg-main strong { font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .aj-sugg-main small { color: var(--muted); font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .aj-sugg-state { display: inline-flex; align-items: center; gap: 7px; font-size: 0.78rem; color: var(--muted); white-space: nowrap; }
    .aj-sugg-state .sw { width: 9px; height: 9px; border-radius: 3px; background: var(--stage); }
    .aj-sugg-empty { padding: 18px; color: var(--muted); font-size: 0.88rem; display: flex; gap: 8px; align-items: center; justify-content: center; }

    .aj-intro { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .aj-intro-card {
      position: relative; padding: 22px; border-radius: 18px; background: var(--card); border: 1px solid var(--line); overflow: hidden;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
    }
    .aj-intro-card::after { content: ''; position: absolute; inset: auto -40px -60px auto; width: 160px; height: 160px; border-radius: 50%; background: var(--dir-soft); }
    .aj-intro-card .ico {
      position: relative; z-index: 1; width: 44px; height: 44px; border-radius: 13px; display: grid; place-items: center;
      background: var(--dir-soft); color: var(--dir); font-size: 1.1rem; margin-bottom: 14px;
    }
    .aj-intro-card strong { position: relative; z-index: 1; display: block; font-family: Manrope, sans-serif; font-size: 1.05rem; font-weight: 800; }
    .aj-intro-card p { position: relative; z-index: 1; margin: 6px 0 0; color: var(--muted); font-size: 0.87rem; line-height: 1.5; }
    @media (max-width: 900px) { .aj-intro { grid-template-columns: 1fr; } }

    .aj-error { margin-top: 10px; }
    .aj-skel { border-radius: 20px; background: linear-gradient(90deg, #e8eef4 0%, #f5f8fb 50%, #e8eef4 100%); background-size: 200% 100%; animation: ajShim 1.3s linear infinite; }
    .aj-skel--os { height: 118px; margin-bottom: 18px; }
    .aj-skel--track { height: 620px; }
    .aj-skel--side { height: 460px; }
    @keyframes ajShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

    .aj-done {
      display: flex; align-items: center; gap: 14px; margin-bottom: 14px; padding: 12px 14px 12px 12px; border-radius: 16px;
      background: var(--dir-soft); border: 1px solid color-mix(in srgb, var(--dir) 28%, transparent); animation: ajRise .3s ease;
    }
    .aj-done .ico { width: 36px; height: 36px; border-radius: 11px; display: grid; place-items: center; background: var(--dir); color: #fff; }
    .aj-done div { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .aj-done strong { color: var(--dir); font-family: Manrope, sans-serif; }
    .aj-done span { color: var(--ink-2); font-size: 0.86rem; }
    .aj-done span i { font-size: 0.7rem; margin: 0 4px; color: var(--muted); }
    .aj-done a { color: var(--dir); font-weight: 600; font-size: 0.85rem; text-decoration: none; white-space: nowrap; }
    .aj-done button { border: 0; background: transparent; color: var(--muted); cursor: pointer; padding: 6px; }
    @keyframes ajRise { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

    .fx-shell.aj {
      --ink: #111827; --ink-2: #1F2937; --muted: #4B5563; --muted-2: #6B7280; --line: #D1D5DB; --line-soft: #E5E7EB;
      --now: #2563eb; --now-soft: #eff6ff; --ok: #059669; --ok-soft: #ecfdf5;
      background: #F9FAFB; color: #1F2937; container: aj / inline-size;
    }
    .aj-os-label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); font-weight: 700; }

    .aj-os { padding: 0; margin-bottom: 18px; overflow: hidden; transition: opacity .2s ease; border-color: var(--line); }
    .aj-os.is-busy { opacity: .6; }
    .aj-os-top {
      display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; gap: 28px; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid var(--line-soft);
    }
    .aj-os-id h2 { margin: 2px 0 0; font-size: 1.85rem; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); white-space: nowrap; }
    .aj-os-facts { display: flex; flex-wrap: wrap; gap: 10px 28px; margin: 0; padding-left: 28px; border-left: 1px solid var(--line-soft); min-width: 0; }
    .aj-os-facts div { min-width: 0; }
    .aj-os-facts dt { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 700; }
    .aj-os-facts dd { margin: 3px 0 0; font-size: 0.98rem; font-weight: 600; color: var(--ink-2); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .aj-os-now { display: flex; flex-direction: column; gap: 6px; }
    .aj-now {
      display: inline-flex; align-items: center; gap: 12px; padding: 10px 18px 10px 12px; border-radius: 14px; color: #fff;
      background: #374151; box-shadow: 0 10px 24px rgba(17, 24, 39, 0.18);
    }
    .aj-now > i { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: rgba(255,255,255,.18); font-size: 1rem; }
    .aj-now strong { display: block; font-family: Manrope, sans-serif; font-size: 1.02rem; font-weight: 800; line-height: 1.2; white-space: nowrap; }
    .aj-now small { display: block; font-size: 0.78rem; opacity: .9; white-space: nowrap; }
    .aj-now[data-s="EM_ETAPA"] { background: var(--now); box-shadow: 0 10px 24px rgba(37, 99, 235, .32); }
    .aj-now[data-s="AGUARDANDO"] { background: #1d4ed8; box-shadow: 0 10px 24px rgba(29, 78, 216, .3); }
    .aj-now[data-s="CONCLUIDO"] { background: var(--ok); box-shadow: 0 10px 24px rgba(5, 150, 105, .3); }
    .aj-os-actions { display: flex; align-items: center; gap: 10px; }
    .aj-link {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; font-weight: 600; font-size: 0.88rem;
      color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; text-decoration: none; white-space: nowrap;
    }
    .aj-link:hover { background: #dbeafe; }
    .aj-icon-btn {
      width: 40px; height: 40px; border-radius: 11px; border: 1px solid var(--line); background: #fff; color: var(--ink-2);
      display: grid; place-items: center; cursor: pointer; flex: none;
    }
    .aj-icon-btn:hover { background: #f3f4f6; }
    .aj-icon-btn--light { width: 34px; height: 34px; border-radius: 10px; }

    .aj-pipe { list-style: none; margin: 0; padding: 18px 24px 8px; display: flex; gap: 0; }
    .aj-pipe li { position: relative; flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center; cursor: default; }
    .aj-pipe li::before {
      content: ''; position: absolute; top: 15px; right: 50%; width: 100%; height: 3px; background: var(--line); z-index: 0;
    }
    .aj-pipe li:first-child::before { display: none; }
    .aj-pipe li[data-status="CONCLUIDA"]::before, .aj-pipe li.is-current::before { background: var(--ok); }
    .aj-pipe li.in-path::before { background: repeating-linear-gradient(90deg, var(--dir, #6b7280) 0 6px, transparent 6px 11px); }
    .aj-pipe .dot {
      position: relative; z-index: 1; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center;
      font-family: Manrope, sans-serif; font-weight: 800; font-size: 0.82rem; background: #fff; color: var(--muted); border: 2px solid var(--line);
    }
    .aj-pipe li[data-status="CONCLUIDA"] .dot { background: var(--ok); border-color: var(--ok); color: #fff; }
    .aj-pipe li.is-current .dot { background: var(--now); border-color: var(--now); color: #fff; box-shadow: 0 0 0 5px rgba(37, 99, 235, .2); }
    .aj-pipe li.is-target .dot { outline: 3px dashed var(--dir, #4f46e5); outline-offset: 3px; }
    .aj-pipe .nm {
      font-size: 0.74rem; line-height: 1.25; color: var(--muted); font-weight: 600; padding: 0 4px;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .aj-pipe li.is-current .nm { color: var(--now); font-weight: 800; }
    .aj-pipe li[data-status="CONCLUIDA"] .nm { color: #065f46; }
    .aj-pipe-foot { display: flex; align-items: center; gap: 14px; padding: 8px 24px 16px; font-size: 0.84rem; color: var(--muted); }
    .aj-pipe-foot .fx-bar { flex: 1; }
    .aj-pipe-foot b { color: var(--ink); }
    @container aj (max-width: 1150px) {
      .aj-os-top { grid-template-columns: auto 1fr auto; row-gap: 16px; }
      .aj-os-now { justify-self: end; }
      .aj-os-facts { grid-column: 1 / -1; grid-row: 2; padding: 14px 0 0; border-left: 0; border-top: 1px solid var(--line-soft); }
    }
    @container aj (max-width: 700px) {
      .aj-pipe .nm { display: none; }
      .aj-os-top { grid-template-columns: 1fr; }
      .aj-os-now { justify-self: start; }
    }

    .aj-grid { display: grid; grid-template-columns: minmax(0, 1fr) 440px; gap: 20px; align-items: start; margin-bottom: 18px; }
    @container aj (max-width: 1250px) { .aj-grid { grid-template-columns: minmax(0, 1fr) 380px; } }
    @container aj (max-width: 960px) { .aj-grid { grid-template-columns: 1fr; } }

    .aj-track { padding: 0 0 12px; container: ajtrack / inline-size; }
    .aj-track-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 14px; flex-wrap: wrap; padding: 18px 22px 14px; }
    .aj-track-head h3 { margin: 0; font-family: Manrope, sans-serif; font-size: 0.86rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--ink); }
    .aj-track-head p { margin: 5px 0 0; color: var(--muted); font-size: 0.88rem; }
    .aj-quick { display: inline-flex; padding: 4px; gap: 4px; background: #f3f4f6; border-radius: 13px; border: 1px solid var(--line-soft); }
    .aj-quick button {
      display: inline-flex; align-items: center; gap: 6px; border: 0; background: transparent; padding: 8px 12px; border-radius: 9px;
      font: inherit; font-weight: 600; font-size: 0.86rem; color: var(--ink-2); cursor: pointer; transition: background .15s ease;
    }
    .aj-quick button:hover:not(:disabled) { background: #fff; box-shadow: 0 1px 3px rgba(17,24,39,.1); }
    .aj-quick button.is-danger { color: var(--zero); }
    .aj-quick button:disabled { opacity: .4; cursor: not-allowed; }

    .aj-legend { display: flex; flex-wrap: wrap; gap: 8px 20px; padding: 0 22px 14px; border-bottom: 1px solid var(--line-soft); font-size: 0.8rem; color: var(--muted); }
    .aj-legend span { display: inline-flex; align-items: center; gap: 7px; }
    .aj-legend .lg { width: 16px; height: 16px; border-radius: 50%; display: inline-grid; place-items: center; border: 2px solid var(--line); background: #fff; }
    .aj-legend .lg-done { background: var(--ok); border-color: var(--ok); color: #fff; }
    .aj-legend .lg-done i { font-size: 0.5rem; }
    .aj-legend .lg-now { background: var(--now); border-color: var(--now); }
    .aj-legend .lg-dest { border: 2px dashed #4f46e5; }

    .aj-list { display: flex; flex-direction: column; padding: 10px 14px 0; }
    .aj-item {
      position: relative; display: grid; grid-template-columns: 22px 46px minmax(180px, 1.3fr) 128px minmax(0, 1.6fr) 170px;
      align-items: center; gap: 16px; width: 100%; min-height: 70px; padding: 10px 14px; text-align: left; font: inherit; color: var(--ink-2);
      background: transparent; border: 2px solid transparent; border-radius: 14px; cursor: pointer;
      transition: background .15s ease, border-color .15s ease, box-shadow .15s ease;
    }
    .aj-item::before {
      content: ''; position: absolute; left: 73px; top: -12px; bottom: -12px; width: 3px; background: var(--line-soft); z-index: 0; pointer-events: none;
    }
    .aj-item:first-child::before { top: 50%; }
    .aj-item:last-child::before { bottom: 50%; }
    .aj-item[data-status="CONCLUIDA"]::before { background: color-mix(in srgb, var(--ok) 55%, #fff); }
    .aj-item:hover:not(:disabled) { background: #f3f4f6; border-color: var(--line); }
    .aj-item:focus-visible { outline: 3px solid rgba(37, 99, 235, .35); outline-offset: 1px; }
    .aj-item.in-path { background: color-mix(in srgb, var(--dir, #6b7280) 5%, transparent); }
    .aj-item.is-current { background: var(--now-soft); border-color: #bfdbfe; }
    .aj-item.is-target {
      background: color-mix(in srgb, var(--dir, #4f46e5) 9%, #fff); border-color: var(--dir, #4f46e5);
      box-shadow: 0 10px 24px color-mix(in srgb, var(--dir, #4f46e5) 18%, transparent);
    }
    .aj-item:disabled { cursor: default; }
    .aj-item--zero:disabled:not(.is-current) { opacity: .5; }

    .aj-radio { position: relative; z-index: 1; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #9ca3af; background: #fff; }
    .aj-item:hover:not(:disabled) .aj-radio { border-color: var(--dir, #4f46e5); }
    .aj-item.is-target .aj-radio { border-color: var(--dir, #4f46e5); }
    .aj-item.is-target .aj-radio::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--dir, #4f46e5); }
    .aj-item.is-current:not(.is-target) .aj-radio { border-color: var(--now); }
    .aj-item.is-current:not(.is-target) .aj-radio::after { content: ''; position: absolute; inset: 4px; border-radius: 50%; background: var(--now); opacity: .45; }
    .aj-item--zero.is-current .aj-radio { border-color: #374151; }
    .aj-item--zero.is-current .aj-radio::after { background: #374151; }

    .aj-title { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 16px; }
    .aj-title span {
      font-size: 0.55em; font-weight: 600; letter-spacing: 0; padding: 4px 12px; border-radius: 10px;
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); color: #f8fafc;
    }
    .aj-dest {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; margin: 0 0 14px; padding: 14px; border-radius: 14px;
      background: #fff; border: 1px solid var(--line);
    }
    .aj-dest .is-main { grid-column: 1 / -1; }
    .aj-dest dt { font-size: 0.7rem; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; color: var(--muted); }
    .aj-dest dd { margin: 3px 0 0; font-size: 0.95rem; font-weight: 600; color: var(--ink-2); }
    .aj-dest .is-main dd { font-family: Manrope, sans-serif; font-size: 1.25rem; font-weight: 800; color: var(--dir); }

    .aj-node {
      position: relative; z-index: 1; width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center;
      font-family: Manrope, sans-serif; font-weight: 800; font-size: 1rem; color: var(--muted); background: #fff; border: 2px solid var(--line);
    }
    .aj-item[data-status="CONCLUIDA"] .aj-node { background: var(--ok); border-color: var(--ok); color: #fff; }
    .aj-item[data-status="EM_ANDAMENTO"] .aj-node { background: #fff; border-color: var(--now); color: var(--now); }
    .aj-item.is-current .aj-node { background: var(--now); border-color: var(--now); color: #fff; box-shadow: 0 0 0 5px rgba(37, 99, 235, .18); }
    .aj-item--zero .aj-node { background: #f3f4f6; }
    .aj-item--zero.is-current .aj-node { background: #374151; border-color: #374151; box-shadow: 0 0 0 5px rgba(55, 65, 81, .15); }

    .aj-name { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .aj-name strong { font-family: Manrope, sans-serif; font-size: 1.02rem; font-weight: 800; color: var(--ink); line-height: 1.25; }
    .aj-name small { color: var(--muted); font-size: 0.82rem; font-weight: 500; }
    .aj-status {
      justify-self: start; padding: 4px 11px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; white-space: nowrap;
      background: #f3f4f6; color: #374151; border: 1px solid var(--line);
    }
    .aj-status[data-s="CONCLUIDA"] { background: var(--ok-soft); color: #047857; border-color: #a7f3d0; }
    .aj-status[data-s="EM_ANDAMENTO"] { background: var(--now-soft); color: #1d4ed8; border-color: #bfdbfe; }
    .aj-status[data-s="ZERO"] { background: #fff; color: var(--muted); }
    .aj-when { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 0.82rem; color: var(--ink-2); min-width: 0; }
    .aj-when > span { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
    .aj-when i { font-size: 0.74rem; color: var(--muted-2); }
    .aj-when .muted { color: var(--muted-2); font-style: italic; }
    .aj-flag { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
    .aj-flag b {
      padding: 3px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; white-space: nowrap;
    }
    .aj-flag .is-now { background: var(--now); color: #fff; }
    .aj-item--zero .aj-flag .is-now { background: #374151; }
    .aj-flag .is-dest { background: var(--dir, #4f46e5); color: #fff; }
    @container ajtrack (max-width: 980px) {
      .aj-item { grid-template-columns: 22px 46px minmax(0, 1fr) auto; row-gap: 6px; }
      .aj-radio, .aj-node { grid-row: 1 / span 2; }
      .aj-name { grid-column: 3; grid-row: 1; }
      .aj-status { grid-column: 4; grid-row: 1; justify-self: end; }
      .aj-when { grid-column: 3; grid-row: 2; }
      .aj-flag { grid-column: 4; grid-row: 2; }
    }
    @container ajtrack (max-width: 520px) {
      .aj-item { grid-template-columns: 22px 46px minmax(0, 1fr); gap: 6px 12px; }
      .aj-radio, .aj-node { grid-row: 1 / span 4; }
      .aj-name, .aj-status, .aj-when, .aj-flag { grid-column: 3; grid-row: auto; justify-self: start; align-items: flex-start; }
      .aj-item::before { left: 69px; }
    }

    .aj-side {
      position: sticky; top: 16px; max-height: calc(100vh - 150px); overflow-y: auto; overscroll-behavior: contain;
      scrollbar-width: thin; border-radius: 20px;
    }
    @container aj (max-width: 960px) { .aj-side { position: static; max-height: none; overflow: visible; } }
    .aj-plan { padding: 20px; border-width: 1px; }
    .aj-plan[data-d]:not([data-d="SEM_MUDANCA"]) { border-top: 4px solid var(--dir); }
    .aj-plan-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--line-soft); }
    .aj-plan-head small { display: block; margin-top: 6px; color: var(--muted); font-size: 0.82rem; }
    .aj-dir-chip {
      display: inline-flex; align-items: center; gap: 8px; margin-top: 6px; padding: 5px 12px; border-radius: 999px;
      background: var(--dir); color: #fff; font-family: Manrope, sans-serif; font-weight: 800; font-size: 0.92rem;
    }
    .aj-dir-ico {
      width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; flex: none;
      background: var(--dir); color: #fff; font-size: 1.1rem; box-shadow: 0 10px 22px color-mix(in srgb, var(--dir) 35%, transparent);
    }

    .aj-compare { display: grid; grid-template-columns: minmax(0, 1fr) 30px minmax(0, 1fr); align-items: stretch; gap: 8px; padding: 16px 0; }
    .aj-cmp {
      display: flex; flex-direction: column; gap: 3px; padding: 12px 14px; border-radius: 14px; background: #f3f4f6;
      border: 1px solid var(--line); border-left: 4px solid var(--stage); min-width: 0;
    }
    .aj-cmp strong { font-family: Manrope, sans-serif; font-size: 0.98rem; font-weight: 800; color: var(--ink); line-height: 1.25; margin-top: 3px; overflow-wrap: anywhere; }
    .aj-cmp small { color: var(--muted); font-size: 0.8rem; font-weight: 600; }
    .aj-cmp.is-to { background: var(--dir-soft); border-color: color-mix(in srgb, var(--dir) 40%, transparent); border-left-color: var(--dir); }
    .aj-cmp.is-to strong { color: var(--dir); }
    .aj-cmp.is-to .aj-os-label { color: var(--dir); }
    .aj-cmp-arrow { align-self: center; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: var(--dir); color: #fff; font-size: 0.8rem; }

    .aj-sit { margin-bottom: 14px; }
    .aj-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    .aj-seg button {
      display: flex; align-items: flex-start; gap: 10px; padding: 11px 12px; text-align: left; font: inherit; color: var(--ink-2);
      background: #fff; border: 2px solid var(--line); border-radius: 12px; cursor: pointer; transition: border-color .15s ease, background .15s ease;
    }
    .aj-seg button i { font-size: 1.05rem; margin-top: 1px; color: var(--muted); }
    .aj-seg button b { display: block; font-size: 0.9rem; color: var(--ink); }
    .aj-seg button small { display: block; font-size: 0.74rem; color: var(--muted); line-height: 1.35; margin-top: 2px; }
    .aj-seg button:hover:not(:disabled) { border-color: var(--dir); }
    .aj-seg button.on { border-color: var(--dir); background: var(--dir-soft); }
    .aj-seg button.on i, .aj-seg button.on b { color: var(--dir); }
    .aj-seg button:disabled { opacity: .5; cursor: not-allowed; background: #f9fafb; }

    .aj-switch { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; margin-bottom: 14px; border-radius: 14px; border: 1px solid var(--line); cursor: pointer; }
    .aj-switch input { position: absolute; opacity: 0; pointer-events: none; }
    .aj-switch .track { flex: none; width: 38px; height: 22px; border-radius: 999px; background: #9ca3af; position: relative; transition: background .2s ease; margin-top: 1px; }
    .aj-switch .thumb { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.2); transition: transform .2s ease; }
    .aj-switch input:checked + .track { background: var(--dir); }
    .aj-switch input:checked + .track .thumb { transform: translateX(16px); }
    .aj-switch input:focus-visible + .track { outline: 3px solid color-mix(in srgb, var(--dir) 35%, transparent); outline-offset: 2px; }
    .aj-switch .txt { font-size: 0.88rem; font-weight: 600; color: var(--ink-2); }
    .aj-switch .txt small { display: block; font-weight: 400; color: var(--muted); font-size: 0.78rem; margin-top: 2px; }

    .aj-effects-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .aj-counts { display: flex; gap: 6px; }
    .aj-counts span { padding: 2px 9px; border-radius: 999px; font-size: 0.74rem; font-weight: 700; }
    .aj-counts .is-void { background: var(--zero-soft); color: var(--zero); }
    .aj-counts .is-new { background: var(--adv-soft); color: var(--adv); }
    .aj-effects ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto; }
    .aj-effects li { display: flex; gap: 10px; align-items: flex-start; padding: 9px 10px; border-radius: 12px; background: #f9fafb; border: 1px solid var(--line-soft); border-left: 3px solid var(--stage); }
    .aj-effects li.is-none { border-left-color: #9ca3af; }
    .ef-ico { flex: none; width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; font-size: 0.78rem; background: #e5e7eb; color: #374151; }
    .aj-effects li[data-t="ANULAR"] .ef-ico { background: var(--zero-soft); color: var(--zero); }
    .aj-effects li[data-t="REABRIR"] .ef-ico { background: var(--back-soft); color: var(--back); }
    .aj-effects li[data-t^="CRIAR"] .ef-ico { background: var(--adv-soft); color: var(--adv); }
    .aj-effects li[data-t="FECHAR"] .ef-ico { background: var(--repo-soft); color: var(--repo); }
    .ef-txt { font-size: 0.84rem; color: var(--ink-2); line-height: 1.4; }
    .ef-txt b { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
    .aj-effects-err { padding: 10px 12px; border-radius: 12px; background: var(--zero-soft); color: var(--zero); font-size: 0.84rem; }
    .aj-shimmer { display: flex; flex-direction: column; gap: 6px; }
    .aj-shimmer span { height: 44px; border-radius: 12px; background: linear-gradient(90deg, #eef2f7 0%, #f8fafc 50%, #eef2f7 100%); background-size: 200% 100%; animation: ajShim 1.2s linear infinite; }

    .aj-reason { margin-top: 16px; padding: 14px; border-radius: 14px; background: #fffbeb; border: 1px solid #fcd34d; transition: background .2s ease, border-color .2s ease; }
    .aj-reason.is-ok { background: #f9fafb; border-color: var(--line); }
    .aj-reason label { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.9rem; color: var(--ink); }
    .aj-reason label em {
      font-style: normal; font-size: 0.66rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
      padding: 2px 7px; border-radius: 6px; background: #b45309; color: #fff;
    }
    .aj-reason.is-ok label em { background: var(--ok); }
    .aj-reason textarea {
      width: 100%; margin-top: 8px; resize: vertical; min-height: 88px; border-radius: 12px; font: inherit; font-size: 0.92rem;
      border: 1px solid #9ca3af; background: #fff; padding: 10px 12px; color: var(--ink);
    }
    .aj-reason textarea:focus { border-color: var(--dir); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dir) 18%, transparent); outline: 0; }
    .aj-reason-foot { display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.78rem; color: var(--muted); }
    .aj-reason-foot .ok { color: var(--ok); font-weight: 600; }
    .aj-reason-foot i { margin-right: 4px; }

    .aj-actions {
      position: sticky; bottom: 0; z-index: 2; display: flex; flex-direction: column; gap: 8px;
      margin: 16px -20px -20px; padding: 14px 20px 20px; background: #fff; border-top: 1px solid var(--line-soft); border-radius: 0 0 19px 19px;
      box-shadow: 0 -10px 20px rgba(17, 24, 39, 0.06);
    }
    .aj-apply {
      width: 100%; height: 56px; border: 0; border-radius: 14px; cursor: pointer; font: inherit; font-family: Manrope, sans-serif;
      font-weight: 800; font-size: 1.05rem; letter-spacing: .01em;
      display: inline-flex; align-items: center; justify-content: center; gap: 10px; color: #fff; background: var(--dir);
      box-shadow: 0 12px 26px color-mix(in srgb, var(--dir) 34%, transparent); transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
    }
    .aj-apply:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 16px 30px color-mix(in srgb, var(--dir) 42%, transparent); }
    .aj-apply:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
    .aj-cancel {
      width: 100%; height: 42px; border-radius: 12px; border: 1px solid var(--line); background: #fff; color: var(--ink-2);
      font: inherit; font-weight: 600; font-size: 0.92rem; cursor: pointer;
    }
    .aj-cancel:hover:not(:disabled) { background: #f3f4f6; }
    .aj-apply-hint { display: flex; gap: 8px; align-items: flex-start; margin: 10px 2px 0; font-size: 0.8rem; color: var(--muted); line-height: 1.4; }
    .aj-apply-hint i { margin-top: 2px; }

    .aj-idle { text-align: center; padding: 22px 8px 8px; }
    .aj-idle-art { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 18px; }
    .aj-idle-art .n { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; border: 2px solid var(--line); background: #fff; font-size: 0.9rem; }
    .aj-idle-art .n-done { background: var(--ok); border-color: var(--ok); color: #fff; }
    .aj-idle-art .n-now { background: var(--now); border-color: var(--now); box-shadow: 0 0 0 6px rgba(37, 99, 235, .15); }
    .aj-idle-art .n-dest { border: 2px dashed #4f46e5; color: #4f46e5; animation: ajBob 1.8s ease-in-out infinite; }
    .aj-idle-art .ln { width: 38px; height: 3px; background: var(--ok); }
    .aj-idle-art .ln-dash { background: repeating-linear-gradient(90deg, #a5b4fc 0 6px, transparent 6px 11px); }
    @keyframes ajBob { 50% { transform: translateY(-4px); } }
    .aj-idle strong { display: block; font-family: Manrope, sans-serif; font-size: 1.12rem; font-weight: 800; color: var(--ink); }
    .aj-idle p { margin: 8px auto 18px; max-width: 320px; color: var(--ink-2); font-size: 0.95rem; line-height: 1.5; }
    .aj-idle ul { list-style: none; padding: 16px 0 0; margin: 0; border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 10px; text-align: left; }
    .aj-idle li { display: flex; gap: 10px; align-items: center; font-size: 0.86rem; color: var(--ink-2); }
    .aj-idle li i { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; background: #eff6ff; color: #1d4ed8; font-size: 0.78rem; flex: none; }
    .aj-foot { margin: 10px 4px 0; color: var(--muted); font-size: 0.78rem; display: flex; gap: 6px; align-items: center; }

    .aj-hist-list { list-style: none; margin: 0; padding: 0 20px 16px; }
    .aj-hist-list li { display: flex; gap: 14px; padding: 12px 0; border-top: 1px solid var(--line-soft); }
    .aj-hist-list li:first-child { border-top: 0; }
    .h-ico { flex: none; width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: var(--repo-soft); color: var(--repo); }
    .aj-hist-list li[data-a="ESTORNO"] .h-ico { background: var(--back-soft); color: var(--back); }
    .h-body { flex: 1; min-width: 0; }
    .h-top { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
    .h-top strong { font-size: 0.9rem; }
    .h-top span { color: var(--muted); font-size: 0.8rem; }
    .h-body p { margin: 4px 0; color: var(--ink-2); font-size: 0.86rem; line-height: 1.45; }
    .h-body small { color: var(--muted); font-size: 0.76rem; }

    .aj-dlg-dir { display: flex; gap: 12px; align-items: center; padding: 14px; border-radius: 14px; background: var(--dir-soft); margin-bottom: 14px; }
    .aj-dlg-dir strong { display: block; color: var(--dir); font-family: Manrope, sans-serif; font-size: 1.02rem; }
    .aj-dlg-dir span { font-size: 0.86rem; color: #1e293b; }
    .aj-dlg-dir span i { font-size: 0.7rem; margin: 0 4px; }
    .aj-dlg-facts { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem; color: #1e293b; }
    .aj-dlg-facts li { display: flex; gap: 10px; align-items: flex-start; }
    .aj-dlg-facts i { color: #64748b; margin-top: 3px; }
    .aj-dlg-guard { margin-top: 16px; padding: 14px; border-radius: 14px; border: 1px dashed #fca5a5; background: #fef2f2; }
    .aj-dlg-guard label { display: block; font-size: 0.86rem; color: #7f1d1d; margin-bottom: 8px; }
    .aj-dlg-guard input { width: 100%; height: 42px; border-radius: 10px; border: 1px solid #fca5a5; padding: 0 12px; font: inherit; font-family: 'IBM Plex Mono', monospace; }
    .aj-dlg-guard input:focus { outline: 0; border-color: #b91c1c; box-shadow: 0 0 0 3px rgba(185,28,28,.15); }
    .aj-dlg-dir .aj-dir-ico { width: 40px; height: 40px; border-radius: 12px; }
  `]
})
export class OsFluxoAjusteComponent implements OnInit, OnDestroy {
  private api = inject(OsFluxoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messages = inject(MessageService);

  @ViewChild('buscaBox') buscaBox?: ElementRef<HTMLElement>;
  @ViewChild('buscaInput') buscaInput?: ElementRef<HTMLInputElement>;

  osId: number | null = null;
  det: FluxoDetalhe | null = null;
  carregando = false;
  erro: string | null = null;

  busca = '';
  sugestoes: FluxoSugestaoOs[] = [];
  buscando = false;
  painelBusca = false;
  sugAtiva = -1;
  private busca$ = new Subject<string>();

  posicoes: Posicao[] = [];
  linhas: LinhaEtapa[] = [];
  posAtual = -1;
  alvo: number | null = null;
  preencherIntermediarias = true;

  plano: FluxoAjustePlano | null = null;
  simulando = false;
  erroSimulacao: string | null = null;
  private simular$ = new Subject<void>();

  motivo = '';
  confirmacao = '';
  mostrarConfirmar = false;
  aplicando = false;
  ultimoAjuste: { direcao: FluxoAjusteDirecao; de: string; para: string } | null = null;

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.subs.push(this.route.paramMap.subscribe(pm => {
      const id = Number(pm.get('id'));
      if (id > 0) {
        this.carregar(id);
      } else {
        this.osId = null;
        this.det = null;
        this.erro = null;
        setTimeout(() => this.buscaInput?.nativeElement.focus(), 80);
      }
    }));

    this.subs.push(this.busca$.pipe(
      map(q => q.trim()),
      debounceTime(220),
      switchMap(q => !q ? of([] as FluxoSugestaoOs[]) : this.api.sugerirOs(q, 8).pipe(catchError(() => of([] as FluxoSugestaoOs[]))))
    ).subscribe(lista => {
      this.buscando = false;
      this.sugestoes = lista || [];
      this.sugAtiva = this.sugestoes.length ? 0 : -1;
    }));

    this.subs.push(this.simular$.pipe(
      tap(() => { this.simulando = true; this.erroSimulacao = null; }),
      debounceTime(120),
      switchMap(() => {
        const req = this.requisicao();
        if (!req || !this.osId) return of(null);
        return this.api.simularAjuste(this.osId, req).pipe(catchError(err => {
          this.erroSimulacao = this.msgErro(err, 'Não foi possível simular o ajuste.');
          return of(null);
        }));
      })
    ).subscribe(p => {
      this.simulando = false;
      this.plano = p;
    }));
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  @HostListener('document:keydown', ['$event'])
  onAtalho(ev: KeyboardEvent): void {
    const alvo = ev.target as HTMLElement | null;
    const editando = !!alvo && (/^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName) || alvo.isContentEditable);
    if (ev.key === '/' && !editando && !this.mostrarConfirmar) {
      ev.preventDefault();
      this.buscaInput?.nativeElement.focus();
    }
  }

  @HostListener('document:click', ['$event'])
  onClickFora(ev: MouseEvent): void {
    if (this.painelBusca && this.buscaBox && !this.buscaBox.nativeElement.contains(ev.target as Node)) {
      this.painelBusca = false;
    }
  }

  // ---------------------------------------------------------------- busca

  onBusca(q: string): void {
    this.painelBusca = true;
    this.buscando = !!q.trim();
    this.busca$.next(q);
  }

  onBuscaKey(ev: KeyboardEvent): void {
    if (ev.key === 'ArrowDown' && this.sugestoes.length) {
      ev.preventDefault();
      this.sugAtiva = (this.sugAtiva + 1) % this.sugestoes.length;
    } else if (ev.key === 'ArrowUp' && this.sugestoes.length) {
      ev.preventDefault();
      this.sugAtiva = (this.sugAtiva - 1 + this.sugestoes.length) % this.sugestoes.length;
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      const s = this.sugestoes[this.sugAtiva];
      if (s) {
        this.abrirOs(s.os.id);
      } else {
        const m = /(\d{1,12})/.exec(this.busca);
        if (m) this.abrirOs(Number(m[1]));
      }
    } else if (ev.key === 'Escape') {
      this.painelBusca = false;
    }
  }

  limparBusca(): void {
    this.busca = '';
    this.sugestoes = [];
    this.busca$.next('');
    this.buscaInput?.nativeElement.focus();
  }

  abrirOs(id: number): void {
    this.painelBusca = false;
    this.busca = '';
    this.sugestoes = [];
    this.busca$.next('');
    this.buscaInput?.nativeElement.blur();
    if (id === this.osId) {
      this.carregar(id);
    } else {
      this.router.navigate(['/os/fluxo/ajuste', id]);
    }
  }

  // ---------------------------------------------------------------- dados

  carregar(id: number, manterAviso = false): void {
    if (this.osId !== id) this.det = null;
    this.osId = id;
    this.carregando = true;
    this.erro = null;
    if (!manterAviso) this.ultimoAjuste = null;
    this.api.detalhe(id).subscribe({
      next: (d) => {
        this.det = d;
        this.carregando = false;
        this.montarPosicoes();
        this.limparAlvo();
      },
      error: (err: HttpErrorResponse) => {
        this.carregando = false;
        this.det = null;
        this.erro = this.msgErro(err, 'Não foi possível carregar a OS.');
      }
    });
  }

  private montarPosicoes(): void {
    if (!this.det) return;
    const pos: Posicao[] = [{ idx: 0, tipo: 'ZERO' }];
    const linhas: LinhaEtapa[] = [];
    for (const s of this.det.etapas) {
      const em: Posicao = { idx: pos.length, tipo: 'EM', etapa: s.etapa };
      pos.push(em);
      const conc: Posicao = { idx: pos.length, tipo: 'CONC', etapa: s.etapa };
      pos.push(conc);
      linhas.push({ status: s, em, conc });
    }
    this.posicoes = pos;
    this.linhas = linhas;
    const os = this.det.os;
    if (!os.fluxoSituacao) {
      this.posAtual = 0;
    } else {
      const tipo = os.fluxoSituacao === 'EM_ETAPA' ? 'EM' : 'CONC';
      this.posAtual = pos.findIndex(p => p.tipo === tipo && p.etapa?.id === os.fluxoEtapaId);
    }
  }

  get etapaAtual(): FluxoEtapa | null {
    return this.posAtual > 0 ? this.posicoes[this.posAtual]?.etapa ?? null : null;
  }

  get progresso(): number {
    const r = this.det?.resumo;
    return r && r.totalEtapas ? Math.round(100 * r.etapasConcluidas / r.totalEtapas) : 0;
  }

  get historico(): FluxoEvento[] {
    return (this.det?.eventos || []).filter(e => e.acao === 'AJUSTE' || e.acao === 'ESTORNO');
  }

  // ---------------------------------------------------------------- seleção

  selecionar(idx: number): void {
    if (idx === this.posAtual || idx < 0 || idx >= this.posicoes.length || this.aplicando) return;
    this.alvo = idx;
    this.plano = null;
    this.confirmacao = '';
    this.simular();
  }

  passo(delta: number): void {
    const base = this.alvo ?? this.posAtual;
    const prox = base + delta;
    if (prox < 0 || prox >= this.posicoes.length) return;
    if (prox === this.posAtual) {
      this.limparAlvo();
    } else {
      this.selecionar(prox);
    }
  }

  limparAlvo(): void {
    this.alvo = null;
    this.plano = null;
    this.simulando = false;
    this.erroSimulacao = null;
    this.confirmacao = '';
  }

  simular(): void {
    if (this.alvo !== null) this.simular$.next();
  }

  get podeVoltar(): boolean {
    return (this.alvo ?? this.posAtual) > 0;
  }

  get podeAvancar(): boolean {
    return (this.alvo ?? this.posAtual) < this.posicoes.length - 1;
  }

  private requisicao(): FluxoAjusteRequest | null {
    if (this.alvo === null) return null;
    const p = this.posicoes[this.alvo];
    if (!p) return null;
    if (p.tipo === 'ZERO') return { tipo: 'ZERAR' };
    return {
      tipo: 'POSICIONAR', etapaId: p.etapa!.id, situacao: p.tipo === 'EM' ? 'EM_ETAPA' : 'CONCLUIDA',
      preencherIntermediarias: this.preencherIntermediarias
    };
  }

  get direcaoLocal(): FluxoAjusteDirecao | null {
    if (this.alvo === null) return null;
    if (this.alvo === 0) return 'ZERAR';
    if (this.posAtual < 0) return 'REPOSICIONAR';
    return this.alvo > this.posAtual ? 'AVANCO' : 'RETROCESSO';
  }

  get direcao(): FluxoAjusteDirecao {
    return this.plano?.direcao ?? this.direcaoLocal ?? 'REPOSICIONAR';
  }

  get distanciaTexto(): string {
    if (this.alvo === null) return '';
    if (this.alvo === 0) return 'A OS volta ao início do fluxo';
    if (this.posAtual < 0) return 'Posição atual fora das etapas ativas';
    const n = Math.abs(this.alvo - this.posAtual);
    return `${n} posiç${n === 1 ? 'ão' : 'ões'} ${this.alvo > this.posAtual ? 'à frente' : 'para trás'}`;
  }

  noCaminho(idx: number): boolean {
    if (this.alvo === null || this.posAtual < 0) return false;
    const a = Math.min(this.alvo, this.posAtual);
    const b = Math.max(this.alvo, this.posAtual);
    return idx > a && idx < b;
  }

  afetada(l: LinhaEtapa): boolean {
    return this.noCaminho(l.em.idx) || this.noCaminho(l.conc.idx);
  }

  linhaAtual(l: LinhaEtapa): boolean {
    return this.posAtual === l.em.idx || this.posAtual === l.conc.idx;
  }

  linhaAlvo(l: LinhaEtapa): boolean {
    return this.alvo === l.em.idx || this.alvo === l.conc.idx;
  }

  get linhaDoAlvo(): LinhaEtapa | null {
    return this.alvo === null ? null : this.linhas.find(l => this.linhaAlvo(l)) ?? null;
  }

  /** Clique na linha: entra "em andamento" na etapa, ou "concluída" se já estiver em andamento nela. */
  selecionarLinha(l: LinhaEtapa): void {
    if (this.aplicando) return;
    if (this.linhaAlvo(l)) return;
    this.selecionar(this.posAtual === l.em.idx ? l.conc.idx : l.em.idx);
  }

  trackLinha = (_: number, l: LinhaEtapa) => l.status.etapa.id;

  // ---------------------------------------------------------------- aplicação

  get motivoOk(): boolean {
    return this.motivo.trim().length >= 10;
  }

  get podeAplicar(): boolean {
    return !!this.plano && this.plano.direcao !== 'SEM_MUDANCA' && !!this.plano.efeitos.length
      && !this.simulando && this.motivoOk && !this.aplicando;
  }

  get confirmacaoOk(): boolean {
    return this.plano?.direcao !== 'ZERAR' || this.confirmacao.trim() === String(this.osId);
  }

  abrirConfirmacao(): void {
    if (!this.podeAplicar) return;
    this.confirmacao = '';
    if (this.plano?.direcao === 'ZERAR') {
      this.mostrarConfirmar = true;
    } else {
      this.aplicar();
    }
  }

  aplicar(): void {
    const req = this.requisicao();
    if (!req || !this.osId || !this.plano || !this.confirmacaoOk || this.alvo === null) return;
    req.motivo = this.motivo.trim();
    const resumo = {
      direcao: this.plano.direcao,
      de: this.rotulo(this.posicoes[this.posAtual]),
      para: this.rotulo(this.posicoes[this.alvo])
    };
    this.aplicando = true;
    this.api.aplicarAjuste(this.osId, req).subscribe({
      next: (d) => {
        this.aplicando = false;
        this.mostrarConfirmar = false;
        this.det = d;
        this.montarPosicoes();
        this.limparAlvo();
        this.motivo = '';
        this.ultimoAjuste = resumo;
        this.messages.add({ severity: 'success', summary: `${this.tituloDirecao(resumo.direcao)} aplicado`, detail: `${resumo.de} → ${resumo.para}`, life: 5000 });
      },
      error: (err: HttpErrorResponse) => {
        this.aplicando = false;
        this.messages.add({ severity: 'error', summary: 'Ajuste não aplicado', detail: this.msgErro(err, 'Falha ao aplicar o ajuste.'), life: 7000 });
      }
    });
  }

  // ---------------------------------------------------------------- rótulos

  rotulo(p?: Posicao | null): string {
    if (!p) return 'Posição desconhecida';
    if (p.tipo === 'ZERO') return 'Não iniciada';
    const e = p.etapa!;
    const nome = `${e.ordem}. ${e.nome}`;
    if (p.tipo === 'EM') return `Em andamento · ${nome}`;
    return this.posicoes[p.idx + 1] ? `${nome} concluída` : 'Fluxo concluído';
  }

  subRotulo(p?: Posicao | null): string {
    if (!p) return this.det ? labelSituacao(this.det.os.fluxoSituacao) : '';
    if (p.tipo === 'ZERO') return 'Aguardando a primeira entrada';
    if (p.tipo === 'EM') return 'Etapa aberta, aguardando a saída';
    const prox = this.posicoes[p.idx + 1]?.etapa;
    return prox ? `Aguardando entrada em ${prox.ordem}. ${prox.nome}` : `Última etapa (${p.etapa!.nome}) concluída`;
  }

  rotuloCompleto(p: Posicao): string {
    const base = this.rotulo(p);
    if (p.idx === this.posAtual) return `${base} (posição atual)`;
    return p.idx === this.alvo ? `${base} (destino selecionado)` : `Mover para: ${base}`;
  }

  rotuloStatus(s: FluxoEtapaStatus['status']): string {
    return s === 'CONCLUIDA' ? 'concluída' : s === 'EM_ANDAMENTO' ? 'em andamento' : 'pendente';
  }

  rotuloStatusTitulo(s: FluxoEtapaStatus['status']): string {
    return s === 'CONCLUIDA' ? 'Concluída' : s === 'EM_ANDAMENTO' ? 'Em andamento' : 'Pendente';
  }

  rotuloLinha(l: LinhaEtapa): string {
    const base = `${l.status.etapa.ordem}. ${l.status.etapa.nome}, ${this.rotuloStatus(l.status.status)}`;
    if (this.linhaAlvo(l)) return `${base} (destino selecionado)`;
    return this.linhaAtual(l) ? `${base} (posição atual)` : `Mover para ${base}`;
  }

  tituloPosicao(p?: Posicao | null): string {
    if (!p) return 'Posição desconhecida';
    return p.tipo === 'ZERO' ? 'Não iniciada' : `${p.etapa!.ordem}. ${p.etapa!.nome}`;
  }

  situacaoPosicao(p?: Posicao | null): string {
    if (!p) return this.det ? labelSituacao(this.det.os.fluxoSituacao) : '';
    if (p.tipo === 'ZERO') return 'Fora do fluxo';
    if (p.tipo === 'EM') return 'Em andamento';
    return this.posicoes[p.idx + 1] ? 'Concluída · aguarda a próxima etapa' : 'Fluxo concluído';
  }

  iconePosicao(p?: Posicao | null): string {
    if (!p || p.tipo === 'ZERO') return 'pi-power-off';
    if (p.tipo === 'EM') return 'pi-cog';
    return this.posicoes[p.idx + 1] ? 'pi-check' : 'pi-flag-fill';
  }

  duracao(seg?: number | null): string {
    return formatarDuracao(seg);
  }

  tituloDirecao(d: FluxoAjusteDirecao): string {
    return DIRECOES[d]?.titulo ?? 'Ajuste';
  }

  iconeDirecao(d: FluxoAjusteDirecao): string {
    return DIRECOES[d]?.icone ?? 'pi-sliders-h';
  }

  verboDirecao(d: FluxoAjusteDirecao): string {
    return DIRECOES[d]?.verbo ?? 'Aplicar ajuste';
  }

  rotuloEfeito(t: FluxoAjusteEfeitoTipo): string {
    return EFEITOS[t]?.rotulo ?? t;
  }

  iconeEfeito(t: FluxoAjusteEfeitoTipo): string {
    return EFEITOS[t]?.icone ?? 'pi-circle';
  }

  dataHora(v?: string | null): string {
    return formatarDataHora(v);
  }

  private msgErro(err: unknown, padrao: string): string {
    const e = err as HttpErrorResponse;
    if (e?.status === 0) return 'Sem conexão com o servidor.';
    if (e?.status === 403) return e.error?.mensagem || 'Seu perfil não possui a permissão Ajuste de Etapas.';
    return e?.error?.mensagem || e?.error?.message || padrao;
  }
}
