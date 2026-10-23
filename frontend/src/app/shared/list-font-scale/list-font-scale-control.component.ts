import { Component, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ListFontScaleService } from './list-font-scale.service';

/**
 * Controle de acessibilidade: aumenta/diminui a fonte dos resultados da lista.
 * Use junto com a classe `list-results-scaled` e
 * `[style.--list-result-font-scale]="listFontScale.scale()"`.
 */
@Component({
  selector: 'app-list-font-scale-control',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="lfs" role="group" aria-label="Tamanho da fonte dos resultados">
      <span class="lfs-caption" aria-hidden="true">
        <i class="pi pi-search-plus"></i>
        Fonte
      </span>
      <button
        type="button"
        class="lfs-btn"
        (click)="svc.decrease()"
        [disabled]="!svc.canDecrease()"
        aria-label="Diminuir fonte dos resultados"
        pTooltip="Diminuir fonte"
        tooltipPosition="top">
        <span class="lfs-letter">A</span><span class="lfs-op">−</span>
      </button>
      <span class="lfs-value" aria-live="polite">{{ svc.percentLabel }}</span>
      <button
        type="button"
        class="lfs-btn lfs-btn-plus"
        (click)="svc.increase()"
        [disabled]="!svc.canIncrease()"
        aria-label="Aumentar fonte dos resultados"
        pTooltip="Aumentar fonte"
        tooltipPosition="top">
        <span class="lfs-letter lfs-letter-lg">A</span><span class="lfs-op">+</span>
      </button>
    </div>
  `,
  styles: [`
    .list-results-a11y-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px 12px 4px;
      flex-shrink: 0;
    }

    .lfs {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 10px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      user-select: none;
    }

    .lfs-caption {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-right: 2px;
    }

    .lfs-caption i {
      font-size: 0.85rem;
      color: #0284c7;
    }

    .lfs-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 1px;
      min-width: 36px;
      height: 32px;
      padding: 0 8px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #fff;
      color: #0f172a;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
    }

    .lfs-btn:hover:not(:disabled) {
      background: #e0f2fe;
      border-color: #7dd3fc;
    }

    .lfs-btn:focus-visible {
      outline: 2px solid #0284c7;
      outline-offset: 2px;
    }

    .lfs-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .lfs-letter {
      font-weight: 700;
      font-size: 0.85rem;
      line-height: 1;
    }

    .lfs-letter-lg {
      font-size: 1.05rem;
    }

    .lfs-op {
      font-weight: 700;
      font-size: 0.95rem;
      line-height: 1;
      color: #0369a1;
    }

    .lfs-value {
      min-width: 3.25rem;
      text-align: center;
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
      font-variant-numeric: tabular-nums;
    }

    .list-results-scaled {
      --list-result-font-scale: 1;
      --list-result-fs: calc(0.875rem * var(--list-result-font-scale, 1));
      font-size: var(--list-result-fs);
    }

    /* Cabeçalho, linhas e paginação — força escala inclusive em filhos com font-size fixo */
    .list-results-scaled .p-datatable .p-datatable-thead > tr > th,
    .list-results-scaled .p-datatable .p-datatable-tbody > tr > td,
    .list-results-scaled .p-datatable .p-datatable-tfoot > tr > td,
    .list-results-scaled .p-datatable .p-paginator,
    .list-results-scaled .p-datatable .p-paginator .p-paginator-current,
    .list-results-scaled .p-datatable .p-paginator .p-dropdown-label,
    .list-results-scaled .p-datatable .p-datatable-thead > tr > th *:not(.pi):not(i):not(svg),
    .list-results-scaled .p-datatable .p-datatable-tbody > tr > td *:not(.pi):not(i):not(svg):not(.p-button-icon),
    .list-results-scaled .p-datatable .p-datatable-tfoot > tr > td *:not(.pi):not(i):not(svg) {
      font-size: var(--list-result-fs) !important;
    }

    .list-results-scaled .p-datatable .p-datatable-tbody > tr > td .p-tag,
    .list-results-scaled .p-datatable .p-datatable-tbody > tr > td .p-badge,
    .list-results-scaled .p-datatable .p-datatable-tbody > tr > td .p-tag .p-tag-value,
    .list-results-scaled .p-datatable .p-datatable-tbody > tr > td .p-badge-value {
      font-size: var(--list-result-fs) !important;
    }

    .list-results-scaled .p-datatable .p-datatable-thead > tr > th,
    .list-results-scaled .p-datatable .p-datatable-tbody > tr > td {
      padding-block: calc(10px * var(--list-result-font-scale, 1));
    }

    @media (max-width: 480px) {
      .lfs-caption {
        font-size: 0;
        gap: 0;
        margin-right: 0;
      }
      .lfs-caption i {
        font-size: 0.9rem;
      }
    }
  `]
})
export class ListFontScaleControlComponent {
  readonly svc = inject(ListFontScaleService);
}
