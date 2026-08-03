import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { AeroDiretriz, AeroDiretrizService } from '../../core/aero-diretriz.service';
import { PublicacaoTecnica, PublicacaoTecnicaService } from '../../core/publicacao-tecnica.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';

export interface OsTarefaDadoTecnico {
  id?: number;
  ordem?: number;
  tarefaDescricao: string;
  tipoDado: 'AD_SB' | 'MANUAL' | 'OUTRO';
  aeroDiretrizId?: number | null;
  publicacaoTecnicaId?: number | null;
  referenciaExterna?: string | null;
  tituloExibicao?: string | null;
  numeroExibicao?: string | null;
  observacao?: string | null;
}

interface RefOption {
  label: string;
  value: number;
  titulo: string;
  numero?: string;
}

@Component({
  selector: 'app-os-tarefa-dados-tecnicos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    TagModule,
    TranslatePipe
  ],
  styles: [
    `
      .panel {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
        background: #fff;
      }
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }
      .panel-header h4 {
        margin: 0;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      .hint {
        color: #64748b;
        font-size: 0.8rem;
        margin: 0 0 0.75rem;
      }
      .row-actions {
        display: flex;
        gap: 0.25rem;
      }
      .full-width {
        width: 100%;
      }
    `
  ],
  template: `
    <div class="panel">
      <div class="panel-header">
        <h4><i class="pi pi-link"></i> {{ 'os.form.tarefaDt.panelTitle' | translate }}</h4>
        <button
          *ngIf="!readOnly"
          type="button"
          pButton
          icon="pi pi-plus"
          class="p-button-sm p-button-outlined"
          [label]="'os.form.tarefaDt.add' | translate"
          (click)="addRow()"></button>
      </div>
      <p class="hint">{{ 'os.form.tarefaDt.hint' | translate }}</p>

      <p-table [value]="rows" *ngIf="rows.length > 0">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'os.form.tarefaDt.col.tarefa' | translate }}</th>
            <th>{{ 'os.form.tarefaDt.col.tipo' | translate }}</th>
            <th>{{ 'os.form.tarefaDt.col.referencia' | translate }}</th>
            <th *ngIf="!readOnly" style="width: 4rem"></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row let-i="rowIndex">
          <tr>
            <td>
              <textarea
                pInputTextarea
                class="full-width"
                rows="2"
                [(ngModel)]="row.tarefaDescricao"
                [readonly]="readOnly"
                [placeholder]="'os.form.tarefaDt.ph.tarefa' | translate"
                (ngModelChange)="emitChange()"></textarea>
            </td>
            <td>
              <p-dropdown
                [options]="tipoOptions"
                [(ngModel)]="row.tipoDado"
                optionLabel="label"
                optionValue="value"
                [disabled]="readOnly"
                styleClass="full-width"
                (onChange)="onTipoChange(row)"></p-dropdown>
            </td>
            <td>
              <p-dropdown
                *ngIf="row.tipoDado === 'AD_SB'"
                [options]="adSbOptions"
                [(ngModel)]="row.aeroDiretrizId"
                optionLabel="label"
                optionValue="value"
                [filter]="true"
                [disabled]="readOnly"
                [placeholder]="'os.form.tarefaDt.ph.adSb' | translate"
                styleClass="full-width"
                (onChange)="onAdSbPick(row, $event.value)"></p-dropdown>
              <p-dropdown
                *ngIf="row.tipoDado === 'MANUAL'"
                [options]="manualOptions"
                [(ngModel)]="row.publicacaoTecnicaId"
                optionLabel="label"
                optionValue="value"
                [filter]="true"
                [disabled]="readOnly"
                [placeholder]="'os.form.tarefaDt.ph.manual' | translate"
                styleClass="full-width"
                (onChange)="onManualPick(row, $event.value)"></p-dropdown>
              <input
                *ngIf="row.tipoDado === 'OUTRO'"
                pInputText
                class="full-width"
                [(ngModel)]="row.referenciaExterna"
                [readonly]="readOnly"
                [placeholder]="'os.form.tarefaDt.ph.outro' | translate"
                (ngModelChange)="onOutroChange(row)" />
              <small *ngIf="row.tituloExibicao" class="block mt-1 text-color-secondary">
                {{ row.numeroExibicao ? row.numeroExibicao + ' — ' : '' }}{{ row.tituloExibicao }}
              </small>
            </td>
            <td *ngIf="!readOnly">
              <div class="row-actions">
                <button
                  type="button"
                  pButton
                  icon="pi pi-trash"
                  class="p-button-text p-button-danger p-button-sm"
                  [attr.aria-label]="'os.form.tarefaDt.remove' | translate"
                  (click)="removeRow(i)"></button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
      <p *ngIf="rows.length === 0" class="hint">{{ 'os.form.tarefaDt.empty' | translate }}</p>
    </div>
  `
})
export class OsTarefaDadosTecnicosComponent implements OnChanges {
  private diretrizSvc = inject(AeroDiretrizService);
  private pubSvc = inject(PublicacaoTecnicaService);
  private i18n = inject(TranslationService);

