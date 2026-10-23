import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { OSService, OS, MecanicoOption } from '../core/os.service';
import { AuthService } from '../auth/auth.service';
import { OsEtiquetaDialogComponent } from './fluxo/os-etiqueta-dialog.component';

@Component({
  selector: 'app-os-execucao', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DropdownModule, InputTextareaModule, OsEtiquetaDialogComponent],
  template: `
    <section class="execucao" *ngIf="os">
      <h3>Execução da ordem de serviço</h3>
      <p><strong>Responsável:</strong> {{ os.mecanicoResponsavelNome || 'Sem atribuição' }} ·
        <strong>Execução:</strong> {{ labels[os.statusExecucao || 'NAO_INICIADA'] || os.statusExecucao }}</p>
      <div class="acoes">
        <a pButton label="Histórico do fluxo" icon="pi pi-history" [routerLink]="['/os/fluxo/os', os.id]"></a>
        <a pButton label="Não conformidades da OS" icon="pi pi-exclamation-triangle" routerLink="/conformidade/nao-conformidades" [queryParams]="{osId: os.id}"></a>
        <button pButton type="button" label="Etiqueta" icon="pi pi-print" (click)="etiqueta = true"></button>
      </div>
      <div *ngIf="podeGerir" class="atribuicao">
        <label [for]="'mecanico-' + osId">Encaminhar para</label>
        <p-dropdown [inputId]="'mecanico-' + osId" [options]="mecanicos" optionLabel="nome" optionValue="id"
                    [(ngModel)]="mecanicoId" [ngModelOptions]="{standalone:true}" placeholder="Selecione o mecânico" appendTo="body"></p-dropdown>
        <button pButton type="button" label="Encaminhar" (click)="encaminhar()" [disabled]="busy || !mecanicoId || !!os.execucaoFinalizadaEm"></button>
      </div>
      <label [for]="'observacao-execucao-' + osId">Observação / justificativa</label>
      <textarea pInputTextarea [id]="'observacao-execucao-' + osId" [(ngModel)]="observacao"
                [ngModelOptions]="{standalone:true}" maxlength="2000" rows="2"></textarea>
      <div class="acoes" *ngIf="podeExecutar">
        <button *ngIf="!os.statusExecucao || os.statusExecucao === 'NAO_INICIADA'" pButton type="button" label="Iniciar" icon="pi pi-play" (click)="executar('iniciar')" [disabled]="busy"></button>
        <button *ngIf="os.statusExecucao === 'EM_ANDAMENTO'" pButton type="button" label="Pausar" icon="pi pi-pause" (click)="executar('pausar')" [disabled]="busy"></button>
        <button *ngIf="os.statusExecucao === 'PAUSADA'" pButton type="button" label="Retomar" icon="pi pi-play" (click)="executar('retomar')" [disabled]="busy"></button>
        <button *ngIf="os.statusExecucao === 'EM_ANDAMENTO' || os.statusExecucao === 'PAUSADA'" pButton type="button" label="Finalizar execução" icon="pi pi-check" (click)="executar('finalizar')" [disabled]="busy"></button>
      </div>
      <p role="status" *ngIf="message">{{ message }}</p>
      <app-os-etiqueta-dialog [(visible)]="etiqueta" [os]="etiquetaOs"></app-os-etiqueta-dialog>
    </section>`,
  styles: [`.execucao{padding:1rem;margin:1rem 0;border:1px solid var(--surface-border);border-radius:12px}.acoes,.atribuicao{display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;margin:1rem 0}label{display:block}textarea{width:100%;margin:.5rem 0}`]
})
export class OsExecucaoComponent implements OnChanges {
  @Input() osId: number | null = null;
  @Output() osChanged = new EventEmitter<OS>();
  private api = inject(OSService);
  private auth = inject(AuthService);
  os: OS | null = null;
  mecanicos: MecanicoOption[] = [];
  mecanicoId: number | null = null;
  observacao = '';
  message = '';
  busy = false;
  etiqueta = false;
  labels: Record<string,string> = { NAO_INICIADA:'Não iniciada', EM_ANDAMENTO:'Em andamento', PAUSADA:'Pausada', FINALIZADA:'Finalizada' };
  get podeGerir() { return ['ADMIN','ADMINISTRADOR','COORDENADOR','DIRETOR'].includes(this.auth.getCurrentUser()?.perfil?.codigo?.toUpperCase() || ''); }
  get podeExecutar() { return !!this.os?.mecanicoResponsavelId && (['ADMIN','ADMINISTRADOR'].includes(this.auth.getCurrentUser()?.perfil?.codigo || '') || this.os.mecanicoResponsavelId === this.auth.getCurrentUser()?.id); }
  get etiquetaOs() { return this.os ? { id: this.os.id!, codigo: `OS${this.os.id}`, cliente: this.os.clienteNome, partNumber: this.os.partNumber, serialNumber: this.os.serialNumber } : null; }
  ngOnChanges() {
    this.os = null; this.message = ''; this.observacao = '';
    if (!this.osId) return;
    const id = this.osId;
    this.api.getById(id).subscribe({next:os => { if (this.osId === id) {this.os = os; this.mecanicoId = os.mecanicoResponsavelId ?? null;} }, error:e => this.erro(e)});
    if (this.podeGerir) this.api.listarMecanicos().subscribe({next:items => this.mecanicos = items, error:e => this.erro(e)});
  }
  encaminhar() {
    if (!this.osId || !this.mecanicoId || this.busy) return;
    this.busy = true;
    this.api.encaminhar(this.osId, this.mecanicoId, this.observacao).subscribe({next:os => this.concluido(os), error:e => this.erro(e)});
  }
  executar(acao:'iniciar'|'pausar'|'retomar'|'finalizar') {
    if (!this.osId || this.busy) return;
    this.busy = true;
    const methods = {iniciar:this.api.iniciarExecucao.bind(this.api),pausar:this.api.pausarExecucao.bind(this.api),retomar:this.api.retomarExecucao.bind(this.api),finalizar:this.api.finalizarExecucao.bind(this.api)};
    methods[acao](this.osId,this.observacao).subscribe({next:os => this.concluido(os),error:e => this.erro(e)});
  }
  private concluido(os:OS) { this.os = os; this.busy = false; this.observacao = ''; this.message = 'Operação registrada.'; this.osChanged.emit(os); }
  private erro(e:any) { this.busy = false; this.message = e?.error?.message || e?.error?.error || 'Não foi possível registrar a operação.'; }
}
