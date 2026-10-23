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
          <p class="fx-lead ge-lead">Organize as estações, consulte as etapas atendidas e gerencie as máquinas vinculadas.</p>
        </div>
        <div class="fx-hero-actions">
          <button type="button" class="fx-ghost-btn" (click)="carregar()" [disabled]="carregando">
            <i class="pi pi-refresh" [class.pi-spin]="carregando"></i> Atualizar
          </button>
          <a class="fx-ghost-btn" routerLink="/os/fluxo/estacao"><i class="pi pi-qrcode"></i> Estação de bipagem</a>
          <button pButton type="button" label="Nova Estação" icon="pi pi-plus" (click)="abrirEstacao()" [disabled]="!dados"></button>
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
            <span class="ge-hint">{{ d.estacoes.length }} estações · Selecione Editar para alterar um nome.</span>
          </div>
          <div class="fx-card-body">
            <div class="ge-search"><i class="pi pi-search"></i><input pInputText [(ngModel)]="buscaEstacao" aria-label="Buscar estações" placeholder="Buscar por estação, setor ou etapa" /></div>
            <div class="ge-table-wrap">
              <table class="fx-table ge-table ge-stations">
                <thead><tr><th>Nome da estação</th><th>Máquinas vinculadas</th><th>Etapas atendidas</th><th class="r">Ações</th></tr></thead>
                <tbody>
                  <tr *ngFor="let e of estacoesFiltradas; trackBy: trackEstacao">
                    <td><strong class="ge-station-name"><span class="ge-stage-dot" [style.background]="e.cor || '#334155'"></span>{{ e.nome }}</strong><small class="ge-sub ge-block">{{ e.setor }}</small></td>
                    <td><span class="fx-chip ge-chip" [ngClass]="e.maquinas ? 'fx-chip--done' : 'fx-chip--muted'">{{ e.maquinas }} {{ e.maquinas === 1 ? 'máquina' : 'máquinas' }}</span><small class="ge-sub ge-machine-summary" *ngIf="e.maquinas" [title]="nomesMaquinas(e.codigo)">{{ nomesMaquinas(e.codigo) }}</small></td>
                    <td><details class="ge-stage-details"><summary>{{ e.etapas.length }} {{ e.etapas.length === 1 ? 'etapa atendida' : 'etapas atendidas' }}</summary><ul><li *ngFor="let etapa of e.etapas">{{ etapa }}</li></ul></details></td>
                    <td><div class="ge-row-actions"><button pButton type="button" label="Editar" icon="pi pi-pencil" class="p-button-text p-button-sm" [attr.aria-label]="'Editar estação ' + e.nome" (click)="abrirEstacao(e)"></button><button pButton type="button" label="Excluir" icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" [attr.aria-label]="'Excluir estação ' + e.nome" (click)="pedirExclusaoEstacao(e)"></button></div></td>
                  </tr>
                  <tr *ngIf="!estacoesFiltradas.length"><td colspan="4" class="ge-empty">{{ d.estacoes.length ? 'Nenhuma estação encontrada para esta busca.' : 'Nenhuma estação cadastrada. Use Nova Estação para começar.' }}</td></tr>
                </tbody>
              </table>
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
              <li>Clique em <b>Editar</b> para trocar a estação ou alterar o nome da máquina e depois em <b>Salvar</b>.</li>
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
                        <strong>{{ m.apelido || 'Sem nome' }}</strong>
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
                        {{ nomeEstacao(m.estacaoCodigo) || m.estacaoNome || 'Estação indisponível' }}
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
                          <button pButton type="button" icon="pi pi-pencil" label="Editar" class="p-button-sm p-button-text" (click)="abrirMaquina(m)"></button>
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


    <p-dialog [(visible)]="mostrarEstacao" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body"
              [closable]="!salvandoEstacao" [closeOnEscape]="!salvandoEstacao" [header]="estacaoEmEdicao ? 'Editar estação' : 'Nova Estação'" [style]="{ width: '520px', maxWidth: '95vw' }">
      <div class="gp">
        <label class="ge-label" for="ge-est-nome">Nome da estação</label>
        <input pInputText id="ge-est-nome" [(ngModel)]="estacaoNome" maxlength="120" placeholder="Ex.: Oficina 6" [disabled]="salvandoEstacao" />
        <ng-container *ngIf="!estacaoEmEdicao">
          <label class="ge-label" for="ge-est-setor">Setor</label>
          <p-dropdown inputId="ge-est-setor" [options]="opcoesSetor" [(ngModel)]="estacaoSetor" appendTo="body" [style]="{ width: '100%' }" placeholder="Selecione o setor" [disabled]="salvandoEstacao"></p-dropdown>
          <small class="gp-opc">A estação atenderá as etapas do setor selecionado. Após criar, use Parear máquina para vincular os computadores.</small>
        </ng-container>
        <p class="ge-dlg-txt fx-muted" *ngIf="estacaoEmEdicao">Setor: {{ estacaoEmEdicao.setor }}. As máquinas vinculadas serão mantidas.</p>
        <small class="gp-erro" *ngIf="erroEstacao" role="alert">{{ erroEstacao }}</small>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" [disabled]="salvandoEstacao" (click)="mostrarEstacao = false"></button>
        <button pButton type="button" [label]="estacaoEmEdicao ? 'Salvar alterações' : 'Criar estação'" icon="pi pi-check" [loading]="salvandoEstacao" [disabled]="!estacaoNome.trim() || (!estacaoEmEdicao && !estacaoSetor)" (click)="salvarEstacao()"></button>
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="mostrarExcluirEstacao" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body" header="Excluir estação"
              [closable]="!excluindoEstacao" [closeOnEscape]="!excluindoEstacao" [style]="{ width: '480px', maxWidth: '95vw' }">
      <ng-container *ngIf="estacaoParaExcluir as e">
        <p class="ge-dlg-txt">Deseja excluir a estação <b>{{ e.nome }}</b>?</p>
        <p class="ge-dlg-txt ge-dlg-warn" *ngIf="e.maquinas">{{ e.maquinas }} {{ e.maquinas === 1 ? 'máquina perderá' : 'máquinas perderão' }} o vínculo e {{ e.maquinas === 1 ? 'precisará' : 'precisarão' }} de um novo pareamento para continuar a bipagem.</p>
        <p class="ge-dlg-txt fx-muted">As etapas do fluxo e o histórico das OS serão preservados.</p>
        <small class="gp-erro" *ngIf="erroExclusao" role="alert">{{ erroExclusao }}</small>
      </ng-container>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" [disabled]="excluindoEstacao" (click)="mostrarExcluirEstacao = false"></button>
        <button pButton type="button" label="Excluir estação" icon="pi pi-trash" class="p-button-danger" [loading]="excluindoEstacao" (click)="excluirEstacao()"></button>
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="mostrarEditarMaquina" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body" header="Editar máquina"
              [closable]="!salvandoMaquina" [closeOnEscape]="!salvandoMaquina" [style]="{ width: '500px', maxWidth: '95vw' }">
      <div class="gp" *ngIf="maquinaEmEdicao as m">
        <label class="ge-label" for="ge-maq-nome">Nome da máquina</label>
        <input pInputText id="ge-maq-nome" [(ngModel)]="edicao[m.terminalId].apelido" maxlength="120" [disabled]="!!salvandoMaquina" />
        <label class="ge-label" for="ge-maq-estacao">Estação</label>
        <p-dropdown inputId="ge-maq-estacao" [options]="opcoesEstacao" [(ngModel)]="edicao[m.terminalId].estacaoCodigo" optionLabel="label" optionValue="value" appendTo="body" [style]="{ width: '100%' }" [disabled]="!!salvandoMaquina"></p-dropdown>
        <small class="gp-erro" *ngIf="erroMaquina" role="alert">{{ erroMaquina }}</small>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" [disabled]="!!salvandoMaquina" (click)="mostrarEditarMaquina = false"></button>
        <button pButton type="button" label="Salvar" icon="pi pi-check" [loading]="!!salvandoMaquina" [disabled]="!maquinaEmEdicao || !maquinaAlterada(maquinaEmEdicao) || !edicao[maquinaEmEdicao.terminalId].apelido.trim() || !edicao[maquinaEmEdicao.terminalId].estacaoCodigo" (click)="maquinaEmEdicao && salvarMaquina(maquinaEmEdicao)"></button>
      </ng-template>
    </p-dialog>

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
          for aberta nela de novo, a tela exibe um novo código de pareamento.</p>
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

    .ge-chip { font-size: 0.82rem; }

    .ge-search { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; color: #64748b; }
    .ge-search input { width: min(100%, 420px); }
    .ge-stations { min-width: 700px; }
    .ge-station-name { display: flex; align-items: center; gap: 8px; }
    .ge-stage-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
    .ge-block, .ge-machine-summary { display: block; }
    .ge-machine-summary { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ge-row-actions { display: flex; justify-content: flex-end; gap: 4px; }
    .ge-stage-details summary { cursor: pointer; color: #0f766e; font-weight: 600; }
    .ge-stage-details ul { margin: 8px 0 0; padding-left: 18px; line-height: 1.6; }
    .ge-empty { padding: 28px; text-align: center; color: #64748b; }
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

  buscaEstacao = '';
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
        this.erro = e?.error?.mensagem || 'Verifique a conexão e tente novamente.';
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
    return this.maquinasDa(estacaoCodigo).map(m => m.apelido || 'Sem nome').join(', ');
  }

  get estacoesFiltradas(): FluxoEstacaoGestao[] {
    const busca = this.buscaEstacao.trim().toLocaleLowerCase('pt-BR');
    return (this.dados?.estacoes || []).filter(e => !busca || [e.nome, e.setor, ...e.etapas].join(' ').toLocaleLowerCase('pt-BR').includes(busca));
  }

  abrirEstacao(e?: FluxoEstacaoGestao): void {
    this.estacaoEmEdicao = e || null;
    this.estacaoNome = e?.nome || '';
    this.estacaoSetor = e?.setor || null;
    this.erroEstacao = '';
    this.mostrarEstacao = true;
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
        this.toast.add({ severity: 'success', summary: 'Estação salva', detail: nome, life: 3500 });
      },
      error: e => {
        this.salvandoEstacao = false;
        this.erroEstacao = e?.error?.mensagem || 'Não foi possível salvar a estação. Tente novamente.';
      }
    });
  }

  pedirExclusaoEstacao(e: FluxoEstacaoGestao): void {
    this.estacaoParaExcluir = e;
    this.erroExclusao = '';
    this.mostrarExcluirEstacao = true;
  }

  excluirEstacao(): void {
    if (!this.estacaoParaExcluir || this.excluindoEstacao) return;
    this.excluindoEstacao = true;
    this.erroExclusao = '';
    this.api.excluirEstacao(this.estacaoParaExcluir.codigo).subscribe({
      next: d => {
        this.excluindoEstacao = false;
        this.mostrarExcluirEstacao = false;
        this.estacaoParaExcluir = null;
        this.aplicar(d);
        this.toast.add({ severity: 'success', summary: 'Estação excluída', life: 3500 });
      },
      error: e => {
        this.excluindoEstacao = false;
        this.erroExclusao = e?.error?.mensagem || 'Não foi possível excluir a estação. Tente novamente.';
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
        this.toast.add({ severity: 'success', summary: 'Máquina atualizada', detail: `Estação: ${this.nomeEstacao(ed.estacaoCodigo)}.`, life: 3500 });
      },
      error: (err) => {
        this.salvandoMaquina = null;
        this.erroMaquina = err?.error?.mensagem || 'Não foi possível salvar. Tente novamente.';
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
