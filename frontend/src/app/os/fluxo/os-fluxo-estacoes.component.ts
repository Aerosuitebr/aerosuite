import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { FluxoEstacaoGestao, FluxoEstacoesGestao, FluxoMaquina, FluxoPareamentoInfo, OsFluxoService } from './os-fluxo.service';

const STORAGE_TERMINAL = 'osFluxo.terminalId';

interface EdicaoMaquina {
  estacaoCodigo: string;
  apelido: string;
}

@Component({
  standalone: true,
  selector: 'app-os-fluxo-estacoes',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DialogModule, DropdownModule, InputTextModule, TooltipModule, ToastModule, MenuModule, TranslatePipe],
  providers: [MessageService],
  styleUrls: ['./fluxo-shared.css', './os-fluxo-estacoes.component.css'],
  template: `
    <p-toast></p-toast>
    <p-menu #acoes styleClass="ge-station-menu" [model]="acoesEstacao" [popup]="true" [baseZIndex]="12000" appendTo="body"></p-menu>
    <div class="fx-shell ge-page">
      <header class="fx-hero ge-hero">
        <div>
          <button pButton type="button" icon="pi pi-arrow-left" class="p-button-text p-button-sm fx-back"
                  [label]="'fluxo.estacoes.back' | translate" routerLink="/os/fluxo"></button>
          <p class="fx-eyebrow">{{ 'fluxo.estacoes.eyebrow' | translate }}</p>
          <h1>{{ 'fluxo.estacoes.title' | translate }}</h1>
          <p class="fx-lead ge-lead">{{ 'fluxo.estacoes.lead' | translate }}</p>
        </div>
        <div class="fx-hero-actions ge-actions">
          <button type="button" class="fx-ghost-btn ge-ghost" (click)="carregar()" [disabled]="carregando" [attr.aria-busy]="carregando">
            <i class="pi pi-refresh" [class.pi-spin]="carregando"></i> {{ 'fluxo.estacoes.refresh' | translate }}
          </button>
          <a class="fx-ghost-btn ge-ghost" routerLink="/os/fluxo/estacao"><i class="pi pi-qrcode"></i> {{ 'fluxo.estacoes.openStation' | translate }}</a>
          <button type="button" class="ge-primary" (click)="abrirEstacao()" [disabled]="!dados">
            <i class="pi pi-plus"></i> {{ 'fluxo.estacoes.newStation' | translate }}
          </button>
        </div>
      </header>

      <div class="ge-skel" *ngIf="carregando && !dados" role="status">
        <span class="sr-only">{{ 'fluxo.estacoes.loading' | translate }}</span>
        <div class="ge-skel-kpis" aria-hidden="true"><span class="ge-skel-bar"></span><span class="ge-skel-bar"></span><span class="ge-skel-bar"></span></div>
        <div class="ge-skel-card" aria-hidden="true"></div>
      </div>

      <div class="fx-card ge-erro" *ngIf="erro && !dados">
        <div class="fx-empty-state">
          <span class="ico"><i class="pi pi-exclamation-triangle"></i></span>
          <strong>{{ 'fluxo.estacoes.loadError' | translate }}</strong>
          <span role="alert">{{ erro }}</span>
          <button pButton type="button" [label]="'fluxo.estacoes.retry' | translate" icon="pi pi-refresh" class="p-button-sm" (click)="carregar()"></button>
        </div>
      </div>

      <ng-container *ngIf="dados as d">
        <p class="ge-refreshing" *ngIf="carregando" role="status"><i class="pi pi-spin pi-spinner"></i> {{ 'fluxo.estacoes.refreshing' | translate }}</p>
        <section class="ge-kpis ge-rise" [attr.aria-label]="'fluxo.estacoes.summary' | translate">
          <button type="button" class="ge-kpi" (click)="abrirResumo('estacoes')">
            <span>{{ 'fluxo.estacoes.kpi.stations' | translate }}</span>
            <strong>{{ d.estacoes.length }}</strong>
            <em>{{ 'fluxo.estacoes.kpi.open' | translate }}</em>
          </button>
          <button type="button" class="ge-kpi ge-kpi--green" (click)="abrirResumo('maquinas')">
            <span>{{ 'fluxo.estacoes.kpi.machines' | translate }}</span>
            <strong>{{ d.maquinas.length }}</strong>
            <em>{{ 'fluxo.estacoes.kpi.open' | translate }}</em>
          </button>
          <button type="button" class="ge-kpi" [class.ge-kpi--amber]="estacoesSemVinculo > 0" (click)="abrirResumo('sem')">
            <span>{{ 'fluxo.estacoes.kpi.unpaired' | translate }}</span>
            <strong>{{ estacoesSemVinculo }}</strong>
            <small *ngIf="estacoesSemVinculo">{{ 'fluxo.estacoes.kpi.unpairedHint' | translate }}</small>
            <em>{{ 'fluxo.estacoes.kpi.open' | translate }}</em>
          </button>
        </section>

        <section class="fx-card ge-rise">
          <div class="fx-card-head">
            <h2>{{ 'fluxo.estacoes.kpi.stations' | translate }}</h2>
            <span class="ge-count">{{ d.estacoes.length === 1 ? ('fluxo.estacoes.stationOne' | translate) : ('fluxo.estacoes.stationMany' | translate:{ n: '' + d.estacoes.length }) }}</span>
          </div>
          <div class="fx-card-body">
            <div class="ge-setup" *ngIf="d.estacoes.length && !d.maquinas.length">
              <span class="ge-setup-mark" aria-hidden="true"><i class="pi pi-desktop"></i></span>
              <div>
                <h3>{{ 'fluxo.estacoes.setup.title' | translate }}</h3>
                <ol>
                  <li>{{ 'fluxo.estacoes.setup.1' | translate }}</li>
                  <li>{{ 'fluxo.estacoes.setup.2' | translate }}</li>
                  <li>{{ 'fluxo.estacoes.setup.3' | translate }}</li>
                  <li>{{ 'fluxo.estacoes.setup.4' | translate }}</li>
                </ol>
              </div>
              <button type="button" class="ge-primary" (click)="abrirPareamento()"><i class="pi pi-link"></i> {{ 'fluxo.estacoes.pairTitle' | translate }}</button>
            </div>
            <div class="ge-search">
              <label class="ge-search-field">
                <i class="pi pi-search" aria-hidden="true"></i>
                <input pInputText [(ngModel)]="buscaEstacao" [attr.aria-label]="'fluxo.estacoes.searchLabel' | translate" [placeholder]="'fluxo.estacoes.searchPlaceholder' | translate" />
                <button *ngIf="buscaEstacao" type="button" class="ge-clear" (click)="limparBusca()" [attr.aria-label]="'fluxo.estacoes.clearSearch' | translate"><i class="pi pi-times"></i></button>
              </label>
            </div>
            <div class="ge-table-wrap">
              <p class="sr-only" id="ge-lista-nav">{{ 'fluxo.estacoes.listNav' | translate }}</p>
              <table class="fx-table ge-table ge-stations" aria-describedby="ge-lista-nav">
                <thead>
                  <tr>
                    <th>{{ 'fluxo.estacoes.col.name' | translate }}<small class="ge-column-hint">{{ 'fluxo.estacoes.col.hint' | translate }}</small></th>
                    <th>{{ 'fluxo.estacoes.col.machines' | translate }}</th>
                    <th>{{ 'fluxo.estacoes.col.stages' | translate }}</th>
                    <th class="r"><span class="sr-only">{{ 'fluxo.estacoes.col.actions' | translate }}</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr #linhaEstacao *ngFor="let e of estacoesFiltradas; let i = index; trackBy: trackEstacao"
                      [attr.tabindex]="linhaAtiva(i) ? 0 : -1" (keydown)="navegarLinha($event, i)">
                    <td [attr.data-label]="'fluxo.estacoes.col.name' | translate">
                      <div *ngIf="editandoNome === e.codigo; else nomeEstacao" class="ge-inline">
                        <input #nomeInline pInputText [(ngModel)]="nomeRascunho" maxlength="120" [attr.aria-label]="'fluxo.estacoes.nameLabel' | translate:{ name: e.nome }" [disabled]="salvandoNome" (keydown.enter)="salvarNome(e)" (keydown.escape)="cancelarNome()" [attr.aria-invalid]="!!erroNome" [attr.aria-describedby]="erroNome ? 'ge-erro-nome' : null" />
                        <button type="button" class="ge-icon-btn ge-icon-btn--ok" [attr.aria-label]="'fluxo.estacoes.saveName' | translate" [disabled]="salvandoNome || !nomeRascunho.trim()" (click)="salvarNome(e)"><i class="pi" [ngClass]="salvandoNome ? 'pi-spin pi-spinner' : 'pi-check'"></i></button>
                        <button type="button" class="ge-icon-btn" [attr.aria-label]="'fluxo.estacoes.cancelEdit' | translate" [disabled]="salvandoNome" (click)="cancelarNome()"><i class="pi pi-times"></i></button>
                        <small *ngIf="erroNome" id="ge-erro-nome" class="gp-erro" role="alert">{{ erroNome }}</small>
                      </div>
                      <ng-template #nomeEstacao>
                        <button type="button" class="ge-name" [attr.aria-label]="'fluxo.estacoes.editNameAria' | translate:{ name: e.nome }" [disabled]="salvandoNome" (click)="editarNome(e)">
                          <span class="ge-dot" [style.background]="e.cor || '#64748b'" aria-hidden="true"></span>{{ e.nome }}<i class="pi pi-pencil" aria-hidden="true"></i>
                        </button>
                      </ng-template>
                      <small class="ge-sector" *ngIf="mostrarSetor(e)">{{ 'fluxo.estacoes.sector' | translate:{ name: e.setor || '' } }}</small>
                    </td>
                    <td [attr.data-label]="'fluxo.estacoes.col.machines' | translate">
                      <span *ngIf="e.maquinas" class="ge-pair"><span class="ge-status" aria-hidden="true"></span>{{ e.maquinas === 1 ? ('fluxo.estacoes.machineOne' | translate) : ('fluxo.estacoes.machineMany' | translate:{ n: '' + e.maquinas }) }}</span>
                      <button *ngIf="!e.maquinas" type="button" class="ge-pair" [attr.aria-label]="'fluxo.estacoes.pairAria' | translate:{ name: e.nome }" [pTooltip]="'fluxo.estacoes.noMachinesTip' | translate" tooltipPosition="top" (click)="abrirPareamento(e.codigo)">
                        <span class="ge-status ge-status--empty" aria-hidden="true"></span>{{ 'fluxo.estacoes.pairShortcut' | translate }}
                      </button>
                      <span class="ge-machine-summary" *ngIf="e.maquinas" tabindex="0" [pTooltip]="nomesMaquinas(e.codigo)" tooltipPosition="top">{{ nomesMaquinas(e.codigo) }}</span>
                    </td>
                    <td [attr.data-label]="'fluxo.estacoes.col.stages' | translate">
                      <details class="ge-stages">
                        <summary>
                          <span class="sr-only">{{ 'fluxo.estacoes.viewStages' | translate:{ name: e.nome } }}</span>
                          {{ e.etapas.length === 1 ? ('fluxo.estacoes.stageOne' | translate) : ('fluxo.estacoes.stageMany' | translate:{ n: '' + e.etapas.length }) }}
                          <i class="pi pi-chevron-down" aria-hidden="true"></i>
                        </summary>
                        <ul><li *ngFor="let etapa of e.etapas">{{ etapa }}</li></ul>
                      </details>
                    </td>
                    <td class="r" [attr.data-label]="'fluxo.estacoes.col.actions' | translate">
                      <button type="button" class="ge-icon-btn" [attr.aria-label]="'fluxo.estacoes.actionsAria' | translate:{ name: e.nome }" aria-haspopup="menu" [disabled]="salvandoNome" (click)="prepararAcoes(e); acoes.toggle($event)"><i class="pi pi-ellipsis-h"></i></button>
                    </td>
                  </tr>
                  <tr *ngIf="!estacoesFiltradas.length">
                    <td colspan="4" class="ge-empty">
                      <strong>{{ d.estacoes.length ? ('fluxo.estacoes.emptySearch' | translate) : ('fluxo.estacoes.emptyStations' | translate) }}</strong>
                      <p>{{ d.estacoes.length ? ('fluxo.estacoes.emptySearchHint' | translate) : ('fluxo.estacoes.emptyStationsHint' | translate) }}</p>
                      <button *ngIf="d.estacoes.length" type="button" class="ge-text-btn" (click)="limparBusca()">{{ 'fluxo.estacoes.clearSearch' | translate }}</button>
                      <button *ngIf="!d.estacoes.length" type="button" class="ge-primary" (click)="abrirEstacao()">{{ 'fluxo.estacoes.newStation' | translate }}</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="fx-card ge-rise ge-rise-late">
          <div class="fx-card-head">
            <div class="ge-head-copy">
              <h2>{{ 'fluxo.estacoes.machinesTitle' | translate }}</h2>
              <span class="ge-count">{{ d.maquinas.length === 1 ? ('fluxo.estacoes.machineOne' | translate) : ('fluxo.estacoes.machineMany' | translate:{ n: '' + d.maquinas.length }) }}</span>
              <p>{{ 'fluxo.estacoes.machinesLead' | translate }}</p>
            </div>
            <button type="button" class="ge-primary" (click)="abrirPareamento()"><i class="pi pi-link"></i> {{ 'fluxo.estacoes.pairTitle' | translate }}</button>
          </div>
          <div class="fx-card-body">
            <div class="ge-ajuda">
              <button type="button" class="ge-ajuda-btn" (click)="ajudaAberta = !ajudaAberta" [attr.aria-expanded]="ajudaAberta">
                <i class="pi pi-question-circle"></i> {{ 'fluxo.estacoes.how' | translate }}
              </button>
            </div>
            <ol class="ge-ajuda-det" *ngIf="ajudaAberta">
              <li>{{ 'fluxo.estacoes.how.1' | translate }}</li>
              <li>{{ 'fluxo.estacoes.how.2' | translate }}</li>
              <li>{{ 'fluxo.estacoes.how.3' | translate }}</li>
              <li>{{ 'fluxo.estacoes.how.4' | translate }}</li>
            </ol>

            <div class="fx-empty-state" *ngIf="!d.maquinas.length">
              <span class="ico"><i class="pi pi-desktop"></i></span>
              <strong>{{ 'fluxo.estacoes.machinesEmptyTitle' | translate }}</strong>
              <span>{{ 'fluxo.estacoes.machinesEmpty' | translate }}</span>
            </div>

            <div class="ge-table-wrap" *ngIf="d.maquinas.length">
              <table class="fx-table ge-table">
                <thead>
                  <tr>
                    <th>{{ 'fluxo.estacoes.col.machine' | translate }}</th>
                    <th>{{ 'fluxo.estacoes.col.station' | translate }}</th>
                    <th>{{ 'fluxo.estacoes.col.status' | translate }}</th>
                    <th>{{ 'fluxo.estacoes.col.by' | translate }}</th>
                    <th class="r"><span class="sr-only">{{ 'fluxo.estacoes.col.actions' | translate }}</span></th>
                  </tr>
                </thead>
                <tbody>
                  <ng-container *ngFor="let m of d.maquinas; trackBy: trackMaquina">
                    <tr [class.ge-atual]="m.terminalId === terminalAtual" [class.ge-aberta]="detalhe === m.terminalId">
                      <td class="ge-maq" [attr.data-label]="'fluxo.estacoes.col.machine' | translate">
                        <strong>{{ m.apelido || ('fluxo.estacoes.unnamed' | translate) }}</strong>
                        <div class="ge-maq-meta">
                          <span class="fx-chip fx-chip--accent ge-chip" *ngIf="m.terminalId === terminalAtual"><i class="pi pi-map-marker"></i> {{ 'fluxo.estacoes.thisMachine' | translate }}</span>
                          <span>{{ navegador(m.userAgent) }}</span>
                          <button type="button" class="ge-det-btn" (click)="alternarDetalhe(m)" [attr.aria-expanded]="detalhe === m.terminalId">
                            {{ detalhe === m.terminalId ? ('fluxo.estacoes.hideDetails' | translate) : ('fluxo.estacoes.details' | translate) }}
                            <i class="pi" [ngClass]="detalhe === m.terminalId ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                          </button>
                        </div>
                      </td>
                      <td class="ge-est-cell" [attr.data-label]="'fluxo.estacoes.col.station' | translate">
                        {{ nomeEstacao(m.estacaoCodigo) || m.estacaoNome || ('fluxo.estacoes.stationUnavailable' | translate) }}
                        <small class="ge-aviso" *ngIf="!estacaoExiste(m.estacaoCodigo)">
                          <i class="pi pi-exclamation-triangle"></i> {{ 'fluxo.estacoes.stationMissing' | translate:{ name: m.estacaoNome || m.estacaoCodigo } }}
                        </small>
                      </td>
                      <td class="ge-sit" [attr.data-label]="'fluxo.estacoes.col.status' | translate">
                        <span class="fx-chip ge-chip" [ngClass]="m.ativa ? 'fx-chip--done' : 'fx-chip--muted'">
                          <span class="dot"></span> {{ m.ativa ? ('fluxo.estacoes.linkActive' | translate) : ('fluxo.estacoes.linkInactive' | translate) }}
                        </span>
                        <div class="ge-sub" *ngIf="m.ultimoAcesso" [pTooltip]="'fluxo.estacoes.lastAccess' | translate:{ when: (m.ultimoAcesso | date:'dd/MM/yyyy HH:mm') || '' }"
                             tooltipPosition="top">{{ relativo(m.ultimoAcesso) }}<span class="sr-only"> {{ m.ultimoAcesso | date:'dd/MM/yyyy HH:mm' }}</span></div>
                      </td>
                      <td class="ge-quem" [attr.data-label]="'fluxo.estacoes.col.by' | translate">{{ m.usuarioNome || '—' }}</td>
                      <td class="r" [attr.data-label]="'fluxo.estacoes.col.actions' | translate">
                        <div class="ge-acoes">
                          <button pButton type="button" icon="pi pi-pencil" [label]="'fluxo.estacoes.edit' | translate" class="p-button-sm p-button-text" (click)="abrirMaquina(m)"></button>
                          <button pButton type="button" icon="pi pi-trash" [label]="'fluxo.estacoes.remove' | translate" class="p-button-sm p-button-text ge-remove"
                                  [pTooltip]="'fluxo.estacoes.removeTip' | translate" tooltipPosition="left"
                                  [disabled]="salvandoMaquina === m.terminalId" (click)="pedirRemocao(m)"></button>
                        </div>
                      </td>
                    </tr>
                    <tr class="ge-det" *ngIf="detalhe === m.terminalId">
                      <td colspan="5">
                        <dl>
                          <div><dt>{{ 'fluxo.estacoes.linkedAt' | translate }}</dt><dd>{{ m.vinculadoEm ? (m.vinculadoEm | date:'dd/MM/yyyy HH:mm') : '—' }}</dd></div>
                          <div><dt>{{ 'fluxo.estacoes.lastAccessLabel' | translate }}</dt><dd>{{ m.ultimoAcesso ? (m.ultimoAcesso | date:'dd/MM/yyyy HH:mm') : '—' }}</dd></div>
                          <div><dt>{{ 'fluxo.estacoes.ip' | translate }}</dt><dd class="fx-mono">{{ m.ip || '—' }}</dd></div>
                          <div><dt>{{ 'fluxo.estacoes.terminalId' | translate }}</dt><dd class="fx-mono">{{ m.terminalId }}</dd></div>
                          <div class="ge-det-ua"><dt>{{ 'fluxo.estacoes.browser' | translate }}</dt><dd>{{ m.userAgent || '—' }}</dd></div>
                        </dl>
                      </td>
                    </tr>
                  </ng-container>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </ng-container>
    </div>


    <p-dialog styleClass="ge-dialog ge-dialog--detail" [(visible)]="resumoAberto" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body"
              [closable]="true" [closeOnEscape]="true" [header]="tituloResumo()" [style]="{ width: '720px', maxWidth: '95vw' }">
      <p class="ge-detail-lead">{{ leadResumo() }}</p>
      <label class="ge-detail-search">
        <i class="pi pi-search" aria-hidden="true"></i>
        <input pInputText [(ngModel)]="buscaResumo" [attr.aria-label]="'fluxo.estacoes.detail.searchLabel' | translate"
               [placeholder]="resumo === 'maquinas' ? ('fluxo.estacoes.detail.searchMachines' | translate) : ('fluxo.estacoes.detail.searchStations' | translate)" />
        <button *ngIf="buscaResumo" type="button" class="ge-detail-clear" (click)="buscaResumo = ''" [attr.aria-label]="'fluxo.estacoes.clearSearch' | translate"><i class="pi pi-times"></i></button>
      </label>
      <ul class="ge-detail-list" tabindex="0" *ngIf="resumo === 'maquinas'; else listaEstacoes">
        <li *ngIf="!maquinasDoResumo.length" class="ge-detail-item">{{ buscaResumo ? ('fluxo.estacoes.detail.emptySearch' | translate) : ('fluxo.estacoes.detail.emptyMachines' | translate) }}</li>
        <li class="ge-detail-item" *ngFor="let m of maquinasDoResumo; trackBy: trackMaquina">
          <strong>{{ m.apelido || ('fluxo.estacoes.unnamed' | translate) }}</strong>
          <div class="ge-detail-meta">
            <span class="ge-detail-sector">{{ nomeEstacao(m.estacaoCodigo) || m.estacaoNome || ('fluxo.estacoes.stationUnavailable' | translate) }}</span>
            <span class="ge-detail-link" [class.ge-detail-link--on]="m.ativa">
              <span class="ge-link-dot" [class.ge-link-dot--on]="m.ativa" aria-hidden="true"></span>
              {{ m.ativa ? ('fluxo.estacoes.linkActive' | translate) : ('fluxo.estacoes.linkInactive' | translate) }}
            </span>
          </div>
          <div class="ge-detail-meta ge-detail-meta--quiet">
            <span>{{ navegador(m.userAgent) }}</span>
            <span *ngIf="m.usuarioNome">{{ m.usuarioNome }}</span>
            <span *ngIf="m.ultimoAcesso">{{ 'fluxo.estacoes.lastAccess' | translate:{ when: (m.ultimoAcesso | date:'dd/MM/yyyy HH:mm') || '' } }}</span>
            <span *ngIf="m.ip" class="fx-mono">{{ m.ip }}</span>
          </div>
        </li>
      </ul>
      <ng-template #listaEstacoes>
        <ul class="ge-detail-list" tabindex="0">
          <li *ngIf="!estacoesDoResumo.length" class="ge-detail-item">
            {{ buscaResumo ? ('fluxo.estacoes.detail.emptySearch' | translate) : (resumo === 'sem' ? ('fluxo.estacoes.detail.emptyUnpaired' | translate) : ('fluxo.estacoes.emptyStations' | translate)) }}
          </li>
          <li class="ge-detail-item" *ngFor="let e of estacoesDoResumo; trackBy: trackEstacao">
            <strong>{{ e.nome }}</strong>
            <div class="ge-detail-meta">
              <span class="ge-detail-sector" *ngIf="e.setor">{{ 'fluxo.estacoes.sector' | translate:{ name: e.setor } }}</span>
              <span class="ge-detail-count"><b>{{ e.maquinas || 0 }}</b> {{ (e.maquinas === 1 ? 'fluxo.estacoes.detail.machineUnit' : 'fluxo.estacoes.detail.machinesUnit') | translate }}</span>
              <span class="ge-detail-count"><b>{{ e.etapas.length }}</b> {{ (e.etapas.length === 1 ? 'fluxo.estacoes.detail.stageUnit' : 'fluxo.estacoes.detail.stagesUnit') | translate }}</span>
            </div>
            <ol class="ge-detail-stages" *ngIf="e.etapas.length" [attr.aria-label]="'fluxo.estacoes.detail.stageOrder' | translate">
              <li *ngFor="let etapa of e.etapas; let last = last">
                <span>{{ etapa }}</span>
                <i *ngIf="!last" class="pi pi-arrow-right" aria-hidden="true"></i>
              </li>
            </ol>
            <ul class="ge-detail-links" *ngIf="maquinasDa(e.codigo).length">
              <li *ngFor="let m of maquinasDa(e.codigo); trackBy: trackMaquina">
                <span class="ge-link-dot" [class.ge-link-dot--on]="m.ativa" aria-hidden="true"></span>
                <span>{{ m.apelido || ('fluxo.estacoes.unnamed' | translate) }}</span>
                <small>{{ m.ativa ? ('fluxo.estacoes.linkActive' | translate) : ('fluxo.estacoes.linkInactive' | translate) }}</small>
              </li>
            </ul>
            <button *ngIf="!e.maquinas" type="button" class="ge-text-btn" (click)="parearDoResumo(e.codigo)">{{ 'fluxo.estacoes.pairShortcut' | translate }}</button>
          </li>
        </ul>
      </ng-template>
    </p-dialog>

    <p-dialog styleClass="ge-dialog" [(visible)]="mostrarEstacao" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body"
              [closable]="!salvandoEstacao" [closeOnEscape]="!salvandoEstacao" [header]="estacaoEmEdicao ? ('fluxo.estacoes.editStation' | translate) : ('fluxo.estacoes.newStation' | translate)" [style]="{ width: '520px', maxWidth: '95vw' }">
      <div class="gp">
        <label class="ge-label" for="ge-est-nome">{{ 'fluxo.estacoes.field.name' | translate }}</label>
        <input pInputText id="ge-est-nome" [(ngModel)]="estacaoNome" maxlength="120" [placeholder]="'fluxo.estacoes.field.nameExample' | translate" [disabled]="salvandoEstacao" />
        <ng-container *ngIf="!estacaoEmEdicao">
          <label class="ge-label" for="ge-est-setor">{{ 'fluxo.estacoes.field.section' | translate }}</label>
          <p-dropdown inputId="ge-est-setor" [options]="opcoesSetor" [(ngModel)]="estacaoSetor" appendTo="body" [style]="{ width: '100%' }" [placeholder]="'fluxo.estacoes.field.sectionPlaceholder' | translate" [disabled]="salvandoEstacao"></p-dropdown>
          <small class="gp-opc">{{ 'fluxo.estacoes.field.sectionHelp' | translate }}</small>
        </ng-container>
        <p class="ge-dlg-txt fx-muted" *ngIf="estacaoEmEdicao">{{ 'fluxo.estacoes.editKeep' | translate:{ name: estacaoEmEdicao.setor || '' } }}</p>
        <small class="gp-erro" *ngIf="erroEstacao" role="alert">{{ erroEstacao }}</small>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" [label]="'fluxo.estacoes.cancel' | translate" class="p-button-text" [disabled]="salvandoEstacao" (click)="mostrarEstacao = false"></button>
        <button pButton type="button" [label]="estacaoEmEdicao ? ('fluxo.estacoes.saveChanges' | translate) : ('fluxo.estacoes.create' | translate)" icon="pi pi-check" [loading]="salvandoEstacao" [disabled]="!estacaoNome.trim() || (!estacaoEmEdicao && !estacaoSetor)" (click)="salvarEstacao()"></button>
      </ng-template>
    </p-dialog>

    <p-dialog styleClass="ge-dialog ge-dialog--danger" [(visible)]="mostrarExcluirEstacao" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body" [header]="'fluxo.estacoes.deleteTitle' | translate"
              [closable]="!excluindoEstacao" [closeOnEscape]="!excluindoEstacao" [style]="{ width: '480px', maxWidth: '95vw' }">
      <ng-container *ngIf="estacaoParaExcluir as e">
        <p class="ge-dlg-txt">{{ 'fluxo.estacoes.deleteAsk' | translate:{ name: e.nome } }}</p>
        <p class="ge-dlg-txt ge-dlg-warn" *ngIf="e.maquinas" role="alert">{{ e.maquinas === 1 ? ('fluxo.estacoes.deleteBlockedOne' | translate) : ('fluxo.estacoes.deleteBlockedMany' | translate:{ n: '' + e.maquinas }) }}</p>
        <p class="ge-dlg-txt fx-muted">{{ 'fluxo.estacoes.deleteKeep' | translate:{ n: '' + e.etapas.length } }}</p>
        <ng-container *ngIf="!e.maquinas">
          <label class="ge-label" for="ge-confirmar-exclusao">{{ 'fluxo.estacoes.deleteConfirmLabel' | translate }}</label>
          <input pInputText id="ge-confirmar-exclusao" [(ngModel)]="confirmacaoExclusao" autocomplete="off" [placeholder]="e.nome" [disabled]="excluindoEstacao" />
        </ng-container>
        <small class="gp-erro" *ngIf="erroExclusao" role="alert">{{ erroExclusao }}</small>
      </ng-container>
      <ng-template pTemplate="footer">
        <button pButton type="button" [label]="'fluxo.estacoes.cancel' | translate" class="p-button-text" [disabled]="excluindoEstacao" (click)="mostrarExcluirEstacao = false"></button>
        <button pButton type="button" [label]="'fluxo.estacoes.deleteAction' | translate" icon="pi pi-trash" class="p-button-danger" [loading]="excluindoEstacao" [disabled]="!exclusaoConfirmada" (click)="excluirEstacao()"></button>
      </ng-template>
    </p-dialog>

    <p-dialog styleClass="ge-dialog" [(visible)]="mostrarEditarMaquina" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body" [header]="'fluxo.estacoes.editMachine' | translate"
              [closable]="!salvandoMaquina" [closeOnEscape]="!salvandoMaquina" [style]="{ width: '500px', maxWidth: '95vw' }">
      <div class="gp" *ngIf="maquinaEmEdicao as m">
        <label class="ge-label" for="ge-maq-nome">{{ 'fluxo.estacoes.field.machineName' | translate }}</label>
        <input pInputText id="ge-maq-nome" [(ngModel)]="edicao[m.terminalId].apelido" maxlength="120" [disabled]="!!salvandoMaquina" />
        <label class="ge-label" for="ge-maq-estacao">{{ 'fluxo.estacoes.field.station' | translate }}</label>
        <p-dropdown inputId="ge-maq-estacao" [options]="opcoesEstacao" [(ngModel)]="edicao[m.terminalId].estacaoCodigo" optionLabel="label" optionValue="value" appendTo="body" [style]="{ width: '100%' }" [disabled]="!!salvandoMaquina"></p-dropdown>
        <small class="gp-erro" *ngIf="erroMaquina" role="alert">{{ erroMaquina }}</small>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" [label]="'fluxo.estacoes.cancel' | translate" class="p-button-text" [disabled]="!!salvandoMaquina" (click)="mostrarEditarMaquina = false"></button>
        <button pButton type="button" [label]="'fluxo.estacoes.save' | translate" icon="pi pi-check" [loading]="!!salvandoMaquina" [disabled]="!maquinaEmEdicao || !maquinaAlterada(maquinaEmEdicao) || !edicao[maquinaEmEdicao.terminalId].apelido.trim() || !edicao[maquinaEmEdicao.terminalId].estacaoCodigo" (click)="maquinaEmEdicao && salvarMaquina(maquinaEmEdicao)"></button>
      </ng-template>
    </p-dialog>

    <p-dialog styleClass="ge-dialog" [(visible)]="mostrarPareamento" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body"
              [header]="'fluxo.estacoes.pairTitle' | translate" [style]="{ width: '500px', maxWidth: '95vw' }">
      <div class="gp">
        <label class="ge-label" for="gp-codigo">{{ 'fluxo.estacoes.pairCode' | translate }}</label>
        <input id="gp-codigo" class="gp-codigo" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="00000000"
               [(ngModel)]="parCodigo" (ngModelChange)="codigoPareamentoMudou($event)" />
        <div class="gp-info" *ngIf="consultandoPar" role="status"><i class="pi pi-spin pi-spinner"></i> {{ 'fluxo.estacoes.pairLooking' | translate }}</div>
        <div class="gp-info gp-info--ok" *ngIf="parInfo as info">
          <i class="pi pi-desktop"></i>
          <div>
            <strong>{{ navegador(info.userAgent) }}</strong>
            <span>{{ info.usuarioNome ? ('fluxo.estacoes.pairUser' | translate:{ name: info.usuarioNome }) : ('fluxo.estacoes.pairUserUnknown' | translate) }}</span>
            <span class="fx-mono" *ngIf="info.ip">IP {{ info.ip }}</span>
            <span *ngIf="info.expiraEm">{{ 'fluxo.estacoes.pairExpires' | translate:{ when: (info.expiraEm | date:'dd/MM/yyyy HH:mm') || '' } }}</span>
          </div>
        </div>
        <small class="gp-erro" *ngIf="erroPar" role="alert"><i class="pi pi-times-circle"></i> {{ erroPar }}</small>

        <ng-container *ngIf="parInfo">
          <label class="ge-label" for="gp-estacao">{{ 'fluxo.estacoes.field.station' | translate }}</label>
          <p-dropdown inputId="gp-estacao" [options]="opcoesEstacao" [(ngModel)]="parEstacao" optionLabel="label" optionValue="value"
                      appendTo="body" styleClass="ge-dropdown" [style]="{ width: '100%' }" [placeholder]="'fluxo.estacoes.pairChoose' | translate"></p-dropdown>
          <label class="ge-label" for="gp-apelido">{{ 'fluxo.estacoes.field.machineName' | translate }}</label>
          <span class="ge-field">
            <i class="pi pi-pencil"></i>
            <input pInputText id="gp-apelido" class="ge-input" [(ngModel)]="parApelido" maxlength="120" [placeholder]="'fluxo.estacoes.pairNameExample' | translate" />
          </span>
          <small class="gp-opc">{{ 'fluxo.estacoes.pairNameHelp' | translate }}<ng-container
            *ngIf="parEstacao && maquinasDa(parEstacao).length"> {{ 'fluxo.estacoes.pairAlready' | translate:{ names: nomesMaquinas(parEstacao) } }}</ng-container></small>
        </ng-container>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" [label]="'fluxo.estacoes.cancel' | translate" class="p-button-text" (click)="mostrarPareamento = false"></button>
        <button pButton type="button" [label]="'fluxo.estacoes.pairTitle' | translate" icon="pi pi-link" [disabled]="!parInfo || !parEstacao || !parApelido.trim()"
                [loading]="pareando" (click)="confirmarPareamento()"></button>
      </ng-template>
    </p-dialog>

    <p-dialog styleClass="ge-dialog ge-dialog--danger" [(visible)]="mostrarRemocao" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body"
              [header]="'fluxo.estacoes.removeTitle' | translate" [style]="{ width: '460px', maxWidth: '95vw' }">
      <ng-container *ngIf="remover as m">
        <p class="ge-dlg-txt">{{ 'fluxo.estacoes.removeAsk' | translate:{ machine: m.apelido || navegador(m.userAgent), station: nomeEstacao(m.estacaoCodigo) || m.estacaoNome || '' } }}</p>
        <p class="ge-dlg-txt fx-muted">{{ 'fluxo.estacoes.removeHelp' | translate }}</p>
        <p class="ge-dlg-txt ge-dlg-warn" *ngIf="m.terminalId === terminalAtual">
          <i class="pi pi-exclamation-triangle"></i> {{ 'fluxo.estacoes.removeSelf' | translate }}
        </p>
      </ng-container>
      <ng-template pTemplate="footer">
        <button pButton type="button" [label]="'fluxo.estacoes.cancel' | translate" class="p-button-text" (click)="mostrarRemocao = false"></button>
        <button pButton type="button" [label]="'fluxo.estacoes.removeAction' | translate" icon="pi pi-trash" class="p-button-danger"
                [loading]="!!remover && salvandoMaquina === remover.terminalId" (click)="confirmarRemocao()"></button>
      </ng-template>
    </p-dialog>
  `,
})
export class OsFluxoEstacoesComponent implements OnInit {
  private api = inject(OsFluxoService);
  private toast = inject(MessageService);
  private i18n = inject(TranslationService);

