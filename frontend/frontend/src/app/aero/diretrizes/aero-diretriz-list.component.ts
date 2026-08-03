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
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AeroDiretriz, AeroDiretrizAlertasResumo, AeroDiretrizService } from '../../core/aero-diretriz.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { CONFORMIDADE_FIELD_LIMITS } from '../../core/entity-field-limits';
import { Fcu, FcuService } from '../../core/fcu.service';

type QuickFilter = 'todas' | 'vencidas' | 'proximas' | 'abertas';

@Component({
  selector: 'app-aero-diretriz-list',
  standalone: true,
  styleUrls: ['./aero-diretriz-list.component.scss'],
  imports: [
    ListTableScrollDirective,
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    AutoCompleteModule,
    DialogModule,
    ToastModule,
    TagModule,
    ConfirmDialogModule,
    TranslatePipe,
    ListDataStatesComponent,
    PageHeroComponent
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="aero-diretriz-page">
      <app-page-hero
        variant="navy"
        kickerKey="aero.diretriz.hero.kicker"
        titleKey="aero.diretriz.title"
        subtitleKey="aero.diretriz.subtitle"
        titleIcon="pi-exclamation-triangle"
        [hasActions]="false">
      </app-page-hero>

      <div class="aero-diretriz-body">
        <section class="usage-panel" [attr.aria-label]="'aero.diretriz.usage.ariaLabel' | translate">
          <h3><i class="pi pi-info-circle"></i> {{ 'aero.diretriz.usage.title' | translate }}</h3>
          <p>{{ 'aero.diretriz.usage.p1' | translate }}</p>
          <p>{{ 'aero.diretriz.usage.p2' | translate }}</p>
          <p>{{ 'aero.diretriz.usage.p3' | translate }}</p>
        </section>

        <div class="metric-grid" *ngIf="alertas">
          <button
            type="button"
            class="metric-card danger"
            [class.active]="quickFilter === 'vencidas'"
            (click)="aplicarFiltroRapido('vencidas')">
            <div class="metric-icon"><i class="pi pi-times-circle"></i></div>
            <div class="metric-body">
              <span class="metric-label">{{ 'aero.diretriz.alert.vencidas' | translate }}</span>
              <span class="metric-value">{{ alertas.totalVencidas }}</span>
              <span class="metric-hint">{{ 'aero.diretriz.metric.hintVencidas' | translate }}</span>
            </div>
          </button>
          <button
            type="button"
            class="metric-card warn"
            [class.active]="quickFilter === 'proximas'"
            (click)="aplicarFiltroRapido('proximas')">
            <div class="metric-icon"><i class="pi pi-clock"></i></div>
            <div class="metric-body">
              <span class="metric-label">{{ 'aero.diretriz.alert.proximas' | translate: { dias: '' + alertas.diasJanela } }}</span>
              <span class="metric-value">{{ alertas.totalProximas }}</span>
              <span class="metric-hint">{{ 'aero.diretriz.metric.hintProximas' | translate }}</span>
            </div>
          </button>
          <button
            type="button"
            class="metric-card info"
            [class.active]="quickFilter === 'abertas'"
            (click)="aplicarFiltroRapido('abertas')">
            <div class="metric-icon"><i class="pi pi-folder-open"></i></div>
            <div class="metric-body">
              <span class="metric-label">{{ 'aero.diretriz.alert.abertas' | translate }}</span>
              <span class="metric-value">{{ alertas.totalAbertas }}</span>
              <span class="metric-hint">{{ 'aero.diretriz.metric.hintAbertas' | translate }}</span>
            </div>
          </button>
        </div>

        <div class="quick-filter-banner" *ngIf="quickFilter !== 'todas'">
          <span><i class="pi pi-filter"></i> {{ 'aero.diretriz.quickFilter.banner' | translate }}: {{ labelQuickFilter() }}</span>
          <button
            pButton
            type="button"
            class="p-button-text p-button-sm"
            [label]="'aero.diretriz.quickFilter.clear' | translate"
            (click)="aplicarFiltroRapido('todas')"></button>
        </div>

        <div class="filters-panel">
          <div class="search-field">
            <i class="pi pi-search"></i>
            <input
              pInputText
              [(ngModel)]="search"
              (keyup.enter)="buscar()"
              [placeholder]="'aero.diretriz.searchPlaceholder' | translate" />
          </div>
          <p-dropdown
            [(ngModel)]="filtroTipo"
            [options]="tipoOptions"
            optionLabel="label"
            optionValue="value"
            [showClear]="true"
            [placeholder]="'aero.diretriz.field.tipo' | translate"
            (onChange)="onFiltroManual()"></p-dropdown>
          <p-dropdown
            [(ngModel)]="filtroStatus"
            [options]="statusOptions"
            optionLabel="label"
            optionValue="value"
            [showClear]="true"
            [placeholder]="'aero.diretriz.field.status' | translate"
            (onChange)="onFiltroManual()"></p-dropdown>
          <div class="filter-actions">
            <button pButton icon="pi pi-search" (click)="buscar()" [loading]="loading" [attr.aria-label]="'aero.diretriz.btnSearch' | translate"></button>
            <button
              pButton
              icon="pi pi-plus"
              class="p-button-primary"
              [label]="'aero.diretriz.btn.novo' | translate"
              (click)="abrirNovo()"></button>
          </div>
        </div>

        <div class="table-panel">
          <app-list-data-states
            [loading]="loading"
            [itemCount]="totalExibido"
            [skeletonRows]="8"
            [skeletonCols]="7"
            [mountContentWhileLoading]="true"
            emptyTitleKey="aero.diretriz.empty"
            emptyDescriptionKey="ui.empty.description">
          <p-table appListScroll
            [first]="tableFirst"
            [value]="itensExibidos"
            [loading]="loading"
            [paginator]="quickFilter === 'todas'"
            [rows]="size"
            [totalRecords]="totalExibido"
            [lazy]="quickFilter === 'todas'"
            (onLazyLoad)="carregar($event)"
            [rowsPerPageOptions]="listRowsPerPageOptions"
            dataKey="id"
            styleClass="p-datatable-sm p-datatable-striped"
            [tableStyle]="{ 'min-width': '56rem' }">
            <ng-template pTemplate="header">
              <tr>
                <th>{{ 'aero.diretriz.col.tipo' | translate }}</th>
                <th>{{ 'aero.diretriz.col.numero' | translate }}</th>
                <th>{{ 'aero.diretriz.col.titulo' | translate }}</th>
                <th>{{ 'aero.diretriz.col.limite' | translate }}</th>
                <th>{{ 'aero.diretriz.col.status' | translate }}</th>
                <th>{{ 'aero.diretriz.col.pn' | translate }}</th>
                <th style="width: 7rem">{{ 'aero.diretriz.col.acoes' | translate }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-row>
              <tr [class.row-vencida]="row.severidadeAlerta === 'VENCIDA'">
                <td><p-tag [value]="labelTipo(row.tipo)"></p-tag></td>
                <td><span class="font-mono">{{ row.numero }}</span></td>
                <td>{{ row.titulo }}</td>
                <td>
                  {{ row.dataLimiteCumprimento || '—' }}
                  <p-tag
                    *ngIf="row.severidadeAlerta"
                    [severity]="sevTag(row.severidadeAlerta)"
                    [value]="labelSev(row.severidadeAlerta)"
                    class="ml-1"></p-tag>
                </td>
                <td>{{ labelStatus(row.status) }}</td>
                <td>{{ row.partNumber || row.fcuCodigo || '—' }}</td>
                <td>
                  <button
                    pButton
                    icon="pi pi-pencil"
                    class="p-button-text p-button-sm"
                    (click)="abrirEditar(row)"></button>
                  <button
                    pButton
                    icon="pi pi-trash"
                    class="p-button-text p-button-sm p-button-danger"
                    (click)="confirmarExcluir(row)"></button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7" class="text-center py-4">{{ 'aero.diretriz.empty' | translate }}</td>
              </tr>
            </ng-template>
          </p-table>
          </app-list-data-states>
        </div>
      </div>
    </div>

    <p-dialog
      styleClass="as-hero-dialog aero-diretriz-dialog conformidade-dialog"
      maskStyleClass="aero-diretriz-dialog-mask"
      [(visible)]="showDialog"
      [header]="(editId ? 'aero.diretriz.dialog.editar' : 'aero.diretriz.dialog.novo') | translate"
      [modal]="true"
      [style]="{ width: 'min(560px, 96vw)' }">
      <div class="form-grid">
        <div class="form-row form-row--30-70">
          <div class="form-field">
            <label>{{ 'aero.diretriz.field.tipo' | translate }}</label>
            <p-dropdown
              [(ngModel)]="form.tipo"
              [options]="tipoOptions"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"
              appendTo="body"></p-dropdown>
          </div>
          <div class="form-field">
            <label>{{ 'aero.diretriz.field.numero' | translate }} *</label>
            <input pInputText [(ngModel)]="form.numero" class="w-full" [maxlength]="limits.numero" />
          </div>
        </div>
        <div class="form-row form-row--100">
          <div class="form-field">
            <label>{{ 'aero.diretriz.field.titulo' | translate }} *</label>
            <input pInputText [(ngModel)]="form.titulo" class="w-full" [maxlength]="limits.titulo" />
          </div>
        </div>
        <div class="form-row form-row--50-50">
          <div class="form-field">
            <label>{{ 'aero.diretriz.field.emissor' | translate }}</label>
            <input pInputText [(ngModel)]="form.emissor" class="w-full" [maxlength]="limits.emissor" />
          </div>
          <div class="form-field">
            <label>{{ 'aero.diretriz.field.dataLimite' | translate }}</label>
            <input pInputText type="date" [(ngModel)]="form.dataLimiteCumprimento" class="w-full" />
          </div>
        </div>
        <div class="form-row form-row--60-40">
          <div class="form-field">
            <label>{{ 'aero.diretriz.field.partNumber' | translate }}</label>
            <input pInputText [(ngModel)]="form.partNumber" class="w-full" [maxlength]="limits.partNumber" />
          </div>
          <div class="form-field">
            <label>{{ 'aero.diretriz.field.fcuId' | translate }}</label>
            <p-autoComplete
              [(ngModel)]="fcuSelected"
              [suggestions]="fcuSuggestions"
              (completeMethod)="searchFcu($event)"
              (onSelect)="onFcuSelected($event)"
              (onClear)="onFcuClear()"
              field="label"
              [dropdown]="true"
              dropdownIcon="pi pi-chevron-down"
              dropdownMode="blank"
              [forceSelection]="true"
              [placeholder]="'aero.diretriz.field.fcuSearchPh' | translate"
              [emptyMessage]="'primeng.emptySearch' | translate"
              styleClass="conformidade-ac w-full"
              appendTo="body">
            </p-autoComplete>
          </div>
        </div>
        <div class="form-field">
          <label>{{ 'aero.diretriz.field.obs' | translate }}</label>
          <textarea pInputTextarea rows="2" [(ngModel)]="form.observacoes" class="w-full"></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div class="dialog-actions aero-diretriz-footer">
          <span
            class="nc-footer-tip"
            [attr.data-tip]="'aero.diretriz.tooltip.cancelClose' | translate"
            [attr.aria-label]="'aero.diretriz.tooltip.cancelClose' | translate">
            <button
              pButton
              type="button"
              icon="pi pi-times"
              class="p-button-text nc-footer-icon-btn"
              [attr.aria-label]="'aero.diretriz.tooltip.cancelClose' | translate"
              (click)="showDialog = false"></button>
          </span>
          <span
            class="nc-footer-tip"
            [attr.data-tip]="'aero.diretriz.tooltip.save' | translate"
            [attr.aria-label]="'aero.diretriz.tooltip.save' | translate">
            <button
              pButton
              type="button"
              icon="pi pi-save"
              class="nc-footer-icon-btn nc-footer-icon-btn--primary"
              [loading]="salvando"
              [attr.aria-label]="'aero.diretriz.tooltip.save' | translate"
              (click)="salvar()"></button>
          </span>
        </div>
      </ng-template>
    </p-dialog>
  `
})
export class AeroDiretrizListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;
  readonly limits = CONFORMIDADE_FIELD_LIMITS.aeroDiretriz;

  private svc = inject(AeroDiretrizService);
  private fcuApi = inject(FcuService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private readonly requestGuard = createStaleRequestGuard();

  itens: AeroDiretriz[] = [];
  total = 0;
  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  loading = true;
  search = '';
  filtroTipo: string | null = null;
  filtroStatus: string | null = null;
  alertas: AeroDiretrizAlertasResumo | null = null;
  quickFilter: QuickFilter = 'todas';

  showDialog = false;
  editId: number | null = null;
  salvando = false;
  form: Partial<AeroDiretriz> = {};
  fcuSuggestions: { id: number; label: string }[] = [];
  fcuSelected: { id: number; label: string } | null = null;

  tipoOptions: { label: string; value: string }[] = [];
  statusOptions: { label: string; value: string }[] = [];

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  get itensExibidos(): AeroDiretriz[] {
    if (this.quickFilter === 'todas') {
      return this.itens;
    }
    if (!this.alertas?.itens) {
      return [];
    }
    if (this.quickFilter === 'vencidas') {
      return this.alertas.itens.filter(i => i.severidadeAlerta === 'VENCIDA');
    }
    if (this.quickFilter === 'proximas') {
      return this.alertas.itens.filter(i => i.severidadeAlerta === 'PROXIMA');
    }
    if (this.quickFilter === 'abertas') {
      return this.itens.filter(i => i.status === 'ABERTA' || i.status === 'EM_ANDAMENTO');
    }
    return this.itens;
  }

  get totalExibido(): number {
    return this.quickFilter === 'todas' ? this.total : this.itensExibidos.length;
  }

  ngOnInit(): void {
    this.tipoOptions = ['AD', 'SB', 'OUTRO'].map(v => ({
      value: v,
      label: this.i18n.translate(`aero.diretriz.tipo.${v}`)
    }));
    this.statusOptions = ['ABERTA', 'EM_ANDAMENTO', 'CUMPRIDA', 'NAO_APLICAVEL'].map(v => ({
      value: v,
      label: this.i18n.translate(`aero.diretriz.status.${v}`)
    }));
    this.recarregarAlertas();
  }

  recarregarAlertas(): void {
    this.svc.alertas(30).subscribe(a => (this.alertas = a));
  }

  carregar(event?: LazyLoadEvent): void {
    if (this.quickFilter !== 'todas') {
      if (this.quickFilter === 'abertas') {
        const seq = this.requestGuard.bump();
        this.loading = true;
        this.svc
          .listar({ page: 0, size: 200, q: this.search.trim() || undefined, tipo: this.filtroTipo || undefined })
          .subscribe({
            next: res => {
              if (this.requestGuard.isStale(seq)) return;
              this.itens = (res.items ?? []).filter(
                i => i.status === 'ABERTA' || i.status === 'EM_ANDAMENTO'
              );
              this.loading = false;
            },
            error: () => {
              if (this.requestGuard.isStale(seq)) return;
              this.loading = false;
            }
          });
      }
      return;
    }
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
        tipo: this.filtroTipo || undefined,
        status: this.filtroStatus || undefined
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

  aplicarFiltroRapido(f: QuickFilter): void {
    this.quickFilter = f;
    if (f === 'abertas') {
      this.filtroStatus = null;
      this.pageIndex = 0;
      this.carregar();
    }
  }

  onFiltroManual(): void {
    this.quickFilter = 'todas';
    this.buscar();
  }

  labelQuickFilter(): string {
    if (this.quickFilter === 'vencidas') {
      return this.i18n.translate('aero.diretriz.alert.vencidas');
    }
    if (this.quickFilter === 'proximas') {
      return this.i18n.translate('aero.diretriz.alert.proximas', { dias: '' + (this.alertas?.diasJanela ?? DEFAULT_LIST_PAGE_SIZE) });
    }
    if (this.quickFilter === 'abertas') {
      return this.i18n.translate('aero.diretriz.alert.abertas');
    }
    return '';
  }

  labelTipo(t: string): string {
    return this.i18n.translateCatalog('aero.diretriz.tipo', t, t);
  }

  labelStatus(s: string): string {
    return this.i18n.translateCatalog('aero.diretriz.status', s, s);
  }

  labelSev(s: string): string {
    return this.i18n.translateCatalog('aero.diretriz.sev', s, s);
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
    this.form = { tipo: 'AD' };
    this.fcuSelected = null;
    this.showDialog = true;
  }

  abrirEditar(row: AeroDiretriz): void {
    this.editId = row.id ?? null;
    this.form = { ...row };
    this.syncFcuFromForm();
    this.showDialog = true;
  }

  searchFcu(event: { query: string }): void {
    const q = (event.query ?? '').trim();
    this.fcuApi.list({ page: 0, size: 25, q: q || undefined, sort: 'fcuCodigo,asc' }).subscribe(res => {
      this.fcuSuggestions = (res.items ?? [])
        .filter(f => f.id != null)
        .map(f => ({ id: f.id!, label: this.formatFcuLabel(f) }));
    });
  }

  onFcuSelected(fcu: { id: number; label: string }): void {
    this.form.fcuId = fcu.id;
  }

  onFcuClear(): void {
    this.form.fcuId = undefined;
    this.fcuSelected = null;
  }

  private formatFcuLabel(f: Fcu): string {
    const code = f.fcuCodigo || f.pn || `#${f.id}`;
    const desc = f.fcuDescription ? ` — ${f.fcuDescription}` : '';
    return `${code}${desc}`;
  }

  private syncFcuFromForm(): void {
    const id = this.form.fcuId;
    if (!id) {
      this.fcuSelected = null;
      return;
    }
    this.fcuApi.get(id).subscribe({
      next: f => {
        this.fcuSelected = { id: f.id!, label: this.formatFcuLabel(f) };
      },
      error: () => {
        this.fcuSelected = { id, label: `#${id}` };
      },
    });
  }

  salvar(): void {
    this.salvando = true;
    const { status: _status, ...rest } = this.form;
    const payload = {
      ...rest,
      fcuId: this.form.fcuId != null && `${this.form.fcuId}` !== '' ? Number(this.form.fcuId) : undefined
    };
    const req = this.editId ? this.svc.atualizar(this.editId, payload) : this.svc.criar(payload);
    req.subscribe({
      next: () => {
        this.salvando = false;
        this.showDialog = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('aero.diretriz.toast.salvo') });
        this.recarregarAlertas();
        this.buscar();
      },
      error: (err: { error?: unknown }) => {
        this.salvando = false;
        this.toast.add({
          severity: 'error',
          summary: this.i18n.translateApiError(err?.error, 'aero.diretriz.err.salvar')
        });
      }
    });
  }

  confirmarExcluir(row: AeroDiretriz): void {
    if (!row.id) {
      return;
    }
    this.confirm.confirm({
      message: this.i18n.translate('aero.diretriz.confirm.excluir'),
      accept: () => {
        this.svc.excluir(row.id!).subscribe({
          next: () => {
            this.toast.add({ severity: 'success', summary: this.i18n.translate('aero.diretriz.toast.excluido') });
            this.recarregarAlertas();
            this.buscar();
          }
        });
      }
    });
  }
}
