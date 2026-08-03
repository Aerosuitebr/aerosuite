import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { BackupConfigService, BackupConfig, BackupHistory, DatabaseConnection, BackupSchedule, DirectoryItem } from '../../core/backup-config.service';
import { BackupProgressService } from '../../core/backup-progress.service';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, finalize, timeout } from 'rxjs/operators';
import { PageHelpComponent } from '../../shared/page-help/page-help.component';
import { PageHeroComponent } from '../../shared/page-hero/page-hero.component';
import { TranslatePipe } from '../../core/translate.pipe';
import { TranslationService } from '../../core/translation.service';
import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../../core/list-pagination.constants';
import { formatUiDateTime } from '../../core/locale/locale-intl.util';
import { extractApiErrorMessage, translateApiMessage } from '../../core/backend-i18n-message.util';
import { toastKey } from '../../core/toast-i18n.util';
import { ListRefreshOverlayComponent } from '../../shared/list-refresh-overlay/list-refresh-overlay.component';

@Component({
      selector: 'app-backup-config',
      standalone: true,
      animations: [
        trigger('slideInUp', [
          transition(':enter', [
            style({ transform: 'translateY(100%)', opacity: 0 }),
            animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
          ]),
          transition(':leave', [
            animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
          ])
        ])
      ],
      imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    ButtonModule,
    DropdownModule,
    CalendarModule,
    CheckboxModule,
    ToggleButtonModule,
    TabViewModule,
    TableModule,
    TagModule,
    TooltipModule,
    ToastModule,
    DialogModule,
        ProgressSpinnerModule,
        ProgressBarModule,
        PageHelpComponent,
        PageHeroComponent,
        TranslatePipe,
        ListRefreshOverlayComponent
  ],
  templateUrl: './backup-config.component.html',
  styleUrls: ['./backup-config.component.scss']
})
export class BackupConfigComponent implements OnInit {
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private backupService = inject(BackupConfigService);
  private backupProgressService = inject(BackupProgressService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private i18n = inject(TranslationService);

  // Formulários
  connectionForm!: FormGroup;
  scheduleForm!: FormGroup;
  pathForm!: FormGroup;
  notificationForm!: FormGroup;

  // Estados
  loading = false;
  testingConnection = false;
  showConnectionPassword = false;
  executingBackup = false;
  saving = false;
  loadingHistory = false;

  // Dados
  currentConfig: BackupConfig | null = null;
  backupHistory: BackupHistory[] = [];

  /** Arrays estáveis — getters com translate no p-dropdown causavam loop de change detection. */
  scheduleTypeOptions: { label: string; value: string }[] = [];
  daysOfWeekOptions: { label: string; value: number }[] = [];

  /** Propriedades estáveis para *ngIf — evitar getters no template. */
  scheduleType = 'daily';
  isScheduleEnabled = true;

  // Validação de caminho
  pathValidationSubject = new Subject<string>();
  pathValidating = false;
  pathValidationResult: { valid: boolean; message: string } | null = null;

  // Preview de agendamento
  schedulePreview = '';

  // Data mínima para seleção (hoje)
  minDate = new Date();

  // Diálogo de criação de pasta
  showCreateFolderDialog = false;
  newFolderName = '';
  newFolderPath = '';

  // Diálogo de seleção de pasta (file explorer)
  showSelectFolderDialog = false;
  selectedFolderPath = '';
  currentExplorerPath = '';
  explorerDirectories: DirectoryItem[] = [];
  loadingDirectories = false;
  explorerPathHistory: string[] = [];

  ngOnInit() {
    this.initializeForms();
    this.rebuildScheduleOptions();
    this.loadConfiguration();
    this.loadBackupHistory();
    this.setupPathValidation();
    this.setupSchedulePreview();
  }

  private rebuildScheduleOptions(): void {
    this.scheduleTypeOptions = [
      { label: this.i18n.translate('backup.schedule.type.once'), value: 'once' },
      { label: this.i18n.translate('backup.schedule.type.daily'), value: 'daily' },
      { label: this.i18n.translate('backup.schedule.type.weekly'), value: 'weekly' },
      { label: this.i18n.translate('backup.schedule.type.monthly'), value: 'monthly' }
    ];
    this.daysOfWeekOptions = [0, 1, 2, 3, 4, 5, 6].map(value => ({
      value,
      label: this.i18n.translate(`backup.weekday.${value}`)
    }));
  }

  initializeForms() {
    // Formulário de Conexão
    this.connectionForm = this.fb.group({
      host: ['localhost', [Validators.required]],
      port: [3306, [Validators.required, Validators.min(1), Validators.max(65535)]],
      database: ['', [Validators.required]],
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      sslEnabled: [false]
    });

    // Formulário de Caminho
    this.pathForm = this.fb.group({
      backupPath: ['', [Validators.required]]
    });

    // Formulário de Agendamento
    this.scheduleForm = this.fb.group({
      scheduleType: ['daily', [Validators.required]],
      enabled: [true],
      scheduledDate: [null],
      scheduledTime: ['02:00', [Validators.required]],
      daysOfWeek: [[]],
      dayOfMonth: [null],
      retentionDays: [30, [Validators.required, Validators.min(1)]],
      compressBackup: [true]
    });

    // Formulário de Notificações
    this.notificationForm = this.fb.group({
      emailNotification: [false],
      emailRecipients: ['']
    });
  }

  setupPathValidation() {
    this.pathValidationSubject.pipe(
      debounceTime(500)
    ).subscribe(path => {
      if (path && this.pathForm.get('backupPath')?.valid) {
        this.validatePath(path);
      }
    });
  }

  setupSchedulePreview() {
    this.syncScheduleUiState();
    this.scheduleForm.valueChanges.subscribe(() => {
      this.syncScheduleUiState();
      this.updateSchedulePreview();
    });
  }

  private syncScheduleUiState(): void {
    this.scheduleType = this.scheduleForm.get('scheduleType')?.value || 'daily';
    this.isScheduleEnabled = this.scheduleForm.get('enabled')?.value ?? true;
  }

  updateSchedulePreview() {
    const formValue = this.scheduleForm.value;
    if (!formValue.enabled) {
      this.schedulePreview = this.i18n.translate('backup.schedule.disabled');
      return;
    }

    const time = formValue.scheduledTime || '02:00';
    const type = formValue.scheduleType;

    switch (type) {
      case 'once': {
        const date = formValue.scheduledDate;
        if (date) {
          const dateStr = formatUiDateTime(this.i18n.getCurrentLanguage(), date, 'date');
          this.schedulePreview = this.i18n.translate('backup.schedule.onceOn', { date: dateStr, time });
        } else {
          this.schedulePreview = this.i18n.translate('backup.schedule.selectDate');
        }
        break;
      }
      case 'daily':
        this.schedulePreview = this.i18n.translate('backup.schedule.dailyAt', { time });
        break;
      case 'weekly': {
        const days = formValue.daysOfWeek || [];
        if (days.length > 0) {
          const dayNames = days
            .map((d: number) => this.daysOfWeekOptions.find(opt => opt.value === d)?.label)
            .join(', ');
          this.schedulePreview = this.i18n.translate('backup.schedule.weeklyOn', { days: dayNames, time });
        } else {
          this.schedulePreview = this.i18n.translate('backup.schedule.selectWeekdays');
        }
        break;
      }
      case 'monthly': {
        const day = formValue.dayOfMonth;
        if (day) {
          this.schedulePreview = this.i18n.translate('backup.schedule.monthlyOn', { day: String(day), time });
        } else {
          this.schedulePreview = this.i18n.translate('backup.schedule.selectMonthDay');
        }
        break;
      }
      default:
        this.schedulePreview = '';
    }
  }

  loadConfiguration() {
    this.loading = true;
    this.backupService.getConfig().pipe(
      timeout(20000),
      catchError((error) => {
        console.error('Failed to load configuration:', error);
        if (error.status !== 404 && error.statusCode !== 404 && (error.status !== undefined || error.statusCode !== undefined)) {
          toastKey(this.messageService, this.i18n, 'warn', 'backup.toast.warn', 'backup.toast.loadFailed');
        }
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe((config) => {
      if (config && Object.keys(config).length > 0) {
        this.currentConfig = config;
        this.populateForms(config);
      }
    });
  }

  populateForms(config: BackupConfig) {
    
    // Preencher formulário de conexão
    if (config.connection) {
      const connectionData = {
        host: config.connection.host || 'localhost',
        port: config.connection.port || 3306,
        database: config.connection.database || '',
        username: config.connection.username || '',
        password: config.connection.password || '',
        sslEnabled: config.connection.sslEnabled || false
      };
      this.connectionForm.patchValue(connectionData, { emitEvent: false });
    } else {
      console.warn('config.connection is missing or null/undefined');
    }

    // Preencher formulário de caminho
    if (config.backupPath) {
      this.pathForm.patchValue({
        backupPath: config.backupPath
      }, { emitEvent: false });
    } else {
      console.warn('config.backupPath is missing or empty');
    }

    // Preencher formulário de agendamento
    if (config.schedule) {
      const scheduleData: any = {
        scheduleType: config.schedule.scheduleType || 'daily',
        enabled: config.schedule.enabled !== undefined ? config.schedule.enabled : true,
        scheduledTime: config.schedule.scheduledTime || '02:00',
        retentionDays: config.retentionDays !== undefined ? config.retentionDays : 30,
        compressBackup: config.compressBackup !== undefined ? config.compressBackup : true
      };

      // Data agendada (para agendamento único)
      if (config.schedule.scheduledDate) {
        try {
          scheduleData.scheduledDate = new Date(config.schedule.scheduledDate);
        } catch (e) {
          scheduleData.scheduledDate = null;
        }
      } else {
        scheduleData.scheduledDate = null;
      }

      // Dias da semana (para agendamento semanal)
      if (config.schedule.daysOfWeek && Array.isArray(config.schedule.daysOfWeek)) {
        scheduleData.daysOfWeek = config.schedule.daysOfWeek;
      } else {
        scheduleData.daysOfWeek = [];
      }

      // Dia do mês (para agendamento mensal)
      scheduleData.dayOfMonth = config.schedule.dayOfMonth || null;

      this.scheduleForm.patchValue(scheduleData, { emitEvent: false });
    } else {
      // Se não houver schedule, usar valores padrão
      console.warn('config.schedule is missing, using defaults');
      const defaultSchedule = {
        scheduleType: 'daily',
        enabled: true,
        scheduledDate: null,
        scheduledTime: '02:00',
        daysOfWeek: [],
        dayOfMonth: null,
        retentionDays: config.retentionDays || 30,
        compressBackup: config.compressBackup !== undefined ? config.compressBackup : true
      };
      this.scheduleForm.patchValue(defaultSchedule, { emitEvent: false });
    }

    // Preencher formulário de notificações
    const notificationData = {
      emailNotification: config.emailNotification || false,
      emailRecipients: config.emailRecipients && config.emailRecipients.length > 0 
        ? config.emailRecipients.join(', ') 
        : ''
    };
    this.notificationForm.patchValue(notificationData, { emitEvent: false });

    // Atualizar preview do agendamento
    this.syncScheduleUiState();
    this.updateSchedulePreview();
    
  }

  loadBackupHistory() {
    this.loadingHistory = true;
    this.backupService.getBackupHistory(50).subscribe({
      next: (history) => {
        this.backupHistory = history;
        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
      }
    });
  }

  onPathChange() {
    const path = this.pathForm.get('backupPath')?.value;
    if (path) {
      this.pathValidationSubject.next(path);
    }
  }

  validatePath(path: string) {
    this.pathValidating = true;
    this.backupService.validatePath(path).subscribe({
      next: (result) => {
        this.pathValidationResult = result;
        this.pathValidating = false;
      },
      error: () => {
        this.pathValidationResult = { valid: false, message: this.i18n.translate('backup.err.pathValidate') };
        this.pathValidating = false;
      }
    });
  }

  testConnection() {
    if (this.connectionForm.invalid) {
      toastKey(this.messageService, this.i18n, 'warn', 'backup.toast.attention', 'backup.toast.fillConnection');
      return;
    }

    this.testingConnection = true;
    const formValue = this.connectionForm.value;
    
    // Garantir que a porta seja um número
    const connection: DatabaseConnection = {
      host: formValue.host,
      port: typeof formValue.port === 'string' ? parseInt(formValue.port, 10) : formValue.port,
      database: formValue.database,
      username: formValue.username,
      password: formValue.password,
      sslEnabled: formValue.sslEnabled || false
    };

    this.backupService.testConnection(connection).subscribe({
      next: (result) => {
        this.testingConnection = false;
        toastKey(
          this.messageService,
          this.i18n,
          result.success ? 'success' : 'error',
          result.success ? 'backup.toast.success' : 'backup.toast.error',
          'backup.toast.openFolderResult',
          { message: translateApiMessage(this.i18n, result.message) }
        );
      },
      error: (error) => {
        this.testingConnection = false;
        toastKey(this.messageService, this.i18n, 'error', 'backup.toast.error', 'backup.toast.openFolderResult', {
          message: extractApiErrorMessage(error, this.i18n, 'backup.toast.testConnectionError')
        });
      }
    });
  }

  executeBackup() {
    this.executingBackup = true;
    this.backupService.executeBackup().subscribe({
      next: (result) => {
        this.executingBackup = false;
        
        if (result.success && result.backupId) {
          // Iniciar animação de backup global
          this.backupProgressService.startBackupAnimation(String(result.backupId));
          // Recarregar histórico após um delay
          setTimeout(() => this.loadBackupHistory(), 2000);
        } else {
          toastKey(
            this.messageService,
            this.i18n,
            result.success ? 'success' : 'error',
            result.success ? 'backup.toast.success' : 'backup.toast.error',
            'backup.toast.openFolderResult',
            { message: translateApiMessage(this.i18n, result.message) }
          );
        }
        
        if (result.success) {
          setTimeout(() => this.loadBackupHistory(), 2000);
        }
      },
      error: (error) => {
        this.executingBackup = false;
        toastKey(this.messageService, this.i18n, 'error', 'backup.toast.error', 'backup.toast.openFolderResult', {
          message: extractApiErrorMessage(error, this.i18n, 'backup.toast.runBackupError')
        });
      }
    });
  }


  saveConfiguration() {
    if (this.connectionForm.invalid || this.pathForm.invalid || this.scheduleForm.invalid) {
      toastKey(this.messageService, this.i18n, 'warn', 'backup.toast.attention', 'backup.toast.fillRequired');
      return;
    }

    this.saving = true;

    const config: BackupConfig = {
      id: this.currentConfig?.id,
      connection: this.connectionForm.value,
      backupPath: this.pathForm.get('backupPath')?.value,
      schedule: {
        scheduleType: this.scheduleForm.get('scheduleType')?.value,
        enabled: this.scheduleForm.get('enabled')?.value,
        scheduledDate: this.scheduleForm.get('scheduledDate')?.value 
          ? new Date(this.scheduleForm.get('scheduledDate')?.value).toISOString().split('T')[0]
          : undefined,
        scheduledTime: this.scheduleForm.get('scheduledTime')?.value,
        daysOfWeek: this.scheduleForm.get('daysOfWeek')?.value || undefined,
        dayOfMonth: this.scheduleForm.get('dayOfMonth')?.value || undefined
      },
      retentionDays: this.scheduleForm.get('retentionDays')?.value,
      compressBackup: this.scheduleForm.get('compressBackup')?.value,
      emailNotification: this.notificationForm.get('emailNotification')?.value,
      emailRecipients: this.notificationForm.get('emailRecipients')?.value
        ? this.notificationForm.get('emailRecipients')?.value.split(',').map((e: string) => e.trim())
        : undefined
    };

    this.backupService.saveConfig(config).subscribe({
      next: (savedConfig) => {
        this.currentConfig = savedConfig;
        this.saving = false;
        // Recarregar configurações do banco para garantir sincronização e preencher formulários
        this.loadConfiguration();
        toastKey(this.messageService, this.i18n, 'success', 'backup.toast.success', 'backup.toast.saveSuccess');
        this.loadBackupHistory();
      },
      error: (error) => {
        this.saving = false;
        toastKey(this.messageService, this.i18n, 'error', 'backup.toast.error', 'backup.toast.openFolderResult', {
          message: extractApiErrorMessage(error, this.i18n, 'backup.toast.saveError')
        });
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateStr: string): string {
    return formatUiDateTime(this.i18n.getCurrentLanguage(), dateStr, 'dateTime');
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'success':
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'running':
        return 'info';
      default:
        return 'warning';
    }
  }

  getFirstRecord(state: any): number {
    if (!this.backupHistory || this.backupHistory.length === 0) {
      return 0;
    }
    return state.first + 1;
  }

  getLastRecord(state: any): number {
    if (!this.backupHistory || this.backupHistory.length === 0) {
      return 0;
    }
    const last = state.first + state.rows;
    return last > this.backupHistory.length ? this.backupHistory.length : last;
  }

  deleteBackup(backupId: number) {
    this.backupService.deleteBackup(backupId).subscribe({
      next: () => {
        toastKey(this.messageService, this.i18n, 'success', 'backup.toast.success', 'backup.toast.deleteSuccess');
        this.loadBackupHistory();
      },
      error: () => {
        toastKey(this.messageService, this.i18n, 'error', 'backup.toast.error', 'backup.toast.deleteError');
      }
    });
  }

  openBackupFolder(backupPath: string) {
    if (!backupPath) {
      toastKey(this.messageService, this.i18n, 'warn', 'backup.toast.warn', 'backup.toast.pathUnavailable');
      return;
    }

    // Extrair o diretório do caminho completo do arquivo
    // Se for Windows (contém \), usar backslash, senão usar forward slash
    const isWindows = backupPath.includes('\\');
    const separator = isWindows ? '\\' : '/';
    const lastSeparatorIndex = Math.max(
      backupPath.lastIndexOf('\\'),
      backupPath.lastIndexOf('/')
    );
    const dirPath = lastSeparatorIndex > 0 
      ? backupPath.substring(0, lastSeparatorIndex)
      : backupPath;
    
    this.backupService.openFolder(dirPath).subscribe({
      next: (result) => {
        if (result.openOnHost && result.hostPath) {
          const p = result.hostPath;
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(p).then(() => {
              toastKey(this.messageService, this.i18n, 'success', 'backup.toast.pathCopied', 'backup.toast.pathCopiedDetail', {
                path: String(p)
              }, 8000);
            }).catch(() => {
              toastKey(this.messageService, this.i18n, 'info', 'backup.toast.openFolderWindows', 'backup.toast.pathCopiedDetail', {
                path: String(p)
              }, 12000);
            });
          } else {
            toastKey(this.messageService, this.i18n, 'info', 'backup.toast.openFolderWindows', 'backup.toast.pathCopiedDetail', {
              path: String(p)
            }, 12000);
          }
          return;
        }
        if (result.success) {
          toastKey(this.messageService, this.i18n, 'success', 'backup.toast.success', 'backup.toast.openFolderResult', {
            message: translateApiMessage(this.i18n, result.message, 'backup.toast.openFolderSuccessDefault')
          });
        } else {
          toastKey(this.messageService, this.i18n, 'warn', 'backup.toast.warn', 'backup.toast.openFolderResult', {
            message: translateApiMessage(this.i18n, result.message, 'backup.toast.openFolderErrorDefault')
          });
        }
      },
      error: (error) => {
        toastKey(this.messageService, this.i18n, 'error', 'backup.toast.error', 'backup.toast.openFolderResult', {
          message: extractApiErrorMessage(error, this.i18n, 'backup.toast.openFolderErrorDefault')
        });
      }
    });
  }

  selectFolder() {
    // Abrir diálogo file explorer
    const currentPath = this.pathForm.get('backupPath')?.value || '';
    this.selectedFolderPath = currentPath;
    this.currentExplorerPath = currentPath || '';
    this.explorerPathHistory = [];
    this.showSelectFolderDialog = true;
    this.loadExplorerDirectories();
  }

  loadExplorerDirectories(path?: string) {
    this.loadingDirectories = true;
    const pathToLoad = path !== undefined ? path : (this.currentExplorerPath || '');
    
    this.backupService.listDirectories(pathToLoad || undefined).subscribe({
      next: (response: any) => {
        // O backend retorna { path: string, directories: DirectoryItem[] }
        if (response.directories && Array.isArray(response.directories)) {
          this.explorerDirectories = response.directories.filter((dir: DirectoryItem) => dir.isDirectory);
        } else {
          this.explorerDirectories = [];
        }
        
        if (response.path !== undefined) {
          this.currentExplorerPath = response.path || '';
        }
        
        // Se não há caminho atual e temos diretórios, selecionar o primeiro caminho
        if (!this.currentExplorerPath && this.explorerDirectories.length > 0) {
          // Manter vazio para raiz
        }
        
        this.loadingDirectories = false;
      },
      error: (error) => {
        this.loadingDirectories = false;
        const errorMessage = extractApiErrorMessage(error, this.i18n, 'backup.toast.loadDirectoriesError');
        toastKey(this.messageService, this.i18n, 'error', 'backup.toast.error', 'backup.toast.loadDirectoriesError', {
          error: String(errorMessage)
        });
        // Tentar carregar diretórios raiz se estava tentando carregar um caminho específico
        if (pathToLoad && pathToLoad !== '') {
          this.currentExplorerPath = '';
          this.selectedFolderPath = '';
          this.loadExplorerDirectories('');
        }
      }
    });
  }

  navigateToDirectory(directory: DirectoryItem) {
    this.explorerPathHistory.push(this.currentExplorerPath);
    this.currentExplorerPath = directory.path;
    this.selectedFolderPath = directory.path;
    this.loadExplorerDirectories(directory.path);
  }

  navigateUp() {
    if (this.explorerPathHistory.length > 0) {
      const previousPath = this.explorerPathHistory.pop() || '';
      this.currentExplorerPath = previousPath;
      this.selectedFolderPath = previousPath;
      this.loadExplorerDirectories(previousPath);
    } else {
      // Ir para raiz
      this.currentExplorerPath = '';
      this.selectedFolderPath = '';
      this.loadExplorerDirectories('');
    }
  }

  selectCurrentFolder() {
    if (this.currentExplorerPath) {
      this.selectedFolderPath = this.currentExplorerPath;
    }
  }

  confirmSelectFolder() {
    if (!this.selectedFolderPath || !this.selectedFolderPath.trim()) {
      toastKey(this.messageService, this.i18n, 'warn', 'backup.toast.attention', 'backup.toast.selectFolderRequired');
      return;
    }

    this.pathForm.patchValue({ backupPath: this.selectedFolderPath.trim() });
    this.onPathChange();
    this.showSelectFolderDialog = false;
    this.selectedFolderPath = '';
    this.currentExplorerPath = '';
    this.explorerPathHistory = [];
    this.explorerDirectories = [];
  }

  cancelSelectFolder() {
    this.showSelectFolderDialog = false;
    this.selectedFolderPath = '';
    this.currentExplorerPath = '';
    this.explorerPathHistory = [];
    this.explorerDirectories = [];
  }

  createFolder() {
    const currentPath = this.pathForm.get('backupPath')?.value || '';
    this.newFolderPath = currentPath;
    this.newFolderName = '';
    this.showCreateFolderDialog = true;
  }

  confirmCreateFolder() {
    if (!this.newFolderName || !this.newFolderName.trim()) {
      toastKey(this.messageService, this.i18n, 'warn', 'backup.toast.attention', 'backup.toast.folderNameRequired');
      return;
    }

    // Construir o caminho completo
    let fullPath = '';
    if (this.newFolderPath) {
      // Garantir que o caminho termine com / ou \
      const separator = this.newFolderPath.includes('\\') ? '\\' : '/';
      fullPath = this.newFolderPath.endsWith(separator) 
        ? this.newFolderPath + this.newFolderName.trim()
        : this.newFolderPath + separator + this.newFolderName.trim();
    } else {
      fullPath = this.newFolderName.trim();
    }

    // Atualizar o formulário
    this.pathForm.patchValue({ backupPath: fullPath });
    this.onPathChange();
    
    // Fechar diálogo
    this.showCreateFolderDialog = false;
    this.newFolderName = '';
    this.newFolderPath = '';

    toastKey(this.messageService, this.i18n, 'info', 'backup.toast.folderCreatedTitle', 'backup.toast.folderCreatedDetail');
  }

  cancelCreateFolder() {
    this.showCreateFolderDialog = false;
    this.newFolderName = '';
    this.newFolderPath = '';
  }
}

