import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { PropostaCcoEmail, PropostaCcoEmailService } from '../core/proposta-cco-email.service';

interface EmailItem extends PropostaCcoEmail {
  selected?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-proposta-cco-emails',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="cco-page">
      <header class="cco-hero" [class.ready]="heroReady">
        <div class="hero-atmosphere" aria-hidden="true">
          <span class="orb orb-a"></span>
          <span class="orb orb-b"></span>
          <span class="grid-lines"></span>
          <span class="beam"></span>
        </div>

        <div class="hero-topbar">
          <a routerLink="/propostas-comerciais/new" class="back-link">
            <i class="pi pi-arrow-left"></i>
            <span>Voltar às propostas</span>
          </a>
          <div class="topbar-chip">
            <i class="pi pi-shield"></i>
            Destinatários ocultos · sem duplicatas
          </div>
        </div>

        <div class="hero-main">
          <div class="hero-copy">
            <p class="brand-mark">AeroSuite · Comercial</p>
            <h1>
              <span class="title-line">Cópia oculta</span>
              <span class="title-accent">da equipe</span>
            </h1>
            <p class="lede">
              Monte o grupo que recebe automaticamente em CCo cada proposta enviada.
              Arraste da esquerda para a direita — ou use as setas.
            </p>

            <div class="flow-strip" aria-hidden="true">
              <div class="flow-node">
                <i class="pi pi-users"></i>
                <span>Usuários</span>
              </div>
              <div class="flow-arrow">
                <span></span><span></span><span></span>
              </div>
              <div class="flow-node active">
                <i class="pi pi-eye-slash"></i>
                <span>Lista CCo</span>
              </div>
              <div class="flow-arrow">
                <span></span><span></span><span></span>
              </div>
              <div class="flow-node">
                <i class="pi pi-send"></i>
                <span>Propostas</span>
              </div>
            </div>
          </div>

          <aside class="hero-panel">
            <div class="panel-glow"></div>
            <div class="panel-label">
              <i class="pi pi-inbox"></i>
              Ativos na cópia oculta
            </div>
            <div class="panel-count">
              <span class="count-value" [attr.data-count]="cco.length">{{ cco.length }}</span>
              <span class="count-unit">e-mails</span>
            </div>
            <div class="panel-faces" *ngIf="cco.length > 0; else emptyFaces">
              <div class="face" *ngFor="let item of ccoPreview; let i = index"
                   [style.zIndex]="20 - i"
                   [style.animationDelay]="(i * 80) + 'ms'"
                   [pTooltip]="item.usuarioNome || item.email"
                   tooltipPosition="top">
                {{ iniciais(item.usuarioNome || item.email) }}
              </div>
              <div class="face more" *ngIf="cco.length > 5">+{{ cco.length - 5 }}</div>
            </div>
            <ng-template #emptyFaces>
              <p class="panel-empty">Ninguém na lista ainda — comece arrastando à esquerda.</p>
            </ng-template>
            <div class="panel-foot">
              <span><i class="pi pi-bolt"></i> Atualização automática</span>
              <span><i class="pi pi-check-circle"></i> Sem repetir endereço</span>
            </div>
          </aside>
        </div>
      </header>

      <div class="board" [class.busy]="busy">
        <section class="pane pane-source">
          <div class="pane-head">
            <div>
              <h2>Usuários do sistema</h2>
              <p>{{ filtradosDisponiveis().length }} disponíveis</p>
            </div>
          </div>
          <div class="filters">
            <span class="search-wrap">
              <i class="pi pi-search"></i>
              <input pInputText [(ngModel)]="busca" placeholder="Buscar nome, e-mail ou perfil..." />
            </span>
            <p-dropdown
              [(ngModel)]="perfilFiltro"
              [options]="perfilOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos os perfis"
              [showClear]="true"
              styleClass="perfil-dd">
            </p-dropdown>
          </div>
          <div class="list" (dragover)="onDragOver($event)" (drop)="onDropDisponiveis($event)">
            <label class="row"
                   *ngFor="let item of filtradosDisponiveis()"
                   draggable="true"
                   (dragstart)="onDragStart($event, item, 'disponivel')"
                   [class.checked]="item.selected">
              <input type="checkbox" [(ngModel)]="item.selected">
              <div class="avatar">{{ iniciais(item.usuarioNome || item.email) }}</div>
              <div class="meta">
                <strong>{{ item.usuarioNome || item.email }}</strong>
                <span>{{ item.email }}</span>
              </div>
              <em *ngIf="item.perfilNome">{{ item.perfilNome }}</em>
            </label>
            <div class="empty" *ngIf="filtradosDisponiveis().length === 0">
              Nenhum e-mail nesta coluna
            </div>
          </div>
        </section>

