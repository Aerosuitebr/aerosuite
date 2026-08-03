import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { TranslatePipe } from '../core/translate.pipe';
import { WhatsAppIntegrationPanelComponent } from './whatsapp-integration-panel.component';
import { TenantWhatsAppConnection } from '../core/whatsapp-api.service';

@Component({
  selector: 'app-integracoes-whatsapp-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    PageHeroComponent,
    TranslatePipe,
    WhatsAppIntegrationPanelComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="as-page integracoes-whatsapp-page">
      <app-page-hero
        variant="gold"
        kickerKey="integrations.whatsapp.page.kicker"
        titleKey="integrations.whatsapp.title"
        subtitleKey="integrations.whatsapp.page.subtitle"
        titleIcon="pi-whatsapp"
        [hasActions]="true">
        <div actions class="integracoes-whatsapp-hero-actions">
          @if (statusLabelKey) {
            <span class="integracoes-whatsapp-hero-status">
              <i
                class="pi"
                [ngClass]="connection?.connected ? 'pi-check-circle' : 'pi-info-circle'"
                aria-hidden="true"></i>
              {{ statusLabelKey | translate : statusLabelParams }}
            </span>
          }
          <button
            pButton
            type="button"
            class="p-button-outlined"
            icon="pi pi-qrcode"
            [label]="'integrations.whatsapp.page.qrcodeBtn' | translate"
            [loading]="panel?.loadingQr ?? false"
            [disabled]="!panel?.canShowQr && !panel?.isConnecting"
            (click)="panel?.fetchQrCode()"></button>
          <button
            pButton
            type="button"
            icon="pi pi-refresh"
            [label]="'integrations.whatsapp.page.refreshBtn' | translate"
            [loading]="panel?.loading ?? false"
            (click)="panel?.load()"></button>
        </div>
      </app-page-hero>

      <div class="as-page-body integracoes-whatsapp-body">
        <app-whatsapp-integration-panel
          #panel
          [embedded]="false"
          (connectionChange)="onConnectionChange($event)"></app-whatsapp-integration-panel>
      </div>
    </div>
  `,
  styleUrls: ['./integracoes-whatsapp-page.component.scss'],
})
export class IntegracoesWhatsappPageComponent {
  @ViewChild('panel') panel?: WhatsAppIntegrationPanelComponent;

  connection: TenantWhatsAppConnection | null = null;

  onConnectionChange(conn: TenantWhatsAppConnection | null): void {
    this.connection = conn;
  }

  get statusLabelKey(): string | null {
    if (!this.connection) {
      return 'integrations.whatsapp.page.statusLoading';
    }
    if (!this.connection.platformEnabled || !this.connection.platformConfigured) {
      return 'integrations.whatsapp.page.statusUnavailable';
    }
    if (this.connection.connected) {
      return 'integrations.whatsapp.page.statusConnected';
    }
    if (this.connection.status === 'CONNECTING') {
      return 'integrations.whatsapp.page.statusConnecting';
    }
    return 'integrations.whatsapp.page.statusReady';
  }

  get statusLabelParams(): Record<string, string> {
    if (this.connection?.connected && this.connection.instanceName) {
      return { instance: ' · ' + this.connection.instanceName };
    }
    return { instance: '' };
  }
}
