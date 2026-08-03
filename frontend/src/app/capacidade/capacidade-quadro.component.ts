import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from '../core/translate.pipe';
import { extractApiErrorKey } from '../core/api-error';
import { TranslationService } from '../core/translation.service';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import {
  CapacidadeFilaService,
  CapacidadeQuadro,
  CapacidadeQuadroCard,
  CapacidadeQuadroColuna,
  HangarOption
} from '../core/capacidade-fila.service';

const ESTAGIOS = ['AGUARDANDO', 'EM_EXECUCAO', 'AGUARDANDO_PECAS', 'INSPECAO'] as const;

@Component({
  selector: 'app-capacidade-quadro',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ButtonModule,
    TagModule,
    DialogModule,
    DropdownModule,
    CalendarModule,
    ToastModule,
    ProgressSpinnerModule,
    CheckboxModule,
    TranslatePipe,
    RouterLink,
    PageHeroComponent
  ],
  providers: [MessageService],
  styleUrls: ['./capacidade-quadro.component.scss'],
  template: `
    <p-toast></p-toast>
    <div class="capacidade-shell">
      <app-page-hero
        variant="slate"
        titleKey="capacidade.title"
        subtitleKey="capacidade.subtitle"
        titleIcon="pi-th-large"
        [hasActions]="true">
        <a actions routerLink="/capacidade/hangares" class="manage-hangar-link">{{ 'capacidade.hangar.manage' | translate }}</a>
        <button
          actions
          pButton
          type="button"
          class="p-button-outlined p-button-sm"
          [label]="'capacidade.bulk.mode' | translate"
          (click)="toggleBulkMode()"></button>
      </app-page-hero>
      <div class="capacidade-toolbar">
      <p class="drag-hint">{{ 'capacidade.drag.hint' | translate }}</p>
        <div class="bulk-bar" *ngIf="bulkMode && selectedOsIds.size > 0">
          <span>{{ 'capacidade.bulk.selected' | translate: { n: selectedOsIds.size } }}</span>
          <p-dropdown
            [options]="estagioOptions"
            [(ngModel)]="bulkTargetEstagio"
            optionLabel="label"
            optionValue="value"
            [placeholder]="'capacidade.bulk.moveTo' | translate"
            styleClass="bulk-dd"></p-dropdown>
          <button
            pButton
            type="button"
            class="p-button-sm"
            [label]="'capacidade.bulk.apply' | translate"
            [loading]="bulkSaving"
            (click)="aplicarBulk()"></button>
          <button
            pButton
            type="button"
            class="p-button-text p-button-sm"
            [label]="'capacidade.bulk.clear' | translate"
            (click)="limparSelecao()"></button>
        </div>
        <div class="hangar-filter" *ngIf="hangarFilterOptions.length > 1">
          <label for="cap-hangar-filter">{{ 'capacidade.filter.hangar' | translate }}</label>
          <p-dropdown
            inputId="cap-hangar-filter"
            [options]="hangarFilterOptions"
            [(ngModel)]="filtroHangarId"
            optionLabel="label"
            optionValue="value"
            (onChange)="carregar()"
            styleClass="hangar-dd"></p-dropdown>
        </div>
        <div class="total-badge" *ngIf="quadro">
          {{ 'capacidade.total' | translate: { n: quadro.totalAbertas } }}
        </div>
      </div>

      <div *ngIf="loading" class="loading" role="status" [attr.aria-label]="'ui.loading' | translate">
        <p-progressSpinner strokeWidth="3" ariaHidden="true"></p-progressSpinner>
      </div>

      <div *ngIf="!loading && quadro" class="kanban-board">
        <div class="kanban-col" *ngFor="let estagio of estagios">
          <ng-container *ngIf="coluna(estagio) as col">
            <div class="col-head">
              <span>{{ colLabel(col.estagio) }}</span>
              <span class="col-count">{{ col.cartoes.length }}</span>
            </div>
            <div
              class="col-body"
              cdkDropList
              [id]="'cap-col-' + estagio"
              [cdkDropListData]="col.cartoes"
              [cdkDropListConnectedTo]="dropListIds"
              (cdkDropListDropped)="onDrop($event, col.estagio)">
              <p *ngIf="col.cartoes.length === 0" class="card-meta col-empty">{{ 'capacidade.empty' | translate }}</p>
              <div
                class="os-card"
                *ngFor="let c of cartoesVisiveis(col); trackBy: trackCard"
                cdkDrag
                [cdkDragDisabled]="bulkMode"
                [class.aog]="c.prioridadeFila === 'AOG'"
                [class.selected]="bulkMode && selectedOsIds.has(c.osId)"
                (click)="onCardClick(c, $event)">
                <p-checkbox
                  *ngIf="bulkMode"
                  [binary]="true"
                  [ngModel]="selectedOsIds.has(c.osId)"
                  (ngModelChange)="toggleSelect(c.osId, $event)"
                  (click)="$event.stopPropagation()"></p-checkbox>
                <div class="card-top">
                  <strong>OS {{ c.numeroOs }}</strong>
                  <p-tag
                    *ngIf="c.prioridadeFila === 'AOG'"
                    [value]="'capacidade.priority.AOG' | translate"
                    severity="danger"></p-tag>
                </div>
                <div class="card-meta">{{ c.clienteNome || '—' }}</div>
                <div class="card-meta" *ngIf="c.hangarNome">
                  {{ 'capacidade.card.hangar' | translate: { nome: c.hangarNome } }}
                </div>
                <div class="card-meta" *ngIf="c.partNumber">PN {{ c.partNumber }}</div>
                <div class="card-meta">{{ 'capacidade.card.position' | translate: { n: c.posicaoFila } }}</div>
                <p-tag
                  *ngIf="c.temDeficitKitFcu"
                  [value]="'capacidade.badge.deficitKit' | translate"
                  severity="warn"
                  class="mt-1"></p-tag>
                <p-tag [value]="slaLabel(c.slaStatus)" [severity]="slaSeverity(c.slaStatus)" class="mt-1"></p-tag>
              </div>
              <button
                *ngIf="temMaisCards(col)"
                type="button"
                class="col-load-more"
                (click)="carregarMaisColuna(col.estagio); $event.stopPropagation()">
                {{ 'capacidade.col.loadMore' | translate:{ n: restantesColuna(col) + '' } }}
              </button>
            </div>
          </ng-container>
        </div>
      </div>

      <p-dialog
        styleClass="as-hero-dialog" [(visible)]="editVisible"
        [header]="'capacidade.edit.title' | translate"
        [modal]="true"
        [style]="{ width: '420px' }"
        appendTo="body">
        <div class="edit-form" *ngIf="editCard">
          <div class="field">
            <label>{{ 'capacidade.edit.stage' | translate }}</label>
            <p-dropdown
              [options]="estagioOptions"
              [(ngModel)]="editEstagio"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"></p-dropdown>
          </div>
          <div class="field">
            <label>{{ 'capacidade.edit.priority' | translate }}</label>
            <p-dropdown
              [options]="prioridadeOptions"
              [(ngModel)]="editPrioridade"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"></p-dropdown>
          </div>
          <div class="field">
            <label>{{ 'capacidade.edit.dueDate' | translate }}</label>
            <p-calendar
              [(ngModel)]="editDataPrevista"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              styleClass="w-full"></p-calendar>
          </div>
          <div class="field" *ngIf="hangarEditOptions.length">
            <label>{{ 'capacidade.edit.hangar' | translate }}</label>
            <p-dropdown
              [options]="hangarEditOptions"
              [(ngModel)]="editHangarId"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"></p-dropdown>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button
            pButton
            type="button"
            class="p-button-text"
            [label]="'capacidade.btn.cancel' | translate"
            (click)="editVisible = false"></button>
          <button
            pButton
            type="button"
            [label]="'capacidade.btn.save' | translate"
            [loading]="saving"
            (click)="salvarEdicao()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [
    `
      .loading {
        display: flex;
        justify-content: center;
        padding: 3rem;
      }
      .mt-1 {
        margin-top: 0.35rem;
      }
      .drag-hint {
        font-size: 0.85rem;
        color: #475569;
        margin: 0 0 1rem;
      }
      .hangar-filter {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .hangar-filter label {
        font-weight: 600;
        font-size: 0.9rem;
      }
      .toolbar-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
        margin-bottom: 0.75rem;
      }
      .manage-hangar-link {
        color: #0369a1;
        text-decoration: none;
        font-size: 0.9rem;
      }
      .bulk-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding: 0.65rem 0.85rem;
        background: #f1f5f9;
        border-radius: 8px;
      }
      .os-card.selected {
        outline: 2px solid #0ea5e9;
      }
      .cdk-drag-preview {
        box-sizing: border-box;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2);
        background: #fff;
        padding: 0.65rem 0.75rem;
        max-width: 280px;
      }
      .cdk-drag-placeholder {
        opacity: 0.35;
        border: 2px dashed #0ea5e9;
        border-radius: 10px;
        min-height: 72px;
      }
    `
  ]
})
export class CapacidadeQuadroComponent implements OnInit {
  private svc = inject(CapacidadeFilaService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  private readonly cardsPorPaginaColuna = 60;
  private limitesColuna: Record<string, number> = {};

  quadro: CapacidadeQuadro | null = null;
  loading = true;
  editVisible = false;
  editCard: CapacidadeQuadroCard | null = null;
  editEstagio = 'AGUARDANDO';
  editPrioridade = 'NORMAL';
  editDataPrevista: Date | null = null;
  saving = false;
  readonly estagios = [...ESTAGIOS];
  dropListIds: string[] = this.estagios.map(e => 'cap-col-' + e);

  estagioOptions: { label: string; value: string }[] = [];
  prioridadeOptions: { label: string; value: string }[] = [];
  hangarFilterOptions: { label: string; value: number | null }[] = [];
  hangarEditOptions: { label: string; value: number | null }[] = [];
  filtroHangarId: number | null = null;
  editHangarId: number | null = null;
  bulkMode = false;
  bulkTargetEstagio = 'AGUARDANDO';
  bulkSaving = false;
  selectedOsIds = new Set<number>();

  ngOnInit(): void {
    this.buildOptions();
    this.i18n.getCurrentLanguage$().subscribe(() => {
      this.buildOptions();
      this.buildHangarOptions(this.hangaresCarregados);
    });
    this.carregar();
    this.svc.listarHangares().subscribe({
      next: list => {
        this.hangaresCarregados = list;
        this.buildHangarOptions(list);
      },
      error: () => {}
    });
  }

  private hangaresCarregados: HangarOption[] = [];

  private buildOptions(): void {
    this.estagioOptions = ESTAGIOS.map(v => ({
      value: v,
      label: this.i18n.translate(`capacidade.col.${v}`)
    }));
    this.prioridadeOptions = ['NORMAL', 'AOG'].map(v => ({
      value: v,
      label: this.i18n.translate(`capacidade.priority.${v}`)
    }));
  }

  private buildHangarOptions(list: HangarOption[]): void {
    const allLabel = this.i18n.translate('capacidade.filter.allHangares');
    this.hangarFilterOptions = [
      { label: allLabel, value: null },
      ...list.map(h => ({ label: h.nome, value: h.id }))
    ];
    this.hangarEditOptions = list.map(h => ({ label: h.nome, value: h.id }));
  }

  carregar(): void {
    this.loading = true;
    this.limitesColuna = {};
    const hangarId = this.filtroHangarId != null && this.filtroHangarId > 0 ? this.filtroHangarId : null;
    this.svc.obterQuadro(hangarId).subscribe({
      next: q => {
        this.quadro = q;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.errToast(err);
        this.cdr.markForCheck();
      }
    });
  }

  trackCard(_index: number, c: CapacidadeQuadroCard): number {
    return c.osId;
  }

  cartoesVisiveis(col: CapacidadeQuadroColuna): CapacidadeQuadroCard[] {
    const limite = this.limitesColuna[col.estagio] ?? this.cardsPorPaginaColuna;
    return col.cartoes.slice(0, limite);
  }

  temMaisCards(col: CapacidadeQuadroColuna): boolean {
    const limite = this.limitesColuna[col.estagio] ?? this.cardsPorPaginaColuna;
    return col.cartoes.length > limite;
  }

  restantesColuna(col: CapacidadeQuadroColuna): number {
    const limite = this.limitesColuna[col.estagio] ?? this.cardsPorPaginaColuna;
    return Math.max(0, col.cartoes.length - limite);
  }

  carregarMaisColuna(estagio: string): void {
    const atual = this.limitesColuna[estagio] ?? this.cardsPorPaginaColuna;
    this.limitesColuna = {
      ...this.limitesColuna,
      [estagio]: atual + this.cardsPorPaginaColuna
    };
    this.cdr.markForCheck();
  }

  private errToast(err: unknown): void {
    let key = 'capacidade.err.load';
    if (err instanceof HttpErrorResponse) {
      key = extractApiErrorKey(err.error) ?? key;
    }
    this.toast.add({ severity: 'error', summary: this.i18n.translate(key) });
  }

  coluna(estagio: string): CapacidadeQuadroColuna | undefined {
    return this.quadro?.colunas.find(c => c.estagio === estagio);
  }

  colLabel(estagio: string): string {
    return this.i18n.translate(`capacidade.col.${estagio}`);
  }

  slaLabel(s: string): string {
    const key = s === 'ATENCAO' || s === 'ATRASADO' || s === 'OK' ? s : 'OK';
    return this.i18n.translate(`capacidade.sla.${key}`);
  }

  slaSeverity(s: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast' | undefined {
    if (s === 'ATRASADO') return 'danger';
    if (s === 'ATENCAO') return 'warn';
    return 'success';
  }

  onDrop(event: CdkDragDrop<CapacidadeQuadroCard[]>, targetEstagio: string): void {
    if (!this.quadro || event.previousContainer === event.container) {
      return;
    }
    const card = event.previousContainer.data[event.previousIndex];
    if (!card || card.filaEstagio === targetEstagio) {
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    card.filaEstagio = targetEstagio;
    this.cdr.markForCheck();

    this.svc.atualizarOs(card.osId, { filaEstagio: targetEstagio }).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: this.i18n.translate('capacidade.toast.moved') });
      },
      error: err => {
        this.errToast(err);
        this.carregar();
      }
    });
  }

  toggleBulkMode(): void {
    this.bulkMode = !this.bulkMode;
    if (!this.bulkMode) {
      this.limparSelecao();
    }
  }

  onCardClick(c: CapacidadeQuadroCard, event?: MouseEvent): void {
    if (this.bulkMode) {
      this.toggleSelect(c.osId, event);
      return;
    }
    this.abrirEdicao(c, event);
  }

  toggleSelect(osId: number, event?: Event): void {
    event?.stopPropagation();
    if (this.selectedOsIds.has(osId)) {
      this.selectedOsIds.delete(osId);
    } else {
      this.selectedOsIds.add(osId);
    }
    this.selectedOsIds = new Set(this.selectedOsIds);
  }

  limparSelecao(): void {
    this.selectedOsIds = new Set();
  }

  aplicarBulk(): void {
    if (this.selectedOsIds.size === 0) {
      return;
    }
    this.bulkSaving = true;
    const updates = [...this.selectedOsIds].map(osId => ({
      osId,
      filaEstagio: this.bulkTargetEstagio
    }));
    this.svc.atualizarOsEmLote(updates).subscribe({
      next: () => {
        this.bulkSaving = false;
        this.toast.add({
          severity: 'success',
          summary: this.i18n.translate('capacidade.toast.bulkMoved', { n: String(updates.length) })
        });
        this.limparSelecao();
        this.carregar();
      },
      error: err => {
        this.bulkSaving = false;
        this.errToast(err);
        this.carregar();
      }
    });
  }

  abrirEdicao(c: CapacidadeQuadroCard, event?: MouseEvent): void {
    event?.stopPropagation();
    this.editCard = c;
    this.editEstagio = c.filaEstagio;
    this.editPrioridade = c.prioridadeFila;
    this.editDataPrevista = c.dataPrevistaConclusao ? new Date(c.dataPrevistaConclusao + 'T12:00:00') : null;
    this.editHangarId = c.hangarId ?? null;
    this.editVisible = true;
  }

  salvarEdicao(): void {
    if (!this.editCard) return;
    this.saving = true;
    const iso = this.editDataPrevista ? this.editDataPrevista.toISOString().slice(0, 10) : '';
    this.svc
      .atualizarOs(this.editCard.osId, {
        filaEstagio: this.editEstagio,
        prioridadeFila: this.editPrioridade,
        dataPrevistaConclusao: iso,
        hangarId: this.editHangarId
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.editVisible = false;
          this.toast.add({ severity: 'success', summary: this.i18n.translate('capacidade.toast.saved') });
          this.carregar();
        },
        error: err => {
          this.saving = false;
          this.errToast(err);
        }
      });
  }
}
