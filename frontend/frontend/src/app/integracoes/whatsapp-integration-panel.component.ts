import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { extractApiErrorMessage, translateBackendI18nMessage } from '../core/backend-i18n-message.util';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../core/translate.pipe';
import { toastKey } from '../core/toast-i18n.util';
import {
  TenantWhatsAppConnection,
  WhatsAppApiService,
  WhatsAppQrCode,
} from '../core/whatsapp-api.service';

@Component({
  selector: 'app-whatsapp-integration-panel',
  standalone: true,
  imports: [CommonModule, ButtonModule, ConfirmDialogModule, ProgressSpinnerModule, TranslatePipe],
  templateUrl: './whatsapp-integration-panel.component.html',
  styleUrls: ['./whatsapp-integration-panel.component.scss'],
})
export class WhatsAppIntegrationPanelComponent implements OnInit, OnDestroy {
  @Input() embedded = false;
  @Output() connectionChange = new EventEmitter<TenantWhatsAppConnection | null>();

  private readonly whatsAppApi = inject(WhatsAppApiService);
  private readonly i18n = inject(TranslationService);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  private statusPollTimer: ReturnType<typeof setInterval> | null = null;

  loaded = false;
  loading = false;
  loadError = false;
  activating = false;
  loadingQr = false;
  disconnecting = false;

  connection: TenantWhatsAppConnection | null = null;
  qrCode: WhatsAppQrCode | null = null;

  get platformReady(): boolean {
    return !!(this.connection?.platformEnabled && this.connection?.platformConfigured);
  }

  get isConnected(): boolean {
    return this.connection?.status === 'CONNECTED' || !!this.connection?.connected;
  }

  get isConnecting(): boolean {
    return this.connection?.status === 'CONNECTING';
  }

  get isLinked(): boolean {
    return !!this.connection?.linked;
  }

  get canActivate(): boolean {
    return !!(this.connection?.canManage && this.platformReady && !this.isLinked);
  }

  get canShowQr(): boolean {
    return !!(this.connection?.canManage && this.platformReady && this.isLinked && !this.isConnected);
  }

  get canDisconnect(): boolean {
    return !!(this.connection?.canManage && this.isLinked);
  }

  get qrImageSrc(): string | null {
    const raw = this.qrCode?.qrCodeBase64;
    if (!raw) {
      return null;
    }
    return raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
  }

  ngOnInit(): void {
    void this.load();
  }

  ngOnDestroy(): void {
    this.stopStatusPolling();
  }

  backendMessage(message?: string | null): string {
    return translateBackendI18nMessage(this.i18n, message);
  }

  load(): Promise<void> {
    this.loading = true;
    this.loadError = false;
    return new Promise(resolve => {
      this.whatsAppApi.getStatus().subscribe({
        next: conn => {
          this.connection = conn;
          this.connectionChange.emit(conn);
          this.loadError = false;
          this.loaded = true;
          this.loading = false;
          this.syncPolling(conn);
          if (this.canShowQr && !this.qrCode) {
            void this.fetchQrCode(false);
          }
          resolve();
        },
        error: () => {
          this.loadError = true;
          this.connection = {
            platformEnabled: true,
            platformConfigured: false,
            linked: false,
            connected: false,
            canManage: true,
            message: this.i18n.translate('integrations.whatsapp.page.statusUnavailable'),
          };
          this.loaded = true;
          this.loading = false;
          this.connectionChange.emit(this.connection);
          resolve();
        },
      });
    });
  }

  activate(): void {
    if (!this.connection?.canManage) {
      return;
    }
    this.activating = true;
    this.whatsAppApi.activate().subscribe({
      next: view => {
        this.activating = false;
        this.connection = view;
        this.connectionChange.emit(view);
        toastKey(this.messages, this.i18n, 'success', 'common.toast.success', 'integrations.whatsapp.toast.activated');
        void this.fetchQrCode(false);
        this.startStatusPolling();
      },
      error: err => {
        this.activating = false;
        toastKey(this.messages, this.i18n, 'error', 'common.toast.error', 'integrations.whatsapp.toast.activateErrorDetail', {
          message: extractApiErrorMessage(err, this.i18n, 'ui.error.generic'),
        });
      },
    });
  }

  fetchQrCode(showToastOnError = true): Promise<void> {
    if (!this.canShowQr && !this.isConnecting) {
      return Promise.resolve();
    }
    this.loadingQr = true;
    return new Promise(resolve => {
      this.whatsAppApi.fetchQrCode().subscribe({
        next: qr => {
          this.loadingQr = false;
          this.qrCode = qr;
          this.startStatusPolling();
          resolve();
        },
        error: err => {
          this.loadingQr = false;
          if (showToastOnError) {
            toastKey(this.messages, this.i18n, 'error', 'common.toast.error', 'integrations.whatsapp.toast.qrcodeErrorDetail', {
              message: extractApiErrorMessage(err, this.i18n, 'ui.error.generic'),
            });
          }
          resolve();
        },
      });
    });
  }

  confirmDisconnect(): void {
    this.confirm.confirm({
      message: this.i18n.translate('integrations.whatsapp.disconnectConfirm'),
      header: this.i18n.translate('confirm.header.generic'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.translate('integrations.whatsapp.disconnectBtn'),
      rejectLabel: this.i18n.translate('common.confirm.noShort'),
      accept: () => this.disconnect(),
    });
  }

  private disconnect(): void {
    this.disconnecting = true;
    this.whatsAppApi.disconnect().subscribe({
      next: () => {
        this.disconnecting = false;
        this.qrCode = null;
        this.stopStatusPolling();
        toastKey(this.messages, this.i18n, 'success', 'integrations.whatsapp.toast.disconnected', 'integrations.whatsapp.toast.disconnected');
        void this.load();
      },
      error: () => {
        this.disconnecting = false;
        toastKey(this.messages, this.i18n, 'error', 'integrations.whatsapp.toast.disconnectError', 'integrations.whatsapp.toast.disconnectError');
      },
    });
  }

  private syncPolling(conn: TenantWhatsAppConnection): void {
    if (conn.status === 'CONNECTING' || (conn.linked && !conn.connected)) {
      this.startStatusPolling();
    } else if (conn.connected) {
      this.stopStatusPolling();
      this.qrCode = null;
    }
  }

  private startStatusPolling(): void {
    if (this.statusPollTimer) {
      return;
    }
    this.statusPollTimer = setInterval(() => {
      this.whatsAppApi.getStatus().subscribe({
        next: conn => {
          const wasConnecting = this.isConnecting;
          this.connection = conn;
          this.connectionChange.emit(conn);
          if (conn.connected) {
            this.qrCode = null;
            this.stopStatusPolling();
          } else if (wasConnecting && conn.status === 'CONNECTING' && !this.qrCode && !this.loadingQr) {
            void this.fetchQrCode(false);
          }
        },
      });
    }, 5000);
  }

  private stopStatusPolling(): void {
    if (this.statusPollTimer) {
      clearInterval(this.statusPollTimer);
      this.statusPollTimer = null;
    }
  }
}
