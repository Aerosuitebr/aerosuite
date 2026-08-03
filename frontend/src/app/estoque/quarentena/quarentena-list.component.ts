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
import { MessageService } from 'primeng/api';
import { EstoqueService, ItemEstoque } from '../../core/estoque.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { RouterModule } from '@angular/router';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';

@Component({
  selector: 'app-quarentena-list',
  standalone: true,
  imports: [
    ListTableScrollDirective,
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    DialogModule,
    ToastModule,
    TagModule,
    TranslatePipe,
    ListDataStatesComponent,
    PageHeroComponent
  ],
  template: `
    <p-toast></p-toast>
    <div class="as-page quarentena-page">
      <app-page-hero
        variant="sky"
        titleKey="estoque.quarentena.title"
        subtitleKey="estoque.quarentena.subtitle"
        titleIcon="pi-shield" />

      <div class="filter-bar">
        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <input pInputText [(ngModel)]="search" (input)="buscar()" [placeholder]="'estoque.itens.list.searchPlaceholder' | translate" />
        </span>
      </div>

      <app-list-data-states
        [loading]="loading"
        [itemCount]="total"
        [skeletonRows]="8"
        [skeletonCols]="6"
        [mountContentWhileLoading]="true"
        emptyTitleKey="estoque.quarentena.empty"
        emptyDescriptionKey="ui.empty.description">
      <p-table appListScroll [value]="itens" [loading]="loading" [paginator]="true"
               [first]="tableFirst" [rows]="size" [rowsPerPageOptions]="listRowsPerPageOptions"
               [totalRecords]="total" [lazy]="true" dataKey="id"
               (onLazyLoad)="carregar($event)">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'estoque.itens.list.col.traceCode' | translate }}</th>
            <th>{{ 'estoque.itens.list.col.partNumber' | translate }}</th>
            <th>{{ 'estoque.quarentena.col.motivo' | translate }}</th>
            <th>{{ 'estoque.quarentena.col.inicio' | translate }}</th>
            <th>{{ 'estoque.quarentena.col.usuario' | translate }}</th>
            <th>{{ 'common.list.col.actions' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-item>
          <tr>
            <td>{{ item.codigoRastreio }}</td>
            <td><strong>{{ item.partNumber }}</strong></td>
            <td>{{ item.quarentenaMotivo || '-' }}</td>
            <td>{{ item.quarentenaInicioEm | date: 'dd/MM/yyyy HH:mm' }}</td>
            <td>{{ item.quarentenaInicioUsuarioNome || '-' }}</td>
            <td>
              <button pButton icon="pi pi-check-circle" class="p-button-sm p-button-warning"
                [label]="'estoque.quarentena.btn.liberar' | translate" (click)="abrirLiberar(item)"></button>
              <a [routerLink]="['/estoque/rastreio', item.codigoRastreio]" pButton icon="pi pi-history" class="p-button-text p-button-sm"></a>
            </td>
          </tr>
        </ng-template>
      </p-table>
      </app-list-data-states>

      <p-dialog styleClass="as-hero-dialog" [(visible)]="showLiberar" [header]="'estoque.quarentena.dialog.liberarTitle' | translate" [modal]="true" [style]="{ width: '480px' }">
        <div *ngIf="itemAcao">
          <p><strong>{{ itemAcao.codigoRastreio }}</strong> — {{ itemAcao.partNumber }}</p>
          <div class="field">
            <label>{{ 'estoque.quarentena.field.disposicao' | translate }}</label>
            <p-dropdown [(ngModel)]="disposicao" [options]="disposicaoOptions" optionLabel="label" optionValue="value" styleClass="w-full"></p-dropdown>
          </div>
          <div class="field">
            <label>{{ 'estoque.quarentena.field.obs' | translate }}</label>
            <textarea pInputTextarea rows="3" [(ngModel)]="obsLiberar"></textarea>
          </div>
          <div class="dialog-actions">
            <button pButton class="p-button-text" [label]="'common.actions.cancel' | translate" (click)="showLiberar = false"></button>
            <button pButton icon="pi pi-check" [loading]="salvando" [label]="'common.actions.save' | translate" (click)="confirmarLiberar()"></button>
          </div>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [
    `
      .quarentena-page { padding: 0; }
      .filter-bar { margin-bottom: 1rem; }
      .field { margin-bottom: 0.75rem; }
      .field label { display: block; font-size: 0.85rem; margin-bottom: 0.25rem; }
      .dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
    `
  ]
})
export class QuarentenaListComponent implements OnInit {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private estoque = inject(EstoqueService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);
  private readonly requestGuard = createStaleRequestGuard();

  pageIndex = 0;
  size = DEFAULT_LIST_PAGE_SIZE;

  itens: ItemEstoque[] = [];
  total = 0;
  loading = true;
  search = '';
  showLiberar = false;
  itemAcao: ItemEstoque | null = null;
  disposicao = 'LIBERAR_ESTOQUE';
  obsLiberar = '';
  salvando = false;
  disposicaoOptions: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.disposicaoOptions = ['LIBERAR_ESTOQUE', 'DESCARTAR', 'DEVOLVER_FORNECEDOR'].map(v => ({
      value: v,
      label: this.i18n.translate(`estoque.quarentena.disp.${v}`)
    }));
  }

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  carregar(event?: LazyLoadEvent): void {
    const req = resolveLazyPageRequest(event, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    const seq = this.requestGuard.bump();
    this.loading = true;
    this.estoque.listarQuarentena({
      page: req.page,
      size: req.size,
      search: this.search.trim() || undefined
    }).subscribe({
      next: res => {
        if (this.requestGuard.isStale(seq)) {
          return;
        }
        this.itens = res.content ?? [];
        this.total = res.totalElements ?? 0;
        this.loading = false;
      },
      error: () => {
        if (this.requestGuard.isStale(seq)) {
          return;
        }
        this.loading = false;
      }
    });
  }

  buscar(): void {
    this.pageIndex = 0;
    this.carregar({ first: 0, rows: this.size });
  }

  abrirLiberar(item: ItemEstoque): void {
    this.itemAcao = item;
    this.disposicao = 'LIBERAR_ESTOQUE';
    this.obsLiberar = '';
    this.showLiberar = true;
  }

  confirmarLiberar(): void {
    if (!this.itemAcao?.id) {
      return;
    }
    this.salvando = true;
    this.estoque
      .liberarQuarentena(this.itemAcao.id, { disposicao: this.disposicao, observacoes: this.obsLiberar.trim() || undefined })
      .subscribe({
        next: () => {
          this.salvando = false;
          this.showLiberar = false;
          this.i18n.addToast(this.toast, 'success', 'common.toast.success', 'estoque.quarentena.toast.liberado');
          this.buscar();
        },
        error: (err: { error?: { error?: string } }) => {
          this.salvando = false;
          this.i18n.addToastLiteralDetail(
            this.toast,
            'error',
            'common.toast.error',
            this.i18n.translateApiError(err?.error, 'estoque.quarentena.error.motivo_obrigatorio')
          );
        }
      });
  }
}
