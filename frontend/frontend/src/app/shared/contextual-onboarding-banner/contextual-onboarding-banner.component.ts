import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ContextualOnboardingService } from '../../core/contextual-onboarding.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-contextual-onboarding-banner',
  standalone: true,
  imports: [CommonModule, ButtonModule, TranslatePipe],
  template: `
    @if (onboarding.activeTip; as tip) {
      <aside class="as-onboarding-banner" role="status" [attr.aria-label]="'onboarding.aria.region' | translate">
        <div class="as-onboarding-banner__icon" aria-hidden="true">
          <i class="pi" [ngClass]="tip.icon || 'pi-info-circle'"></i>
        </div>
        <div class="as-onboarding-banner__copy">
          <strong>{{ onboarding.title(tip) }}</strong>
          <p>{{ onboarding.body(tip) }}</p>
        </div>
        <button
          pButton
          type="button"
          class="p-button-text p-button-sm as-onboarding-banner__dismiss"
          icon="pi pi-times"
          [attr.aria-label]="'onboarding.btn.dismiss' | translate"
          (click)="onboarding.dismiss(tip.id)"></button>
      </aside>
    }
  `,
  styles: [`
    .as-onboarding-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin: 0 0 16px;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 45%, #0c4a6e 100%);
      color: #fff;
    }
    .as-onboarding-banner__icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
      font-size: 1.1rem;
    }
    .as-onboarding-banner__copy {
      flex: 1;
      min-width: 0;
    }
    .as-onboarding-banner__copy strong {
      display: block;
      font-size: 0.9375rem;
      margin-bottom: 4px;
    }
    .as-onboarding-banner__copy p {
      margin: 0;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.45;
    }
    .as-onboarding-banner__dismiss {
      flex-shrink: 0;
      color: #fff !important;
    }
    :host-context([data-theme='dark']) .as-onboarding-banner {
      border-color: rgba(255, 255, 255, 0.2);
    }
    :host-context([data-theme='dark']) .as-onboarding-banner__copy p {
      color: rgba(255, 255, 255, 0.9);
    }
  `]
})
export class ContextualOnboardingBannerComponent {
  readonly onboarding = inject(ContextualOnboardingService);
}
