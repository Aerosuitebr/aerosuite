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
import { MessageService } from 'primeng/api';
import {
  ConformidadeChecklistItem,
  ConformidadeReleaseAceite,
  ConformidadeReleaseMeta,
  ConformidadeSgqService
} from '../../core/conformidade-sgq.service';
import { TranslationService } from '../../core/translation.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { ListTableScrollDirective } from '../../shared/list-table-scroll/list-table-scroll.directive';
import { ListDataStatesComponent } from '../../shared/list-data-states/list-data-states.component';

@Component({
  selector: 'app-release-aceite',
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
    TranslatePipe,
    PageHeroComponent,
    ListDataStatesComponent
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="as-page page conformidade-module">
      <app-page-hero
        variant="navy"
        titleKey="conformidade.release.title"
        subtitleKey="conformidade.release.subtitle"
        titleIcon="pi-code"
        [hasActions]="true">
        <div actions>
          <button pButton icon="pi pi-check" [label]="'conformidade.release.btn.aceitar' | translate" (click)="abrirAceite()"></button>
        </div>
      </app-page-hero>
      <div class="meta-card" *ngIf="meta">
        <span>{{ 'conformidade.release.meta.versao' | translate }}: <strong>{{ meta.versaoApp }}</strong></span>
        <span>{{ 'conformidade.release.meta.flyway' | translate }}: <strong>{{ meta.flywayAte || '—' }}</strong></span>
      </div>
      <app-list-data-states
        [loading]="loading"
        [itemCount]="itens.length"
        [skeletonRows]="6"
        [skeletonCols]="5"
        emptyTitleKey="conformidade.release.empty"
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
              <th>{{ 'conformidade.release.col.versao' | translate }}</th>
              <th>{{ 'conformidade.release.col.tipo' | translate }}</th>
              <th>{{ 'conformidade.release.col.impacto' | translate }}</th>
              <th>{{ 'conformidade.release.col.aceite' | translate }}</th>
              <th>{{ 'conformidade.release.col.data' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.versaoApp }} <small *ngIf="row.flywayAte">(Flyway {{ row.flywayAte }})</small></td>
              <td>{{ labelTipo(row.tipoMudanca) }}</td>
              <td>
                <p-tag
                  [severity]="row.impactoRegulatorio ? 'danger' : 'info'"
                  [value]="row.impactoRegulatorio ? ('conformidade.release.impacto.sim' | translate) : ('conformidade.release.impacto.nao' | translate)"></p-tag>
              </td>
              <td>{{ row.aceiteUsuarioNome || row.aceiteUsuarioId }}</td>
              <td>{{ row.aceiteEm || '—' }}</td>
            </tr>
          </ng-template>
        </p-table>
      </app-list-data-states>
      <p-dialog
        styleClass="as-hero-dialog conformidade-dialog"
        [(visible)]="showDialog"
        [header]="'conformidade.release.dialog.title' | translate"
        [modal]="true"
        [style]="{ width: '640px' }">
        <div class="form-grid">
          <div class="row-2">
            <div><label>{{ 'conformidade.release.field.versao' | translate }}</label><input pInputText [(ngModel)]="form.versaoApp" class="w-full" /></div>
            <div><label>{{ 'conformidade.release.field.flyway' | translate }}</label><input pInputText [(ngModel)]="form.flywayAte" class="w-full" /></div>
          </div>
          <div class="row-2">
            <div><label>{{ 'conformidade.release.field.tipo' | translate }}</label>
              <p-dropdown [(ngModel)]="form.tipoMudanca" [options]="tipoOptions" optionLabel="label" optionValue="value" styleClass="w-full"></p-dropdown>
            </div>
            <div class="impacto-row">
              <p-checkbox [(ngModel)]="form.impactoRegulatorio" [binary]="true" inputId="impacto"></p-checkbox>
              <label for="impacto">{{ 'conformidade.release.field.impacto' | translate }}</label>
            </div>
          </div>
          <div>
            <h4>{{ 'conformidade.release.checklist.title' | translate }}</h4>
            <div class="check-item" *ngFor="let item of form.checklist">
              <p-checkbox [(ngModel)]="item.concluido" [binary]="true" [inputId]="'rel-' + item.id"></p-checkbox>
              <label [for]="'rel-' + item.id">{{ checklistLabel(item) }}</label>
            </div>
          </div>
          <div><label>{{ 'conformidade.release.field.obs' | translate }}</label><textarea pInputTextarea rows="2" [(ngModel)]="form.observacoes"></textarea></div>
        </div>
        <div class="dialog-actions">
          <button pButton class="p-button-text" [label]="'common.actions.cancel' | translate" (click)="showDialog = false"></button>
          <button pButton icon="pi pi-check" [loading]="salvando" [label]="'conformidade.release.btn.confirmar' | translate" (click)="registrar()"></button>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [
    `.page { padding: 0 8px 2rem; }`,
    `.meta-card { display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1rem; padding: 0.75rem 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }`,
    `.form-grid { display: grid; gap: 0.75rem; }`,
    `.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; align-items: end; }`,
    `.check-item, .impacto-row { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }`,
    `.dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }`
  ]
})
export class ReleaseAceiteComponent implements OnInit {
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;
  private svc = inject(ConformidadeSgqService);
  private i18n = inject(TranslationService);
  private toast = inject(MessageService);