  private tx(key: string, fallback: string, params?: Record<string, string>): string {
    const value = this.i18n?.translate(key, params);
    return value && value !== key ? value : fallback;
  }

  dados: FluxoEstacoesGestao | null = null;
  private maquinasPorEstacao: Record<string, FluxoMaquina[]> = {};
  carregando = false;
  erro = '';

  buscaEstacao = '';
  acoesEstacao: MenuItem[] = [];
  editandoNome: string | null = null;
  nomeRascunho = '';
  salvandoNome = false;
  erroNome = '';
  @ViewChild('nomeInline') set campoNome(campo: ElementRef<HTMLInputElement> | undefined) {
    if (campo) { campo.nativeElement.focus(); campo.nativeElement.select(); }
  }
  @ViewChildren('linhaEstacao') linhasEstacao?: QueryList<ElementRef<HTMLTableRowElement>>;
  linhaFocada = 0;
  resumo: 'estacoes' | 'maquinas' | 'sem' | null = null;
  buscaResumo = '';
  mostrarEstacao = false;
  estacaoEmEdicao: FluxoEstacaoGestao | null = null;
  estacaoNome = '';
  estacaoSetor: string | null = null;
  opcoesSetor: string[] = [];
  salvandoEstacao = false;
  erroEstacao = '';
  mostrarExcluirEstacao = false;
  estacaoParaExcluir: FluxoEstacaoGestao | null = null;
  excluindoEstacao = false;
  erroExclusao = '';
  confirmacaoExclusao = '';
  mostrarEditarMaquina = false;
  maquinaEmEdicao: FluxoMaquina | null = null;
  erroMaquina = '';
  edicao: Record<string, EdicaoMaquina> = {};
  opcoesEstacao: { label: string; value: string }[] = [];

