import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FluxoBarcodeComponent } from './fluxo-barcode.component';
import { codigoBarrasOs, imprimirHtml } from './os-fluxo.service';

export interface EtiquetaOs {
  id: number;
  codigo: string;
  cliente?: string | null;
  partNumber?: string | null;
  serialNumber?: string | null;
  numOsOriginal?: string | null;
}

export const CSS_ETIQUETA_OS = `
  .lbl { width: 95mm; border: 2px solid #0b1220; border-radius: 10px; padding: 10px 12px; }
  .lbl-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .lbl-k { font-size: 8pt; text-transform: uppercase; letter-spacing: .12em; color: #475569; font-weight: 700; }
  .lbl-os { font-size: 18pt; font-weight: 800; }
  .lbl-brand { font-weight: 800; letter-spacing: .2em; font-size: 8pt; color: #0f766e; }
  .lbl-code { display: flex; justify-content: center; margin: 6px 0; }
  .lbl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; border-top: 1px dashed #94a3b8; padding-top: 6px; }
  .lbl-grid span { display: block; font-size: 7pt; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 700; }
  .lbl-grid strong { font-size: 9pt; }
`;

@Component({
  standalone: true,
  selector: 'app-os-etiqueta-dialog',
  imports: [CommonModule, SharedModule, ButtonModule, DialogModule, FluxoBarcodeComponent],
  template: `
    <p-dialog [visible]="visible" (visibleChange)="visibleChange.emit($event)" [modal]="true" [draggable]="false" [resizable]="false"
              [header]="titulo" [style]="{ width: '520px', maxWidth: '95vw' }" appendTo="body">
      <div class="et-aviso" *ngIf="aviso"><i class="pi pi-check-circle"></i><span>{{ aviso }}</span></div>
      <div #etiqueta *ngIf="os as o">
        <div class="lbl">
          <div class="lbl-top">
            <div>
              <div class="lbl-k">Ordem de serviço</div>
              <div class="lbl-os">{{ o.codigo }}</div>
            </div>
            <div class="lbl-brand">AEROSUITE</div>
          </div>
          <div class="lbl-code"><app-fluxo-barcode [valor]="codigoBarras(o.id)" [altura]="70" [largura]="2.4" [tamanhoFonte]="16"></app-fluxo-barcode></div>
          <div class="lbl-grid">
            <div><span>Cliente</span><strong>{{ o.cliente || '—' }}</strong></div>
            <div><span>P/N</span><strong>{{ o.partNumber || '—' }}</strong></div>
            <div><span>S/N</span><strong>{{ o.serialNumber || '—' }}</strong></div>
            <div><span>OS original</span><strong>{{ o.numOsOriginal || '—' }}</strong></div>
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton type="button" [label]="aviso ? 'Agora não' : 'Fechar'" class="p-button-text" (click)="visibleChange.emit(false)"></button>
        <button pButton type="button" label="Imprimir etiqueta" icon="pi pi-print" (click)="imprimir()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .et-aviso {
      display: flex; gap: 10px; align-items: flex-start; margin-bottom: 14px; padding: 10px 12px; border-radius: 10px;
      background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 0.9rem; line-height: 1.4;
    }
    .et-aviso i { margin-top: 2px; }
    .lbl { border: 2px solid #0b1220; border-radius: 10px; padding: 10px 12px; background: #fff; color: #0b1220; }
    .lbl-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .lbl-k { font-size: 0.68rem; text-transform: uppercase; letter-spacing: .12em; color: #475569; font-weight: 700; }
    .lbl-os { font-size: 1.5rem; font-weight: 800; }
    .lbl-brand { font-weight: 800; letter-spacing: .2em; font-size: 0.7rem; color: #0f766e; }
    .lbl-code { display: flex; justify-content: center; margin: 6px 0; }
    .lbl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; border-top: 1px dashed #94a3b8; padding-top: 6px; }
    .lbl-grid span { display: block; font-size: 0.62rem; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 700; }
    .lbl-grid strong { font-size: 0.82rem; }
  `]
})
export class OsEtiquetaDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() os: EtiquetaOs | null = null;
  @Input() titulo = 'Etiqueta da OS';
  @Input() aviso: string | null = null;

  @ViewChild('etiqueta') etiqueta?: ElementRef<HTMLElement>;

  codigoBarras(id: number): string {
    return codigoBarrasOs(id);
  }

  imprimir(): void {
    const el = this.etiqueta?.nativeElement;
    if (!el || !this.os) return;
    imprimirHtml(`Etiqueta ${this.os.codigo}`, el.innerHTML, CSS_ETIQUETA_OS);
  }
}
