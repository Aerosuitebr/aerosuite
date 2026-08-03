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
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  ConformidadeAlertasResumo,
  ConformidadeSgqService,
  ConformidadeTreinamento
} from '../../core/conformidade-sgq.service';
import { UsuarioService } from '../../core/usuarios.service';
import { TranslationService } from '../../core/translation.service';
import { destructiveDeleteConfirm } from '../../core/confirm-dialog.util';
import { TranslatePipe } from '../../core/translate.pipe';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';

@Component({
  selector: 'app-treinamento-list',
  standalone: true,
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
    CheckboxModule,
    ConfirmDialogModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  providers: [MessageService],
  styleUrls: ['./treinamento-list.component.scss'],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <div class="as-page page conformidade-module">
      <app-page-hero variant="navy" titleKey="conformidade.treinamento.title" subtitleKey="conformidade.treinamento.subtitle" titleIcon="pi-users" [hasActions]="true">
        <div actions><button pButton icon="pi pi-plus" [label]="'conformidade.treinamento.btn.novo' | translate" (click)="abrirNovo()"></button></div>
      </app-page-hero>
      <div class="alert-cards" *ngIf="alertas">
        <div class="alert-card danger"><span>{{ 'conformidade.alert.vencidas' | translate }}</span><strong>{{ alertas.totalVencidas }}</strong></div>
        <div class="alert-card warn"><span>{{ 'conformidade.alert.proximas' | translate: { dias: '' + alertas.diasJanela } }}</span><strong>{{ alertas.totalProximas }}</strong></div>
        <div class="alert-card"><span>{{ 'conformidade.alert.ativos' | translate }}</span><strong>{{ alertas.totalAtivos }}</strong></div>
      </div>
      <div class="treinamento-toolbar">
        <div class="toolbar-left">
          <input
            pInputText
            class="filter-search"
            [(ngModel)]="search"
            (keyup.enter)="buscar()"
            [attr.aria-label]="'common.list.tooltip.search' | translate" />
          <button
            pButton
            type="button"
            icon="pi pi-search"
            [attr.aria-label]="'common.list.tooltip.search' | translate"
            (click)="buscar()"
            [loading]="loading"></button>
          <div class="turma-field">
            <label class="turma-label" for="turmaExport">{{ 'conformidade.treinamento.lista.turma' | translate }}</label>
            <input
              id="turmaExport"
              pInputText
              class="turma-input"
              [(ngModel)]="turmaExport"
              [placeholder]="'conformidade.treinamento.lista.turmaPh' | translate" />
          </div>
        </div>
        <button
          pButton
          type="button"
          icon="pi pi-file-pdf"
          class="p-button-outlined toolbar-export-btn"
          [label]="'conformidade.treinamento.lista.export' | translate"
          [loading]="exportandoPdf"
          (click)="exportarListaPresenca()"></button>
      </div>
      <app-list-data-states [loading]="loading" [itemCount]="total" [skeletonRows]="8" [skeletonCols]="5" [mountContentWhileLoading]="true" emptyTitleKey="conformidade.treinamento.empty" emptyDescriptionKey="ui.empty.description">
        <p-table appListScroll [first]="tableFirst" [value]="itens" [loading]="loading" [paginator]="true" [rows]="size" [totalRecords]="total" [lazy]="true" [rowsPerPageOptions]="listRowsPerPageOptions" dataKey="id" (onLazyLoad)="carregar($event)">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'conformidade.treinamento.col.usuario' | translate }}</th>
              <th>{{ 'conformidade.treinamento.col.curso' | translate }}</th>
              <th>{{ 'conformidade.treinamento.col.carga' | translate }}</th>
              <th>{{ 'conformidade.treinamento.col.turma' | translate }}</th>
              <th>{{ 'conformidade.treinamento.col.validade' | translate }}</th>
              <th></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.usuarioNome || row.usuarioId }}</td>
              <td>{{ row.curso }}</td>
              <td>{{ row.cargaHoraria ?? '—' }}</td>
              <td>{{ row.turmaRef || '—' }}</td>
              <td>
                {{ row.dataValidade || '—' }}
                <p-tag *ngIf="row.severidadeAlerta" [severity]="sevTag(row.severidadeAlerta)" [value]="labelSev(row.severidadeAlerta)" class="ml-1"></p-tag>
              </td>
              <td>
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="abrirEditar(row)"></button>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="confirmarExcluir(row)"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </app-list-data-states>
      <p-dialog
        styleClass="as-hero-dialog treinamento-dialog conformidade-dialog"
        maskStyleClass="treinamento-dialog-mask"
        [(visible)]="showDialog"
        [header]="'conformidade.treinamento.btn.novo' | translate"
        [modal]="true"
        [style]="{ width: '520px' }">
        <div class="form-grid">
          <div *ngIf="!editId">
            <label>{{ 'conformidade.treinamento.field.usuario' | translate }} *</label>
            <p-dropdown
              [(ngModel)]="form.usuarioId"
              [options]="usuarioOptions"
              optionLabel="label"
              optionValue="value"
              [filter]="true"
              [placeholder]="'conformidade.treinamento.field.usuario' | translate"
              styleClass="w-full"
              appendTo="body"></p-dropdown>
          </div>
          <div>
            <label>{{ 'conformidade.treinamento.field.curso' | translate }} *</label>
            <p-dropdown
              [(ngModel)]="form.curso"
              [options]="cursoOptions"
              optionLabel="label"
              optionValue="value"
              [filter]="true"
              [editable]="true"
              [placeholder]="'conformidade.treinamento.field.cursoPh' | translate"
              styleClass="w-full"
              appendTo="body"></p-dropdown>
          </div>
          <div>
            <label>{{ 'conformidade.treinamento.field.carga' | translate }}</label>
            <input
              pInputText
              type="number"
              min="1"
              step="1"
              [(ngModel)]="form.cargaHoraria"
              class="w-full treinamento-carga" />
          </div>
          <div class="form-row-dates">
            <div class="form-field-half">
              <label>{{ 'conformidade.treinamento.field.conclusao' | translate }}</label>
              <input pInputText type="date" [(ngModel)]="form.dataConclusao" class="w-full" />
            </div>
            <div class="form-field-half">
              <label>{{ 'conformidade.treinamento.field.validade' | translate }}</label>
              <input pInputText type="date" [(ngModel)]="form.dataValidade" class="w-full" />
            </div>
          </div>
          <div>
            <label>{{ 'conformidade.treinamento.field.certificador' | translate }}</label>
            <input pInputText [(ngModel)]="form.certificador" class="w-full" />
          </div>
          <div>
            <label>{{ 'conformidade.treinamento.field.turma' | translate }}</label>
            <input pInputText [(ngModel)]="form.turmaRef" class="w-full" />
          </div>
          <div class="presente-row">
            <p-checkbox [(ngModel)]="form.presenteLista" [binary]="true" inputId="presenteLista"></p-checkbox>
            <label for="presenteLista">{{ 'conformidade.treinamento.field.presente' | translate }}</label>
          </div>
          <div>
            <label>{{ 'conformidade.treinamento.field.obs' | translate }}</label>
            <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="form.observacoes"></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-actions treinamento-footer">
            <span
              class="nc-footer-tip"
              [attr.data-tip]="'conformidade.treinamento.tooltip.cancelClose' | translate"
              [attr.aria-label]="'conformidade.treinamento.tooltip.cancelClose' | translate">
              <button
                pButton
                type="button"
                icon="pi pi-times"
                class="p-button-text nc-footer-icon-btn"
                [attr.aria-label]="'conformidade.treinamento.tooltip.cancelClose' | translate"
                (click)="showDialog = false"></button>
            </span>
            <span
              class="nc-footer-tip"
              [attr.data-tip]="'conformidade.treinamento.tooltip.save' | translate"
              [attr.aria-label]="'conformidade.treinamento.tooltip.save' | translate">
              <button
                pButton
                type="button"
                icon="pi pi-save"
                class="nc-footer-icon-btn nc-footer-icon-btn--primary"
                [loading]="salvando"
                [attr.aria-label]="'conformidade.treinamento.tooltip.save' | translate"
                (click)="salvar()"></button>
            </span>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `
})
export class TreinamentoListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;
  private svc = inject(ConformidadeSgqService);
  private usuarioSvc = inject(UsuarioService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private readonly requestGuard = createStaleRequestGuard();

  itens: ConformidadeTreinamento[] = [];
  total = 0;
  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  loading = true;
  search = '';
  turmaExport = '';
  exportandoPdf = false;
  alertas: ConformidadeAlertasResumo | null = null;
  showDialog = false;
  editId: number | null = null;
  salvando = false;
  form: Partial<ConformidadeTreinamento> = {};
  usuarioOptions: { label: string; value: number }[] = [];
  cursoOptions: { label: string; value: string }[] = [];

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  ngOnInit(): void {
    this.usuarioSvc.list({ size: 500 }).subscribe(res => {
      this.usuarioOptions = (res.items ?? []).map(u => ({
        value: u.id!,
        label: (u['nome'] as string) || (u['email'] as string) || `#${u.id}`
      }));
    });
    this.svc.treinamentos.alertas(60).subscribe(a => (this.alertas = a));
    this.loadCursoOptions();
  }

  private loadCursoOptions(): void {
    this.svc.treinamentos.listar({ page: 0, size: 500 }).subscribe(res => {
      const seen = new Set<string>();
      const opcoes: { label: string; value: string }[] = [];
      for (const row of res.items ?? []) {
        const curso = row.curso?.trim();
        if (!curso) continue;
        const key = curso.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        opcoes.push({ label: curso, value: curso });
      }
      opcoes.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
      this.cursoOptions = opcoes;
    });
  }

  private ensureCursoInOptions(curso?: string): void {
    const c = curso?.trim();
    if (!c) return;
    if (this.cursoOptions.some(o => o.value.toLowerCase() === c.toLowerCase())) return;
    this.cursoOptions = [...this.cursoOptions, { label: c, value: c }].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    );
  }

  carregar(event?: LazyLoadEvent): void {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    const seq = this.requestGuard.bump();
    this.loading = true;
    this.svc.treinamentos.listar({ page: this.pageIndex, size: this.size, q: this.search.trim() || undefined }).subscribe({
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

  labelSev(s: string): string {
    return this.i18n.translateCatalog('conformidade.sev', s, s);
  }

  sevTag(s: string): 'warning' | 'danger' {
    return s === 'VENCIDA' ? 'danger' : 'warning';
  }

  abrirNovo(): void {
    this.editId = null;
    this.form = { presenteLista: true };
    this.loadCursoOptions();
    this.showDialog = true;
  }

  exportarListaPresenca(): void {
    const turma = this.turmaExport.trim();
    if (!turma) return;
    this.exportandoPdf = true;
    this.svc.treinamentos.listaPresencaPdf(turma).subscribe({
      next: blob => {
        this.exportandoPdf = false;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lista-presenca-${turma.replace(/[^a-zA-Z0-9._-]+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: err => {
        this.exportandoPdf = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translateApiError(err?.error, 'conformidade.treinamento.lista.err') });
      }
    });
  }

  abrirEditar(row: ConformidadeTreinamento): void {
    this.editId = row.id ?? null;
    this.form = { ...row };
    this.ensureCursoInOptions(this.form.curso);
    this.showDialog = true;
  }

  salvar(): void {
    const curso = typeof this.form.curso === 'string' ? this.form.curso.trim() : '';
    this.form.curso = curso || undefined;
    if (!this.editId && !this.form.usuarioId) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.translate('conformidade.treinamento.err.camposObrigatorios')
      });
      return;
    }
    if (!curso) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.translate('conformidade.treinamento.err.camposObrigatorios')
      });
      return;
    }
    const carga = Number(this.form.cargaHoraria);
    if (
      this.form.cargaHoraria != null &&
      (!Number.isFinite(carga) || carga < 1 || !Number.isInteger(carga))
    ) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.translate('conformidade.treinamento.err.cargaInvalida')
      });
      return;
    }
    this.salvando = true;
    const req = this.editId
      ? this.svc.treinamentos.atualizar(this.editId, this.form)
      : this.svc.treinamentos.criar(this.form);
    req.subscribe({
      next: () => {
        this.salvando = false;
        this.showDialog = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.toast.salvo') });
        this.svc.treinamentos.alertas(60).subscribe(a => (this.alertas = a));
        this.loadCursoOptions();
        this.buscar();
      },
      error: err => {
        this.salvando = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translateApiError(err?.error, 'conformidade.err.salvar') });
      }
    });
  }

  confirmarExcluir(row: ConformidadeTreinamento): void {
    this.confirm.confirm(
      destructiveDeleteConfirm(this.i18n.translate('conformidade.confirm.excluir'), () => {
        if (!row.id) return;
        this.svc.treinamentos.excluir(row.id).subscribe(() => {
          this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.toast.excluido') });
          this.buscar();
        });
      })
    );
  }
}
