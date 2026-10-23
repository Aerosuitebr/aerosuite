import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SharedModule } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import {
  FluxoBiparRequest, FluxoBiparResultado, FluxoCampoSugestao, FluxoErro, FluxoEstacao, FluxoEstadoOs, FluxoEtapa, FluxoFilaItem, FluxoPareamento, FluxoSugestaoOs,
  OsFluxoService, codigoBarrasOs, formatarDuracao, formatarHora, labelSituacao
} from './os-fluxo.service';
import { FluxoBarcodeComponent } from './fluxo-barcode.component';
import { OS_FLUXO_FUNCIONALIDADE } from '../../auth/fluxo-os.guard';
import { OsFluxoPermissaoService } from './os-fluxo-permissao.service';

type ModoEstacao = 'AUTO' | 'ENTRADA' | 'SAIDA';

interface ConfigEstacao {
  nome: string;
  /** Estação gerada pelo servidor a que esta máquina está vinculada; nome e etapas vêm dela. */
  estacaoCodigo?: string | null;
  /** Nome desta máquina na estação (diferencia as máquinas de uma mesma estação). */
  maquina?: string | null;
  /** Vazio = qualquer etapa (bipa-se o código da folha); uma = etapa fixa; várias = escolha automática pela situação da OS. */
  etapaIds: number[];
  /** Só se aplica quando o terminal tem exatamente uma etapa. */
  modo: ModoEstacao;
  som: boolean;
}

interface LeituraHistorico {
  ok: boolean;
  hora: Date;
  acao?: 'ENTRADA' | 'SAIDA';
  titulo: string;
  detalhe: string;
  osCodigo?: string;
  osId?: number;
  cor?: string | null;
  cliente?: string | null;
  forcado?: boolean;
  podeForcar?: boolean;
  meta?: { icone: string; texto: string }[];
}

type AbaFila = 'TODAS' | 'ENTRADA' | 'SAIDA';
type VisaoFila = 'GRADE' | 'LISTA';

interface Feedback {
  ok: boolean;
  titulo: string;
  mensagem: string;
  resultado?: FluxoBiparResultado;
  erro?: FluxoErro;
}

const STORAGE_KEY = 'osFluxo.estacao.v1';
const STORAGE_VISAO = 'osFluxo.estacao.visaoFila';
const STORAGE_TERMINAL = 'osFluxo.terminalId';
const CODIGO_CANCELAR = 'XCANCELAR';
const TIMEOUT_PENDENCIA_SEG = 45;