  itens: ConformidadeReleaseAceite[] = [];
  total = 0;
  loading = true;
  meta: ConformidadeReleaseMeta | null = null;
  showDialog = false;
  salvando = false;
  form: Partial<ConformidadeReleaseAceite> = { checklist: [], impactoRegulatorio: false };

  tipoOptions: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.tipoOptions = [
      { value: 'CORRETIVA', label: this.i18n.translate('conformidade.release.tipo.CORRETIVA') },
      { value: 'EVOLUTIVA', label: this.i18n.translate('conformidade.release.tipo.EVOLUTIVA') },
      { value: 'REGULATORIA', label: this.i18n.translate('conformidade.release.tipo.REGULATORIA') },
      { value: 'INFRA', label: this.i18n.translate('conformidade.release.tipo.INFRA') },
      { value: 'SCHEMA', label: this.i18n.translate('conformidade.release.tipo.SCHEMA') }
    ];
    this.svc.releases.meta().subscribe(m => (this.meta = m));
    this.buscar();
  }

  carregar(event?: { first?: number; rows?: number }): void {
    const page = event?.first != null && event?.rows ? Math.floor(event.first / event.rows) : 0;
    const size = event?.rows ?? DEFAULT_LIST_PAGE_SIZE;
    this.loading = true;
    this.svc.releases.listar({ page, size }).subscribe({
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

  labelTipo(t?: string): string {
    return t ? this.i18n.translateCatalog('conformidade.release.tipo', t, t) : '—';
  }

  checklistLabel(item: ConformidadeChecklistItem): string {
    const key = `conformidade.release.check.${item.id}`;
    const t = this.i18n.translate(key);
    return t !== key ? t : item.label || item.id || '';
  }

  abrirAceite(): void {
    this.svc.releases.meta().subscribe(m => {
      this.meta = m;
      this.form = {
        versaoApp: m.versaoApp,
        flywayAte: m.flywayAte,
        tipoMudanca: 'EVOLUTIVA',
        impactoRegulatorio: false,
        checklist: (m.checklistPadrao ?? []).map(i => ({ ...i })),
        observacoes: ''
      };
      this.showDialog = true;
    });
  }

  registrar(): void {
    this.salvando = true;
    this.svc.releases.registrar(this.form).subscribe({
      next: () => {
        this.salvando = false;
        this.showDialog = false;
        this.toast.add({ severity: 'success', summary: this.i18n.translate('conformidade.release.toast.ok') });
        this.svc.releases.meta().subscribe(m => (this.meta = m));
        this.buscar();
      },
      error: err => {
        this.salvando = false;
        this.toast.add({ severity: 'error', summary: this.i18n.translateApiError(err?.error, 'conformidade.err.salvar') });
      }
    });
  }
}
