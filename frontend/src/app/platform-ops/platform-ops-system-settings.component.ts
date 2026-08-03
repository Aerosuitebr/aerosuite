import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { SistemaConfigService } from '../core/sistema-config.service';
import { EmailTestService } from '../core/email-test.service';
import { toastKey } from '../core/toast-i18n.util';
import { extractApiErrorMessage } from '../core/backend-i18n-message.util';

interface Configuracao {
  id: string;
  nome: string;
  descricao: string;
  valor: string | number | boolean;
  tipo: 'text' | 'number' | 'boolean' | 'select';
  opcoes?: Array<{ label: string; value: string | number | boolean }>;
  categoria: string;
  obrigatorio: boolean;
}

interface ConfiguracoesAvancadas {
  logsDetalhados: boolean;
  backupAutomatico: boolean;
  notificacoesEmail: boolean;
}

interface AdminSettingsStored {
  values: Record<string, string | number | boolean>;
  avancadas: ConfiguracoesAvancadas;
}

interface SettingsSection {
  id: string;
  icon: string;
  tone: string;
  titleKey: string;
  descKey: string;
}

const ADMIN_SETTINGS_STORAGE_KEY = 'aerosuite.admin.settings';

@Component({
  selector: 'app-platform-ops-system-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AccordionModule,
    ButtonModule,
    CheckboxModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    ToastModule,
    TranslatePipe,
  ],
  providers: [MessageService],
  templateUrl: './platform-ops-system-settings.component.html',
  styleUrls: ['./platform-ops-system-settings.component.scss'],
})
export class PlatformOpsSystemSettingsComponent implements OnInit {
  private translationService = inject(TranslationService);
  private messageService = inject(MessageService);
  private sistemaConfigService = inject(SistemaConfigService);
  private emailTestService = inject(EmailTestService);

  configuracoes: Configuracao[] = [];
  settingsSections: SettingsSection[] = [];
  settingsAccordionOpen: number[] = [0];
  jumpNavItems: Array<{ id: string; labelKey: string; icon: string }> = [];

  configuracoesAvancadas: ConfiguracoesAvancadas = {
    logsDetalhados: false,
    backupAutomatico: true,
    notificacoesEmail: true,
  };

  salvando = false;
  carregando = true;
  emailTestDestino = '';
  enviandoEmailTest = false;

  private readonly categoryIcons: Record<string, string> = {
    sistema: 'pi-server',
    seguranca: 'pi-shield',
    notificacoes: 'pi-bell',
    backup: 'pi-database',
    advanced: 'pi-sliders-h',
  };

  ngOnInit(): void {
    this.buildSections();
    this.carregarConfiguracoes();
    this.carregarDoServidor();
  }

  private t(key: string): string {
    return this.translationService.translate(key);
  }

  private buildSections(): void {
    this.settingsSections = [
      { id: 'sistema', icon: 'pi-server', tone: 'sistema', titleKey: 'system.title', descKey: 'system.description' },
      { id: 'seguranca', icon: 'pi-shield', tone: 'seguranca', titleKey: 'security.title', descKey: 'security.description' },
      { id: 'notificacoes', icon: 'pi-bell', tone: 'notificacoes', titleKey: 'notifications.title', descKey: 'notifications.description' },
      { id: 'backup', icon: 'pi-database', tone: 'backup', titleKey: 'backup.title', descKey: 'backup.description' },
      { id: 'advanced', icon: 'pi-sliders-h', tone: 'advanced', titleKey: 'settings.advanced.title', descKey: 'settings.advanced.description' },
    ];
    this.jumpNavItems = this.settingsSections.map(s => ({
      id: `ops-settings-${s.id}`,
      labelKey: s.titleKey,
      icon: s.icon,
    }));
  }

