import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../core/translate.pipe';

/** Overlay leve sobre lista com dados durante refresh (paginação/filtros). */
@Component({
  selector: 'app-list-refresh-overlay',
  standalone: true,
  imports: [TranslatePipe],
  styleUrls: ['./list-refresh-overlay.component.scss'],
  template: `
    @if (loading) {
      <div
        class="list-refresh-overlay"
        role="status"
        aria-live="polite"
        [attr.aria-label]="labelKey | translate">
        <div class="list-refresh-overlay__inner">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <span>{{ labelKey | translate }}</span>
        </div>
      </div>
    }
  `
})
export class ListRefreshOverlayComponent {
  @Input() loading = false;
  @Input() labelKey = 'ui.list.refreshing';
}
