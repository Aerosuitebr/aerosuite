import { DEFAULT_LIST_PAGE_SIZE } from '../../core/list-pagination.constants';
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
  ConformidadeChecklistItem,
  ConformidadeContingencia,
  ConformidadeSgqService
} from '../../core/conformidade-sgq.service';
import { TranslationService } from '../../core/translation.service';
import { destructiveDeleteConfirm } from '../../core/confirm-dialog.util';
import { TranslatePipe } from '../../core/translate.pipe';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';

@Component({
  selector: 'app-contingencia-reconciliacao',
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
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <div class="as-page page conformidade-module">
      <app-page-hero
        variant="navy"
        titleKey="conformidade.contingencia.title"
        subtitleKey="conformidade.contingencia.subtitle"
        titleIcon="pi-sync"
        [hasActions]="true">
        <div actions>
          <button pButton icon="pi pi-plus" [label]="'conformidade.contingencia.btn.novo' | translate" (click)="abrirNovo()"></button>
        </div>
      </app-page-hero>
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
          [(ngModel)]="filtroStatus"
          [options]="statusOptions"
          optionLabel="label"
          optionValue="value"
          [showClear]="true"
          [placeholder]="'conformidade.contingencia.field.status' | translate"
          [attr.aria-label]="'conformidade.contingencia.field.status' | translate"
          (onChange)="buscar()"></p-dropdown>
        <button
          pButton
          type="button"
          icon="pi pi-search"
          [attr.aria-label]="'common.list.tooltip.search' | translate"
          (click)="buscar()"
          [loading]="loading"></button>
      </div>
      <app-list-data-states
        [loading]="loading"
        [itemCount]="itens.length"
        [skeletonRows]="6"
        [skeletonCols]="5"
        emptyTitleKey="conformidade.contingencia.empty"
        emptyDescriptionKey="ui.empty.description">
        <p-table
          appListScroll
          [value]="itens"
          [loading]="loading"
          [paginator]="true"
          [rows]="listPageSize"
          [totalRecords]="total"
          [lazy]="true"
          (onLazyLoad)="carregar($event)">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'conformidade.contingencia.col.titulo' | translate }}</th>
              <th>{{ 'conformidade.contingencia.col.periodo' | translate }}</th>
              <th>{{ 'conformidade.contingencia.col.progresso' | translate }}</th>
              <th>{{ 'conformidade.contingencia.col.status' | translate }}</th>
              <th></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.titulo }}</td>
              <td>{{ periodoLabel(row) }}</td>
              <td>{{ progresso(row) }}</td>
              <td>
                <p-tag [value]="labelStatus(row.status)" [severity]="row.status === 'CONCLUIDA' ? 'success' : 'warning'"></p-tag>
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
        styleClass="as-hero-dialog conformidade-dialog"
        [(visible)]="showDialog"
        [header]="(editId ? 'conformidade.contingencia.btn.editar' : 'conformidade.contingencia.btn.novo') | translate"
        [modal]="true"
        [style]="{ width: '640px' }">
        <div class="form-grid">
          <div><label>{{ 'conformidade.contingencia.field.titulo' | translate }} *</label><input pInputText [(ngModel)]="form.titulo" class="w-full" /></div>
          <div class="row-2">
            <div><label>{{ 'conformidade.contingencia.field.osId' | translate }}</label><input pInputText type="number" [(ngModel)]="form.osId" class="w-full" /></div>
            <div><label>{{ 'conformidade.contingencia.field.status' | translate }}</label>
              <p-dropdown [(ngModel)]="form.status" [options]="statusOptions" optionLabel="label" optionValue="value" styleClass="w-full"></p-dropdown>
            </div>
          </div>
          <div class="row-2">
            <div><label>{{ 'conformidade.contingencia.field.periodoInicio' | translate }}</label><input pInputText type="date" [(ngModel)]="form.periodoInicio" class="w-full" /></div>
            <div><label>{{ 'conformidade.contingencia.field.periodoFim' | translate }}</label><input pInputText type="date" [(ngModel)]="form.periodoFim" class="w-full" /></div>
          </div>
          <div>
            <h4>{{ 'conformidade.contingencia.checklist.title' | translate }}</h4>
            <div class="check-item" *ngFor="let item of form.checklist">
              <p-checkbox [(ngModel)]="item.concluido" [binary]="true" [inputId]="'chk-' + item.id"></p-checkbox>
              <label [for]="'chk-' + item.id">{{ checklistLabel(item) }}</label>
            </div>
          </div>
          <div><label>{{ 'conformidade.contingencia.field.obs' | translate }}</label><textarea pInputTextarea rows="2" [(ngModel)]="form.observacoes"></textarea></div>
        </div>
        <div class="dialog-actions">
          <button pButton class="p-button-text" [label]="'common.actions.cancel' | translate" (click)="showDialog = false"></button>
          <button pButton icon="pi pi-save" [loading]="salvando" [label]="'common.actions.save' | translate" (click)="salvar()"></button>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [
    `.page { padding: 0 8px 2rem; }`,
    `.filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }`,
    `.form-grid { display: grid; gap: 0.75rem; }`,
    `.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }`,
    `.check-item { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }`,
    `.dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }`
  ]
})
export class ContingenciaReconciliacaoComponent implements OnInit {
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;
  private svc = inject(ConformidadeSgqService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);