  private carregarConfiguracoes(): void {
    this.configuracoes = [
      {
        id: 'nome_sistema',
        nome: this.t('system.name'),
        descricao: this.t('system.name.description'),
        valor: 'AEROSUITE CONTROLS',
        tipo: 'text',
        categoria: 'sistema',
        obrigatorio: true,
      },
      {
        id: 'versao_sistema',
        nome: this.t('system.version'),
        descricao: this.t('system.version.description'),
        valor: '1.0.0',
        tipo: 'text',
        categoria: 'sistema',
        obrigatorio: true,
      },
      {
        id: 'timeout_sessao',
        nome: this.t('system.sessionTimeout'),
        descricao: this.t('system.sessionTimeout.description'),
        valor: 30,
        tipo: 'number',
        categoria: 'sistema',
        obrigatorio: true,
      },
      {
        id: 'manutencao_modo',
        nome: this.t('system.maintenanceMode'),
        descricao: this.t('system.maintenanceMode.description'),
        valor: false,
        tipo: 'boolean',
        categoria: 'sistema',
        obrigatorio: false,
      },
      {
        id: 'senha_minima',
        nome: this.t('security.minPasswordLength'),
        descricao: this.t('security.minPasswordLength.description'),
        valor: 8,
        tipo: 'number',
        categoria: 'seguranca',
        obrigatorio: true,
      },
      {
        id: 'tentativas_login',
        nome: this.t('security.loginAttempts'),
        descricao: this.t('security.loginAttempts.description'),
        valor: 3,
        tipo: 'number',
        categoria: 'seguranca',
        obrigatorio: true,
      },
      {
        id: 'autenticacao_dupla',
        nome: this.t('security.twoFactor'),
        descricao: this.t('security.twoFactor.description'),
        valor: false,
        tipo: 'boolean',
        categoria: 'seguranca',
        obrigatorio: false,
      },
      {
        id: 'nivel_log',
        nome: this.t('security.logLevel'),
        descricao: this.t('security.logLevel.description'),
        valor: 'INFO',
        tipo: 'select',
        opcoes: [
          { label: this.t('security.logLevel.debug'), value: 'DEBUG' },
          { label: this.t('security.logLevel.info'), value: 'INFO' },
          { label: this.t('security.logLevel.warn'), value: 'WARN' },
          { label: this.t('security.logLevel.error'), value: 'ERROR' },
        ],
        categoria: 'seguranca',
        obrigatorio: true,
      },
      {
        id: 'email_smtp',
        nome: this.t('notifications.smtpServer'),
        descricao: this.t('notifications.smtpServer.description'),
        valor: 'smtp.gmail.com',
        tipo: 'text',
        categoria: 'notificacoes',
        obrigatorio: false,
      },
      {
        id: 'email_porta',
        nome: this.t('notifications.smtpPort'),
        descricao: this.t('notifications.smtpPort.description'),
        valor: 587,
        tipo: 'number',
        categoria: 'notificacoes',
        obrigatorio: false,
      },
      {
        id: 'notificacoes_push',
        nome: this.t('notifications.push'),
        descricao: this.t('notifications.push.description'),
        valor: true,
        tipo: 'boolean',
        categoria: 'notificacoes',
        obrigatorio: false,
      },
      {
        id: 'frequencia_backup',
        nome: this.t('backup.frequency'),
        descricao: this.t('backup.frequency.description'),
        valor: 'DIARIO',
        tipo: 'select',
        opcoes: [
          { label: this.t('backup.frequency.daily'), value: 'DIARIO' },
          { label: this.t('backup.frequency.weekly'), value: 'SEMANAL' },
          { label: this.t('backup.frequency.monthly'), value: 'MENSAL' },
        ],
        categoria: 'backup',
        obrigatorio: true,
      },
      {
        id: 'retencao_backup',
        nome: this.t('backup.retention'),
        descricao: this.t('backup.retention.description'),
        valor: 30,
        tipo: 'number',
        categoria: 'backup',
        obrigatorio: true,
      },
      {
        id: 'backup_criptografado',
        nome: this.t('backup.encrypted'),
        descricao: this.t('backup.encrypted.description'),
        valor: true,
        tipo: 'boolean',
        categoria: 'backup',
        obrigatorio: false,
      },
    ];
  }

  private carregarDoServidor(): void {
    this.carregando = true;
    this.sistemaConfigService.get().subscribe({
      next: data => {
        this.carregando = false;
        this.aplicarPayload(data.valores, data.avancadas);
        this.migrarLocalStorageSeNecessario();
      },
      error: () => {
        this.carregando = false;
        this.mergeStoredAdminSettings();
        toastKey(this.messageService, this.translationService, 'warn', 'common.toast.warn', 'sistema.config.toast.loadErr');
      },
    });
  }

  private aplicarPayload(
    valores: Record<string, string | number | boolean> | undefined,
    avancadas: Partial<ConfiguracoesAvancadas> | undefined
  ): void {
    if (valores) {
      for (const config of this.configuracoes) {
        if (valores[config.id] !== undefined) {
          config.valor = valores[config.id];
        }
      }
    }
    if (avancadas) {
      this.configuracoesAvancadas = { ...this.configuracoesAvancadas, ...avancadas };
    }
    this.syncLogsFromNivelLog();
  }

