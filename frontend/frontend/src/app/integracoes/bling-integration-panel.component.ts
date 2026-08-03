import { CommonModule } from '@angular/common';

import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { ConfirmationService, MessageService } from 'primeng/api';

import { ButtonModule } from 'primeng/button';

import { CheckboxModule } from 'primeng/checkbox';

import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { DropdownModule } from 'primeng/dropdown';

import { FileUploadModule, FileSelectEvent } from 'primeng/fileupload';

import { InputNumberModule } from 'primeng/inputnumber';

import { InputTextModule } from 'primeng/inputtext';

import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AccordionModule } from 'primeng/accordion';

import {

  BlingApiService,

  BlingFiscalConfig,

  BlingFiscalConfigUpdate,

  BlingNfeReadiness,

  BlingScopesStatus,

  BlingScopeCheck,

  BlingSyncStatus,

  BlingSyncJobView,

  BlingTenantConnection,

} from '../core/bling-api.service';

import { extractApiErrorMessage, translateBackendI18nMessage } from '../core/backend-i18n-message.util';
import { TranslationService } from '../core/translation.service';

import { TranslatePipe } from '../core/translate.pipe';

import { toastKey } from '../core/toast-i18n.util';



@Component({

  selector: 'app-bling-integration-panel',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    ButtonModule,

    CheckboxModule,

    ConfirmDialogModule,

    DropdownModule,

    FileUploadModule,

    InputNumberModule,

    InputTextModule,

    ProgressSpinnerModule,

    AccordionModule,

    TranslatePipe,

  ],

  templateUrl: './bling-integration-panel.component.html',

  styleUrls: ['./bling-integration-panel.component.scss'],

})

export class BlingIntegrationPanelComponent implements OnInit {
  @Input() embedded = false;
  @Output() connectionChange = new EventEmitter<BlingTenantConnection | null>();

  private readonly blingApi = inject(BlingApiService);

  private readonly i18n = inject(TranslationService);

  private readonly messages = inject(MessageService);

  private readonly confirm = inject(ConfirmationService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);



  loaded = false;

  loading = false;

  loadError = false;

  connecting = false;

  disconnecting = false;

  testing = false;

  bootstrapping = false;

  webhookHomologating = false;

  savingFiscal = false;

  uploadingCert = false;

  connection: BlingTenantConnection | null = null;

  syncStatus: BlingSyncStatus | null = null;

  deadJobs: BlingSyncJobView[] = [];

  loadingDeadJobs = false;

  deadJobActionId: number | null = null;

  reprocessingAllDead = false;

  discardingAllDead = false;

  fiscalConfig: BlingFiscalConfig | null = null;

  apiTestMessage = '';

  scopeChecks: BlingScopeCheck[] = [];

  friendlyChecks: { label: string; ok: boolean }[] = [];

  nfeReadiness: BlingNfeReadiness | null = null;

  nfeReadinessLoading = false;

  scopesStatus: BlingScopesStatus | null = null;

  scopesLoading = false;

  syncProductId = '';

  syncingProduct = false;

  certTipo: 'A1' | 'A3' = 'A1';

  certPassword = '';

  certFile: File | null = null;

  certTipoOptions = [
    { label: 'A1', value: 'A1' as const },
    { label: 'A3', value: 'A3' as const },
  ];

  /** Índices abertos no accordion (multiple). Recalculados após load. */
  wizardAccordionOpen: number[] = [0];

  get sessionExpired(): boolean {
    return !!(this.connection?.linked && !this.connection?.tokenOperational);
  }

  get needsScopeReconnect(): boolean {
    return !!this.nfeReadiness?.checks?.some(
      check => check.ok === false && (check.code || '').startsWith('scope_')
    );
  }

  get needsOAuthReconnect(): boolean {
    return this.sessionExpired || this.needsScopeReconnect;
  }

