import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslationService } from '../core/translation.service';
import { OSService, OSPendenteTrocaPagamento } from '../core/os.service';
import { TranslatePipe } from '../core/translate.pipe';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';

@Component({
  selector: 'app-os-pendentes-trocas-pagamento',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, CardModule, ToastModule, TranslatePipe, PageHeroComponent, ListDataStatesComponent],
  template: `
    <p-toast></p-toast>
    <div class="page-wrap">
      <app-page-hero
        variant="gold"
        titleKey="os.pendentesTrocas.title"
        subtitleKey="os.pendentesTrocas.subtitle"
        titleIcon="pi-list"
        [hasActions]="true">
        <div actions>
          <button pButton type="button" [label]="'os.pendentesTrocas.btnBack' | translate" icon="pi pi-arrow-left" class="p-button-outlined" (click)="router.navigate(['/os'])"></button>
        </div>
      </app-page-hero>
      <p-card>
        <app-list-data-states
          [loading]="loading"
          [itemCount]="rows.length"
          [skeletonRows]="6"
          [skeletonCols]="4"
          emptyTitleKey="os.pendentesTrocas.empty"
          emptyDescriptionKey="ui.empty.description">
        <p-table [value]="rows" [loading]="loading" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'os.pendentesTrocas.col.idOs' | translate }}</th>
              <th>{{ 'os.pendentesTrocas.col.cliente' | translate }}</th>
              <th>{{ 'os.pendentesTrocas.col.pendentes' | translate }}</th>
              <th style="width: 140px;">{{ 'os.pendentesTrocas.col.acao' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td><strong>{{ row.idOs }}</strong></td>
              <td>{{ row.clienteNome || '—' }}</td>
              <td>{{ row.itensPendentesPagamento }}</td>
              <td>
                <button pButton type="button" class="p-button-sm" [label]="'os.pendentesTrocas.btnAbrir' | translate" (click)="abrirOs(row.id)"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="4"></td></tr>
          </ng-template>
        </p-table>
        </app-list-data-states>
      </p-card>
    </div>
  `,
  styles: [`
    .page-wrap { padding: 1.25rem; max-width: 960px; margin: 0 auto; }
    .empty { text-align: center; padding: 1.5rem; color: #94a3b8; }
  `]
})
export class OsPendentesTrocasPagamentoComponent implements OnInit {
  private api = inject(OSService);
  readonly router = inject(Router);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);

  rows: OSPendenteTrocaPagamento[] = [];
  loading = true;

  ngOnInit() {
    this.load();
  }

  abrirOs(id: number) {
    this.router.navigate(['/os'], { queryParams: { editId: String(id) } });
  }

  load() {
    this.loading = true;
    this.api.listPendentesPagamentoTrocas().subscribe({
      next: (data) => {
        this.rows = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) {
          this.i18n.addToast(this.messageService, 'warn', 'auth.interceptor.toast.forbiddenSummary', 'os.pendentesTrocas.toast.accessDenied');
          this.router.navigate(['/os']);
          return;
        }
        this.i18n.addToast(this.messageService, 'error', 'common.toast.error', 'os.pendentesTrocas.toast.loadError');
      }
    });
  }
}
