import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SidebarModule } from 'primeng/sidebar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProgressBarModule } from 'primeng/progressbar';
import { Menu, MenuModule } from 'primeng/menu';
import { MessageService, MenuItem, ConfirmationService } from 'primeng/api';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  switchMap,
  of,
  catchError,
  takeUntil,
  filter,
  timeout,
  finalize,
  EMPTY
} from 'rxjs';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';
import {
  ProvisionTenantResponse,
  TenantDetailDto,
  TenantFeatureCatalogItemDto,
  TenantStatsDto,
  TenantSummaryDto,
  TenantService
} from './tenant.service';
import { slugFromOrganizationName, suggestSupportEmail } from './slug.util';
import { AuthService } from '../auth/auth.service';
import { ListDataStatesComponent } from '../shared/list-data-states/list-data-states.component';
import { PageHeroComponent } from '../shared/page-hero/page-hero.component';
import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '../core/list-pagination.constants';
import { PasswordPolicyPanelComponent } from '../core/password-policy-panel/password-policy-panel.component';
import { passwordPolicyValidator } from '../core/password-policy.util';

const CODIGO_PATTERN = /^[a-z0-9][a-z0-9_-]{1,62}$/;

const FEATURE_MODULO_ORDER = ['ESTOQUE', 'MRO', 'COMERCIAL', 'PLATFORM'] as const;

interface TenantFeatureGroupView {
  modulo: string;
  labelKey: string;
  icon: string;
  items: TenantFeatureCatalogItemDto[];
}

function codigoValidator(control: AbstractControl): ValidationErrors | null {
  const v = (control.value as string)?.trim();
  if (!v) {
    return { required: true };
  }
  return CODIGO_PATTERN.test(v) ? null : { pattern: true };
}

@Component({
  selector: 'app-organizacoes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    PasswordModule,
    ToastModule,
    TooltipModule,
    SidebarModule,
    ConfirmDialogModule,
    SelectButtonModule,
    ProgressBarModule,
    MenuModule,
    TranslatePipe,
    RouterLink,
    ListDataStatesComponent,
    PageHeroComponent,
    PasswordPolicyPanelComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './organizacoes.component.html',
  styleUrls: ['./organizacoes.component.scss']
})
export class OrganizacoesComponent implements OnInit, OnDestroy {
  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;
  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;