  salvandoMaquina: string | null = null;
  mostrarRemocao = false;
  remover: FluxoMaquina | null = null;
  ajudaAberta = false;
  detalhe: string | null = null;

  mostrarPareamento = false;
  parCodigo = '';
  parInfo: FluxoPareamentoInfo | null = null;
  parEstacao: string | null = null;
  parApelido = '';
  consultandoPar = false;
  pareando = false;
  erroPar = '';

  readonly terminalAtual = this.lerTerminalAtual();

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.erro = '';
    this.api.gestaoEstacoes().subscribe({
      next: (d) => {
        this.carregando = false;
        this.aplicar(d);
      },
      error: (e) => {
        this.carregando = false;
        this.erro = e?.error?.mensagem || this.tx('fluxo.estacoes.loadErrorDetail', 'Verifique a conexão e tente novamente.');
      }
    });
  }

  private aplicar(d: FluxoEstacoesGestao): void {
    this.dados = d;
    this.opcoesSetor = d.setores || [...new Set(d.estacoes.map(e => e.setor).filter((s): s is string => !!s))];
    this.edicao = {};
    for (const m of d.maquinas) this.edicao[m.terminalId] = { estacaoCodigo: m.estacaoCodigo, apelido: m.apelido || '' };
    this.opcoesEstacao = d.estacoes.map(e => ({ label: e.nome, value: e.codigo }));
    this.maquinasPorEstacao = {};
    for (const m of d.maquinas) {
      if (!this.maquinasPorEstacao[m.estacaoCodigo]) this.maquinasPorEstacao[m.estacaoCodigo] = [];
      this.maquinasPorEstacao[m.estacaoCodigo].push(m);
    }
    for (const lista of Object.values(this.maquinasPorEstacao)) {
      lista.sort((a, b) => (a.apelido || '').localeCompare(b.apelido || '', 'pt-BR', { numeric: true }));
    }
  }

  maquinasDa(estacaoCodigo: string): FluxoMaquina[] {
    return this.maquinasPorEstacao[estacaoCodigo] ?? [];
  }

  nomesMaquinas(estacaoCodigo: string): string {
    return this.maquinasDa(estacaoCodigo).map(m => m.apelido || this.tx('fluxo.estacoes.unnamed', 'Sem nome')).join(', ');
  }

  get estacoesSemVinculo(): number {
    return (this.dados?.estacoes || []).filter(e => !e.maquinas).length;
  }

  get resumoAberto(): boolean {
    return this.resumo !== null;
  }

  set resumoAberto(aberto: boolean) {
    if (!aberto) {
      this.resumo = null;
      this.buscaResumo = '';
    }
  }

  get estacoesDoResumo(): FluxoEstacaoGestao[] {
    const estacoes = (this.dados?.estacoes || []).filter(e => this.resumo !== 'sem' || !e.maquinas);
    return estacoes.filter(e => this.combinaResumo([e.nome, e.setor, ...e.etapas, this.nomesMaquinas(e.codigo)].join(' ')));
  }

  get maquinasDoResumo(): FluxoMaquina[] {
    return (this.dados?.maquinas || []).filter(m => this.combinaResumo([m.apelido, m.estacaoNome, this.nomeEstacao(m.estacaoCodigo), m.usuarioNome, this.navegador(m.userAgent)].join(' ')));
  }

  abrirResumo(tipo: 'estacoes' | 'maquinas' | 'sem'): void {
    this.buscaResumo = '';
    this.resumo = tipo;
    setTimeout(() => document.querySelector<HTMLElement>('.ge-dialog--detail .ge-detail-search input')?.focus(), 120);
  }

  private combinaResumo(texto: string): boolean {
    const busca = this.buscaResumo.trim().toLocaleLowerCase('pt-BR');
    return !busca || texto.toLocaleLowerCase('pt-BR').includes(busca);
  }

  tituloResumo(): string {
    if (this.resumo === 'maquinas') return this.tx('fluxo.estacoes.kpi.machines', 'Máquinas vinculadas');
    if (this.resumo === 'sem') return this.tx('fluxo.estacoes.kpi.unpaired', 'Estações sem máquinas');
    return this.tx('fluxo.estacoes.kpi.stations', 'Estações');
  }

  leadResumo(): string {
    if (this.resumo === 'maquinas') return this.tx('fluxo.estacoes.detail.machinesLead', 'Todos os computadores vinculados, com estação, situação e último acesso.');
    if (this.resumo === 'sem') return this.tx('fluxo.estacoes.detail.unpairedLead', 'Estações que ainda não têm computador associado.');
    return this.tx('fluxo.estacoes.detail.stationsLead', 'Todas as estações cadastradas, com setor, etapas e máquinas.');
  }

  parearDoResumo(codigo: string): void {
    this.resumo = null;
    this.buscaResumo = '';
    this.abrirPareamento(codigo);
  }

  linhaAtiva(indice: number): boolean {
    const total = this.estacoesFiltradas.length;
    if (!total) return false;
    return Math.min(this.linhaFocada, total - 1) === indice;
  }

  navegarLinha(event: KeyboardEvent, indice: number): void {
    const alvo = event.target as HTMLElement | null;
    if (alvo?.closest('input, textarea, select')) return;
    const total = this.estacoesFiltradas.length;
    if (!total) return;
    let proximo = indice;
    if (event.key === 'ArrowDown') proximo = Math.min(total - 1, indice + 1);
    else if (event.key === 'ArrowUp') proximo = Math.max(0, indice - 1);
    else if (event.key === 'Home') proximo = 0;
    else if (event.key === 'End') proximo = total - 1;
    else if (event.key === 'Enter' && alvo === event.currentTarget) {
      const estacao = this.estacoesFiltradas[indice];
      if (estacao) this.editarNome(estacao);
      event.preventDefault();
      return;
    } else return;
    if (proximo === indice) return;
    event.preventDefault();
    event.stopPropagation();
    this.linhaFocada = proximo;
    queueMicrotask(() => {
      const el = this.linhasEstacao?.get(proximo)?.nativeElement;
      el?.focus();
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  @HostListener('document:keydown', ['$event'])
  rolarComSetas(event: KeyboardEvent): void {
    if (event.defaultPrevented || this.dialogoAberto) return;
    const alvo = event.target as HTMLElement | null;
    if (!alvo || alvo.closest('input, textarea, select, [contenteditable="true"], .p-dialog, .p-menu, .p-dropdown-panel, .sidebar, nav')) return;
    const scroller = document.querySelector('app-layout .main-content');
    if (!(scroller instanceof HTMLElement) || scroller.scrollHeight <= scroller.clientHeight + 1) return;
    const passo = Math.max(56, Math.round(scroller.clientHeight * 0.15));
    if (event.key === 'ArrowDown') scroller.scrollBy({ top: passo });
    else if (event.key === 'ArrowUp') scroller.scrollBy({ top: -passo });
    else if (event.key === 'PageDown') scroller.scrollBy({ top: Math.round(scroller.clientHeight * 0.85) });
    else if (event.key === 'PageUp') scroller.scrollBy({ top: -Math.round(scroller.clientHeight * 0.85) });
    else return;
    event.preventDefault();
  }

  private get dialogoAberto(): boolean {
    return !!(this.resumo || this.mostrarEstacao || this.mostrarExcluirEstacao || this.mostrarEditarMaquina || this.mostrarPareamento || this.mostrarRemocao);
  }

  limparBusca(): void {
    this.buscaEstacao = '';
    this.linhaFocada = 0;
  }

  get estacoesFiltradas(): FluxoEstacaoGestao[] {
    const busca = this.buscaEstacao.trim().toLocaleLowerCase('pt-BR');
    return (this.dados?.estacoes || []).filter(e => !busca || [e.nome, e.setor, ...e.etapas].join(' ').toLocaleLowerCase('pt-BR').includes(busca));
  }

  mostrarSetor(e: FluxoEstacaoGestao): boolean {
    const normalizar = (v: string) => v.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
    const setor = normalizar(e.setor || '');
    const nome = normalizar(e.nome).replace(/\s+\d+$/, '');
    return !!setor && nome !== setor;
  }

  abrirEstacao(e?: FluxoEstacaoGestao): void {
    this.estacaoEmEdicao = e || null;
    this.estacaoNome = e?.nome || '';
    this.estacaoSetor = e?.setor || null;
    this.erroEstacao = '';
    this.mostrarEstacao = true;
  }

  prepararAcoes(e: FluxoEstacaoGestao): void {
    this.acoesEstacao = [
      { label: this.tx('fluxo.estacoes.menu.edit', 'Editar nome'), icon: 'pi pi-pencil', command: () => this.editarNome(e) },
      { label: this.tx('fluxo.estacoes.menu.pair', 'Parear máquina'), icon: 'pi pi-link', command: () => this.abrirPareamento(e.codigo) },
      { separator: true },
      { label: this.tx('fluxo.estacoes.menu.delete', 'Excluir estação…'), icon: 'pi pi-trash', command: () => this.pedirExclusaoEstacao(e) }
    ];
  }

  editarNome(e: FluxoEstacaoGestao): void {
    if (this.salvandoNome) return;
    this.editandoNome = e.codigo;
    this.nomeRascunho = e.nome;
    this.erroNome = '';
  }

  cancelarNome(): void {
    if (this.salvandoNome) return;
    this.editandoNome = null;
    this.nomeRascunho = '';
    this.erroNome = '';
  }

  salvarNome(e: FluxoEstacaoGestao): void {
    const nome = this.nomeRascunho.trim();
    if (this.salvandoNome || this.editandoNome !== e.codigo || !nome || nome.length > 120) return;
    if (nome === e.nome) { this.cancelarNome(); return; }
    this.salvandoNome = true;
    this.erroNome = '';
    this.api.renomearEstacao(e.codigo, nome).subscribe({
      next: d => {
        this.salvandoNome = false;
        this.cancelarNome();
        this.aplicar(d);
        this.toast.add({ severity: 'success', summary: this.tx('fluxo.estacoes.nameUpdated', 'Nome atualizado'), detail: nome, life: 3500 });
      },
      error: err => {
        this.salvandoNome = false;
        this.erroNome = err?.error?.mensagem || this.tx('fluxo.estacoes.nameFailed', 'Não foi possível salvar. Tente novamente.');
      }
    });
  }

  salvarEstacao(): void {
    const nome = this.estacaoNome.trim();
    if (this.salvandoEstacao || !nome || (!this.estacaoEmEdicao && !this.estacaoSetor)) return;
    this.salvandoEstacao = true;
    this.erroEstacao = '';
    const requisicao = this.estacaoEmEdicao
      ? this.api.renomearEstacao(this.estacaoEmEdicao.codigo, nome)
      : this.api.criarEstacao(nome, this.estacaoSetor!);
    requisicao.subscribe({
      next: d => {
        this.salvandoEstacao = false;
        this.mostrarEstacao = false;
        this.buscaEstacao = '';
        this.aplicar(d);
        this.toast.add({ severity: 'success', summary: this.tx('fluxo.estacoes.stationSaved', 'Estação salva'), detail: nome, life: 3500 });
      },
      error: e => {
        this.salvandoEstacao = false;
        this.erroEstacao = e?.error?.mensagem || this.tx('fluxo.estacoes.saveFailed', 'Não foi possível salvar a estação. Tente novamente.');
      }
    });
  }

  pedirExclusaoEstacao(e: FluxoEstacaoGestao): void {
    this.estacaoParaExcluir = e;
    this.erroExclusao = '';
    this.confirmacaoExclusao = '';
    this.mostrarExcluirEstacao = true;
  }

  get exclusaoConfirmada(): boolean {
    return !!this.estacaoParaExcluir && !this.estacaoParaExcluir.maquinas
      && this.confirmacaoExclusao.trim() === this.estacaoParaExcluir.nome;
  }

  excluirEstacao(): void {
    if (!this.estacaoParaExcluir || this.excluindoEstacao || !this.exclusaoConfirmada) return;
    this.excluindoEstacao = true;
    this.erroExclusao = '';
    this.api.excluirEstacao(this.estacaoParaExcluir.codigo).subscribe({
      next: d => {
        this.excluindoEstacao = false;
        this.mostrarExcluirEstacao = false;
        this.estacaoParaExcluir = null;
        this.aplicar(d);
        this.toast.add({ severity: 'success', summary: this.tx('fluxo.estacoes.deleted', 'Estação excluída'), life: 3500 });
      },
      error: e => {
        this.excluindoEstacao = false;
        this.erroExclusao = e?.error?.mensagem || this.tx('fluxo.estacoes.deleteFailed', 'Não foi possível excluir a estação. Tente novamente.');
      }
    });
  }

  abrirMaquina(m: FluxoMaquina): void {
    this.maquinaEmEdicao = m;
    this.edicao[m.terminalId] = { estacaoCodigo: m.estacaoCodigo, apelido: m.apelido || '' };
    this.erroMaquina = '';
    this.mostrarEditarMaquina = true;
  }

  maquinaAlterada(m: FluxoMaquina): boolean {
    const ed = this.edicao[m.terminalId];
    return !!ed && (ed.estacaoCodigo !== m.estacaoCodigo || ed.apelido.trim() !== (m.apelido || ''));
  }

  salvarMaquina(m: FluxoMaquina): void {
    const ed = this.edicao[m.terminalId];
    if (!ed || !ed.estacaoCodigo || !ed.apelido.trim() || !this.maquinaAlterada(m) || this.salvandoMaquina) return;
    this.salvandoMaquina = m.terminalId;
    this.api.atualizarMaquina(m.terminalId, ed.estacaoCodigo, ed.apelido.trim()).subscribe({
      next: (d) => {
        this.salvandoMaquina = null;
        this.aplicar(d);
        this.mostrarEditarMaquina = false;
        this.toast.add({ severity: 'success', summary: this.tx('fluxo.estacoes.machineUpdated', 'Máquina atualizada'), detail: this.tx('fluxo.estacoes.machineStation', `Estação: ${this.nomeEstacao(ed.estacaoCodigo)}.`, { name: this.nomeEstacao(ed.estacaoCodigo) }), life: 3500 });
      },
      error: (err) => {
        this.salvandoMaquina = null;
        this.erroMaquina = err?.error?.mensagem || this.tx('fluxo.estacoes.nameFailed', 'Não foi possível salvar. Tente novamente.');
      }
    });
  }

  pedirRemocao(m: FluxoMaquina): void {
    this.remover = m;
    this.mostrarRemocao = true;
  }

  confirmarRemocao(): void {
    const m = this.remover;
    if (!m || this.salvandoMaquina) return;
    this.salvandoMaquina = m.terminalId;
    this.api.removerMaquina(m.terminalId).subscribe({
      next: (d) => {
        this.salvandoMaquina = null;
        this.mostrarRemocao = false;
        this.remover = null;
        this.aplicar(d);
        this.toast.add({ severity: 'success', summary: this.tx('fluxo.estacoes.removed', 'Máquina removida'), detail: this.tx('fluxo.estacoes.removedDetail', 'Ela não opera mais como estação autorizada.'), life: 3500 });
      },
      error: (err) => {
        this.salvandoMaquina = null;
        this.toast.add({ severity: 'error', summary: this.tx('fluxo.estacoes.removeFailed', 'Não foi possível remover'), detail: err?.error?.mensagem || this.tx('fluxo.estacoes.tryAgain', 'Tente novamente.'), life: 6000 });
      }
    });
  }

  abrirPareamento(estacaoCodigo?: string): void {
    this.parCodigo = '';
    this.parInfo = null;
    this.parEstacao = estacaoCodigo || null;
    this.parApelido = '';
    this.erroPar = '';
    this.mostrarPareamento = true;
    setTimeout(() => (document.getElementById('gp-codigo') as HTMLInputElement | null)?.focus(), 150);
  }

  codigoPareamentoMudou(valor: string): void {
    const codigo = (valor || '').replace(/\D/g, '').slice(0, 8);
    if (codigo !== valor) setTimeout(() => (this.parCodigo = codigo));
    this.parInfo = null;
    this.erroPar = '';
    if (codigo.length !== 8) return;
    this.consultandoPar = true;
    this.api.consultarPareamento(codigo).subscribe({
      next: (info) => {
        this.consultandoPar = false;
        if (this.parCodigo.replace(/\D/g, '') !== codigo) return;
        this.parInfo = info;
      },
      error: (e) => {
        this.consultandoPar = false;
        this.erroPar = e?.error?.mensagem || this.tx('fluxo.estacoes.pairLookupFailed', 'Não foi possível consultar o código.');
      }
    });
  }

  confirmarPareamento(): void {
    const info = this.parInfo;
    if (!info || !this.parEstacao || !this.parApelido.trim() || this.pareando) return;
    const estacao = this.parEstacao;
    this.pareando = true;
    this.erroPar = '';
    this.api.concluirPareamento(info.codigo, estacao, this.parApelido.trim()).subscribe({
      next: (d) => {
        this.pareando = false;
        this.mostrarPareamento = false;
        this.aplicar(d);
        this.toast.add({ severity: 'success', summary: this.tx('fluxo.estacoes.paired', 'Máquina pareada'), detail: this.tx('fluxo.estacoes.pairedDetail', `Agora ela é a estação ${this.nomeEstacao(estacao)}.`, { name: this.nomeEstacao(estacao) }), life: 4000 });
      },
      error: (e) => {
        this.pareando = false;
        this.erroPar = e?.error?.mensagem || this.tx('fluxo.estacoes.pairFailed', 'Não foi possível parear a máquina.');
      }
    });
  }

  alternarDetalhe(m: FluxoMaquina): void {
    this.detalhe = this.detalhe === m.terminalId ? null : m.terminalId;
  }

  relativo(data: string | Date | null | undefined): string {
    if (!data) return '';
    const min = Math.floor((Date.now() - new Date(data).getTime()) / 60000);
    if (min < 1) return this.tx('fluxo.estacoes.justNow', 'agora mesmo');
    if (min < 60) return this.tx('fluxo.estacoes.minutesAgo', `há ${min} min`, { n: String(min) });
    const h = Math.floor(min / 60);
    if (h < 24) return this.tx('fluxo.estacoes.hoursAgo', `há ${h} h`, { n: String(h) });
    const dias = Math.floor(h / 24);
    if (dias < 30) return dias === 1 ? this.tx('fluxo.estacoes.dayAgo', 'há 1 dia') : this.tx('fluxo.estacoes.daysAgo', `há ${dias} dias`, { n: String(dias) });
    const meses = Math.floor(dias / 30);
    return meses === 1 ? this.tx('fluxo.estacoes.monthAgo', 'há 1 mês') : this.tx('fluxo.estacoes.monthsAgo', `há ${meses} meses`, { n: String(meses) });
  }

  estacaoExiste(codigo: string): boolean {
    return !!this.dados?.estacoes.some(e => e.codigo === codigo);
  }

  nomeEstacao(codigo: string): string {
    return this.dados?.estacoes.find(e => e.codigo === codigo)?.nome || '';
  }

  navegador(ua?: string | null): string {
    if (!ua) return this.tx('fluxo.estacoes.unknownBrowser', 'Navegador desconhecido');
    const nav = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : this.tx('fluxo.estacoes.browserGeneric', 'Navegador');
    const so = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
    return so ? `${nav} · ${so}` : nav;
  }

  trackEstacao = (_: number, e: FluxoEstacaoGestao) => e.codigo;
  trackMaquina = (_: number, m: FluxoMaquina) => m.terminalId;

  private lerTerminalAtual(): string | null {
    try {
      return localStorage.getItem(STORAGE_TERMINAL);
    } catch {
      return null;
    }
  }
}
