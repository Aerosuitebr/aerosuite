import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoServicoService, TipoServico } from './tipo-servico.service';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ListTableScrollDirective } from '../shared/list-table-scroll/list-table-scroll.directive';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { createStaleRequestGuard, resolveLazyPageRequest, type LazyLoadEvent } from '../core/lazy-list-pagination.helper';

@Component({
  standalone: true,
  selector: 'app-tipo-servico-list',
  imports: [
    ListTableScrollDirective,
    CommonModule, FormsModule, TableModule, InputTextModule, ButtonModule, TranslatePipe],
  template: `
  <div class="card p-3" style="padding:16px;">
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
      <input type="text" pInputText [(ngModel)]="q" [placeholder]="'tiposServico.list.searchNome' | translate" (keyup.enter)="reload()">
      <button pButton type="button" (click)="reload()">{{ 'formsMisc.tiposServico.btnSearch' | translate }}</button>
      <span style="flex:1 1 auto"></span>
      <button pButton type="button" (click)="novo()">{{ 'formsMisc.tiposServico.btnNew' | translate }}</button>
    </div>

    <p-table appListScroll [first]="tableFirst" [value]="rows" [lazy]="true" [paginator]="true" [rows]="size"
             [totalRecords]="total" [loading]="loading" (onLazyLoad)="loadLazy($event)"
             [sortField]="sortField" [sortOrder]="sortOrder" [rowsPerPageOptions]="listRowsPerPageOptions"
             dataKey="id" editMode="row" responsiveLayout="scroll">
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="id">ID <p-sortIcon field="id"></p-sortIcon></th>
          <th pSortableColumn="nome">{{ 'formsMisc.tiposServico.colNome' | translate }} <p-sortIcon field="nome"></p-sortIcon></th>
          <th style="width:150px;"></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-row>
        <tr [pEditableRow]="row">
          <td>{{row.id}}</td>
          <td pEditableColumn>
            <ng-template pTemplate="cellEditor" let-row><input type="text" pInputText [(ngModel)]="row.nome"></ng-template>
            <span *ngIf="editingRow !== row">{{row.nome}}</span>
          </td>
          <td class="text-right">
            <button *ngIf="editingRow !== row" pButton type="button" pInitEditableRow (click)="editingRow = row">{{ 'formsMisc.tiposServico.btnEdit' | translate }}</button>
            <button *ngIf="editingRow === row" pButton type="button" pSaveEditableRow (click)="saveRow(row)">{{ 'formsMisc.tiposServico.btnSave' | translate }}</button>
            <button *ngIf="editingRow === row" pButton type="button" pCancelEditableRow (click)="editingRow = null">{{ 'formsMisc.tiposServico.btnCancel' | translate }}</button>
            <button pButton type="button" (click)="excluir(row)" style="margin-left:8px;">{{ 'formsMisc.tiposServico.btnDelete' | translate }}</button>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage"><tr><td colspan="3">{{ 'formsMisc.tiposServico.empty' | translate }}</td></tr></ng-template>
    </p-table>
  </div>
  `
})
export class TipoServicoListComponent {
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private api = inject(TipoServicoService);
  private i18n = inject(TranslationService);
  private readonly requestGuard = createStaleRequestGuard();
  rows: TipoServico[] = [];
  total=0; size = DEFAULT_LIST_PAGE_SIZE; pageIndex=0;
  sortField='id'; sortOrder: 1|-1 = 1;
  loading=true; q='';
  editingRow: any = null;

  get tableFirst(): number {
    return this.pageIndex * this.size;
  }

  toSortParam(){ return `${this.sortField},${this.sortOrder===1?'asc':'desc'}`; }
  reload(){
    this.pageIndex = 0;
    this.loadLazy({ first: 0, rows: this.size });
  }
  loadLazy(e?: LazyLoadEvent){
    const req = resolveLazyPageRequest(e, { pageIndex: this.pageIndex, size: this.size });
    this.pageIndex = req.page;
    this.size = req.size;
    if (e?.sortField) this.sortField = e.sortField;
    if (e?.sortOrder) this.sortOrder = e.sortOrder;
    const seq = this.requestGuard.bump();
    this.loading = true;
    this.api.list(this.pageIndex, this.size, this.toSortParam(), this.q)
      .subscribe({
        next: r => {
          if (this.requestGuard.isStale(seq)) return;
          this.rows = r.items;
          this.total = r.totalElements;
          this.loading = false;
        },
        error: () => {
          if (this.requestGuard.isStale(seq)) return;
          this.loading = false;
        }
      });
  }
  saveRow(row: TipoServico){ if(!row.id) return; this.api.update(row.id, row).subscribe(()=>this.refreshList()); }
  cancelEdit(){ this.refreshList(); }
  excluir(row: TipoServico){
    const msg = this.i18n.translate('formsMisc.tiposServico.confirmInactivate', { id: String(row.id) });
    if(confirm(msg)) {
      this.api.delete(row.id!).subscribe(()=>this.refreshList());
    }
  }
  novo(){
    const nome = prompt(this.i18n.translate('formsMisc.tiposServico.promptNewName'));
    if(nome) this.api.create({nome}).subscribe(()=>this.refreshList());
  }

  private refreshList(): void {
    this.loadLazy({ first: this.pageIndex * this.size, rows: this.size });
  }

  getDisplayedCount(): string {
    const total = this.total ?? 0;
    const startIndex = total === 0 ? 0 : (this.pageIndex || 0) * (this.size || 0) + (this.rows?.length ? 1 : 0);
    const endIndex = (this.pageIndex || 0) * (this.size || 0) + (this.rows?.length || 0);
    return total === 0 ? '0–0' : `${startIndex}–${endIndex}`;
  }
}
