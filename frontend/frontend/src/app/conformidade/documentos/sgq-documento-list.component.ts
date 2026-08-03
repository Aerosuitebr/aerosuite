import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../../core/lazy-list-pagination.helper';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConformidadeAlertasResumo, ConformidadeSgqService, SgqDocumento, SgqDocumentoHistorico } from '../../core/conformidade-sgq.service';
import { TranslationService } from '../../core/translation.service';
import { destructiveDeleteConfirm } from '../../core/confirm-dialog.util';
import { TranslatePipe } from '../../core/translate.pipe';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';
import { CONFORMIDADE_FIELD_LIMITS } from '../../core/entity-field-limits';

const SGQ_TIPOS_VALIDOS = ['MOE', 'POP', 'PROCEDIMENTO', 'MANUAL', 'FORMULARIO', 'OUTRO'] as const;
type SgqTipoValido = (typeof SGQ_TIPOS_VALIDOS)[number];

@Component({
  selector: 'app-sgq-documento-list',
  standalone: true,
  styleUrls: ['./sgq-documento-list.component.scss'],
  imports: [
    ListTableScrollDirective,
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    DialogModule,
    ToastModule,
    TagModule,
    ConfirmDialogModule,
    TooltipModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <div class="as-page page conformidade-module">
      <app-page-hero variant="navy" titleKey="sgq.documento.title" subtitleKey="sgq.documento.subtitle" titleIcon="pi-book" [hasActions]="true">
        <div actions>
          <button pButton icon="pi pi-plus" [label]="'sgq.documento.btn.novo' | translate" (click)="abrirNovo()"></button>
        </div>
      </app-page-hero>
      <div class="alert-cards" *ngIf="alertas">
        <div class="alert-card danger"><span>{{ 'conformidade.alert.vencidas' | translate }}</span><strong>{{ alertas.totalVencidas }}</strong></div>
        <div class="alert-card warn"><span>{{ 'conformidade.alert.proximas' | translate: { dias: '' + alertas.diasJanela } }}</span><strong>{{ alertas.totalProximas }}</strong></div>
        <div class="alert-card"><span>{{ 'conformidade.alert.ativos' | translate }}</span><strong>{{ alertas.totalAtivos }}</strong></div>
      </div>
      <div class="filter-bar">
        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <input
            pInputText
            [(ngModel)]="search"
            (keyup.enter)="buscar()"
            [attr.aria-label]="'common.list.tooltip.search' | translate" />
        </span>
        <p-dropdown
          [(ngModel)]="filtroTipo"
          [options]="tipoOptions"
          optionLabel="label"
          optionValue="value"
          [showClear]="true"
          [placeholder]="'sgq.documento.field.tipo' | translate"
          [attr.aria-label]="'sgq.documento.field.tipo' | translate"
          (onChange)="buscar()"></p-dropdown>
        <button
          pButton
          type="button"
          icon="pi pi-search"
          [attr.aria-label]="'common.list.tooltip.search' | translate"
          (click)="buscar()"
          [loading]="loading"></button>
      </div>
      <app-list-data-states [loading]="loading" [itemCount]="total" [skeletonRows]="8" [skeletonCols]="6" [mountContentWhileLoading]="true" emptyTitleKey="sgq.documento.empty" emptyDescriptionKey="ui.empty.description">
        <p-table appListScroll [first]="tableFirst" [value]="itens" [loading]="loading" [paginator]="true" [rows]="size" [totalRecords]="total" [lazy]="true" [rowsPerPageOptions]="listRowsPerPageOptions" dataKey="id" (onLazyLoad)="carregar($event)">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'sgq.documento.col.codigo' | translate }}</th>
              <th>{{ 'sgq.documento.col.titulo' | translate }}</th>
              <th>{{ 'sgq.documento.col.tipo' | translate }}</th>
              <th>{{ 'sgq.documento.col.revisao' | translate }}</th>
              <th>{{ 'sgq.documento.col.vigencia' | translate }}</th>
              <th>{{ 'sgq.documento.col.status' | translate }}</th>
              <th></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.codigo }}</td>
              <td>{{ row.titulo }}</td>
              <td><p-tag [value]="labelTipo(row.tipo)"></p-tag></td>
              <td>{{ row.revisao }}</td>
              <td>
                {{ row.dataVigencia || '—' }}
                <p-tag *ngIf="row.severidadeAlerta" [severity]="sevTag(row.severidadeAlerta)" [value]="labelSev(row.severidadeAlerta)" class="ml-1"></p-tag>
              </td>
              <td>{{ labelStatus(row.status) }}</td>
              <td>
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="abrirEditar(row)"></button>
                <button
                  pButton
                  icon="pi pi-history"
                  class="p-button-text p-button-sm"
                  [pTooltip]="'sgq.documento.btn.historico' | translate"
                  (click)="abrirHistorico(row)"></button>
                <button
                  *ngIf="row.status === 'VIGENTE' && row.id"
                  pButton
                  icon="pi pi-copy"
                  class="p-button-text p-button-sm"
                  [pTooltip]="'sgq.documento.btn.novaRevisao' | translate"
                  (click)="abrirNovaRevisao(row)"></button>
                <button
                  *ngIf="row.temArquivo && row.id"
                  pButton
                  icon="pi pi-download"
                  class="p-button-text p-button-sm"
                  [pTooltip]="'sgq.documento.btn.download' | translate"
                  (click)="baixarArquivo(row)"></button>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="confirmarExcluir(row)"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </app-list-data-states>
      <p-dialog
        styleClass="as-hero-dialog sgq-documento-dialog conformidade-dialog"
        maskStyleClass="sgq-documento-dialog-mask"
        [(visible)]="showDialog"
        [header]="'sgq.documento.btn.novo' | translate"
        [modal]="true"
        [style]="{ width: 'min(560px, 96vw)' }">
        <div class="form-grid">
          <div class="form-row form-row--40-60">
            <div class="form-field">
              <label>{{ 'sgq.documento.field.tipo' | translate }}</label>
              <p-dropdown
                [(ngModel)]="form.tipo"
                [options]="tipoOptions"
                optionLabel="label"
                optionValue="value"
                styleClass="w-full"
                appendTo="body"></p-dropdown>
            </div>
            <div class="form-field">
              <label>{{ 'sgq.documento.field.codigo' | translate }} *</label>
              <input pInputText [(ngModel)]="form.codigo" class="w-full" [maxlength]="limits.codigo" />
            </div>
          </div>
          <div class="form-row form-row--100">
            <div class="form-field">
              <label>{{ 'sgq.documento.field.titulo' | translate }} *</label>
              <input pInputText [(ngModel)]="form.titulo" class="w-full" [maxlength]="limits.titulo" />
            </div>
          </div>
          <div class="form-row form-row--20-40-40">
            <div class="form-field">
              <label>{{ 'sgq.documento.field.revisao' | translate }}</label>
              <input pInputText [(ngModel)]="form.revisao" class="w-full" [maxlength]="limits.revisao" />
            </div>
            <div class="form-field">
              <label>{{ 'sgq.documento.field.dataRevisao' | translate }}</label>
              <input pInputText type="date" [(ngModel)]="form.dataRevisao" class="w-full" />
            </div>
            <div class="form-field">
              <label>{{ 'sgq.documento.field.dataVigencia' | translate }}</label>
              <input pInputText type="date" [(ngModel)]="form.dataVigencia" class="w-full" />
            </div>
          </div>
          <div class="form-row form-row--100">
            <div class="form-field">
              <label>{{ 'sgq.documento.field.referencia' | translate }}</label>
              <input pInputText [(ngModel)]="form.referenciaArquivo" class="w-full" [maxlength]="limits.referenciaArquivo" />
            </div>
          </div>
          <div *ngIf="editId" class="arquivo-block">
            <label>{{ 'sgq.documento.field.arquivo' | translate }}</label>
            <p *ngIf="form.temArquivo && form.arquivoNome" class="arquivo-nome">{{ form.arquivoNome }}</p>
            <input type="file" accept=".pdf,application/pdf" (change)="onArquivoSelected($event)" />
            <small>{{ 'sgq.documento.hint.arquivo' | translate }}</small>
            <button
              pButton
              type="button"
              icon="pi pi-upload"
              class="p-button-outlined p-button-sm mt-1"
              [label]="'sgq.documento.btn.upload' | translate"
              [loading]="enviandoArquivo"
              [disabled]="!arquivoPdf || !editId"
              (click)="enviarArquivo()"></button>
          </div>
          <div *ngIf="!editId" class="arquivo-hint-callout">
            <i class="pi pi-info-circle" aria-hidden="true"></i>
            <small>{{ 'sgq.documento.hint.arquivo' | translate }}</small>
          </div>
          <div class="form-field">
            <label>{{ 'sgq.documento.field.obs' | translate }}</label>
            <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="form.observacoes"></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-actions sgq-documento-footer">
            <span
              class="nc-footer-tip"
              [attr.data-tip]="'sgq.documento.tooltip.cancelClose' | translate"
              [attr.aria-label]="'sgq.documento.tooltip.cancelClose' | translate">
              <button
                pButton
                type="button"
                icon="pi pi-times"
                class="p-button-text nc-footer-icon-btn"
                [attr.aria-label]="'sgq.documento.tooltip.cancelClose' | translate"
                (click)="showDialog = false"></button>
            </span>
            <span
              class="nc-footer-tip"
              [attr.data-tip]="'sgq.documento.tooltip.save' | translate"
              [attr.aria-label]="'sgq.documento.tooltip.save' | translate">
              <button
                pButton
                type="button"
                icon="pi pi-save"
                class="nc-footer-icon-btn nc-footer-icon-btn--primary"
                [loading]="salvando"
                [attr.aria-label]="'sgq.documento.tooltip.save' | translate"
                (click)="salvar()"></button>
            </span>
          </div>
        </ng-template>
      </p-dialog>

      <p-dialog
        styleClass="as-hero-dialog conformidade-dialog"
        [(visible)]="showHistoricoDialog"
        [header]="'sgq.documento.historico.title' | translate"
        [modal]="true"
        [style]="{ width: '640px' }">
        <p *ngIf="historicoLoading">{{ 'sgq.documento.historico.loading' | translate }}</p>
        <p *ngIf="!historicoLoading && historicoItens.length === 0">{{ 'sgq.documento.historico.empty' | translate }}</p>
        <p-table *ngIf="!historicoLoading && historicoItens.length > 0" [value]="historicoItens">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'sgq.documento.historico.col.data' | translate }}</th>
              <th>{{ 'sgq.documento.historico.col.revisao' | translate }}</th>
              <th>{{ 'sgq.documento.historico.col.status' | translate }}</th>
              <th>{{ 'sgq.documento.historico.col.usuario' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.createdAt || '—' }}</td>
              <td>{{ row.revisaoAnterior || '—' }} → {{ row.revisaoNova }}</td>
              <td>{{ row.statusAnterior || '—' }} → {{ row.statusNovo }}</td>
              <td>{{ row.usuarioEmail || '—' }}</td>
            </tr>
          </ng-template>
        </p-table>
      </p-dialog>

      <p-dialog
        styleClass="as-hero-dialog conformidade-dialog"
        [(visible)]="showNovaRevisaoDialog"
        [header]="'sgq.documento.novaRevisao.title' | translate"
        [modal]="true"
        [style]="{ width: '520px' }">
        <p class="hint">{{ 'sgq.documento.novaRevisao.hint' | translate: { codigo: novaRevisaoForm.codigo || '' } }}</p>
        <div class="form-grid">
          <div><label>{{ 'sgq.documento.field.revisao' | translate }} *</label><input pInputText [(ngModel)]="novaRevisaoForm.revisao" class="w-full" /></div>
          <div><label>{{ 'sgq.documento.field.dataRevisao' | translate }}</label><input pInputText type="date" [(ngModel)]="novaRevisaoForm.dataRevisao" class="w-full" /></div>
          <div><label>{{ 'sgq.documento.field.dataVigencia' | translate }}</label><input pInputText type="date" [(ngModel)]="novaRevisaoForm.dataVigencia" class="w-full" /></div>
          <div><label>{{ 'sgq.documento.field.obs' | translate }}</label><textarea pInputTextarea rows="2" [(ngModel)]="novaRevisaoForm.observacoes"></textarea></div>
        </div>
        <div class="dialog-actions">
          <button pButton class="p-button-text" [label]="'common.actions.cancel' | translate" (click)="showNovaRevisaoDialog = false"></button>
          <button pButton icon="pi pi-check" [loading]="salvandoNovaRevisao" [label]="'sgq.documento.btn.publicarRevisao' | translate" (click)="publicarNovaRevisao()"></button>
        </div>
      </p-dialog>
    </div>
  `
})
export class SgqDocumentoListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;
  readonly limits = CONFORMIDADE_FIELD_LIMITS.sgqDocumento;
  private svc = inject(ConformidadeSgqService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private readonly requestGuard = createStaleRequestGuard();

  itens: SgqDocumento[] = [];
  total = 0;
  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  loading = true;
  search = '';
  filtroTipo: string | null = null;
  alertas: ConformidadeAlertasResumo | null = null;
  showDialog = false;
  editId: number | null = null;
  salvando = false;
  form: Partial<SgqDocumento> = { tipo: 'PROCEDIMENTO', revisao: '00' };
  arquivoPdf: File | null = null;
  enviandoArquivo = false;
  tipoOptions: { label: string; value: string }[] = [];
  showHistoricoDialog = false;
  historicoLoading = false;
  historicoItens: SgqDocumentoHistorico[] = [];
  showNovaRevisaoDialog = false;
  novaRevisaoBaseId: number | null = null;
  novaRevisaoForm: Partial<SgqDocumento> = {};
  salvandoNovaRevisao = false;

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  ngOnInit(): void {
    this.tipoOptions = SGQ_TIPOS_VALIDOS.map(v => ({
      value: v,
      label: this.i18n.translate(`sgq.documento.tipo.${v}`)
    }));
    this.svc.documentos.alertas(60).subscribe(a => (this.alertas = a));
  }

  carregar(event?: LazyLoadEvent): void {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    const seq = this.requestGuard.bump();
    this.loading = true;
    this.svc.documentos
      .listar({ page: this.pageIndex, size: this.size, q: this.search.trim() || undefined, tipo: this.filtroTipo || undefined })
      .subscribe({
        next: res => {
          if (this.requestGuard.isStale(seq)) return;
          this.itens = res.items ?? [];
          this.total = res.totalElements ?? 0;
          this.loading = false;
        },
        error: () => {
          if (this.requestGuard.isStale(seq)) return;
          this.loading = false;
        }
      });
  }

  buscar(): void {
    this.pageIndex = 0;
    this.carregar({ first: 0, rows: this.size });
  }

  labelTipo(t: string): string {
    if (!this.isTipoValido(t)) {
      return this.i18n.translate('sgq.documento.tipo.OUTRO');
    }
    return this.i18n.translateCatalog('sgq.documento.tipo', t, t);
  }

  private isTipoValido(t: string | undefined | null): t is SgqTipoValido {
    return !!t && (SGQ_TIPOS_VALIDOS as readonly string[]).includes(t);
  }

  labelStatus(s: string): string {
    return this.i18n.translateCatalog('sgq.documento.status', s, s);
  }

  labelSev(s: string): string {
    return this.i18n.translateCatalog('conformidade.sev', s, s);
  }

  sevTag(s: string): 'success' | 'warning' | 'danger' {
    return s === 'VENCIDA' ? 'danger' : 'warning';
  }

  abrirNovo(): void {
    this.editId = null;
    this.form = { tipo: 'PROCEDIMENTO', revisao: '00' };
    this.arquivoPdf = null;
    this.showDialog = true;
  }

  abrirEditar(row: SgqDocumento): void {
    this.editId = row.id ?? null;
    this.form = { ...row };
    this.arquivoPdf = null;
    this.showDialog = true;
  }

  onArquivoSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.arquivoPdf = input.files?.[0] ?? null;
  }

  enviarArquivo(): void {
    if (!this.editId || !this.arquivoPdf) return;
    this.enviandoArquivo = true;
    this.svc.documentos.uploadArquivo(this.editId, this.arquivoPdf).subscribe({
      next: doc => {
        this.enviandoArquivo = false;
        this.form = { ...this.form, ...doc };
        this.arquivoPdf = null;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('sgq.documento.toast.arquivo') });
        this.buscar();
      },
      error: err => {
        this.enviandoArquivo = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translateApiError(err?.error, 'sgq.documento.err.arquivo') });
      }
    });
  }

  baixarArquivo(row: SgqDocumento): void {
    if (!row.id) return;
    this.svc.documentos.downloadArquivo(row.id).subscribe({
      next: res => {
        const blob = res.body;
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = row.arquivoNome || `${row.codigo || 'documento'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  salvar(): void {
    if (!this.form.codigo?.trim() || !this.form.titulo?.trim()) return;
    if (!this.isTipoValido(this.form.tipo)) {
      this.form.tipo = 'OUTRO';
    }
    this.salvando = true;
    const { status: _status, ...rest } = this.form;
    const payload = { ...rest };
    const req = this.editId
      ? this.svc.documentos.atualizar(this.editId, payload)
      : this.svc.documentos.criar(payload);
    req.subscribe({
      next: saved => {
        this.salvando = false;
        if (!this.editId && saved?.id) {
          this.editId = saved.id;
          this.form = { ...this.form, ...saved };
          this.toast.add({
            severity: 'info',
            summary: this.i18n.translate('sgq.documento.hint.arquivo'),
            detail: this.i18n.translate('conformidade.toast.salvo')
          });
        } else {
          this.showDialog = false;
          this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.toast.salvo') });
        }
        this.svc.documentos.alertas(60).subscribe(a => (this.alertas = a));
        this.buscar();
      },
      error: err => {
        this.salvando = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translateApiError(err?.error, 'conformidade.err.salvar') });
      }
    });
  }

  confirmarExcluir(row: SgqDocumento): void {
    this.confirm.confirm(
      destructiveDeleteConfirm(this.i18n.translate('conformidade.confirm.excluir'), () => {
        if (!row.id) return;
        this.svc.documentos.excluir(row.id).subscribe({
          next: () => {
            this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.toast.excluido') });
            this.buscar();
          }
        });
      })
    );
  }

  abrirHistorico(row: SgqDocumento): void {
    if (!row.codigo) return;
    this.showHistoricoDialog = true;
    this.historicoLoading = true;
    this.historicoItens = [];
    this.svc.documentos.historico(row.codigo).subscribe({
      next: rows => {
        this.historicoItens = rows ?? [];
        this.historicoLoading = false;
      },
      error: () => {
        this.historicoItens = [];
        this.historicoLoading = false;
      }
    });
  }

  abrirNovaRevisao(row: SgqDocumento): void {
    if (!row.id) return;
    this.novaRevisaoBaseId = row.id;
    const nextRev = this.proximaRevisao(row.revisao);
    this.novaRevisaoForm = {
      codigo: row.codigo,
      titulo: row.titulo,
      tipo: row.tipo,
      revisao: nextRev,
      status: 'VIGENTE',
      observacoes: row.observacoes
    };
    this.showNovaRevisaoDialog = true;
  }

  proximaRevisao(atual?: string): string {
    if (!atual || !/^\d+$/.test(atual.trim())) {
      return '01';
    }
    const n = parseInt(atual.trim(), 10) + 1;
    return n < 10 ? `0${n}` : String(n);
  }

  publicarNovaRevisao(): void {
    if (!this.novaRevisaoBaseId || !this.novaRevisaoForm.revisao?.trim()) return;
    this.salvandoNovaRevisao = true;
    this.svc.documentos.publicarNovaRevisao(this.novaRevisaoBaseId, this.novaRevisaoForm).subscribe({
      next: () => {
        this.salvandoNovaRevisao = false;
        this.showNovaRevisaoDialog = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('sgq.documento.novaRevisao.ok') });
        this.svc.documentos.alertas(60).subscribe(a => (this.alertas = a));
        this.buscar();
      },
      error: err => {
        this.salvandoNovaRevisao = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translateApiError(err?.error, 'conformidade.err.salvar') });
      }
    });
  }
}
