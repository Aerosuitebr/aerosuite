import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { TranslatePipe } from '../core/translate.pipe';
import { BlingIntegrationPanelComponent } from './bling-integration-panel.component';
import { BlingTenantConnection } from '../core/bling-api.service';

@Component({
  selector: 'app-integracoes-bling-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    PageHeroComponent,
    TranslatePipe,
    BlingIntegrationPanelComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="as-page integracoes-bling-page">
      <app-page-hero
        variant="gold"
        kickerKey="integrations.bling.page.kicker"
        titleKey="integrations.bling.title"
        subtitleKey="integrations.bling.page.subtitle"
        titleIcon="pi-link"
        [hasActions]="true">
        <div actions class="integracoes-bling-hero-actions">
          @if (statusLabelKey) {
            <span class="integracoes-bling-hero-status">
              <i class="pi" [ngClass]="connection?.connected ? 'pi-check-circle' : 'pi-info-circle'" aria-hidden="true"></i>
              {{ statusLabelKey | translate : statusLabelParams }}
            </span>
          }
          <button
            pButton
            type="button"
            class="p-button-outlined"
            icon="pi pi-verified"
            [label]="'integrations.bling.page.verifyBtn' | translate"
            [loading]="panel?.testing ?? false"
            (click)="panel?.testConnection()"></button>
          <button
            pButton
            type="button"
            icon="pi pi-refresh"
            [label]="'integrations.bling.page.refreshBtn' | translate"
            [loading]="panel?.loading ?? false"
            (click)="panel?.load()"></button>
        </div>
      </app-page-hero>

      <div class="as-page-body integracoes-bling-body">
        <app-bling-integration-panel
          #panel
          [embedded]="false"
          (connectionChange)="onConnectionChange($event)"></app-bling-integration-panel>
      </div>
    </div>
  `,
  styleUrls: ['./integracoes-bling-page.component.scss'],
})
export class IntegracoesBlingPageComponent {
  @ViewChild('panel') panel?: BlingIntegrationPanelComponent;

  connection: BlingTenantConnection | null = null;

  onConnectionChange(conn: BlingTenantConnection | null): void {
    this.connection = conn;
  }

  get statusLabelKey(): string | null {
    if (!this.connection) {
      return 'integrations.bling.page.statusLoading';
    }
    if (!this.connection.platformEnabled || !this.connection.oauthConfigured) {
      return 'integrations.bling.page.statusUnavailable';
    }
    if (this.connection.connected) {
      return 'integrations.bling.page.statusConnected';
    }
    return 'integrations.bling.page.statusReady';
  }

  get statusLabelParams(): Record<string, string> {
    if (this.connection?.connected && this.connection.blingCompanyName) {
      return { company: ' · ' + this.connection.blingCompanyName };
    }
    return { company: '' };
  }
}
