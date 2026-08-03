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
  HabilitacaoService,
  UsuarioHabilitacao,
  UsuarioHabilitacaoAlertasResumo
} from '../../core/habilitacao.service';
import { UsuarioService } from '../../core/usuarios.service';
import { TranslationService } from '../../core/translation.service';
import { destructiveDeleteConfirm } from '../../core/confirm-dialog.util';
import { TranslatePipe } from '../../core/translate.pipe';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';
import { CONFORMIDADE_FIELD_LIMITS } from '../../core/entity-field-limits';

@Component({
  selector: 'app-habilitacao-list',
  standalone: true,
  styleUrls: ['./habilitacao-list.component.scss'],
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
        titleKey="habilitacao.title"
        subtitleKey="habilitacao.subtitle"
        titleIcon="pi-id-card"
        [hasActions]="true">
        <div actions>
          <button pButton icon="pi pi-plus" [label]="'habilitacao.btn.novo' | translate" (click)="abrirNovo()"></button>
        </div>
      </app-page-hero>

      <div class="alert-cards" *ngIf="alertas">
        <div class="alert-card danger">
          <span>{{ 'habilitacao.alert.vencidas' | translate }}</span>
          <strong>{{ alertas.totalVencidas }}</strong>
        </div>
        <div class="alert-card warn">
          <span>{{ 'habilitacao.alert.proximas' | translate: { dias: '' + alertas.diasJanela } }}</span>
          <strong>{{ alertas.totalProximas }}</strong>
        </div>
        <div class="alert-card">
          <span>{{ 'habilitacao.alert.ativas' | translate }}</span>
          <strong>{{ alertas.totalAtivas }}</strong>
        </div>
      </div>

      <div class="filter-bar">
        <input
          pInputText
          class="filter-search"
          [(ngModel)]="search"
          (keyup.enter)="buscar()"
          [attr.aria-label]="'common.list.tooltip.search' | translate" />
        <p-dropdown
          [(ngModel)]="filtroTipo"
          [options]="tipoOptions"
          optionLabel="label"
          optionValue="value"
          [showClear]="true"
          [placeholder]="'habilitacao.field.tipo' | translate"
          [attr.aria-label]="'habilitacao.field.tipo' | translate"
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
        [itemCount]="total"
        [skeletonRows]="8"
        [skeletonCols]="6"
        [mountContentWhileLoading]="true"
        emptyTitleKey="habilitacao.empty"
        emptyDescriptionKey="ui.empty.description">
        <p-table appListScroll
          [first]="tableFirst"
          [value]="itens"
          [loading]="loading"
          [paginator]="true"
          [rows]="size"
          [totalRecords]="total"
          [lazy]="true"
          [rowsPerPageOptions]="listRowsPerPageOptions"
          dataKey="id"
          (onLazyLoad)="carregar($event)">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'habilitacao.col.usuario' | translate }}</th>
            <th>{{ 'habilitacao.col.tipo' | translate }}</th>
            <th>{{ 'habilitacao.col.escopo' | translate }}</th>
            <th>{{ 'habilitacao.col.identificador' | translate }}</th>
            <th>{{ 'habilitacao.col.validade' | translate }}</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row>
          <tr>
            <td>{{ row.usuarioNome || row.usuarioId }}</td>
            <td><p-tag [value]="labelTipo(row.tipo)"></p-tag></td>
            <td>{{ row.escopo || '—' }}</td>
            <td>{{ row.identificador || '—' }}</td>
            <td>
              {{ row.dataValidade || '—' }}
              <p-tag
                *ngIf="row.severidadeAlerta"
                [severity]="sevTag(row.severidadeAlerta)"
                [value]="labelSev(row.severidadeAlerta)"
                class="ml-1"></p-tag>
            </td>
            <td>
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="abrirEditar(row)"></button>
              <button
                pButton
                icon="pi pi-trash"
                class="p-button-text p-button-sm p-button-danger"
                (click)="confirmarExcluir(row)"></button>
            </td>
          </tr>
        </ng-template>
      </p-table>
      </app-list-data-states>

      <p-dialog
        styleClass="as-hero-dialog habilitacao-dialog conformidade-dialog"
        maskStyleClass="habilitacao-dialog-mask"
        [(visible)]="showDialog"
        [header]="(editId ? 'habilitacao.dialog.editar' : 'habilitacao.dialog.novo') | translate"
        [modal]="true"
        [style]="{ width: 'min(560px, 96vw)' }">
        <div class="form-grid">
          <div class="form-row" [class.form-row--60-40]="!editId" [class.form-row--100]="editId">
            <div class="form-field" *ngIf="!editId">
              <label>{{ 'habilitacao.field.usuario' | translate }} *</label>
              <p-dropdown
                [(ngModel)]="form.usuarioId"
                [options]="usuarioOptions"
                optionLabel="label"
                optionValue="value"
                [filter]="true"
                styleClass="w-full"
                appendTo="body"></p-dropdown>
            </div>
            <div class="form-field">
              <label>{{ 'habilitacao.field.tipo' | translate }}</label>
              <p-dropdown
                [(ngModel)]="form.tipo"
                [options]="tipoOptions"
                optionLabel="label"
                optionValue="value"
                styleClass="w-full"
                appendTo="body"></p-dropdown>
            </div>
          </div>
          <div class="form-row form-row--50-50">
            <div class="form-field">
              <label>{{ 'habilitacao.field.identificador' | translate }}</label>
              <input pInputText [(ngModel)]="form.identificador" class="w-full" [maxlength]="limits.identificador" />
            </div>
            <div class="form-field">
              <label>{{ 'habilitacao.field.escopo' | translate }}</label>
              <input pInputText [(ngModel)]="form.escopo" class="w-full" [maxlength]="limits.escopo" />
            </div>
          </div>
          <div class="form-row form-row--100">
            <div class="form-field">
              <label>{{ 'habilitacao.field.emissor' | translate }}</label>
              <input pInputText [(ngModel)]="form.emissor" class="w-full" [maxlength]="limits.emissor" />
            </div>
          </div>
          <div class="form-row form-row--50-50">
            <div class="form-field">
              <label>{{ 'habilitacao.field.dataEmissao' | translate }}</label>
              <input pInputText type="date" [(ngModel)]="form.dataEmissao" class="w-full" />
            </div>
            <div class="form-field">
              <label>{{ 'habilitacao.field.dataValidade' | translate }}</label>
              <input pInputText type="date" [(ngModel)]="form.dataValidade" class="w-full" />
            </div>
          </div>
          <div class="form-field">
            <label>{{ 'habilitacao.field.obs' | translate }}</label>
            <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="form.observacoes"></textarea>
          </div>
          <div class="ativo-row" *ngIf="editId">
            <p-checkbox [(ngModel)]="form.ativo" [binary]="true" inputId="ativo"></p-checkbox>
            <label for="ativo">{{ 'habilitacao.field.ativo' | translate }}</label>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-actions habilitacao-footer">
            <span
              class="nc-footer-tip"
              [attr.data-tip]="'habilitacao.tooltip.cancelClose' | translate"
              [attr.aria-label]="'habilitacao.tooltip.cancelClose' | translate">
              <button
                pButton
                type="button"
                icon="pi pi-times"
                class="p-button-text nc-footer-icon-btn"
                [attr.aria-label]="'habilitacao.tooltip.cancelClose' | translate"
                (click)="showDialog = false"></button>
            </span>
            <span
              class="nc-footer-tip"
              [attr.data-tip]="'habilitacao.tooltip.save' | translate"
              [attr.aria-label]="'habilitacao.tooltip.save' | translate">
              <button
                pButton
                type="button"
                icon="pi pi-save"
                class="nc-footer-icon-btn nc-footer-icon-btn--primary"
                [loading]="salvando"
                [attr.aria-label]="'habilitacao.tooltip.save' | translate"
                (click)="salvar()"></button>
            </span>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `
})
export class HabilitacaoListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;
  readonly limits = CONFORMIDADE_FIELD_LIMITS.habilitacao;

  private svc = inject(HabilitacaoService);
  private usuarioSvc = inject(UsuarioService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private readonly requestGuard = createStaleRequestGuard();

  itens: UsuarioHabilitacao[] = [];
  total = 0;
  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  loading = true;
  search = '';
  filtroTipo: string | null = null;
  alertas: UsuarioHabilitacaoAlertasResumo | null = null;

  showDialog = false;
  editId: number | null = null;
  salvando = false;
  form: Partial<UsuarioHabilitacao> = { ativo: true };

  tipoOptions: { label: string; value: string }[] = [];
  usuarioOptions: { label: string; value: number }[] = [];

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  ngOnInit(): void {
    this.tipoOptions = ['MECANICO', 'INSPETOR', 'RT', 'OUTRO'].map(v => ({
      value: v,
      label: this.i18n.translate(`habilitacao.tipo.${v}`)
    }));
    this.usuarioSvc.list({ size: 500 }).subscribe(res => {
      this.usuarioOptions = (res.items ?? []).map(u => ({
        value: u.id!,
        label: (u['nome'] as string) || (u['email'] as string) || `#${u.id}`
      }));
    });
    this.svc.alertas(60).subscribe(a => (this.alertas = a));
  }

  carregar(event?: LazyLoadEvent): void {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    const seq = this.requestGuard.bump();
    this.loading = true;
    this.svc
      .listar({
        page: this.pageIndex,
        size: this.size,
        q: this.search.trim() || undefined,
        tipo: this.filtroTipo || undefined
      })
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
    return this.i18n.translateCatalog('habilitacao.tipo', t, t);
  }

  labelSev(s: string): string {
    return this.i18n.translateCatalog('habilitacao.sev', s, s);
  }

  sevTag(s: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    if (s === 'VENCIDA') {
      return 'danger';
    }
    if (s === 'PROXIMA') {
      return 'warning';
    }
    return 'success';
  }

  abrirNovo(): void {
    this.editId = null;
    this.form = { tipo: 'MECANICO', ativo: true };
    this.showDialog = true;
  }

  abrirEditar(row: UsuarioHabilitacao): void {
    this.editId = row.id ?? null;
    this.form = { ...row };
    this.showDialog = true;
  }

  salvar(): void {
    if (!this.editId && !this.form.usuarioId) {
      return;
    }
    this.salvando = true;
    const req = this.editId
      ? this.svc.atualizar(this.editId, this.form)
      : this.svc.criar(this.form);
    req.subscribe({
      next: () => {
        this.salvando = false;
        this.showDialog = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('habilitacao.toast.salvo') });
        this.svc.alertas(60).subscribe(a => (this.alertas = a));
        this.buscar();
      },
      error: (err: { error?: unknown }) => {
        this.salvando = false;
        this.toast.add({
          severity: 'error',
          summary: this.i18n.translateApiError(err?.error, 'habilitacao.err.salvar')
        });
      }
    });
  }

  confirmarExcluir(row: UsuarioHabilitacao): void {
    if (!row.id) {
      return;
    }
    this.confirm.confirm(
      destructiveDeleteConfirm(this.i18n.translate('habilitacao.confirm.excluir'), () => {
        this.svc.excluir(row.id!).subscribe({
          next: () => {
            this.toast.add({ severity: 'success', summary: this.i18n.translate('habilitacao.toast.excluido') });
            this.svc.alertas(60).subscribe(a => (this.alertas = a));
            this.buscar();
          }
        });
      })
    );
  }
}
