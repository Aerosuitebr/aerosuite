import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EstoqueService, EstoqueMinimoLoteLinha, EstoqueMinimoLoteResult } from '../../core/estoque.service';
import { TranslationService } from '../../core/translation.service';
import { extractApiErrorMessage } from '../../core/backend-i18n-message.util';
import { TranslatePipe } from '../../core/translate.pipe';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';

const CSV_TEMPLATE = `Part Number;Est. Mínimo;Est. Ideal
PN-EXEMPLO-001;2;5
PN-EXEMPLO-002;1;3`;

@Component({
  selector: 'app-estoque-minimo-lote',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, ToastModule, TranslatePipe, PageHeroComponent],
  template: `
    <p-toast></p-toast>
    <div class="as-page estoque-minimo-lote">
      <app-page-hero
        variant="sky"
        titleKey="estoque.screens.minimoLote.title"
        subtitleKey="estoque.screens.minimoLote.subtitle"
        titleIcon="pi-upload"
        [hasActions]="false">
      </app-page-hero>

      <div class="layout-card">
        <h2><i class="pi pi-info-circle"></i> {{ 'estoque.screens.minimoLote.layoutTitle' | translate }}</h2>
        <p>{{ 'estoque.screens.minimoLote.layoutIntro' | translate }}</p>
        <div class="layout-table-wrap">
          <table class="layout-table">
            <thead>
              <tr>
                <th>{{ 'estoque.screens.minimoLote.colPn' | translate }}</th>
                <th>{{ 'estoque.screens.minimoLote.colMin' | translate }}</th>
                <th>{{ 'estoque.screens.minimoLote.colIdeal' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ 'estoque.screens.minimoLote.rowDescPn' | translate }}</td>
                <td>{{ 'estoque.screens.minimoLote.rowDescMin' | translate }}</td>
                <td>{{ 'estoque.screens.minimoLote.rowDescIdeal' | translate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="layout-note">{{ 'estoque.screens.minimoLote.layoutNote' | translate }}</p>
        <button pButton type="button" [label]="'estoque.screens.minimoLote.downloadTemplate' | translate" icon="pi pi-download" class="p-button-outlined" (click)="baixarModelo()"></button>
      </div>

      <div class="import-card">
        <h2><i class="pi pi-file-edit"></i> {{ 'estoque.screens.minimoLote.importTitle' | translate }}</h2>
        <div class="import-options">
          <div class="option">
            <label>{{ 'estoque.screens.minimoLote.labelSendCsv' | translate }}</label>
            <input type="file" accept=".csv,.txt" (change)="onFileSelected($event)" #fileInput>
          </div>
          <span class="ou">{{ 'estoque.screens.minimoLote.or' | translate }}</span>
          <div class="option">
            <label>{{ 'estoque.screens.minimoLote.labelPasteSheet' | translate }}</label>
            <textarea [(ngModel)]="csvPaste" [placeholder]="'estoque.screens.minimoLote.pastePh' | translate" rows="6"></textarea>
          </div>
        </div>
        <div class="import-actions">
          <button pButton type="button" [label]="'estoque.screens.minimoLote.btnInterpretFull' | translate" icon="pi pi-eye" (click)="interpretar()" [disabled]="!csvPaste && !arquivoSelecionado"></button>
          <button pButton type="button" [label]="'estoque.screens.minimoLote.btnUpdate' | translate" icon="pi pi-check" class="p-button-success" (click)="atualizarLote()" [disabled]="linhasPreview.length === 0" [loading]="enviando"></button>
        </div>
      </div>

      <div class="preview-card" *ngIf="linhasPreview.length > 0">
        <h2><i class="pi pi-list"></i> {{ 'estoque.screens.minimoLote.previewWithCount' | translate: { count: '' + linhasPreview.length } }}</h2>
        <p-table [value]="linhasPreview" styleClass="p-datatable-sm p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'estoque.screens.minimoLote.colPn' | translate }}</th>
              <th>{{ 'estoque.screens.minimoLote.colMin' | translate }}</th>
              <th>{{ 'estoque.screens.minimoLote.colIdeal' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-l>
            <tr>
              <td>{{ l.partNumber }}</td>
              <td>{{ l.estoqueMinimo ?? '-' }}</td>
              <td>{{ l.estoqueIdeal ?? '-' }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <div class="result-card" *ngIf="resultado">
        <h2><i class="pi pi-check-circle"></i> {{ 'estoque.screens.minimoLote.resultTitle' | translate }}</h2>
        <p>{{ 'estoque.screens.minimoLote.resultLine1' | translate: { total: '' + resultado.totalItensAtualizados, pnCount: '' + (resultado.partNumbersAtualizados?.length ?? 0) } }}</p>
        <p *ngIf="resultado.partNumbersNaoEncontrados.length > 0" class="warn">
          <strong>{{ 'estoque.screens.minimoLote.resultNotFoundLabel' | translate: { count: '' + resultado.partNumbersNaoEncontrados.length } }}</strong>
          {{ resultado.partNumbersNaoEncontrados.join(', ') }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; box-sizing: border-box; }
    .estoque-minimo-lote { width: 100%; max-width: 100%; box-sizing: border-box; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { display: flex; align-items: center; gap: 12px; font-size: 24px; color: #f59e0b; margin: 0 0 8px; }
    .page-header p { color: #94a3b8; margin: 0; }
    .layout-card, .import-card, .preview-card, .result-card {
      background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px;
      border: 1px solid #334155;
    }
    .layout-card h2, .import-card h2, .preview-card h2, .result-card h2 {
      display: flex; align-items: center; gap: 8px; font-size: 16px; color: #f1f5f9; margin: 0 0 12px;
    }
    .layout-card p, .import-card p, .preview-card p, .result-card p { color: #94a3b8; margin: 0 0 12px; font-size: 14px; }
    .layout-table-wrap { overflow-x: auto; margin: 12px 0; }
    .layout-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .layout-table th, .layout-table td { border: 1px solid #334155; padding: 10px; text-align: left; color: #e2e8f0; }
    .layout-table th { background: #334155; color: #f59e0b; }
    .layout-note { font-size: 12px; color: #64748b; margin-top: 8px !important; }
    .import-options { display: flex; flex-direction: column; gap: 16px; }
    .option label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
    .option input[type="file"] { color: #e2e8f0; }
    .option textarea { width: 100%; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 10px; border-radius: 8px; font-family: inherit; }
    .ou { text-align: center; color: #64748b; font-size: 13px; }
    .import-actions { display: flex; gap: 12px; margin-top: 16px; }
    .preview-card p-table { font-size: 13px; }
    .result-card .warn { color: #fbbf24; }
  `]
})
export class EstoqueMinimoLoteComponent {
  private estoqueService = inject(EstoqueService);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);

  csvPaste = '';
  arquivoSelecionado: File | null = null;
  linhasPreview: EstoqueMinimoLoteLinha[] = [];
  resultado: EstoqueMinimoLoteResult | null = null;
  enviando = false;

  baixarModelo() {
    const blob = new Blob(['\uFEFF' + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_estoque_minimo.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.arquivoSelecionado = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.csvPaste = (reader.result as string) || '';
    };
    reader.readAsText(file, 'UTF-8');
  }

  interpretar() {
    let texto = this.csvPaste?.trim() || '';
    if (this.arquivoSelecionado && !texto) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.minimoLote.toast.selectFileOrPaste');
      return;
    }
    const linhas = this.parseCsv(texto);
    this.linhasPreview = linhas;
    this.resultado = null;
    if (linhas.length === 0) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'estoque.minimoLote.toast.noValidLines');
    } else {
      this.i18n.addToast(this.messageService, 'info', 'estoque.minimoLote.toast.previewSummary', 'estoque.minimoLote.toast.previewDetail', {
        count: String(linhas.length)
      });
    }
  }

  private parseCsv(texto: string): EstoqueMinimoLoteLinha[] {
    const lines = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const result: EstoqueMinimoLoteLinha[] = [];
    const sep = lines[0]?.includes(';') ? ';' : ',';
    for (let i = 0; i < lines.length; i++) {
      const cells = lines[i].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cells.length < 1) continue;
      const partNumber = cells[0];
      if (!partNumber) continue;
      if (i === 0 && (partNumber.toLowerCase().includes('part') || partNumber.toLowerCase().includes('pn'))) continue;
      const estoqueMinimo = this.parseNum(cells[1]);
      const estoqueIdeal = this.parseNum(cells[2]);
      result.push({ partNumber, estoqueMinimo, estoqueIdeal });
    }
    return result;
  }

  private parseNum(v: string | undefined): number | undefined {
    if (v === undefined || v === '') return undefined;
    const n = parseFloat(v.replace(',', '.'));
    return isNaN(n) ? undefined : n;
  }

  atualizarLote() {
    if (this.linhasPreview.length === 0) return;
    this.enviando = true;
    this.estoqueService.atualizarEstoqueMinimoLote(this.linhasPreview).subscribe({
      next: (res) => {
        this.enviando = false;
        this.resultado = res;
        this.i18n.addToast(this.messageService, 'success', 'estoque.minimoLote.toast.doneSummary', 'estoque.minimoLote.toast.doneDetail', {
          count: String(res.totalItensAtualizados ?? 0)
        });
      },
      error: (err) => {
        this.enviando = false;
        const msg = extractApiErrorMessage(err, this.i18n, 'estoque.minimoLote.toast.batchUpdateError');
        this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
      }
    });
  }
}
