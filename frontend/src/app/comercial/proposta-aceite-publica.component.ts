import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import {
  PropostaAceitePublica,
  PropostaAceitePublicaService,
  ServicosFlags
} from './proposta-aceite-publica.service';

@Component({
  standalone: true,
  selector: 'app-proposta-aceite-publica',
  imports: [
    CommonModule, FormsModule, ButtonModule, CheckboxModule, InputTextModule,
    InputTextareaModule, RadioButtonModule, ProgressSpinnerModule, MessageModule
  ],
  template: `
    <div class="aceite-page">
      <header class="timbre">

        <div class="empresa">
          <div class="nome">{{ proposta?.oficinaNome || 'Proposta comercial' }}</div>
          <div class="com">Solicitação de serviços</div>
        </div>

      </header>
      <div class="timbre-line"></div>

      <div class="loading" *ngIf="carregando">
        <p-progressSpinner strokeWidth="3"></p-progressSpinner>
        <p>Carregando proposta…</p>
      </div>

      <div class="erro" *ngIf="!carregando && erro">
        <p-message severity="error" [text]="erro"></p-message>
      </div>

      <ng-container *ngIf="!carregando && proposta && !erro">
        <div class="doc-head">
          <div>
            <p class="eyebrow">Autorização do cliente</p>
            <h1>Proposta Comercial</h1>
            <p class="sub">{{ proposta.numeroProposta }} · {{ proposta.clienteNome }}</p>
            <span class="moeda-badge" [class.brl]="isBrl(proposta)" [class.usd]="!isBrl(proposta)">
              Proposta em {{ moedaNome(proposta) }}
            </span>
          </div>
          <div class="steps" *ngIf="proposta.podeEditar">
            <button type="button" [class.active]="passo===1" (click)="passo=1">1. Proposta</button>
            <button type="button" [class.active]="passo===2" (click)="passo=2">2. Solicitação</button>
            <button type="button" [class.active]="passo===3" (click)="passo=3">3. Aceite</button>
          </div>
        </div>

        <p-message *ngIf="mensagemBloqueio" [severity]="proposta.aceiteStatus==='ACEITA' ? 'success' : 'warn'" [text]="mensagemBloqueio" styleClass="mb"></p-message>

        <!-- ETAPA 1 -->
        <section class="card" *ngIf="passo===1 || !proposta.podeEditar">
          <h2>Resumo da proposta</h2>
          <div class="grid-2">
            <div><span>Validade</span><strong>{{ proposta.validadeProposta | date:'dd/MM/yyyy' }}</strong></div>
            <div><span>Prazo</span><strong>{{ proposta.prazoEntrega || 'A combinar' }}</strong></div>
            <div><span>Pagamento</span><strong>{{ proposta.formaPagamento || 'A combinar' }}</strong></div>
            <div><span>Moeda</span><strong>{{ moedaNome(proposta) }}</strong></div>
            <div class="full"><span>Total ({{ moedaLabel(proposta) }})</span><strong class="total-destaque">{{ formatMoney(proposta) }}</strong></div>
          </div>

          <table class="itens" *ngIf="proposta.itens?.length">
            <thead><tr><th>Item</th><th>P/N</th><th>Qtd</th><th>Total ({{ moedaLabel(proposta) }})</th></tr></thead>
            <tbody>
              <tr *ngFor="let i of proposta.itens">
                <td>
                  <strong>{{ i.produtoNome }}</strong>
                  <div class="item-desc" *ngIf="i.produtoDescricao">{{ i.produtoDescricao }}</div>
                </td>
                <td>{{ i.produtoPn || '—' }}</td>
                <td>{{ i.quantidade }}</td>
                <td>{{ formatItemTotal(i.valorTotal, proposta) }}</td>
              </tr>
            </tbody>
          </table>

          <details class="conds" *ngIf="proposta.condicoesGerais?.length">
            <summary>Condições gerais</summary>
            <ol>
              <li *ngFor="let c of proposta.condicoesGerais">{{ c }}</li>
            </ol>
          </details>

          <div class="actions" *ngIf="proposta.podeEditar">
            <button pButton type="button" label="Continuar para solicitação" icon="pi pi-arrow-right" iconPos="right" (click)="passo=2"></button>
          </div>
        </section>

        <!-- ETAPA 2 -->
        <section class="card" *ngIf="passo===2 && proposta.podeEditar">
          <div class="section-label">FORM-MNT-045</div>
          <h2>Solicitação de serviços</h2>
          <p class="hint">Confirme ou complete os dados do equipamento. Campos já preenchidos pelo comercial podem ser ajustados.</p>

          <div class="form-grid">
            <label>Artigo<input pInputText [(ngModel)]="form.produtoNome"></label>
            <label>Prefixo da aeronave<input pInputText [(ngModel)]="form.aeronavePrefixo"></label>
            <label>Modelo do motor<input pInputText [(ngModel)]="form.modeloMotor"></label>
            <label>P/N do motor<input pInputText [(ngModel)]="form.pnMotor"></label>
            <label>P/N do artigo<input pInputText [(ngModel)]="form.produtoPn"></label>
            <label>S/N do artigo<input pInputText [(ngModel)]="form.produtoSn"></label>
            <label>TSN<input pInputText [(ngModel)]="form.tsn"></label>
            <label>TSO<input pInputText [(ngModel)]="form.tso"></label>
            <label>CSN<input pInputText [(ngModel)]="form.csn"></label>
            <label>CSO<input pInputText [(ngModel)]="form.cso"></label>
            <label class="full">Tempo desde o último HSI (horas)<input pInputText [(ngModel)]="form.tempoDesdeHsi"></label>
          </div>

          <fieldset class="checks">
            <legend>Serviço a ser executado</legend>
            <label><input type="checkbox" [(ngModel)]="flags.inspecao1800"> Inspeção 1800H</label>
            <label><input type="checkbox" [(ngModel)]="flags.revisaoGeral"> Revisão geral</label>
            <label><input type="checkbox" [(ngModel)]="flags.hsi"> HSI</label>
            <label><input type="checkbox" [(ngModel)]="flags.teste"> Teste</label>
            <label><input type="checkbox" [(ngModel)]="flags.pesquisaPane"> Pesquisa de pane</label>
          </fieldset>

          <label class="block">Reporte do cliente
            <textarea pInputTextarea rows="3" [(ngModel)]="form.reporteCliente"></textarea>
          </label>

          <fieldset class="checks">
            <legend>Declaração sobre o equipamento</legend>
            <div class="radio-row">
              <span>O equipamento sofreu algum incidente/acidente?</span>
              <label><input type="radio" name="inc" [value]="true" [(ngModel)]="form.incidenteAcidente"> Sim</label>
              <label><input type="radio" name="inc" [value]="false" [(ngModel)]="form.incidenteAcidente"> Não</label>
            </div>
            <div class="radio-row" *ngIf="form.incidenteAcidente === true">
              <span>Se sim, foi submerso em água?</span>
              <label><input type="radio" name="sub" [value]="true" [(ngModel)]="form.submersoAgua"> Sim</label>
              <label><input type="radio" name="sub" [value]="false" [(ngModel)]="form.submersoAgua"> Não</label>
            </div>
            <label class="block" *ngIf="form.incidenteAcidente === true">Descreva o incidente/acidente
              <textarea pInputTextarea rows="3" [(ngModel)]="form.descricaoIncidente" required></textarea>
            </label>
          </fieldset>

          <div class="form-grid">
            <label>Solicitante — nome completo<input pInputText [(ngModel)]="form.solicitanteNome"></label>
            <label>Cargo<input pInputText [(ngModel)]="form.solicitanteCargo"></label>
            <label>Empresa<input pInputText [(ngModel)]="form.solicitanteEmpresa"></label>
            <label>Data<input type="date" [(ngModel)]="form.solicitanteData"></label>
          </div>

          <p class="field-error" *ngIf="erroForm">{{ erroForm }}</p>
          <div class="actions">
            <button pButton type="button" class="p-button-text" label="Voltar" (click)="passo=1" [disabled]="ocupado"></button>
            <button pButton type="button" label="Salvar e continuar" icon="pi pi-arrow-right" iconPos="right" (click)="salvarSolicitacao()" [loading]="ocupado"></button>
          </div>
        </section>

        <!-- ETAPA 3 -->
        <section class="card" *ngIf="passo===3 && proposta.podeEditar">
          <h2>Aceite e autorização</h2>
          <p class="hint">Ao autorizar, você confirma os dados da solicitação e autoriza a oficina a executar o serviço conforme esta proposta.</p>

          <div class="form-grid">
            <label>Nome completo *<input pInputText [(ngModel)]="aceite.nome"></label>
            <label>E-mail<input pInputText [(ngModel)]="aceite.email"></label>
            <label>Cargo<input pInputText [(ngModel)]="aceite.cargo"></label>
            <label>Empresa<input pInputText [(ngModel)]="aceite.empresa"></label>
          </div>

          <label class="check-legal">
            <input type="checkbox" [(ngModel)]="aceite.declaracao">
            Confirmo que sou o responsável pelo preenchimento e declaro que as informações prestadas são verdadeiras.
          </label>
          <label class="check-legal">
            <input type="checkbox" [(ngModel)]="aceite.autorizacao">
            Autorizo a execução do serviço conforme a proposta {{ proposta.numeroProposta }}.
          </label>

          <p class="field-error" *ngIf="erroForm">{{ erroForm }}</p>
          <div class="actions">
            <button pButton type="button" class="p-button-text" label="Voltar" (click)="passo=2" [disabled]="ocupado"></button>
            <button pButton type="button" class="p-button-outlined p-button-danger" label="Recusar" (click)="mostrarRecusa=true" [disabled]="ocupado"></button>
            <button pButton type="button" label="Aceitar e autorizar execução" icon="pi pi-check" (click)="aceitar()" [loading]="ocupado"></button>
          </div>

          <div class="recusa" *ngIf="mostrarRecusa">
            <label>Motivo da recusa *
              <textarea pInputTextarea rows="3" [(ngModel)]="aceite.motivo"></textarea>
            </label>
            <button pButton type="button" class="p-button-danger" label="Confirmar recusa" (click)="recusar()" [loading]="ocupado"></button>
          </div>
        </section>

        <!-- LEITURA APÓS ACEITE -->
        <section class="card success-card" *ngIf="!proposta.podeEditar && proposta.aceiteStatus==='ACEITA'">
          <h2>Autorização registrada</h2>
          <div class="grid-2">
            <div><span>Responsável</span><strong>{{ proposta.aceiteNome }}</strong></div>
            <div><span>Empresa</span><strong>{{ proposta.aceiteEmpresa || '—' }}</strong></div>
            <div><span>Cargo</span><strong>{{ proposta.aceiteCargo || '—' }}</strong></div>
            <div><span>Data</span><strong>{{ proposta.aceitoEm | date:'dd/MM/yyyy HH:mm' }}</strong></div>
          </div>
        </section>
      </ng-container>

      <footer class="rodape">
        <div>CNPJ nº 26.677.515/0001-14 – IE: 87.285.928 – IM: 1.035.119-7.</div>
        <div>{{ proposta?.oficinaNome }} · {{ proposta?.oficinaContato }}</div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display:block; min-height:100vh; background:linear-gradient(180deg,#eef2f7 0%,#f8fafc 40%,#fff 100%); color:#1e293b; font-family:Verdana,Arial,sans-serif; }
    .aceite-page { max-width:920px; margin:0 auto; padding:28px 20px 48px; }
    .timbre { display:grid; grid-template-columns:72px 1fr auto; gap:16px; align-items:center; }
    .timbre .logo { width:64px; height:64px; object-fit:contain; }
    .timbre .selo { height:52px; width:auto; }
    .timbre .nome { font-size:15px; font-weight:700; color:#1F3864; text-align:center; }
    .timbre .com { font-size:12px; font-weight:700; color:#2F5496; text-align:center; margin-top:2px; }
    .timbre-line { height:2px; background:#0000CC; margin:12px 0 24px; }
    .doc-head { display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:18px; }
    .eyebrow { margin:0; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#64748b; }
    h1 { margin:4px 0; font-size:26px; color:#1F3864; }
    .sub { margin:0; color:#64748b; }
    .steps { display:flex; gap:6px; flex-wrap:wrap; }
    .steps button { border:1px solid #cbd5e1; background:#fff; color:#475569; border-radius:999px; padding:8px 12px; font-size:12px; cursor:pointer; }
    .steps button.active { background:#1F3864; border-color:#1F3864; color:#fff; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:22px; margin-bottom:16px; box-shadow:0 1px 0 rgba(15,23,42,.04); }
    .section-label { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#2F5496; font-weight:700; }
    h2 { margin:4px 0 12px; font-size:18px; color:#1F3864; }
    .hint { margin:0 0 16px; color:#64748b; font-size:13px; line-height:1.45; }
    .moeda-badge { display:inline-block; margin-top:10px; padding:5px 12px; border-radius:999px; font-size:12px; font-weight:700; letter-spacing:.02em; }
    .moeda-badge.brl { background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; }
    .moeda-badge.usd { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
    .grid-2 { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
    .grid-2 .full { grid-column:1 / -1; }
    .grid-2 span { display:block; font-size:11px; color:#64748b; }
    .grid-2 strong { font-size:14px; color:#0f172a; }
    .total-destaque { font-size:22px !important; color:#1F3864 !important; }
    .itens { width:100%; border-collapse:collapse; font-size:13px; margin:8px 0 16px; }
    .itens th,.itens td { border-bottom:1px solid #e2e8f0; padding:8px 6px; text-align:left; vertical-align:top; }
    .item-desc { margin-top:4px; font-size:12px; color:#64748b; font-weight:400; white-space:pre-line; }
    .conds { margin-top:8px; color:#475569; font-size:12px; }
    .conds ol { padding-left:18px; }
    .form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-bottom:14px; }
    .form-grid label, .block { display:flex; flex-direction:column; gap:6px; font-size:12px; color:#334155; font-weight:600; }
    .form-grid label.full, .block { grid-column:1 / -1; }
    .form-grid input, .block textarea, .recusa textarea { font-weight:400; }
    .checks { border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin:0 0 14px; }
    .checks legend { padding:0 6px; color:#1F3864; font-weight:700; font-size:12px; }
    .checks label { display:inline-flex; align-items:center; gap:8px; margin:6px 12px 6px 0; font-size:13px; font-weight:500; color:#334155; }
    .radio-row { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin:8px 0; font-size:13px; }
    .check-legal { display:flex; gap:10px; align-items:flex-start; margin:10px 0; font-size:13px; line-height:1.4; color:#334155; }
    .actions { display:flex; flex-wrap:wrap; gap:10px; justify-content:flex-end; margin-top:18px; }
    .field-error { color:#b91c1c; font-size:13px; margin:8px 0 0; }
    .recusa { margin-top:16px; padding-top:16px; border-top:1px dashed #e2e8f0; }
    .rodape { margin-top:28px; padding-top:14px; border-top:1px solid #cbd5e1; font-size:11px; color:#2F5496; line-height:1.5; }
    .loading, .erro { text-align:center; padding:48px 12px; }
    .mb { display:block; margin-bottom:14px; }
    @media (max-width:700px) {
      .timbre { grid-template-columns:56px 1fr; }
      .timbre .selo { display:none; }
      .form-grid, .grid-2 { grid-template-columns:1fr; }
      .actions { justify-content:stretch; }
      .actions button { width:100%; }
    }
  `]
})
export class PropostaAceitePublicaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(PropostaAceitePublicaService);

  token = '';
  proposta?: PropostaAceitePublica;
  carregando = true;
  ocupado = false;
  erro = '';
  erroForm = '';
  passo = 1;
  mostrarRecusa = false;

  form: any = {};
  flags: ServicosFlags = { inspecao1800: false, revisaoGeral: false, hsi: false, teste: false, pesquisaPane: false };
  aceite: any = { nome: '', email: '', cargo: '', empresa: '', declaracao: false, autorizacao: false, motivo: '' };

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.carregando = false;
      this.erro = 'Link inválido.';
      return;
    }
    this.api.get(this.token).subscribe({
      next: (p) => {
        this.proposta = p;
        this.hydrate(p);
        this.carregando = false;
        if (!p.podeEditar) this.passo = 1;
      },
      error: (e) => {
        this.carregando = false;
        this.erro = e?.error?.message || 'Não foi possível carregar a proposta.';
      }
    });
  }

  hydrate(p: PropostaAceitePublica) {
    this.form = {
      produtoNome: p.produtoNome || '',
      produtoPn: p.produtoPn || '',
      produtoSn: p.produtoSn || '',
      aeronavePrefixo: p.aeronavePrefixo || '',
      modeloMotor: p.modeloMotor || p.aplicacaoMotor || '',
      pnMotor: p.pnMotor || '',
      tsn: p.tsn || '',
      tso: p.tso || '',
      csn: p.csn || '',
      cso: p.cso || '',
      tempoDesdeHsi: p.tempoDesdeHsi || '',
      reporteCliente: p.reporteCliente || '',
      incidenteAcidente: p.incidenteAcidente ?? null,
      submersoAgua: p.submersoAgua ?? null,
      descricaoIncidente: p.descricaoIncidente || '',
      solicitanteNome: p.solicitanteNome || p.clienteContato || '',
      solicitanteEmpresa: p.solicitanteEmpresa || p.clienteNome || '',
      solicitanteCargo: p.solicitanteCargo || '',
      solicitanteData: p.solicitanteData || new Date().toISOString().slice(0, 10)
    };
    this.flags = this.api.parseFlags(p.servicosFlags);
    this.aceite.nome = this.form.solicitanteNome;
    this.aceite.empresa = this.form.solicitanteEmpresa;
    this.aceite.cargo = this.form.solicitanteCargo;
  }

  get mensagemBloqueio(): string {
    if (!this.proposta || this.proposta.podeEditar) return '';
    if (this.proposta.mensagem) return this.proposta.mensagem;
    const st = (this.proposta.status || '').toUpperCase();
    if (st === 'RASCUNHO') {
      return 'Esta proposta ainda está em rascunho. O comercial precisa enviar/liberar a proposta para você preencher a solicitação e autorizar.';
    }
    if (st && st !== 'ENVIADA') {
      return 'Esta proposta não está disponível para autorização no momento (status: ' + st + ').';
    }
    return '';
  }

  isBrl(p?: PropostaAceitePublica | null): boolean {
    return !!p && (p.moedaExibicao || '').toUpperCase() === 'BRL';
  }

  moedaLabel(p?: PropostaAceitePublica | null): string {
    return p?.moedaExibicao || 'USD';
  }

  moedaNome(p?: PropostaAceitePublica | null): string {
    return p?.moedaExibicao === 'EUR' ? 'Euro (EUR)' : this.isBrl(p) ? 'Real (BRL)' : 'Dólar (USD)';
  }

  /** Itens são persistidos em USD; converte quando a proposta é exibida em BRL. */
  toMoedaExibicao(valorUsd: number | null | undefined, p?: PropostaAceitePublica | null): number {
    const usd = Number(valorUsd || 0);
    if (p?.moedaExibicao === 'EUR' && p.totalGeralUsd) return usd * Number(p.totalGeralExibicao || 0) / p.totalGeralUsd;
    if (!this.isBrl(p)) return usd;
    const cotacao = Number(p?.cotacaoDolar || 0);
    if (cotacao > 0) return Math.round(usd * cotacao * 100) / 100;
    return usd;
  }

  formatItemTotal(valorUsd: number | null | undefined, p?: PropostaAceitePublica | null): string {
    const valor = this.toMoedaExibicao(valorUsd, p);
    const prefix = p?.moedaExibicao === 'EUR' ? '€ ' : this.isBrl(p) ? 'R$ ' : 'US$ ';
    return prefix + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatMoney(p: PropostaAceitePublica): string {
    const moeda = (p.moedaExibicao || 'USD').toUpperCase();
    const valor = p.totalGeralExibicao ?? p.totalGeralUsd ?? 0;
    const prefix = moeda === 'EUR' ? '€ ' : moeda === 'BRL' ? 'R$ ' : 'US$ ';
    return prefix + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  salvarSolicitacao() {
    this.erroForm = '';
    if (this.form.incidenteAcidente === true) {
      if (this.form.submersoAgua === null || this.form.submersoAgua === undefined) {
        this.erroForm = 'Informe se o equipamento foi submerso em água.';
        return;
      }
      if (!this.form.descricaoIncidente?.trim()) {
        this.erroForm = 'Descreva o incidente/acidente.';
        return;
      }
    }
    this.ocupado = true;
    const body = {
      ...this.form,
      servicosFlags: this.api.flagsToJson(this.flags),
      servicoExecutado: this.api.flagsToLabel(this.flags) || this.form.servicoExecutado
    };
    this.api.salvarSolicitacao(this.token, body).subscribe({
      next: (p) => {
        this.proposta = p;
        this.hydrate(p);
        this.ocupado = false;
        this.passo = 3;
      },
      error: (e) => {
        this.ocupado = false;
        this.erroForm = e?.error?.message || 'Não foi possível salvar a solicitação.';
      }
    });
  }

  aceitar() {
    this.erroForm = '';
    if (!this.aceite.nome?.trim()) { this.erroForm = 'Informe o nome completo.'; return; }
    if (!this.aceite.declaracao) { this.erroForm = 'Confirme a declaração de responsabilidade.'; return; }
    if (!this.aceite.autorizacao) { this.erroForm = 'Confirme a autorização de execução.'; return; }
    this.ocupado = true;
    this.api.aceitar(this.token, this.aceite).subscribe({
      next: (p) => {
        this.proposta = p;
        this.ocupado = false;
        this.passo = 1;
      },
      error: (e) => {
        this.ocupado = false;
        this.erroForm = e?.error?.message || 'Não foi possível registrar o aceite.';
      }
    });
  }

  recusar() {
    this.erroForm = '';
    if (!this.aceite.motivo?.trim()) { this.erroForm = 'Informe o motivo da recusa.'; return; }
    this.ocupado = true;
    this.api.recusar(this.token, this.aceite).subscribe({
      next: (p) => {
        this.proposta = p;
        this.ocupado = false;
        this.mostrarRecusa = false;
      },
      error: (e) => {
        this.ocupado = false;
        this.erroForm = e?.error?.message || 'Não foi possível registrar a recusa.';
      }
    });
  }
}