  private tenantService = inject(TenantService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private destroy$ = new Subject<void>();
  private codigoCheck$ = new Subject<string>();

  tenants: TenantSummaryDto[] = [];
  platformStats: TenantStatsDto | null = null;
  loading = true;
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  statusFilterOptions: { label: string; value: 'all' | 'active' | 'inactive' }[] = [];

  dashboardVisible = false;
  editVisible = false;
  detailLoading = false;
  selected: TenantSummaryDto | null = null;
  selectedDetail: TenantDetailDto | null = null;
  savingEdit = false;
  welcomeVisible = false;
  welcomeTarget: TenantSummaryDto | null = null;
  resendResetPassword = false;
  resendingWelcome = false;

  wizardVisible = false;
  wizardStep = 0;
  provisioning = false;
  provisionResult: ProvisionTenantResponse | null = null;

  codigoChecking = false;
  codigoAvailable: boolean | null = null;
  codigoStatusLabel = 'tenants.field.codigo.taken';
  codigoSuggestion: string | null = null;
  wizardLogoFile: File | null = null;
  wizardLogoPreview: string | null = null;
  wizardLogoFileName: string | null = null;

  @ViewChild('wizardLogoInput') wizardLogoInput?: ElementRef<HTMLInputElement>;
  @ViewChild('rowMenu') rowMenu?: Menu;

  readonly wizardStepIcons = ['pi-building', 'pi-palette', 'pi-user', 'pi-file-check'];

  stepItems: MenuItem[] = [];
  rowMenuItems: MenuItem[] = [];

  form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(200)]],
    codigo: ['', [Validators.required, codigoValidator]],
    autoCodigo: [true],
    displayName: [''],
    supportEmail: ['', Validators.email],
    autoSupportEmail: [true],
    createAdmin: [true],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminNome: [''],
    adminSenha: [''],
    autoAdminSenha: [true],
    sendWelcomeEmail: [true],
    modMro: [true],
    modEstoque: [true],
    modComercial: [true]
  });

  editForm: FormGroup = this.fb.group({
    nome: ['', Validators.required],
    displayName: [''],
    supportEmail: ['', Validators.email],
    ativo: [true],
    modMro: [true],
    modEstoque: [true],
    modComercial: [true]
  });

  editDetailLoading = false;
  editFeatureItems: TenantFeatureCatalogItemDto[] = [];
  editFeatureEnabled: Record<string, boolean> = {};
  editFeatureGroupsView: TenantFeatureGroupView[] = [];
  editEnabledFeaturesCount = 0;

  ngOnInit(): void {
    this.buildStepItems();
    this.buildStatusFilters();
    this.i18n
      .getCurrentLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.buildStepItems();
        this.buildStatusFilters();
      });

    this.form
      .get('nome')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.form.get('autoCodigo')?.value) {
          this.syncCodigoFromNome();
        }
        this.syncDisplayNameFromNome();
      });

    this.form
      .get('autoCodigo')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((auto: boolean) => {
        if (auto) {
          this.syncCodigoFromNome();
        }
      });

    this.form
      .get('codigo')!
      .valueChanges.pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(c => this.queueCodigoCheck(c));

    this.form
      .get('autoSupportEmail')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(auto => {
        if (auto) {
          this.syncSupportEmail();
        }
      });

    this.form
      .get('codigo')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.form.get('autoSupportEmail')?.value) {
          this.syncSupportEmail();
        }
      });

    this.form
      .get('autoAdminSenha')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(auto => {
        const ctrl = this.form.get('adminSenha')!;
        if (auto) {
          ctrl.disable({ emitEvent: false });
          ctrl.setValue('');
          ctrl.clearValidators();
        } else {
          ctrl.enable({ emitEvent: false });
          ctrl.setValidators([Validators.required, passwordPolicyValidator()]);
        }
        ctrl.updateValueAndValidity({ emitEvent: false });
      });

    this.form
      .get('createAdmin')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.syncAdminEmailValidators());

    this.syncAdminEmailValidators();

    this.codigoCheck$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter(c => !!c?.trim()),
        switchMap(c => {
          this.codigoChecking = true;
          this.codigoAvailable = null;
          return this.tenantService.checkCodigo(c).pipe(
            catchError(() =>
              of({ codigo: c, available: false, reason: 'ERROR', suggestion: null as string | null })
            )
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        this.codigoChecking = false;
        this.codigoAvailable = res.available;
        this.codigoSuggestion = res.suggestion ?? null;
        this.codigoStatusLabel = this.mapCodigoReason(res.reason);
      });

    this.loadTenants();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildStepItems(): void {
    this.stepItems = [
      { label: this.i18n.translate('tenants.wizard.step.identity') },
      { label: this.i18n.translate('tenants.wizard.step.branding') },
      { label: this.i18n.translate('tenants.wizard.step.admin') },
      { label: this.i18n.translate('tenants.wizard.step.review') }
    ];
  }

  wizardStepDescKey(step: number): string {
    const keys = [
      'tenants.wizard.step.identity.desc',
      'tenants.wizard.step.branding.desc',
      'tenants.wizard.step.admin.desc',
      'tenants.wizard.step.review.desc'
    ];
    return keys[step] ?? '';
  }

  triggerWizardLogoInput(): void {
    this.wizardLogoInput?.nativeElement.click();
  }

  clearWizardLogoSelection(): void {
    this.clearWizardLogo();
    this.wizardLogoFileName = null;
    const input = this.wizardLogoInput?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  private buildStatusFilters(): void {
    this.statusFilterOptions = [
      { label: this.i18n.translate('tenants.filter.all'), value: 'all' },
      { label: this.i18n.translate('tenants.filter.active'), value: 'active' },
      { label: this.i18n.translate('tenants.filter.inactive'), value: 'inactive' }
    ];
  }

  private mapCodigoReason(reason?: string | null): string {
    switch (reason) {
      case 'INVALID_FORMAT':
        return 'tenants.field.codigo.invalid';
      case 'RESERVED':
        return 'tenants.field.codigo.reserved';
      case 'TAKEN':
        return 'tenants.field.codigo.taken';
      default:
        return 'tenants.field.codigo.taken';
    }
  }

  get stats() {
    const total = this.tenants.length;
    const active = this.tenants.filter(t => t.ativo).length;
    return {
      total,
      active,
      inactive: total - active,
      platform: this.tenants.filter(t => t.codigo === 'default').length
    };
  }

  get filteredTenants(): TenantSummaryDto[] {
    const q = this.searchTerm.trim().toLowerCase();
    let list = [...this.tenants];
    if (this.statusFilter === 'active') {
      list = list.filter(t => t.ativo);
    } else if (this.statusFilter === 'inactive') {
      list = list.filter(t => !t.ativo);
    }
    if (q) {
      list = list.filter(
        t =>
          t.nome.toLowerCase().includes(q) ||
          t.codigo.toLowerCase().includes(q) ||
          String(t.id).includes(q)
      );
    }
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  usageScore(row: TenantSummaryDto): number {
    if (!row.stats) {
      return 0;
    }
    return (
      row.stats.usuariosInternos +
      row.stats.usuariosExternos +
      row.stats.ordensServico +
      row.stats.propostasComerciais
    );
  }

  usagePercent(row: TenantSummaryDto): number {
    if (!this.platformStats || !row.stats) {
      return 0;
    }
    const platformScore =
      this.platformStats.usuariosInternos +
      this.platformStats.usuariosExternos +
      this.platformStats.ordensServico +
      this.platformStats.propostasComerciais;
    if (platformScore <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.usageScore(row) / platformScore) * 100));
  }

  usageBarStyleClass(row: TenantSummaryDto): string {
    const pct = this.usagePercent(row);
    if (pct >= 95) {
      return 'tenant-usage-bar tenant-usage-bar--danger';
    }
    if (pct >= 80) {
      return 'tenant-usage-bar tenant-usage-bar--warning';
    }
    return 'tenant-usage-bar tenant-usage-bar--normal';
  }

  openRowMenu(event: Event, row: TenantSummaryDto): void {
    this.rowMenuItems = this.buildRowMenuItems(row);
    this.rowMenu?.toggle(event);
  }

  private buildRowMenuItems(row: TenantSummaryDto): MenuItem[] {
    const suspendKey = row.ativo ? 'tenants.action.suspend' : 'tenants.action.activate';
    return [
      {
        label: this.i18n.translate('tenants.action.dashboard'),
        icon: 'pi pi-chart-bar',
        command: () => this.openDashboard(row)
      },
      {
        label: this.i18n.translate('tenants.action.welcome'),
        icon: 'pi pi-envelope',
        command: () => this.openWelcomeDialog(row)
      },
      {
        label: this.i18n.translate('tenants.action.onboardingLink'),
        icon: 'pi pi-link',
        command: () => this.copyOnboardingLink(row)
      },
      { separator: true },
      {
        label: this.i18n.translate(suspendKey),
        icon: row.ativo ? 'pi pi-ban' : 'pi pi-check',
        disabled: this.isDefaultTenant(row),
        command: () => this.confirmToggleStatus(row)
      },
      {
        label: this.i18n.translate('tenants.copy.codigo'),
        icon: 'pi pi-copy',
        command: () => this.copyText(row.codigo)
      }
    ];
  }

  accessInstance(row: TenantSummaryDto): void {
    this.authService.setStoredTenantCodigo(row.codigo);
    void this.router.navigate(['/login'], { queryParams: { tenant: row.codigo } });
  }

  statPercent(value: number, total: number): number {
    if (!total) {
      return 0;
    }
    return Math.min(100, Math.round((value / total) * 100));
  }

  isDefaultTenant(row: TenantSummaryDto): boolean {
    return row.codigo === 'default' || row.id === 1;
  }

  get reviewDisplayName(): string {
    const d = this.form.get('displayName')?.value?.trim();
    const n = this.form.get('nome')?.value?.trim();
    return d || n || '—';
  }

  get reviewModulos(): string {
    const parts: string[] = [];
    if (this.form.get('modMro')?.value) {
      parts.push(this.i18n.translate('tenants.field.moduloMro'));
    }
    if (this.form.get('modEstoque')?.value) {
      parts.push(this.i18n.translate('tenants.field.moduloEstoque'));
    }
    if (this.form.get('modComercial')?.value) {
      parts.push(this.i18n.translate('tenants.field.moduloComercial'));
    }
    return parts.length ? parts.join(', ') : '—';
  }

  get reviewSupportEmail(): string {
    const e = this.form.get('supportEmail')?.value?.trim();
    if (e) {
      return e;
    }
    const c = this.form.get('codigo')?.value?.trim();
    return c ? suggestSupportEmail(c) : '—';
  }

  loadTenants(): void {
    this.loading = true;
    this.tenantService.list().subscribe({
      next: res => {
        this.tenants = res?.items ?? [];
        this.platformStats = res?.platformStats ?? null;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.i18n.addToast(
          this.messageService,
          'error',
          'common.toast.error',
          'tenants.toast.loadError'
        );
      }
    });
  }

  openWizard(): void {
    this.resetWizardForm();
    this.wizardStep = 0;
    this.provisionResult = null;
    this.wizardVisible = true;
  }

  closeWizard(): void {
    this.wizardVisible = false;
  }

  onWizardHide(): void {
    if (this.provisionResult) {
      this.loadTenants();
    }
    this.provisionResult = null;
    this.wizardStep = 0;
  }

  private resetWizardForm(): void {
    this.form.reset({
      nome: '',
      codigo: '',
      autoCodigo: true,
      displayName: '',
      supportEmail: '',
      autoSupportEmail: true,
      createAdmin: true,
      adminEmail: '',
      adminNome: '',
      adminSenha: '',
      autoAdminSenha: true,
      sendWelcomeEmail: true
    });
    this.form.get('adminSenha')?.disable({ emitEvent: false });
    this.codigoAvailable = null;
    this.codigoChecking = false;
    this.codigoSuggestion = null;
    this.clearWizardLogo();
    this.syncAdminEmailValidators();
  }

  private syncAdminEmailValidators(): void {
    const mail = this.form.get('adminEmail')!;
    if (this.form.get('createAdmin')?.value) {
      mail.setValidators([Validators.required, Validators.email]);
    } else {
      mail.setValidators([Validators.email]);
    }
    mail.updateValueAndValidity({ emitEvent: false });
  }

  onWizardLogoSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.clearWizardLogoSelection();
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.i18n.addToast(this.messageService, 'warn', 'common.toast.warn', 'tenants.field.logo.invalidType');
      input.value = '';
      this.wizardLogoFileName = null;
      return;
    }
    this.wizardLogoFile = file;
    this.wizardLogoFileName = file.name;
    if (this.wizardLogoPreview) {
      URL.revokeObjectURL(this.wizardLogoPreview);
    }
    this.wizardLogoPreview = URL.createObjectURL(file);
  }

  private clearWizardLogo(): void {
    this.wizardLogoFile = null;
    this.wizardLogoFileName = null;
    if (this.wizardLogoPreview) {
      URL.revokeObjectURL(this.wizardLogoPreview);
    }
    this.wizardLogoPreview = null;
  }

  onNomeBlur(): void {
    if (this.form.get('autoCodigo')?.value) {
      this.syncCodigoFromNome();
    }
    this.syncDisplayNameFromNome();
    if (this.form.get('autoSupportEmail')?.value) {
      this.syncSupportEmail();
    }
  }

  private syncCodigoFromNome(): void {
    const nome = this.form.get('nome')?.value as string;
    if (!nome?.trim()) {
      return;
    }
    const slug = slugFromOrganizationName(nome);
    this.form.get('codigo')!.setValue(slug, { emitEvent: true });
  }

  private syncDisplayNameFromNome(): void {
    const display = this.form.get('displayName')?.value?.trim();
    if (display) {
      return;
    }
    const nome = this.form.get('nome')?.value?.trim();
    if (nome) {
      this.form.get('displayName')!.setValue(nome, { emitEvent: false });
    }
  }

  private syncSupportEmail(): void {
    const codigo = this.form.get('codigo')?.value as string;
    if (codigo?.trim()) {
      this.form.get('supportEmail')!.setValue(suggestSupportEmail(codigo), { emitEvent: false });
    }
  }

  private queueCodigoCheck(codigo: string): void {
    if (!codigo?.trim()) {
      this.codigoAvailable = null;
      return;
    }
    this.codigoCheck$.next(codigo.trim().toLowerCase());
  }

  applyCodigoSuggestion(): void {
    if (this.codigoSuggestion) {
      this.form.get('codigo')!.setValue(this.codigoSuggestion);
      this.form.get('autoCodigo')!.setValue(false);
    }
  }

  wizardBack(): void {
    if (this.wizardStep > 0) {
      this.wizardStep--;
    }
  }

  wizardNext(): void {
    this.markCurrentStepTouched();
    if (this.canAdvance() && this.wizardStep < 3) {
      this.wizardStep++;
    }
  }

  private markCurrentStepTouched(): void {
    if (this.wizardStep === 0) {
      this.form.get('nome')?.markAsTouched();
      this.form.get('codigo')?.markAsTouched();
    } else if (this.wizardStep === 2 && this.form.get('createAdmin')?.value) {
      this.form.get('adminEmail')?.markAsTouched();
    }
  }

  canAdvance(): boolean {
    if (this.wizardStep === 0) {
      return (
        this.form.get('nome')!.valid &&
        this.form.get('codigo')!.valid &&
        this.codigoAvailable === true &&
        !this.codigoChecking
      );
    }
    if (this.wizardStep === 1) {
      const email = this.form.get('supportEmail');
      return !email?.value || email.valid;
    }
    if (this.wizardStep === 2) {
      if (!this.form.get('createAdmin')?.value) {
        return true;
      }
      return this.form.get('adminEmail')!.valid;
    }
    return true;
  }

  provision(): void {
    if (!this.canAdvance()) {
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      codigo: (v.codigo as string).trim().toLowerCase(),
      nome: (v.nome as string).trim(),
      displayName: (v.displayName as string)?.trim() || undefined,
      supportEmail: (v.supportEmail as string)?.trim() || undefined
    } as Parameters<TenantService['provision']>[0];

    body.sendWelcomeEmail = !!v.sendWelcomeEmail;
    if (v.createAdmin && v.adminEmail?.trim()) {
      body.adminEmail = v.adminEmail.trim().toLowerCase();
      body.adminNome = v.adminNome?.trim() || undefined;
      if (!v.autoAdminSenha && v.adminSenha?.trim()) {
        body.adminSenha = v.adminSenha;
      }
    }
    const modulos: string[] = [];
    if (v.modMro) modulos.push('MRO');
    if (v.modEstoque) modulos.push('ESTOQUE');
    if (v.modComercial) modulos.push('COMERCIAL');
    if (modulos.length > 0) {
      body.modulosHabilitados = modulos;
    }

    this.provisioning = true;
    this.tenantService.provision(body).subscribe({
      next: res => {
        this.provisioning = false;
        this.provisionResult = res;
        this.wizardStep = 4;
        const logoFile = this.wizardLogoFile;
        const tenantId = res.tenant?.id;
        if (logoFile && tenantId) {
          this.tenantService.uploadLogo(tenantId, logoFile).subscribe({
            next: () => {
              this.i18n.addToast(
                this.messageService,
                'success',
                'common.toast.success',
                'tenants.toast.logoUploadOk'
              );
            },
            error: () => {
              this.i18n.addToast(
                this.messageService,
                'warn',
                'common.toast.warn',
                'tenants.toast.logoUploadError'
              );
            },
          });
        }
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          'tenants.toast.provisionOk',
          { nome: res.tenant.nome }
        );
      },
      error: err => {
        this.provisioning = false;
        const msg = extractApiErrorMessage(err, this.i18n);
        if (msg) {
          this.i18n.addToastLiteralDetail(
            this.messageService,
            'error',
            'common.toast.error',
            msg
          );
        } else {
          this.i18n.addToast(
            this.messageService,
            'error',
            'common.toast.error',
            'tenants.toast.provisionError'
          );
        }
      }
    });
  }

  copyText(text: string): void {
    navigator.clipboard?.writeText(text).then(() => {
      this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'tenants.copy.ok');
    });
  }

  copyCredentials(): void {
    if (!this.provisionResult) {
      return;
    }
    const lines = [
      `${this.i18n.translate('tenants.success.tenant')}: ${this.provisionResult.tenant.nome} (${this.provisionResult.tenant.codigo})`
    ];
    if (this.provisionResult.adminEmail) {
      lines.push(`${this.i18n.translate('tenants.success.admin')}: ${this.provisionResult.adminEmail}`);
    }
    if (this.provisionResult.adminSenhaTemporaria) {
      lines.push(
        `${this.i18n.translate('tenants.success.password')}: ${this.provisionResult.adminSenhaTemporaria}`
      );
    }
    this.copyText(lines.join('\n'));
  }

  openLogin(): void {
    if (this.provisionResult?.tenant?.codigo) {
      this.authService.setStoredTenantCodigo(this.provisionResult.tenant.codigo);
    }
    this.closeWizard();
    this.router.navigate(['/login']);
  }

  openDashboard(row: TenantSummaryDto): void {
    this.selected = row;
    this.selectedDetail = null;
    this.dashboardVisible = true;
    this.detailLoading = true;
    this.tenantService.getDetail(row.id).subscribe({
      next: d => {
        this.selectedDetail = d;
        this.detailLoading = false;
      },
      error: () => {
        this.detailLoading = false;
      }
    });
  }

  featureLabelKey(code: string): string {
    return `tenantFeatures.catalog.${code}`;
  }

  featureDescriptionKey(code: string): string {
    return `${this.featureLabelKey(code)}.description`;
  }

  featureModuloLabelKey(modulo: string): string {
    switch ((modulo ?? '').toUpperCase()) {
      case 'ESTOQUE':
        return 'tenants.field.features.group.estoque';
      case 'MRO':
        return 'tenants.field.features.group.mro';
      case 'COMERCIAL':
        return 'tenants.field.features.group.comercial';
      default:
        return 'tenants.field.features.group.platform';
    }
  }

  featureModuloIcon(modulo: string): string {
    switch ((modulo ?? '').toUpperCase()) {
      case 'ESTOQUE':
        return 'pi pi-box';
      case 'MRO':
        return 'pi pi-wrench';
      case 'COMERCIAL':
        return 'pi pi-briefcase';
      default:
        return 'pi pi-sliders-h';
    }
  }

  trackFeatureGroup(_index: number, group: TenantFeatureGroupView): string {
    return group.modulo;
  }

  trackFeatureItem(_index: number, item: TenantFeatureCatalogItemDto): string {
    return item.code;
  }

  featureRequiresModuleHint(item: TenantFeatureCatalogItemDto): string {
    const moduloLabel = this.i18n.translate(this.featureModuloLabelKey(item.modulo ?? 'PLATFORM'));
    return this.i18n.translate('tenants.field.features.requiresModule', { modulo: moduloLabel });
  }

  private rebuildEditFeatureGroupsView(): void {
    const byModulo = new Map<string, TenantFeatureCatalogItemDto[]>();
    for (const item of this.editFeatureItems) {
      const key = (item.modulo ?? 'PLATFORM').toUpperCase();
      const list = byModulo.get(key) ?? [];
      list.push(item);
      byModulo.set(key, list);
    }
    const groups: TenantFeatureGroupView[] = [];
    for (const modulo of FEATURE_MODULO_ORDER) {
      const items = byModulo.get(modulo);
      if (!items?.length) {
        continue;
      }
      groups.push({
        modulo,
        labelKey: this.featureModuloLabelKey(modulo),
        icon: this.featureModuloIcon(modulo),
        items
      });
    }
    for (const [modulo, items] of byModulo) {
      if (FEATURE_MODULO_ORDER.includes(modulo as (typeof FEATURE_MODULO_ORDER)[number])) {
        continue;
      }
      groups.push({
        modulo,
        labelKey: this.featureModuloLabelKey(modulo),
        icon: this.featureModuloIcon(modulo),
        items
      });
    }
    this.editFeatureGroupsView = groups;
    this.syncEditEnabledFeaturesCount();
  }

  private syncEditEnabledFeaturesCount(): void {
    this.editEnabledFeaturesCount = this.editFeatureItems.filter(
      item => this.editFeatureEnabled[item.code]
    ).length;
  }

  isFeatureFlagOn(code: string): boolean {
    return !!this.editFeatureEnabled[code];
  }

  isFeatureFlagDisabled(item: TenantFeatureCatalogItemDto): boolean {
    const modulo = (item.modulo ?? '').toUpperCase();
    if (!modulo || modulo === 'PLATFORM') {
      return false;
    }
    const v = this.editForm.value;
    if (modulo === 'ESTOQUE') {
      return !v.modEstoque;
    }
    if (modulo === 'MRO') {
      return !v.modMro;
    }
    if (modulo === 'COMERCIAL') {
      return !v.modComercial;
    }
    return false;
  }

  setFeatureFlag(code: string, enabled: boolean): void {
    if (enabled) {
      const item = this.editFeatureItems.find(f => f.code === code);
      if (item && this.isFeatureFlagDisabled(item)) {
        return;
      }
    }
    this.editFeatureEnabled = { ...this.editFeatureEnabled, [code]: enabled };
    this.syncEditEnabledFeaturesCount();
  }

  openEdit(row: TenantSummaryDto): void {
    this.selected = row;
    this.editVisible = true;
    this.editDetailLoading = true;
    this.editFeatureItems = [];
    this.editFeatureEnabled = {};
    this.editFeatureGroupsView = [];
    this.editEnabledFeaturesCount = 0;
    this.editForm.reset({
      nome: row.nome,
      displayName: row.displayName ?? row.nome,
      supportEmail: row.supportEmail ?? '',
      ativo: row.ativo,
      modMro: true,
      modEstoque: true,
      modComercial: true
    });
    this.tenantService
      .getDetail(row.id)
      .pipe(
        timeout(20_000),
        catchError(() => {
          this.i18n.addToast(
            this.messageService,
            'error',
            'common.toast.error',
            'tenants.edit.loadDetailFailed'
          );
          return EMPTY;
        }),
        finalize(() => {
          this.editDetailLoading = false;
        })
      )
      .subscribe({
        next: d => {
          const mods = d.modulosHabilitados ?? [];
          this.editForm.patchValue({
            modMro: mods.includes('MRO'),
            modEstoque: mods.includes('ESTOQUE'),
            modComercial: mods.includes('COMERCIAL')
          });
          this.applyFeatureItems(d.tenantFeatures ?? []);
        }
      });
  }

  private applyFeatureItems(items: TenantFeatureCatalogItemDto[]): void {
    this.editFeatureItems = items;
    const map: Record<string, boolean> = {};
    for (const item of items) {
      map[item.code] = !!item.enabled;
    }
    this.editFeatureEnabled = map;
    this.rebuildEditFeatureGroupsView();
  }

  private selectedFeatureCodes(): string[] {
    return this.editFeatureItems
      .filter(item => this.editFeatureEnabled[item.code])
      .map(item => item.code);
  }

  saveEdit(): void {
    if (!this.selected || this.editForm.invalid) {
      return;
    }
    const v = this.editForm.value;
    const modulos: string[] = [];
    if (v.modMro) modulos.push('MRO');
    if (v.modEstoque) modulos.push('ESTOQUE');
    if (v.modComercial) modulos.push('COMERCIAL');
    this.savingEdit = true;
    this.tenantService
      .update(this.selected.id, {
        nome: v.nome?.trim(),
        displayName: v.displayName?.trim(),
        supportEmail: v.supportEmail?.trim(),
        ativo: v.ativo,
        modulosHabilitados: modulos,
        featuresHabilitadas: this.selectedFeatureCodes()
      })
      .subscribe({
        next: updated => {
          this.savingEdit = false;
          this.editVisible = false;
          const idx = this.tenants.findIndex(t => t.id === updated.id);
          if (idx >= 0) {
            this.tenants[idx] = { ...this.tenants[idx], ...updated };
          }
          this.i18n.addToast(this.messageService, 'success', 'common.toast.success', 'tenants.toast.updated');
        },
        error: err => {
          this.savingEdit = false;
          const msg = extractApiErrorMessage(err, this.i18n);
          if (msg) {
            this.i18n.addToastLiteralDetail(this.messageService, 'error', 'common.toast.error', msg);
          }
        }
      });
  }

  confirmToggleStatus(row: TenantSummaryDto): void {
    if (this.isDefaultTenant(row) && row.ativo) {
      return;
    }
    const activate = !row.ativo;
    this.confirmationService.confirm({
      header: this.i18n.translate(
        activate ? 'tenants.confirm.activateTitle' : 'tenants.confirm.suspendTitle'
      ),
      message: activate ? '' : this.i18n.translate('tenants.confirm.suspendMsg'),
      icon: activate ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle',
      accept: () => this.toggleStatus(row, activate)
    });
  }

  private toggleStatus(row: TenantSummaryDto, ativo: boolean): void {
    this.tenantService.update(row.id, { ativo }).subscribe({
      next: updated => {
        const idx = this.tenants.findIndex(t => t.id === row.id);
        if (idx >= 0) {
          this.tenants[idx] = { ...this.tenants[idx], ...updated };
        }
        this.i18n.addToast(
          this.messageService,
          'success',
          'common.toast.success',
          ativo ? 'tenants.toast.activated' : 'tenants.toast.suspended'
        );
      }
    });
  }

  dashboardStatRows(d: TenantDetailDto): { key: string; v: number; total: number }[] {
    const s = d.stats;
    const t = d.statsPlatformTotal;
    return [
      { key: 'tenants.stats.users', v: s?.usuariosInternos ?? 0, total: t?.usuariosInternos ?? 0 },
      { key: 'tenants.stats.externos', v: s?.usuariosExternos ?? 0, total: t?.usuariosExternos ?? 0 },
      { key: 'tenants.stats.os', v: s?.ordensServico ?? 0, total: t?.ordensServico ?? 0 },
      { key: 'tenants.stats.propostas', v: s?.propostasComerciais ?? 0, total: t?.propostasComerciais ?? 0 }
    ];
  }

  openWelcomeDialog(row: TenantSummaryDto): void {
    this.welcomeTarget = row;
    this.resendResetPassword = false;
    this.welcomeVisible = true;
  }

  copyOnboardingLink(row: TenantSummaryDto): void {
    this.tenantService.getOnboardingLink(row.id).subscribe({
      next: res => {
        void navigator.clipboard.writeText(res.publicFormUrl).then(() => {
          this.i18n.addToast(
            this.messageService,
            'success',
            this.i18n.translate('tenants.toast.onboardingLinkCopied')
          );
        });
      },
      error: () => {
        this.i18n.addToast(this.messageService, 'error', this.i18n.translate('tenants.error.onboardingLink'));
      }
    });
  }

  confirmResendWelcome(): void {
    if (!this.welcomeTarget) {
      return;
    }
    const row = this.welcomeTarget;
    this.resendingWelcome = true;
    this.tenantService
      .resendWelcome(row.id, { resetAdminPassword: this.resendResetPassword })
      .subscribe({
        next: res => {
          this.resendingWelcome = false;
          this.welcomeVisible = false;
          this.welcomeTarget = null;
          if (res.sent) {
            this.i18n.addToast(
              this.messageService,
              'success',
              'common.toast.success',
              'tenants.toast.welcomeSent',
              { email: res.recipientEmail ?? '' }
            );
          } else {
            this.i18n.addToast(
              this.messageService,
              'warn',
              'common.toast.warn',
              'tenants.success.welcomeNotSent'
            );
          }
          if (res.adminSenhaTemporaria) {
            this.copyText(
              `${this.i18n.translate('tenants.success.password')}: ${res.adminSenhaTemporaria}`
            );
          }
        },
        error: () => {
          this.resendingWelcome = false;
        }
      });
  }
}
