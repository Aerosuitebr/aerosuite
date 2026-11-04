import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FluxoEstacoesGestao, FluxoEtapaEdicao, OsFluxoService } from './os-fluxo.service';

interface RascunhoEtapa extends FluxoEtapaEdicao { chave: number; }

@Component({
  standalone: true,
  selector: 'app-os-fluxo-editor-etapas',
  imports: [CommonModule, FormsModule, DragDropModule, DialogModule, ButtonModule, InputTextModule],
  styleUrls: ['./os-fluxo-editor-etapas.component.css'],
  template: `
    <p-dialog styleClass="flow-editor" [visible]="true" [modal]="true" [draggable]="false" [resizable]="false" appendTo="body"
      header="Editar etapas do fluxo" [style]="{width:'1080px',maxWidth:'96vw'}" [closable]="!salvando" [closeOnEscape]="!salvando" (onHide)="fechar.emit()">
      <div class="flow-editor-intro"><span><i class="pi pi-sort-alt" aria-hidden="true"></i> Sequência de trabalho</span><h3>Organize o caminho de cada OS</h3><p>Arraste pelo ícone à esquerda ou use as setas. Edite os dados e insira novas etapas na posição desejada.</p></div>
      <div class="flow-impact"><i class="pi pi-info-circle" aria-hidden="true"></i><p>As mudanças valem para as etapas pendentes das OS em andamento. Etapas já realizadas não serão repetidas e OS concluídas permanecem concluídas. Os códigos de barras das etapas existentes são mantidos.</p></div>
      <ng-container *ngIf="!revisando; else revisao">
        <div class="flow-toolbar"><strong>{{ rascunho.length }} etapas no fluxo</strong><button type="button" class="flow-link" [disabled]="salvando" (click)="inserir(0)"><i class="pi pi-plus" aria-hidden="true"></i> Inserir no início</button></div>
        <div cdkDropList [cdkDropListData]="rascunho" (cdkDropListDropped)="reordenar($event)" class="flow-list" aria-label="Etapas na ordem do fluxo">
          <article class="flow-row" *ngFor="let etapa of rascunho; let i=index; trackBy:trackEtapa" cdkDrag [cdkDragDisabled]="salvando" [style.--stage-color]="etapa.cor">
            <div class="flow-row-top"><button type="button" cdkDragHandle class="flow-drag" [disabled]="salvando" [attr.aria-label]="'Arrastar etapa ' + (etapa.nome || 'nova')" title="Arraste para reordenar"><i class="pi pi-bars" aria-hidden="true"></i></button><span class="flow-position">{{ i + 1 }}</span><span class="flow-new" *ngIf="etapa.id === null">Nova etapa</span><span class="flow-row-name">{{ etapa.nome || 'Preencha o nome da etapa' }}</span><div class="flow-row-actions"><button type="button" [disabled]="salvando || i===0" (click)="mover(i,-1)" [attr.aria-label]="'Mover ' + etapa.nome + ' para cima'"><i class="pi pi-arrow-up" aria-hidden="true"></i></button><button type="button" [disabled]="salvando || i===rascunho.length-1" (click)="mover(i,1)" [attr.aria-label]="'Mover ' + etapa.nome + ' para baixo'"><i class="pi pi-arrow-down" aria-hidden="true"></i></button><button type="button" class="flow-delete" [disabled]="salvando || rascunho.length===1" (click)="remover(i)" [attr.aria-label]="'Excluir etapa ' + etapa.nome"><i class="pi pi-trash" aria-hidden="true"></i></button></div></div>
            <div class="flow-fields"><div class="flow-name-field"><label [for]="'flow-name-'+etapa.chave">Nome da etapa</label><input pInputText [id]="'flow-name-'+etapa.chave" [(ngModel)]="etapa.nome" maxlength="120" [disabled]="salvando" /></div><div><label [for]="'flow-sector-'+etapa.chave">Setor</label><select [id]="'flow-sector-'+etapa.chave" [(ngModel)]="etapa.setor" [disabled]="salvando"><option value="" disabled>Selecione</option><option *ngFor="let setor of dados.setores" [value]="setor">{{ setor }}</option></select></div><div class="flow-color-field"><label [for]="'flow-color-'+etapa.chave">Cor</label><input type="color" [id]="'flow-color-'+etapa.chave" [(ngModel)]="etapa.cor" [disabled]="salvando" /></div><div class="flow-target-field"><label [for]="'flow-target-'+etapa.chave">Meta (min)</label><input pInputText type="number" [id]="'flow-target-'+etapa.chave" [(ngModel)]="etapa.metaMinutos" min="1" max="525600" placeholder="Opcional" [disabled]="salvando" /></div></div>
            <button type="button" class="flow-insert" [disabled]="salvando" (click)="inserir(i+1,etapa.setor)"><i class="pi pi-plus" aria-hidden="true"></i> Inserir etapa após esta</button>
          </article>
        </div>
        <section class="flow-removed" *ngIf="removidas.length"><h4>Etapas que serão excluídas ({{ removidas.length }})</h4><p>O histórico é preservado. Etapas com OS em andamento precisam ter a saída registrada antes da exclusão.</p><div *ngFor="let etapa of removidas"><span>{{ etapa.nome }}</span><button type="button" class="flow-link" (click)="restaurar(etapa.id!)">Desfazer exclusão</button></div></section>
      </ng-container>
      <ng-template #revisao><section class="flow-review"><h3>Revise a nova sequência</h3><ol><li *ngFor="let etapa of rascunho"><span [style.background]="etapa.cor"></span><strong>{{ etapa.nome }}</strong><small>{{ etapa.setor }}</small></li></ol><p *ngIf="removidas.length" class="flow-delete-note">Serão excluídas: {{ nomesRemovidas }}. Os registros anteriores continuam no histórico.</p><p>As alterações serão aplicadas ao fluxo da empresa quando você confirmar.</p></section></ng-template>
      <p class="flow-error" role="alert" *ngIf="erro">{{ erro }}</p><p class="flow-validation" *ngIf="!valido && !revisando">Preencha nome, setor e cor de todas as etapas. Use nomes diferentes e metas entre 1 e 525600 minutos.</p>
      <ng-template pTemplate="footer"><div class="flow-footer"><span aria-live="polite">{{ alterado ? 'Alterações ainda não salvas' : 'Nenhuma alteração' }}</span><div><button pButton type="button" class="p-button-text" [disabled]="salvando" [label]="revisando ? 'Voltar à edição' : 'Cancelar'" (click)="revisando ? revisando=false : fechar.emit()"></button><button pButton type="button" icon="pi pi-check" [label]="revisando ? 'Aplicar alterações no fluxo' : 'Revisar alterações'" [disabled]="!valido || !alterado || !dados.versaoFluxo" [loading]="salvando" (click)="revisando ? salvar() : revisando=true"></button></div></div></ng-template>
    </p-dialog>
  `
})
export class OsFluxoEditorEtapasComponent implements OnInit {
  @Input({required:true}) dados!: FluxoEstacoesGestao;
  @Output() fechar = new EventEmitter<void>();
  @Output() salvo = new EventEmitter<FluxoEstacoesGestao>();
  private api = inject(OsFluxoService);
  rascunho: RascunhoEtapa[] = [];
  originais: RascunhoEtapa[] = [];
  removidas: RascunhoEtapa[] = [];
  salvando = false;
  revisando = false;
  erro = '';
  private proximaChave = -1;
  ngOnInit(): void {
    this.rascunho = (this.dados.etapasDisponiveis || []).map(e => ({id:e.id,chave:e.id,nome:e.nome,setor:e.setor,cor:e.cor || '#2563eb',metaMinutos:e.metaMinutos ?? null}));
    this.originais = this.rascunho.map(e => ({...e}));
  }
  get alterado(): boolean { return JSON.stringify(this.rascunho) !== JSON.stringify(this.originais); }
  get valido(): boolean {
    const nomes = this.rascunho.map(e => e.nome.trim().toLocaleLowerCase());
    return !!this.rascunho.length && new Set(nomes).size === nomes.length && this.rascunho.every(e => !!e.nome.trim() && e.nome.trim().length<=120 && (this.dados.setores || []).includes(e.setor) && /^#[0-9a-f]{6}$/i.test(e.cor) && (e.metaMinutos===null || (Number.isInteger(e.metaMinutos) && e.metaMinutos>=1 && e.metaMinutos<=525600)));
  }
  get nomesRemovidas(): string { return this.removidas.map(e=>e.nome).join(', '); }
  trackEtapa = (_:number,e:RascunhoEtapa) => e.chave;
  reordenar(event:CdkDragDrop<RascunhoEtapa[]>):void { if(!this.salvando) moveItemInArray(this.rascunho,event.previousIndex,event.currentIndex); }
  mover(index:number,delta:number):void { if(!this.salvando && index+delta>=0 && index+delta<this.rascunho.length) moveItemInArray(this.rascunho,index,index+delta); }
  inserir(index:number,setor?:string):void { this.rascunho.splice(index,0,{id:null,chave:this.proximaChave--,nome:'',setor:setor || this.dados.setores?.[0] || '',cor:'#2563eb',metaMinutos:null}); }
  remover(index:number):void { if(this.rascunho.length<=1 || this.salvando) return; const [etapa]=this.rascunho.splice(index,1); if(etapa.id!==null) this.removidas.push(etapa); }
  restaurar(id:number):void { const etapa=this.removidas.find(e=>e.id===id); if(!etapa) return; this.removidas=this.removidas.filter(e=>e.id!==id); this.rascunho.splice(Math.min(this.originais.findIndex(e=>e.id===id),this.rascunho.length),0,etapa); }
  salvar():void {
    if(this.salvando || !this.valido || !this.alterado || !this.dados.versaoFluxo) return;
    this.salvando=true; this.erro='';
    this.api.salvarFluxo(this.dados.versaoFluxo,this.rascunho.map(({chave,...e})=>({...e,nome:e.nome.trim()}))).subscribe({next:d=>{this.salvando=false;this.salvo.emit(d);this.fechar.emit();},error:e=>{this.salvando=false;this.erro=e?.error?.mensagem || e?.error?.message || 'Não foi possível salvar o fluxo. Tente novamente.';}});
  }
}
