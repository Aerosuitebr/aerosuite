import { Component, ElementRef, HostListener, OnInit, OnDestroy, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
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
import { FluxoEstacaoGestao, FluxoEstacoesGestao, FluxoMaquina, FluxoPareamentoInfo, FluxoMaquinaPendente, FluxoVinculoEvento, OsFluxoService } from './os-fluxo.service';

const STORAGE_TERMINAL = 'osFluxo.terminalId';

interface EdicaoMaquina {
  estacaoCodigo: string;
  apelido: string;
}

type NivelEstacao = 'linked' | 'stale' | 'fault' | 'fresh' | 'watch' | 'hour' | 'shift' | 'critical' | 'unknown';

@Component({
  standalone: true,
  selector: 'app-os-fluxo-estacoes',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DialogModule, DropdownModule, InputTextModule, TooltipModule, ToastModule, MenuModule, TranslatePipe],
  providers: [MessageService],
  styleUrls: ['./fluxo-shared.css', './os-fluxo-estacoes.component.css'],
  template: `
    <p-toast></p-toast>
    <p-menu #acoes styleClass="ge-station-menu" [model]="acoesEstacao" [popup]="true" [baseZIndex]="12000" appendTo="body"></p-menu>
    <div class="fx-shell ge-page" [class.ge-machines-focus]="focoMaquinas">
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
        <section class="ge-fold" [class.ge-fold--open]="secoes.situacao">
          <button type="button" class="ge-fold-head" (click)="alternarSecao('situacao', $event)" [attr.aria-expanded]="secoes.situacao">
            <span class="ge-fold-ico" aria-hidden="true"><i class="pi pi-compass"></i></span>
            <span class="ge-fold-copy"><strong>{{ 'fluxo.estacoes.fold.now' | translate }}</strong><small>{{ 'fluxo.estacoes.fold.nowHint' | translate }}</small></span>
            <span class="ge-fold-meta"><b>{{ cobertura }}%</b><i class="pi" [ngClass]="secoes.situacao ? 'pi-chevron-up' : 'pi-chevron-down'" aria-hidden="true"></i></span>
          </button>
          <div class="ge-fold-body" *ngIf="secoes.situacao">
        <section class="ge-kpis ge-rise" [attr.aria-label]="'fluxo.estacoes.summary' | translate">
          <button type="button" class="ge-kpi" (click)="filtroVinculo='todos'" [attr.aria-pressed]="filtroVinculo==='todos'">
            <span>{{ 'fluxo.estacoes.kpi.stations' | translate }}</span>
            <i class="pi pi-server ge-kpi-icon" aria-hidden="true"></i><strong>{{ d.estacoes.length }}</strong>
            <em>Ver todas as estações <i class="pi pi-arrow-right"></i></em>
          </button>
          <button type="button" class="ge-kpi ge-kpi--green" (click)="filtroVinculo='com'" [attr.aria-pressed]="filtroVinculo==='com'">
            <span>{{ 'fluxo.estacoes.kpi.machines' | translate }}</span>
            <i class="pi pi-microchip ge-kpi-icon" aria-hidden="true"></i><strong>{{ d.maquinas.length }}</strong>
            <em>Filtrar com máquina <i class="pi pi-arrow-right"></i></em>
          </button>
          <button type="button" class="ge-kpi" [class.ge-kpi--amber]="estacoesSemVinculo > 0" (click)="filtroVinculo=filtroVinculo==='sem'?'todos':'sem'" [attr.aria-pressed]="filtroVinculo==='sem'">
            <span>{{ 'fluxo.estacoes.kpi.unpaired' | translate }}</span>
            <i class="pi pi-exclamation-triangle ge-kpi-icon" aria-hidden="true"></i><strong>{{ estacoesSemVinculo }}</strong>
            <small *ngIf="estacoesSemVinculo">{{ 'fluxo.estacoes.kpi.unpairedHint' | translate }}</small>
            <em>Requer atenção <i class="pi pi-arrow-right"></i></em>
          </button>
        </section>

        <div class="ge-command">
          <section class="ge-cover" [attr.aria-label]="'fluxo.estacoes.coverage.kicker' | translate">
            <span class="ge-cover-kicker">{{ 'fluxo.estacoes.coverage.kicker' | translate }}</span>
            <strong class="ge-cover-pct">{{ cobertura }}%</strong>
            <div class="ge-cover-track" role="progressbar" [attr.aria-label]="'fluxo.estacoes.coverage.bar' | translate" [attr.aria-valuenow]="cobertura" aria-valuemin="0" aria-valuemax="100"><i [style.width.%]="cobertura"></i></div>
            <small>{{ 'fluxo.estacoes.coverage.detail' | translate:{ linked: '' + estacoesComMaquina, total: '' + d.estacoes.length } }}</small>
          </section>
          <section class="ge-ops" [class.ge-ops--clear]="!acaoNecessaria" [attr.aria-label]="'fluxo.estacoes.ops.aria' | translate">
            <p class="ge-ops-head">{{ (acaoNecessaria ? 'fluxo.estacoes.ops.title' : 'fluxo.estacoes.ops.clear') | translate }}</p>
            <div class="ge-ops-items">
              <button type="button" [class.ge-ops-warn]="estacoesSemVinculo > 0" [class.ge-ops-ok]="!estacoesSemVinculo" [attr.aria-pressed]="filtroVinculo==='sem'" (click)="filtroVinculo=filtroVinculo==='sem'?'todos':'sem';setorFiltro='';secoes.estacoes=true"><i class="pi pi-desktop" aria-hidden="true"></i>{{ opsTexto('unpaired') }}</button>
              <button type="button" [class.ge-ops-warn]="maquinasSemSinalRecente > 0" [class.ge-ops-ok]="!maquinasSemSinalRecente" [attr.aria-pressed]="filtroVinculo==='sinal'" (click)="filtroVinculo=filtroVinculo==='sinal'?'todos':'sinal';setorFiltro='';secoes.estacoes=true"><i class="pi pi-clock" aria-hidden="true"></i>{{ opsTexto('stale') }}</button>
              <button type="button" class="ge-ops-ok" [attr.aria-pressed]="filtroVinculo==='com'" (click)="filtroVinculo=filtroVinculo==='com'?'todos':'com';secoes.estacoes=true"><i class="pi pi-link" aria-hidden="true"></i>{{ opsTexto('active') }}</button>
              <button type="button" [class.ge-ops-warn]="aprovacoesPendentes > 0" [class.ge-ops-ok]="!aprovacoesPendentes" (click)="focarDescoberta()"><i class="pi pi-inbox" aria-hidden="true"></i>{{ opsTexto('pending') }}</button>
            </div>
            <div class="ge-exception-names" *ngIf="estacoesSemVinculo && !focoMaquinas">
              <span class="ge-ops-worst">{{ 'fluxo.estacoes.ops.worst' | translate }}</span>
              <button type="button" *ngFor="let e of estacoesPendentes.slice(0,5)" (click)="abrirEstacao(e)">{{ e.nome }} <small>{{ minutosSemVinculo(e) !== null ? tempoSemVinculo(e) : ('fluxo.estacoes.age.unknownShort' | translate) }}</small></button>
              <button type="button" class="ge-text-btn" (click)="filtroVinculo='sem';setorFiltro=''">{{ 'fluxo.estacoes.ops.seeUnpaired' | translate }}</button>
            </div>
          </section>
        </div>
        <section id="ge-discovery" class="ge-discovery" [class.ge-discovery--alert]="aprovacoesPendentes > 0" [class.ge-discovery--clear]="!aprovacoesPendentes">
          <div class="ge-discovery-status">
            <i class="pi" [ngClass]="aprovacoesPendentes ? 'pi-inbox' : 'pi-verified'" aria-hidden="true"></i>
            <h2 tabindex="-1">{{ textoDescoberta() }}</h2>
          </div>
          <p>{{ 'fluxo.estacoes.discovery.lead' | translate }}</p>
          <button type="button" class="ge-primary" (click)="vincularEstaMaquina()" [disabled]="preparandoPropria"><i class="pi pi-desktop"></i> {{ 'fluxo.estacoes.discovery.link' | translate }}</button>
          <p *ngIf="erroDescoberta" role="alert">{{ erroDescoberta }}</p>
          <div class="ge-pending-list" *ngIf="d.pendentes?.length">
            <article *ngFor="let m of d.pendentes">
              <strong>{{ navegador(m.userAgent) }}</strong>
              <span>{{ 'fluxo.estacoes.discovery.requestedBy' | translate:{ name: m.usuarioNome || ('fluxo.estacoes.discovery.userUnknown' | translate) } }}</span>
              <small>{{ 'fluxo.estacoes.discovery.identifier' | translate:{ id: m.terminalId } }}</small>
              <small class="fx-mono">{{ m.ip || ('fluxo.estacoes.ipMissing' | translate) }}</small>
              <span>{{ 'fluxo.estacoes.discovery.validUntil' | translate }} {{ m.expiraEm|date:'HH:mm:ss' }}</span>
              <div class="ge-pending-actions">
                <button type="button" class="ge-fast-pair" (click)="selecionarPendente(m)">{{ 'fluxo.estacoes.discovery.approve' | translate }}</button>
                <button type="button" class="ge-pending-cancel" (click)="cancelarSolicitacao(m)" [disabled]="cancelandoSolicitacao === m.terminalId">
                  <i class="pi" [ngClass]="cancelandoSolicitacao === m.terminalId ? 'pi-spin pi-spinner' : 'pi-times'" aria-hidden="true"></i>
                  {{ 'fluxo.estacoes.discovery.cancel' | translate }}
                </button>
              </div>
            </article>
          </div>
        </section>
          </div>
        </section>
        <section class="ge-fold" [class.ge-fold--open]="secoes.estacoes">
          <button type="button" class="ge-fold-head" (click)="alternarSecao('estacoes', $event)" [attr.aria-expanded]="secoes.estacoes">
            <span class="ge-fold-ico ge-fold-ico--station" aria-hidden="true"><i class="pi pi-map-marker"></i></span>
            <span class="ge-fold-copy"><strong>{{ 'fluxo.estacoes.fold.stations' | translate }}</strong><small>{{ 'fluxo.estacoes.fold.stationsHint' | translate }}</small></span>
            <span class="ge-fold-meta"><b>{{ d.estacoes.length }}</b><i class="pi" [ngClass]="secoes.estacoes ? 'pi-chevron-up' : 'pi-chevron-down'" aria-hidden="true"></i></span>
          </button>
          <div class="ge-fold-body" *ngIf="secoes.estacoes">
        <section class="fx-card ge-rise ge-station-panel">
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
            <nav class="ge-quick-filters" aria-label="Filtros rápidos de setor"><button type="button" [attr.aria-pressed]="!setorFiltro" (click)="setorFiltro=''">Todos os setores</button><button type="button" *ngFor="let setor of opcoesSetor" [attr.aria-pressed]="setorFiltro===setor" (click)="setorFiltro=setorFiltro===setor?'':setor">{{ setor }}</button></nav><div class="ge-search"><div class="ge-filter ge-vinculo" (click)="$event.stopPropagation()"><span>{{ 'fluxo.estacoes.filter.link' | translate }}</span><button type="button" class="ge-vinculo-btn" [attr.aria-expanded]="vinculoAberto" aria-haspopup="listbox" (click)="vinculoAberto=!vinculoAberto">{{ rotuloFiltroVinculo() }}<i class="pi pi-chevron-down" aria-hidden="true"></i></button><ul class="ge-vinculo-list" *ngIf="vinculoAberto" role="listbox" [attr.aria-label]="'fluxo.estacoes.filter.link' | translate"><li role="option" [attr.aria-selected]="filtroVinculo==='todos'"><button type="button" (click)="escolherVinculo('todos')">{{ 'fluxo.estacoes.filter.all' | translate }}</button></li><li role="option" [attr.aria-selected]="filtroVinculo==='sem'"><button type="button" (click)="escolherVinculo('sem')">{{ 'fluxo.estacoes.filter.without' | translate }}</button></li><li role="option" [attr.aria-selected]="filtroVinculo==='com'"><button type="button" (click)="escolherVinculo('com')">{{ 'fluxo.estacoes.filter.with' | translate }}</button></li><li role="option" [attr.aria-selected]="filtroVinculo==='sinal'"><button type="button" (click)="escolherVinculo('sinal')">{{ 'fluxo.estacoes.filter.stale' | translate }}</button></li></ul></div><div class="ge-view" role="group" aria-label="Visualização"><button type="button" [attr.aria-pressed]="visao==='tabela'" (click)="visao='tabela'">Tabela</button><button type="button" [attr.aria-pressed]="visao==='cards'" (click)="visao='cards'">Cards</button></div>
              <label class="ge-search-field">
                <i class="pi pi-search" aria-hidden="true"></i>
                <input pInputText [(ngModel)]="buscaEstacao" [attr.aria-label]="'fluxo.estacoes.searchLabel' | translate" placeholder="Buscar estação, máquina, usuário ou código…" list="ge-sugestoes" />
                <button *ngIf="buscaEstacao" type="button" class="ge-clear" (click)="limparBusca()" [attr.aria-label]="'fluxo.estacoes.clearSearch' | translate"><i class="pi pi-times"></i></button>
              </label>
              <datalist id="ge-sugestoes"><option *ngFor="let sugestao of sugestoesBusca" [value]="sugestao"></option></datalist><span class="ge-results" aria-live="polite">Mostrando <b>{{ estacoesFiltradas.length }}</b> / {{ d.estacoes.length }}</span>
            </div>
            <ul class="ge-age-legend" [attr.aria-label]="'fluxo.estacoes.age.legend' | translate">
              <li data-level="fresh">{{ 'fluxo.estacoes.age.fresh' | translate }}</li>
              <li data-level="watch">{{ 'fluxo.estacoes.age.watch' | translate }}</li>
              <li data-level="hour">{{ 'fluxo.estacoes.age.hour' | translate }}</li>
              <li data-level="shift">{{ 'fluxo.estacoes.age.shift' | translate }}</li>
              <li data-level="critical">{{ 'fluxo.estacoes.age.critical' | translate }}</li>
            </ul>
            <div class="ge-grid" *ngIf="visao==='cards'">
              <article class="ge-operation" *ngFor="let e of estacoesFiltradas; trackBy: trackEstacao" [ngClass]="'ge-lvl-' + nivelEstacao(e)" [class.ge-selected]="mostrarEstacao && estacaoEmEdicao?.codigo===e.codigo" [class.ge-needs-machine]="!e.maquinas" [class.ge-drop-active]="destinoDrag===e.codigo" (dragover)="permitirDrop($event,e)" (dragleave)="destinoDrag=null" (drop)="soltarMaquina($event,e)">
                <div class="ge-state-band">
                  <span class="ge-state-ico" aria-hidden="true"><i class="pi" [ngClass]="iconeFaixa(e)"></i></span>
                  <span class="ge-state-label">{{ faixaKey(e) | translate }}</span>
                  <button type="button" class="ge-icon-btn" [attr.aria-label]="'fluxo.estacoes.card.actions' | translate:{ name: e.nome }" aria-haspopup="menu" (click)="prepararAcoes(e);acoes.toggle($event)"><i class="pi pi-ellipsis-v"></i></button>
                </div>
                <div class="ge-card-main">
                  <button type="button" class="ge-name" [title]="e.codigo" (click)="abrirEstacao(e)">{{ e.nome }} <i class="pi pi-arrow-up-right"></i></button>
                  <p *ngIf="mostrarSetor(e)">{{ e.setor }}</p>
                  <div class="ge-station-facts"><span><i class="pi pi-list" aria-hidden="true"></i><b>{{ e.etapas.length }}</b> {{ 'fluxo.estacoes.facts.stages' | translate }}</span><span><i class="pi pi-desktop" aria-hidden="true"></i><b>{{ e.maquinas }}</b> {{ 'fluxo.estacoes.facts.machines' | translate }}</span></div>
                  <ul class="ge-stage-preview" *ngIf="e.etapas.length"><li *ngFor="let etapa of etapasVisiveis(e)">{{ etapa }}</li></ul>
                  <button *ngIf="e.etapas.length > 3" type="button" class="ge-more-stages" (click)="abrirEstacao(e)">{{ 'fluxo.estacoes.card.moreStages' | translate:{ n: '' + (e.etapas.length - 3) } }}</button>
                  <div class="ge-device-chips" *ngIf="e.maquinas"><button type="button" *ngFor="let m of maquinasDa(e.codigo)" (click)="abrirMaquina(m)"><i class="pi pi-desktop"></i>{{ m.apelido || ('fluxo.estacoes.unnamed' | translate) }}<small>{{ presencaMaquina(m) }}</small><small class="fx-mono" *ngIf="m.ip">{{ m.ip }}</small></button></div>
                  <p class="ge-age" *ngIf="!e.maquinas && minutosSemVinculo(e) !== null" [attr.data-level]="nivelEstacao(e)"><i class="ge-age-dot" aria-hidden="true"></i>{{ 'fluxo.estacoes.card.unlinkedFor' | translate:{ time: tempoSemVinculo(e) } }}</p>
                  <p class="ge-age" *ngIf="!e.maquinas && minutosSemVinculo(e) === null" data-level="unknown"><i class="ge-age-dot" aria-hidden="true"></i>{{ tempoSemVinculo(e) }}</p>
                </div>
              </article>
              <p class="ge-empty" *ngIf="!estacoesFiltradas.length">Nenhuma estação neste filtro. <button type="button" class="ge-text-btn" (click)="limparBusca()">Limpar filtros</button></p>
            </div><div class="ge-table-wrap" *ngIf="visao==='tabela'">
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
                      [class.ge-needs-machine]="!e.maquinas" [class.ge-drop-active]="destinoDrag===e.codigo" (dragover)="permitirDrop($event,e)" (dragleave)="destinoDrag=null" (drop)="soltarMaquina($event,e)" [attr.tabindex]="linhaAtiva(i) ? 0 : -1" (keydown)="navegarLinha($event, i)">
                    <td [attr.data-label]="'fluxo.estacoes.col.name' | translate">
                      <div *ngIf="editandoNome === e.codigo; else nomeEstacao" class="ge-inline">
                        <input #nomeInline pInputText [(ngModel)]="nomeRascunho" maxlength="120" [attr.aria-label]="'fluxo.estacoes.nameLabel' | translate:{ name: e.nome }" [disabled]="salvandoNome" (keydown.enter)="salvarNome(e)" (keydown.escape)="cancelarNome()" [attr.aria-invalid]="!!erroNome" [attr.aria-describedby]="erroNome ? 'ge-erro-nome' : null" />
                        <button type="button" class="ge-icon-btn ge-icon-btn--ok" [attr.aria-label]="'fluxo.estacoes.saveName' | translate" [disabled]="salvandoNome || !nomeRascunho.trim()" (click)="salvarNome(e)"><i class="pi" [ngClass]="salvandoNome ? 'pi-spin pi-spinner' : 'pi-check'"></i></button>
                        <button type="button" class="ge-icon-btn" [attr.aria-label]="'fluxo.estacoes.cancelEdit' | translate" [disabled]="salvandoNome" (click)="cancelarNome()"><i class="pi pi-times"></i></button>
                        <small *ngIf="erroNome" id="ge-erro-nome" class="gp-erro" role="alert">{{ erroNome }}</small>
                      </div>
                      <ng-template #nomeEstacao>
                        <button type="button" class="ge-name" [attr.aria-label]="'fluxo.estacoes.editNameAria' | translate:{ name: e.nome }" [disabled]="salvandoNome" (click)="abrirEstacao(e)">
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
                        <summary [pTooltip]="e.etapas.join(' • ')" tooltipPosition="top" tooltipEvent="both">
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
          </div>
        </section>

        <section class="ge-fold" [class.ge-fold--open]="secoes.maquinas">
          <button type="button" class="ge-fold-head" (click)="alternarSecao('maquinas', $event)" [attr.aria-expanded]="secoes.maquinas">
            <span class="ge-fold-ico ge-fold-ico--machine" aria-hidden="true"><i class="pi pi-desktop"></i></span>
            <span class="ge-fold-copy"><strong>{{ 'fluxo.estacoes.fold.machines' | translate }}</strong><small>{{ 'fluxo.estacoes.fold.machinesHint' | translate }}</small></span>
            <span class="ge-fold-meta"><b>{{ d.maquinas.length }}</b><i class="pi" [ngClass]="secoes.maquinas ? 'pi-chevron-up' : 'pi-chevron-down'" aria-hidden="true"></i></span>
          </button>
          <div class="ge-fold-body" *ngIf="secoes.maquinas">
        <section class="fx-card ge-rise ge-rise-late ge-machines-panel">
          <div class="fx-card-head">
            <button type="button" class="ge-panel-expand" [attr.aria-pressed]="focoMaquinas" (click)="focoMaquinas=!focoMaquinas"><i class="pi" [ngClass]="focoMaquinas?'pi-window-minimize':'pi-window-maximize'"></i>{{ focoMaquinas?'Mostrar estações':'Expandir máquinas' }}</button><div class="ge-head-copy">
              <h2>{{ 'fluxo.estacoes.machinesTitle' | translate }}</h2>
              <span class="ge-count">{{ d.maquinas.length === 1 ? ('fluxo.estacoes.machineOne' | translate) : ('fluxo.estacoes.machineMany' | translate:{ n: '' + d.maquinas.length }) }}</span>
              <p>{{ 'fluxo.estacoes.machinesLead' | translate }}</p>
            </div>
            <button type="button" class="ge-primary" (click)="abrirPareamento()"><i class="pi pi-link"></i> {{ 'fluxo.estacoes.pairTitle' | translate }}</button>
          </div>
          <div class="fx-card-body">
            <label class="ge-machine-search">Buscar máquina, estação, usuário ou código<input pInputText [(ngModel)]="buscaMaquina" placeholder="Digite para filtrar máquinas…" /></label><div class="ge-ajuda">
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

            <p class="ge-drag-hint" *ngIf="d.maquinas.length"><i class="pi pi-arrows-alt" aria-hidden="true"></i> {{ 'fluxo.estacoes.drag.hint' | translate }}</p>
            <div class="ge-table-wrap" *ngIf="d.maquinas.length">
              <table class="fx-table ge-table">
                <thead>
                  <tr>
                    <th>{{ 'fluxo.estacoes.col.machine' | translate }}</th>
                    <th>{{ 'fluxo.estacoes.col.station' | translate }}</th>
                    <th>{{ 'fluxo.estacoes.col.ip' | translate }}</th>
                    <th>{{ 'fluxo.estacoes.col.status' | translate }}</th>
                    <th>{{ 'fluxo.estacoes.col.by' | translate }}</th>
                    <th class="r"><span class="sr-only">{{ 'fluxo.estacoes.col.actions' | translate }}</span></th>
                  </tr>
                </thead>
                <tbody>
                  <ng-container *ngFor="let m of maquinasFiltradas; trackBy: trackMaquina">
                    <tr [class.ge-atual]="m.terminalId === terminalAtual" [class.ge-aberta]="detalhe === m.terminalId">
                      <td class="ge-maq" [attr.data-label]="'fluxo.estacoes.col.machine' | translate">
                        <button type="button" class="ge-drag-handle" draggable="true" (dragstart)="iniciarDrag($event,m)" (dragend)="encerrarDrag()" [disabled]="!!salvandoMaquina" [attr.aria-label]="'fluxo.estacoes.drag.handle' | translate" [attr.title]="'fluxo.estacoes.drag.hint' | translate"><i class="pi pi-arrows-alt"></i></button><strong>{{ m.apelido || ('fluxo.estacoes.unnamed' | translate) }}</strong>
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
                        <p-dropdown *ngIf="edicao[m.terminalId]" styleClass="ge-row-dd" panelStyleClass="ops-dark-dropdown-panel" [options]="opcoesEstacao" [(ngModel)]="edicao[m.terminalId].estacaoCodigo" optionLabel="label" optionValue="value" appendTo="body" [style]="{ width: '100%' }" [disabled]="salvandoMaquina === m.terminalId" [attr.aria-label]="'fluxo.estacoes.col.station' | translate"></p-dropdown>
                        <small class="ge-aviso" *ngIf="!estacaoExiste(m.estacaoCodigo)">
                          <i class="pi pi-exclamation-triangle"></i> {{ 'fluxo.estacoes.stationMissing' | translate:{ name: m.estacaoNome || m.estacaoCodigo } }}
                        </small>
                      </td>
                      <td class="ge-ip" [class.ge-ip--miss]="!m.ip" [attr.data-label]="'fluxo.estacoes.col.ip' | translate">{{ m.ip || ('fluxo.estacoes.ipMissing' | translate) }}</td>
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
                          <button *ngIf="maquinaAlterada(m)" pButton type="button" icon="pi pi-check" [label]="'fluxo.estacoes.save' | translate" class="p-button-sm" [loading]="salvandoMaquina === m.terminalId" [disabled]="!edicao[m.terminalId].estacaoCodigo || !edicao[m.terminalId].apelido.trim()" (click)="salvarMaquina(m)"></button>
                          <button pButton type="button" icon="pi pi-pencil" [label]="'fluxo.estacoes.edit' | translate" class="p-button-sm p-button-text" (click)="abrirMaquina(m)"></button>
                          <button pButton type="button" icon="pi pi-trash" [label]="'fluxo.estacoes.remove' | translate" class="p-button-sm p-button-text ge-remove"
                                  [pTooltip]="'fluxo.estacoes.removeTip' | translate" tooltipPosition="left"
                                  [disabled]="salvandoMaquina === m.terminalId" (click)="pedirRemocao(m)"></button>
                        </div>
                      </td>
                    </tr>
                    <tr class="ge-det" *ngIf="detalhe === m.terminalId">
                      <td colspan="6">
                        <dl>
                          <div><dt>{{ 'fluxo.estacoes.linkedAt' | translate }}</dt><dd>{{ m.vinculadoEm ? (m.vinculadoEm | date:'dd/MM/yyyy HH:mm') : '—' }}</dd></div>
                          <div><dt>{{ 'fluxo.estacoes.lastAccessLabel' | translate }}</dt><dd>{{ m.ultimoAcesso ? (m.ultimoAcesso | date:'dd/MM/yyyy HH:mm') : '—' }}</dd></div>
                          <div><dt>{{ 'fluxo.estacoes.ip' | translate }}</dt><dd class="fx-mono" [class.ge-ip--miss]="!m.ip">{{ m.ip || ('fluxo.estacoes.ipMissing' | translate) }}</dd></div>
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
            <span class="fx-mono" [class.ge-ip--miss]="!m.ip">{{ m.ip || ('fluxo.estacoes.ipMissing' | translate) }}</span>
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

    <p-dialog styleClass="ge-dialog ge-drawer" [(visible)]="mostrarEstacao" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body"
              [closable]="!salvandoEstacao" [closeOnEscape]="!salvandoEstacao" [header]="estacaoEmEdicao ? ('fluxo.estacoes.editStation' | translate) : ('fluxo.estacoes.newStation' | translate)" [style]="{ width: '640px', maxWidth: '95vw' }">
      <div class="gp"><section class="ge-drawer-context" *ngIf="estacaoEmEdicao as e"><h3>Monitoramento do vínculo</h3><p *ngIf="!e.maquinas">Sem vínculo há {{ tempoSemVinculo(e) }}. Alerta crítico a partir de 24 horas.</p><p *ngIf="e.monitoradoDesde">Histórico acompanhado desde {{ e.monitoradoDesde|date:'dd/MM/yyyy HH:mm' }}. Períodos anteriores não foram reconstruídos.</p><h3>Etapas atendidas</h3><ol><li *ngFor="let etapa of e.etapas">{{ etapa }}</li></ol><p>As etapas seguem o setor cadastrado da estação.</p><h3>Máquinas vinculadas</h3><div *ngFor="let m of maquinasDa(e.codigo)"><button type="button" class="ge-text-btn" (click)="abrirMaquina(m)">{{ m.apelido || 'Sem nome' }}</button><p>{{ m.ativa?'Vínculo ativo':'Vínculo inativo' }} · {{ 'fluxo.estacoes.col.ip' | translate }}: {{ m.ip || ('fluxo.estacoes.ipMissing' | translate) }} · Último acesso: {{ m.ultimoAcesso?(m.ultimoAcesso|date:'dd/MM/yyyy HH:mm'):'Não informado' }}</p></div><button type="button" class="ge-fast-pair" (click)="abrirPareamento(e.codigo)">Parear máquina por código</button><h3>Histórico de vínculos (últimos 100 eventos)</h3><p *ngIf="carregandoHistorico">Carregando…</p><p *ngIf="erroHistorico" role="alert">{{ erroHistorico }}</p><p *ngIf="!carregandoHistorico && !erroHistorico && !eventosVinculo.length">Nenhum evento registrado desde o início do monitoramento.</p><ol class="ge-history"><li *ngFor="let evento of eventosVinculo"><strong>{{ evento.acao }} · {{ evento.apelido || evento.terminalId }}</strong><span>{{ evento.estacaoAnterior || 'Sem vínculo' }} → {{ evento.estacaoNova || 'Sem vínculo' }}</span><span>{{ evento.responsavel }} · {{ evento.ocorridoEm|date:'dd/MM/yyyy HH:mm:ss' }}</span></li></ol></section><label class="ge-label" for="ge-est-nome">{{ 'fluxo.estacoes.field.name' | translate }}</label>
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

    <p-dialog styleClass="ge-dialog" [(visible)]="mostrarEditarMaquina" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body" [header]="aprovandoPendente?'Aprovar máquina sem código':('fluxo.estacoes.editMachine' | translate)"
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
            <span class="fx-mono">{{ 'fluxo.estacoes.col.ip' | translate }}: {{ info.ip || ('fluxo.estacoes.ipMissing' | translate) }}</span>
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
export class OsFluxoEstacoesComponent implements OnInit, OnDestroy {
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

  private timerAtualizacao?: ReturnType<typeof setInterval>;
  ngOnDestroy(): void { if(this.timerAtualizacao)clearInterval(this.timerAtualizacao); }
  aprovandoPendente=false;
  preparandoPropria=false;
  erroDescoberta='';
  eventosVinculo: FluxoVinculoEvento[]=[];
  carregandoHistorico=false;
  erroHistorico='';
  minutosSemVinculo(e: FluxoEstacaoGestao): number | null {
    if (!e.semVinculoDesde) return null;
    const minutos = Math.floor((Date.now() - new Date(e.semVinculoDesde).getTime()) / 60000);
    return Number.isFinite(minutos) ? Math.max(0, minutos) : null;
  }
  tempoSemVinculo(e: FluxoEstacaoGestao): string {
    if (!e.semVinculoDesde) return this.tx('fluxo.estacoes.age.untracked', 'Tempo anterior não registrado');
    const minutos = this.minutosSemVinculo(e);
    if (minutos == null) return this.tx('fluxo.estacoes.age.unavailable', 'Tempo não disponível');
    if (minutos >= 1440) {
      const dias = Math.floor(minutos / 1440);
      return dias === 1
        ? this.tx('fluxo.estacoes.age.day', '1 dia')
        : this.tx('fluxo.estacoes.age.days', `${dias} dias`, { n: String(dias) });
    }
    if (minutos >= 60) return this.tx('fluxo.estacoes.age.hours', `${Math.floor(minutos / 60)} h`, { n: String(Math.floor(minutos / 60)) });
    return this.tx('fluxo.estacoes.age.minutes', `${minutos} min`, { n: String(minutos) });
  }
  sinalRecente(m: FluxoMaquina): boolean {
    if (!m.ultimoAcesso) return false;
    const ms = Date.now() - new Date(m.ultimoAcesso).getTime();
    return Number.isFinite(ms) && ms >= 0 && ms < 15 * 60000;
  }
  nivelEstacao(e: FluxoEstacaoGestao): NivelEstacao {
    if (e.maquinas) {
      const maquinas = this.maquinasDa(e.codigo);
      if (maquinas.some(m => !m.ativa)) return 'fault';
      if (maquinas.some(m => !this.sinalRecente(m))) return 'stale';
      return 'linked';
    }
    const minutos = this.minutosSemVinculo(e);
    if (minutos == null) return 'unknown';
    if (minutos >= 1440) return 'critical';
    if (minutos >= 480) return 'shift';
    if (minutos >= 60) return 'hour';
    if (minutos >= 10) return 'watch';
    return 'fresh';
  }
  semVinculoCritico(e: FluxoEstacaoGestao): boolean { return this.nivelEstacao(e) === 'critical'; }
  faixaKey(e: FluxoEstacaoGestao): string {
    const nivel = this.nivelEstacao(e);
    if (nivel === 'fresh' || nivel === 'watch') return 'fluxo.estacoes.band.unlinked';
    return `fluxo.estacoes.band.${nivel}`;
  }
  iconeFaixa(e: FluxoEstacaoGestao): string {
    const nivel = this.nivelEstacao(e);
    if (nivel === 'linked') return 'pi-link';
    if (nivel === 'fault') return 'pi-ban';
    if (nivel === 'stale') return 'pi-clock';
    return 'pi-desktop';
  }
  etapasVisiveis(e: FluxoEstacaoGestao): string[] { return (e.etapas || []).slice(0, 3); }
  presencaMaquina(m: FluxoMaquina): string {
    if (!m.ativa) return this.tx('fluxo.estacoes.presence.inactive', 'Vínculo inativo');
    if (!m.ultimoAcesso) return this.tx('fluxo.estacoes.presence.none', 'Sem sinal registrado');
    return this.sinalRecente(m)
      ? this.tx('fluxo.estacoes.presence.recent', 'Sinal recente (até 15 min)')
      : this.tx('fluxo.estacoes.presence.stale', 'Sem sinal recente');
  }
  opsTexto(tipo: 'unpaired' | 'stale' | 'active' | 'pending'): string {
    const n = tipo === 'unpaired' ? this.estacoesSemVinculo : tipo === 'stale' ? this.maquinasSemSinalRecente : tipo === 'active' ? this.vinculosAtivos : this.aprovacoesPendentes;
    const sufixo = n === 0 ? 'none' : n === 1 ? 'one' : 'many';
    const muitos: Record<typeof tipo, string> = {
      unpaired: `${n} estações sem máquina`,
      stale: `${n} máquinas sem sinal recente`,
      active: `${n} vínculos ativos`,
      pending: `${n} máquinas aguardando aprovação`
    };
    const poucos: Record<string, string> = {
      'unpaired.none': 'Nenhuma estação sem máquina', 'unpaired.one': '1 estação sem máquina',
      'stale.none': 'Nenhuma máquina sem sinal recente', 'stale.one': '1 máquina sem sinal recente',
      'active.none': 'Nenhum vínculo ativo', 'active.one': '1 vínculo ativo',
      'pending.none': 'Nenhuma aprovação pendente', 'pending.one': '1 máquina aguardando aprovação'
    };
    return this.tx(`fluxo.estacoes.ops.${tipo}.${sufixo}`, sufixo === 'many' ? muitos[tipo] : poucos[`${tipo}.${sufixo}`], n > 1 ? { n: String(n) } : undefined);
  }
  textoDescoberta(): string {
    const n = this.aprovacoesPendentes;
    if (!n) return this.tx('fluxo.estacoes.discovery.clear', 'Nenhuma máquina aguardando aprovação');
    if (n === 1) return this.tx('fluxo.estacoes.discovery.pending.one', '1 máquina aguardando aprovação');
    return this.tx('fluxo.estacoes.discovery.pending.many', `${n} máquinas aguardando aprovação`, { n: String(n) });
  }
  secoes: Record<'situacao' | 'estacoes' | 'maquinas', boolean> = { situacao: true, estacoes: true, maquinas: false };
  alternarSecao(nome: 'situacao' | 'estacoes' | 'maquinas', origem?: Event): void {
    this.secoes[nome] = !this.secoes[nome];
    if (!this.secoes[nome]) return;
    const secao = (origem?.currentTarget as HTMLElement | undefined)?.closest('section');
    if (!secao) return;
    requestAnimationFrame(() => secao.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }
  focarDescoberta(): void {
    this.secoes.situacao = true;
    const alvo = document.getElementById('ge-discovery');
    alvo?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    alvo?.querySelector<HTMLElement>('h2')?.focus();
  }
  private ordemNivel(nivel: NivelEstacao): number {
    return { critical: 0, shift: 1, hour: 2, unknown: 3, watch: 4, fresh: 5, fault: 6, stale: 7, linked: 8 }[nivel];
  }
  private compararPrioridade(a: FluxoEstacaoGestao, b: FluxoEstacaoGestao): number {
    const ordem = this.ordemNivel(this.nivelEstacao(a)) - this.ordemNivel(this.nivelEstacao(b));
    if (ordem) return ordem;
    const idade = (this.minutosSemVinculo(b) ?? -1) - (this.minutosSemVinculo(a) ?? -1);
    if (idade) return idade;
    return a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true });
  }
  selecionarPendente(m:FluxoMaquinaPendente): void { this.abrirMaquina({...m,estacaoCodigo:'',apelido:'',ativa:false});this.aprovandoPendente=true; }
  cancelandoSolicitacao: string | null = null;
  cancelarSolicitacao(m: FluxoMaquinaPendente): void {
    if (this.cancelandoSolicitacao) return;
    this.cancelandoSolicitacao = m.terminalId;
    this.erroDescoberta = '';
    this.api.cancelarSolicitacao(m.terminalId).subscribe({
      next: (d: FluxoEstacoesGestao) => {
        this.cancelandoSolicitacao = null;
        this.aplicar(d);
        this.toast.add({ severity: 'success', summary: this.tx('fluxo.estacoes.discovery.cancelled', 'Solicitação cancelada'), life: 3000 });
      },
      error: (e: { error?: { mensagem?: string } }) => {
        this.cancelandoSolicitacao = null;
        this.erroDescoberta = e?.error?.mensagem || this.tx('fluxo.estacoes.discovery.cancelFailed', 'Não foi possível cancelar a solicitação.');
      }
    });
  }
  vincularEstaMaquina(): void {
    if(this.preparandoPropria)return;
    this.erroDescoberta='';let id:string;
    try { id=localStorage.getItem(STORAGE_TERMINAL)||crypto.randomUUID();localStorage.setItem(STORAGE_TERMINAL,id); } catch { this.erroDescoberta='Permita o armazenamento do navegador para identificar esta máquina.';return; }
    const existente=this.dados?.maquinas.find(m=>m.terminalId===id);if(existente){this.abrirMaquina(existente);return;}
    this.preparandoPropria=true;
    this.api.solicitarPareamento(id).subscribe({next:r=>{this.preparandoPropria=false;if(r.vinculada){this.carregar();return;}this.selecionarPendente({terminalId:id,userAgent:navigator.userAgent});},error:e=>{this.preparandoPropria=false;this.erroDescoberta=e?.error?.mensagem||'Não foi possível identificar esta máquina.';}});
  }
  focoMaquinas = false;
  setorFiltro = '';
  buscaMaquina = '';
  get estacoesPendentes(): FluxoEstacaoGestao[] { return (this.dados?.estacoes || []).filter(e => !e.maquinas).sort((a, b) => this.compararPrioridade(a, b)); }
  get sugestoesBusca(): string[] { return [...new Set([...(this.dados?.estacoes || []).flatMap(e=>[e.nome,e.codigo,e.setor || '']),...(this.dados?.maquinas || []).flatMap(m=>[m.apelido || '',m.usuarioNome || '',m.terminalId,m.ip || ''])].filter(Boolean))]; }
  get maquinasFiltradas(): FluxoMaquina[] { const q=this.buscaMaquina.trim().toLocaleLowerCase('pt-BR'); return (this.dados?.maquinas || []).filter(m=>!q || [m.apelido,m.usuarioNome,m.terminalId,m.ip,this.nomeEstacao(m.estacaoCodigo)].join(' ').toLocaleLowerCase('pt-BR').includes(q)); }
  ultimoAcessoEstacao(codigo:string): string | null { return this.maquinasDa(codigo).map(m=>m.ultimoAcesso).filter((v):v is string=>!!v).sort().reverse()[0] || null; }
  visao: 'tabela' | 'cards' = 'cards';
  filtroVinculo: 'todos' | 'com' | 'sem' | 'sinal' = 'todos';
  vinculoAberto = false;
  @HostListener('document:click')
  fecharMenuVinculo(): void { this.vinculoAberto = false; }
  escolherVinculo(valor: 'todos' | 'com' | 'sem' | 'sinal'): void { this.filtroVinculo = valor; this.vinculoAberto = false; }
  rotuloFiltroVinculo(): string {
    const chave = this.filtroVinculo === 'todos' ? 'all' : this.filtroVinculo === 'sem' ? 'without' : this.filtroVinculo === 'com' ? 'with' : 'stale';
    const texto = { all: 'Todas as estações', without: 'Sem máquina', with: 'Com máquina', stale: 'Sem sinal recente' }[chave];
    return this.tx(`fluxo.estacoes.filter.${chave}`, texto);
  }
  maquinaDrag: FluxoMaquina | null = null;
  destinoDrag: string | null = null;
  get cobertura(): number { const total=this.dados?.estacoes.length || 0; return total?Math.round((total-this.estacoesSemVinculo)*100/total):0; }
  get estacoesComMaquina(): number { return (this.dados?.estacoes.length || 0) - this.estacoesSemVinculo; }
  get maquinasSemSinalRecente(): number { return (this.dados?.maquinas || []).filter(m => m.ativa && !this.sinalRecente(m)).length; }
  get vinculosAtivos(): number { return (this.dados?.maquinas || []).filter(m => m.ativa).length; }
  get aprovacoesPendentes(): number { return this.dados?.pendentes?.length || 0; }
  get acaoNecessaria(): boolean { return this.estacoesSemVinculo > 0 || this.maquinasSemSinalRecente > 0 || this.aprovacoesPendentes > 0; }
  iniciarDrag(event: DragEvent,m: FluxoMaquina): void { if(this.salvandoMaquina) {event.preventDefault();return;} this.maquinaDrag=m; event.dataTransfer?.setData('text/plain',m.terminalId); if(event.dataTransfer) event.dataTransfer.effectAllowed='move'; }
  permitirDrop(event: DragEvent,e: FluxoEstacaoGestao): void { if(this.maquinaDrag && !this.salvandoMaquina && this.maquinaDrag.estacaoCodigo!==e.codigo) { event.preventDefault();this.destinoDrag=e.codigo; } }
  soltarMaquina(event: DragEvent,e: FluxoEstacaoGestao): void { event.preventDefault(); const m=this.maquinaDrag;this.encerrarDrag();if(!m || this.salvandoMaquina || m.estacaoCodigo===e.codigo)return;this.abrirMaquina(m);this.edicao[m.terminalId].estacaoCodigo=e.codigo; }
  encerrarDrag(): void { this.maquinaDrag=null;this.destinoDrag=null; }
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
    this.timerAtualizacao=setInterval(()=>{ if(!this.carregando && !this.mostrarEstacao && !this.mostrarEditarMaquina && !this.mostrarPareamento && !this.mostrarRemocao && !this.salvandoMaquina && !this.maquinaDrag && !this.edicaoSuja())this.carregar(); },30000);
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
    return this.maquinasPorEstacao?.[estacaoCodigo] ?? [];
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
    return (this.dados?.maquinas || []).filter(m => this.combinaResumo([m.apelido, m.estacaoNome, this.nomeEstacao(m.estacaoCodigo), m.usuarioNome, m.ip, this.navegador(m.userAgent)].join(' ')));
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
    this.filtroVinculo = 'todos';
    this.setorFiltro = '';
    this.linhaFocada = 0;
  }

  get estacoesFiltradas(): FluxoEstacaoGestao[] {
    const busca = this.buscaEstacao.trim().toLocaleLowerCase('pt-BR');
    return (this.dados?.estacoes || []).filter(e => {
      if (this.setorFiltro && e.setor !== this.setorFiltro) return false;
      if (this.filtroVinculo === 'sem' && e.maquinas) return false;
      if (this.filtroVinculo === 'com' && !e.maquinas) return false;
      if (this.filtroVinculo === 'sinal') {
        const nivel = this.nivelEstacao(e);
        if (nivel !== 'stale' && nivel !== 'fault') return false;
      }
      if (!busca) return true;
      return [e.nome, e.codigo, e.setor, ...e.etapas, ...this.maquinasDa(e.codigo).flatMap(m => [m.apelido, m.usuarioNome, m.terminalId, m.ip])].join(' ').toLocaleLowerCase('pt-BR').includes(busca);
    }).sort((a, b) => this.compararPrioridade(a, b));
  }

  mostrarSetor(e: FluxoEstacaoGestao): boolean {
    const normalizar = (v: string) => v.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
    const setor = normalizar(e.setor || '');
    const nome = normalizar(e.nome).replace(/\s+\d+$/, '');
    return !!setor && nome !== setor;
  }

  abrirEstacao(e?: FluxoEstacaoGestao): void {
    this.estacaoEmEdicao=e||null;
    this.eventosVinculo=[];this.erroHistorico='';this.carregandoHistorico=!!e;
    if(e)this.api.historicoEstacao(e.codigo).subscribe({next:historico=>{if(this.estacaoEmEdicao?.codigo===e.codigo){this.eventosVinculo=historico;this.carregandoHistorico=false;}},error:()=>{if(this.estacaoEmEdicao?.codigo===e.codigo){this.carregandoHistorico=false;this.erroHistorico='Não foi possível carregar o histórico.';}}});
    this.estacaoEmEdicao = e || null;
    this.estacaoNome = e?.nome || '';
    this.estacaoSetor = e?.setor || null;
    this.erroEstacao = '';
    this.mostrarEstacao = true;
  }

  prepararAcoes(e: FluxoEstacaoGestao): void {
    this.acoesEstacao = [
      { label: this.tx('fluxo.estacoes.menu.edit', 'Editar nome'), icon: 'pi pi-pencil', command: () => this.abrirEstacao(e) },
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
    this.aprovandoPendente=false;
    this.maquinaEmEdicao = m;
    this.edicao[m.terminalId] = { estacaoCodigo: m.estacaoCodigo, apelido: m.apelido || '' };
    this.erroMaquina = '';
    this.mostrarEditarMaquina = true;
  }

  private edicaoSuja(): boolean { return (this.dados?.maquinas || []).some(m => this.maquinaAlterada(m)); }
  maquinaAlterada(m: FluxoMaquina): boolean {
    const ed = this.edicao[m.terminalId];
    return !!ed && (ed.estacaoCodigo !== m.estacaoCodigo || ed.apelido.trim() !== (m.apelido || ''));
  }

  salvarMaquina(m: FluxoMaquina): void {
    const ed = this.edicao[m.terminalId];
    if (!ed || !ed.estacaoCodigo || !ed.apelido.trim() || !this.maquinaAlterada(m) || this.salvandoMaquina) return;
    this.salvandoMaquina = m.terminalId;
    const pedido=this.aprovandoPendente?this.api.aprovarMaquina(m.terminalId,ed.estacaoCodigo,ed.apelido.trim()):this.api.atualizarMaquina(m.terminalId,ed.estacaoCodigo,ed.apelido.trim());
    pedido.subscribe({
      next: (d) => {
        this.salvandoMaquina = null;
        this.aplicar(d);
        this.mostrarEditarMaquina = false;
        this.toast.add({ severity: 'success', summary: this.tx('fluxo.estacoes.machineUpdated', 'Máquina atualizada'), detail: this.tx('fluxo.estacoes.machineStation', `Estação: ${this.nomeEstacao(ed.estacaoCodigo)}.`, { name: this.nomeEstacao(ed.estacaoCodigo) }), life: 3500 });
      },
      error: (err) => {
        this.salvandoMaquina = null;
        this.erroMaquina = err?.error?.mensagem || this.tx('fluxo.estacoes.nameFailed', 'Não foi possível salvar. Tente novamente.');
        if (!this.mostrarEditarMaquina) this.toast.add({ severity: 'error', summary: this.erroMaquina, life: 4000 });
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
