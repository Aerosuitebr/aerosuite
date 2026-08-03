import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { OsCrsEmitirRequest, OsCrsService, OsCrsChecklistItem } from '../../core/os-crs.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { DialogNoteFieldComponent } from '../../shared/dialog-note-field/dialog-note-field.component';

@Component({
  selector: 'app-os-crs-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    CheckboxModule,
    ToastModule,
    TranslatePipe,
    DialogNoteFieldComponent
  ],
  providers: [MessageService],
  template: `
    <p-dialog
      styleClass="as-hero-dialog" [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '640px' }"
      [header]="'os.crs.dialogTitle' | translate"
      (onHide)="onHide()">
      <p class="subtitle" *ngIf="numeroOs">{{ 'os.crs.dialogSubtitle' | translate: { numero: '' + numeroOs } }}</p>

      <p *ngIf="emitido" class="issued-banner">
        {{ 'os.crs.alreadyIssued' | translate: { data: emitidoEmLabel } }}
      </p>

      <p *ngIf="!canEmit && !emitido" class="no-perm-banner">
        {{ 'os.crs.toast.noPermission' | translate }}
      </p>

      <div class="form-grid" *ngIf="canEmit || emitido">
        <div class="field">
          <label>{{ 'os.crs.field.nome' | translate }}</label>
          <input pInputText [(ngModel)]="nome" [disabled]="emitido" />
        </div>
        <div class="field">
          <label>{{ 'os.crs.field.cargo' | translate }}</label>
          <input pInputText [(ngModel)]="cargo" [disabled]="emitido" />
        </div>
        <div class="field full">
          <label>{{ 'os.crs.field.cert' | translate }}</label>
          <input pInputText [(ngModel)]="certificado" [disabled]="emitido" />
        </div>
        <div class="field full">
          <app-dialog-note-field
            [(ngModel)]="observacoes"
            labelKey="os.crs.field.obs"
            [rows]="5"
            [disabled]="emitido">
          </app-dialog-note-field>
        </div>
      </div>

      <h4 *ngIf="canEmit && !emitido">{{ 'os.crs.checklistTitle' | translate }}</h4>
      <div class="checklist" *ngIf="canEmit && !emitido && itens.length">
        <div class="check-row" *ngFor="let item of itens">
          <p-checkbox
            [binary]="true"
            [(ngModel)]="checked[item.code]"
            [disabled]="emitido"
            [inputId]="'crs-' + item.code"></p-checkbox>
          <label [for]="'crs-' + item.code">{{ item.label }}</label>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button pButton type="button" class="p-button-text" icon="pi pi-times" (click)="visible = false"></button>
        <button
          *ngIf="emitido"
          pButton
          type="button"
          icon="pi pi-file-pdf"
          class="p-button-warning"
          [label]="'os.crs.btnPdf' | translate"
          [loading]="loadingPdf"
          (click)="baixarPdf()"></button>
        <button
          *ngIf="!emitido && canEmit"
          pButton
          type="button"
          icon="pi pi-check"
          [label]="'os.crs.btnEmit' | translate"
          [loading]="loading"
          (click)="emitir()"></button>
      </ng-template>
    </p-dialog>
    <p-toast></p-toast>
  `,
  styles: [
    `
      .subtitle {
        margin: 0 0 1rem;
        color: #64748b;
      }
      .issued-banner {
        background: #ecfdf5;
        border: 1px solid #6ee7b7;
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        margin-bottom: 1rem;
      }
      .no-perm-banner {
        background: #fff7ed;
        border: 1px solid #fdba74;
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      .field.full {
        grid-column: 1 / -1;
      }
      .field label {
        display: block;
        font-size: 0.85rem;
        margin-bottom: 0.25rem;
      }
      .checklist {
        margin-top: 0.5rem;
      }
      .check-row {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
        margin-bottom: 0.5rem;
      }
      .check-row label {
        font-size: 0.9rem;
        line-height: 1.35;
      }
    `
  ]
})
export class OsCrsDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() osId: number | null = null;
  @Input() numeroOs: number | null = null;
  /** Quando false, apenas consulta/PDF (perfil sem CRS_EMITIR). */
  @Input() canEmit = true;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() crsEmitido = new EventEmitter<void>();

  private crs = inject(OsCrsService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);

  itens: OsCrsChecklistItem[] = [];
  checked: Record<string, boolean> = {};
  nome = '';
  cargo = '';
  certificado = '';
  observacoes = '';
  emitido = false;
  emitidoEmLabel = '';
  loading = false;
  loadingPdf = false;

  ngOnChanges(): void {
    if (this.visible && this.osId) {
      this.carregar();
    }
  }

  onHide(): void {
    this.visibleChange.emit(false);
  }

  carregar(): void {
    if (!this.osId) {
      return;
    }
    this.crs.checklist(this.osId).subscribe({
      next: res => {
        this.itens = res.itens ?? [];
        this.checked = {};
        for (const item of this.itens) {
          this.checked[item.code] = false;
        }
      }
    });
    this.crs.obter(this.osId).subscribe({
      next: state => {
        this.emitido = !!state.emitido;
        this.nome = state.crsLiberadoPorNome ?? '';
        this.cargo = state.crsLiberadoPorCargo ?? '';
        this.certificado = state.crsCertificadoNumero ?? '';
        this.observacoes = state.crsObservacoes ?? '';
        this.emitidoEmLabel = state.crsEmitidoEm ?? '';
        if (state.checklistItensMarcados?.length) {
          for (const code of state.checklistItensMarcados) {
            this.checked[code] = true;
          }
        }
      }
    });
  }

  emitir(): void {
    if (!this.osId) {
      return;
    }
    const confirmados = this.itens.filter(i => this.checked[i.code]).map(i => i.code);
    if (confirmados.length < this.itens.length) {
      this.i18n.addToast(this.toast, 'warn', 'common.toast.warn', 'os.crs.toast.checklist');
      return;
    }
    const body: OsCrsEmitirRequest = {
      crsLiberadoPorNome: this.nome.trim(),
      crsLiberadoPorCargo: this.cargo.trim(),
      crsCertificadoNumero: this.certificado.trim() || undefined,
      crsObservacoes: this.observacoes.trim() || undefined,
      checklistConfirmados: confirmados
    };
    this.loading = true;
    this.crs.emitir(this.osId, body).subscribe({
      next: state => {
        this.loading = false;
        this.emitido = true;
        this.emitidoEmLabel = state.crsEmitidoEm ?? '';
        this.certificado = state.crsCertificadoNumero ?? this.certificado;
        this.i18n.addToast(this.toast, 'success', 'common.toast.success', 'os.crs.toast.emitOk');
        this.crsEmitido.emit();
      },
      error: (err: { error?: unknown }) => {
        this.loading = false;
        const detail = this.i18n.translateApiError(err?.error, 'os.crs.toast.emitFail');
        this.i18n.addToastLiteralDetail(this.toast, 'error', 'common.toast.error', detail);
      }
    });
  }

  baixarPdf(): void {
    if (!this.osId) {
      return;
    }
    this.loadingPdf = true;
    this.crs.downloadPdf(this.osId).subscribe({
      next: blob => {
        this.loadingPdf = false;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CRS_OS_${this.numeroOs ?? this.osId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.loadingPdf = false;
        this.i18n.addToast(this.toast, 'error', 'common.toast.error', 'os.crs.toast.pdfFail');
      }
    });
  }
}
