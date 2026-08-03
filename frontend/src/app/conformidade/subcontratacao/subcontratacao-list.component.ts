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
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  ConformidadeAlertasResumo,
  ConformidadeSgqService,
  ConformidadeSubcontratacao
} from '../../core/conformidade-sgq.service';
import { TranslationService } from '../../core/translation.service';
import { destructiveDeleteConfirm } from '../../core/confirm-dialog.util';
import { TranslatePipe } from '../../core/translate.pipe';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';

@Component({
  selector: 'app-subcontratacao-list',
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
      <app-page-hero variant="navy" titleKey="conformidade.subcontratacao.title" subtitleKey="conformidade.subcontratacao.subtitle" titleIcon="pi-share-alt" [hasActions]="true">
        <div actions><button pButton icon="pi pi-plus" [label]="'conformidade.subcontratacao.btn.novo' | translate" (click)="abrirNovo()"></button></div>
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
        <button
          pButton
          type="button"
          icon="pi pi-search"
          [attr.aria-label]="'common.list.tooltip.search' | translate"
          (click)="buscar()"
          [loading]="loading"></button>
      </div>
      <app-list-data-states [loading]="loading" [itemCount]="total" [skeletonRows]="8" [skeletonCols]="5" [mountContentWhileLoading]="true" emptyTitleKey="conformidade.subcontratacao.empty" emptyDescriptionKey="ui.empty.description">
        <p-table appListScroll [first]="tableFirst" [value]="itens" [loading]="loading" [paginator]="true" [rows]="size" [totalRecords]="total" [lazy]="true" [rowsPerPageOptions]="listRowsPerPageOptions" dataKey="id" (onLazyLoad)="carregar($event)">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'conformidade.subcontratacao.col.razao' | translate }}</th>
              <th>{{ 'conformidade.subcontratacao.col.certificado' | translate }}</th>
              <th>{{ 'conformidade.subcontratacao.col.validade' | translate }}</th>
              <th>{{ 'conformidade.subcontratacao.col.status' | translate }}</th>
              <th></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.razaoSocial }}</td>
              <td>{{ row.certificadoPart145 || '—' }}</td>
              <td>
                {{ row.validadeCertificado || '—' }}
                <p-tag *ngIf="row.severidadeAlerta" [severity]="sevTag(row.severidadeAlerta)" [value]="labelSev(row.severidadeAlerta)" class="ml-1"></p-tag>
              </td>
              <td>{{ labelStatus(row.status) }}</td>
              <td>
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="abrirEditar(row)"></button>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="confirmarExcluir(row)"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </app-list-data-states>
      <p-dialog styleClass="as-hero-dialog conformidade-dialog" [(visible)]="showDialog" [header]="'conformidade.subcontratacao.btn.novo' | translate" [modal]="true" [style]="{ width: '560px' }">
        <div class="form-grid">
          <div><label>{{ 'conformidade.subcontratacao.field.razao' | translate }} *</label><input pInputText [(ngModel)]="form.razaoSocial" class="w-full" /></div>
          <div><label>{{ 'conformidade.subcontratacao.field.certificado' | translate }}</label><input pInputText [(ngModel)]="form.certificadoPart145" class="w-full" /></div>
          <div><label>{{ 'conformidade.subcontratacao.field.escopo' | translate }}</label><textarea pInputTextarea rows="2" [(ngModel)]="form.escopo"></textarea></div>
          <div><label>{{ 'conformidade.subcontratacao.field.validade' | translate }}</label><input pInputText type="date" [(ngModel)]="form.validadeCertificado" class="w-full" /></div>
          <div><label>{{ 'conformidade.subcontratacao.field.osId' | translate }}</label><input pInputText type="number" [(ngModel)]="form.osId" class="w-full" /></div>
          <div><label>{{ 'conformidade.subcontratacao.field.status' | translate }}</label><p-dropdown [(ngModel)]="form.status" [options]="statusOptions" optionLabel="label" optionValue="value" styleClass="w-full"></p-dropdown></div>
          <div><label>{{ 'conformidade.subcontratacao.field.obs' | translate }}</label><textarea pInputTextarea rows="2" [(ngModel)]="form.observacoes"></textarea></div>
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
    `.alert-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }`,
    `.alert-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.75rem 1rem; }`,
    `.alert-card strong { display: block; font-size: 1.4rem; }`,
    `.alert-card.danger { border-color: #fecaca; background: #fef2f2; }`,
    `.alert-card.warn { border-color: #fde68a; background: #fffbeb; }`,
    `.filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; }`,
    `.form-grid { display: grid; gap: 0.75rem; }`,
    `.dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }`
  ]
})
export class SubcontratacaoListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;
  private svc = inject(ConformidadeSgqService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private readonly requestGuard = createStaleRequestGuard();

  itens: ConformidadeSubcontratacao[] = [];
  total = 0;
  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  loading = true;
  search = '';
  alertas: ConformidadeAlertasResumo | null = null;
  showDialog = false;
  editId: number | null = null;
  salvando = false;
  form: Partial<ConformidadeSubcontratacao> = { status: 'ATIVO' };
  statusOptions: { label: string; value: string }[] = [];

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  ngOnInit(): void {
    this.statusOptions = ['ATIVO', 'SUSPENSO', 'ENCERRADO'].map(v => ({
      value: v,
      label: this.i18n.translate(`conformidade.subcontratacao.status.${v}`)
    }));
    this.svc.subcontratacao.alertas(60).subscribe(a => (this.alertas = a));
  }

  carregar(event?: LazyLoadEvent): void {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    const seq = this.requestGuard.bump();
    this.loading = true;
    this.svc.subcontratacao.listar({ page: this.pageIndex, size: this.size, q: this.search.trim() || undefined }).subscribe({
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

  labelStatus(s: string): string {
    return this.i18n.translateCatalog('conformidade.subcontratacao.status', s, s);
  }

  labelSev(s: string): string {
    return this.i18n.translateCatalog('conformidade.sev', s, s);
  }

  sevTag(s: string): 'warning' | 'danger' {
    return s === 'VENCIDA' ? 'danger' : 'warning';
  }

  abrirNovo(): void {
    this.editId = null;
    this.form = { status: 'ATIVO' };
    this.showDialog = true;
  }

  abrirEditar(row: ConformidadeSubcontratacao): void {
    this.editId = row.id ?? null;
    this.form = { ...row };
    this.showDialog = true;
  }

  salvar(): void {
    if (!this.form.razaoSocial?.trim()) return;
    this.salvando = true;
    const req = this.editId
      ? this.svc.subcontratacao.atualizar(this.editId, this.form)
      : this.svc.subcontratacao.criar(this.form);
    req.subscribe({
      next: () => {
        this.salvando = false;
        this.showDialog = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.toast.salvo') });
        this.svc.subcontratacao.alertas(60).subscribe(a => (this.alertas = a));
        this.buscar();
      },
      error: err => {
        this.salvando = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translateApiError(err?.error, 'conformidade.err.salvar') });
      }
    });
  }

  confirmarExcluir(row: ConformidadeSubcontratacao): void {
    this.confirm.confirm(
      destructiveDeleteConfirm(this.i18n.translate('conformidade.confirm.excluir'), () => {
        if (!row.id) return;
        this.svc.subcontratacao.excluir(row.id).subscribe(() => {
          this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.toast.excluido') });
          this.buscar();
        });
      })
    );
  }
}