  @Input() items: OsTarefaDadoTecnico[] = [];
  @Input() fcuId: number | null = null;
  @Input() partNumber = '';
  @Input() serialNumber = '';
  @Input() readOnly = false;

  @Output() itemsChange = new EventEmitter<OsTarefaDadoTecnico[]>();

  rows: OsTarefaDadoTecnico[] = [];
  adSbOptions: RefOption[] = [];
  manualOptions: RefOption[] = [];

  tipoOptions = [
    { label: '', value: 'AD_SB' as const },
    { label: '', value: 'MANUAL' as const },
    { label: '', value: 'OUTRO' as const }
  ];

  constructor() {
    this.refreshTipoLabels();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.rows = (this.items ?? []).map(r => ({ ...r }));
    }
    if (changes['fcuId'] || changes['partNumber'] || changes['serialNumber']) {
      this.loadReferencias();
    }
  }

  private refreshTipoLabels(): void {
    this.tipoOptions = [
      { label: this.i18n.translate('os.form.tarefaDt.tipo.adSb'), value: 'AD_SB' },
      { label: this.i18n.translate('os.form.tarefaDt.tipo.manual'), value: 'MANUAL' },
      { label: this.i18n.translate('os.form.tarefaDt.tipo.outro'), value: 'OUTRO' }
    ];
  }

  private loadReferencias(): void {
    const fcu = this.fcuId != null && this.fcuId > 0 ? this.fcuId : undefined;
    const pn = this.partNumber?.trim() || undefined;
    const sn = this.serialNumber?.trim() || undefined;

    if (fcu || pn || sn) {
      this.diretrizSvc.aplicaveis(fcu, pn, sn).subscribe({
        next: res => {
          this.adSbOptions = (res.itens ?? []).map(d => this.mapDiretriz(d));
        },
        error: () => {
          this.adSbOptions = [];
        }
      });
    } else {
      this.adSbOptions = [];
    }

    if (fcu) {
      this.pubSvc.getAvailablePublicacoes(fcu).subscribe({
        next: pubs => {
          this.manualOptions = (pubs ?? []).map(p => this.mapManual(p));
        },
        error: () => {
          this.manualOptions = [];
        }
      });
    } else {
      this.manualOptions = [];
    }
  }

  private mapDiretriz(d: AeroDiretriz): RefOption {
    const tipo = this.i18n.translateCatalog('aero.diretriz.tipo', d.tipo, d.tipo);
    return {
      label: `${tipo} ${d.numero} — ${d.titulo}`,
      value: d.id!,
      titulo: d.titulo,
      numero: d.numero
    };
  }

  private mapManual(p: PublicacaoTecnica): RefOption {
    const rev = p.numeroRevisao ? `Rev. ${p.numeroRevisao}` : '';
    const titulo = p.tipoManual ?? '';
    return {
      label: [rev, titulo].filter(Boolean).join(' — ') || `#${p.id}`,
      value: p.id!,
      titulo,
      numero: p.numeroRevisao ?? undefined
    };
  }

  addRow(): void {
    this.rows.push({
      tarefaDescricao: '',
      tipoDado: 'AD_SB',
      aeroDiretrizId: null,
      publicacaoTecnicaId: null,
      referenciaExterna: null
    });
    this.emitChange();
  }

  removeRow(index: number): void {
    this.rows.splice(index, 1);
    this.emitChange();
  }

  onTipoChange(row: OsTarefaDadoTecnico): void {
    row.aeroDiretrizId = null;
    row.publicacaoTecnicaId = null;
    row.referenciaExterna = null;
    row.tituloExibicao = null;
    row.numeroExibicao = null;
    this.emitChange();
  }

  onAdSbPick(row: OsTarefaDadoTecnico, id: number | null): void {
    const opt = this.adSbOptions.find(o => o.value === id);
    row.tituloExibicao = opt?.titulo ?? null;
    row.numeroExibicao = opt?.numero ?? null;
    this.emitChange();
  }

  onManualPick(row: OsTarefaDadoTecnico, id: number | null): void {
    const opt = this.manualOptions.find(o => o.value === id);
    row.tituloExibicao = opt?.titulo ?? null;
    row.numeroExibicao = opt?.numero ?? null;
    this.emitChange();
  }

  onOutroChange(row: OsTarefaDadoTecnico): void {
    row.tituloExibicao = row.referenciaExterna?.trim() || null;
    row.numeroExibicao = null;
    this.emitChange();
  }

  emitChange(): void {
    const payload = this.rows.map((r, idx) => ({
      ...r,
      ordem: idx,
      tarefaDescricao: (r.tarefaDescricao ?? '').trim(),
      referenciaExterna: r.referenciaExterna?.trim() || null,
      observacao: r.observacao?.trim() || null
    }));
    this.itemsChange.emit(payload);
  }
}
