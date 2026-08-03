import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="as-table-card" role="status" aria-busy="true" [attr.aria-label]="ariaLabel">
      @for (row of rowsArray; track row) {
        <div class="as-skeleton-row">
          @for (col of colsArray; track col) {
            <div class="as-skeleton as-skeleton-cell" [class.wide]="col === 0"></div>
          }
        </div>
      }
    </div>
  `
})
export class SkeletonTableComponent {
  @Input() rows = 6;
  @Input() cols = 6;
  @Input() ariaLabel = 'Loading';

  get rowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }

  get colsArray(): number[] {
    return Array.from({ length: this.cols }, (_, i) => i);
  }
}
