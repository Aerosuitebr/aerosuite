import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { OS_FLUXO_FUNCIONALIDADE } from '../../auth/fluxo-os.guard';
import { OsFluxoPermissaoService } from './os-fluxo-permissao.service';
import { FluxoBarcodeComponent } from './fluxo-barcode.component';
import {
  FluxoEtapa, FluxoEtapaMetrica, FluxoOsResumo, OsFluxoService, codigoBarrasOs, dataIso, formatarDuracao, imprimirHtml
} from './os-fluxo.service';

interface MetaEdicao {
  etapa: FluxoEtapa;
  horas: number | null;
  minutos: number | null;
  salvando: boolean;
  metrica?: FluxoEtapaMetrica;
}

const CSS_IMPRESSAO = `
  .sheet-title { font-size: 14pt; font-weight: 800; margin: 0 0 4mm; }
  .sheet-sub { font-size: 9pt; color: #475569; margin: 0 0 6mm; }
  .cd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
  .cd-card { border: 1.5px solid #0b1220; border-radius: 8px; padding: 4mm; break-inside: avoid; page-break-inside: avoid; }
  .cd-head { display: flex; align-items: center; gap: 3mm; margin-bottom: 3mm; }
  .cd-num { width: 9mm; height: 9mm; border-radius: 2mm; display: grid; place-items: center; color: #fff; font-weight: 800; background: var(--stage, #334155); }
  .cd-name { font-size: 12pt; font-weight: 800; }
  .cd-setor { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: .08em; }
  .cd-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
  .cd-code { border-radius: 6px; padding: 2mm; text-align: center; border: 1px solid #cbd5e1; }
  .cd-code .tag { display: inline-block; font-size: 9pt; font-weight: 800; letter-spacing: .1em; padding: 1mm 3mm; border-radius: 99px; color: #fff; margin-bottom: 1mm; }
  .cd-code.in .tag { background: #047857; }
  .cd-code.out .tag { background: #b91c1c; }
  .cd-hint, .cd-actions, .no-print { display: none !important; }
  .poster { text-align: center; padding: 10mm 0; }
  .poster h1 { font-size: 30pt; margin: 0 0 2mm; }
  .poster .setor { font-size: 12pt; color: #475569; text-transform: uppercase; letter-spacing: .12em; margin-bottom: 12mm; }
  .poster .code { margin: 0 auto 14mm; width: 150mm; border: 2px solid #0b1220; border-radius: 12px; padding: 8mm; }
  .poster .code .tag { font-size: 20pt; font-weight: 800; letter-spacing: .12em; color: #fff; padding: 2mm 8mm; border-radius: 99px; display: inline-block; margin-bottom: 4mm; }
  .poster .in .tag { background: #047857; }
  .poster .out .tag { background: #b91c1c; }
  .lbl-grid-print { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
  .lbl { border: 1.5px solid #0b1220; border-radius: 8px; padding: 3mm 4mm; break-inside: avoid; page-break-inside: avoid; }
  .lbl-top { display: flex; justify-content: space-between; }
  .lbl-k { font-size: 7pt; text-transform: uppercase; letter-spacing: .12em; color: #475569; font-weight: 700; }
  .lbl-os { font-size: 15pt; font-weight: 800; }
  .lbl-brand { font-weight: 800; letter-spacing: .2em; font-size: 7pt; color: #0f766e; }
  .lbl-code { display: flex; justify-content: center; margin: 1mm 0; }
  .lbl-info { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 4mm; border-top: 1px dashed #94a3b8; padding-top: 1.5mm; }
  .lbl-info span { display: block; font-size: 6.5pt; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 700; }
  .lbl-info strong { font-size: 8.5pt; }
`;