  itens: ConformidadeContingencia[] = [];
  total = 0;
  loading = true;
  search = '';
  filtroStatus: string | null = null;
  showDialog = false;
  editId: number | null = null;
  salvando = false;
  form: Partial<ConformidadeContingencia> = { checklist: [] };

  statusOptions: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.statusOptions = [
      { value: 'EM_ANDAMENTO', label: this.i18n.translate('conformidade.contingencia.status.EM_ANDAMENTO') },
      { value: 'CONCLUIDA', label: this.i18n.translate('conformidade.contingencia.status.CONCLUIDA') }
    ];
    this.buscar();
  }

  carregar(event?: { first?: number; rows?: number }): void {
    const page = event?.first != null && event?.rows ? Math.floor(event.first / event.rows) : 0;
    const size = event?.rows ?? DEFAULT_LIST_PAGE_SIZE;
    this.loading = true;
    this.svc.contingencia
      .listar({ page, size, q: this.search.trim() || undefined, status: this.filtroStatus || undefined })
      .subscribe({
        next: res => {
          this.itens = res.items ?? [];
          this.total = res.totalElements ?? 0;
          this.loading = false;
        },
        error: () => (this.loading = false)
      });
  }

  buscar(): void {
    this.carregar({ first: 0, rows: DEFAULT_LIST_PAGE_SIZE });
  }

  labelStatus(s?: string): string {
    return s ? this.i18n.translateCatalog('conformidade.contingencia.status', s, s) : '—';
  }

  checklistLabel(item: ConformidadeChecklistItem): string {
    const key = `conformidade.contingencia.step.${item.id}`;
    const t = this.i18n.translate(key);
    return t !== key ? t : item.label || item.id || '';
  }

  periodoLabel(row: ConformidadeContingencia): string {
    if (!row.periodoInicio && !row.periodoFim) return '—';
    return `${row.periodoInicio || '…'} — ${row.periodoFim || '…'}`;
  }

  progresso(row: ConformidadeContingencia): string {
    const total = row.checklist?.length ?? 0;
    const done = row.checklist?.filter(c => c.concluido).length ?? 0;
    return this.i18n.translate('conformidade.contingencia.progresso', { done: String(done), total: String(total) });
  }

  abrirNovo(): void {
    this.editId = null;
    this.form = { status: 'EM_ANDAMENTO', checklist: [] };
    this.svc.contingencia.checklistPadrao().subscribe(items => {
      this.form.checklist = items.map(i => ({ ...i }));
      this.showDialog = true;
    });
  }

  abrirEditar(row: ConformidadeContingencia): void {
    this.editId = row.id ?? null;
    this.form = {
      ...row,
      checklist: (row.checklist ?? []).map(i => ({ ...i }))
    };
    this.showDialog = true;
  }

  salvar(): void {
    if (!this.form.titulo?.trim()) return;
    this.salvando = true;
    const req = this.editId
      ? this.svc.contingencia.atualizar(this.editId, this.form)
      : this.svc.contingencia.criar(this.form);
    req.subscribe({
      next: () => {
        this.salvando = false;
        this.showDialog = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.toast.salvo') });
        this.buscar();
      },
      error: err => {
        this.salvando = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translateApiError(err?.error, 'conformidade.err.salvar') });
      }
    });
  }

  confirmarExcluir(row: ConformidadeContingencia): void {
    this.confirm.confirm(
      destructiveDeleteConfirm(this.i18n.translate('conformidade.confirm.excluir'), () => {
        if (!row.id) return;
        this.svc.contingencia.excluir(row.id).subscribe(() => {
          this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.toast.excluido') });
          this.buscar();
        });
      })
    );
  }
}
