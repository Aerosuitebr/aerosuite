import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TranslatePipe } from '../core/translate.pipe';
import { P1ApiService, BillingStatus } from './p1-api.service';

@Component({
  selector: 'app-billing-page',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, MessageModule, TranslatePipe],
  template: `
    <div class="page-shell">
      <h1>{{ 'p1.billing.title' | translate }}</h1>

      <p-message
        *ngIf="stripeBanner === 'success'"
        severity="success"
        [text]="'p1.billing.stripeSuccess' | translate"
        styleClass="w-full mb-3">
      </p-message>
      <p-message
        *ngIf="stripeBanner === 'cancel'"
        severity="warn"
        [text]="'p1.billing.stripeCancel' | translate"
        styleClass="w-full mb-3">
      </p-message>

      <p-card *ngIf="status">
        <p><strong>{{ 'p1.billing.plan' | translate }}:</strong> {{ status.planoCodigo }}</p>
        <p><strong>{{ 'p1.billing.status' | translate }}:</strong> {{ status.status }}</p>
        <p *ngIf="status.trialEndsAt"><strong>{{ 'p1.billing.trialEnds' | translate }}:</strong> {{ status.trialEndsAt | date:'short' }}</p>
        <p *ngIf="status.provedor === 'stripe' && status.stripeConfigured" class="hint">
          {{ 'p1.billing.stripeRedirect' | translate }}
        </p>
        <div class="actions">
          <button pButton type="button" [label]="'p1.billing.checkout' | translate" (click)="checkout()" *ngIf="status.checkoutAvailable"></button>
          <button
            pButton
            type="button"
            class="p-button-outlined"
            [label]="'p1.billing.mockActivate' | translate"
            (click)="mock()"
            *ngIf="showMockActivate"></button>
        </div>
      </p-card>
    </div>
  `,
  styles: [`.page-shell { padding: 1.5rem; } .actions { display: flex; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap; } .hint { color: var(--text-color-secondary); }`]
})
export class BillingPageComponent implements OnInit {
  private p1 = inject(P1ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  status: BillingStatus | null = null;
  stripeBanner: 'success' | 'cancel' | null = null;

  get showMockActivate(): boolean {
    return this.status?.provedor === 'mock';
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const stripe = params.get('stripe');
      if (stripe === 'success' || stripe === 'cancel') {
        this.stripeBanner = stripe;
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
    this.reload();
  }

  reload(): void {
    this.p1.billingStatus().subscribe((s) => (this.status = s));
  }

  checkout(): void {
    this.p1.billingCheckout().subscribe((r) => {
      if (r.checkoutUrl) {
        if (this.status?.provedor === 'stripe') {
          window.location.href = r.checkoutUrl;
        } else {
          window.open(r.checkoutUrl, '_blank');
        }
      }
    });
  }

  mock(): void {
    this.p1.billingMockActivate().subscribe((s) => (this.status = s));
  }
}
