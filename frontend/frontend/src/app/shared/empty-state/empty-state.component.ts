import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonModule, TranslatePipe],
  template: `
    <div class="as-empty-state" role="status">
      <div class="as-empty-state__icon" aria-hidden="true">
        <i class="pi" [ngClass]="icon"></i>
      </div>
      <h3 class="as-empty-state__title">
        @if (titleKey) {
          {{ titleKey | translate }}
        } @else {
          {{ title }}
        }
      </h3>
      @if (descriptionKey || description) {
        <p class="as-empty-state__desc">
          @if (descriptionKey) {
            {{ descriptionKey | translate }}
          } @else {
            {{ description }}
          }
        </p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  @Input() icon = 'pi-inbox';
  @Input() title = '';
  @Input() titleKey = 'ui.empty.title';
  @Input() description?: string;
  @Input() descriptionKey = 'ui.empty.description';
}