  private syncLogsFromNivelLog(): void {
    const nivelLog = this.configuracoes.find(c => c.id === 'nivel_log');
    if (nivelLog?.valor === 'DEBUG') {
      this.configuracoesAvancadas.logsDetalhados = true;
    }
  }

  private migrarLocalStorageSeNecessario(): void {
    try {
      const raw = localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as AdminSettingsStored;
      void firstValueFrom(this.sistemaConfigService.save({ valores: parsed.values, avancadas: parsed.avancadas }))
        .then(() => localStorage.removeItem(ADMIN_SETTINGS_STORAGE_KEY))
        .catch(() => undefined);
    } catch {
      localStorage.removeItem(ADMIN_SETTINGS_STORAGE_KEY);
    }
  }

  private mergeStoredAdminSettings(): void {
    try {
      const raw = localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as AdminSettingsStored;
      this.aplicarPayload(parsed.values, parsed.avancadas);
    } catch {
      localStorage.removeItem(ADMIN_SETTINGS_STORAGE_KEY);
    }
  }

  private buildPayload(): { valores: Record<string, string | number | boolean>; avancadas: ConfiguracoesAvancadas } {
    const nivelLog = this.configuracoes.find(c => c.id === 'nivel_log');
    if (nivelLog && this.configuracoesAvancadas.logsDetalhados) {
      nivelLog.valor = 'DEBUG';
    }
    const valores: Record<string, string | number | boolean> = {};
    for (const config of this.configuracoes) {
      valores[config.id] = config.valor;
    }
    return { valores, avancadas: { ...this.configuracoesAvancadas } };
  }

  getConfiguracoesPorCategoria(categoriaId: string): Configuracao[] {
    return this.configuracoes.filter(config => config.categoria === categoriaId);
  }

  scrollToSection(sectionId: string): void {
    const idx = this.settingsSections.findIndex(s => `ops-settings-${s.id}` === sectionId);
    if (idx < 0) {
      return;
    }
    if (!this.settingsAccordionOpen.includes(idx)) {
      this.settingsAccordionOpen = [...this.settingsAccordionOpen, idx];
    }
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  salvar(): void {
    void this.runSalvar();
  }

  private async runSalvar(): Promise<void> {
    if (this.salvando) {
      return;
    }
    this.salvando = true;
    const payload = this.buildPayload();
    try {
      await firstValueFrom(this.sistemaConfigService.save(payload));
      localStorage.removeItem(ADMIN_SETTINGS_STORAGE_KEY);
      toastKey(this.messageService, this.translationService, 'success', 'settings.saved', 'settings.savedDetail');
    } catch (err) {
      localStorage.setItem(
        ADMIN_SETTINGS_STORAGE_KEY,
        JSON.stringify({ values: payload.valores, avancadas: payload.avancadas } satisfies AdminSettingsStored)
      );
      this.messageService.add({
        severity: 'error',
        summary: this.translationService.translate('common.toast.error'),
        detail: extractApiErrorMessage(err, this.translationService, 'sistema.config.toast.saveErr'),
      });
    } finally {
      this.salvando = false;
    }
  }

  restaurarPadroes(): void {
    this.sistemaConfigService.restaurarPadroes().subscribe({
      next: () => {
        localStorage.removeItem(ADMIN_SETTINGS_STORAGE_KEY);
        this.carregarConfiguracoes();
        this.carregarDoServidor();
        toastKey(this.messageService, this.translationService, 'info', 'settings.restored', 'settings.restoredDetail');
      },
      error: () => {
        localStorage.removeItem(ADMIN_SETTINGS_STORAGE_KEY);
        this.carregarConfiguracoes();
        toastKey(this.messageService, this.translationService, 'warn', 'common.toast.warn', 'sistema.config.toast.saveErr');
      },
    });
  }

  enviarEmailTeste(): void {
    const email = (this.emailTestDestino || '').trim();
    if (!email) {
      return;
    }
    this.enviandoEmailTest = true;
    this.emailTestService.enviarTeste(email).subscribe({
      next: res => {
        this.enviandoEmailTest = false;
        if (res.sucesso) {
          toastKey(this.messageService, this.translationService, 'success', 'common.toast.success', 'settings.emailTest.ok');
        } else {
          toastKey(this.messageService, this.translationService, 'error', 'common.toast.error', 'settings.emailTest.err');
        }
      },
      error: err => {
        this.enviandoEmailTest = false;
        const key = err?.status === 403 ? 'settings.emailTest.forbidden' : 'settings.emailTest.err';
        toastKey(this.messageService, this.translationService, 'error', 'common.toast.error', key);
      },
    });
  }
}
