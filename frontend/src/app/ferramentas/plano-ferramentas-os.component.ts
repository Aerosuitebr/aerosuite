import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { FerramentaPrevista, FerramentasService, PlanoPn, ResultadoPedidoPn } from './ferramentas.service';

@Component({
  selector: 'app-plano-ferramentas-os',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  template: `
    <section *ngIf="pn.trim() || osId" class="plano" aria-label="Ferramentas necessárias">
      <header>
        <h3>Ferramentas necessárias <small *ngIf="plano?.pn">· PN {{ plano?.pn }}</small></h3>
        <button *ngIf="osId || erro" pButton type="button" class="p-button-text p-button-sm"
                icon="pi pi-refresh" label="Atualizar" [disabled]="carregando || enviando" (click)="carregar()"></button>
      </header>
      <p *ngIf="carregando" role="status">Consultando a Ferramentaria…</p>
      <p *ngIf="erro" role="alert" class="erro">{{ erro }}</p>
      <ng-container *ngIf="plano as p">
        <p *ngIf="!p.ferramentas.length">{{ p.pn ? 'Nenhuma ferramenta vinculada a este PN.' : 'A OS está sem PN.' }}</p>
        <ul *ngIf="p.ferramentas.length">
          <li *ngFor="let item of p.ferramentas">
            <strong>{{ item.codigo }}</strong> · {{ item.descricao }}
            <small>{{ rotulos[item.situacao] }}{{ item.situacao === 'A_SOLICITAR' || item.disponibilidade !== 'Em uso' ? ' · ' + item.disponibilidade : '' }}</small>
          </li>
        </ul>
        <div *ngIf="p.podeSolicitar && pendentes" class="solicitar">
          <label>Local de uso
            <input [(ngModel)]="localizacao" [ngModelOptions]="{standalone: true}" maxlength="255" placeholder="Bancada ou setor">
          </label>
          <label>Retorno previsto (Brasília)
            <input type="datetime-local" [(ngModel)]="retorno" [ngModelOptions]="{standalone: true}">
          </label>
          <button pButton type="button" icon="pi pi-send" label="Solicitar à Ferramentaria ({{ pendentes }})"
                  [disabled]="enviando || carregando || !localizacao.trim() || !retorno" (click)="solicitar()"></button>
        </div>
        <p *ngIf="p.podeSolicitar && pendentes">Itens em uso ou bloqueados também podem entrar na fila. O balcão confirma a entrega.</p>
      </ng-container>
      <p *ngIf="aviso" role="status">{{ aviso }}</p>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .plano { margin: 1rem 0; padding: 1rem; border: 1px solid var(--surface-border, #d7dee8); border-radius: .6rem; }
    header, .solicitar { display: flex; gap: .65rem 1rem; flex-wrap: wrap; align-items: end; justify-content: space-between; }
    header { align-items: center; }
    h3, p { margin: .25rem 0; }
    ul { padding-inline-start: 1.25rem; }
    li { padding-block: .25rem; }
    li small { display: block; }
    label { display: grid; gap: .25rem; flex: 1 1 10rem; }
    input { min-width: 0; padding: .55rem; border: 1px solid var(--surface-border, #a4b2c4); border-radius: .35rem; color: inherit; background: var(--surface-ground, #fff); font: inherit; }
    .erro { color: var(--red-600, #a32222); }
  `]
})
export class PlanoFerramentasOsComponent implements OnChanges, OnDestroy {
  @Input() pn = '';
  @Input() osId: number | null = null;
  private readonly api = inject(FerramentasService);
  private consulta?: Subscription;
  private envio?: Subscription;
  plano?: PlanoPn;
  carregando = false;
  enviando = false;
  erro = '';
  aviso = '';
  localizacao = '';
  retorno = '';
  readonly rotulos: Record<FerramentaPrevista['situacao'], string> = {
    A_SOLICITAR: 'Necessária',
    SOLICITADA: 'Aguardando Ferramentaria',
    PREPARADA: 'Retirada em preparação',
    EM_CUSTODIA: 'Sob custódia nesta OS'
  };

  get pendentes() {
    return this.plano?.ferramentas.filter(f => f.situacao === 'A_SOLICITAR').length ?? 0;
  }

  ngOnChanges() {
    this.envio?.unsubscribe();
    this.enviando = false;
    this.aviso = '';
    this.localizacao = '';
    this.retorno = '';
    this.carregar();
  }

  carregar() {
    this.consulta?.unsubscribe();
    this.plano = undefined;
    this.erro = '';
    this.carregando = !!(this.pn.trim() || this.osId);
    if (!this.carregando) return;
    this.consulta = this.api.planoPn(this.pn.trim(), this.osId).subscribe({
      next: plano => { this.plano = plano; this.carregando = false; },
      error: err => {
        this.erro = err.error?.message || 'Não foi possível consultar as ferramentas.';
        this.carregando = false;
      }
    });
  }

  solicitar() {
    if (!this.osId || !this.plano?.podeSolicitar || !this.pendentes || this.enviando) return;
    this.enviando = true;
    this.erro = '';
    this.aviso = '';
    const pedido = { pn: this.plano.pn, localizacao: this.localizacao.trim(), retornoPrevisto: this.retorno };
    this.envio = this.api.post<ResultadoPedidoPn>(`/os/${this.osId}/solicitacoes-pn`, pedido).subscribe({
      next: resultado => {
        this.plano = resultado.plano;
        this.aviso = resultado.criadas ? `Solicitação enviada à Ferramentaria. Itens: ${resultado.criadas}.`
          : 'As ferramentas já estão cobertas por solicitações, retiradas ou custódia desta OS.';
        this.enviando = false;
      },
      error: err => {
        this.erro = err.error?.message || 'Não foi possível enviar a solicitação. Atualize e tente novamente.';
        this.enviando = false;
      }
    });
  }

  ngOnDestroy() {
    this.consulta?.unsubscribe();
    this.envio?.unsubscribe();
  }
}