  get connectButtonLabelKey(): string {
    return this.needsOAuthReconnect ? 'integrations.bling.reconnectBtn' : 'integrations.bling.connectBtn';
  }

  get integrationReady(): boolean {
    return !!(this.connection?.platformEnabled && this.connection?.oauthConfigured);
  }

  get syncOk(): boolean {
    return !!(this.syncStatus?.lastWebhookAt && !(this.syncStatus?.deadJobs > 0));
  }

  get allReady(): boolean {
    return !!(this.connection?.connected && this.fiscalConfig?.certificadoConfigurado && this.syncOk && this.nfeOperationalReady);
  }

  get nfeOperationalReady(): boolean {
    return !!(this.nfeReadiness?.ready && !this.missingProductsPermission);
  }

  get missingProductsPermission(): boolean {
    return !!this.nfeReadiness?.checks?.some(
      check => check.ok === false && (check.code || '') === 'scope_produtos'
    );
  }

  get canConnect(): boolean {
    return !!(this.connection?.canManage && this.integrationReady
      && (!this.connection.connected || this.needsOAuthReconnect));
  }

  get connectBlockedReasonKey(): string | null {
    if (!this.connection || this.connection.connected) {
      return null;
    }
    if (!this.integrationReady) {
      return 'integrations.bling.wizard.connectBlocked.platform';
    }
    if (!this.connection.canManage) {
      return 'integrations.bling.wizard.connectBlocked.permission';
    }
    return null;
  }



  t(key: string, params?: Record<string, string>): string {

    return this.i18n.translate(key, params);

  }

  backendMessage(message?: string | null): string {
    return translateBackendI18nMessage(this.i18n, message);
  }



  ngOnInit(): void {

    void this.load();

    this.handleOAuthReturn();

  }



  private handleOAuthReturn(): void {

    const bling = this.route.snapshot.queryParamMap.get('bling');

    if (!bling) {

      return;

    }

    const message = this.route.snapshot.queryParamMap.get('blingMessage') ?? '';

    if (bling === 'connected') {

      toastKey(this.messages, this.i18n, 'success', 'common.toast.success', 'integrations.bling.toast.connected');

      void this.load();

      void this.testConnection();

    } else if (bling === 'error') {

      toastKey(

        this.messages,

        this.i18n,

        'error',

        'integrations.bling.toast.connectError',

        'integrations.bling.toast.connectError',

        { message: message || this.t('ui.error.generic') }

      );

    }

    void this.router.navigate([], {

      relativeTo: this.route,

      queryParams: { bling: null, blingMessage: null },

      queryParamsHandling: 'merge',

      replaceUrl: true,

    });

  }



  async load(): Promise<void> {

    this.loading = true;

    this.loadError = false;

    this.blingApi.getConnection().subscribe({

      next: conn => {

        this.connection = conn;
        this.connectionChange.emit(conn);

        this.loadError = false;

        this.loaded = true;

        this.loading = false;

        if (conn.connected || conn.linked) {
          this.loadSyncStatus();
          this.loadFiscalConfig();
          this.loadNfeReadiness();
          this.loadScopes();
        } else {

          this.syncStatus = null;

          this.fiscalConfig = null;

          this.nfeReadiness = null;

        }

        this.refreshWizardAccordion();

      },

      error: () => {

        this.loadError = true;

        this.connection = {

          platformEnabled: true,

          oauthConfigured: false,

          connected: false,

          canManage: true,

          message: this.t('integrations.bling.loadFailed'),

        };

        this.loaded = true;

        this.loading = false;

        this.connectionChange.emit(this.connection);

      },

    });

  }



  private loadSyncStatus(): void {

    this.blingApi.getSyncStatus().subscribe({

      next: status => {
        this.syncStatus = status;
        if (status.deadJobs > 0) {
          this.loadDeadJobs();
        } else {
          this.deadJobs = [];
        }
      },

      error: () => {
        this.syncStatus = null;
        this.deadJobs = [];
      },

    });

  }