        <div class="bridge">
          <button pButton type="button" icon="pi pi-angle-right"
                  class="p-button-rounded transfer"
                  [disabled]="!temSelecao(disponiveis) || busy"
                  pTooltip="Enviar para CCo"
                  (click)="enviarSelecionados()"></button>
          <button pButton type="button" icon="pi pi-angle-left"
                  class="p-button-rounded p-button-outlined transfer"
                  [disabled]="!temSelecao(cco) || busy"
                  pTooltip="Retirar do CCo"
                  (click)="retirarSelecionados()"></button>
        </div>

        <section class="pane pane-target">
          <div class="pane-head">
            <div>
              <h2>Lista CCo</h2>
              <p>Enviados em todas as propostas</p>
            </div>
          </div>
          <div class="list target-list" (dragover)="onDragOver($event)" (drop)="onDropCco($event)">
            <label class="row"
                   *ngFor="let item of cco"
                   draggable="true"
                   (dragstart)="onDragStart($event, item, 'cco')"
                   [class.checked]="item.selected">
              <input type="checkbox" [(ngModel)]="item.selected">
              <div class="avatar target">{{ iniciais(item.usuarioNome || item.email) }}</div>
              <div class="meta">
                <strong>{{ item.usuarioNome || item.email }}</strong>
                <span>{{ item.email }}</span>
              </div>
              <em *ngIf="item.perfilNome">{{ item.perfilNome }}</em>
            </label>
            <div class="empty" *ngIf="cco.length === 0">
              Arraste e-mails para cá ou clique na seta
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .cco-page {
      min-height: calc(100vh - 80px);
      padding: 20px 28px 48px;
      background:
        radial-gradient(1000px 420px at 0% -5%, rgba(14, 165, 233, 0.16), transparent 60%),
        radial-gradient(800px 360px at 100% 0%, rgba(15, 118, 110, 0.12), transparent 55%),
        #e8eef3;
    }

