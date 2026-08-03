import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../../core/lazy-list-pagination.helper';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConformidadeSgqService, ConformidadeTreinamentoObrigatorio } from '../../core/conformidade-sgq.service';
import { Perfil, PerfilService } from '../../core/perfil.service';
import { TranslationService } from '../../core/translation.service';
import { destructiveDeleteConfirm } from '../../core/confirm-dialog.util';
import { TranslatePipe } from '../../core/translate.pipe';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';

type PerfilOpcao = { codigo: string; label: string };
type CursoOpcao = { curso: string; label: string };

@Component({
  selector: 'app-treinamento-obrigatorio-list',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    AutoCompleteModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  providers: [MessageService],
  styleUrls: ['./treinamento-obrigatorio-list.component.scss'],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <div class="as-page page conformidade-module">
      <app-page-hero variant="navy" titleKey="conformidade.treinObrig.title" subtitleKey="conformidade.treinObrig.subtitle" titleIcon="pi-id-card" [hasActions]="true">
        <div actions><button pButton icon="pi pi-plus" [label]="'conformidade.treinObrig.btn.novo' | translate" (click)="abrirNovo()"></button></div>
      </app-page-hero>
      <div class="filter-bar">
        <input
          pInputText
          class="filter-search"
          [(ngModel)]="search"
          (keyup.enter)="buscar()"
          [placeholder]="'conformidade.treinObrig.searchPh' | translate"
          [attr.aria-label]="'common.list.tooltip.search' | translate" />
        <button
          pButton
          type="button"
          icon="pi pi-search"
          [attr.aria-label]="'common.list.tooltip.search' | translate"
          (click)="buscar()"
          [loading]="loading"></button>
      </div>
      <app-list-data-states [loading]="loading" [itemCount]="total" [skeletonRows]="6" [skeletonCols]="4" [mountContentWhileLoading]="true" emptyTitleKey="conformidade.treinObrig.empty" emptyDescriptionKey="ui.empty.description">
        <p-table appListScroll [first]="tableFirst" [value]="itens" [loading]="loading" [paginator]="true" [rows]="size" [totalRecords]="total" [lazy]="true" [rowsPerPageOptions]="listRowsPerPageOptions" dataKey="id" (onLazyLoad)="carregar($event)">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'conformidade.treinObrig.col.funcao' | translate }}</th>
              <th>{{ 'conformidade.treinObrig.col.curso' | translate }}</th>
              <th>{{ 'conformidade.treinObrig.col.validade' | translate }}</th>
              <th></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.funcaoCodigo }}</td>
              <td>{{ row.curso }}</td>
              <td>{{ row.validadeMeses ?? '—' }}</td>
              <td class="row-actions">
                <button
                  pButton
                  icon="pi pi-pencil"
                  class="p-button-text p-button-sm row-action-btn row-action-btn--edit"
                  (click)="abrirEditar(row)"></button>
                <button
                  pButton
                  icon="pi pi-trash"
                  class="p-button-text p-button-sm p-button-danger row-action-btn row-action-btn--delete"
                  [attr.aria-label]="'common.actions.delete' | translate"
                  (click)="confirmarExcluir(row)"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </app-list-data-states>
      <p-dialog
        styleClass="as-hero-dialog trein-obrig-dialog conformidade-dialog"
        maskStyleClass="trein-obrig-dialog-mask"
        [(visible)]="showDialog"
        [header]="'conformidade.treinObrig.btn.novo' | translate"
        [modal]="true"
        [style]="{ width: '480px' }">
        <div class="form-grid">
          <div>
            <label>{{ 'conformidade.treinObrig.field.funcao' | translate }} *</label>
            <p-autoComplete
              [(ngModel)]="perfilSelected"
              [suggestions]="perfilSuggestions"
              (completeMethod)="searchPerfil($event)"
              (onSelect)="onPerfilSelected($event)"
              (onClear)="onPerfilClear()"
              field="label"
              [dropdown]="true"
              dropdownIcon="pi pi-chevron-down"
              dropdownMode="blank"
              [forceSelection]="true"
              [placeholder]="'conformidade.treinObrig.field.funcaoSearchPh' | translate"
              [emptyMessage]="'primeng.emptySearch' | translate"
              styleClass="conformidade-ac w-full"
              appendTo="body">
            </p-autoComplete>
          </div>
          <div>
            <label>{{ 'conformidade.treinObrig.field.curso' | translate }} *</label>
            <p-autoComplete
              [(ngModel)]="cursoSelected"
              [suggestions]="cursoSuggestions"
              (completeMethod)="searchCurso($event)"
              (onSelect)="onCursoSelected($event)"
              (onClear)="onCursoClear()"
              field="label"
              [dropdown]="true"
              dropdownIcon="pi pi-chevron-down"
              dropdownMode="blank"
              [forceSelection]="true"
              [placeholder]="'conformidade.treinObrig.field.cursoSearchPh' | translate"
              [emptyMessage]="'primeng.emptySearch' | translate"
              styleClass="conformidade-ac w-full"
              appendTo="body">
            </p-autoComplete>
          </div>
          <div>
            <label>{{ 'conformidade.treinObrig.field.validade' | translate }}</label>
            <input
              pInputText
              type="number"
              min="1"
              step="1"
              [(ngModel)]="form.validadeMeses"
              class="w-full trein-obrig-validade" />
          </div>
          <div>
            <label>{{ 'conformidade.treinObrig.field.obs' | translate }}</label>
            <textarea pInputTextarea rows="2" class="trein-obrig-obs w-full" [(ngModel)]="form.observacoes"></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-actions trein-obrig-footer">
            <span
              class="nc-footer-tip"
              [attr.data-tip]="'common.actions.cancel' | translate"
              [attr.aria-label]="'common.actions.cancel' | translate">
              <button
                pButton
                type="button"
                icon="pi pi-times"
                class="p-button-text nc-footer-icon-btn"
                [attr.aria-label]="'common.actions.cancel' | translate"
                (click)="showDialog = false"></button>
            </span>
            <span
              class="nc-footer-tip"
              [attr.data-tip]="'common.actions.save' | translate"
              [attr.aria-label]="'common.actions.save' | translate">
              <button
                pButton
                type="button"
                icon="pi pi-save"
                class="nc-footer-icon-btn nc-footer-icon-btn--primary"
                [loading]="salvando"
                [attr.aria-label]="'common.actions.save' | translate"
                (click)="salvar()"></button>
            </span>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `
})
export class TreinamentoObrigatorioListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private svc = inject(ConformidadeSgqService);
  private perfilService = inject(PerfilService);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private i18n = inject(TranslationService);
  private readonly requestGuard = createStaleRequestGuard();

  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;
  loading = true;
  search = '';
  salvando = false;
  showDialog = false;
  itens: ConformidadeTreinamentoObrigatorio[] = [];
  total = 0;
  editId: number | null = null;
  form: Partial<ConformidadeTreinamentoObrigatorio> = {};
  perfilSuggestions: PerfilOpcao[] = [];
  cursoSuggestions: CursoOpcao[] = [];
  perfilSelected: PerfilOpcao | null = null;
  cursoSelected: CursoOpcao | null = null;
  private perfisCache: Perfil[] = [];

  ngOnInit(): void {
    this.loadPerfisCache();
  }

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  carregar(ev?: LazyLoadEvent): void {
    const req = resolveLazyPageRequest(ev, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    const seq = this.requestGuard.bump();
    this.loading = true;
    this.svc.treinamentosObrigatorios.listar({
      page: this.pageIndex,
      size: this.size,
      q: this.search.trim() || undefined
    }).subscribe({
      next: r => {
        if (this.requestGuard.isStale(seq)) return;
        this.itens = r.items;
        this.total = r.totalElements;
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

  abrirNovo(): void {
    this.editId = null;
    this.form = { validadeMeses: 24, ativo: true };
    this.perfilSelected = null;
    this.cursoSelected = null;
    this.showDialog = true;
  }

  abrirEditar(row: ConformidadeTreinamentoObrigatorio): void {
    this.editId = row.id ?? null;
    this.form = { ...row };
    this.syncPerfilFromForm();
    this.syncCursoFromForm();
    this.showDialog = true;
  }

  searchPerfil(event: { query: string }): void {
    const q = (event.query ?? '').trim().toLowerCase();
    this.perfilSuggestions = this.perfisCache
      .filter(p => p.ativo !== false)
      .filter(
        p =>
          !q ||
          p.codigo.toLowerCase().includes(q) ||
          (p.nome ?? '').toLowerCase().includes(q)
      )
      .map(p => ({ codigo: p.codigo, label: this.formatPerfilLabel(p) }));
  }

  searchCurso(event: { query: string }): void {
    const q = (event.query ?? '').trim();
    this.svc.treinamentos.listar({ page: 0, size: 100, q: q || undefined }).subscribe(res => {
      const seen = new Set<string>();
      const opcoes: CursoOpcao[] = [];
      for (const row of res.items ?? []) {
        const curso = row.curso?.trim();
        if (!curso) continue;
        const key = curso.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        opcoes.push({ curso, label: curso });
      }
      const current = this.form.curso?.trim();
      if (current && !seen.has(current.toLowerCase())) {
        opcoes.push({ curso: current, label: current });
      }
      opcoes.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
      this.cursoSuggestions = opcoes;
    });
  }

  onPerfilSelected(event: { value?: PerfilOpcao }): void {
    const val = event?.value;
    this.form.funcaoCodigo = val?.codigo;
  }

  onPerfilClear(): void {
    this.form.funcaoCodigo = undefined;
    this.perfilSelected = null;
  }

  onCursoSelected(event: { value?: CursoOpcao }): void {
    const val = event?.value;
    this.form.curso = val?.curso;
  }

  onCursoClear(): void {
    this.form.curso = undefined;
    this.cursoSelected = null;
  }

  salvar(): void {
    if (this.perfilSelected?.codigo) {
      this.form.funcaoCodigo = this.perfilSelected.codigo;
    }
    if (this.cursoSelected?.curso) {
      this.form.curso = this.cursoSelected.curso;
    }
    if (!this.form.funcaoCodigo?.trim() || !this.form.curso?.trim()) {
      this.msg.add({
        severity: 'warn',
        summary: this.i18n.translate('conformidade.treinObrig.err.camposObrigatorios')
      });
      return;
    }
    const validade = Number(this.form.validadeMeses);
    if (
      this.form.validadeMeses != null &&
      (!Number.isFinite(validade) || validade < 1 || !Number.isInteger(validade))
    ) {
      this.msg.add({
        severity: 'warn',
        summary: this.i18n.translate('conformidade.treinObrig.err.validadeInvalida')
      });
      return;
    }
    this.salvando = true;
    const req = this.editId
      ? this.svc.treinamentosObrigatorios.atualizar(this.editId, this.form)
      : this.svc.treinamentosObrigatorios.criar(this.form);
    req.subscribe({
      next: () => {
        this.salvando = false;
        this.showDialog = false;
        this.msg.add({ severity: 'success', summary: this.i18n.translate('conformidade.toast.salvo') });
        this.carregar({ first: this.pageIndex * this.size, rows: this.size });
      },
      error: () => {
        this.salvando = false;
        this.msg.add({ severity: 'error', summary: this.i18n.translate('conformidade.err.salvar') });
      }
    });
  }

  confirmarExcluir(row: ConformidadeTreinamentoObrigatorio): void {
    this.confirm.confirm(
      destructiveDeleteConfirm(this.i18n.translate('conformidade.confirm.excluir'), () => {
        if (row.id == null) return;
        this.svc.treinamentosObrigatorios.excluir(row.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: this.i18n.translate('conformidade.toast.excluido') });
            this.carregar({ first: this.pageIndex * this.size, rows: this.size });
          }
        });
      })
    );
  }

  private loadPerfisCache(): void {
    this.perfilService.listarTodos().subscribe({
      next: perfis => {
        this.perfisCache = perfis ?? [];
      }
    });
  }

  private formatPerfilLabel(p: Perfil): string {
    return p.nome ? `${p.codigo} — ${p.nome}` : p.codigo;
  }

  private syncPerfilFromForm(): void {
    const codigo = this.form.funcaoCodigo?.trim();
    if (!codigo) {
      this.perfilSelected = null;
      return;
    }
    const match = this.perfisCache.find(p => p.codigo.toUpperCase() === codigo.toUpperCase());
    if (match) {
      this.perfilSelected = { codigo: match.codigo, label: this.formatPerfilLabel(match) };
      return;
    }
    if (this.perfisCache.length === 0) {
      this.perfilService.listarTodos().subscribe({
        next: perfis => {
          this.perfisCache = perfis ?? [];
          this.syncPerfilFromForm();
        }
      });
      return;
    }
    this.perfilSelected = { codigo, label: codigo };
  }

  private syncCursoFromForm(): void {
    const curso = this.form.curso?.trim();
    this.cursoSelected = curso ? { curso, label: curso } : null;
    if (curso) {
      this.searchCurso({ query: curso });
    }
  }
}
