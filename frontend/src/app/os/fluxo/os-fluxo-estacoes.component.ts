import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FluxoEstacaoGestao, FluxoEstacoesGestao, FluxoMaquina, FluxoPareamentoInfo, OsFluxoService } from './os-fluxo.service';

const STORAGE_TERMINAL = 'osFluxo.terminalId';

interface EdicaoMaquina {
  estacaoCodigo: string;
  apelido: string;
}

@Component({
  standalone: true,
  selector: 'app-os-fluxo-estacoes',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DialogModule, DropdownModule, InputTextModule, TooltipModule, ToastModule],
  providers: [MessageService],
  styleUrls: ['./fluxo-shared.css'],
  template: `
    <p-toast></p-toast>
    <div class="fx-shell">
      <header class="fx-hero">
        <div>
          <button pButton type="button" icon="pi pi-arrow-left" class="p-button-text p-button-sm fx-back"
                  label="Painel do fluxo" routerLink="/os/fluxo"></button>
          <p class="fx-eyebrow">Controle de fluxo · Configuração</p>
          <h1>Gerenciar estações</h1>
          <p class="fx-lead ge-lead">Renomeie as estações de bipagem e defina quais computadores funcionam como estação.</p>
        </div>
        <div class="fx-hero-actions">
          <button type="button" class="fx-ghost-btn" (click)="carregar()" [disabled]="carregando">
            <i class="pi pi-refresh" [class.pi-spin]="carregando"></i> Atualizar
          </button>
          <a class="fx-ghost-btn is-primary" routerLink="/os/fluxo/estacao"><i class="pi pi-qrcode"></i> Estação de bipagem</a>
        </div>
      </header>

      <div class="fx-loading" *ngIf="carregando && !dados"><i class="pi pi-spin pi-spinner" style="font-size: 1.6rem"></i></div>

      <div class="fx-card ge-erro" *ngIf="erro && !dados">
        <div class="fx-empty-state">
          <span class="ico"><i class="pi pi-exclamation-triangle"></i></span>
          <strong>Não foi possível carregar as estações</strong>
          <span>{{ erro }}</span>
          <button pButton type="button" label="Tentar de novo" icon="pi pi-refresh" class="p-button-sm" (click)="carregar()"></button>
        </div>
      </div>

      <ng-container *ngIf="dados as d">
        <section class="fx-card">
          <div class="fx-card-head">
            <h2>Estações</h2>
            <span class="ge-hint">Clique no nome para editar. Apague o nome para voltar ao original.</span>
          </div>
          <div class="fx-card-body">
            <div class="ge-grupos">
              <article class="ge-grupo" *ngFor="let e of d.estacoes; trackBy: trackEstacao" [style.--stage]="e.cor || '#334155'">
                <header class="ge-grupo-head">
                  <span class="ge-grupo-ico"><i class="pi pi-desktop"></i></span>
                  <div class="ge-grupo-tit">
                    <h3>{{ e.nome }}</h3>
                  </div>
                  <span class="fx-chip ge-chip" [ngClass]="e.maquinas ? 'fx-chip--done' : 'fx-chip--muted'">
                    <i class="pi pi-server"></i> {{ e.maquinas }} {{ e.maquinas === 1 ? 'máquina' : 'máquinas' }}
                  </span>
                </header>

                <div>
                  <label class="ge-label" [attr.for]="'nome-' + e.codigo">Nome da estação</label>
                  <div class="ge-nome">
                    <span class="ge-field">
                      <i class="pi pi-pencil"></i>
                      <input pInputText class="ge-input" [id]="'nome-' + e.codigo" [(ngModel)]="nomes[e.codigo]" [placeholder]="e.nomePadrao"
                             maxlength="120" (keydown.enter)="salvarNome(e)" [disabled]="salvandoNome === e.codigo" />
                    </span>
                    <button pButton type="button" icon="pi pi-check" class="p-button-sm" pTooltip="Salvar nome"
                            *ngIf="nomeAlterado(e) || salvandoNome === e.codigo"
                            [loading]="salvandoNome === e.codigo" (click)="salvarNome(e)"></button>
                  </div>
                  <div class="ge-orig" *ngIf="e.nomePersonalizado">
                    Original: <b>{{ e.nomePadrao }}</b>
                    <button type="button" class="ge-link" (click)="restaurarNome(e)" [disabled]="salvandoNome === e.codigo">restaurar</button>
                  </div>
                </div>

                <div class="ge-etapas" *ngIf="maquinasDa(e.codigo) as maqs">
                  <span class="ge-etapas-tit">Máquinas</span>
                  <span class="ge-etapa ge-maq-chip" *ngFor="let m of maqs" [class.on]="m.ativa">
                    <i class="pi pi-server"></i> {{ m.apelido || 'Sem nome' }}
                  </span>
                  <span class="ge-vazio" *ngIf="!maqs.length">Nenhuma máquina vinculada</span>
                </div>

                <div class="ge-etapas">
                  <span class="ge-etapas-tit">Etapas atendidas</span>
                  <span class="ge-etapa" *ngFor="let et of e.etapas">{{ et }}</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="fx-card">
          <div class="fx-card-head">
            <div class="ge-head-tit">
              <h2>Máquinas</h2>
              <span class="ge-hint">{{ d.maquinas.length }} {{ d.maquinas.length === 1 ? 'máquina vinculada' : 'máquinas vinculadas' }}</span>
            </div>
            <button pButton type="button" icon="pi pi-link" label="Parear máquina" (click)="abrirPareamento()"></button>
          </div>
          <div class="fx-card-body">
            <div class="ge-ajuda">
              <span>Para incluir uma máquina, abra a <b>Estação de Bipagem</b> nela e digite aqui o código que aparecer na tela.</span>
              <button type="button" class="ge-ajuda-btn" (click)="ajudaAberta = !ajudaAberta" [attr.aria-expanded]="ajudaAberta">
                <i class="pi pi-question-circle"></i> Como funciona?
              </button>
            </div>
            <ul class="ge-ajuda-det" *ngIf="ajudaAberta">
              <li>Na máquina nova, alguém entra no sistema e abre a <b>Estação de Bipagem</b>: aparece um código de 8 números.</li>
              <li>Aqui, clique em <b>Parear máquina</b>, digite o código, escolha a estação e confirme. A tela da máquina abre sozinha.</li>
              <li>Troque a estação ou dê um nome à máquina e clique em <b>Salvar</b>.</li>
              <li><b>Remover</b> faz a máquina deixar de ser estação. Se a Estação de Bipagem for aberta nela de novo, ela mostra um novo código de pareamento.</li>
            </ul>

            <div class="fx-empty-state" *ngIf="!d.maquinas.length">
              <span class="ico"><i class="pi pi-desktop"></i></span>
              <strong>Nenhuma máquina vinculada</strong>
              <span>Abra a Estação de Bipagem no computador da estação e use <b>Parear máquina</b> com o código que aparecer nele.</span>
            </div>

            <div class="ge-table-wrap" *ngIf="d.maquinas.length">
              <table class="fx-table ge-table">
                <thead>
                  <tr>
                    <th>Máquina</th>
                    <th>Estação</th>
                    <th>Situação</th>
                    <th>Vinculada por</th>
                    <th class="r"><span class="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  <ng-container *ngFor="let m of d.maquinas; trackBy: trackMaquina">
                    <tr [class.ge-atual]="m.terminalId === terminalAtual" [class.ge-aberta]="detalhe === m.terminalId">
                      <td class="ge-maq">
                        <span class="ge-field">
                          <i class="pi pi-pencil"></i>
                          <input pInputText class="ge-input" [(ngModel)]="edicao[m.terminalId].apelido" placeholder="Nome (ex.: Bancada 2)"
                                 maxlength="120" (keydown.enter)="salvarMaquina(m)" [class.ge-input--erro]="!edicao[m.terminalId].apelido.trim()" />
                        </span>
                        <small class="ge-aviso" *ngIf="!edicao[m.terminalId].apelido.trim()">
                          <i class="pi pi-exclamation-triangle"></i> Dê um nome: é ele que diferencia as máquinas da mesma estação
                        </small>
                        <div class="ge-maq-meta">
                          <span class="fx-chip fx-chip--accent ge-chip" *ngIf="m.terminalId === terminalAtual"><i class="pi pi-map-marker"></i> esta máquina</span>
                          <span>{{ navegador(m.userAgent) }}</span>
                          <button type="button" class="ge-link ge-det-btn" (click)="alternarDetalhe(m)" [attr.aria-expanded]="detalhe === m.terminalId">
                            {{ detalhe === m.terminalId ? 'ocultar detalhes' : 'detalhes' }}
                            <i class="pi" [ngClass]="detalhe === m.terminalId ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                          </button>
                        </div>
                      </td>
                      <td class="ge-est-cell">
                        <p-dropdown [options]="opcoesEstacao" [(ngModel)]="edicao[m.terminalId].estacaoCodigo" optionLabel="label" optionValue="value"
                                    appendTo="body" styleClass="ge-dropdown" [style]="{ width: '100%' }" placeholder="Escolha a estação"></p-dropdown>
                        <small class="ge-aviso" *ngIf="!estacaoExiste(m.estacaoCodigo)">
                          <i class="pi pi-exclamation-triangle"></i> A estação "{{ m.estacaoNome || m.estacaoCodigo }}" não existe mais
                        </small>
                      </td>
                      <td class="ge-sit">
                        <span class="fx-chip ge-chip" [ngClass]="m.ativa ? 'fx-chip--done' : 'fx-chip--muted'">
                          <span class="dot"></span> {{ m.ativa ? 'Em uso agora' : 'Inativa' }}
                        </span>
                        <div class="ge-sub" *ngIf="m.ultimoAcesso" [pTooltip]="'Último acesso: ' + (m.ultimoAcesso | date:'dd/MM/yyyy HH:mm')"
                             tooltipPosition="top">{{ relativo(m.ultimoAcesso) }}</div>
                      </td>
                      <td class="ge-quem">{{ m.usuarioNome || '—' }}</td>
                      <td class="r">
                        <div class="ge-acoes">
                          <button pButton type="button" icon="pi pi-check" label="Salvar" class="p-button-sm ge-btn-salvar"
                                  [disabled]="!maquinaAlterada(m) || !edicao[m.terminalId].estacaoCodigo || !edicao[m.terminalId].apelido.trim()"
                                  [loading]="salvandoMaquina === m.terminalId"
                                  (click)="salvarMaquina(m)"></button>
                          <button pButton type="button" icon="pi pi-trash" label="Remover" class="p-button-sm ge-btn-remover"
                                  pTooltip="Esta máquina deixa de ser estação" tooltipPosition="left"
                                  [disabled]="salvandoMaquina === m.terminalId" (click)="pedirRemocao(m)"></button>
                        </div>
                      </td>
                    </tr>
                    <tr class="ge-det" *ngIf="detalhe === m.terminalId">
                      <td colspan="5">
                        <dl>
                          <div><dt>Vinculada em</dt><dd>{{ m.vinculadoEm ? (m.vinculadoEm | date:'dd/MM/yyyy HH:mm') : '—' }}</dd></div>
                          <div><dt>Último acesso</dt><dd>{{ m.ultimoAcesso ? (m.ultimoAcesso | date:'dd/MM/yyyy HH:mm') : '—' }}</dd></div>
                          <div><dt>Endereço IP</dt><dd class="fx-mono">{{ m.ip || '—' }}</dd></div>
                          <div><dt>Identificador</dt><dd class="fx-mono">{{ m.terminalId }}</dd></div>
                          <div class="ge-det-ua"><dt>Navegador</dt><dd>{{ m.userAgent || '—' }}</dd></div>
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

    <p-dialog [(visible)]="mostrarPareamento" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body"
              header="Parear máquina" [style]="{ width: '500px', maxWidth: '95vw' }">
      <div class="gp">
        <label class="ge-label" for="gp-codigo">Código mostrado na máquina</label>
        <input id="gp-codigo" class="gp-codigo" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="00000000"
               [(ngModel)]="parCodigo" (ngModelChange)="codigoPareamentoMudou($event)" />
        <div class="gp-info" *ngIf="consultandoPar"><i class="pi pi-spin pi-spinner"></i> Procurando a máquina…</div>
        <div class="gp-info gp-info--ok" *ngIf="parInfo as info">
          <i class="pi pi-desktop"></i>
          <div>
            <strong>{{ navegador(info.userAgent) }}</strong>
            <span>{{ info.usuarioNome ? 'Usuário na máquina: ' + info.usuarioNome : 'Usuário não identificado' }}</span>
            <span class="fx-mono" *ngIf="info.ip">IP {{ info.ip }}</span>
          </div>
        </div>
        <small class="gp-erro" *ngIf="erroPar"><i class="pi pi-times-circle"></i> {{ erroPar }}</small>

        <ng-container *ngIf="parInfo">
          <label class="ge-label" for="gp-estacao">Estação</label>
          <p-dropdown inputId="gp-estacao" [options]="opcoesEstacao" [(ngModel)]="parEstacao" optionLabel="label" optionValue="value"
                      appendTo="body" styleClass="ge-dropdown" [style]="{ width: '100%' }" placeholder="Escolha a estação"></p-dropdown>
          <label class="ge-label" for="gp-apelido">Nome da máquina</label>
          <span class="ge-field">
            <i class="pi pi-pencil"></i>
            <input pInputText id="gp-apelido" class="ge-input" [(ngModel)]="parApelido" maxlength="120" placeholder="Ex.: Bancada 2" />
          </span>
          <small class="gp-opc">É pelo nome que as máquinas da mesma estação se diferenciam.<ng-container
            *ngIf="parEstacao && maquinasDa(parEstacao).length"> Já vinculadas: {{ nomesMaquinas(parEstacao) }}.</ng-container></small>
        </ng-container>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" (click)="mostrarPareamento = false"></button>
        <button pButton type="button" label="Parear máquina" icon="pi pi-link" [disabled]="!parInfo || !parEstacao || !parApelido.trim()"
                [loading]="pareando" (click)="confirmarPareamento()"></button>
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="mostrarRemocao" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body"
              header="Remover máquina da estação" [style]="{ width: '460px', maxWidth: '95vw' }">
      <ng-container *ngIf="remover as m">
        <p class="ge-dlg-txt">
          <b>{{ m.apelido || navegador(m.userAgent) }}</b> deixará de ser a estação <b>{{ nomeEstacao(m.estacaoCodigo) || m.estacaoNome }}</b>.
        </p>
        <p class="ge-dlg-txt fx-muted">Os registros já feitos nesta máquina continuam no histórico das OS. Se a Estação de Bipagem
          for aberta nela de novo, a tela volta a perguntar qual é a estação.</p>
        <p class="ge-dlg-txt ge-dlg-warn" *ngIf="m.terminalId === terminalAtual">
          <i class="pi pi-exclamation-triangle"></i> Esta é a máquina que você está usando agora.
        </p>
      </ng-container>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" (click)="mostrarRemocao = false"></button>
        <button pButton type="button" label="Remover máquina" icon="pi pi-trash" class="p-button-danger"
                [loading]="!!remover && salvandoMaquina === remover.terminalId" (click)="confirmarRemocao()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .fx-card { margin-top: 18px; }
    .ge-lead { font-size: 1rem; color: #e2e8f0; }
    .ge-hint { color: #475569; font-size: 0.9rem; }

    .ge-grupos { display: flex; flex-wrap: wrap; gap: 16px; }
    .ge-grupo {
      flex: 1 1 320px; position: relative; border: 1px solid #d7e0ea; border-radius: 14px; padding: 16px 16px 14px 20px;
      background: #fff; overflow: hidden; display: flex; flex-direction: column; gap: 14px;
    }
    .ge-grupo::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 5px; background: var(--stage); }
    .ge-grupo-head { display: flex; align-items: center; gap: 12px; }
    .ge-grupo-ico {
      width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; color: #fff; background: var(--stage); flex: 0 0 auto;
    }
    .ge-grupo-tit { flex: 1; min-width: 0; }
    .ge-grupo-tit h3 { margin: 0; font-family: Manrope, sans-serif; font-size: 1.05rem; font-weight: 800; color: #0b1220; }
    .ge-grupo-tit span { font-size: 0.875rem; color: #475569; }
    .ge-chip { font-size: 0.82rem; }

    .ge-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: #334155; font-weight: 700; }

    .ge-nome { display: flex; gap: 6px; margin-top: 6px; }
    .ge-field { position: relative; flex: 1; min-width: 0; display: block; }
    .ge-field > i { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.8rem; pointer-events: none; }
    .ge-field input.ge-input {
      width: 100%; font-size: 0.95rem; color: #0b1220; background: #fff; padding: 8px 10px 8px 32px;
      border: 1.5px solid #94a3b8; border-radius: 8px; transition: border-color .15s ease, box-shadow .15s ease;
    }
    .ge-field input.ge-input::placeholder { color: #64748b; opacity: 1; }
    .ge-field input.ge-input:enabled:hover { border-color: #475569; }
    .ge-field input.ge-input:enabled:focus { border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.2); outline: none; }
    .ge-field:focus-within > i { color: #0f766e; }
    .ge-nome .ge-input { font-weight: 700; }

    .ge-orig { margin-top: 6px; font-size: 0.875rem; color: #475569; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .ge-link { border: 0; background: none; color: #0f766e; font: inherit; font-weight: 700; cursor: pointer; padding: 0; text-decoration: underline; }
    .ge-link:disabled { opacity: .5; cursor: default; }

    .ge-etapas { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding-top: 12px; border-top: 1px dashed #e2e8f0; }
    .ge-etapas-tit { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; font-weight: 700; margin-right: 4px; }
    .ge-etapa { font-size: 0.875rem; padding: 3px 10px; border-radius: 999px; background: #f1f5f9; color: #1e293b; border: 1px solid #e2e8f0; }
    .ge-maq-chip { display: inline-flex; gap: 6px; align-items: center; font-weight: 600; }
    .ge-maq-chip i { font-size: 0.75rem; color: #94a3b8; }
    .ge-maq-chip.on { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
    .ge-maq-chip.on i { color: #047857; }
    .ge-vazio { font-size: 0.875rem; color: #64748b; }
    .ge-field input.ge-input.ge-input--erro { border-color: #f59e0b; }

    .ge-ajuda { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;
      font-size: 0.95rem; color: #1e293b; }
    .ge-ajuda-btn {
      display: inline-flex; align-items: center; gap: 6px; border: 1px solid #99f6e4; background: #f0fdfa; color: #0f766e; font: inherit;
      font-size: 0.875rem; font-weight: 700; padding: 6px 12px; border-radius: 999px; cursor: pointer;
    }
    .ge-ajuda-btn:hover { background: #ccfbf1; }
    .ge-ajuda-det {
      margin: 0 0 14px; padding: 12px 14px 12px 32px; border-radius: 10px; background: #f0fdfa; border: 1px solid #99f6e4;
      color: #134e4a; font-size: 0.9rem; line-height: 1.55;
    }

    .ge-table-wrap { overflow-x: auto; container-type: inline-size; }
    .ge-table { font-size: 0.95rem; }
    .ge-table th { font-size: 0.78rem; color: #334155; }
    .ge-table td { vertical-align: top; color: #0b1220; }
    .ge-table tr.ge-atual td { background: #f0fdfa; }
    .ge-table tr.ge-aberta td { border-bottom-color: transparent; }
    .ge-maq { min-width: 230px; }
    .ge-maq-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 6px; font-size: 0.875rem; color: #475569; }
    .ge-det-btn { font-size: 0.875rem; display: inline-flex; gap: 4px; align-items: center; text-decoration: none; }
    .ge-det-btn i { font-size: 0.7rem; }
    .ge-est-cell { min-width: 210px; }
    .ge-est-cell ::ng-deep .ge-dropdown { border: 1.5px solid #94a3b8; border-radius: 8px; }
    .ge-est-cell ::ng-deep .ge-dropdown:not(.p-disabled):hover { border-color: #475569; }
    .ge-est-cell ::ng-deep .ge-dropdown.p-focus { border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.2); }
    .ge-est-cell ::ng-deep .ge-dropdown .p-dropdown-label { font-size: 0.95rem; }
    .ge-aviso { display: block; margin-top: 4px; color: #b45309; font-size: 0.85rem; }
    .ge-sit { white-space: nowrap; }
    .ge-sub { font-size: 0.875rem; margin-top: 6px; color: #475569; cursor: default; }
    .ge-quem { font-weight: 600; min-width: 170px; }
    .ge-table th { white-space: nowrap; }

    .ge-acoes { display: flex; justify-content: flex-end; align-items: center; white-space: nowrap; }
    .ge-acoes .ge-btn-remover { margin-left: 18px; position: relative; }
    .ge-acoes .ge-btn-remover::before {
      content: ''; position: absolute; left: -10px; top: 15%; bottom: 15%; width: 1px; background: #e2e8f0;
    }
    @container (max-width: 1080px) {
      .ge-acoes { flex-direction: column; align-items: stretch; gap: 10px; }
      .ge-acoes .ge-btn-remover { margin-left: 0; }
      .ge-acoes .ge-btn-remover::before { left: 15%; right: 15%; top: -6px; bottom: auto; width: auto; height: 1px; }
      .ge-maq { min-width: 210px; }
      .ge-est-cell { min-width: 180px; }
      .ge-quem { min-width: 150px; }
    }
    .p-button.ge-btn-salvar:disabled { background: #f1f5f9; border-color: #e2e8f0; color: #94a3b8; opacity: 1; }
    .p-button.ge-btn-remover { background: #fff; color: #b91c1c; border: 1.5px solid #f87171; }
    .p-button.ge-btn-remover:enabled:hover { background: #dc2626; border-color: #dc2626; color: #fff; }
    .p-button.ge-btn-remover:enabled:focus { box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25); }

    .ge-det td { background: #f8fafc; padding-top: 4px; }
    .ge-det dl { margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px 20px; }
    .ge-det dt { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; font-weight: 700; }
    .ge-det dd { margin: 2px 0 0; font-size: 0.9rem; color: #0b1220; word-break: break-all; }
    .ge-det .ge-det-ua { grid-column: 1 / -1; }
    .ge-det .ge-det-ua dd { word-break: normal; color: #475569; font-size: 0.85rem; }

    .ge-head-tit { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
    .gp { display: flex; flex-direction: column; gap: 8px; }
    .gp .ge-label { margin-top: 6px; }
    .gp-opc { text-transform: none; letter-spacing: 0; font-weight: 500; color: #64748b; }
    .gp-codigo {
      width: 100%; text-align: center; font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 2.2rem; font-weight: 600;
      letter-spacing: 0.5em; padding: 10px 0 10px 0.5em; border: 1.5px solid #94a3b8; border-radius: 12px; color: #0b1220; background: #fff;
    }
    .gp-codigo::placeholder { color: #cbd5e1; }
    .gp-codigo:focus { outline: none; border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.2); }
    .gp-info { display: flex; gap: 10px; align-items: center; color: #475569; font-size: 0.9rem; }
    .gp-info--ok { align-items: flex-start; padding: 10px 12px; border-radius: 10px; background: #f0fdfa; border: 1px solid #99f6e4; color: #134e4a; }
    .gp-info--ok i { margin-top: 3px; }
    .gp-info--ok div { display: flex; flex-direction: column; gap: 2px; }
    .gp-erro { color: #b91c1c; font-size: 0.9rem; display: flex; gap: 6px; align-items: center; }
    .gp ::ng-deep .ge-dropdown { border: 1.5px solid #94a3b8; border-radius: 8px; }
    .gp ::ng-deep .ge-dropdown.p-focus { border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.2); }
    .ge-dlg-txt { margin: 0 0 10px; line-height: 1.5; }
    .ge-dlg-warn { color: #b45309; font-weight: 600; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  `]
})
export class OsFluxoEstacoesComponent implements OnInit {
  private api = inject(OsFluxoService);
  private toast = inject(MessageService);