    .cco-hero {
      position: relative;
      overflow: hidden;
      margin-bottom: 24px;
      padding: 22px 28px 28px;
      border: 1px solid rgba(15, 36, 48, 0.08);
      background:
        linear-gradient(135deg, #06222c 0%, #0a3a45 42%, #0f766e 100%);
      color: #f8fafc;
      isolation: isolate;
      transform: translateY(8px);
      opacity: 0;
      transition: opacity 0.5s ease, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .cco-hero.ready {
      opacity: 1;
      transform: translateY(0);
    }

    .hero-atmosphere {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(2px);
      animation: floatOrb 9s ease-in-out infinite;
    }
    .orb-a {
      width: 280px;
      height: 280px;
      right: -40px;
      top: -90px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.35), transparent 70%);
    }
    .orb-b {
      width: 220px;
      height: 220px;
      left: 18%;
      bottom: -120px;
      background: radial-gradient(circle, rgba(45, 212, 191, 0.28), transparent 70%);
      animation-delay: -3s;
    }
    .grid-lines {
      position: absolute;
      inset: 0;
      opacity: 0.18;
      background-image:
        linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
      background-size: 42px 42px;
      mask-image: linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent);
    }
    .beam {
      position: absolute;
      width: 55%;
      height: 140%;
      top: -20%;
      right: -8%;
      background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.08) 48%, transparent 62%);
      transform: skewX(-18deg);
      animation: beamSweep 7s ease-in-out infinite;
    }

    .hero-topbar,
    .hero-main {
      position: relative;
      z-index: 1;
    }

    .hero-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 22px;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: rgba(248, 250, 252, 0.88);
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 12px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(8px);
      transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    }
    .back-link:hover {
      background: rgba(255,255,255,0.14);
      border-color: rgba(255,255,255,0.35);
      transform: translateX(-2px);
    }
    .topbar-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: #a7f3d0;
      padding: 8px 12px;
      background: rgba(6, 78, 59, 0.35);
      border: 1px solid rgba(167, 243, 208, 0.25);
    }

    .hero-main {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.85fr);
      gap: 28px;
      align-items: end;
    }

    .brand-mark {
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #5eead4;
    }
    h1 {
      margin: 0;
      font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
      font-size: clamp(34px, 4.4vw, 52px);
      line-height: 0.95;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .title-line {
      display: block;
      color: #f8fafc;
    }
    .title-accent {
      display: block;
      color: #7dd3fc;
      margin-top: 4px;
    }
    .lede {
      max-width: 540px;
      margin: 14px 0 0;
      color: rgba(226, 232, 240, 0.88);
      font-size: 15px;
      line-height: 1.55;
    }

    .flow-strip {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 22px;
      flex-wrap: wrap;
    }
    .flow-node {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      color: rgba(248,250,252,0.82);
      font-size: 12px;
      font-weight: 600;
    }
    .flow-node i { font-size: 13px; color: #7dd3fc; }
    .flow-node.active {
      background: rgba(14, 165, 233, 0.22);
      border-color: rgba(125, 211, 252, 0.45);
      color: #fff;
      box-shadow: 0 0 0 1px rgba(125, 211, 252, 0.15);
    }
    .flow-arrow {
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }
    .flow-arrow span {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: rgba(125, 211, 252, 0.55);
      animation: pulseDot 1.4s ease-in-out infinite;
    }
    .flow-arrow span:nth-child(2) { animation-delay: 0.15s; }
    .flow-arrow span:nth-child(3) { animation-delay: 0.3s; }

    .hero-panel {
      position: relative;
      padding: 20px 22px 18px;
      background: linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05));
      border: 1px solid rgba(255,255,255,0.18);
      backdrop-filter: blur(10px);
      overflow: hidden;
      transform: translateY(12px);
      opacity: 0;
      transition: opacity 0.55s ease 0.12s, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.12s;
    }
    .cco-hero.ready .hero-panel {
      opacity: 1;
      transform: translateY(0);
    }
    .panel-glow {
      position: absolute;
      width: 180px;
      height: 180px;
      right: -40px;
      top: -60px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(56,189,248,0.35), transparent 70%);
      pointer-events: none;
    }
    .panel-label {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      color: rgba(226, 232, 240, 0.8);
      margin-bottom: 8px;
    }
    .panel-count {
      position: relative;
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 14px;
    }
    .count-value {
      font-size: 64px;
      line-height: 0.9;
      font-weight: 700;
      letter-spacing: -0.04em;
      color: #fff;
      font-variant-numeric: tabular-nums;
    }
    .count-unit {
      font-size: 14px;
      color: #a5f3fc;
      font-weight: 600;
    }
    .panel-faces {
      position: relative;
      display: flex;
      align-items: center;
      min-height: 40px;
      margin-bottom: 16px;
    }
    .face {
      width: 36px;
      height: 36px;
      margin-left: -8px;
      border-radius: 50%;
      border: 2px solid #0a3a45;
      background: linear-gradient(145deg, #0ea5e9, #0f766e);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      animation: faceIn 0.45s ease both;
    }
    .face:first-child { margin-left: 0; }
    .face.more {
      background: rgba(15, 23, 42, 0.55);
      font-size: 11px;
    }
    .panel-empty {
      position: relative;
      margin: 0 0 14px;
      font-size: 13px;
      color: rgba(226, 232, 240, 0.72);
      line-height: 1.4;
    }
    .panel-foot {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      gap: 10px 16px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.12);
      font-size: 11px;
      color: rgba(226, 232, 240, 0.75);
    }
    .panel-foot span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .panel-foot i { color: #5eead4; }

    @keyframes floatOrb {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(18px) scale(1.05); }
    }
    @keyframes beamSweep {
      0%, 100% { opacity: 0.35; transform: skewX(-18deg) translateX(0); }
      50% { opacity: 0.7; transform: skewX(-18deg) translateX(-24px); }
    }
    @keyframes pulseDot {
      0%, 100% { opacity: 0.35; transform: scale(0.85); }
      50% { opacity: 1; transform: scale(1.15); }
    }
    @keyframes faceIn {
      from { opacity: 0; transform: translateY(6px) scale(0.9); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .board {
      display: grid;
      grid-template-columns: 1fr 72px 1fr;
      gap: 12px;
      align-items: stretch;
      min-height: 560px;
    }
    .board.busy { opacity: 0.72; pointer-events: none; }
    .pane {
      background: #fff;
      border: 1px solid #d7e2ea;
      display: flex;
      flex-direction: column;
      min-height: 560px;
    }
    .pane-target { background: #f4fbf8; border-color: #9fd6c4; }
    .pane-head {
      padding: 18px 20px 8px;
      border-bottom: 1px solid #e8eef3;
    }
    .pane-head h2 { margin: 0; font-size: 18px; color: #0b1f2a; }
    .pane-head p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
    .filters {
      display: flex;
      gap: 10px;
      padding: 14px 16px;
    }
    .search-wrap {
      flex: 1;
      position: relative;
    }
    .search-wrap i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
    }
    .search-wrap input { width: 100%; padding-left: 34px; }
    .list {
      flex: 1;
      overflow: auto;
      padding: 8px 12px 16px;
      min-height: 320px;
    }
    .row {
      display: grid;
      grid-template-columns: auto auto 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 10px 12px;
      margin-bottom: 6px;
      cursor: grab;
      border: 1px solid transparent;
      background: #fff;
    }
    .pane-source .row { background: #f8fafc; }
    .row:hover, .row.checked { border-color: #0ea5e9; background: #fff; }
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #0ea5e9;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }
    .avatar.target { background: #0f766e; }
    .meta { min-width: 0; display: flex; flex-direction: column; }
    .meta strong { font-size: 13px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta span { font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    em {
      font-style: normal;
      font-size: 11px;
      color: #0f766e;
      background: #d1fae5;
      padding: 2px 8px;
      white-space: nowrap;
    }
    .empty {
      color: #94a3b8;
      text-align: center;
      padding: 48px 16px;
      font-size: 14px;
    }
    .bridge {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 12px;
    }
    :host ::ng-deep .transfer {
      width: 46px;
      height: 46px;
    }
    @media (max-width: 960px) {
      .hero-main { grid-template-columns: 1fr; }
      .board { grid-template-columns: 1fr; }
      .bridge { flex-direction: row; padding: 8px 0; }
      .hero-topbar { flex-direction: column; align-items: flex-start; }
      .cco-page { padding: 16px; }
    }
  `]
})
export class PropostaCcoEmailsComponent implements OnInit {
  private api = inject(PropostaCcoEmailService);
  private message = inject(MessageService);

  disponiveis: EmailItem[] = [];
  cco: EmailItem[] = [];
  busca = '';
  perfilFiltro: string | null = null;
  perfilOptions: { label: string; value: string }[] = [];
  busy = false;
  heroReady = false;
  private dragItem: EmailItem | null = null;
  private dragFrom: 'disponivel' | 'cco' | null = null;

  get ccoPreview(): EmailItem[] {
    return this.cco.slice(0, 5);
  }

  ngOnInit() {
    requestAnimationFrame(() => {
      this.heroReady = true;
    });
    this.recarregar();
  }

  recarregar() {
    this.busy = true;
    forkJoin({
      disponiveis: this.api.disponiveis(),
      cco: this.api.listar()
    }).subscribe({
      next: ({ disponiveis, cco }) => {
        this.disponiveis = this.ordenar(disponiveis || []);
        this.perfilOptions = [...new Set((disponiveis || []).map(i => i.perfilNome).filter((n): n is string => !!n))]
          .sort().map(nome => ({label:nome,value:nome}));
        this.cco = this.ordenar(cco || []);
        this.busy = false;
      },
      error: () => {
        this.busy = false;
        this.message.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar a lista CCo' });
      }
    });
  }

  filtradosDisponiveis(): EmailItem[] {
    const q = this.busca.trim().toLowerCase();
    return this.disponiveis.filter(item => {
      const matchPerfil = !this.perfilFiltro || item.perfilNome === this.perfilFiltro;
      if (!matchPerfil) return false;
      if (!q) return true;
      return [item.email, item.usuarioNome, item.perfilNome]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
    });
  }

  temSelecao(lista: EmailItem[]): boolean {
    return lista.some(i => i.selected);
  }

  enviarSelecionados() {
    const escolhidos = this.disponiveis.filter(i => i.selected);
    this.adicionarVarios(escolhidos);
  }

  retirarSelecionados() {
    const escolhidos = this.cco.filter(i => i.selected);
    this.removerVarios(escolhidos);
  }

  onDragStart(event: DragEvent, item: EmailItem, from: 'disponivel' | 'cco') {
    this.dragItem = item;
    this.dragFrom = from;
    event.dataTransfer?.setData('text/plain', item.email);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDropCco(event: DragEvent) {
    event.preventDefault();
    if (this.dragFrom === 'disponivel' && this.dragItem) {
      this.adicionarVarios([this.dragItem]);
    }
    this.dragItem = null;
    this.dragFrom = null;
  }

  onDropDisponiveis(event: DragEvent) {
    event.preventDefault();
    if (this.dragFrom === 'cco' && this.dragItem) {
      this.removerVarios([this.dragItem]);
    }
    this.dragItem = null;
    this.dragFrom = null;
  }

  private adicionarVarios(itens: EmailItem[]) {
    const unicos = this.dedupe(itens);
    if (unicos.length === 0) return;
    this.busy = true;
    let ok = 0;
    let fail = 0;
    const next = (index: number) => {
      if (index >= unicos.length) {
        this.busy = false;
        this.recarregar();
        if (ok && !fail) {
          this.message.add({ severity: 'success', summary: 'CCo atualizado', detail: `${ok} e-mail(s) adicionados` });
        } else if (fail) {
          this.message.add({ severity: 'warn', summary: 'Parcial', detail: `${ok} adicionados, ${fail} ignorados (duplicado ou inválido)` });
        }
        return;
      }
      const item = unicos[index];
      this.api.adicionar({
        email: item.email,
        usuarioId: item.usuarioId,
        usuarioNome: item.usuarioNome,
        perfilNome: item.perfilNome
      }).subscribe({
        next: () => { ok++; next(index + 1); },
        error: () => { fail++; next(index + 1); }
      });
    };
    next(0);
  }

  private removerVarios(itens: EmailItem[]) {
    const comId = itens.filter(i => i.id);
    if (comId.length === 0) return;
    this.busy = true;
    let ok = 0;
    let fail = 0;
    const next = (index: number) => {
      if (index >= comId.length) {
        this.busy = false;
        this.recarregar();
        if (ok && !fail) {
          this.message.add({ severity: 'success', summary: 'CCo atualizado', detail: `${ok} e-mail(s) removidos` });
        } else if (fail) {
          this.message.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível remover alguns e-mails' });
        }
        return;
      }
      this.api.remover(comId[index].id!).subscribe({
        next: () => { ok++; next(index + 1); },
        error: () => { fail++; next(index + 1); }
      });
    };
    next(0);
  }

  private dedupe(itens: EmailItem[]): EmailItem[] {
    const seen = new Set(this.cco.map(i => i.email.toLowerCase()));
    const result: EmailItem[] = [];
    for (const item of itens) {
      const key = (item.email || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(item);
    }
    return result;
  }

  private ordenar(lista: EmailItem[]): EmailItem[] {
    return [...lista].sort((a, b) =>
      (a.usuarioNome || a.email).localeCompare(b.usuarioNome || b.email, 'pt-BR')
    ).map(i => ({ ...i, selected: false }));
  }

  iniciais(nome: string): string {
    if (!nome) return '?';
    const parts = nome.replace(/@.*$/, '').split(/[\s.]+/).filter(Boolean);
    return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }
}