/** Identificador desta máquina, gerado uma vez e guardado no navegador (crypto.randomUUID exige HTTPS). */
function obterTerminalId(): string {
  const gerar = () => `T${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
  try {
    let id = localStorage.getItem(STORAGE_TERMINAL);
    if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      id = gerar();
      localStorage.setItem(STORAGE_TERMINAL, id);
    }
    return id;
  } catch {
    return gerar();
  }
}

@Component({
  standalone: true,
  selector: 'app-os-fluxo-estacao',
  imports: [
    CommonModule, FormsModule, RouterLink, ButtonModule, DropdownModule, DialogModule,
    InputTextModule, InputTextareaModule, TooltipModule, SharedModule, FluxoBarcodeComponent
  ],
  styleUrls: ['./fluxo-shared.css'],
  template: `
    <div class="st-shell" [class.is-fullscreen]="fullscreen">
      <header class="st-top">
        <div class="st-brand">
          <a class="st-back fx-no-print" routerLink="/os/fluxo" pTooltip="Painel do fluxo"><i class="pi pi-arrow-left"></i></a>
          <div class="st-logo"><i class="pi pi-qrcode"></i></div>
          <div>
            <p class="st-eyebrow">Controle de fluxo da OS</p>
            <h1>Estação de bipagem</h1>
          </div>
        </div>

        <div class="st-config">
          <button type="button" class="st-status" [class.is-attention]="terminalSemEtapa" (click)="abrirConfig()" pTooltip="Configuração fixa deste terminal · clique para alterar"
                  tooltipPosition="bottom" aria-label="Alterar configuração da estação">
            <span class="st-status-item">
              <span class="k">Estação</span>
              <span class="v" [class.warn]="!config.estacaoCodigo"><i class="pi pi-desktop"></i> {{ config.estacaoCodigo ? estacaoRegistro : (podeTrocarEstacao ? 'Escolher estação' : 'Não pareada') }}</span>
            </span>
            <span class="st-status-sep"></span>
            <span class="st-status-item">
              <span class="k">{{ multiEtapa ? 'Etapas' : 'Etapa' }}</span>
              <span class="v" [style.--stage]="etapaFixa?.cor || null">
                <span class="sw" *ngIf="etapaFixa"></span>
                <span class="sws" *ngIf="multiEtapa"><span class="sw" *ngFor="let e of etapasTerminal" [style.background]="e.cor || '#334155'"></span></span>
                {{ resumoEtapasTerminal }}
              </span>
            </span>
            <span class="st-status-sep" *ngIf="etapaFixa"></span>
            <span class="st-status-item" *ngIf="etapaFixa">
              <span class="k">Ação</span>
              <span class="v">
                <i class="pi" [ngClass]="config.modo === 'ENTRADA' ? 'pi-arrow-circle-down' : config.modo === 'SAIDA' ? 'pi-arrow-circle-up' : 'pi-sync'"></i>
                {{ config.modo === 'ENTRADA' ? 'Só entrada' : config.modo === 'SAIDA' ? 'Só saída' : 'Automática' }}
              </span>
            </span>
            <span class="st-status-lock"><i class="pi pi-lock"></i><i class="pi pi-cog"></i></span>
          </button>
          <div class="st-icons">
            <a class="st-icon" routerLink="/os/fluxo/codigos" pTooltip="Imprimir códigos das etapas (FE / FS)" aria-label="Imprimir códigos das etapas">
              <i class="pi pi-print"></i>
            </a>
            <button type="button" class="st-icon" (click)="toggleSom()" [pTooltip]="config.som ? 'Som ligado' : 'Som desligado'">
              <i class="pi" [ngClass]="config.som ? 'pi-volume-up' : 'pi-volume-off'"></i>
            </button>
            <button type="button" class="st-icon" (click)="toggleFullscreen()" [pTooltip]="fullscreen ? 'Sair da tela cheia' : 'Tela cheia (modo quiosque)'">
              <i class="pi" [ngClass]="fullscreen ? 'pi-window-minimize' : 'pi-window-maximize'"></i>
            </button>
          </div>
        </div>
      </header>

      <main class="st-main">
        <div class="st-bloq" *ngIf="maquinaBloqueada" role="alert">
          <span class="st-bloq-ico"><i class="pi pi-lock"></i></span>
          <div class="st-bloq-txt">
            <strong>Bipagem bloqueada: esta máquina ainda não é uma estação</strong>
            <span>Peça a um Administrador ou Diretor para pareá-la em Gerenciar Estações{{ pareamento?.codigo ? ' com o código' : '' }}
              <b class="st-bloq-cod" *ngIf="pareamento?.codigo">{{ pareamento?.codigo }}</b>. O cadastro da máquina na estação deve ser efetuado por um administrador.</span>
          </div>
          <button pButton type="button" label="Ver código" icon="pi pi-link" class="p-button-sm" (click)="abrirConfig()"></button>
        </div>
        <section class="st-hero">
          <div class="st-reader" [class.is-busy]="enviando" [class.has-focus]="inputFocado && !enviando" [class.is-idle]="!inputFocado && !enviando"
               [class.flash-ok]="flash === 'ok'" [class.flash-err]="flash === 'err'" (click)="focar()">
            <div class="st-reader-bar" role="status" aria-live="polite">
              <span class="st-led"><i class="pi" [ngClass]="enviando ? 'pi-spin pi-spinner' : inputFocado ? 'pi-check' : 'pi-pause'"></i></span>
              <div class="st-reader-txt">
                <strong>{{ enviando ? 'Registrando leitura…' : inputFocado ? 'Leitor ativo e pronto' : 'Leitor pausado' }}</strong>
                <span>{{ enviando ? 'Aguarde a confirmação do servidor' : inputFocado ? 'Aponte o leitor para o código de barras' : 'Clique nesta área ou pressione F2 para voltar a ler' }}</span>
              </div>
              <span class="st-reader-mode" [style.--stage]="etapaFixa?.cor || null">
                <span class="sw" *ngIf="etapaFixa"></span>
                <i class="pi pi-sitemap" *ngIf="!etapaFixa"></i>
                {{ etapaFixa ? etapaFixa.ordem + '. ' + etapaFixa.nome + ' · ' + labelModo(config.modo) : multiEtapa ? 'Etapas ' + resumoEtapasTerminal + ' · automática' : 'Qualquer etapa · bipe OS + código FE/FS' }}
              </span>
            </div>

            <div class="st-input-row">
              <i class="pi pi-barcode"></i>
              <input #scanInput class="st-input" [(ngModel)]="entrada" (keydown)="onKeydown($event)"
                     (focus)="inputFocado = true" (blur)="inputFocado = false"
                     autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false"
                     [placeholder]="placeholderScan" aria-label="Leitura do código de barras" />
            </div>

            <div class="st-reader-foot">
              <div class="st-flow">
                <span class="st-flow-step" [class.done]="!!pendenteOs" [class.active]="!pendenteOs">
                  <span class="n">1</span> OS
                </span>
                <i class="pi pi-angle-right"></i>
                <span class="st-flow-step" [class.done]="etapaDefinida" [class.active]="!!pendenteOs && !etapaDefinida">
                  <span class="n">2</span>
                  {{ etapaFixaCompleta ? 'Etapa fixa' : multiEtapa ? 'Etapa automática' : 'Código da etapa (FE / FS)' }}
                </span>
              </div>
              <div class="st-hotkeys">
                <span><kbd>F2</kbd> focar leitor</span>
                <span><kbd>Esc</kbd> cancelar leitura</span>
              </div>
            </div>
          </div>

          <aside class="st-last" aria-label="Última bipagem">
            <div class="st-last-head">
              <h3><i class="pi pi-history"></i> Última bipagem</h3>
              <div class="st-counts">
                <span class="c ok" pTooltip="Registradas nesta sessão"><i class="pi pi-check"></i> {{ totalOk }}</span>
                <span class="c err" pTooltip="Recusadas nesta sessão"><i class="pi pi-times"></i> {{ totalErro }}</span>
              </div>
            </div>

            <ng-container *ngFor="let u of ultimaLista; trackBy: trackHist">
              <div class="st-last-card" [class.ok]="u.ok && u.acao" [class.err]="!u.ok" [class.info]="u.ok && !u.acao" [style.--stage]="u.cor || null">
                <div class="lc-status">
                  <span class="lc-ico"><i class="pi" [ngClass]="!u.ok ? 'pi-times' : u.acao === 'SAIDA' ? 'pi-arrow-up' : u.acao === 'ENTRADA' ? 'pi-arrow-down' : 'pi-info'"></i></span>
                  <div>
                    <strong>{{ !u.ok ? 'Leitura recusada' : u.acao ? (u.forcado ? 'Registrada (forçada)' : 'Registrada com sucesso') : u.titulo }}</strong>
                    <span>às {{ u.hora | date:'HH:mm:ss' }}</span>
                  </div>
                </div>
                <div class="lc-os" *ngIf="u.osCodigo">
                  <a *ngIf="u.osId; else osSemLink" [routerLink]="['/os/fluxo/os', u.osId]" pTooltip="Abrir a auditoria desta OS">{{ u.osCodigo }}</a>
                  <ng-template #osSemLink><span>{{ u.osCodigo }}</span></ng-template>
                  <span class="lc-cli" *ngIf="u.cliente">{{ u.cliente }}</span>
                </div>
                <div class="lc-title">{{ u.ok && u.acao ? u.titulo : !u.ok ? u.titulo : '' }}</div>
                <p class="lc-msg">{{ u.detalhe }}</p>
                <div class="lc-meta" *ngIf="u.meta?.length">
                  <span *ngFor="let m of u.meta"><i [class]="m.icone"></i> {{ m.texto }}</span>
                </div>
                <button *ngIf="!u.ok && u.podeForcar && ultimaRequisicao" pButton type="button" icon="pi pi-unlock" label="Forçar entrada (gestor)"
                        class="p-button-sm p-button-warning lc-force" (click)="abrirForcar(); $event.stopPropagation()"></button>
              </div>
            </ng-container>
            <div class="st-last-empty" *ngIf="!historico.length">
              <span class="lc-ico"><i class="pi pi-barcode"></i></span>
              <strong>Nenhuma leitura nesta sessão</strong>
              <span>O resultado de cada bipagem aparece aqui, em verde quando registrada e em vermelho quando recusada.</span>
            </div>

            <div class="st-prev" *ngIf="historico.length > 1">
              <div class="st-prev-head">
                <span>Anteriores</span>
                <button type="button" *ngIf="historico.length > 4" (click)="verTodoHistorico = !verTodoHistorico">
                  {{ verTodoHistorico ? 'Mostrar menos' : 'Ver todas (' + (historico.length - 1) + ')' }}
                </button>
              </div>
              <div class="st-prev-list" [class.is-open]="verTodoHistorico">
                <div class="st-prev-item" *ngFor="let h of historicoAnterior" [class.err]="!h.ok" [style.--stage]="h.cor || null" [attr.title]="h.detalhe">
                  <span class="pi-ico"><i class="pi" [ngClass]="!h.ok ? 'pi-times' : h.acao === 'SAIDA' ? 'pi-arrow-up' : h.acao === 'ENTRADA' ? 'pi-arrow-down' : 'pi-info'"></i></span>
                  <span class="pi-os">
                    <a *ngIf="h.osId; else prevSemLink" [routerLink]="['/os/fluxo/os', h.osId]">{{ h.osCodigo }}</a>
                    <ng-template #prevSemLink>{{ h.osCodigo || '—' }}</ng-template>
                  </span>
                  <span class="pi-txt">{{ h.titulo }}</span>
                  <span class="pi-hora">{{ h.hora | date:'HH:mm' }}</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

          <div class="st-pending" *ngIf="pendenteOs || pendenteEtapa">
            <div class="st-pending-card" *ngIf="pendenteOs as po">
              <div class="pc-head">
                <span class="fx-chip fx-chip--accent"><i class="pi pi-file"></i> OS lida</span>
                <button type="button" class="pc-x" (click)="limparPendencias()" pTooltip="Cancelar (Esc)"><i class="pi pi-times"></i></button>
              </div>
              <div class="pc-os">{{ po.os.codigo }}</div>
              <div class="pc-meta">
                <span>{{ po.os.cliente || 'Cliente não informado' }}</span>
                <span class="fx-mono">PN {{ po.os.partNumber || '—' }}</span>
                <span class="fx-mono">SN {{ po.os.serialNumber || '—' }}</span>
              </div>
              <div class="pc-state">
                <ng-container *ngIf="po.registroAberto as ra">
                  <span class="fx-chip fx-chip--live"><span class="dot"></span> Em {{ ra.etapaNome }}</span>
                  <span class="fx-muted">desde {{ hora(ra.entradaEm) }} · {{ ra.entradaUsuarioNome || '—' }}</span>
                </ng-container>
                <ng-container *ngIf="!po.registroAberto">
                  <span class="fx-chip" [ngClass]="po.os.fluxoSituacao === 'CONCLUIDO' ? 'fx-chip--done' : 'fx-chip--wait'">
                    <span class="dot"></span> {{ situacao(po.os.fluxoSituacao) }}
                  </span>
                  <span class="fx-muted" *ngIf="po.proximaEtapa">Próxima: <strong>{{ po.proximaEtapa.nome }}</strong></span>
                </ng-container>
              </div>
              <div class="pc-progress">
                <span *ngFor="let e of etapas" class="seg" [style.background]="corProgresso(e, po)"
                      [pTooltip]="e.ordem + '. ' + e.nome"></span>
              </div>
            </div>
            <div class="st-pending-card st-pending-card--etapa" *ngIf="pendenteEtapa as pe"
                 [style.--stage]="pe.etapa.cor || '#334155'">
              <div class="pc-head">
                <span class="fx-chip" [ngClass]="pe.acao === 'ENTRADA' ? 'fx-chip--done' : 'fx-chip--alert'">
                  <i class="pi" [ngClass]="pe.acao === 'ENTRADA' ? 'pi-arrow-circle-down' : 'pi-arrow-circle-up'"></i> {{ pe.acao === 'ENTRADA' ? 'Entrada' : 'Saída' }}
                </span>
                <button type="button" class="pc-x" (click)="limparPendencias()"><i class="pi pi-times"></i></button>
              </div>
              <div class="pc-etapa"><span class="fx-stage-dot"><i [class]="pe.etapa.icone || 'pi pi-circle'"></i></span> {{ pe.etapa.nome }}</div>
              <div class="fx-muted">Agora bipe a etiqueta da OS</div>
            </div>
            <div class="st-timeout"><span [style.width.%]="percentualTimeout"></span></div>
          </div>

          <section class="st-fila fx-no-print" aria-label="OS para esta estação">
            <div class="sf-head">
              <div class="sf-title">
                <span class="sf-count">{{ filaVisivel.length }}</span>
                <div>
                  <h3>{{ filaVisivel.length === 1 ? 'Ordem de serviço' : 'Ordens de serviço' }} {{ rotuloAbaFila }}</h3>
                  <p>
                    {{ config.etapaIds.length ? (multiEtapa ? 'Etapas ' : 'Etapa ') + resumoEtapasTerminal : 'Todas as etapas' }}
                    · toque na OS para exibir o código de barras e bipar
                  </p>
                </div>
              </div>
              <div class="sf-tools">
                <div class="sf-view" role="group" aria-label="Modo de exibição">
                  <button type="button" [class.on]="visaoFila === 'GRADE'" (click)="definirVisaoFila('GRADE')" pTooltip="Grade de cards (toque)"
                          aria-label="Exibir em grade" [attr.aria-pressed]="visaoFila === 'GRADE'"><i class="pi pi-th-large"></i> Grade</button>
                  <button type="button" [class.on]="visaoFila === 'LISTA'" (click)="definirVisaoFila('LISTA')" pTooltip="Lista compacta (mouse e teclado)"
                          aria-label="Exibir em lista" [attr.aria-pressed]="visaoFila === 'LISTA'"><i class="pi pi-list"></i> Lista</button>
                </div>
                <button type="button" class="st-icon" (click)="carregarFila()" pTooltip="Atualizar fila" aria-label="Atualizar fila">
                  <i class="pi pi-refresh" [class.pi-spin]="carregandoFila"></i>
                </button>
              </div>
            </div>

            <div class="sf-bar">
              <label class="sf-search">
                <i class="pi pi-search"></i>
                <input [(ngModel)]="filtroFila" placeholder="Buscar por nº da OS, cliente, SN, PN ou OS original" autocomplete="off" spellcheck="false"
                       aria-label="Filtrar a fila" />
                <button type="button" *ngIf="filtroFila" (click)="filtroFila = ''" aria-label="Limpar filtro"><i class="pi pi-times"></i></button>
              </label>
              <div class="sf-chips" role="tablist" aria-label="Filtrar por situação">
                <button type="button" role="tab" [class.on]="abaFila === 'TODAS'" [attr.aria-selected]="abaFila === 'TODAS'"
                        (click)="selecionarAbaFila('TODAS')">
                  Todas <span class="ct">{{ filaOs.length }}</span>
                </button>
                <button type="button" role="tab" class="is-in" [class.on]="abaFila === 'ENTRADA'" [attr.aria-selected]="abaFila === 'ENTRADA'"
                        (click)="selecionarAbaFila('ENTRADA')">
                  <i class="pi pi-arrow-circle-down"></i> Aguardando entrada <span class="ct">{{ contagemFila.ENTRADA }}</span>
                </button>
                <button type="button" role="tab" class="is-out" [class.on]="abaFila === 'SAIDA'" [attr.aria-selected]="abaFila === 'SAIDA'"
                        (click)="selecionarAbaFila('SAIDA')">
                  <i class="pi pi-arrow-circle-up"></i> Aguardando saída <span class="ct">{{ contagemFila.SAIDA }}</span>
                </button>
              </div>
            </div>

            <ng-container *ngIf="filaVisivel.length; else filaVazia">
              <div class="sf-grid" *ngIf="visaoFila === 'GRADE'; else filaLista">
                <button type="button" class="sf-card" *ngFor="let f of filaVisivel; trackBy: trackFila" [class.out]="f.acao === 'SAIDA'"
                        [style.--stage]="f.etapa?.cor || null" (click)="abrirDaFila(f)"
                        [attr.aria-label]="'Exibir código da ' + f.os.codigo">
                  <span class="sf-card-top">
                    <span class="sf-code">{{ f.os.codigo }}</span>
                    <span class="sf-badge" [class.is-out]="f.acao === 'SAIDA'">
                      <i class="pi" [ngClass]="f.acao === 'SAIDA' ? 'pi-arrow-circle-up' : 'pi-arrow-circle-down'"></i>
                      {{ f.acao === 'SAIDA' ? 'Saída' : 'Entrada' }}
                    </span>
                  </span>
                  <span class="sf-cli" [attr.title]="f.os.cliente || null">{{ f.os.cliente || 'Cliente não informado' }}</span>
                  <span class="sf-ids">
                    <span *ngIf="f.os.numOsOriginal"><em>OS orig.</em> <b>{{ f.os.numOsOriginal }}</b></span>
                    <span><em>PN</em> <b>{{ f.os.partNumber || '—' }}</b></span>
                    <span><em>SN</em> <b>{{ f.os.serialNumber || '—' }}</b></span>
                  </span>
                  <span class="sf-stage">
                    <span class="sw"></span>
                    <span class="lbl">{{ f.acao === 'SAIDA' ? 'Em' : 'Próxima' }}</span>
                    <span class="nm">{{ f.etapa?.ordem }}. {{ f.etapa?.nome }}</span>
                  </span>
                  <span class="sf-foot">
                    <span class="sf-time" *ngIf="f.desdeSegundos != null; else abertaEm"><i class="pi pi-clock"></i> há {{ dur(f.desdeSegundos) }}</span>
                    <ng-template #abertaEm><span class="sf-time"><i class="pi pi-calendar"></i> {{ f.dtAbertura ? 'aberta ' + dataCurta(f.dtAbertura) : '—' }}</span></ng-template>
                    <span class="sf-go"><i class="pi pi-barcode"></i> Exibir código</span>
                  </span>
                </button>
              </div>

              <ng-template #filaLista>
                <div class="sf-table-wrap">
                  <table class="sf-table">
                    <thead>
                      <tr>
                        <th>OS</th>
                        <th>Cliente</th>
                        <th>OS original</th>
                        <th>PN</th>
                        <th>SN</th>
                        <th>Etapa</th>
                        <th>Situação</th>
                        <th>Tempo</th>
                        <th><span class="sr-only">Ação</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let f of filaVisivel; trackBy: trackFila" tabindex="0" [style.--stage]="f.etapa?.cor || null"
                          (click)="abrirDaFila(f)" (keydown.enter)="abrirDaFila(f)" [attr.aria-label]="'Exibir código da ' + f.os.codigo">
                        <td class="t-code">{{ f.os.codigo }}</td>
                        <td class="t-cli" [attr.title]="f.os.cliente || null">{{ f.os.cliente || '—' }}</td>
                        <td class="t-mono">{{ f.os.numOsOriginal || '—' }}</td>
                        <td class="t-mono">{{ f.os.partNumber || '—' }}</td>
                        <td class="t-mono">{{ f.os.serialNumber || '—' }}</td>
                        <td class="t-stage"><span class="sw"></span>{{ f.etapa?.ordem }}. {{ f.etapa?.nome }}</td>
                        <td>
                          <span class="sf-badge" [class.is-out]="f.acao === 'SAIDA'">
                            <i class="pi" [ngClass]="f.acao === 'SAIDA' ? 'pi-arrow-circle-up' : 'pi-arrow-circle-down'"></i>
                            {{ f.acao === 'SAIDA' ? 'Aguardando saída' : 'Aguardando entrada' }}
                          </span>
                        </td>
                        <td class="t-time">{{ f.desdeSegundos != null ? 'há ' + dur(f.desdeSegundos) : (f.dtAbertura ? dataCurta(f.dtAbertura) : '—') }}</td>
                        <td class="t-act"><span class="sf-go"><i class="pi pi-barcode"></i> Exibir código</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </ng-template>

              <p class="sf-note">
                <i class="pi pi-info-circle"></i> Não encontrou a OS? Use <b>Buscar outra OS</b> logo abaixo.
              </p>
            </ng-container>
            <ng-template #filaVazia>
              <div class="sf-empty">
                <i class="pi" [ngClass]="erroFila ? 'pi-wifi' : carregandoFila ? 'pi-spin pi-spinner' : 'pi-check-circle'"></i>
                <strong>{{ erroFila ? 'Não foi possível carregar a fila' : carregandoFila ? 'Carregando OS…'
                  : filtroFila ? 'Nenhuma OS corresponde à busca' : abaFila === 'SAIDA' ? 'Nenhuma OS em etapa aqui' : abaFila === 'ENTRADA' ? 'Nenhuma OS aguardando entrada' : 'Nenhuma OS na fila desta estação' }}</strong>
                <span *ngIf="!carregandoFila">{{ erroFila ? 'Verifique a conexão e toque em atualizar.' : 'Se a OS não aparecer, use a busca abaixo.' }}</span>
              </div>
            </ng-template>
          </section>

          <details class="st-manual fx-no-print" [open]="manualAberto" (toggle)="manualAberto = $any($event.target).open">
            <summary>
              <i class="pi pi-search"></i> Buscar outra OS
              <span class="st-manual-hint">por número, SN, PN ou cliente, se ela não estiver na fila</span>
              <i class="pi pi-chevron-down st-manual-chev"></i>
            </summary>
            <div class="st-manual-grid">
              <div class="st-field st-os-field">
                <label for="manualOsInput">OS (nº, SN, PN ou cliente)</label>
                <div class="st-combo" [class.has-sel]="!!manualSel">
                  <i class="pi" [ngClass]="buscandoOs ? 'pi-spin pi-spinner' : manualSel ? 'pi-check-circle' : 'pi-search'"></i>
                  <input #manualOsInput id="manualOsInput" pInputText [ngModel]="manualOs" (ngModelChange)="onManualOsDigitado($event)"
                         (keydown)="onManualOsKeydown($event)" (focus)="onManualOsFocus()" (blur)="onManualOsBlur()"
                         placeholder="Digite o número da OS…" autocomplete="off" spellcheck="false"
                         role="combobox" aria-autocomplete="list" [attr.aria-expanded]="painelOsAberto"
                         aria-controls="st-os-list" [attr.aria-activedescendant]="painelOsAberto && sugestaoAtiva >= 0 ? 'st-os-opt-' + sugestaoAtiva : null" />
                  <button type="button" class="st-combo-x" *ngIf="manualOs" (mousedown)="$event.preventDefault()" (click)="limparManualOs()"
                          aria-label="Limpar OS"><i class="pi pi-times"></i></button>
                </div>

                <div class="st-sug" *ngIf="painelOsAberto" (mousedown)="$event.preventDefault()">
                  <div class="st-sug-head">
                    <span>{{ buscandoOs && !sugestoesOs.length ? 'Buscando…' : sugestoesOs.length + (sugestoesOs.length === 1 ? ' OS encontrada' : ' OS encontradas') }}</span>
                    <span class="st-sug-keys"><kbd>↑</kbd><kbd>↓</kbd> navegar <kbd>Enter</kbd> selecionar <kbd>Esc</kbd> fechar</span>
                  </div>
                  <ul id="st-os-list" role="listbox" class="st-sug-list" *ngIf="sugestoesOs.length">
                    <li *ngFor="let s of sugestoesOs; let i = index" [id]="'st-os-opt-' + i" role="option" [attr.aria-selected]="i === sugestaoAtiva"
                        class="st-sug-item" [class.on]="i === sugestaoAtiva" [style.--stage]="s.etapa?.cor || null"
                        (mouseenter)="sugestaoAtiva = i" (click)="selecionarSugestao(s)">
                      <div class="si-main">
                        <div class="si-code">
                          <span><ng-container *ngFor="let p of destacar(s.os.codigo, s.campoEncontrado === 'CODIGO')"><mark *ngIf="p.m">{{ p.t }}</mark><ng-container *ngIf="!p.m">{{ p.t }}</ng-container></ng-container></span>
                          <span class="si-found" *ngIf="s.campoEncontrado !== 'CODIGO'">por {{ labelCampo(s.campoEncontrado) }}</span>
                        </div>
                        <div class="si-client">
                          <ng-container *ngFor="let p of destacar(s.os.cliente || 'Cliente não informado', s.campoEncontrado === 'CLIENTE')"><mark *ngIf="p.m">{{ p.t }}</mark><ng-container *ngIf="!p.m">{{ p.t }}</ng-container></ng-container>
                        </div>
                        <div class="si-ids">
                          <span>PN <b><ng-container *ngFor="let p of destacar(s.os.partNumber || '—', s.campoEncontrado === 'PN')"><mark *ngIf="p.m">{{ p.t }}</mark><ng-container *ngIf="!p.m">{{ p.t }}</ng-container></ng-container></b></span>
                          <span>SN <b><ng-container *ngFor="let p of destacar(s.os.serialNumber || '—', s.campoEncontrado === 'SN')"><mark *ngIf="p.m">{{ p.t }}</mark><ng-container *ngIf="!p.m">{{ p.t }}</ng-container></ng-container></b></span>
                          <span *ngIf="s.os.numOsOriginal">OS orig. <b><ng-container *ngFor="let p of destacar(s.os.numOsOriginal, s.campoEncontrado === 'OS_ORIGINAL')"><mark *ngIf="p.m">{{ p.t }}</mark><ng-container *ngIf="!p.m">{{ p.t }}</ng-container></ng-container></b></span>
                          <span *ngIf="s.marcasMatricula">Matr. <b>{{ s.marcasMatricula }}</b></span>
                        </div>
                      </div>
                      <div class="si-side">
                        <span class="si-state" [ngClass]="'is-' + estadoSugestao(s).tipo">
                          <span class="dot"></span>{{ estadoSugestao(s).texto }}
                        </span>
                        <span class="si-meta">
                          <span *ngIf="s.os.mecanicoNome"><i class="pi pi-user"></i> {{ s.os.mecanicoNome }}</span>
                          <span *ngIf="s.dtAbertura"><i class="pi pi-calendar"></i> {{ s.dtAbertura | date:'dd/MM/yy' }}</span>
                        </span>
                        <span class="si-meta" *ngIf="s.tipoServico || s.os.statusOperacional">{{ s.tipoServico || labelStatus(s.os.statusOperacional) }}</span>
                      </div>
                    </li>
                  </ul>
                  <div class="st-sug-empty" *ngIf="!sugestoesOs.length && !buscandoOs">
                    <i class="pi" [ngClass]="erroBuscaOs ? 'pi-exclamation-triangle' : 'pi-search'"></i>
                    <div>
                      <strong>{{ erroBuscaOs ? 'Não foi possível buscar agora' : 'Nenhuma OS encontrada para "' + manualOs.trim() + '"' }}</strong>
                      <span>{{ erroBuscaOs ? 'Verifique a conexão. Você ainda pode registrar digitando o código completo.' : 'Confira o número ou busque pelo SN, PN ou nome do cliente.' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="st-field">
                <label>Etapa</label>
                <p-dropdown *ngIf="podeEscolherEtapa; else etapaManualTerminal" [options]="opcoesEtapaBip" [(ngModel)]="manualEtapaId"
                            optionLabel="label" optionValue="value" optionDisabled="disabled" appendTo="body" panelStyleClass="st-dd-panel" placeholder="Selecione"
                            [style]="{ width: '100%' }"></p-dropdown>
                <ng-template #etapaManualTerminal>
                  <p-dropdown *ngIf="multiEtapa; else etapaUnicaTerminal" [options]="opcoesEtapaBip" [(ngModel)]="manualEtapaId"
                              optionLabel="label" optionValue="value" optionDisabled="disabled" appendTo="body" panelStyleClass="st-dd-panel" placeholder="Etapa do terminal"
                              [style]="{ width: '100%' }"></p-dropdown>
                </ng-template>
                <ng-template #etapaUnicaTerminal>
                  <button type="button" class="st-locked" [class.warn]="!etapaFixa" [style.--stage]="etapaFixa?.cor || null"
                          (click)="etapaFixa ? null : abrirConfig()"
                          [pTooltip]="etapaFixa ? 'Etapa definida no cadastro do terminal' : 'Clique para definir a etapa deste terminal'">
                    <ng-container *ngIf="etapaFixa; else semEtapaTerminal">
                      <span class="sw"></span><span class="txt">{{ etapaFixa.ordem }}. {{ etapaFixa.nome }}</span><i class="pi pi-lock"></i>
                    </ng-container>
                    <ng-template #semEtapaTerminal>
                      <i class="pi pi-exclamation-triangle"></i><span class="txt">Sem etapa</span><i class="pi pi-cog"></i>
                    </ng-template>
                  </button>
                </ng-template>
              </div>
              <div class="st-manual-btns">
                <button type="button" class="st-act st-act--in" [class.is-sugerida]="acaoSugerida === 'ENTRADA'"
                        [disabled]="!manualOs || !etapaManualId || enviando || acaoBloqueada('ENTRADA')" (click)="registrarManual('ENTRADA')">
                  <i class="pi pi-arrow-circle-down"></i> Entrada
                </button>
                <button type="button" class="st-act st-act--out" [class.is-sugerida]="acaoSugerida === 'SAIDA'"
                        [disabled]="!manualOs || !etapaManualId || enviando || acaoBloqueada('SAIDA')" (click)="registrarManual('SAIDA')">
                  <i class="pi pi-arrow-circle-up"></i> Saída
                </button>
              </div>
              <div class="st-sel" *ngIf="manualSel as ms" [style.--stage]="ms.etapa?.cor || null">
                <i class="pi pi-file"></i>
                <div class="st-sel-body">
                  <strong>{{ ms.os.codigo }}</strong>
                  <span>{{ ms.os.cliente || 'Cliente não informado' }} · PN {{ ms.os.partNumber || '—' }} · SN {{ ms.os.serialNumber || '—' }}</span>
                </div>
                <span class="si-state" [ngClass]="'is-' + estadoSugestao(ms).tipo"><span class="dot"></span>{{ estadoSugestao(ms).texto }}</span>
                <span class="st-sel-hint" *ngIf="acaoSugerida">
                  Sugestão: <b>{{ acaoSugerida === 'SAIDA' ? 'Saída' : 'Entrada' }}</b>
                </span>
              </div>
            </div>
          </details>
      </main>
    </div>

    <p-dialog [(visible)]="mostrarConfig" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body" styleClass="st-dlg"
              [closable]="!maquinaBloqueada" [closeOnEscape]="!maquinaBloqueada"
              [header]="modoPareamento ? 'Parear esta máquina' : 'Qual é esta estação?'"
              [style]="{ width: modoPareamento ? '560px' : '820px', maxWidth: '96vw' }" (onHide)="focarDepois()">
      <div class="par" *ngIf="modoPareamento">
        <ng-container *ngIf="!pareadaNome; else pareadaOk">
          <p class="par-txt">Esta máquina ainda não está pareada. O operador deverá solicitar a um <b>administrador</b>
            o cadastro desta máquina em uma estação, informando o código de pareamento abaixo.
            O administrador deverá efetuar o cadastro em <b>Gerenciar Estações</b>.</p>
          <div class="par-cod" *ngIf="pareamento?.codigo as cod; else parCarregando" aria-live="polite">
            <span *ngFor="let d of cod.split('')">{{ d }}</span>
          </div>
          <ng-template #parCarregando>
            <div class="par-cod par-cod--load" *ngIf="!erroPareamento"><i class="pi pi-spin pi-spinner"></i></div>
          </ng-template>
          <div class="par-espera" *ngIf="pareamento?.codigo">
            <i class="pi pi-spin pi-spinner"></i> Aguardando o pareamento… a tela abre sozinha quando a máquina for vinculada.
          </div>
          <small class="par-validade" *ngIf="pareamento?.codigo">O código é renovado automaticamente enquanto esta tela estiver aberta.
            Até o pareamento, a bipagem fica bloqueada nesta máquina.</small>
          <small class="est-erro" *ngIf="erroPareamento"><i class="pi pi-times-circle"></i> {{ erroPareamento }}</small>
        </ng-container>
        <ng-template #pareadaOk>
          <div class="par-ok">
            <span class="par-ok-ico"><i class="pi pi-check"></i></span>
            <strong>Máquina pareada</strong>
            <span>Esta máquina agora é a estação <b>{{ pareadaNome }}</b>.</span>
          </div>
        </ng-template>
      </div>
      <p class="dlg-text" *ngIf="!modoPareamento">As estações são geradas automaticamente a partir das etapas do fluxo. Toque na estação desta máquina —
        a escolha fica gravada neste computador e as etapas se atualizam sozinhas.</p>
      <div class="dlg-grid" *ngIf="!modoPareamento">
        <div class="est-loading" *ngIf="carregandoEstacoes && !estacoes.length"><i class="pi pi-spin pi-spinner"></i> Carregando estações…</div>
        <div class="est-grid" role="radiogroup" aria-label="Estações">
          <button type="button" *ngFor="let e of estacoes; trackBy: trackEstacao" class="est-card" role="radio"
                  [attr.aria-checked]="estacaoSel === e.codigo" [class.on]="estacaoSel === e.codigo" [class.uso]="e.emUso && !e.desteTerminal"
                  [style.--stage]="e.cor || null" [disabled]="estacaoTravada && e.codigo !== config.estacaoCodigo"
                  (click)="estacaoSel = e.codigo; erroEstacao = ''">
            <span class="est-head">
              <span class="est-ico"><i class="pi pi-desktop"></i></span>
              <strong>{{ e.nome }}</strong>
              <span class="est-ck"><i class="pi pi-check"></i></span>
            </span>
            <span class="est-tags">
              <span class="est-tag atual" *ngIf="e.desteTerminal"><i class="pi pi-map-marker"></i> esta máquina</span>
              <span class="est-tag uso" *ngIf="e.emUso && !e.desteTerminal"><i class="pi pi-circle-fill"></i> em uso{{ e.emUsoPor ? ' · ' + e.emUsoPor : '' }}</span>
              <span class="est-tag livre" *ngIf="!e.emUso && !e.desteTerminal">livre</span>
            </span>
            <span class="est-etapas">
              <span class="est-etapa" *ngFor="let et of etapasDaEstacao(e)" [style.--stage]="et.cor || null">
                <span class="sw"></span>{{ et.ordem }}. {{ et.nome }}
              </span>
            </span>
          </button>
        </div>
        <small class="dlg-help dlg-lock" *ngIf="estacaoTravada">
          <i class="pi pi-lock"></i> Esta máquina já está vinculada a uma estação. Para trocar, peça a um Administrador ou Diretor (Gerenciar Estações).
        </small>
        <div class="est-aviso" *ngIf="estacaoSelecionada?.emUso && !estacaoSelecionada?.desteTerminal">
          <i class="pi pi-info-circle"></i>
          <span>Outra máquina também está usando esta estação agora. As duas podem bipar ao mesmo tempo; elas se diferenciam pelo nome da máquina.</span>
        </div>
        <small class="est-erro" *ngIf="erroEstacao"><i class="pi pi-times-circle"></i> {{ erroEstacao }}</small>
        <div class="st-field" *ngIf="estacaoSelecionada?.etapaIds?.length === 1">
          <label>Ação ao bipar a OS</label>
          <div class="st-seg">
            <button type="button" [class.on]="rascunho.modo === 'AUTO'" (click)="rascunho.modo = 'AUTO'"
                    pTooltip="Se a OS não está na etapa, registra ENTRADA; se está, registra SAÍDA"><i class="pi pi-sync"></i> Automática</button>
            <button type="button" [class.on]="rascunho.modo === 'ENTRADA'" (click)="rascunho.modo = 'ENTRADA'"><i class="pi pi-arrow-circle-down"></i> Só entrada</button>
            <button type="button" [class.on]="rascunho.modo === 'SAIDA'" (click)="rascunho.modo = 'SAIDA'"><i class="pi pi-arrow-circle-up"></i> Só saída</button>
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <ng-container *ngIf="modoPareamento; else rodapeEscolha">
          <button pButton type="button" label="Gerar novo código" icon="pi pi-refresh" class="p-button-text"
                  *ngIf="erroPareamento && !pareadaNome" (click)="solicitarPareamento()"></button>
          <button pButton type="button" label="Fechar" *ngIf="!maquinaBloqueada" class="p-button-text" (click)="mostrarConfig = false"></button>
        </ng-container>
        <ng-template #rodapeEscolha>
          <button pButton type="button" [label]="config.estacaoCodigo ? 'Cancelar' : 'Escolher depois'" class="p-button-text" (click)="mostrarConfig = false"></button>
          <button pButton type="button" label="Confirmar estação" icon="pi pi-check" [loading]="salvandoEstacao"
                  [disabled]="!estacaoSel || (estacaoTravada && estacaoSel !== config.estacaoCodigo)" (click)="confirmarEstacao()"></button>
        </ng-template>
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="mostrarForcar" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body" styleClass="st-dlg"
              header="Forçar entrada fora de sequência" [style]="{ width: '480px', maxWidth: '95vw' }"
              (onHide)="focarDepois()">
      <p class="dlg-text">A entrada será registrada como <strong>forçada</strong>, com seu usuário e o motivo abaixo, e ficará destacada na auditoria da OS.</p>
      <textarea pInputTextarea [(ngModel)]="motivoForcar" rows="3" class="dlg-area" placeholder="Motivo (mínimo 5 caracteres). Ex.: retrabalho após reprovação no teste de saída"></textarea>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" (click)="mostrarForcar = false"></button>
        <button pButton type="button" label="Confirmar entrada forçada" icon="pi pi-check" class="p-button-warning"
                [disabled]="(motivoForcar || '').trim().length < 5 || enviando" (click)="confirmarForcar()"></button>
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="mostrarOsBip" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body" styleClass="st-dlg st-bip-dlg"
              [header]="terminalSemEtapa ? 'Terminal sem etapa definida' : 'Bipe o código da OS na tela'" [style]="{ width: '620px', maxWidth: '96vw' }"
              (onShow)="focarBip()" (onHide)="fecharOsBip()">
      <ng-container *ngIf="manualSel as ms">
        <div class="bip-os" [style.--stage]="ms.etapa?.cor || null">
          <div class="bip-os-top">
            <div>
              <div class="bip-k">Ordem de serviço</div>
              <div class="bip-code">{{ ms.os.codigo }}</div>
            </div>
            <span class="si-state" [ngClass]="'is-' + estadoSugestao(ms).tipo"><span class="dot"></span>{{ estadoSugestao(ms).texto }}</span>
          </div>
          <div class="bip-os-meta">
            <span><b>{{ ms.os.cliente || 'Cliente não informado' }}</b></span>
            <span>PN <b class="fx-mono">{{ ms.os.partNumber || '—' }}</b></span>
            <span>SN <b class="fx-mono">{{ ms.os.serialNumber || '—' }}</b></span>
            <span *ngIf="ms.os.mecanicoNome"><i class="pi pi-user"></i> {{ ms.os.mecanicoNome }}</span>
          </div>
        </div>

        <ng-container *ngIf="!terminalSemEtapa; else avisoTerminal">
          <div class="bip-barcode">
            <app-fluxo-barcode [valor]="codigoBarrasSel" [altura]="120" [largura]="3.2" [tamanhoFonte]="18"></app-fluxo-barcode>
          </div>

          <div class="bip-plan">
            <ng-container *ngIf="podeEscolherEtapa; else etapaDoTerminal">
              <label>Etapa <span class="bip-role"><i class="pi pi-shield"></i> alteração livre (permissão Ajuste de Etapas)</span></label>
              <p-dropdown [options]="opcoesEtapaBip" [(ngModel)]="manualEtapaId" optionLabel="label" optionValue="value" optionDisabled="disabled"
                          appendTo="body" panelStyleClass="st-dd-panel" placeholder="Selecione a etapa" [style]="{ width: '100%' }"
                          (onHide)="focarBip()"></p-dropdown>
            </ng-container>
            <ng-template #etapaDoTerminal>
              <ng-container *ngIf="multiEtapa; else etapaUnicaBip">
                <label>Etapa <span class="bip-role bip-role--muted"><i class="pi pi-lock"></i> somente as etapas deste terminal</span></label>
                <p-dropdown [options]="opcoesEtapaBip" [(ngModel)]="manualEtapaId" optionLabel="label" optionValue="value" optionDisabled="disabled"
                            appendTo="body" panelStyleClass="st-dd-panel" placeholder="Selecione a etapa do terminal" [style]="{ width: '100%' }"
                            (onHide)="focarBip()"></p-dropdown>
              </ng-container>
            </ng-template>
            <ng-template #etapaUnicaBip>
              <label>Etapa</label>
              <div class="bip-locked" [style.--stage]="etapaFixa?.cor || null">
                <span class="sw"></span>
                <strong>{{ etapaFixa?.ordem }}. {{ etapaFixa?.nome }}</strong>
                <span class="bip-locked-tag"><i class="pi pi-lock"></i> definida no cadastro do terminal</span>
              </div>
            </ng-template>
            <div class="bip-preview" *ngIf="previewBip as pv; else semEtapaBip" [class.out]="pv.acao === 'SAIDA'">
              <i class="pi" [ngClass]="pv.acao === 'SAIDA' ? 'pi-arrow-circle-up' : 'pi-arrow-circle-down'"></i>
              <div>
                <span>Ao bipar, será registrada</span>
                <strong>{{ pv.acao === 'SAIDA' ? 'Saída' : 'Entrada' }} · {{ pv.etapa.ordem }}. {{ pv.etapa.nome }}</strong>
              </div>
              <span class="bip-fixa bip-fixa--warn" *ngIf="pv.foraSequencia; else tagTerminal">
                <i class="pi pi-exclamation-triangle"></i> fora de sequência · exigirá justificativa
              </span>
              <ng-template #tagTerminal>
                <span class="bip-fixa" *ngIf="podeEscolherEtapa && config.etapaIds.includes(pv.etapa.id)"><i class="pi pi-lock"></i> etapa do terminal</span>
              </ng-template>
            </div>
            <ng-template #semEtapaBip>
              <div class="bip-preview warn">
                <i class="pi pi-exclamation-triangle"></i>
                <div>
                  <span>{{ bloqueioBip.titulo }}</span>
                  <strong>{{ bloqueioBip.detalhe }}</strong>
                </div>
              </div>
            </ng-template>
          </div>

          <div class="bip-capture" [class.has-focus]="bipFocado" [class.err]="!!erroBip" (click)="focarBip()">
            <span class="pulse"></span>
            <input #bipInput [(ngModel)]="entradaBip" (keydown)="onBipKeydown($event)" (focus)="bipFocado = true" (blur)="bipFocado = false"
                   autocomplete="off" spellcheck="false" aria-label="Leitura do código da OS"
                   [placeholder]="bipFocado ? 'Aponte o leitor para o código acima…' : 'Clique aqui para ativar o leitor'" />
          </div>
          <p class="bip-err" *ngIf="erroBip" role="alert"><i class="pi pi-times-circle"></i> {{ erroBip }}</p>
        </ng-container>

        <ng-template #avisoTerminal>
          <div class="cfg-alert" role="alert">
            <span class="cfg-alert-ic"><i class="pi pi-exclamation-triangle"></i></span>
            <div>
              <strong>Este terminal ainda não tem uma etapa definida</strong>
              <span>Para registrar a OS pela tela, o terminal precisa saber em qual etapa do fluxo ele está instalado.
                A configuração é feita uma única vez e fica salva neste computador.</span>
            </div>
          </div>

          <p class="cfg-how">Como configurar</p>
          <ol class="cfg-steps">
            <li>
              <span class="n">1</span>
              <div class="cfg-step-body">
                <p>Clique no <b>cartão da estação</b>, no canto superior direito da tela.</p>
                <div class="cfg-mock-chip" aria-hidden="true">
                  <span class="it"><span class="k">Estação</span><span class="v"><i class="pi pi-desktop"></i> {{ config.nome || 'Sem nome' }}</span></span>
                  <span class="sep"></span>
                  <span class="it hl"><span class="k">Etapa</span><span class="v">Qualquer etapa</span></span>
                  <span class="lk"><i class="pi pi-lock"></i><i class="pi pi-cog"></i></span>
                </div>
              </div>
            </li>
            <li>
              <span class="n">2</span>
              <div class="cfg-step-body">
                <p>Toque no cartão da <b>estação desta máquina</b>; as etapas que ela atende aparecem no próprio cartão.</p>
                <div class="cfg-mock-etapas" aria-hidden="true">
                  <span class="cfg-etapa on" *ngFor="let e of etapasExemplo" [style.--stage]="e.cor || null">
                    <span class="ck"><i class="pi pi-check"></i></span><span class="ord">{{ e.ordem }}</span><span class="nm">{{ e.nome }}</span>
                  </span>
                </div>
              </div>
            </li>
            <li>
              <span class="n">3</span>
              <div class="cfg-step-body">
                <p>Clique em <b>Confirmar estação</b>. Esta tela volta com a OS pronta para bipar.</p>
                <span class="cfg-mock-btn" aria-hidden="true"><i class="pi pi-check"></i> Confirmar estação</span>
              </div>
            </li>
          </ol>
          <p class="cfg-foot"><i class="pi pi-info-circle"></i> A partir daí, as OS registradas nesta máquina entram nas etapas da estação.
            Depois de definida, a estação só pode ser trocada por Administrador ou Diretor (Gerenciar Estações).</p>
        </ng-template>
      </ng-container>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" (click)="mostrarOsBip = false"></button>
        <button *ngIf="!terminalSemEtapa; else botaoConfigurar" pButton type="button" label="Registrar sem bipar" icon="pi pi-keyboard"
                class="p-button-outlined" [disabled]="!previewBip || enviando" (click)="confirmarOsBip('MANUAL')"
                pTooltip="Use se o leitor não conseguir ler o código da tela" tooltipPosition="top"></button>
        <ng-template #botaoConfigurar>
          <button pButton type="button" label="Configurar este terminal" icon="pi pi-cog" (click)="configurarTerminalPeloBip()"></button>
        </ng-template>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host { display: block; background: #f1f5f9; }
    .st-shell { min-height: calc(100vh - 90px); padding: 18px 24px 28px; background: #f1f5f9; color: #1f2937; }
    .st-shell.is-fullscreen { min-height: 100vh; }

    .st-top {
      display: flex; justify-content: space-between; gap: 18px; align-items: center; flex-wrap: wrap; margin-bottom: 18px;
      padding: 14px 18px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04);
    }
    .st-brand { display: flex; align-items: center; gap: 14px; }
    .st-back { color: #475569; font-size: 1.05rem; padding: 8px; border-radius: 10px; }
    .st-back:hover { background: #f1f5f9; color: #0f172a; }
    .st-logo {
      width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; font-size: 1.35rem;
      background: linear-gradient(145deg, #3b82f6, #1d4ed8); color: #ffffff; box-shadow: 0 8px 20px rgba(37,99,235,0.25);
    }
    .st-eyebrow { margin: 0; text-transform: uppercase; letter-spacing: 0.14em; font-size: 11px; color: #64748b; font-weight: 700; }
    .st-brand h1 { margin: 2px 0 0; font-family: Manrope, sans-serif; font-weight: 800; letter-spacing: -0.03em; font-size: 1.7rem; color: #0f172a; }

    .st-config { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .st-status {
      display: flex; align-items: center; gap: 14px; font: inherit; color: inherit; cursor: pointer; text-align: left;
      background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 8px 12px 8px 14px;
      transition: border-color .15s ease, background .15s ease;
    }
    .st-status:hover { border-color: #94a3b8; background: #ffffff; }
    .st-status:focus-visible { outline: 3px solid rgba(37,99,235,0.35); outline-offset: 2px; }
    .st-status-item { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .st-status-item .k { font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 700; }
    .st-status-item .v { display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem; font-weight: 700; color: #0f172a; white-space: nowrap; }
    .st-status-item .v i { color: #2563eb; font-size: 0.85rem; }
    .st-status-item .v.warn { color: #b45309; }
    .st-status-item .v.warn i { color: #d97706; }
    .st-status-item .sw { width: 10px; height: 10px; border-radius: 3px; background: var(--stage, #64748b); }
    .st-status-sep { width: 1px; align-self: stretch; background: #e2e8f0; }
    .st-status-lock { display: inline-flex; gap: 6px; color: #64748b; font-size: 0.8rem; padding-left: 4px; }
    .st-status:hover .st-status-lock { color: #334155; }
    .st-status.is-attention { border-color: #f59e0b; background: #fffbeb; animation: st-attention 1.8s ease-in-out infinite; }
    .st-status.is-attention .st-status-lock { color: #b45309; }
    @keyframes st-attention { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); } 50% { box-shadow: 0 0 0 6px rgba(245,158,11,0); } }
    .st-locked {
      display: flex; align-items: center; gap: 8px; width: 100%; min-height: 42px; padding: 8px 12px; border-radius: 8px;
      font: inherit; font-weight: 600; font-size: 0.9rem; color: #1e293b; text-align: left; cursor: default;
      background: #f8fafc; border: 1px dashed #94a3b8;
    }
    .st-locked .sw { flex: none; width: 10px; height: 10px; border-radius: 3px; background: var(--stage, #64748b); }
    .st-locked .txt { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .st-locked > i { color: #64748b; font-size: 0.85rem; }
    .st-locked.warn { cursor: pointer; color: #92400e; border-color: #f59e0b; background: #fffbeb; }
    .st-locked.warn > i { color: #d97706; }
    .st-locked.warn:hover { background: #fef3c7; }

    .st-field { display: flex; flex-direction: column; gap: 6px; min-width: 160px; }
    .st-field label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; font-weight: 700; }
    .st-seg { display: inline-flex; flex-wrap: wrap; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; padding: 3px; }
    .st-seg button {
      font: inherit; font-size: 0.84rem; font-weight: 600; color: #334155; background: transparent; border: 0;
      padding: 8px 12px; border-radius: 8px; cursor: pointer; display: inline-flex; gap: 6px; align-items: center;
    }
    .st-seg button:hover { background: #ffffff; }
    .st-seg button.on { background: #2563eb; color: #ffffff; }

    /* Campos (inputs e p-dropdown) usados na estação, no modal e na contingência. */
    :host ::ng-deep .p-inputtext,
    ::ng-deep .p-dialog.st-dlg .p-inputtext { background: #ffffff; border-color: #cbd5e1; color: #0f172a; }
    :host ::ng-deep .p-inputtext::placeholder { color: #64748b; }
    :host ::ng-deep .p-inputtext:enabled:hover { border-color: #94a3b8; }
    :host ::ng-deep .p-inputtext:enabled:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); }
    :host ::ng-deep .p-dropdown { background: #ffffff; border-color: #cbd5e1; }
    :host ::ng-deep .p-dropdown:not(.p-disabled).p-focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); }
    :host ::ng-deep .p-dropdown .p-dropdown-label { color: #0f172a; }
    :host ::ng-deep .p-dropdown .p-dropdown-label.p-placeholder { color: #64748b; }
    :host ::ng-deep .p-dropdown .p-dropdown-trigger { color: #475569; }
    /* Os diálogos vão para o <body> (appendTo), então os campos deles precisam de regras sem :host. */
    ::ng-deep .p-dialog.st-dlg .p-inputtext::placeholder { color: #64748b; }
    ::ng-deep .p-dialog.st-dlg .p-inputtext:enabled:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); }
    ::ng-deep .p-dialog.st-dlg .p-dropdown { background: #ffffff; border-color: #cbd5e1; }
    ::ng-deep .p-dialog.st-dlg .p-dropdown:not(.p-disabled).p-focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); }
    ::ng-deep .p-dialog.st-dlg .p-dropdown .p-dropdown-label { color: #0f172a; }
    ::ng-deep .p-dialog.st-dlg .p-dropdown .p-dropdown-label.p-placeholder { color: #64748b; }
    ::ng-deep .p-dialog.st-dlg .p-dropdown .p-dropdown-trigger { color: #475569; }

    /* Painel do dropdown vai para o <body> (appendTo), por isso sem :host. */
    ::ng-deep .st-dd-panel.p-dropdown-panel { background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 18px 40px rgba(15,23,42,0.14); color: #1e293b; }
    ::ng-deep .st-dd-panel .p-dropdown-items { padding: 6px; }
    ::ng-deep .st-dd-panel .p-dropdown-items .p-dropdown-item { color: #1e293b; background: transparent; border-radius: 8px; padding: 10px 12px; margin: 1px 0; }
    ::ng-deep .st-dd-panel .p-dropdown-items .p-dropdown-item:not(.p-highlight):not(.p-disabled):hover,
    ::ng-deep .st-dd-panel .p-dropdown-items .p-dropdown-item:not(.p-highlight):not(.p-disabled).p-focus { background: #f1f5f9; color: #0f172a; }
    ::ng-deep .st-dd-panel .p-dropdown-items .p-dropdown-item.p-highlight { background: #eff6ff; color: #1d4ed8; font-weight: 600; }
    ::ng-deep .st-dd-panel .p-dropdown-items .p-dropdown-item.p-highlight.p-focus { background: #dbeafe; }
    ::ng-deep .st-dd-panel .p-dropdown-empty-message { color: #475569; }
    .st-icons { display: flex; gap: 6px; }
    .st-icon {
      width: 40px; height: 40px; border-radius: 10px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155;
      cursor: pointer; display: grid; place-items: center; text-decoration: none;
    }
    .st-icon:hover { border-color: #94a3b8; background: #f8fafc; color: #0f172a; }

    .st-main { display: flex; flex-direction: column; gap: 18px; }

    /* ---------- topo: leitor + última bipagem ---------- */
    .st-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(340px, 420px); gap: 18px; align-items: stretch; }
    @media (max-width: 1100px) { .st-hero { grid-template-columns: 1fr; } }

    .st-reader {
      --rd: #64748b; --rd-soft: #f8fafc; --rd-text: #1e293b; --rd-line: #e2e8f0;
      display: flex; flex-direction: column; border-radius: 18px; overflow: hidden; cursor: text;
      background: #ffffff; border: 2px solid var(--rd); box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 10px 28px rgba(15,23,42,0.06);
      transition: border-color .2s ease, box-shadow .2s ease;
    }
    .st-reader.has-focus { --rd: #059669; --rd-soft: #ecfdf5; --rd-text: #065f46; --rd-line: #a7f3d0; box-shadow: 0 0 0 4px rgba(5,150,105,0.12), 0 10px 28px rgba(15,23,42,0.06); }
    .st-reader.is-idle { --rd: #d97706; --rd-soft: #fffbeb; --rd-text: #92400e; --rd-line: #fde68a; }
    .st-reader.is-busy { --rd: #2563eb; --rd-soft: #eff6ff; --rd-text: #1e40af; --rd-line: #bfdbfe; }
    .st-reader.flash-ok { animation: st-flash-ok .9s ease-out; }
    .st-reader.flash-err { animation: st-flash-err .9s ease-out; }
    @keyframes st-flash-ok { 0% { background: #bbf7d0; } 100% { background: #ffffff; } }
    @keyframes st-flash-err { 0% { background: #fecaca; border-color: #dc2626; } 100% { background: #ffffff; } }

    .st-reader-bar {
      display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 14px 20px;
      background: var(--rd-soft); border-bottom: 1px solid var(--rd-line);
    }
    .st-led {
      flex: none; width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center;
      background: var(--rd); color: #fff; font-size: 1.05rem; box-shadow: 0 6px 14px color-mix(in srgb, var(--rd) 30%, transparent);
    }
    .has-focus .st-led { animation: st-led 2s ease-in-out infinite; }
    @keyframes st-led { 0%, 100% { box-shadow: 0 0 0 0 rgba(5,150,105,0.45); } 50% { box-shadow: 0 0 0 8px rgba(5,150,105,0); } }
    @media (prefers-reduced-motion: reduce) { .has-focus .st-led { animation: none; } }
    .st-reader-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 220px; }
    .st-reader-txt strong { font-family: Manrope, sans-serif; font-size: 1.15rem; font-weight: 800; letter-spacing: 0.01em; text-transform: uppercase; color: var(--rd-text); }
    .st-reader-txt span { font-size: 0.86rem; color: #334155; }
    .st-reader-mode {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; max-width: 100%;
      background: #ffffff; border: 1px solid #cbd5e1; color: #1e293b; font-size: 0.8rem; font-weight: 600;
    }
    .st-reader-mode .sw { width: 10px; height: 10px; border-radius: 3px; background: var(--stage, #64748b); flex: none; }
    .st-reader-mode i { color: #2563eb; font-size: 0.8rem; }

    .st-input-row { display: flex; align-items: center; gap: 16px; padding: 22px 22px 18px; }
    .st-input-row > i { font-size: 2.1rem; color: var(--rd); }
    .st-input {
      flex: 1; min-width: 0; height: 64px; padding: 0 18px; border-radius: 12px; outline: none;
      background: #f8fafc; border: 1px solid #cbd5e1; color: #0f172a;
      font-family: 'IBM Plex Mono', Consolas, monospace; font-size: clamp(1.4rem, 2.4vw, 2rem); font-weight: 600;
      letter-spacing: 0.06em; text-transform: uppercase; transition: border-color .15s ease, background .15s ease;
    }
    .has-focus .st-input { border-color: #059669; background: #ffffff; }
    .st-input::placeholder { color: #64748b; text-transform: none; letter-spacing: 0; font-family: 'IBM Plex Sans', sans-serif; font-size: 1.05rem; font-weight: 400; }

    .st-reader-foot {
      margin-top: auto; display: flex; justify-content: space-between; align-items: center; gap: 10px 18px; flex-wrap: wrap;
      padding: 12px 20px 14px; border-top: 1px solid #e2e8f0; background: #f8fafc;
    }
    .st-flow { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 0.84rem; }
    .st-flow > i { font-size: 0.75rem; }
    .st-flow-step { display: inline-flex; align-items: center; gap: 8px; color: #475569; font-weight: 600; }
    .st-flow-step .n {
      width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 0.74rem; font-weight: 800;
      background: #e2e8f0; color: #334155;
    }
    .st-flow-step.active { color: #0f172a; }
    .st-flow-step.active .n { background: #2563eb; color: #fff; }
    .st-flow-step.done .n { background: #059669; color: #fff; }
    .st-hotkeys { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.8rem; color: #475569; }
    .st-hotkeys kbd {
      font: 600 0.72rem/1 'IBM Plex Mono', Consolas, monospace; color: #0f172a; background: #ffffff;
      border: 1px solid #cbd5e1; border-bottom-width: 2px; border-radius: 5px; padding: 3px 6px; margin-right: 4px;
    }

    .st-last {
      display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 18px;
      background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 10px 28px rgba(15,23,42,0.06); min-width: 0;
    }
    .st-last-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .st-last-head h3 { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #334155; }
    .st-last-head h3 i { color: #2563eb; }
    .st-counts { display: flex; gap: 6px; }
    .st-counts .c { display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; font-variant-numeric: tabular-nums; }
    .st-counts .c i { font-size: 0.7rem; }
    .st-counts .ok { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .st-counts .err { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

    .st-last-card {
      --lc: #2563eb; --lc-bg: #eff6ff; --lc-line: #bfdbfe;
      display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; border-radius: 14px;
      background: var(--lc-bg); border: 1px solid var(--lc-line); border-left: 6px solid var(--lc);
      animation: st-last-in .45s cubic-bezier(.2,.8,.2,1);
    }
    .st-last-card.ok { --lc: #059669; --lc-bg: #ecfdf5; --lc-line: #a7f3d0; }
    .st-last-card.err { --lc: #dc2626; --lc-bg: #fef2f2; --lc-line: #fecaca; }
    @keyframes st-last-in { 0% { opacity: 0; transform: translateY(6px); box-shadow: 0 0 0 6px color-mix(in srgb, var(--lc) 25%, transparent); } 100% { opacity: 1; transform: none; box-shadow: 0 0 0 0 transparent; } }
    .lc-status { display: flex; align-items: center; gap: 12px; }
    .lc-ico { flex: none; width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; background: var(--lc, #64748b); color: #fff; font-size: 1rem; }
    .lc-status strong { display: block; font-size: 1.02rem; font-weight: 800; color: #0f172a; }
    .lc-status span { font-size: 0.8rem; color: #475569; font-variant-numeric: tabular-nums; }
    .lc-os { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
    .lc-os a, .lc-os > span:first-child {
      font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 1.45rem; font-weight: 800; color: #0f172a; text-decoration: none; letter-spacing: 0.01em;
    }
    .lc-os a:hover { text-decoration: underline; color: #1d4ed8; }
    .lc-cli { font-size: 0.92rem; font-weight: 600; color: #1e293b; }
    .lc-title:empty { display: none; }
    .lc-title { font-size: 0.92rem; font-weight: 700; color: #0f172a; }
    .lc-msg { margin: 0; font-size: 0.88rem; line-height: 1.45; color: #334155; }
    .lc-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 0.8rem; color: #475569; }
    .lc-meta i { font-size: 0.72rem; opacity: 0.8; margin-right: 3px; }
    .lc-force { align-self: flex-start; }
    .st-last-empty {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 8px;
      padding: 22px 14px; border: 1px dashed #cbd5e1; border-radius: 14px; color: #475569; font-size: 0.84rem; line-height: 1.45; background: #f8fafc;
    }
    .st-last-empty .lc-ico { background: #eff6ff; color: #2563eb; }
    .st-last-empty strong { color: #0f172a; font-size: 0.95rem; }

    .st-prev { display: flex; flex-direction: column; gap: 6px; }
    .st-prev-head { display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
    .st-prev-head button { background: none; border: 0; color: #1d4ed8; font: inherit; font-size: 0.76rem; font-weight: 600; letter-spacing: 0; text-transform: none; cursor: pointer; padding: 2px 4px; }
    .st-prev-head button:hover { text-decoration: underline; }
    .st-prev-list { display: flex; flex-direction: column; gap: 4px; }
    .st-prev-list.is-open { max-height: 260px; overflow-y: auto; padding-right: 2px; }
    .st-prev-item {
      display: grid; grid-template-columns: 22px auto minmax(0, 1fr) auto; align-items: center; gap: 10px;
      padding: 7px 10px; border-radius: 9px; background: #f8fafc; border: 1px solid #eef2f6; border-left: 3px solid var(--stage, #059669); font-size: 0.82rem;
    }
    .st-prev-item.err { border-left-color: #dc2626; }
    .st-prev-item .pi-ico { width: 22px; height: 22px; border-radius: 6px; display: grid; place-items: center; font-size: 0.66rem; background: #d1fae5; color: #047857; }
    .st-prev-item.err .pi-ico { background: #fee2e2; color: #b91c1c; }
    .st-prev-item .pi-os { font-family: 'IBM Plex Mono', Consolas, monospace; font-weight: 700; color: #0f172a; }
    .st-prev-item .pi-os a { color: #1d4ed8; text-decoration: none; }
    .st-prev-item .pi-os a:hover { text-decoration: underline; }
    .st-prev-item .pi-txt { color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .st-prev-item .pi-hora { color: #475569; font-variant-numeric: tabular-nums; font-size: 0.78rem; }
    .pulse { width: 9px; height: 9px; border-radius: 50%; background: #94a3b8; }
    .has-focus .pulse { background: #10b981; animation: pulse 1.6s infinite; }
    .is-idle .pulse { background: #f59e0b; }
    .is-busy .pulse { background: #3b82f6; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); } 70% { box-shadow: 0 0 0 10px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }

    .st-pending { margin-top: 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
    .st-pending-card {
      background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 16px; animation: rise .25s ease;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05);
    }
    .st-pending-card--etapa { border-left: 4px solid var(--stage); }
    .pc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .pc-x { background: transparent; border: 0; color: #64748b; cursor: pointer; padding: 4px; border-radius: 8px; }
    .pc-x:hover { color: #0f172a; background: #f1f5f9; }
    .pc-os { font-family: Manrope, sans-serif; font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .pc-meta { display: flex; gap: 12px; flex-wrap: wrap; color: #475569; font-size: 0.84rem; margin: 4px 0 10px; }
    .pc-state { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font-size: 0.84rem; }
    .pc-state .fx-muted { color: #475569; }
    .pc-progress { display: flex; gap: 4px; margin-top: 12px; }
    .pc-progress .seg { flex: 1; height: 6px; border-radius: 4px; background: #e2e8f0; }
    .pc-etapa { display: flex; align-items: center; gap: 10px; font-family: Manrope, sans-serif; font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
    .st-pending-card .fx-muted { color: #475569; }
    .st-timeout { grid-column: 1 / -1; height: 3px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .st-timeout span { display: block; height: 100%; background: #2563eb; transition: width 1s linear; }

    @keyframes rise { from { opacity: 0; transform: translateY(8px) scale(.99); } to { opacity: 1; transform: none; } }

    /* ---------- fila da estação ---------- */
    .st-fila {
      border: 1px solid #e2e8f0; border-radius: 18px; background: #ffffff; padding: 18px 18px 14px;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 10px 28px rgba(15,23,42,0.05);
    }
    .sf-head { display: flex; gap: 14px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
    .sf-title { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .sf-count {
      flex: none; min-width: 56px; height: 56px; padding: 0 12px; border-radius: 14px; display: grid; place-items: center;
      background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8;
      font-family: Manrope, sans-serif; font-size: 1.7rem; font-weight: 800; font-variant-numeric: tabular-nums;
    }
    .sf-title h3 { margin: 0; font-family: Manrope, sans-serif; font-size: 1.2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }
    .sf-title p { margin: 3px 0 0; color: #475569; font-size: 0.86rem; }
    .sf-tools { display: flex; gap: 8px; align-items: center; }
    .sf-view { display: inline-flex; padding: 3px; border-radius: 11px; background: #f1f5f9; border: 1px solid #e2e8f0; }
    .sf-view button {
      display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border: 0; border-radius: 8px; cursor: pointer;
      background: transparent; color: #475569; font: inherit; font-size: 0.84rem; font-weight: 600;
    }
    .sf-view button:hover { color: #0f172a; background: #ffffff; }
    .sf-view button.on { background: #2563eb; color: #fff; }

    .sf-bar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 16px 0 14px; }
    .sf-search {
      flex: 1 1 360px; display: flex; align-items: center; gap: 10px; height: 46px; padding: 0 14px;
      border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff; color: #64748b;
      transition: border-color .15s ease, box-shadow .15s ease;
    }
    .sf-search:focus-within { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
    .sf-search > i { font-size: 1rem; }
    .sf-search input { flex: 1; min-width: 0; background: transparent; border: 0; outline: 0; color: #0f172a; font-size: 0.95rem; }
    .sf-search input::placeholder { color: #64748b; }
    .sf-search button { background: none; border: 0; color: #64748b; cursor: pointer; padding: 4px; border-radius: 6px; }
    .sf-search button:hover { color: #0f172a; background: #f1f5f9; }
    .sf-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .sf-chips button {
      display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px; border-radius: 999px; cursor: pointer;
      border: 1px solid #cbd5e1; background: #ffffff; color: #334155; font: inherit; font-weight: 600; font-size: 0.86rem;
      transition: background .15s ease, border-color .15s ease, color .15s ease;
    }
    .sf-chips button:hover { border-color: #94a3b8; color: #0f172a; background: #f8fafc; }
    .sf-chips button.on { background: #0f172a; border-color: #0f172a; color: #ffffff; }
    .sf-chips button.is-in.on { background: #2563eb; border-color: #2563eb; color: #fff; }
    .sf-chips button.is-out.on { background: #b45309; border-color: #b45309; color: #fff; }
    .sf-chips .ct {
      min-width: 24px; padding: 1px 8px; border-radius: 999px; background: #f1f5f9; color: inherit;
      font-size: 0.78rem; font-weight: 700; text-align: center; font-variant-numeric: tabular-nums;
    }
    .sf-chips button.on .ct { background: rgba(255,255,255,.22); }

    .sf-badge {
      display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; white-space: nowrap;
      font-size: 0.74rem; font-weight: 700; letter-spacing: .02em; text-transform: uppercase;
      color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe;
    }
    .sf-badge.is-out { color: #92400e; background: #fffbeb; border-color: #fcd34d; }

    .sf-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;
      max-height: min(62vh, 640px); overflow-y: auto; padding: 2px 4px 4px 2px;
    }
    .sf-card {
      --stage: #64748b;
      position: relative; display: flex; flex-direction: column; gap: 9px; text-align: left; cursor: pointer;
      padding: 14px 16px 12px 20px; border-radius: 14px; border: 1px solid #e2e8f0; background: #ffffff; color: #334155;
      font: inherit; overflow: hidden; box-shadow: 0 1px 2px rgba(15,23,42,0.04);
      transition: border-color .15s ease, transform .15s ease, background .15s ease, box-shadow .15s ease;
    }
    .sf-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: var(--stage); }
    .sf-card:hover, .sf-card:focus-visible {
      border-color: #2563eb; background: #fbfdff; transform: translateY(-2px); outline: none;
      box-shadow: 0 10px 24px rgba(37,99,235,0.12);
    }
    .sf-card.out:hover, .sf-card.out:focus-visible { border-color: #d97706; box-shadow: 0 10px 24px rgba(217,119,6,0.12); }
    .sf-card-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .sf-code { font-family: 'IBM Plex Mono', Consolas, monospace; font-weight: 800; font-size: clamp(1.02rem, 1.3vw, 1.22rem); color: #0f172a; letter-spacing: 0.01em; white-space: nowrap; }
    .sf-cli {
      color: #1e293b; font-weight: 600; font-size: 0.96rem; line-height: 1.3;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .sf-ids { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 0.82rem; color: #475569; }
    .sf-ids > span { display: inline-flex; align-items: baseline; gap: 5px; }
    .sf-ids em { font-style: normal; color: #64748b; }
    .sf-ids b { font-family: 'IBM Plex Mono', Consolas, monospace; color: #0f172a; font-weight: 600; }
    .sf-stage { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 7px 10px; border-radius: 9px; background: #f1f5f9; font-size: 0.84rem; }
    .sf-stage .sw { width: 10px; height: 10px; border-radius: 3px; background: var(--stage); flex: none; }
    .sf-stage .lbl { color: #475569; font-size: 0.76rem; text-transform: uppercase; letter-spacing: .05em; font-weight: 700; flex: none; }
    .sf-stage .nm { color: #0f172a; font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sf-foot { display: flex; justify-content: space-between; align-items: center; gap: 6px 10px; flex-wrap: wrap; margin-top: 2px; }
    .sf-time { display: inline-flex; align-items: center; gap: 5px; color: #475569; font-size: 0.8rem; white-space: nowrap; }
    .sf-time i { font-size: 0.74rem; }
    .sf-go {
      display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 9px; white-space: nowrap;
      background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 0.8rem; font-weight: 700;
      transition: background .15s ease, color .15s ease;
    }
    .sf-card:hover .sf-go, .sf-card:focus-visible .sf-go, .sf-table tbody tr:hover .sf-go, .sf-table tbody tr:focus-visible .sf-go { background: #2563eb; color: #fff; border-color: #2563eb; }

    .sf-table-wrap { max-height: min(62vh, 640px); overflow: auto; border: 1px solid #e2e8f0; border-radius: 12px; }
    .sf-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.88rem; }
    .sf-table thead th {
      position: sticky; top: 0; z-index: 1; text-align: left; padding: 11px 14px; white-space: nowrap;
      background: #f8fafc; color: #475569; font-size: 0.74rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
    }
    .sf-table tbody tr { cursor: pointer; transition: background .12s ease; background: #ffffff; }
    .sf-table tbody tr:nth-child(even) { background: #fafbfc; }
    .sf-table tbody tr:hover, .sf-table tbody tr:focus-visible { background: #eff6ff; outline: none; }
    .sf-table td { padding: 10px 14px; border-bottom: 1px solid #eef2f6; color: #1e293b; vertical-align: middle; }
    .sf-table td:first-child { box-shadow: inset 4px 0 0 var(--stage, #64748b); }
    .sf-table .t-code { font-family: 'IBM Plex Mono', Consolas, monospace; font-weight: 800; color: #0f172a; white-space: nowrap; font-size: 0.95rem; }
    .sf-table .t-cli { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; color: #0f172a; }
    .sf-table .t-mono { font-family: 'IBM Plex Mono', Consolas, monospace; color: #334155; white-space: nowrap; }
    .sf-table .t-stage { white-space: nowrap; }
    .sf-table .t-stage .sw { display: inline-block; width: 9px; height: 9px; border-radius: 3px; background: var(--stage, #64748b); margin-right: 7px; vertical-align: middle; }
    .sf-table .t-time { color: #475569; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .sf-table .t-act { text-align: right; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

    .sf-note { margin: 12px 0 0; color: #475569; font-size: 0.82rem; display: flex; gap: 6px; align-items: center; }
    .sf-note b { color: #0f172a; }
    .sf-empty {
      display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 34px 12px; text-align: center;
      border: 1px dashed #cbd5e1; border-radius: 14px; color: #475569; font-size: 0.86rem; background: #f8fafc;
    }
    .sf-empty i { font-size: 1.7rem; color: #2563eb; margin-bottom: 4px; }
    .sf-empty strong { color: #0f172a; font-size: 0.98rem; }
    .st-manual { margin-top: 22px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; }
    .st-manual summary {
      cursor: pointer; color: #334155; font-weight: 600; font-size: 0.84rem; list-style: none;
      display: flex; gap: 8px; align-items: center; padding: 10px 14px;
    }
    .st-manual summary:hover { color: #0f172a; }
    .st-manual summary::-webkit-details-marker { display: none; }
    .st-manual-hint { font-weight: 400; color: #64748b; font-size: 0.78rem; }
    .st-manual-chev { margin-left: auto; font-size: 0.75rem; transition: transform .2s ease; }
    .st-manual[open] .st-manual-chev { transform: rotate(180deg); }
    .st-manual[open] summary { border-bottom: 1px solid #e2e8f0; }
    .st-manual-grid { display: grid; grid-template-columns: 1fr 1.3fr auto; gap: 12px; align-items: end; padding: 12px 14px 14px; }
    @media (max-width: 760px) { .st-manual-grid { grid-template-columns: 1fr; } }
    .st-manual-btns { display: flex; gap: 8px; }

    .st-os-field { position: relative; }
    .st-combo { position: relative; display: flex; align-items: center; }
    .st-combo > i { position: absolute; left: 12px; color: #64748b; font-size: 0.9rem; pointer-events: none; }
    .st-combo.has-sel > i { color: #059669; }
    .st-combo input { width: 100%; padding-left: 36px; padding-right: 34px; font-family: 'IBM Plex Mono', Consolas, monospace; font-weight: 600; }
    .st-combo input::placeholder { font-family: 'IBM Plex Sans', sans-serif; font-weight: 400; }
    .st-combo.has-sel input { border-color: #059669; }
    .st-combo-x {
      position: absolute; right: 6px; width: 26px; height: 26px; border-radius: 7px; border: 0; background: transparent;
      color: #64748b; cursor: pointer; display: grid; place-items: center; font-size: 0.75rem;
    }
    .st-combo-x:hover { background: #f1f5f9; color: #0f172a; }

    .st-sug {
      position: absolute; top: calc(100% + 6px); left: 0; z-index: 30;
      width: max(100%, 620px); max-width: calc(100vw - 48px);
      background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;
      box-shadow: 0 24px 50px rgba(15,23,42,0.16); animation: rise .15s ease;
    }
    .st-sug-head {
      display: flex; justify-content: space-between; gap: 10px; align-items: center; padding: 8px 12px;
      font-size: 0.72rem; color: #475569; border-bottom: 1px solid #e2e8f0; background: #f8fafc;
    }
    .st-sug-head > span:first-child { font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
    .st-sug-keys { display: inline-flex; gap: 4px; align-items: center; }
    .st-sug-keys kbd {
      font: 600 0.66rem/1 'IBM Plex Mono', Consolas, monospace; color: #0f172a; background: #ffffff;
      border: 1px solid #cbd5e1; border-bottom-width: 2px; border-radius: 5px; padding: 2px 5px;
    }
    @media (max-width: 760px) { .st-sug-keys { display: none; } }
    .st-sug-list { list-style: none; margin: 0; padding: 6px; max-height: 360px; overflow: auto; }
    .st-sug-item {
      display: flex; justify-content: space-between; gap: 14px; padding: 10px 12px; border-radius: 9px; cursor: pointer;
      border-left: 3px solid var(--stage, #64748b); margin: 2px 0; color: #1e293b;
    }
    .st-sug-item.on { background: #eff6ff; }
    .si-main { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .si-code { display: flex; align-items: baseline; gap: 8px; font-family: 'IBM Plex Mono', Consolas, monospace; font-weight: 700; font-size: 0.98rem; color: #0f172a; }
    .si-found { font-family: 'IBM Plex Sans', sans-serif; font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #1d4ed8; background: #dbeafe; padding: 2px 6px; border-radius: 5px; }
    .si-client { font-size: 0.86rem; color: #1e293b; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .si-ids { display: flex; flex-wrap: wrap; gap: 2px 12px; font-size: 0.74rem; color: #475569; }
    .si-ids b { font-family: 'IBM Plex Mono', Consolas, monospace; font-weight: 600; color: #0f172a; }
    .st-sug mark, .st-sel mark { background: #fef08a; color: #713f12; border-radius: 3px; padding: 0 1px; }
    .si-side { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex: 0 0 auto; text-align: right; max-width: 45%; }
    .si-meta { display: inline-flex; flex-wrap: wrap; justify-content: flex-end; gap: 2px 10px; font-size: 0.72rem; color: #475569; }
    .si-meta i { font-size: 0.68rem; margin-right: 3px; }
    .si-state {
      display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 700; padding: 3px 9px;
      border-radius: 999px; white-space: nowrap; background: #f8fafc; color: #334155; border: 1px solid #cbd5e1;
    }
    .si-state .dot { width: 7px; height: 7px; border-radius: 50%; background: #94a3b8; }
    .si-state.is-live { color: #92400e; background: #fffbeb; border-color: #fcd34d; }
    .si-state.is-live .dot { background: var(--stage, #d97706); box-shadow: 0 0 0 3px rgba(217,119,6,0.18); }
    .si-state.is-wait { color: #075985; background: #f0f9ff; border-color: #bae6fd; }
    .si-state.is-wait .dot { background: #0284c7; }
    .si-state.is-done { color: #065f46; background: #ecfdf5; border-color: #a7f3d0; }
    .si-state.is-done .dot { background: #059669; }
    .st-sug-empty { display: flex; gap: 12px; align-items: flex-start; padding: 16px 14px; color: #475569; font-size: 0.8rem; }
    .st-sug-empty i { font-size: 1.2rem; color: #64748b; margin-top: 2px; }
    .st-sug-empty strong { display: block; color: #0f172a; font-size: 0.86rem; margin-bottom: 2px; }

    .st-sel {
      grid-column: 1 / -1; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 10px 12px; border-radius: 10px;
      background: #f8fafc; border: 1px solid #e2e8f0; border-left: 3px solid var(--stage, #059669); animation: rise .2s ease;
    }
    .st-sel > i { color: #2563eb; }
    .st-sel-body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .st-sel-body strong { font-family: 'IBM Plex Mono', Consolas, monospace; color: #0f172a; font-size: 0.92rem; }
    .st-sel-body span { color: #475569; font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .st-sel-hint { font-size: 0.78rem; color: #475569; }
    .st-sel-hint b { color: #0f172a; }
    .st-act.is-sugerida:not(:disabled) { box-shadow: 0 0 0 3px rgba(37,99,235,0.3); }
    .st-act {
      display: inline-flex; align-items: center; gap: 8px; font: inherit; font-weight: 700; font-size: 0.88rem;
      padding: 10px 14px; border-radius: 10px; cursor: pointer; border: 2px solid transparent;
    }
    .st-act i { font-size: 1.1rem; }
    .st-act:disabled { opacity: 0.45; cursor: not-allowed; }
    /* Entrada sólida e Saída contornada: distinguíveis sem depender da cor. */
    .st-act--in { background: #059669; color: #fff; border-color: #059669; }
    .st-act--in:not(:disabled):hover { background: #047857; border-color: #047857; }
    .st-act--out { background: #ffffff; color: #b91c1c; border-color: #dc2626; }
    .st-act--out:not(:disabled):hover { background: #fef2f2; }

    ::ng-deep .p-dialog.st-dlg { border: 1px solid #e2e8f0; box-shadow: 0 30px 70px rgba(15,23,42,0.22); }
    ::ng-deep .p-dialog.st-dlg .p-dialog-header,
    ::ng-deep .p-dialog.st-dlg .p-dialog-content,
    ::ng-deep .p-dialog.st-dlg .p-dialog-footer { background: #ffffff; color: #1e293b; }
    ::ng-deep .p-dialog.st-dlg .p-dialog-header { border-bottom: 1px solid #e2e8f0; }
    ::ng-deep .p-dialog.st-dlg .p-dialog-footer { border-top: 1px solid #e2e8f0; }
    ::ng-deep .p-dialog.st-dlg .p-dialog-title { color: #0f172a; font-family: Manrope, sans-serif; }
    ::ng-deep .p-dialog.st-dlg .p-dialog-header-icon { color: #475569; }
    ::ng-deep .p-dialog.st-dlg .p-dialog-header-icon:hover { background: #f1f5f9; color: #0f172a; }
    ::ng-deep .p-dialog.st-dlg .p-button-text { color: #334155; }
    .dlg-text { margin: 0 0 14px; color: #334155; line-height: 1.45; }
    .dlg-grid { display: flex; flex-direction: column; gap: 16px; }
    .dlg-help { color: #475569; font-size: 0.78rem; line-height: 1.4; }
    .dlg-lock { display: flex; gap: 6px; align-items: flex-start; color: #b45309; }
    .dlg-lock i { margin-top: 2px; }
    .dlg-area { width: 100%; }

    .bip-os { border: 1px solid #e2e8f0; border-left: 4px solid var(--stage, #64748b); border-radius: 12px; padding: 12px 14px; background: #f8fafc; }
    .bip-os-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .bip-k { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 700; }
    .bip-code { font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 1.5rem; font-weight: 800; color: #0f172a; }
    .bip-os-meta { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 6px; font-size: 0.82rem; color: #475569; }
    .bip-os-meta b { color: #0f172a; font-weight: 600; }
    .bip-barcode { margin: 14px 0; padding: 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; justify-content: center; }
    .bip-plan { display: flex; flex-direction: column; gap: 8px; }
    .bip-plan label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; font-weight: 700; }
    .bip-preview {
      display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px;
      background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857;
    }
    .bip-preview.out { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
    .bip-preview.warn { background: #fffbeb; border-color: #fde68a; color: #b45309; }
    .bip-preview > i { font-size: 1.5rem; }
    .bip-preview span { display: block; font-size: 0.74rem; color: #334155; }
    .bip-preview strong { font-size: 1rem; color: #0f172a; }
    .bip-preview .bip-fixa { margin-left: auto; font-size: 0.72rem; color: #475569; white-space: nowrap; }
    .bip-preview .bip-fixa--warn { color: #b45309; font-weight: 600; }
    ::ng-deep .st-dd-panel .p-dropdown-item.p-disabled { opacity: 0.45; cursor: not-allowed; }
    .bip-capture {
      margin-top: 14px; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; cursor: text;
      background: #fffbeb; border: 2px dashed #d97706;
    }
    .bip-capture.has-focus { border-style: solid; border-color: #059669; background: #ffffff; box-shadow: 0 0 0 4px rgba(5,150,105,0.14); }
    .bip-capture.err { border-color: #dc2626; background: #fef2f2; }
    .bip-capture .pulse { background: #f59e0b; }
    .bip-capture.has-focus .pulse { background: #10b981; animation: pulse 1.6s infinite; }
    .bip-capture input {
      flex: 1; min-width: 0; background: transparent; border: 0; outline: none; color: #0f172a;
      font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 1.05rem; font-weight: 600; text-transform: uppercase;
    }
    .bip-capture input::placeholder { color: #64748b; text-transform: none; font-family: 'IBM Plex Sans', sans-serif; font-weight: 400; }
    .bip-err { margin: 8px 0 0; color: #b91c1c; font-size: 0.84rem; display: flex; gap: 6px; align-items: center; }
    .bip-plan label { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .bip-role { display: inline-flex; align-items: center; gap: 5px; text-transform: none; letter-spacing: 0; font-size: 0.72rem; font-weight: 600; color: #1d4ed8; }
    .bip-locked {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px;
      background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid var(--stage, #64748b);
    }
    .bip-locked .sw { flex: none; width: 10px; height: 10px; border-radius: 3px; background: var(--stage, #64748b); }
    .bip-locked strong { color: #0f172a; font-size: 0.98rem; }
    .bip-locked-tag { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; color: #475569; white-space: nowrap; }

    .cfg-alert {
      margin-top: 14px; display: flex; gap: 12px; padding: 12px 14px; border-radius: 12px;
      background: #fffbeb; border: 1px solid #fde68a;
    }
    .cfg-alert-ic {
      flex: none; width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center;
      background: #fef3c7; color: #b45309; font-size: 1.1rem;
    }
    .cfg-alert strong { display: block; color: #92400e; font-size: 0.98rem; margin-bottom: 3px; }
    .cfg-alert div > span { display: block; color: #334155; font-size: 0.84rem; line-height: 1.45; }
    .cfg-how { margin: 16px 0 8px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; font-weight: 700; }
    .cfg-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .cfg-steps li { display: flex; gap: 12px; align-items: flex-start; padding: 10px 12px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .cfg-steps .n {
      flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
      background: #2563eb; color: #ffffff; font-weight: 800; font-size: 0.85rem;
    }
    .cfg-step-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
    .cfg-step-body p { margin: 3px 0 0; color: #334155; font-size: 0.86rem; line-height: 1.4; }
    .cfg-step-body b { color: #0f172a; }
    .cfg-mock-chip {
      align-self: flex-start; display: inline-flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 10px;
      background: #ffffff; border: 1px solid #cbd5e1; pointer-events: none; max-width: 100%;
    }
    .cfg-mock-chip .it { display: flex; flex-direction: column; gap: 1px; padding: 2px 6px; border-radius: 6px; min-width: 0; }
    .cfg-mock-chip .k { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 700; }
    .cfg-mock-chip .v { display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; font-weight: 600; color: #0f172a; white-space: nowrap; }
    .cfg-mock-chip .v i { color: #2563eb; font-size: 0.75rem; }
    .cfg-mock-chip .it.hl { outline: 2px solid #f59e0b; outline-offset: 1px; animation: cfg-ping 1.6s infinite; }
    .cfg-mock-chip .it.hl .v { color: #b45309; }
    .cfg-mock-chip .sep { width: 1px; align-self: stretch; background: #e2e8f0; }
    .cfg-mock-chip .lk { display: inline-flex; gap: 5px; color: #475569; font-size: 0.72rem; }
    @keyframes cfg-ping { 0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); } 70% { box-shadow: 0 0 0 8px rgba(245,158,11,0); } 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); } }
    .cfg-mock-etapas { display: flex; flex-wrap: wrap; gap: 8px; pointer-events: none; }
    .cfg-mock-etapas .cfg-etapa { width: auto; min-width: 170px; }

    .cfg-etapas-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .cfg-etapas-count { text-transform: none; letter-spacing: 0; font-weight: 600; color: #1d4ed8; font-size: 0.74rem; }
    .cfg-etapas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .cfg-etapa {
      display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; border-radius: 10px; cursor: pointer;
      font: inherit; text-align: left; color: #1e293b; background: #ffffff; border: 1px solid #cbd5e1;
      border-left: 4px solid var(--stage, #64748b); transition: background .15s ease, border-color .15s ease, box-shadow .15s ease;
    }
    .cfg-etapa:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; border-left-color: var(--stage, #64748b); }
    .cfg-etapa:focus-visible { outline: 3px solid rgba(37,99,235,0.35); outline-offset: 1px; }
    .cfg-etapa .ck {
      flex: none; width: 18px; height: 18px; border-radius: 5px; display: grid; place-items: center;
      border: 1.5px solid #94a3b8; color: transparent; font-size: 0.62rem; transition: all .15s ease; background: #fff;
    }
    .cfg-etapa .ord {
      flex: none; min-width: 22px; height: 22px; padding: 0 5px; border-radius: 6px; display: grid; place-items: center;
      background: #f1f5f9; color: #334155; font-size: 0.74rem; font-weight: 800; font-family: 'IBM Plex Mono', Consolas, monospace;
    }
    .cfg-etapa .nm { flex: 1; min-width: 0; font-size: 0.84rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cfg-etapa.on { background: #eff6ff; border-color: #93c5fd; border-left-color: var(--stage, #2563eb); color: #0f172a; }
    .cfg-etapa.on .ck { background: #2563eb; border-color: #2563eb; color: #ffffff; }
    .cfg-etapa.on .ord { background: #dbeafe; color: #1d4ed8; }
    .cfg-etapas.is-locked .cfg-etapa { cursor: not-allowed; }
    .cfg-etapas.is-locked .cfg-etapa:not(.on) { opacity: 0.5; }
    .cfg-link { color: #1d4ed8; cursor: pointer; margin-left: 4px; text-decoration: underline; white-space: nowrap; }
    .bip-role--muted { color: #475569; }
    .st-status-item .sws { display: inline-flex; gap: 2px; }
    @media (max-width: 560px) { .cfg-etapas { grid-template-columns: 1fr; } }

    .est-loading { color: #475569; font-size: 0.86rem; display: flex; gap: 8px; align-items: center; }
    .est-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
    .est-card {
      position: relative; display: flex; flex-direction: column; gap: 8px; padding: 12px 12px 12px 14px; border-radius: 12px;
      font: inherit; text-align: left; color: #1e293b; background: #ffffff; cursor: pointer;
      border: 1px solid #cbd5e1; border-left: 5px solid var(--stage, #64748b);
      transition: background .15s ease, border-color .15s ease, box-shadow .15s ease, transform .15s ease;
    }
    .est-card:hover:not(:disabled) { border-color: #94a3b8; border-left-color: var(--stage, #64748b); box-shadow: 0 4px 14px rgba(15,23,42,0.08); transform: translateY(-1px); }
    .est-card:focus-visible { outline: 3px solid rgba(37,99,235,0.35); outline-offset: 1px; }
    .est-card:disabled { cursor: not-allowed; opacity: 0.45; }
    .est-card.on { background: #eff6ff; border-color: #60a5fa; border-left-color: var(--stage, #2563eb); box-shadow: 0 0 0 2px rgba(37,99,235,0.25); }
    .est-card.uso:not(.on) { background: #fffbeb; }
    .est-head { display: flex; align-items: center; gap: 9px; }
    .est-head strong { flex: 1; min-width: 0; font-size: 1rem; font-weight: 800; color: #0f172a; }
    .est-ico {
      flex: none; width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center;
      background: color-mix(in srgb, var(--stage, #64748b) 14%, #ffffff); color: var(--stage, #475569); font-size: 0.9rem;
    }
    .est-ck {
      flex: none; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center;
      border: 1.5px solid #94a3b8; color: transparent; font-size: 0.62rem; background: #fff; transition: all .15s ease;
    }
    .est-card.on .est-ck { background: #2563eb; border-color: #2563eb; color: #fff; }
    .est-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .est-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
    .est-tag i { font-size: 0.6rem; }
    .est-tag.atual { background: #dbeafe; color: #1d4ed8; }
    .est-tag.uso { background: #fef3c7; color: #b45309; }
    .est-tag.livre { background: #dcfce7; color: #15803d; }
    .est-etapas { display: flex; flex-direction: column; gap: 3px; }
    .est-etapa { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #334155; }
    .est-etapa .sw { flex: none; width: 8px; height: 8px; border-radius: 2px; background: var(--stage, #64748b); }
    .est-aviso {
      display: flex; gap: 8px; align-items: flex-start; padding: 9px 12px; border-radius: 10px;
      background: #fffbeb; border: 1px solid #fcd34d; color: #92400e; font-size: 0.82rem;
    }
    .est-aviso i { margin-top: 2px; }
    .est-erro { color: #b91c1c; font-size: 0.8rem; display: flex; gap: 6px; align-items: center; }
    @media (max-width: 560px) { .est-grid { grid-template-columns: 1fr; } }
    .cfg-mock-btn {
      align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px;
      background: #2563eb; color: #fff; font-weight: 700; font-size: 0.8rem; pointer-events: none;
    }
    .cfg-foot { margin: 12px 0 0; display: flex; gap: 8px; color: #475569; font-size: 0.8rem; line-height: 1.4; }
    .cfg-foot i { margin-top: 2px; color: #2563eb; }
    ::ng-deep .p-dialog.st-dlg .p-button-outlined { color: #1d4ed8; border-color: #2563eb; }
    .st-bloq {
      display: flex; align-items: center; gap: 14px; padding: 14px 16px; margin-bottom: 14px; border-radius: 14px;
      background: #fef2f2; border: 1.5px solid #fca5a5; color: #7f1d1d;
    }
    .st-bloq-ico { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: #dc2626; color: #fff; flex: 0 0 auto; }
    .st-bloq-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; font-size: 0.95rem; line-height: 1.45; }
    .st-bloq-txt strong { font-size: 1rem; color: #991b1b; }
    .st-bloq-cod { font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 1.05rem; letter-spacing: 0.12em; color: #0b1220;
      background: #fff; border: 1px solid #fca5a5; border-radius: 6px; padding: 0 6px; }
    .par { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; padding: 4px 0 6px; }
    .par-txt { margin: 0; color: #1e293b; font-size: 0.98rem; line-height: 1.5; max-width: 440px; }
    .par-cod { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); width: min(100%, 480px); gap: 6px; min-height: 86px; align-items: center; }
    .par-cod span {
      width: 100%; height: clamp(48px, 12vw, 74px); display: grid; place-items: center; border-radius: 10px; background: #0f172a; color: #f8fafc;
      font-family: 'IBM Plex Mono', Consolas, monospace; font-size: clamp(1.1rem, 5vw, 2.3rem); font-weight: 600; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
    }
    .par-cod--load { display: flex; justify-content: center; color: #475569; font-size: 1.6rem; }
    .par-espera { display: flex; gap: 8px; align-items: center; color: #0f766e; font-weight: 600; font-size: 0.92rem; }
    .par-validade { color: #475569; font-size: 0.85rem; }
    .par-ok { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 18px 0; color: #1e293b; font-size: 1rem; }
    .par-ok strong { font-family: Manrope, sans-serif; font-size: 1.3rem; color: #047857; }
    .par-ok-ico { width: 58px; height: 58px; border-radius: 50%; display: grid; place-items: center; background: #047857; color: #fff; font-size: 1.6rem; }
  `]
})
export class OsFluxoEstacaoComponent implements OnInit, OnDestroy {
  private api = inject(OsFluxoService);
  readonly podeEscolherEtapa = inject(OsFluxoPermissaoService).has(OS_FLUXO_FUNCIONALIDADE.AJUSTE);
  readonly podeTrocarEstacao = this.podeEscolherEtapa || inject(OsFluxoPermissaoService).has(OS_FLUXO_FUNCIONALIDADE.ESTACOES);
  private reabrirBipAposConfig = false;

  @ViewChild('scanInput', { static: true }) scanInput!: ElementRef<HTMLInputElement>;
  @ViewChild('bipInput') bipInput?: ElementRef<HTMLInputElement>;

  etapas: FluxoEtapa[] = [];
  /** Etapas da combo de registro pela tela, já bloqueando as que a OS escolhida não pode registrar agora. */
  opcoesEtapaBip: { label: string; value: number; disabled: boolean }[] = [];

  config: ConfigEstacao = { nome: '', etapaIds: [], modo: 'AUTO', som: true };

  /** OS que esta estação deve atender agora (sem etiqueta física: o código é exibido na tela ao tocar). */
  filaOs: FluxoFilaItem[] = [];
  carregandoFila = false;
  erroFila = false;
  filtroFila = '';
  abaFila: AbaFila = 'TODAS';
  visaoFila: VisaoFila = 'GRADE';
  verTodoHistorico = false;
  private timerFilaOs?: ReturnType<typeof setInterval>;

  entrada = '';
  enviando = false;
  private filaLeituras: { valor: string; origem: 'SCANNER' | 'MANUAL' }[] = [];
  inputFocado = false;
  fullscreen = false;

  pendenteOs: FluxoEstadoOs | null = null;
  pendenteOsCodigo: string | null = null;
  pendenteEtapa: { etapa: FluxoEtapa; acao: 'ENTRADA' | 'SAIDA'; codigo: string } | null = null;
  pendenteDesde = 0;
  percentualTimeout = 100;

  feedback: Feedback | null = null;
  historico: LeituraHistorico[] = [];
  ultimaRequisicao: FluxoBiparRequest | null = null;

  mostrarForcar = false;
  motivoForcar = '';

  mostrarConfig = false;
  rascunho: ConfigEstacao = { nome: '', etapaIds: [], modo: 'AUTO', som: true };
  estacoes: FluxoEstacao[] = [];
  estacaoSel: string | null = null;
  carregandoEstacoes = false;
  salvandoEstacao = false;
  erroEstacao = '';
  private readonly terminalId = obterTerminalId();

  private pareamentoConfirmado = false;
  pareamento: FluxoPareamento | null = null;
  erroPareamento = '';
  pareadaNome = '';
  private pareamentoRecebidoEm = 0;
  private timerPareamento?: ReturnType<typeof setInterval>;
  private timerPareadaOk?: ReturnType<typeof setTimeout>;
  private verificandoPareamento = false;

  flash: 'ok' | 'err' | null = null;
  private timerFlash: any;

  manualAberto = false;
  manualOs = '';
  manualEtapaId: number | null = null;
  manualSel: FluxoSugestaoOs | null = null;
  sugestoesOs: FluxoSugestaoOs[] = [];
  sugestaoAtiva = -1;
  buscandoOs = false;
  erroBuscaOs = false;
  painelOsAberto = false;
  private manualOsFocado = false;
  mostrarOsBip = false;
  entradaBip = '';
  erroBip = '';
  bipFocado = false;
  private teclasBip: number[] = [];
  private limparManualAoConcluir = false;
  private buscaOs$ = new Subject<string>();
  private subBuscaOs?: Subscription;

  private teclas: number[] = [];
  private timerPendencia: any;
  private timerFoco: any;
  private timerFeedback: any;
  private audioCtx: AudioContext | null = null;
  private ultimaLeitura = { valor: '', em: 0 };

  get etapasTerminal(): FluxoEtapa[] {
    return this.etapas.filter(e => this.config.etapaIds.includes(e.id));
  }

  get etapaFixa(): FluxoEtapa | null {
    const lista = this.etapasTerminal;
    return lista.length === 1 ? lista[0] : null;
  }

  get multiEtapa(): boolean {
    return this.etapasTerminal.length > 1;
  }

  get etapaFixaCompleta(): boolean {
    return !!this.etapaFixa;
  }

  get resumoEtapasTerminal(): string {
    const lista = this.etapasTerminal;
    if (!lista.length) return 'Qualquer etapa';
    if (lista.length === 1) return `${lista[0].ordem}. ${lista[0].nome}`;
    return lista.map(e => e.ordem).join(', ').replace(/, (\d+)$/, ' e $1');
  }

  /**
   * Nunca se pula etapa: com a OS em uma etapa, só a saída dela; fora de etapa, só a entrada na próxima.
   * Quem tem a permissão Ajuste de Etapas ainda pode escolher uma entrada fora de sequência, que o servidor só aceita com justificativa.
   */
  atualizarOpcoesBip(): void {
    const s = this.manualSel;
    const base = this.podeEscolherEtapa ? this.etapas : this.etapasTerminal;
    const permitida = s ? this.etapaSugerida(s) : null;
    const emEtapa = s?.os.fluxoSituacao === 'EM_ETAPA';
    this.opcoesEtapaBip = base.map(e => {
      const label = `${e.ordem}. ${e.nome}`;
      if (!s) return { label, value: e.id, disabled: false };
      if (e.id === permitida?.id) return { label: `${label} · ${emEtapa ? 'saída' : 'entrada'}`, value: e.id, disabled: false };
      if (emEtapa) return { label: `${label} · registre antes a saída da etapa atual`, value: e.id, disabled: true };
      if (!this.podeEscolherEtapa) return { label: `${label} · fora de sequência`, value: e.id, disabled: true };
      return { label: `${label} · fora de sequência (exige justificativa)`, value: e.id, disabled: false };
    });
  }

  private etapaBloqueada(id: number): boolean {
    return !!this.opcoesEtapaBip.find(o => o.value === id)?.disabled;
  }

  /** Etapa do registro pela tela: com a permissão Ajuste de Etapas, qualquer uma; os demais, só entre as etapas do terminal. */
  get etapaManualId(): number | null {
    let id: number | null;
    if (this.podeEscolherEtapa) id = this.manualEtapaId;
    else if (this.etapaFixa) id = this.etapaFixa.id;
    else id = this.manualEtapaId != null && this.config.etapaIds.includes(this.manualEtapaId) ? this.manualEtapaId : null;
    return id != null && !this.etapaBloqueada(id) ? id : null;
  }

  /** Com a OS escolhida, só a ação coerente com a situação dela: saída da etapa aberta ou entrada na próxima. */
  acaoBloqueada(acao: 'ENTRADA' | 'SAIDA'): boolean {
    const sugerida = this.acaoSugerida;
    return !!this.manualSel && !!sugerida && acao !== sugerida;
  }

  get bloqueioBip(): { titulo: string; detalhe: string } {
    const s = this.manualSel;
    if (!s) return { titulo: 'Nenhuma etapa definida', detalhe: 'Selecione a etapa para registrar' };
    if (s.os.fluxoSituacao === 'CONCLUIDO') return { titulo: 'Esta OS já concluiu todas as etapas', detalhe: 'Não há etapa a registrar' };
    const permitida = this.etapaSugerida(s);
    if (!permitida) return { titulo: 'Nenhuma etapa disponível para esta OS', detalhe: 'Verifique o fluxo da OS' };
    const nome = `${permitida.ordem}. ${permitida.nome}`;
    const titulo = s.os.fluxoSituacao === 'EM_ETAPA'
      ? `A OS está em ${nome}: só é possível registrar a saída dessa etapa`
      : `A próxima etapa desta OS é ${nome}`;
    const noTerminal = this.podeEscolherEtapa || this.config.etapaIds.includes(permitida.id);
    if (!noTerminal) return { titulo, detalhe: 'Essa etapa não é atendida por este terminal' };
    const modo = this.modoParaEtapa(permitida);
    const acaoEsperada = s.os.fluxoSituacao === 'EM_ETAPA' ? 'SAIDA' : 'ENTRADA';
    if (modo !== 'AUTO' && modo !== acaoEsperada) {
      return { titulo, detalhe: `Este terminal está configurado para registrar só ${modo === 'ENTRADA' ? 'entradas' : 'saídas'}` };
    }
    return { titulo, detalhe: 'Selecione essa etapa para registrar' };
  }

  /** Terminal ainda sem etapa cadastrada: o registro pela tela exige configurá-lo antes, para qualquer perfil. */
  get terminalSemEtapa(): boolean {
    return !this.etapasTerminal.length;
  }

  /** Entre as etapas do terminal, a que se aplica à OS: a etapa aberta (saída) ou a próxima do fluxo (entrada). */
  private etapaDoTerminalPara(candidata: FluxoEtapa | null | undefined): FluxoEtapa | null {
    return candidata && this.config.etapaIds.includes(candidata.id) ? this.etapas.find(e => e.id === candidata.id) ?? null : null;
  }

  private etapaCandidataDoEstado(estado: FluxoEstadoOs): FluxoEtapa | null {
    if (estado.os.fluxoSituacao === 'CONCLUIDO') return null;
    if (estado.os.fluxoSituacao === 'EM_ETAPA') return estado.etapaAtual ?? null;
    return estado.proximaEtapa ?? null;
  }

  get etapasExemplo(): FluxoEtapa[] {
    return this.etapas.filter(e => e.ordem === 3 || e.ordem === 4);
  }

  get totalOk(): number {
    return this.historico.filter(h => h.ok && h.acao).length;
  }

  get totalErro(): number {
    return this.historico.filter(h => !h.ok).length;
  }

  /** Lista de um item para o cartão "Última bipagem": o trackBy recria o cartão a cada leitura e reinicia a animação. */
  get ultimaLista(): LeituraHistorico[] {
    return this.historico.length ? [this.historico[0]] : [];
  }

  get historicoAnterior(): LeituraHistorico[] {
    return this.historico.slice(1, this.verTodoHistorico ? this.historico.length : 4);
  }

  trackHist = (_: number, h: LeituraHistorico) => `${h.hora.getTime()}-${h.titulo}`;

  get etapaDefinida(): boolean {
    return this.etapaFixaCompleta || !!this.pendenteEtapa;
  }

  get placeholderScan(): string {
    if (this.pendenteOs && !this.etapaDefinida) {
      return this.multiEtapa
        ? `Bipe o código da etapa desta estação (${this.etapasTerminal.map(e => e.ordem).join(', ')}) — entrada ou saída…`
        : 'Agora bipe o código da etapa (entrada ou saída)…';
    }
    if (this.pendenteEtapa && !this.pendenteOs) return 'Agora bipe a etiqueta da OS…';
    return 'Aguardando leitura do código de barras…';
  }

  ngOnInit(): void {
    this.carregarConfig();
    this.api.etapas().subscribe({
      next: (list) => {
        this.etapas = [...(list || [])].sort((a, b) => a.ordem - b.ordem);
        this.atualizarOpcoesBip();
        const validas = this.config.etapaIds.filter(id => this.etapas.some(e => e.id === id));
        if (validas.length !== this.config.etapaIds.length) {
          this.config.etapaIds = validas;
          this.salvarConfig();
        }
        this.carregarEstacoes();
      },
      error: () => this.carregarEstacoes()
    });
    this.timerFilaOs = setInterval(() => {
      if (!this.mostrarOsBip && !this.mostrarForcar && !this.enviando) this.carregarFila();
    }, 30000);
    this.subBuscaOs = this.buscaOs$.pipe(
      map(q => q.trim()),
      debounceTime(220),
      distinctUntilChanged(),
      tap(q => { this.buscandoOs = !!q; this.erroBuscaOs = false; }),
      switchMap(q => !q ? of([] as FluxoSugestaoOs[]) : this.api.sugerirOs(q, 8).pipe(
        catchError(() => { this.erroBuscaOs = true; return of([] as FluxoSugestaoOs[]); })
      ))
    ).subscribe(lista => {
      this.buscandoOs = false;
      this.sugestoesOs = lista || [];
      this.sugestaoAtiva = this.sugestoesOs.length ? 0 : -1;
      this.painelOsAberto = this.manualOsFocado && !!this.manualOs.trim() && !this.manualSel;
    });
    this.timerFoco = setInterval(() => this.garantirFoco(), 700);
    this.timerPendencia = setInterval(() => this.checarTimeout(), 1000);
    setTimeout(() => this.focar(), 50);
  }

  ngOnDestroy(): void {
    clearInterval(this.timerFoco);
    clearInterval(this.timerPendencia);
    clearInterval(this.timerFilaOs);
    clearInterval(this.timerPareamento);
    clearTimeout(this.timerPareadaOk);
    clearTimeout(this.timerFeedback);
    clearTimeout(this.timerFlash);
    this.subBuscaOs?.unsubscribe();
    this.audioCtx?.close().catch(() => undefined);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.fullscreen = !!document.fullscreenElement;
  }

  @HostListener('window:blur')
  onJanelaBlur(): void {
    this.inputFocado = false;
  }

  @HostListener('window:focus')
  onJanelaFocus(): void {
    this.garantirFoco();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (!this.mostrarForcar && !this.mostrarConfig && !this.mostrarOsBip) this.limparPendencias();
  }

  /** F2 ou Ctrl+B devolvem o foco ao leitor (ex.: depois de usar a busca ou se o leitor desconectar). */
  @HostListener('document:keydown', ['$event'])
  onAtalhoLeitor(ev: KeyboardEvent): void {
    const f2 = ev.key === 'F2';
    const ctrlB = (ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && ev.key?.toLowerCase() === 'b';
    if ((!f2 && !ctrlB) || this.mostrarForcar || this.mostrarConfig || this.mostrarOsBip) return;
    ev.preventDefault();
    this.focar();
    this.scanInput?.nativeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ------------------------------------------------------------------ leitura

  onKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' || ev.key === 'Tab') {
      ev.preventDefault();
      const valor = (this.entrada || '').trim();
      const origem = this.detectarOrigem();
      this.entrada = '';
      (ev.target as HTMLInputElement).value = '';
      this.teclas = [];
      if (!valor) return;
      if (this.enviando) {
        this.filaLeituras.push({ valor, origem });
        return;
      }
      this.processar(valor, origem);
      return;
    }
    if (ev.key.length === 1) this.teclas.push(performance.now());
  }

  /** Leitores digitam com intervalo típico < 35 ms entre teclas; digitação humana é bem mais lenta. */
  private detectarOrigem(): 'SCANNER' | 'MANUAL' {
    return this.origemPorTeclas(this.teclas);
  }

  private processar(bruto: string, origem: 'SCANNER' | 'MANUAL'): void {
    const valor = bruto.toUpperCase().replace(/\s+/g, '');
    const agora = Date.now();
    if (valor === this.ultimaLeitura.valor && agora - this.ultimaLeitura.em < 1500) return;
    this.ultimaLeitura = { valor, em: agora };

    if (valor === CODIGO_CANCELAR) {
      this.limparPendencias();
      this.registrarHistorico({ ok: true, hora: new Date(), titulo: 'Leitura cancelada', detalhe: 'Pendências descartadas' });
      return;
    }
    if (this.bloquearSemPareamento()) return;

    const etapaEntrada = this.etapas.find(e => e.codigoBarrasEntrada.toUpperCase() === valor);
    const etapaSaida = this.etapas.find(e => e.codigoBarrasSaida.toUpperCase() === valor);
    if (etapaEntrada || etapaSaida) {
      const etapa = (etapaEntrada || etapaSaida)!;
      if (this.config.etapaIds.length && !this.config.etapaIds.includes(etapa.id)) {
        const atende = this.etapasTerminal.map(e => `"${e.nome}"`).join(', ');
        this.mostrarErroLocal('Etapa diferente da estação',
          `Esta estação atende ${this.multiEtapa ? 'as etapas' : 'a etapa'} ${atende}. Código lido: ${etapa.nome}.`);
        return;
      }
      const esperada = this.pendenteOs && !this.podeEscolherEtapa ? this.etapaCandidataDoEstado(this.pendenteOs) : null;
      if (esperada && esperada.id !== etapa.id) {
        const emEtapa = this.pendenteOs!.os.fluxoSituacao === 'EM_ETAPA';
        this.mostrarErroLocal('Etapa fora de sequência', emEtapa
          ? `A OS está em ${esperada.ordem}. ${esperada.nome}: registre a saída dessa etapa antes. Código lido: ${etapa.nome}.`
          : `A próxima etapa desta OS é ${esperada.ordem}. ${esperada.nome}. Código lido: ${etapa.nome}.`);
        return;
      }
      this.pendenteEtapa = { etapa, acao: etapaEntrada ? 'ENTRADA' : 'SAIDA', codigo: valor };
      this.tocarPendencia();
      this.tentarEnviar(origem);
      return;
    }

    this.pendenteOsCodigo = valor;
    this.pendenteOs = null;
    this.iniciarPendencia();
    if (this.etapaDefinida) {
      this.tentarEnviar(origem);
      return;
    }
    this.api.estado(valor).subscribe({
      next: (estado) => {
        if (this.pendenteOsCodigo !== valor) return;
        const auto = this.multiEtapa ? this.etapaDoTerminalPara(this.etapaCandidataDoEstado(estado)) : null;
        if (auto && !this.pendenteEtapa) {
          this.enviar({ osCodigo: valor, etapaId: auto.id, acao: 'AUTO', origem, estacao: this.estacaoRegistro || null });
          return;
        }
        this.pendenteOs = estado;
        this.tocarPendencia();
      },
      error: (err: HttpErrorResponse) => {
        const e = this.erroDe(err);
        this.pendenteOsCodigo = null;
        this.mostrarErroLocal('OS não reconhecida', e.mensagem);
      }
    });
  }

  private tentarEnviar(origem: 'SCANNER' | 'MANUAL'): void {
    if (!this.pendenteOsCodigo) {
      this.iniciarPendencia();
      return;
    }
    const req: FluxoBiparRequest = {
      osCodigo: this.pendenteOsCodigo,
      origem,
      estacao: this.estacaoRegistro || null
    };
    if (this.pendenteEtapa) {
      req.etapaCodigo = this.pendenteEtapa.codigo;
    } else if (this.etapaFixa) {
      req.etapaId = this.etapaFixa.id;
      req.acao = this.config.modo;
    } else {
      return;
    }
    this.enviar(req);
  }

  private enviar(pedido: FluxoBiparRequest): void {
    if (this.bloquearSemPareamento()) return;
    const req: FluxoBiparRequest = { ...pedido, terminalId: this.terminalId };
    this.enviando = true;
    this.ultimaRequisicao = req;
    this.api.bipar(req).subscribe({
      next: (r) => {
        this.enviando = false;
        this.limparPendencias(false);
        const titulo = `${r.acao === 'ENTRADA' ? 'Entrada' : 'Saída'} · ${r.etapa.nome}`;
        this.mostrarFeedback({ ok: true, titulo, mensagem: r.mensagem, resultado: r });
        const usuario = r.acao === 'SAIDA' ? r.registro.saidaUsuarioNome : r.registro.entradaUsuarioNome;
        const meta = [
          { icone: 'pi pi-chart-bar', texto: `${r.etapasConcluidas}/${r.totalEtapas} etapas` },
          ...(r.acao === 'SAIDA' && r.registro.duracaoSegundos != null ? [{ icone: 'pi pi-stopwatch', texto: this.dur(r.registro.duracaoSegundos) }] : []),
          ...(usuario ? [{ icone: 'pi pi-user', texto: usuario }] : [])
        ];
        this.registrarHistorico({
          ok: true, hora: new Date(), acao: r.acao, titulo, detalhe: r.mensagem, osCodigo: r.os.codigo, osId: r.os.id, cor: r.etapa.cor,
          cliente: r.os.cliente, forcado: !!r.forcado, meta
        });
        if (this.limparManualAoConcluir) {
          this.limparManualAoConcluir = false;
          this.manualOs = '';
          this.manualSel = null;
          this.atualizarOpcoesBip();
          this.sugestoesOs = [];
          this.manualAberto = false;
        }
        this.piscar('ok');
        this.tocar(true);
        this.focarDepois();
        this.processarFila();
        this.carregarFila();
      },
      error: (err: HttpErrorResponse) => {
        this.enviando = false;
        this.limparManualAoConcluir = false;
        const e = this.erroDe(err);
        this.limparPendencias(false);
        this.mostrarFeedback({ ok: false, titulo: this.tituloErro(e.codigo), mensagem: e.mensagem, erro: e }, !e.detalhes?.podeForcar);
        this.registrarHistorico({
          ok: false, hora: new Date(), titulo: this.tituloErro(e.codigo), detalhe: e.mensagem, osCodigo: req.osCodigo,
          podeForcar: !!e.detalhes?.podeForcar
        });
        this.piscar('err');
        this.tocar(false);
        this.focarDepois();
        if (e.codigo === 'MAQUINA_NAO_PAREADA' || (err.status === 403 && e.mensagem.includes('Máquina não pareada'))) {
          this.filaLeituras = [];
          this.carregarEstacoes();
          return;
        }
        this.processarFila();
      }
    });
  }

  private processarFila(): void {
    while (!this.enviando && this.filaLeituras.length) {
      const item = this.filaLeituras.shift()!;
      this.processar(item.valor, item.origem);
    }
  }

  registrarManual(acao: 'ENTRADA' | 'SAIDA'): void {
    const etapaId = this.etapaManualId;
    if (!this.manualOs || !etapaId || this.acaoBloqueada(acao)) return;
    this.painelOsAberto = false;
    this.limparManualAoConcluir = true;
    this.enviar({ osCodigo: this.manualOs.trim(), etapaId, acao, origem: 'MANUAL', estacao: this.estacaoRegistro || null });
  }

  // ------------------------------------------------------------------ modal "bipe o código da OS na tela"

  get codigoBarrasSel(): string {
    return this.manualSel ? codigoBarrasOs(this.manualSel.os.id) : '';
  }

  /** Etapa e ação que serão registradas ao bipar, conforme a etapa da estação ou a escolhida e a situação da OS. */
  get previewBip(): { etapa: FluxoEtapa; acao: 'ENTRADA' | 'SAIDA'; foraSequencia: boolean } | null {
    const s = this.manualSel;
    if (!s) return null;
    const etapa = this.etapas.find(e => e.id === this.etapaManualId) ?? null;
    if (!etapa) return null;
    const aberta = s.os.fluxoSituacao === 'EM_ETAPA' && s.os.fluxoEtapaId === etapa.id;
    const acao = aberta ? 'SAIDA' : 'ENTRADA';
    const modo = this.modoParaEtapa(etapa);
    if (modo !== 'AUTO' && modo !== acao) return null;
    return { etapa, acao, foraSequencia: this.etapaSugerida(s)?.id !== etapa.id };
  }

  /** O modo do terminal (só entrada / só saída) vale apenas para a etapa cadastrada nele. */
  private modoParaEtapa(etapa: FluxoEtapa): ModoEstacao {
    return this.etapaFixa?.id === etapa.id ? this.config.modo : 'AUTO';
  }

  configurarTerminalPeloBip(): void {
    this.mostrarOsBip = false;
    this.abrirConfig();
    this.reabrirBipAposConfig = true;
  }

  abrirOsBip(): void {
    if (this.bloquearSemPareamento()) return;
    this.entradaBip = '';
    this.erroBip = '';
    this.teclasBip = [];
    this.mostrarOsBip = true;
  }

  focarBip(): void {
    setTimeout(() => this.bipInput?.nativeElement.focus({ preventScroll: true }), 30);
  }

  fecharOsBip(): void {
    this.bipFocado = false;
    this.focarDepois();
  }

  onBipKeydown(ev: KeyboardEvent): void {
    if (ev.key !== 'Enter' && ev.key !== 'Tab') {
      if (ev.key.length === 1) this.teclasBip.push(performance.now());
      return;
    }
    ev.preventDefault();
    const lido = (this.entradaBip || '').trim().toUpperCase().replace(/\s+/g, '');
    const origem = this.origemPorTeclas(this.teclasBip);
    this.entradaBip = '';
    this.teclasBip = [];
    if (!lido || !this.manualSel) return;
    const m = lido.match(/^(?:OS[-_]?|BEL[-_/]?)?0*(\d{1,12})(?:[/\-_]\d{2,4})?$/);
    if (!m || Number(m[1]) !== this.manualSel.os.id) {
      this.erroBip = `O código lido (${lido}) não é da OS ${this.manualSel.os.codigo}. Bipe o código exibido acima.`;
      this.tocar(false);
      return;
    }
    if (!this.previewBip) {
      const b = this.bloqueioBip;
      this.erroBip = `${b.titulo}. ${b.detalhe}.`;
      this.tocar(false);
      return;
    }
    this.confirmarOsBip(origem);
  }

  confirmarOsBip(origem: 'SCANNER' | 'MANUAL'): void {
    const pv = this.previewBip;
    if (!this.manualSel || !pv || this.enviando) return;
    const req: FluxoBiparRequest = {
      osCodigo: this.codigoBarrasSel,
      etapaId: pv.etapa.id,
      acao: this.modoParaEtapa(pv.etapa),
      origem,
      estacao: this.estacaoRegistro || null
    };
    this.mostrarOsBip = false;
    this.painelOsAberto = false;
    this.limparManualAoConcluir = true;
    this.enviar(req);
  }

  private origemPorTeclas(teclas: number[]): 'SCANNER' | 'MANUAL' {
    if (teclas.length < 3) return 'MANUAL';
    let soma = 0;
    for (let i = 1; i < teclas.length; i++) soma += teclas[i] - teclas[i - 1];
    return soma / (teclas.length - 1) < 35 ? 'SCANNER' : 'MANUAL';
  }

  // ------------------------------------------------------------------ busca de OS (contingência)

  get acaoSugerida(): 'ENTRADA' | 'SAIDA' | null {
    const s = this.manualSel;
    const etapaId = this.etapaManualId;
    if (!s || !etapaId) return null;
    if (s.os.fluxoSituacao === 'EM_ETAPA' && s.os.fluxoEtapaId === etapaId) return 'SAIDA';
    return 'ENTRADA';
  }

  onManualOsDigitado(valor: string): void {
    this.manualOs = valor ?? '';
    if (this.manualSel && this.manualOs !== this.manualSel.os.codigo) {
      this.manualSel = null;
      this.atualizarOpcoesBip();
    }
    const q = this.manualOs.trim();
    this.painelOsAberto = !!q;
    if (!q) {
      this.sugestoesOs = [];
      this.sugestaoAtiva = -1;
    }
    this.buscaOs$.next(q);
  }

  onManualOsFocus(): void {
    this.manualOsFocado = true;
    if (this.manualOs.trim() && !this.manualSel) this.painelOsAberto = true;
  }

  onManualOsBlur(): void {
    this.manualOsFocado = false;
    this.painelOsAberto = false;
  }

  onManualOsKeydown(ev: KeyboardEvent): void {
    const n = this.sugestoesOs.length;
    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        if (!this.painelOsAberto && this.manualOs.trim()) { this.painelOsAberto = true; return; }
        if (n) this.moverSugestao(1);
        break;
      case 'ArrowUp':
        ev.preventDefault();
        if (n) this.moverSugestao(-1);
        break;
      case 'Enter':
        if (this.painelOsAberto && n && this.sugestaoAtiva >= 0) {
          ev.preventDefault();
          this.selecionarSugestao(this.sugestoesOs[this.sugestaoAtiva]);
        }
        break;
      case 'Escape':
        if (this.painelOsAberto) {
          ev.preventDefault();
          ev.stopPropagation();
          this.painelOsAberto = false;
        }
        break;
    }
  }

  private moverSugestao(passo: number): void {
    const n = this.sugestoesOs.length;
    this.sugestaoAtiva = (this.sugestaoAtiva + passo + n) % n;
    setTimeout(() => document.getElementById('st-os-opt-' + this.sugestaoAtiva)?.scrollIntoView({ block: 'nearest' }));
  }

  selecionarSugestao(s: FluxoSugestaoOs): void {
    this.manualSel = s;
    this.manualOs = s.os.codigo;
    this.painelOsAberto = false;
    const sugerida = this.etapaSugerida(s);
    const inicial = this.podeEscolherEtapa ? sugerida ?? this.etapaFixa : this.etapaDoTerminalPara(sugerida);
    this.manualEtapaId = inicial?.id ?? null;
    this.atualizarOpcoesBip();
    this.abrirOsBip();
  }

  limparManualOs(): void {
    this.manualSel = null;
    this.onManualOsDigitado('');
  }

  /** Em etapa: a própria etapa (para saída). Aguardando: a próxima. Fora do fluxo: a primeira. */
  private etapaSugerida(s: FluxoSugestaoOs): FluxoEtapa | null {
    if (!this.etapas.length || s.os.fluxoSituacao === 'CONCLUIDO') return null;
    const atual = s.os.fluxoEtapaId != null ? this.etapas.find(e => e.id === s.os.fluxoEtapaId) : null;
    if (!atual) return this.etapas[0];
    if (s.os.fluxoSituacao === 'EM_ETAPA') return atual;
    return this.etapas.find(e => e.ordem > atual.ordem) || null;
  }

  estadoSugestao(s: FluxoSugestaoOs): { tipo: 'live' | 'wait' | 'done' | 'none'; texto: string } {
    const nome = s.etapa ? `${s.etapa.ordem}. ${s.etapa.nome}` : '';
    switch (s.os.fluxoSituacao) {
      case 'EM_ETAPA': return { tipo: 'live', texto: nome ? `Em ${nome}` : 'Em etapa' };
      case 'AGUARDANDO': return { tipo: 'wait', texto: nome ? `Aguardando · após ${s.etapa!.nome}` : 'Aguardando' };
      case 'CONCLUIDO': return { tipo: 'done', texto: 'Fluxo concluído' };
      default: return { tipo: 'none', texto: 'Não iniciou o fluxo' };
    }
  }

  labelCampo(c: FluxoCampoSugestao): string {
    switch (c) {
      case 'OS_ORIGINAL': return 'OS original';
      case 'SN': return 'SN';
      case 'PN': return 'PN';
      case 'CLIENTE': return 'cliente';
      default: return 'código';
    }
  }

  labelStatus(s?: string | null): string {
    if (!s) return '';
    const t = s.replace(/_/g, ' ').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  /** Quebra o texto em trechos, marcando a ocorrência do termo digitado (no código, só o número da OS). */
  destacar(texto: string, ativo: boolean): { t: string; m: boolean }[] {
    const q = this.manualOs.trim();
    if (!ativo || !q || !texto) return [{ t: texto, m: false }];
    const termo = /^(bel|os)?[\s\-#]*\d/i.test(q) && /^[A-Z]{2,3}-\d+/.test(texto) ? (q.match(/\d+/)?.[0] ?? q) : q;
    const i = texto.toLowerCase().indexOf(termo.toLowerCase());
    if (i < 0) return [{ t: texto, m: false }];
    return [
      { t: texto.slice(0, i), m: false },
      { t: texto.slice(i, i + termo.length), m: true },
      { t: texto.slice(i + termo.length), m: false }
    ].filter(p => p.t);
  }

  abrirForcar(): void {
    this.motivoForcar = '';
    this.mostrarForcar = true;
  }

  confirmarForcar(): void {
    if (!this.ultimaRequisicao) return;
    const req = { ...this.ultimaRequisicao, forcar: true, motivo: this.motivoForcar.trim() };
    this.mostrarForcar = false;
    this.enviar(req);
  }

  // ------------------------------------------------------------------ estado / UI

  limparPendencias(focar = true): void {
    this.pendenteOs = null;
    this.pendenteOsCodigo = null;
    this.pendenteEtapa = null;
    this.pendenteDesde = 0;
    this.percentualTimeout = 100;
    if (focar) this.focarDepois();
  }

  private iniciarPendencia(): void {
    this.pendenteDesde = Date.now();
    this.percentualTimeout = 100;
  }

  private checarTimeout(): void {
    if (!this.pendenteOsCodigo && !this.pendenteEtapa) return;
    if (!this.pendenteDesde) this.pendenteDesde = Date.now();
    const decorrido = (Date.now() - this.pendenteDesde) / 1000;
    this.percentualTimeout = Math.max(0, 100 - (decorrido / TIMEOUT_PENDENCIA_SEG) * 100);
    if (decorrido >= TIMEOUT_PENDENCIA_SEG) {
      this.limparPendencias();
    }
  }

  private tocarPendencia(): void {
    if (!this.pendenteDesde) this.iniciarPendencia();
    this.tocarTom(880, 0.06);
  }

  private mostrarFeedback(f: Feedback, autoOcultar = true): void {
    this.feedback = f;
    clearTimeout(this.timerFeedback);
    if (autoOcultar) {
      this.timerFeedback = setTimeout(() => { this.feedback = null; }, f.ok ? 9000 : 14000);
    }
  }

  private mostrarErroLocal(titulo: string, mensagem: string): void {
    this.mostrarFeedback({ ok: false, titulo, mensagem });
    this.registrarHistorico({ ok: false, hora: new Date(), titulo, detalhe: mensagem });
    this.piscar('err');
    this.tocar(false);
    this.focarDepois();
  }

  private piscar(tipo: 'ok' | 'err'): void {
    clearTimeout(this.timerFlash);
    this.flash = null;
    setTimeout(() => {
      this.flash = tipo;
      this.timerFlash = setTimeout(() => { this.flash = null; }, 950);
    });
  }

  private registrarHistorico(h: LeituraHistorico): void {
    this.historico = [h, ...this.historico].slice(0, 40);
  }

  private erroDe(err: HttpErrorResponse): FluxoErro {
    const body = err?.error;
    if (body && typeof body === 'object' && body.mensagem) return body as FluxoErro;
    if (err?.status === 0) return { sucesso: false, codigo: 'SEM_CONEXAO', mensagem: 'Sem conexão com o servidor. Verifique a rede e bipe novamente.' };
    return { sucesso: false, codigo: 'ERRO', mensagem: body?.message || 'Falha ao registrar a leitura.' };
  }

  private tituloErro(codigo: string): string {
    switch (codigo) {
      case 'FORA_DE_SEQUENCIA': return 'Etapa fora de sequência';
      case 'ETAPA_ABERTA': return 'Etapa anterior ainda aberta';
      case 'JA_EM_ETAPA': return 'OS já está nesta etapa';
      case 'SAIDA_JA_REGISTRADA': return 'Saída já registrada';
      case 'SEM_ETAPA_ABERTA': return 'OS sem entrada nesta etapa';
      case 'ETAPA_DIFERENTE': return 'OS está em outra etapa';
      case 'LEITURA_DUPLICADA': return 'Leitura duplicada';
      case 'CODIGO_OS_INVALIDO': return 'Código de OS inválido';
      case 'OS_NAO_ENCONTRADA': return 'OS não encontrada';
      case 'CODIGO_ETAPA_INVALIDO': return 'Código de etapa inválido';
      case 'SEM_CONEXAO': return 'Sem conexão';
      case 'MAQUINA_NAO_PAREADA': return 'Máquina não pareada';
      default: return 'Não foi possível registrar';
    }
  }

  abrirConfig(): void {
    this.reabrirBipAposConfig = false;
    this.rascunho = { ...this.config, etapaIds: [...this.config.etapaIds] };
    this.estacaoSel = this.config.estacaoCodigo ?? null;
    this.erroEstacao = '';
    this.pareadaNome = '';
    this.mostrarConfig = true;
    if (!this.estacoes.length) this.carregarEstacoes(false);
    if (this.modoPareamento && !this.timerPareamento) this.iniciarPareamento();
  }

  /** O vínculo deve ser confirmado pelo servidor, independentemente do perfil logado. */
  get maquinaBloqueada(): boolean {
    return !this.pareamentoConfirmado;
  }

  private bloquearSemPareamento(): boolean {
    if (!this.maquinaBloqueada) return false;
    this.limparPendencias(false);
    this.mostrarErroLocal('Máquina não pareada',
      'Esta máquina ainda não é uma estação. Peça a um Administrador ou Diretor para pareá-la; até lá a bipagem fica bloqueada.');
    if (!this.mostrarConfig) this.abrirConfig();
    return true;
  }

  /** Toda máquina sem vínculo aguarda o cadastro por um administrador. */
  get modoPareamento(): boolean {
    return this.maquinaBloqueada || !!this.pareadaNome;
  }

  private iniciarPareamento(): void {
    this.pararPareamento();
    this.solicitarPareamento();
    this.timerPareamento = setInterval(() => this.verificarPareamento(), 3000);
  }

  pararPareamento(): void {
    clearInterval(this.timerPareamento);
    this.timerPareamento = undefined;
  }

  solicitarPareamento(): void {
    this.erroPareamento = '';
    this.api.solicitarPareamento(this.terminalId).subscribe({
      next: (p) => {
        this.pareamentoRecebidoEm = Date.now();
        this.pareamento = p;
        if (p?.vinculada) this.verificarPareamento();
      },
      error: (e) => {
        this.pareamento = null;
        this.erroPareamento = e?.error?.mensagem || 'Não foi possível gerar o código de pareamento. Verifique a conexão.';
      }
    });
  }

  private verificarPareamento(): void {
    if (this.verificandoPareamento || this.pareadaNome) return;
    const p = this.pareamento;
    if (p?.codigo) {
      const restante = p.segundosRestantes - (Date.now() - this.pareamentoRecebidoEm) / 1000;
      if (restante < 110) this.solicitarPareamento();
    }
    this.verificandoPareamento = true;
    this.api.estacoes(this.terminalId).subscribe({
      next: (r) => {
        this.verificandoPareamento = false;
        this.estacoes = r?.estacoes || this.estacoes;
        const est = r?.estacaoDesteTerminal ? this.estacoes.find(e => e.codigo === r.estacaoDesteTerminal) : null;
        if (!est || !this.timerPareamento) return;
        this.pararPareamento();
        this.pareamento = null;
        this.pareadaNome = r?.maquinaDesteTerminal ? `${est.nome} · ${r.maquinaDesteTerminal}` : est.nome;
        this.aplicarEstacao(est, undefined, r?.maquinaDesteTerminal ?? null);
        this.carregarFila();
        clearTimeout(this.timerPareadaOk);
        this.timerPareadaOk = setTimeout(() => {
          this.mostrarConfig = false;
          this.pareadaNome = '';
        }, 2500);
      },
      error: () => { this.verificandoPareamento = false; }
    });
  }

  /** Estação e nome da máquina, gravados na auditoria da bipagem para identificar de qual máquina veio a leitura. */
  get estacaoRegistro(): string {
    const nome = this.config.nome || '';
    return this.config.maquina ? (nome ? `${nome} · ${this.config.maquina}` : this.config.maquina) : nome;
  }

  get estacaoSelecionada(): FluxoEstacao | null {
    return this.estacoes.find(e => e.codigo === this.estacaoSel) ?? null;
  }

  /** A primeira escolha da estação é livre; depois, trocar exige Gerenciar Estações (ou Ajuste de Etapas). */
  get estacaoTravada(): boolean {
    return !this.podeTrocarEstacao && !!this.config.estacaoCodigo;
  }

  etapasDaEstacao(e: FluxoEstacao): FluxoEtapa[] {
    return this.etapas.filter(et => e.etapaIds.includes(et.id));
  }

  trackEstacao = (_: number, e: FluxoEstacao) => e.codigo;

  /** Carrega as estações geradas pelo servidor e aplica (ou descobre) a estação desta máquina. */
  private carregarEstacoes(resolver = true): void {
    this.carregandoEstacoes = true;
    this.api.estacoes(this.terminalId).subscribe({
      next: (r) => {
        this.carregandoEstacoes = false;
        this.estacoes = r?.estacoes || [];
        if (resolver) this.resolverEstacao(r?.estacaoDesteTerminal ?? null, r?.maquinaDesteTerminal ?? null);
      },
      error: () => {
        this.carregandoEstacoes = false;
        if (resolver) this.resolverEstacao(null, null);
      }
    });
  }

  private resolverEstacao(codigoServidor: string | null, maquina: string | null): void {
    const doServidor = codigoServidor ? this.estacoes.find(e => e.codigo === codigoServidor) : null;
    if (doServidor) {
      this.aplicarEstacao(doServidor, undefined, maquina);
      this.carregarFila();
      return;
    }
    this.pareamentoConfirmado = false;
    this.config = { ...this.config, nome: '', estacaoCodigo: null, maquina: null, etapaIds: [], modo: 'AUTO' };
    this.salvarConfig();
    this.atualizarOpcoesBip();
    this.limparPendencias(false);
    this.filaOs = [];
    this.abrirConfig();
  }

  /** `maquina` indefinida preserva o nome da máquina já conhecido. */
  private aplicarEstacao(est: FluxoEstacao, modo?: ModoEstacao, maquina?: string | null): void {
    this.pareamentoConfirmado = true;
    const etapaIds = this.etapas.filter(e => est.etapaIds.includes(e.id)).map(e => e.id);
    const mudouEtapa = etapaIds.join(',') !== this.config.etapaIds.join(',');
    this.config = {
      ...this.config,
      nome: est.nome,
      estacaoCodigo: est.codigo,
      maquina: maquina !== undefined ? maquina : this.config.maquina ?? null,
      etapaIds,
      modo: etapaIds.length === 1 ? (modo ?? this.config.modo) : 'AUTO'
    };
    this.salvarConfig();
    this.atualizarOpcoesBip();
    if (mudouEtapa) this.limparPendencias(false);
  }

  private vincular(est: FluxoEstacao, modo: ModoEstacao | undefined, peloDialogo: boolean): void {
    this.salvandoEstacao = true;
    this.erroEstacao = '';
    this.api.vincularEstacao(this.terminalId, est.codigo).subscribe({
      next: (r) => {
        this.salvandoEstacao = false;
        this.estacoes = r?.estacoes || this.estacoes;
        const vinculada = this.estacoes.find(e => e.codigo === est.codigo) ?? est;
        const mudou = vinculada.etapaIds.join(',') !== this.config.etapaIds.join(',');
        this.aplicarEstacao(vinculada, modo, r?.maquinaDesteTerminal ?? null);
        if (mudou || !peloDialogo) this.carregarFila();
        if (peloDialogo) this.concluirConfig();
      },
      error: (e) => {
        this.salvandoEstacao = false;
        this.erroEstacao = e?.error?.mensagem || 'Não foi possível vincular a estação. Tente novamente.';
        if (!peloDialogo) {
          this.carregarFila();
          this.abrirConfig();
        }
      }
    });
  }

  confirmarEstacao(): void {
    const est = this.estacaoSelecionada;
    if (!est || this.salvandoEstacao) return;
    if (this.estacaoTravada && est.codigo !== this.config.estacaoCodigo) return;
    const modo = est.etapaIds.length === 1 ? this.rascunho.modo : 'AUTO';
    if (est.codigo === this.config.estacaoCodigo && est.desteTerminal) {
      this.aplicarEstacao(est, modo);
      this.concluirConfig();
      return;
    }
    this.vincular(est, modo, true);
  }

  private concluirConfig(): void {
    this.mostrarConfig = false;
    if (this.reabrirBipAposConfig && this.manualSel && !this.terminalSemEtapa) {
      const inicial = this.etapaFixa ?? this.etapaDoTerminalPara(this.etapaSugerida(this.manualSel));
      this.manualEtapaId = inicial?.id ?? null;
      setTimeout(() => this.abrirOsBip(), 250);
    }
    this.reabrirBipAposConfig = false;
  }

  carregarFila(): void {
    if (this.maquinaBloqueada) { this.filaOs = []; return; }
    if (this.carregandoFila) return;
    this.carregandoFila = true;
    this.api.fila(this.config.etapaIds, 60, this.terminalId).subscribe({
      next: (lista) => {
        this.filaOs = lista || [];
        this.carregandoFila = false;
        this.erroFila = false;
      },
      error: (err: HttpErrorResponse) => {
        this.carregandoFila = false;
        this.erroFila = true;
        if (err.status === 403) this.carregarEstacoes();
      }
    });
  }

  get contagemFila(): Record<'ENTRADA' | 'SAIDA', number> {
    let entrada = 0;
    for (const f of this.filaOs) if (f.acao === 'ENTRADA') entrada++;
    return { ENTRADA: entrada, SAIDA: this.filaOs.length - entrada };
  }

  get filaVisivel(): FluxoFilaItem[] {
    const termo = this.normalizar(this.filtroFila);
    return this.filaOs.filter(f => (this.abaFila === 'TODAS' || f.acao === this.abaFila) && (!termo || this.normalizar(
      [f.os.codigo, f.os.numOsOriginal, f.os.cliente, f.os.partNumber, f.os.serialNumber, f.os.mecanicoNome].filter(Boolean).join(' ')
    ).includes(termo)));
  }

  get rotuloAbaFila(): string {
    if (this.abaFila === 'ENTRADA') return 'aguardando entrada';
    if (this.abaFila === 'SAIDA') return 'em etapa · aguardando saída';
    return 'na fila desta estação';
  }

  selecionarAbaFila(aba: AbaFila): void {
    this.abaFila = aba;
  }

  definirVisaoFila(v: VisaoFila): void {
    this.visaoFila = v;
    try {
      localStorage.setItem(STORAGE_VISAO, v);
    } catch { /* armazenamento indisponível */ }
  }

  trackFila = (_: number, f: FluxoFilaItem) => `${f.os.id}-${f.acao}-${f.etapa?.id ?? ''}`;

  /** Abre o modal com o código de barras da OS escolhida; as regras de sequência são as mesmas da busca. */
  abrirDaFila(f: FluxoFilaItem): void {
    const atual = f.os.fluxoEtapaId != null ? this.etapas.find(e => e.id === f.os.fluxoEtapaId) ?? null : null;
    this.selecionarSugestao({
      os: f.os, etapa: atual, dtAbertura: f.dtAbertura, tipoServico: f.tipoServico,
      marcasMatricula: f.marcasMatricula, campoEncontrado: 'CODIGO'
    });
  }

  dataCurta(v?: string | null): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '');
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
  }

  private normalizar(v?: string | null): string {
    return (v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  toggleSom(): void {
    this.config.som = !this.config.som;
    this.salvarConfig();
    this.focarDepois();
  }

  toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      document.documentElement.requestFullscreen?.().catch(() => undefined);
    }
    this.focarDepois();
  }

  focar(): void {
    const el = this.scanInput?.nativeElement;
    if (el) el.focus({ preventScroll: true });
  }

  focarDepois(): void {
    setTimeout(() => this.focar(), 60);
  }

  private garantirFoco(): void {
    const input = this.scanInput?.nativeElement;
    const ativo = document.activeElement as HTMLElement | null;
    this.inputFocado = !!input && ativo === input && document.hasFocus();
    if (this.inputFocado || this.mostrarForcar || this.mostrarConfig || this.mostrarOsBip) return;
    const editavel = !!ativo && (/^(INPUT|TEXTAREA|SELECT)$/.test(ativo.tagName) || ativo.isContentEditable
      || !!ativo.closest('.p-dropdown, .p-dialog, .p-overlay'));
    if (!editavel) this.focar();
  }

  corProgresso(e: FluxoEtapa, estado: FluxoEstadoOs): string {
    const atual = estado.etapaAtual;
    if (!atual) return '#e2e8f0';
    if (e.ordem < atual.ordem) return '#059669';
    if (e.ordem === atual.ordem) {
      if (estado.registroAberto) return '#d97706';
      return '#059669';
    }
    return '#e2e8f0';
  }

  labelModo(m: ModoEstacao): string {
    return m === 'ENTRADA' ? 'somente entrada' : m === 'SAIDA' ? 'somente saída' : 'entrada/saída automática';
  }

  hora(v?: string | null): string {
    return formatarHora(v);
  }

  dur(s?: number | null): string {
    return formatarDuracao(s);
  }

  situacao(s?: string | null): string {
    return labelSituacao(s);
  }

  salvarConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch { /* armazenamento indisponível */ }
  }

  private carregarConfig(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const salvo = JSON.parse(raw);
      const etapaIds: number[] = Array.isArray(salvo.etapaIds) ? salvo.etapaIds : salvo.etapaId ? [salvo.etapaId] : [];
      this.config = { ...this.config, ...salvo, etapaIds };
      delete (this.config as any).etapaId;
    } catch { /* ignora */ }
    try {
      const visao = localStorage.getItem(STORAGE_VISAO);
      if (visao === 'GRADE' || visao === 'LISTA') this.visaoFila = visao;
    } catch { /* ignora */ }
  }

  // ------------------------------------------------------------------ áudio

  private tocar(ok: boolean): void {
    if (ok) {
      this.tocarTom(1046, 0.09);
      setTimeout(() => this.tocarTom(1568, 0.12), 100);
    } else {
      this.tocarTom(220, 0.18, 'square');
      setTimeout(() => this.tocarTom(180, 0.25, 'square'), 220);
    }
  }

  private tocarTom(freq: number, duracao: number, tipo: OscillatorType = 'sine'): void {
    if (!this.config.som) return;
    try {
      this.audioCtx = this.audioCtx || new AudioContext();
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tipo;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracao);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duracao + 0.02);
    } catch { /* sem áudio */ }
  }
}