  dados: FluxoEstacoesGestao | null = null;
  private maquinasPorEstacao: Record<string, FluxoMaquina[]> = {};
  carregando = false;
  erro = '';

  nomes: Record<string, string> = {};
  edicao: Record<string, EdicaoMaquina> = {};
  opcoesEstacao: { label: string; value: string }[] = [];

  salvandoNome: string | null = null;
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
        this.erro = e?.error?.mensagem || 'Verifique a conexão e tente novamente.';
      }
    });
  }

  private aplicar(d: FluxoEstacoesGestao): void {
    this.dados = d;
    this.nomes = {};
    for (const e of d.estacoes) this.nomes[e.codigo] = e.nome;
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
    return this.maquinasDa(estacaoCodigo).map(m => m.apelido || 'Sem nome').join(', ');
  }

  nomeAlterado(e: FluxoEstacaoGestao): boolean {
    const digitado = (this.nomes[e.codigo] || '').trim();
    if (!digitado) return e.nomePersonalizado;
    return digitado !== e.nome;
  }

  salvarNome(e: FluxoEstacaoGestao): void {
    if (!this.nomeAlterado(e) || this.salvandoNome) return;
    this.renomear(e, (this.nomes[e.codigo] || '').trim());
  }

  restaurarNome(e: FluxoEstacaoGestao): void {
    if (this.salvandoNome) return;
    this.renomear(e, '');
  }

  private renomear(e: FluxoEstacaoGestao, nome: string): void {
    this.salvandoNome = e.codigo;
    this.api.renomearEstacao(e.codigo, nome).subscribe({
      next: (d) => {
        this.salvandoNome = null;
        this.aplicar(d);
        const novo = d.estacoes.find(x => x.codigo === e.codigo)?.nome || nome;
        this.toast.add({ severity: 'success', summary: 'Estação renomeada', detail: `Agora se chama "${novo}".`, life: 3500 });
      },
      error: (err) => {
        this.salvandoNome = null;
        this.toast.add({ severity: 'error', summary: 'Não foi possível renomear', detail: err?.error?.mensagem || 'Tente novamente.', life: 6000 });
      }
    });
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
        this.toast.add({ severity: 'success', summary: 'Máquina atualizada', detail: `Estação: ${this.nomeEstacao(ed.estacaoCodigo)}.`, life: 3500 });
      },
      error: (err) => {
        this.salvandoMaquina = null;
        this.toast.add({ severity: 'error', summary: 'Não foi possível salvar', detail: err?.error?.mensagem || 'Tente novamente.', life: 6000 });
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
        this.toast.add({ severity: 'success', summary: 'Máquina removida', detail: 'Ela não é mais uma estação.', life: 3500 });
      },
      error: (err) => {
        this.salvandoMaquina = null;
        this.toast.add({ severity: 'error', summary: 'Não foi possível remover', detail: err?.error?.mensagem || 'Tente novamente.', life: 6000 });
      }
    });
  }

  abrirPareamento(): void {
    this.parCodigo = '';
    this.parInfo = null;
    this.parEstacao = null;
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
        this.erroPar = e?.error?.mensagem || 'Não foi possível consultar o código.';
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
        this.toast.add({ severity: 'success', summary: 'Máquina pareada', detail: `Agora ela é a estação ${this.nomeEstacao(estacao)}.`, life: 4000 });
      },
      error: (e) => {
        this.pareando = false;
        this.erroPar = e?.error?.mensagem || 'Não foi possível parear a máquina.';
      }
    });
  }

  alternarDetalhe(m: FluxoMaquina): void {
    this.detalhe = this.detalhe === m.terminalId ? null : m.terminalId;
  }

  relativo(data: string | Date | null | undefined): string {
    if (!data) return '';
    const min = Math.floor((Date.now() - new Date(data).getTime()) / 60000);
    if (min < 1) return 'agora mesmo';
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h} h`;
    const dias = Math.floor(h / 24);
    if (dias < 30) return dias === 1 ? 'há 1 dia' : `há ${dias} dias`;
    const meses = Math.floor(dias / 30);
    return meses === 1 ? 'há 1 mês' : `há ${meses} meses`;
  }

  estacaoExiste(codigo: string): boolean {
    return !!this.dados?.estacoes.some(e => e.codigo === codigo);
  }

  nomeEstacao(codigo: string): string {
    return this.dados?.estacoes.find(e => e.codigo === codigo)?.nome || '';
  }

  navegador(ua?: string | null): string {
    if (!ua) return 'Navegador desconhecido';
    const nav = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Navegador';
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