@Component({
  standalone: true,
  selector: 'app-os-fluxo-codigos',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, InputNumberModule, InputTextareaModule, TooltipModule,
    ToastModule, FluxoBarcodeComponent],
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
          <h1>Códigos de barras e metas</h1>
          <p class="fx-lead">Imprima os códigos de ENTRADA e SAÍDA de cada etapa para as estações, gere etiquetas das OS e defina as metas de permanência usadas no painel.</p>
        </div>
        <div class="fx-hero-actions">
          <button type="button" class="fx-ghost-btn is-primary" (click)="imprimirFolha()"><i class="pi pi-print"></i> Imprimir folha de etapas</button>
          <a class="fx-ghost-btn" routerLink="/os/fluxo/estacao"><i class="pi pi-qrcode"></i> Estação de bipagem</a>
        </div>
      </header>

      <nav class="cd-nav">
        <button type="button" [class.on]="aba === 'ETAPAS'" (click)="aba = 'ETAPAS'"><i class="pi pi-th-large"></i> Códigos das etapas</button>
        <button type="button" [class.on]="aba === 'ETIQUETAS'" (click)="aba = 'ETIQUETAS'"><i class="pi pi-tags"></i> Etiquetas de OS</button>
        <button type="button" [class.on]="aba === 'METAS'" (click)="aba = 'METAS'"><i class="pi pi-flag"></i> Metas por etapa</button>
      </nav>

      <section *ngIf="aba === 'ETAPAS'">
        <div class="cd-howto fx-card">
          <div class="step"><span>1</span><p>Imprima e fixe o cartaz de cada etapa na sua estação (ou a folha completa).</p></div>
          <div class="step"><span>2</span><p>O responsável bipa a <strong>etiqueta da OS</strong> e depois <strong>ENTRADA</strong> ao começar a etapa.</p></div>
          <div class="step"><span>3</span><p>Ao terminar, bipa a OS e <strong>SAÍDA</strong>. Data, hora e usuário são registrados automaticamente.</p></div>
        </div>

        <div #folha>
          <h2 class="sheet-title print-only">Controle de fluxo da OS — códigos das etapas</h2>
          <p class="sheet-sub print-only">Bipe a etiqueta da OS e o código da etapa (ENTRADA ao iniciar, SAÍDA ao concluir).</p>
          <div class="cd-grid">
            <article class="cd-card" *ngFor="let e of etapas" [style.--stage]="e.cor || '#334155'" [attr.data-etapa]="e.id">
              <div class="cd-head">
                <span class="cd-num">{{ e.ordem }}</span>
                <div>
                  <div class="cd-name">{{ e.nome }}</div>
                  <div class="cd-setor">{{ e.setor || '—' }}</div>
                </div>
                <div class="cd-actions">
                  <button type="button" (click)="imprimirCartaz(e)" pTooltip="Cartaz A4 desta etapa"><i class="pi pi-print"></i></button>
                </div>
              </div>
              <div class="cd-pair">
                <div class="cd-code in">
                  <span class="tag">ENTRADA</span>
                  <app-fluxo-barcode [valor]="e.codigoBarrasEntrada" [altura]="56" [largura]="2.2"></app-fluxo-barcode>
                </div>
                <div class="cd-code out">
                  <span class="tag">SAÍDA</span>
                  <app-fluxo-barcode [valor]="e.codigoBarrasSaida" [altura]="56" [largura]="2.2"></app-fluxo-barcode>
                </div>
              </div>
            </article>
            <article class="cd-card cd-card--cancel" *ngIf="etapas.length">
              <div class="cd-head">
                <span class="cd-num" style="background:#475569"><i class="pi pi-times"></i></span>
                <div>
                  <div class="cd-name">Cancelar leitura</div>
                  <div class="cd-setor">Descarta a OS/etapa lida pela metade</div>
                </div>
              </div>
              <div class="cd-pair">
                <div class="cd-code">
                  <app-fluxo-barcode [valor]="'XCANCELAR'" [altura]="56" [largura]="2"></app-fluxo-barcode>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section *ngIf="aba === 'ETIQUETAS'" class="fx-card">
        <div class="fx-card-head">
          <h2>Etiquetas de OS</h2>
          <span class="fx-hint">Informe números separados por vírgula ou intervalos (ex.: 2531, 2540-2545). Máx. 60 por vez.</span>
        </div>
        <div class="fx-card-body">
          <div class="cd-lbl-form">
            <textarea pInputTextarea [(ngModel)]="listaOs" rows="2" placeholder="2531, 2540-2545"></textarea>
            <button pButton type="button" label="Gerar etiquetas" icon="pi pi-bolt" [loading]="gerando" (click)="gerarEtiquetas()"></button>
            <button pButton type="button" label="Imprimir" icon="pi pi-print" class="p-button-outlined"
                    [disabled]="!etiquetas.length" (click)="imprimirEtiquetas()"></button>
          </div>
          <div class="cd-lbl-errors" *ngIf="errosEtiquetas.length">
            <i class="pi pi-exclamation-triangle"></i> Não encontradas: {{ errosEtiquetas.join(', ') }}
          </div>
          <div #etiquetasEl class="lbl-grid-print cd-lbl-grid">
            <div class="lbl" *ngFor="let o of etiquetas">
              <div class="lbl-top">
                <div><div class="lbl-k">Ordem de serviço</div><div class="lbl-os">{{ o.codigo }}</div></div>
                <div class="lbl-brand">AEROSUITE</div>
              </div>
              <div class="lbl-code"><app-fluxo-barcode [valor]="codigoOs(o.id)" [altura]="52" [largura]="2" [tamanhoFonte]="13"></app-fluxo-barcode></div>
              <div class="lbl-info">
                <div><span>Cliente</span><strong>{{ o.cliente || '—' }}</strong></div>
                <div><span>P/N</span><strong>{{ o.partNumber || '—' }}</strong></div>
                <div><span>S/N</span><strong>{{ o.serialNumber || '—' }}</strong></div>
                <div><span>OS original</span><strong>{{ o.numOsOriginal || '—' }}</strong></div>
              </div>
            </div>
          </div>
          <div class="fx-empty" *ngIf="!etiquetas.length && !gerando"><i class="pi pi-tag"></i><span>As etiquetas geradas aparecem aqui.</span></div>
        </div>
      </section>

      <section *ngIf="aba === 'METAS'" class="fx-card">
        <div class="fx-card-head">
          <h2>Metas de permanência por etapa</h2>
          <span class="fx-hint">Referência: últimos 90 dias. {{ podeEditar ? 'Use o p90 como ponto de partida realista.' : 'Seu perfil não pode alterar metas.' }}</span>
        </div>
        <div class="cd-metas-wrap">
          <table class="fx-table">
            <thead>
              <tr>
                <th>Etapa</th><th class="r">Passagens</th><th class="r">Média</th><th class="r">Mediana</th><th class="r">p90</th>
                <th class="r">Dentro da meta</th><th>Meta (horas : minutos)</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of metas">
                <td><span class="cd-etapa" [style.--stage]="m.etapa.cor || '#334155'"><span class="sw"></span>{{ m.etapa.ordem }}. {{ m.etapa.nome }}</span></td>
                <td class="r fx-num">{{ m.metrica?.concluidas ?? 0 }}</td>
                <td class="r fx-num">{{ dur(m.metrica?.mediaSeg) }}</td>
                <td class="r fx-num">{{ dur(m.metrica?.medianaSeg) }}</td>
                <td class="r fx-num">{{ dur(m.metrica?.p90Seg) }}</td>
                <td class="r fx-num">{{ m.metrica?.noPrazoPct != null ? (m.metrica?.noPrazoPct | number:'1.0-1') + '%' : '—' }}</td>
                <td>
                  <div class="cd-meta-input">
                    <p-inputNumber [(ngModel)]="m.horas" [min]="0" [max]="2160" [disabled]="!podeEditar" placeholder="h" [inputStyle]="{ width: '72px' }"></p-inputNumber>
                    <span>:</span>
                    <p-inputNumber [(ngModel)]="m.minutos" [min]="0" [max]="59" [disabled]="!podeEditar" placeholder="min" [inputStyle]="{ width: '64px' }"></p-inputNumber>
                    <button type="button" class="cd-link" *ngIf="podeEditar && m.metrica?.p90Seg" (click)="sugerir(m)" pTooltip="Usar o p90 como meta">usar p90</button>
                  </div>
                </td>
                <td class="r">
                  <button pButton type="button" icon="pi pi-check" class="p-button-sm" [label]="'Salvar'" *ngIf="podeEditar"
                          [loading]="m.salvando" [disabled]="!alterada(m)" (click)="salvarMeta(m)"></button>
                  <button pButton type="button" icon="pi pi-times" class="p-button-sm p-button-text p-button-secondary" *ngIf="podeEditar && m.etapa.metaMinutos"
                          pTooltip="Remover meta" (click)="removerMeta(m)"></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .cd-nav { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
    .cd-nav button { font: inherit; font-weight: 700; font-size: 0.9rem; color: var(--muted); background: #fff; border: 1px solid var(--line); padding: 9px 14px; border-radius: 12px; cursor: pointer; display: inline-flex; gap: 8px; align-items: center; }
    .cd-nav button.on { background: #0f172a; color: #fff; border-color: #0f172a; }

    .cd-howto { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 14px 18px; margin-bottom: 16px; }
    @media (max-width: 900px) { .cd-howto { grid-template-columns: 1fr; } }
    .cd-howto .step { display: flex; gap: 10px; align-items: flex-start; font-size: 0.88rem; color: #334155; line-height: 1.4; }
    .cd-howto .step p { margin: 3px 0 0; }
    .cd-howto .step span { flex: 0 0 auto; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent); font-weight: 800; }

    .print-only { display: none; }
    .cd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 14px; }
    @media (max-width: 520px) { .cd-grid { grid-template-columns: 1fr; } }
    .cd-card { background: #fff; border: 1px solid var(--line); border-left: 5px solid var(--stage); border-radius: 16px; padding: 14px 16px; box-shadow: 0 6px 18px rgba(15,23,42,0.04); }
    .cd-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .cd-num { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; color: #fff; font-family: Manrope, sans-serif; font-weight: 800; background: var(--stage); }
    .cd-name { font-family: Manrope, sans-serif; font-weight: 800; font-size: 1.02rem; }
    .cd-setor { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
    .cd-actions { margin-left: auto; }
    .cd-actions button { border: 1px solid var(--line); background: #fff; border-radius: 10px; width: 34px; height: 34px; cursor: pointer; color: #334155; }
    .cd-actions button:hover { border-color: var(--accent); color: var(--accent); }
    .cd-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .cd-code { text-align: center; border: 1px solid var(--line-soft); border-radius: 12px; padding: 8px 6px 4px; background: #fff; }
    .cd-code .tag { display: inline-block; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; padding: 3px 10px; border-radius: 999px; color: #fff; margin-bottom: 4px; }
    .cd-code.in .tag { background: #047857; }
    .cd-code.out .tag { background: #b91c1c; }
    .cd-card--cancel { border-left-color: #475569; }

    .cd-lbl-form { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 14px; }
    .cd-lbl-form textarea { flex: 1 1 320px; }
    .cd-lbl-errors { color: var(--alert); font-size: 0.85rem; margin-bottom: 10px; }
    .cd-lbl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 12px; }
    .lbl { border: 2px solid #0b1220; border-radius: 12px; padding: 10px 12px; background: #fff; }
    .lbl-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .lbl-k { font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #475569; font-weight: 700; }
    .lbl-os { font-family: Manrope, sans-serif; font-size: 1.3rem; font-weight: 800; }
    .lbl-brand { font-family: Manrope, sans-serif; font-weight: 800; letter-spacing: 0.2em; font-size: 0.7rem; color: #0f766e; }
    .lbl-code { display: flex; justify-content: center; margin: 4px 0; }
    .lbl-info { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; border-top: 1px dashed #cbd5e1; padding-top: 6px; }
    .lbl-info span { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 700; }
    .lbl-info strong { font-size: 0.82rem; }

    .cd-metas-wrap { overflow: auto; padding: 0 8px 12px; }
    .cd-etapa { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; }
    .cd-etapa .sw { width: 10px; height: 10px; border-radius: 3px; background: var(--stage); }
    .cd-meta-input { display: flex; align-items: center; gap: 6px; }
    .cd-link { border: 0; background: transparent; color: var(--accent); font: inherit; font-size: 0.78rem; font-weight: 600; cursor: pointer; text-decoration: underline; }
  `]
})
export class OsFluxoCodigosComponent implements OnInit {
  private api = inject(OsFluxoService);
  private funcionalidades = inject(OsFluxoPermissaoService);
  private messages = inject(MessageService);

  @ViewChild('folha') folha?: ElementRef<HTMLElement>;
  @ViewChild('etiquetasEl') etiquetasEl?: ElementRef<HTMLElement>;

  aba: 'ETAPAS' | 'ETIQUETAS' | 'METAS' = 'ETAPAS';
  etapas: FluxoEtapa[] = [];
  metas: MetaEdicao[] = [];
  podeEditar = false;

  listaOs = '';
  etiquetas: FluxoOsResumo[] = [];
  errosEtiquetas: string[] = [];
  gerando = false;

  ngOnInit(): void {
    this.podeEditar = this.funcionalidades.has(OS_FLUXO_FUNCIONALIDADE.CODIGOS);
    this.api.etapas().subscribe({
      next: (list) => {
        this.etapas = [...(list || [])].sort((a, b) => a.ordem - b.ordem);
        this.metas = this.etapas.map(e => this.novaMeta(e));
        this.carregarReferencia();
      },
      error: (err) => this.messages.add({ severity: 'error', summary: 'Fluxo', detail: err?.error?.mensagem || 'Falha ao carregar etapas.' })
    });
  }

  private novaMeta(e: FluxoEtapa, metrica?: FluxoEtapaMetrica): MetaEdicao {
    const mm = e.metaMinutos ?? null;
    return {
      etapa: e,
      horas: mm != null ? Math.floor(mm / 60) : null,
      minutos: mm != null ? mm % 60 : null,
      salvando: false,
      metrica
    };
  }

  private carregarReferencia(): void {
    const hoje = new Date();
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 89);
    this.api.dashboard(dataIso(ini), dataIso(hoje)).subscribe({
      next: (d) => {
        const porId = new Map(d.etapas.map(m => [m.etapa.id, m]));
        this.metas.forEach(m => (m.metrica = porId.get(m.etapa.id)));
      }
    });
  }

  alterada(m: MetaEdicao): boolean {
    return this.minutosDe(m) !== (m.etapa.metaMinutos ?? null);
  }

  private minutosDe(m: MetaEdicao): number | null {
    const h = m.horas ?? 0;
    const mi = m.minutos ?? 0;
    if (m.horas == null && m.minutos == null) return null;
    const total = h * 60 + mi;
    return total > 0 ? total : null;
  }

  sugerir(m: MetaEdicao): void {
    const p90 = m.metrica?.p90Seg;
    if (!p90) return;
    const min = Math.max(1, Math.ceil(p90 / 60));
    m.horas = Math.floor(min / 60);
    m.minutos = min % 60;
  }

  salvarMeta(m: MetaEdicao): void {
    this.persistirMeta(m, this.minutosDe(m));
  }

  removerMeta(m: MetaEdicao): void {
    m.horas = null;
    m.minutos = null;
    this.persistirMeta(m, null);
  }

  private persistirMeta(m: MetaEdicao, minutos: number | null): void {
    m.salvando = true;
    this.api.atualizarMeta(m.etapa.id, minutos).subscribe({
      next: (e) => {
        const metrica = m.metrica;
        Object.assign(m, this.novaMeta(e, metrica));
        this.etapas = this.etapas.map(x => (x.id === e.id ? e : x));
        this.messages.add({ severity: 'success', summary: 'Meta salva', detail: `${e.nome}: ${e.metaMinutos ? formatarDuracao(e.metaMinutos * 60) : 'sem meta'}` });
      },
      error: (err) => {
        m.salvando = false;
        this.messages.add({ severity: 'error', summary: 'Meta', detail: err?.error?.mensagem || 'Falha ao salvar a meta.' });
      }
    });
  }

  gerarEtiquetas(): void {
    const ids = this.parseLista(this.listaOs);
    if (!ids.length) {
      this.messages.add({ severity: 'warn', summary: 'Etiquetas', detail: 'Informe ao menos um número de OS válido.' });
      return;
    }
    if (ids.length > 60) {
      this.messages.add({ severity: 'warn', summary: 'Etiquetas', detail: 'Máximo de 60 etiquetas por vez.' });
      return;
    }
    this.gerando = true;
    forkJoin(ids.map(id => this.api.estado(String(id)).pipe(
      map(e => ({ id, os: e.os as FluxoOsResumo | null })),
      catchError(() => of({ id, os: null as FluxoOsResumo | null }))
    ))).subscribe(res => {
      this.gerando = false;
      this.etiquetas = res.filter(r => !!r.os).map(r => r.os!) ;
      this.errosEtiquetas = res.filter(r => !r.os).map(r => String(r.id));
    });
  }

  private parseLista(txt: string): number[] {
    const out = new Set<number>();
    for (const parte of (txt || '').split(/[,;\s]+/).map(s => s.trim()).filter(Boolean)) {
      const faixa = /^(\d{1,9})-(\d{1,9})$/.exec(parte);
      if (faixa) {
        const a = Number(faixa[1]);
        const b = Number(faixa[2]);
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        if (hi - lo > 200) continue;
        for (let i = lo; i <= hi; i++) out.add(i);
        continue;
      }
      const m = /^(?:OS|BEL-?)?0*(\d{1,9})(?:\/\d{2,4})?$/i.exec(parte);
      if (m) out.add(Number(m[1]));
    }
    return [...out].filter(n => n > 0);
  }

  imprimirFolha(): void {
    this.aba = 'ETAPAS';
    setTimeout(() => {
      const el = this.folha?.nativeElement;
      if (!el) return;
      imprimirHtml('Códigos das etapas do fluxo', el.innerHTML, CSS_IMPRESSAO + ' .print-only { display: block; }');
    }, 50);
  }

  imprimirCartaz(e: FluxoEtapa): void {
    const card = this.folha?.nativeElement.querySelector(`.cd-card[data-etapa="${e.id}"]`);
    const svgs = card ? Array.from(card.querySelectorAll('svg')).map(s => s.outerHTML) : [];
    if (svgs.length < 2) return;
    const html = `
      <div class="poster">
        <div class="setor">Etapa ${e.ordem} · ${e.setor || ''}</div>
        <h1>${e.nome}</h1>
        <div class="setor">Estação de bipagem</div>
        <div class="code in"><span class="tag">ENTRADA</span><div>${svgs[0]}</div></div>
        <div class="code out"><span class="tag">SAÍDA</span><div>${svgs[1]}</div></div>
      </div>`;
    imprimirHtml(`Cartaz ${e.nome}`, html, CSS_IMPRESSAO + ' .poster svg { width: 100%; height: auto; }');
  }

  imprimirEtiquetas(): void {
    const el = this.etiquetasEl?.nativeElement;
    if (!el) return;
    imprimirHtml('Etiquetas de OS', `<div class="lbl-grid-print">${el.innerHTML}</div>`, CSS_IMPRESSAO);
  }

  codigoOs(id: number): string {
    return codigoBarrasOs(id);
  }

  dur(s?: number | null): string {
    return formatarDuracao(s);
  }
}
