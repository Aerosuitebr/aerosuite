import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeyboardIconComponent } from './keyboard-icon.component';

/** On-screen input only: values stay in the native field and follow its normal Angular binding. */
@Component({
  selector: 'app-teclado-virtual', standalone: true, imports: [CommonModule, KeyboardIconComponent],
  template: `
    <section class="virtual-keyboard" aria-label="Teclado virtual">
      <header><div><app-keyboard-icon></app-keyboard-icon><strong>Teclado · {{ rotulo }}</strong></div><button type="button" (click)="fechar.emit()" aria-label="Fechar teclado virtual" title="Fechar teclado virtual (Esc)"><i class="pi pi-times" aria-hidden="true"></i></button></header>
      <div class="keyboard-modes" role="group" aria-label="Tipo de teclado">
        <button type="button" [class.active]="modo==='ALFA'" [attr.aria-pressed]="modo==='ALFA'" (pointerdown)="$event.preventDefault()" (click)="modo='ALFA'">ABC</button>
        <button type="button" [class.active]="modo==='NUMERICO'" [attr.aria-pressed]="modo==='NUMERICO'" (pointerdown)="$event.preventDefault()" (click)="modo='NUMERICO'">123</button>
        <button type="button" [class.active]="modo==='SIMBOLOS'" [attr.aria-pressed]="modo==='SIMBOLOS'" (pointerdown)="$event.preventDefault()" (click)="modo='SIMBOLOS'">Símbolos</button>
        <span *ngIf="protegido"><i class="pi pi-shield" aria-hidden="true"></i> Entrada protegida</span>
      </div>
      <div class="keyboard-row" *ngFor="let linha of linhas; trackBy: trackByLinha" [style.grid-template-columns]="'repeat('+linha.length+', minmax(0, 1fr))'">
        <button type="button" *ngFor="let tecla of linha; trackBy: trackByTecla" (pointerdown)="$event.preventDefault()" (click)="inserir(tecla)" [attr.aria-label]="'Digitar '+tecla">{{ tecla }}</button>
      </div>
      <div class="keyboard-actions">
        <button type="button" *ngIf="modo!=='NUMERICO'" [class.active]="maiusculas" [attr.aria-pressed]="maiusculas" aria-label="Alternar maiúsculas" (pointerdown)="$event.preventDefault()" (click)="maiusculas=!maiusculas"><i class="pi pi-arrow-up" aria-hidden="true"></i> Aa</button>
        <button type="button" (pointerdown)="$event.preventDefault()" (click)="inserir(' ')" aria-label="Digitar espaço">Espaço</button>
        <button type="button" (pointerdown)="$event.preventDefault()" (click)="apagar()" aria-label="Apagar caractere"><i class="pi pi-delete-left" aria-hidden="true"></i> Apagar</button>
        <button type="button" class="keyboard-enter" (pointerdown)="$event.preventDefault()" (click)="confirmar.emit()" aria-label="Concluir entrada">Concluir <i class="pi pi-check" aria-hidden="true"></i></button>
      </div>
    </section>
  `,
  styleUrls: ['./teclado-virtual.component.scss']
})
export class TecladoVirtualComponent {
  @Input({required: true}) alvo!: HTMLInputElement;
  @Input() rotulo = '';
  @Input() protegido = false;
  @Output() fechar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();
  @Output() valorAlterado = new EventEmitter<string>();
  // Rows are computed arrays: preserve key nodes between pointerdown and click/touch release.
  trackByLinha(index: number) {return index;}
  trackByTecla(index: number) {return index;}
  modo: 'ALFA' | 'NUMERICO' | 'SIMBOLOS' = 'ALFA';
  maiusculas = false;
  get linhas(): string[][] {
    if(this.modo==='NUMERICO')return [['1','2','3'],['4','5','6'],['7','8','9'],['.','0','-']];
    if(this.modo==='SIMBOLOS')return [Array.from('!@#$%&*()'),Array.from('_+-=[]{}'),Array.from('.,:;?/\\'),["'",'"','<','>','|','~','`','^'],Array.from('áéíóúç'),Array.from('ãõâêôà')].map(row=>row.map(k=>this.maiusculas?k.toUpperCase():k));
    return ['1234567890','qwertyuiop','asdfghjkl','zxcvbnmç@.'].map(row=>Array.from(this.maiusculas?row.toUpperCase():row));
  }
  inserir(texto: string) { this.editar(texto,false); }
  apagar() { this.editar('',true); }
  private editar(texto: string, apagar: boolean) {
    const input=this.alvo;if(!input || input.disabled || input.readOnly)return;
    const start=input.selectionStart ?? input.value.length, end=input.selectionEnd ?? start;
    const inicio=apagar && start===end?Math.max(0,start-1):start;
    const valor=input.value.slice(0,inicio)+texto+input.value.slice(end);
    if(input.maxLength>=0 && valor.length>input.maxLength)return;
    input.value=valor;
    this.valorAlterado.emit(valor);
    input.focus({preventScroll:true});
    try{input.setSelectionRange(inicio+texto.length,inicio+texto.length);}catch{}
  }
}