  private loadDeadJobs(): void {
    if (!this.connection?.canManage) {
      this.deadJobs = [];
      return;
    }
    this.loadingDeadJobs = true;
    this.blingApi.listDeadSyncJobs().subscribe({
      next: jobs => {
        this.deadJobs = jobs ?? [];
        this.loadingDeadJobs = false;
      },
      error: () => {
        this.deadJobs = [];
        this.loadingDeadJobs = false;
      },
    });
  }



  reprocessDeadJob(jobId: number): void {
    if (!this.connection?.canManage) {
      return;
    }
    this.deadJobActionId = jobId;
    this.blingApi.reprocessDeadSyncJob(jobId).subscribe({
      next: () => {
        this.deadJobActionId = null;
        toastKey(this.messages, this.i18n, 'success', 'common.toast.success', 'integrations.bling.deadJobs.reprocessOk');
        this.loadSyncStatus();
      },
      error: err => {
        this.deadJobActionId = null;
        toastKey(this.messages, this.i18n, 'error', 'common.toast.error', 'integrations.bling.deadJobs.error', {
          message: extractApiErrorMessage(err, this.i18n, 'ui.error.generic'),
        });
      },
    });
  }



  confirmDiscardDeadJob(jobId: number): void {
    if (!this.connection?.canManage) {
      return;
    }
    this.confirm.confirm({
      message: this.t('integrations.bling.deadJobs.discardConfirm'),
      header: this.t('integrations.bling.deadJobs.discardBtn'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.discardDeadJob(jobId),
    });
  }



  private discardDeadJob(jobId: number): void {
    this.deadJobActionId = jobId;
    this.blingApi.discardDeadSyncJob(jobId).subscribe({
      next: () => {
        this.deadJobActionId = null;
        toastKey(this.messages, this.i18n, 'success', 'common.toast.success', 'integrations.bling.deadJobs.discardOk');
        this.loadSyncStatus();
      },
      error: err => {
        this.deadJobActionId = null;
        toastKey(this.messages, this.i18n, 'error', 'common.toast.error', 'integrations.bling.deadJobs.error', {
          message: extractApiErrorMessage(err, this.i18n, 'ui.error.generic'),
        });
      },
    });
  }



  reprocessAllDeadJobs(): void {
    if (!this.connection?.canManage || !this.syncStatus?.deadJobs) {
      return;
    }
    this.reprocessingAllDead = true;
    this.blingApi.reprocessAllDeadSyncJobs().subscribe({
      next: () => {
        this.reprocessingAllDead = false;
        toastKey(this.messages, this.i18n, 'success', 'common.toast.success', 'integrations.bling.deadJobs.reprocessOk');
        this.loadSyncStatus();
      },
      error: err => {
        this.reprocessingAllDead = false;
        toastKey(this.messages, this.i18n, 'error', 'common.toast.error', 'integrations.bling.deadJobs.error', {
          message: extractApiErrorMessage(err, this.i18n, 'ui.error.generic'),
        });
      },
    });
  }



  confirmDiscardAllDeadJobs(): void {
    if (!this.connection?.canManage || !this.syncStatus?.deadJobs) {
      return;
    }
    this.confirm.confirm({
      message: this.t('integrations.bling.deadJobs.discardAllConfirm'),
      header: this.t('integrations.bling.deadJobs.discardAllBtn'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.discardAllDeadJobs(),
    });
  }



  private discardAllDeadJobs(): void {
    this.discardingAllDead = true;
    this.blingApi.discardAllDeadSyncJobs().subscribe({
      next: () => {
        this.discardingAllDead = false;
        toastKey(this.messages, this.i18n, 'success', 'common.toast.success', 'integrations.bling.deadJobs.discardOk');
        this.loadSyncStatus();
      },
      error: err => {
        this.discardingAllDead = false;
        toastKey(this.messages, this.i18n, 'error', 'common.toast.error', 'integrations.bling.deadJobs.error', {
          message: extractApiErrorMessage(err, this.i18n, 'ui.error.generic'),
        });
      },
    });
  }



  private refreshWizardAccordion(): void {
    const keys: string[] = ['connect'];
    if (this.connection?.connected) {
      keys.push('fiscal', 'readiness', 'sync');
    }

    let focusKey = 'connect';
    if (this.connection?.connected && !this.needsOAuthReconnect) {
      if (this.fiscalConfig && !this.fiscalConfig.certificadoConfigurado) {
        focusKey = 'fiscal';
      } else if (!this.nfeOperationalReady) {
        focusKey = 'readiness';
      } else if (!this.syncOk) {
        focusKey = 'sync';
      } else {
        focusKey = 'fiscal';
      }
    }

    const idx = keys.indexOf(focusKey);
    this.wizardAccordionOpen = idx >= 0 ? [idx] : [0];
  }

  private loadFiscalConfig(): void {

    this.blingApi.getFiscalConfig().subscribe({

      next: cfg => {

        this.fiscalConfig = {

          ...cfg,

          autoOsOnPedido: cfg.autoOsOnPedido !== false,

          autoEmitirNfe: cfg.autoEmitirNfe !== false,

        };

        this.loadNfeReadiness();

        this.refreshWizardAccordion();

      },

      error: () => (this.fiscalConfig = { autoOsOnPedido: true, autoEmitirNfe: true }),

    });

  }



  loadScopes(refresh = false): void {
    if (!this.connection?.canManage) {
      return;
    }
    this.scopesLoading = true;
    this.blingApi.getScopes(refresh).subscribe({
      next: scopes => {
        this.scopesStatus = scopes;
        this.scopeChecks = scopes.checks ?? [];
        this.buildFriendlyChecks();
        this.scopesLoading = false;
      },
      error: () => {
        this.scopesStatus = null;
        this.scopesLoading = false;
      },
    });
  }

  syncProductFiscal(): void {
    const id = Number(this.syncProductId);
    if (!id || id <= 0 || !this.connection?.canManage) {
      toastKey(this.messages, this.i18n, 'warn', 'common.toast.warn', 'integrations.bling.wizard.productSync.invalidId');
      return;
    }
    this.syncingProduct = true;
    this.blingApi.syncProductFiscal(id).subscribe({
      next: res => {
        this.syncingProduct = false;
        toastKey(
          this.messages,
          this.i18n,
          res.persisted ? 'success' : 'warn',
          res.persisted ? 'integrations.bling.wizard.productSync.ok' : 'integrations.bling.wizard.productSync.partial',
          res.persisted ? 'integrations.bling.wizard.productSync.ok' : 'integrations.bling.wizard.productSync.partial'
        );
        this.loadNfeReadiness(true);
        this.loadScopes(true);
      },
      error: err => {
        this.syncingProduct = false;
        toastKey(this.messages, this.i18n, 'error', 'common.toast.error', 'integrations.bling.wizard.productSync.error', {
          message: extractApiErrorMessage(err, this.i18n, 'ui.error.generic'),
        });
      },
    });
  }

  loadNfeReadiness(refresh = false): void {
    if (!this.connection?.connected) {
      this.nfeReadiness = null;
      return;
    }
    this.nfeReadinessLoading = true;
    this.blingApi.getNfeReadiness(refresh).subscribe({
      next: readiness => {
        this.nfeReadiness = readiness;
        this.nfeReadinessLoading = false;
      },
      error: () => {
        this.nfeReadiness = null;
        this.nfeReadinessLoading = false;
      },
    });
  }



  private buildFriendlyChecks(): void {
    this.friendlyChecks = (this.scopeChecks ?? []).map(c => ({
      label: c.label,
      ok: c.ok,
    }));
  }



  saveFiscalConfig(): void {

    if (!this.connection?.canManage || !this.fiscalConfig) {

      return;

    }

    const body: BlingFiscalConfigUpdate = {

      cfopPadrao: this.fiscalConfig.cfopPadrao,

      serieNfe: this.fiscalConfig.serieNfe,

      naturezaOperacao: this.fiscalConfig.naturezaOperacao,

      ncmPadrao: this.fiscalConfig.ncmPadrao,

      aliquotaIcms: this.fiscalConfig.aliquotaIcms,

      aliquotaPis: this.fiscalConfig.aliquotaPis,

      aliquotaCofins: this.fiscalConfig.aliquotaCofins,

      autoOsOnPedido: this.fiscalConfig.autoOsOnPedido,

      autoEmitirNfe: this.fiscalConfig.autoEmitirNfe,

    };

    this.savingFiscal = true;

    this.blingApi.updateFiscalConfig(body).subscribe({

      next: cfg => {

        this.savingFiscal = false;

        this.fiscalConfig = cfg;

        toastKey(this.messages, this.i18n, 'success', 'common.toast.success', 'integrations.bling.fiscal.saved');

        this.loadNfeReadiness(true);

      },

      error: err => {

        this.savingFiscal = false;

        toastKey(this.messages, this.i18n, 'error', 'common.toast.error', 'integrations.bling.fiscal.saveError', {

          message: extractApiErrorMessage(err, this.i18n, 'ui.error.generic'),

        });

      },

    });

  }



  onCertFileSelect(event: FileSelectEvent): void {

    this.certFile = event.files?.[0] ?? null;

  }



  uploadCertificado(): void {

    if (!this.connection?.canManage || !this.certFile || !this.certPassword.trim()) {

      toastKey(this.messages, this.i18n, 'warn', 'common.toast.warn', 'integrations.bling.fiscal.certRequired');

      return;

    }

    this.uploadingCert = true;

    this.blingApi.uploadCertificado(this.certFile, this.certPassword, this.certTipo).subscribe({

      next: cfg => {

        this.uploadingCert = false;

        this.fiscalConfig = cfg;

        this.certPassword = '';

        this.certFile = null;

        toastKey(this.messages, this.i18n, 'success', 'common.toast.success', 'integrations.bling.fiscal.certOk');

        this.loadNfeReadiness(true);

      },

      error: err => {

        this.uploadingCert = false;

        toastKey(this.messages, this.i18n, 'error', 'common.toast.error', 'integrations.bling.fiscal.certError', {

          message: extractApiErrorMessage(err, this.i18n, 'ui.error.generic'),

        });

      },

    });

  }



  confirmRemoveCertificado(): void {

    this.confirm.confirm({

      message: 'integrations.bling.fiscal.certRemoveConfirm',

      header: 'confirm.header.generic',

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: 'common.confirm.yes',

      rejectLabel: 'common.confirm.noShort',

      accept: () => this.removeCertificado(),

    });

  }



  private removeCertificado(): void {

    this.blingApi.removeCertificado().subscribe({

      next: cfg => {

        this.fiscalConfig = cfg;

        toastKey(this.messages, this.i18n, 'success', 'common.toast.success', 'integrations.bling.fiscal.certRemoved');

      },

      error: () => {

        toastKey(this.messages, this.i18n, 'error', 'common.toast.error', 'integrations.bling.fiscal.certError');

      },

    });

  }



  connect(): void {

    if (!this.connection?.canManage) {

      return;

    }

    this.connecting = true;

    this.blingApi.startOAuth().subscribe({

      next: res => {

        this.connecting = false;

        if (res.authorizationUrl) {

          window.location.href = res.authorizationUrl;

        }

      },

      error: err => {

        this.connecting = false;

        const msg = extractApiErrorMessage(err, this.i18n, 'ui.error.generic');

        toastKey(

          this.messages,

          this.i18n,

          'error',

          'integrations.bling.toast.connectError',

          'integrations.bling.toast.connectError',

          { message: String(msg) }

        );

      },

    });

  }



  confirmDisconnect(): void {

    this.confirm.confirm({

      message: 'integrations.bling.disconnectConfirm',

      header: 'confirm.header.generic',

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: 'integrations.bling.disconnectBtn',

      rejectLabel: 'common.confirm.noShort',

      accept: () => this.disconnect(),

    });

  }



  private disconnect(): void {

    this.disconnecting = true;

    this.blingApi.disconnect().subscribe({

      next: () => {

        this.disconnecting = false;

        this.apiTestMessage = '';

        toastKey(this.messages, this.i18n, 'success', 'integrations.bling.toast.disconnected', 'integrations.bling.toast.disconnected');

        void this.load();

      },

      error: () => {

        this.disconnecting = false;

        toastKey(this.messages, this.i18n, 'error', 'integrations.bling.toast.disconnectError', 'integrations.bling.toast.disconnectError');

      },

    });

  }



  testConnection(): void {
    this.testing = true;
    this.apiTestMessage = '';
    this.scopeChecks = [];
    this.blingApi.status(true).subscribe({
      next: s => {
        this.testing = false;
        this.scopeChecks = s.scopeChecks ?? [];
        this.buildFriendlyChecks();
        if (s.ok) {
          this.apiTestMessage = this.t('integrations.bling.testOk');
        } else {
          this.apiTestMessage = this.t('integrations.bling.testFail', {
            message: s.message ?? this.t('ui.error.generic'),
          });
        }
        if (this.connection?.connected || this.connection?.linked) {
          this.loadNfeReadiness(true);
          this.loadScopes(true);
        }
      },
      error: err => {
        this.testing = false;
        this.apiTestMessage = this.t('integrations.bling.testFail', {
          message: extractApiErrorMessage(err, this.i18n, 'ui.error.generic'),
        });
      },
    });
  }

  testWebhookHomologacao(): void {
    if (!this.connection?.canManage) {
      return;
    }
    this.webhookHomologating = true;
    this.blingApi.webhookHomologacao().subscribe({
      next: res => {
        this.webhookHomologating = false;
        toastKey(
          this.messages,
          this.i18n,
          res.success ? 'success' : 'warn',
          res.success ? 'integrations.bling.webhookHomologOk' : 'integrations.bling.webhookHomologFail',
          res.success ? 'integrations.bling.webhookHomologOk' : 'integrations.bling.webhookHomologFail',
          { message: this.backendMessage(res.message), url: res.webhookUrl ?? '' }
        );
        void this.load();
      },
      error: err => {
        this.webhookHomologating = false;
        const msg = extractApiErrorMessage(err, this.i18n, 'ui.error.generic');
        toastKey(this.messages, this.i18n, 'error', 'integrations.bling.webhookHomologFail', 'integrations.bling.webhookHomologFail', {
          message: msg,
          url: '',
        });
      },
    });
  }

  bootstrapHomologacao(): void {
    if (!this.connection?.canManage) {
      return;
    }
    this.bootstrapping = true;
    this.blingApi.bootstrapHomologacao().subscribe({
      next: res => {
        this.bootstrapping = false;
        if (res.scopes?.checks) {
          this.scopeChecks = res.scopes.checks;
          this.buildFriendlyChecks();
        }
        toastKey(
          this.messages,
          this.i18n,
          res.success ? 'success' : 'warn',
          res.success ? 'integrations.bling.bootstrapOk' : 'common.toast.warn',
          res.success ? 'integrations.bling.bootstrapOk' : 'integrations.bling.bootstrapFail',
          { message: this.backendMessage(res.message) }
        );
        void this.load();
        void this.testConnection();
      },
      error: err => {
        this.bootstrapping = false;
        const msg = extractApiErrorMessage(err, this.i18n, 'ui.error.generic');
        toastKey(this.messages, this.i18n, 'error', 'integrations.bling.bootstrapFail', 'integrations.bling.bootstrapFail', {
          message: msg,
        });
      },
    });
  }

}


