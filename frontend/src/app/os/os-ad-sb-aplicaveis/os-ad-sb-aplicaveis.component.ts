import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AeroDiretriz, AeroDiretrizService } from '../../core/aero-diretriz.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { SkeletonTableComponent } from '../../shared/skeleton-table/skeleton-table.component';
import { TranslationService } from '../../core/translation.service';

@Component({
  selector: 'app-os-ad-sb-aplicaveis',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, TagModule, ButtonModule, TranslatePipe, SkeletonTableComponent],
  styles: [
    `
      .panel {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
        background: #f8fafc;
      }
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .panel-header h4 {
        margin: 0;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      .empty {
        color: #64748b;
        font-size: 0.85rem;
        margin: 0;
      }
    `
  ],
  template: `
    <div class="panel" *ngIf="visible">
      <div class="panel-header">
        <h4><i class="pi pi-exclamation-triangle"></i> {{ 'os.form.adSb.panelTitle' | translate }}</h4>
        <a pButton class="p-button-text p-button-sm" routerLink="/aero/diretrizes" [label]="'os.form.adSb.openCadastro' | translate"></a>
      </div>
      <app-skeleton-table *ngIf="loading" [rows]="3" [cols]="4" [ariaLabel]="'os.form.adSb.loading' | translate"></app-skeleton-table>
      <p *ngIf="!loading && itens.length === 0" class="empty">{{ 'os.form.adSb.empty' | translate }}</p>
      <p-table *ngIf="!loading && itens.length > 0" [value]="itens" [scrollable]="true" scrollHeight="160px">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'os.form.adSb.col.tipo' | translate }}</th>
            <th>{{ 'os.form.adSb.col.numero' | translate }}</th>
            <th>{{ 'os.form.adSb.col.prazo' | translate }}</th>
            <th>{{ 'os.form.adSb.col.status' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row>
          <tr>
            <td><p-tag [value]="labelTipo(row.tipo)"></p-tag></td>
            <td>{{ row.numero }}</td>
            <td>
              {{ row.dataLimiteCumprimento || '—' }}
              <p-tag
                *ngIf="row.severidadeAlerta"
                [severity]="sevTag(row.severidadeAlerta)"
                [value]="labelSev(row.severidadeAlerta)"
                class="ml-1"></p-tag>
            </td>
            <td>{{ labelStatus(row.status) }}</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
})
export class OsAdSbAplicaveisComponent implements OnChanges {
  private svc = inject(AeroDiretrizService);
  private i18n = inject(TranslationService);

  @Input() fcuId: number | null = null;
  @Input() partNumber = '';
  @Input() serialNumber = '';

  itens: AeroDiretriz[] = [];
  loading = false;
  visible = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fcuId'] || changes['partNumber'] || changes['serialNumber']) {
      this.carregar();
    }
  }

  carregar(): void {
    const pn = this.partNumber?.trim();
    const sn = this.serialNumber?.trim();
    const fcu = this.fcuId != null && this.fcuId > 0 ? this.fcuId : undefined;
    if (!fcu && !pn && !sn) {
      this.visible = false;
      this.itens = [];
      return;
    }
    this.visible = true;
    this.loading = true;
    this.svc.aplicaveis(fcu, pn || undefined, sn || undefined).subscribe({
      next: res => {
        this.itens = res.itens ?? [];
        this.loading = false;
      },
      error: () => {
        this.itens = [];
        this.loading = false;
      }
    });
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
}
