import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteNavigationLoadingService } from '../../core/route-navigation-loading.service';
import { TranslatePipe } from '../../core/translate.pipe';

/** Barra fina de progresso durante navegação entre rotas (lazy chunks). */
@Component({
  selector: 'app-route-loading-bar',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  styleUrls: ['./route-loading-bar.component.scss'],
  template: `
    @if (routeNavigationLoading.active()) {
      <div
        class="route-loading-bar"
        role="progressbar"
        [attr.aria-label]="'layout.routeLoading' | translate">
        <div class="route-loading-bar__track">
          <div class="route-loading-bar__indeterminate"></div>
        </div>
      </div>
    }
  `
})
export class RouteLoadingBarComponent {
  readonly routeNavigationLoading = inject(RouteNavigationLoadingService);
}
