import { Injectable, inject } from '@angular/core';
import { extractApiErrorKey } from './api-error';
import { translateBackendI18nMessage } from './backend-i18n-message.util';
import { BehaviorSubject, Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AppearancePreferencesService } from './appearance-preferences.service';
import { TOAST_PHRASE_MAP } from './i18n/toast-phrase-map.generated';
import {
  MODULE_LAYOUT_EN_US,
  MODULE_LAYOUT_ES_ES,
  MODULE_LAYOUT_FR_FR,
  MODULE_LAYOUT_PT_BR
} from './i18n/module-layouts';
import {
  AUTH_INTERNAL_EN_US,
  AUTH_INTERNAL_ES_ES,
  AUTH_INTERNAL_FR_FR,
  AUTH_INTERNAL_PT_BR
} from './i18n/auth-internal-i18n';
import {
  CONFIRM_DIALOG_EN_US,
  CONFIRM_DIALOG_ES_ES,
  CONFIRM_DIALOG_FR_FR,
  CONFIRM_DIALOG_PT_BR
} from './i18n/confirm-dialog-i18n';
import {
  LISTING_COMERCIAL_EN_US,
  LISTING_COMERCIAL_ES_ES,
  LISTING_COMERCIAL_FR_FR,
  LISTING_COMERCIAL_PT_BR
} from './i18n/listing-comercial-i18n';
import {
  LISTINGS_UI_EN_US,
  LISTINGS_UI_ES_ES,
  LISTINGS_UI_FR_FR,
  LISTINGS_UI_PT_BR
} from './i18n/listings-ui-i18n';
import {
  LISTINGS_COMMON_EN_US,
  LISTINGS_COMMON_ES_ES,
  LISTINGS_COMMON_FR_FR,
  LISTINGS_COMMON_PT_BR
} from './i18n/listings-common-i18n';
import {
  LISTINGS_MODULES_EN_US,
  LISTINGS_MODULES_ES_ES,
  LISTINGS_MODULES_FR_FR,
  LISTINGS_MODULES_PT_BR
} from './i18n/listings-modules-i18n';
import {
  LISTINGS_EXTENDED_EN_US,
  LISTINGS_EXTENDED_ES_ES,
  LISTINGS_EXTENDED_FR_FR,
  LISTINGS_EXTENDED_PT_BR
} from './i18n/listings-extended-i18n';
import {
  MENU_I18N_EN_US,
  MENU_I18N_ES_ES,
  MENU_I18N_FR_FR,
  MENU_I18N_PT_BR
} from './i18n/menu-i18n';
import {
  OS_FORM_EN_US,
  OS_FORM_ES_ES,
  OS_FORM_FR_FR,
  OS_FORM_PT_BR
} from './i18n/os-form-i18n';
import {
  OS_AUDITORIA_EN_US,
  OS_AUDITORIA_ES_ES,
  OS_AUDITORIA_FR_FR,
  OS_AUDITORIA_PT_BR
} from './i18n/os-auditoria-i18n';
import { OS_CONSULTA_ES_ES, OS_CONSULTA_FR_FR } from './i18n/os-consulta-i18n';
import {
  OS_TOASTS_EN_US,
  OS_TOASTS_ES_ES,
  OS_TOASTS_FR_FR,
  OS_TOASTS_PT_BR
} from './i18n/os-toasts-i18n';
import {
  OS_PRINT_EN_US,
  OS_PRINT_ES_ES,
  OS_PRINT_FR_FR,
  OS_PRINT_PT_BR
} from './i18n/os-print-i18n';
import {
  HOME_I18N_EN_US,
  HOME_I18N_ES_ES,
  HOME_I18N_FR_FR,
  HOME_I18N_PT_BR
} from './i18n/home-i18n';
import {
  SYSTEM_LABELS_EN_US,
  SYSTEM_LABELS_ES_ES,
  SYSTEM_LABELS_FR_FR,
  SYSTEM_LABELS_PT_BR
} from './i18n/system-labels-i18n';
import {
  SCREENS_MISC_EN_US,
  SCREENS_MISC_ES_ES,
  SCREENS_MISC_FR_FR,
  SCREENS_MISC_PT_BR
} from './i18n/screens-misc-i18n';
import {
  DEPLOYMENT_EN_US,
  DEPLOYMENT_ES_ES,
  DEPLOYMENT_FR_FR,
  DEPLOYMENT_PT_BR
} from './i18n/deployment-i18n';
import { canonFuncionalidadeCodigo } from '../auth/permissao.util';
import {
  looksLikeCorruptedMenuText,
  menuFuncCodigoVariants,
  slugifyMenuSection
} from './i18n/menu-i18n.util';
import {
  COMPONENT_TOASTS_EN_US,
  COMPONENT_TOASTS_ES_ES,
  COMPONENT_TOASTS_FR_FR,
  COMPONENT_TOASTS_PT_BR
} from './i18n/component-toasts-i18n';
import {
  RESOLVER_PENDENCIAS_EN_US,
  RESOLVER_PENDENCIAS_ES_ES,
  RESOLVER_PENDENCIAS_FR_FR,
  RESOLVER_PENDENCIAS_PT_BR
} from './i18n/resolver-pendencias-i18n';
import {
  LOCALE_I18N_EN_US,
  LOCALE_I18N_ES_ES,
  LOCALE_I18N_FR_FR,
  LOCALE_I18N_PT_BR
} from './i18n/locale-i18n';
import {
  TENANTS_I18N_EN_US,
  TENANTS_I18N_ES_ES,
  TENANTS_I18N_FR_FR,
  TENANTS_I18N_PT_BR
} from './i18n/tenants-i18n';
import {
  PLATFORM_OPS_I18N_EN_US,
  PLATFORM_OPS_I18N_ES_ES,
  PLATFORM_OPS_I18N_FR_FR,
  PLATFORM_OPS_I18N_PT_BR
} from './i18n/platform-ops-i18n';
import {
  ONBOARDING_PUBLIC_I18N_EN_US,
  ONBOARDING_PUBLIC_I18N_ES_ES,
  ONBOARDING_PUBLIC_I18N_FR_FR,
  ONBOARDING_PUBLIC_I18N_PT_BR
} from './i18n/onboarding-public-i18n';
import {
  TENANT_FEATURES_I18N_EN_US,
  TENANT_FEATURES_I18N_ES_ES,
  TENANT_FEATURES_I18N_FR_FR,
  TENANT_FEATURES_I18N_PT_BR
} from './i18n/tenant-features-i18n';
import {
  P1_I18N_EN_US,
  P1_I18N_ES_ES,
  P1_I18N_FR_FR,
  P1_I18N_PT_BR
} from './i18n/p1-i18n';
import {
  FOOTER_HEALTH_I18N_EN_US,
  FOOTER_HEALTH_I18N_ES_ES,
  FOOTER_HEALTH_I18N_FR_FR,
  FOOTER_HEALTH_I18N_PT_BR
} from './i18n/footer-health-i18n';
import {
  ESTOQUE_CONSULTA_QR_EN_US,
  ESTOQUE_CONSULTA_QR_ES_ES,
  ESTOQUE_CONSULTA_QR_FR_FR,
  ESTOQUE_CONSULTA_QR_PT_BR
} from './i18n/estoque-consulta-qr-i18n';
import { EXTERNO_PORTAL_ES_ES, EXTERNO_PORTAL_FR_FR } from './i18n/externo-portal-i18n';
import {
  EXTERNO_PROPOSTAS_EN_US,
  EXTERNO_PROPOSTAS_ES_ES,
  EXTERNO_PROPOSTAS_FR_FR,
  EXTERNO_PROPOSTAS_PT_BR
} from './i18n/externo-propostas-i18n';
import {
  EXTERNO_OS_DETAIL_I18N_EN_US,
  EXTERNO_OS_DETAIL_I18N_ES_ES,
  EXTERNO_OS_DETAIL_I18N_FR_FR,
  EXTERNO_OS_DETAIL_I18N_PT_BR
} from './i18n/externo-os-detail-i18n';
import {
  GO_LIVE_MIGRACAO_EN_US,
  GO_LIVE_MIGRACAO_ES_ES,
  GO_LIVE_MIGRACAO_FR_FR,
  GO_LIVE_MIGRACAO_PT_BR
} from './i18n/go-live-migracao-i18n';
import {
  DOSSIE_AUDITORIA_EN_US,
  DOSSIE_AUDITORIA_ES_ES,
  DOSSIE_AUDITORIA_FR_FR,
  DOSSIE_AUDITORIA_PT_BR
} from './i18n/dossie-auditoria-i18n';
import { OS_CRS_EN_US, OS_CRS_ES_ES, OS_CRS_FR_FR, OS_CRS_PT_BR } from './i18n/os-crs-i18n';
import {
  BLING_WIZARD_EN_US,
  BLING_WIZARD_ES_ES,
  BLING_WIZARD_FR_FR,
  BLING_WIZARD_PT_BR,
} from './i18n/integrations-bling-wizard-i18n';
import {
  WHATSAPP_WIZARD_EN_US,
  WHATSAPP_WIZARD_ES_ES,
  WHATSAPP_WIZARD_FR_FR,
  WHATSAPP_WIZARD_PT_BR,
} from './i18n/integrations-whatsapp-wizard-i18n';
import {
  ESTOQUE_RASTREIO_EN_US,
  ESTOQUE_RASTREIO_ES_ES,
  ESTOQUE_RASTREIO_FR_FR,
  ESTOQUE_RASTREIO_PT_BR
} from './i18n/estoque-rastreio-i18n';
import {
  AERO_STUDIO_EN_US,
  AERO_STUDIO_ES_ES,
  AERO_STUDIO_FR_FR,
  AERO_STUDIO_PT_BR
} from './i18n/aero-studio-i18n';
import {
  VITRINE_I18N_EN_US,
  VITRINE_I18N_ES_ES,
  VITRINE_I18N_FR_FR,
  VITRINE_I18N_PT_BR
} from './i18n/vitrine-i18n';
import {
  ESTOQUE_SCREENS_EN_US,
  ESTOQUE_SCREENS_ES_ES,
  ESTOQUE_SCREENS_FR_FR,
  ESTOQUE_SCREENS_PT_BR
} from './i18n/estoque-screens-i18n';
import {
  ESTOQUE_ETIQUETA_PRINT_EN_US,
  ESTOQUE_ETIQUETA_PRINT_ES_ES,
  ESTOQUE_ETIQUETA_PRINT_FR_FR,
  ESTOQUE_ETIQUETA_PRINT_PT_BR
} from './i18n/estoque-etiqueta-print-i18n';
import {
  ESTOQUE_CERTIFICADO_EN_US,
  ESTOQUE_CERTIFICADO_ES_ES,
  ESTOQUE_CERTIFICADO_FR_FR,
  ESTOQUE_CERTIFICADO_PT_BR
} from './i18n/estoque-certificado-i18n';
import {
  ESTOQUE_QUARENTENA_EN_US,
  ESTOQUE_QUARENTENA_ES_ES,
  ESTOQUE_QUARENTENA_FR_FR,
  ESTOQUE_QUARENTENA_PT_BR
} from './i18n/estoque-quarentena-i18n';
import {
  CONFORMIDADE_RETENCAO_EN_US,
  CONFORMIDADE_RETENCAO_ES_ES,
  CONFORMIDADE_RETENCAO_FR_FR,
  CONFORMIDADE_RETENCAO_PT_BR
} from './i18n/conformidade-retencao-i18n';
import {
  HANGAR_JOB_CARD_EN_US,
  HANGAR_JOB_CARD_ES_ES,
  HANGAR_JOB_CARD_FR_FR,
  HANGAR_JOB_CARD_PT_BR
} from './i18n/hangar-job-card-i18n';
import {
  TIPOS_SERVICO_EN_US,
  TIPOS_SERVICO_ES_ES,
  TIPOS_SERVICO_FR_FR,
  TIPOS_SERVICO_PT_BR
} from './i18n/tipos-servico-i18n';
import {
  FORMS_MISC_EN_US,
  FORMS_MISC_ES_ES,
  FORMS_MISC_FR_FR,
  FORMS_MISC_PT_BR
} from './i18n/forms-misc-i18n';
import {
  CAPACIDADE_QUADRO_EN_US,
  CAPACIDADE_QUADRO_ES_ES,
  CAPACIDADE_QUADRO_FR_FR,
  CAPACIDADE_QUADRO_PT_BR
} from './i18n/capacidade-quadro-i18n';
import {
  SUPORTE_SCREENS_EN_US,
  SUPORTE_SCREENS_ES_ES,
  SUPORTE_SCREENS_FR_FR,
  SUPORTE_SCREENS_PT_BR
} from './i18n/suporte-screens-i18n';
import {
  AERO_DIRETRIZ_EN_US,
  AERO_DIRETRIZ_ES_ES,
  AERO_DIRETRIZ_FR_FR,
  AERO_DIRETRIZ_PT_BR
} from './i18n/aero-diretriz-i18n';
import {
  CONFORMIDADE_HABILITACAO_EN_US,
  CONFORMIDADE_HABILITACAO_ES_ES,
  CONFORMIDADE_HABILITACAO_FR_FR,
  CONFORMIDADE_HABILITACAO_PT_BR
} from './i18n/conformidade-habilitacao-i18n';
import {
  CONFORMIDADE_SGQ_EN_US,
  CONFORMIDADE_SGQ_ES_ES,
  CONFORMIDADE_SGQ_FR_FR,
  CONFORMIDADE_SGQ_PT_BR
} from './i18n/conformidade-sgq-i18n';
import {
  THERMAL_PRINT_SETUP_EN_US,
  THERMAL_PRINT_SETUP_ES_ES,
  THERMAL_PRINT_SETUP_FR_FR,
  THERMAL_PRINT_SETUP_PT_BR
} from './i18n/thermal-print-setup-i18n';
import {
  UI_PREMIUM_EN_US,
  UI_PREMIUM_ES_ES,
  UI_PREMIUM_FR_FR,
  UI_PREMIUM_PT_BR
} from './i18n/ui-premium-i18n';
import {
  BACKUP_CONFIG_EN_US,
  BACKUP_CONFIG_ES_ES,
  BACKUP_CONFIG_FR_FR,
  BACKUP_CONFIG_PT_BR
} from './i18n/backup-config-i18n';
import {
  CHAT_I18N_EN_US,
  CHAT_I18N_ES_ES,
  CHAT_I18N_FR_FR,
  CHAT_I18N_PT_BR
} from './i18n/chat-i18n';
import {
  API_BACKEND_I18N_EN_US,
  API_BACKEND_I18N_ES_ES,
  API_BACKEND_I18N_FR_FR,
  API_BACKEND_I18N_PT_BR
} from './i18n/api-backend-i18n';
import {
  PROPOSTA_API_EN_US,
  PROPOSTA_API_ES_ES,
  PROPOSTA_API_FR_FR,
  PROPOSTA_API_PT_BR
} from './i18n/proposta-api-i18n';
import {
  PAGE_HELP_I18N_EN_US,
  PAGE_HELP_I18N_ES_ES,
  PAGE_HELP_I18N_FR_FR,
  PAGE_HELP_I18N_PT_BR
} from './i18n/page-help-i18n';
import {
  FCU_ASSEMBLY_SHELL_EN_US,
  FCU_ASSEMBLY_SHELL_ES_ES,
  FCU_ASSEMBLY_SHELL_FR_FR,
  FCU_ASSEMBLY_SHELL_PT_BR
} from './i18n/fcu-assembly-shell-i18n';
import {
  ONBOARDING_I18N_EN_US,
  ONBOARDING_I18N_ES_ES,
  ONBOARDING_I18N_FR_FR,
  ONBOARDING_I18N_PT_BR
} from './i18n/onboarding-i18n';
import {
  CONFIGURACAO_EMPRESA_EN_US,
  CONFIGURACAO_EMPRESA_ES_ES,
  CONFIGURACAO_EMPRESA_FR_FR,
  CONFIGURACAO_EMPRESA_PT_BR
} from './i18n/configuracao-empresa-i18n';

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private appearanceService = inject(AppearancePreferencesService);
  
  private currentLanguage$ = new BehaviorSubject<string>('pt-BR');
  
  // Dicionários de tradução
  private translations: { [locale: string]: TranslationDictionary } = {
    'pt-BR': {
      // Configurações
      'settings.title': 'Configurações',
      'settings.description': 'Gerencie as configurações do sistema',
      'settings.saveAll': 'Salvar Todas',
      'settings.restoreDefaults': 'Restaurar Padrões',
      'settings.saved': 'Configurações Salvas',
      'settings.savedDetail': 'Todas as configurações foram salvas com sucesso',
      'settings.saveAllEmpresaFailed':
        'As configurações do sistema foram salvas, mas não foi possível salvar os dados da empresa.',
      'settings.restored': 'Padrões Restaurados',
      'settings.restoredDetail': 'Configurações restauradas para os valores padrão',
      'settings.nav.aria': 'Ir para seção de configurações',
      'settings.section.bling.badge': 'Integração ERP',
      'settings.advanced.title': 'Configurações avançadas',
      'settings.advanced.description': 'Opções técnicas para administradores',
      'settings.advanced.logsDetailed': 'Logs detalhados',
      'settings.advanced.logsDetailedHint': 'Habilita logs detalhados para depuração',
      'settings.advanced.autoBackup': 'Backup automático',
      'settings.advanced.autoBackupHint': 'Realiza backup automático dos dados',
      'settings.advanced.emailNotifications': 'Notificações por e-mail',
      'settings.advanced.emailNotificationsHint': 'Envia notificações por e-mail',
      'settings.emailTest.title': 'Teste de e-mail (admin)',
      'settings.emailTest.hint': 'Envia um e-mail de teste para validar o SMTP em produção.',
      'settings.emailTest.placeholder': 'destino@empresa.com',
      'settings.emailTest.btn': 'Enviar teste',
      'settings.emailTest.ok': 'E-mail de teste enviado.',
      'settings.emailTest.err': 'Falha ao enviar e-mail de teste.',
      'settings.emailTest.forbidden': 'Apenas administradores podem testar e-mail.',
      
      // Aparência
      'appearance.title': 'Aparência e Interface',
      'appearance.description': 'Personalize a aparência e comportamento da interface',
      'appearance.theme': 'Tema',
      'appearance.theme.description': 'Escolha o tema visual da aplicação',
      'appearance.theme.light': 'Claro',
      'appearance.theme.dark': 'Escuro',
      'appearance.theme.auto': 'Automático (segue o sistema)',
      'appearance.skin': 'Aparência (skin)',
      'appearance.skin.description':
        'Tema completo da interface (componentes Prime e área principal). Salvo só neste navegador.',
      'appearance.language': 'Idioma Padrão do Sistema',
      'appearance.language.description': 'Idioma padrão da interface',
      'settings.locale.ptBR': 'Português (pt-BR)',
      'settings.locale.enUS': 'English (en-US)',
      'settings.locale.esES': 'Español (es-ES)',
      'settings.locale.frFR': 'Français (fr-FR)',
      'appearance.density': 'Densidade da Interface',
      'appearance.density.description': 'Espaçamento entre elementos da interface',
      'appearance.density.compact': 'Compacto',
      'appearance.density.normal': 'Normal',
      'appearance.density.spacious': 'Espaçoso',
      'appearance.fontSize': 'Tamanho da Fonte Padrão',
      'appearance.fontSize.description': 'Tamanho padrão da fonte na interface',
      'appearance.fontSize.small': 'Pequeno',
      'appearance.fontSize.medium': 'Médio',
      'appearance.fontSize.large': 'Grande',
      'appearance.animations': 'Animações',
      'appearance.animations.description': 'Habilita ou desabilita animações na interface',
      'appearance.animations.enabled': 'Habilitado',
      'appearance.animations.disabled': 'Desabilitado',
      
      // Sistema
      'system.title': 'Sistema',
      'system.description': 'Configurações gerais do sistema',
      'system.name': 'Nome do Sistema',
      'system.name.description': 'Nome exibido no sistema',
      'system.version': 'Versão do Sistema',
      'system.version.description': 'Versão atual do sistema',
      'system.sessionTimeout': 'Timeout de Sessão (minutos)',
      'system.sessionTimeout.description': 'Tempo limite para sessão inativa',
      'system.maintenanceMode': 'Modo de Manutenção',
      'system.maintenanceMode.description': 'Ativa o modo de manutenção do sistema',
      
      // Segurança
      'security.title': 'Segurança',
      'security.description': 'Configurações de segurança e acesso',
      'security.minPasswordLength': 'Tamanho Mínimo da Senha',
      'security.minPasswordLength.description': 'Número mínimo de caracteres para senha',
      'security.loginAttempts': 'Tentativas de Login',
      'security.loginAttempts.description': 'Número máximo de tentativas de login',
      'security.twoFactor': 'Autenticação de Dois Fatores',
      'security.twoFactor.description': 'Habilita autenticação de dois fatores',
      'security.logLevel': 'Nível de Log',
      'security.logLevel.description': 'Nível de detalhamento dos logs',
      'security.logLevel.debug': 'Depuração (DEBUG)',
      'security.logLevel.info': 'Informação (INFO)',
      'security.logLevel.warn': 'Aviso (WARN)',
      'security.logLevel.error': 'Erro (ERROR)',
      
      // Notificações
      'notifications.title': 'Notificações',
      'notifications.description': 'Configurações de notificações',
      'notifications.smtpServer': 'Servidor SMTP',
      'notifications.smtpServer.description': 'Servidor de e-mail para notificações',
      'notifications.smtpPort': 'Porta SMTP',
      'notifications.smtpPort.description': 'Porta do servidor SMTP',
      'notifications.push': 'Notificações Push',
      'notifications.push.description': 'Habilita notificações push no navegador',
      
      // Backup
      'backup.title': 'Backup',
      'backup.description': 'Configurações de backup e restauração',
      'backup.frequency': 'Frequência do Backup',
      'backup.frequency.description': 'Frequência dos backups automáticos',
      'backup.frequency.daily': 'Diário',
      'backup.frequency.weekly': 'Semanal',
      'backup.frequency.monthly': 'Mensal',
      'backup.retention': 'Retenção de Backup (dias)',
      'backup.retention.description': 'Número de dias para manter backups',
      'backup.encrypted': 'Backup Criptografado',
      'backup.encrypted.description': 'Criptografa os arquivos de backup',
      
      // Empresa / white-label
      'empresa.panel.title': 'Empresa e marca (white-label)',
      'empresa.panel.intro':
        'Os mesmos dados do assistente inicial. Alterações aqui atualizam a API pública de branding, e-mails e documentos comerciais após salvar. O envio de logo/wordmark grava arquivos no servidor e define a URL pública {{path}}.',
      'empresa.panel.readOnly':
        'Sem permissão de edição. Peça a um usuário com perfil administrativo ou acesso a Configurações.',
      'integrations.bling.title': 'Integração Bling',
      'integrations.bling.intro':
        'Conecte a conta Bling desta empresa para importar contatos nas propostas comerciais. A autorização é feita na Bling; os tokens ficam armazenados de forma segura por empresa.',
      'integrations.bling.platformDisabled': 'Integração Bling desativada na plataforma (contate o suporte Aero Suite).',
      'integrations.bling.oauthNotConfigured': 'OAuth não configurado no servidor. Defina CLIENT_ID, CLIENT_SECRET e REDIRECT_URI.',
      'integrations.bling.notConnected': 'Nenhuma conta Bling conectada para esta empresa.',
      'integrations.bling.loadFailed': 'Não foi possível carregar o status da integração. Verifique se a API está acessível.',
      'integrations.bling.retryBtn': 'Tentar novamente',
      'integrations.bling.connected': 'Conta Bling conectada',
      'integrations.bling.connectedAt': 'Conectado em {{date}}',
      'integrations.bling.legacyToken': 'Token legado global ativo — recomendamos migrar para OAuth por empresa.',
      'integrations.bling.connectBtn': 'Conectar Bling',
      'integrations.bling.connection.title': 'Conexão',
      'integrations.bling.connection.desc': 'Autorize a conta Bling, teste a API e gerencie tokens por empresa.',
      'integrations.bling.testBtn': 'Testar conexão',
      'integrations.bling.disconnectBtn': 'Desconectar',
      'integrations.bling.disconnectConfirm': 'Desconectar a conta Bling desta empresa? A importação de contatos deixará de funcionar até reconectar.',
      'integrations.bling.testOk': 'Conexão com a API Bling verificada.',
      'integrations.bling.testFail': 'Falha ao verificar conexão: {{message}}',
      'integrations.bling.toast.connected': 'Conta Bling conectada com sucesso.',
      'integrations.bling.toast.connectError': 'Não foi possível conectar à Bling: {{message}}',
      'integrations.bling.toast.disconnected': 'Conta Bling desconectada.',
      'integrations.bling.toast.disconnectError': 'Erro ao desconectar Bling.',
      'integrations.bling.readOnly': 'Apenas perfil administrativo pode gerenciar esta integração.',
      'integrations.bling.syncTitle': 'Sincronização',
      'integrations.bling.syncDesc': 'Webhooks, jobs na fila e clientes vinculados.',
      'integrations.bling.syncMapped': '{{count}} clientes vinculados à Bling',
      'integrations.bling.syncPedidos': '{{count}} pedidos vinculados a propostas',
      'integrations.bling.syncNfe': '{{count}} NF-e registradas',
      'integrations.bling.syncPending': '{{count}} jobs na fila',
      'integrations.bling.syncDead': '{{count}} jobs com falha permanente',
      'integrations.bling.syncDeadShort': '{{count}} falha(s)',
      'integrations.bling.syncLastWebhook': 'Último webhook: {{date}}',
      'integrations.bling.deadJobs.title': 'Jobs com falha permanente',
      'integrations.bling.deadJobs.intro': 'Estes eventos esgotaram as tentativas automáticas. Reprocesse após corrigir a conexão ou descarte se não forem mais necessários.',
      'integrations.bling.deadJobs.eventType': 'Evento: {{type}}',
      'integrations.bling.deadJobs.attempts': '{{current}}/{{max}} tentativas',
      'integrations.bling.deadJobs.reprocessBtn': 'Reprocessar',
      'integrations.bling.deadJobs.discardBtn': 'Descartar',
      'integrations.bling.deadJobs.reprocessAllBtn': 'Reprocessar todos',
      'integrations.bling.deadJobs.discardAllBtn': 'Descartar todos',
      'integrations.bling.deadJobs.discardConfirm': 'Descartar este job? O evento não será processado automaticamente.',
      'integrations.bling.deadJobs.discardAllConfirm': 'Descartar todos os jobs com falha permanente desta empresa?',
      'integrations.bling.deadJobs.reprocessOk': 'Job(s) reenfileirado(s) para processamento.',
      'integrations.bling.deadJobs.discardOk': 'Job(s) removido(s).',
      'integrations.bling.deadJobs.error': 'Falha na operação: {{message}}',
      'integrations.bling.webhookHint': 'Configure na Bling a URL POST /api/integracoes/bling/webhook (ou /webhook/t/{codigo-tenant} se companyId ainda não estiver mapeado).',
      'integrations.bling.scopesTitle': 'Permissões da API (escopos)',
      'integrations.bling.bootstrapBtn': 'Preparar homologação',
      'integrations.bling.bootstrapOk': 'Dados de homologação criados (contato + fiscal). Importe o cliente em uma proposta.',
      'integrations.bling.bootstrapFail': 'Bootstrap falhou: {{message}}',
      'integrations.bling.webhookHomologBtn': 'Testar webhook',
      'integrations.bling.webhookHomologOk': 'Webhook validado. Configure na Bling: {{url}}',
      'integrations.bling.webhookHomologFail': 'Teste de webhook falhou: {{message}}',
      'integrations.bling.fiscal.title': 'Configuração fiscal',
      'integrations.bling.fiscal.desc': 'CFOP, alíquotas, certificado digital e automações de NF-e.',
      'integrations.bling.fiscal.intro': 'CFOP, série e alíquotas usados nos pedidos e NF-e enviados à Bling. O certificado A1/A3 fica cifrado nesta empresa; instale o mesmo arquivo no painel Bling para autorização SEFAZ.',
      'integrations.bling.fiscal.cfop': 'CFOP padrão',
      'integrations.bling.fiscal.serie': 'Série NF-e',
      'integrations.bling.fiscal.natureza': 'Natureza da operação',
      'integrations.bling.fiscal.ncm': 'NCM padrão',
      'integrations.bling.fiscal.icms': 'Alíquota ICMS',
      'integrations.bling.fiscal.pis': 'Alíquota PIS',
      'integrations.bling.fiscal.cofins': 'Alíquota COFINS',
      'integrations.bling.fiscal.autoOs': 'Gerar OS automaticamente ao criar/vincular pedido Bling',
      'integrations.bling.fiscal.autoNfe': 'Emitir NF-e automaticamente ao concluir a OS (após pedido Bling)',
      'integrations.bling.fiscal.saveBtn': 'Salvar configuração fiscal',
      'integrations.bling.fiscal.saved': 'Configuração fiscal salva.',
      'integrations.bling.fiscal.saveError': 'Falha ao salvar configuração fiscal.',
      'integrations.bling.fiscal.certTitle': 'Certificado digital (A1 / A3)',
      'integrations.bling.fiscal.certHint': 'Envie o arquivo .pfx/.p12 e a senha. A emissão na Bling exige o mesmo certificado em Preferências > Certificado digital no ERP Bling.',
      'integrations.bling.fiscal.certConfigured': 'Certificado configurado',
      'integrations.bling.fiscal.certValidUntil': 'válido até {{date}}',
      'integrations.bling.fiscal.certTipo': 'Tipo',
      'integrations.bling.fiscal.certPassword': 'Senha do certificado',
      'integrations.bling.fiscal.certChoose': 'Escolher arquivo',
      'integrations.bling.fiscal.certUploadBtn': 'Enviar certificado',
      'integrations.bling.fiscal.certRemoveBtn': 'Remover',
      'integrations.bling.fiscal.certRemoveConfirm': 'Remover o certificado digital desta empresa?',
      'integrations.bling.fiscal.certRequired': 'Selecione o arquivo e informe a senha do certificado.',
      'integrations.bling.fiscal.certOk': 'Certificado armazenado com segurança.',
      'integrations.bling.fiscal.certError': 'Falha ao processar certificado.',
      'integrations.bling.fiscal.certRemoved': 'Certificado removido.',
      'empresa.accordion.identity': 'Identidade',
      'empresa.accordion.contacts': 'Contatos',
      'empresa.accordion.fiscal': 'Dados fiscais e extras',
      'empresa.accordion.lgpd': 'Termos e privacidade (LGPD)',
      'empresa.lgpd.intro': 'Textos legais públicos (/termos e /privacidade). Com textos personalizados ativos, substituem os padrão da plataforma para a sua organização.',
      'empresa.lgpd.useCustom': 'Usar textos legais personalizados desta organização',
      'empresa.lgpd.termos': 'Termos de uso',
      'empresa.lgpd.termosPh': 'Conteúdo em texto simples (suporta quebras de linha)…',
      'empresa.lgpd.privacidade': 'Política de privacidade',
      'empresa.lgpd.privacidadePh': 'Conteúdo em texto simples…',
      'empresa.lgpd.defaultHint': 'Sem personalização, os visitantes veem os textos padrão da plataforma.',
      'empresa.field.displayName': 'Nome comercial',
      'empresa.field.tagline': 'Tagline',
      'empresa.field.emailSubjectSuffix': 'Sufixo assunto e-mail (opcional)',
      'empresa.field.browserTitleSuffix': 'Sufixo título do navegador',
      'empresa.field.copyrightEntity': 'Entidade © (opcional)',
      'empresa.field.logoUrl': 'Logo (URL ou envio)',
      'empresa.field.wordmark': 'Wordmark',
      'empresa.field.primaryColor': 'Cor primária da marca',
      'empresa.field.primaryColor.hint': 'Usada em login, propostas comerciais, impressão de OS e e-mails.',
      'empresa.field.primaryColor.ph': '#0ea5e9',
      'empresa.field.logoPlaceholder': '/api/public/empresa-asset/logo ou assets/…',
      'empresa.upload.logo': 'Enviar imagem do logo',
      'empresa.upload.wordmark': 'Enviar wordmark',
      'empresa.preview.logoAlt': 'Pré-visualização logo',
      'empresa.preview.wordmarkAlt': 'Pré-visualização wordmark',
      'empresa.field.supportEmail': 'E-mail de contato da empresa',
      'empresa.field.supportEmail.hint':
        'Coloque o e-mail oficial de contato da sua empresa (ou da organização que está configurando) — o que você colocaria no rodapé de uma proposta ou carta comercial. Não é o suporte da plataforma Aero Suite.',
      'empresa.field.telefone': 'Telefone',
      'empresa.field.siteUrl': 'Site (opcional)',
      'empresa.field.razaoSocial': 'Razão social',
      'empresa.field.cnpj': 'CNPJ',
      'empresa.field.inscricaoEstadual': 'Inscrição estadual',
      'empresa.field.inscricaoMunicipal': 'Inscrição municipal',
      'empresa.field.emailNfe': 'E-mail NF-e (opcional)',
      'empresa.field.enderecoLogradouro': 'Logradouro',
      'empresa.field.enderecoNumero': 'Número',
      'empresa.field.enderecoComplemento': 'Complemento',
      'empresa.field.enderecoBairro': 'Bairro',
      'empresa.field.cidade': 'Cidade',
      'empresa.field.uf': 'UF',
      'empresa.field.cep': 'CEP',
      'empresa.confirmPublish': 'Confirmo dados para publicar a marca em todo o sistema',
      'empresa.action.saveDraft': 'Salvar rascunho',
      'empresa.action.publish': 'Concluir publicação',
      'empresa.action.saveChanges': 'Salvar alterações',
      'empresa.toast.loadError': 'Não foi possível carregar a configuração da empresa.',
      'empresa.toast.errorSummary': 'Erro',
      'empresa.toast.saveError': 'Não foi possível salvar. Verifique os campos obrigatórios.',
      'empresa.toast.savedPublish': 'Marca publicada.',
      'empresa.toast.savedOk': 'Salvo',
      'empresa.toast.savedDraft': 'Alterações salvas.',
      'empresa.toast.uploadLogoOk': 'Arquivo enviado.',
      'empresa.toast.uploadLogoErr': 'Falha no envio.',
      'empresa.toast.uploadWmOk': 'Arquivo enviado.',
      'empresa.toast.uploadWmErr': 'Falha no envio.',
      'empresa.toast.summaryLogo': 'Logo',
      'empresa.toast.summaryWm': 'Wordmark',

      // Idioma / shell
      'language.switcher.aria': 'Selecionar idioma da interface',
      'language.name.pt-BR': 'Português (Brasil)',
      'language.name.en-US': 'English (US)',
      'language.name.es-ES': 'Español',
      'language.name.fr-FR': 'Français',

      'login.email': 'E-mail',
      'login.password': 'Senha',
      'login.placeholderEmail': 'Digite seu e-mail',
      'login.placeholderPassword': 'Digite sua senha',
      'login.forgotPassword': 'Esqueci minha senha',
      'login.submit': 'Entrar',
      'login.tagline': 'Plataforma de gestão para oficinas MRO',
      'login.trialCreated': 'Conta trial criada com sucesso. Entre com o e-mail e a senha que você acabou de cadastrar.',
      'login.copyrightReserved': 'Todos os direitos reservados',
      'login.error.timeout': 'Tempo esgotado ao entrar. Verifique sua conexão e tente novamente.',
      'login.error.connection': 'Erro de conexão. Verifique se o backend está em execução e tente novamente.',
      'login.error.invalidCredentials': 'Usuário não encontrado ou credenciais inválidas.',
      'login.error.serviceUnavailable': 'Serviço temporariamente indisponível. Tente novamente em instantes.',
      'login.error.serverError': 'Erro interno do servidor. Tente novamente mais tarde.',
      'login.error.generic': 'Erro ao entrar. Verifique suas credenciais.',
      'login.tenant': 'Organização',
      'login.placeholderTenant': 'Selecione a organização',
      'login.placeholderTenantCode': 'Código da organização (ex.: default)',
      'login.tenantHintMulti': 'Este e-mail pertence a mais de uma organização. Escolha pelo código e data de criação.',
      'login.tenantOptionLabel': '{{nome}} · {{codigo}} · {{criadoEm}} · #{{id}}',
      'login.tenantOptionLabelNoDate': '{{nome}} · {{codigo}} · #{{id}}',
      'login.error.tenantRequired': 'Informe o código da organização para este e-mail.',
      'login.error.tenantNotFound': 'Código de organização inválido.',
      'login.mfaCode': 'Código do autenticador',
      'login.mfaCodePlaceholder': '6 dígitos',
      'login.mfaHint': 'Abra seu aplicativo autenticador (Google Authenticator, Authy, etc.).',
      'login.error.mfaRequired': 'Informe o código de autenticação de dois fatores.',
      'login.error.mfaInvalid': 'Código de autenticação inválido ou expirado.',
      'mfaSetup.title': 'Configurar autenticação de dois fatores',
      'mfaSetup.subtitle': 'Escaneie o QR code ou copie o segredo no aplicativo autenticador.',
      'mfaSetup.secretLabel': 'Segredo (copiar manualmente)',
      'mfaSetup.codeLabel': 'Código de verificação',
      'mfaSetup.submit': 'Ativar e entrar',
      'mfaSetup.error.generic': 'Não foi possível concluir o cadastro MFA.',

      'externo.portalSubtitle': 'Portal do Cliente',
      'externo.menu': 'Menu',
      'externo.client': 'Cliente',

      'layout.menu': 'Menu',
      'layout.expandSidebar': 'Expandir menu',
      'layout.collapseSidebar': 'Colapsar menu',
      'layout.closeMenu': 'Fechar menu',
      'layout.home': 'Home',
      'layout.logout': 'Sair',
      'layout.user': 'Usuário',
      'layout.profile': 'Meu Perfil',
      'layout.interfaceLanguage': 'Idioma da interface',
      'layout.billing': 'Faturação e plano',
      'layout.privacyData': 'Privacidade e dados',
      'layout.changePhoto': 'Alterar Foto',
      'layout.navLoading': 'Carregando menu...',
      'layout.navPrincipal': 'Principal',
      'layout.navFlightDeck': 'Painel de voo',
      'layout.navFlightDeckHint': 'Módulos e rotas do Aero Suite',
      'layout.navSearch': 'Buscar módulo…',
      'layout.navSearchClear': 'Limpar busca',
      'layout.navModuleCount': '{{count}} itens',
      'layout.navModuleCountOne': '{{count}} item',
      'layout.navNoResults': 'Nenhum módulo encontrado.',
      'layout.clockAlt': 'Relógio',
      'layout.brandLogoAlt': 'Logotipo da empresa',
      'layout.routeLoading': 'Carregando página…',

      'layout.nav.dashboard': 'Dashboard',
      'layout.nav.dashboardTooltip': 'Página inicial',
      'layout.nav.settings': 'Configurações',
      'layout.nav.settingsTooltip': 'Configurações do sistema',
      'layout.nav.osPendenciasTrocas': 'OS — pendências trocas',
      'layout.nav.osPendenciasTrocasTooltip':
        'Pendências de pagamento (Solicitação de Troca Eventual na OS)',

      'layout.troca.header.solicitacao': 'Nova Solicitação de Troca Eventual',
      'layout.troca.header.deficit': 'Atenção — Solicitação de Troca Eventual e estoque',
      'layout.troca.deficit.lead':
        'Foi registrada uma Solicitação de Troca Eventual em uma OS e um ou mais produtos estão sem estoque suficiente (disponível menor que o solicitado).',
      'layout.troca.deficit.productsTitle': 'Produtos em déficit:',
      'layout.troca.deficit.confirmFoot':
        'Confirme que está ciente para deixar de receber este aviso. O registro da OS permanece salvo.',
      'layout.troca.solicitacao.ribbon': 'NOVO EVENTO',
      'layout.troca.solicitacao.title': 'Solicitação de Troca Eventual',
      'layout.troca.solicitacao.sub':
        'Uma nova solicitação foi aberta nesta OS e requer a atenção do Suprimento para apreciação dos produtos discriminados abaixo.',
      'layout.troca.solicitacao.listTitle': 'Produtos na solicitação',
      'layout.troca.solicitacao.foot':
        'Confirme que está ciente para ocultar este alerta. A OS já foi salva no sistema.',
      'layout.troca.btn.supply': 'Entendi — Suprimento analisará',
      'layout.troca.btn.ack': 'Estou ciente',
      'layout.troca.th.produto': 'Produto',
      'layout.troca.th.pn': 'P/N',
      'layout.troca.th.solicitado': 'Solicitado',
      'layout.troca.th.disponivel': 'Disponível',
      'layout.troca.th.deficit': 'Déficit',
      'layout.troca.th.qtd': 'Qtd',
      'layout.troca.th.status': 'Status',
      'layout.troca.th.descricao': 'Descrição',
      'layout.troca.label.os': 'OS',
      'layout.troca.label.cliente': 'Cliente',
      'layout.troca.status.pending': 'Pendente',
      'layout.troca.status.paid': 'Pago',
      'layout.troca.status.refused': 'Recusado',

      'layout.photo.header': 'Alterar Foto de Perfil',
      'layout.photo.previewNew': 'Pré-visualização',
      'layout.photo.current': 'Foto atual',
      'layout.photo.previewAlt': 'Pré-visualização da nova foto',
      'layout.photo.zoomAlt': 'Foto de perfil ampliada',
      'layout.photo.avatarAlt': 'Foto de perfil do usuário',
      'layout.photo.removeSelection': 'Remover seleção',
      'layout.photo.dropTitle': 'Arraste uma imagem para cá',
      'layout.photo.dropSubtitle': 'ou clique para escolher do computador',
      'layout.photo.hint': 'Formatos aceitos: JPG, PNG ou GIF até 5MB',
      'layout.photo.close': 'Fechar',
      'layout.photo.save': 'Salvar Foto',
      'layout.photo.error.notImage': 'Selecione um arquivo de imagem (JPG, PNG ou GIF).',
      'layout.photo.error.tooLarge': 'A imagem excede o limite de 5MB ({{sizeMb}} MB).',

      'layout.toast.error': 'Erro',
      'layout.toast.success': 'Sucesso',
      'layout.toast.warn': 'Atenção',
      'layout.toast.ackFail': 'Não foi possível registrar que você está ciente. Tente novamente.',
      'layout.toast.invalidFile': 'Arquivo inválido',
      'layout.toast.selectPhotoFirst': 'Por favor, selecione uma foto antes de salvar.',
      'layout.toast.userUnknown': 'Usuário não identificado. Por favor, faça login novamente.',
      'layout.toast.photoOk': 'Foto atualizada com sucesso!',
      'layout.toast.uploadGeneric': 'Erro ao enviar foto. Tente novamente.',
      'layout.toast.serverHtml':
        'O servidor retornou uma página de erro. Verifique se o backend está rodando corretamente.',
      'layout.toast.endpoint404': 'Endpoint não encontrado. Verifique se o backend está configurado corretamente.',
      'layout.toast.noConnection': 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
      'layout.toast.fileTooLarge':
        'O servidor recusou o envio por limite de tamanho (413). Atualize o deploy do frontend ou use uma imagem mais pequena.',

      'notifications.bell.tooltip': 'Notificações',
      'notifications.bell.title': 'Notificações',
      'notifications.bell.markAllRead': 'Marcar todas como lidas',
      'notifications.bell.empty': 'Nenhuma notificação',
      'notifications.bell.viewAll': 'Ver todas as notificações',
      'notifications.relative.now': 'Agora mesmo',
      'notifications.relative.minutes': 'Há {{n}} min',
      'notifications.relative.hours': 'Há {{n}}h',
      'notifications.relative.days': 'Há {{n}} dias',

      'chat.notification.newMessage': 'Nova mensagem',

      'footer.meta': 'Operação e conformidade em tempo real',
      'footer.statusOnline': 'Sistema online',
      'footer.statusDegraded': 'Serviços indisponíveis',
      'footer.navAria': 'Rodapé',
      'footer.preferences': 'Preferências',
      'footer.support': 'Suporte',
      'footer.home': 'Início',

      'estoque.item.loadDetailError': 'Erro ao carregar detalhes',
      'estoque.item.minMaxUpdated': 'Estoque mínimo/ideal atualizado.',
      'estoque.item.saveError': 'Erro ao salvar.',
      'estoque.item.pnRequired': 'Part Number é obrigatório.',
      'estoque.item.qtyInvalid': 'Quantidade inválida.',
      'estoque.item.updateOk': 'Item atualizado com sucesso.',
      'estoque.item.updateFail': 'Falha ao atualizar item.',
      'estoque.item.entryDeleted': 'Entrada excluída com sucesso.',
      'estoque.item.deleteEntryFail': 'Falha ao excluir entrada.',
      'estoque.item.osInvalid': 'OS inválida.',
      'estoque.item.exitQtyInvalid': 'Quantidade de saída inválida.',
      'estoque.item.exitOk': 'Saída registrada com sucesso.',
      'estoque.item.exitFail': 'Falha ao registrar saída.',
      
      // Comum
      'common.toast.error': 'Erro',
      'common.toast.success': 'Sucesso',
      'common.toast.warn': 'Atenção',
      'common.toast.info': 'Informação',
      'common.required': '*',
      'common.enabled': 'Habilitado',
      'common.disabled': 'Desabilitado'
    },
    'en-US': {
      // Settings
      'settings.title': 'Settings',
      'settings.description': 'Manage system settings',
      'settings.saveAll': 'Save All',
      'settings.restoreDefaults': 'Restore Defaults',
      'settings.saved': 'Settings Saved',
      'settings.savedDetail': 'All settings have been saved successfully',
      'settings.saveAllEmpresaFailed':
        'System settings were saved, but company data could not be saved.',
      'settings.restored': 'Defaults Restored',
      'settings.restoredDetail': 'Settings restored to default values',
      'settings.nav.aria': 'Jump to settings section',
      'settings.section.bling.badge': 'ERP integration',
      'settings.advanced.title': 'Advanced settings',
      'settings.advanced.description': 'Technical options for administrators',
      'settings.advanced.logsDetailed': 'Detailed logs',
      'settings.advanced.logsDetailedHint': 'Enables detailed logs for debugging',
      'settings.advanced.autoBackup': 'Automatic backup',
      'settings.advanced.autoBackupHint': 'Performs automatic data backup',
      'settings.advanced.emailNotifications': 'Email notifications',
      'settings.advanced.emailNotificationsHint': 'Sends notifications by email',
      'settings.emailTest.title': 'Email test (admin)',
      'settings.emailTest.hint': 'Sends a test email to validate SMTP in production.',
      'settings.emailTest.placeholder': 'recipient@company.com',
      'settings.emailTest.btn': 'Send test',
      'settings.emailTest.ok': 'Test email sent.',
      'settings.emailTest.err': 'Failed to send test email.',
      'settings.emailTest.forbidden': 'Only administrators can test email.',
      
      // Appearance
      'appearance.title': 'Appearance and Interface',
      'appearance.description': 'Customize the appearance and behavior of the interface',
      'appearance.theme': 'Theme',
      'appearance.theme.description': 'Choose the visual theme of the application',
      'appearance.theme.light': 'Light',
      'appearance.theme.dark': 'Dark',
      'appearance.theme.auto': 'Auto (follows system)',
      'appearance.skin': 'Appearance (skin)',
      'appearance.skin.description':
        'Full interface theme (Prime components and main area). Saved only in this browser.',
      'appearance.language': 'Default System Language',
      'appearance.language.description': 'Default interface language',
      'settings.locale.ptBR': 'Português (pt-BR)',
      'settings.locale.enUS': 'English (en-US)',
      'settings.locale.esES': 'Español (es-ES)',
      'settings.locale.frFR': 'Français (fr-FR)',
      'appearance.density': 'Interface Density',
      'appearance.density.description': 'Spacing between interface elements',
      'appearance.density.compact': 'Compact',
      'appearance.density.normal': 'Normal',
      'appearance.density.spacious': 'Spacious',
      'appearance.fontSize': 'Default Font Size',
      'appearance.fontSize.description': 'Default font size in the interface',
      'appearance.fontSize.small': 'Small',
      'appearance.fontSize.medium': 'Medium',
      'appearance.fontSize.large': 'Large',
      'appearance.animations': 'Animations',
      'appearance.animations.description': 'Enable or disable interface animations',
      'appearance.animations.enabled': 'Enabled',
      'appearance.animations.disabled': 'Disabled',
      
      // System
      'system.title': 'System',
      'system.description': 'General system settings',
      'system.name': 'System Name',
      'system.name.description': 'Name displayed in the system',
      'system.version': 'System Version',
      'system.version.description': 'Current system version',
      'system.sessionTimeout': 'Session Timeout (minutes)',
      'system.sessionTimeout.description': 'Time limit for inactive session',
      'system.maintenanceMode': 'Maintenance Mode',
      'system.maintenanceMode.description': 'Activates system maintenance mode',
      
      // Security
      'security.title': 'Security',
      'security.description': 'Security and access settings',
      'security.minPasswordLength': 'Minimum Password Length',
      'security.minPasswordLength.description': 'Minimum number of characters for password',
      'security.loginAttempts': 'Login Attempts',
      'security.loginAttempts.description': 'Maximum number of login attempts',
      'security.twoFactor': 'Two-Factor Authentication',
      'security.twoFactor.description': 'Enables two-factor authentication',
      'security.logLevel': 'Log Level',
      'security.logLevel.description': 'Level of detail for logs',
      'security.logLevel.debug': 'Debug (DEBUG)',
      'security.logLevel.info': 'Info (INFO)',
      'security.logLevel.warn': 'Warning (WARN)',
      'security.logLevel.error': 'Error (ERROR)',
      
      // Notifications
      'notifications.title': 'Notifications',
      'notifications.description': 'Notification settings',
      'notifications.smtpServer': 'SMTP Server',
      'notifications.smtpServer.description': 'Email server for notifications',
      'notifications.smtpPort': 'SMTP Port',
      'notifications.smtpPort.description': 'SMTP server port',
      'notifications.push': 'Push Notifications',
      'notifications.push.description': 'Enables browser push notifications',
      
      // Backup
      'backup.title': 'Backup',
      'backup.description': 'Backup and restore settings',
      'backup.frequency': 'Backup Frequency',
      'backup.frequency.description': 'Frequency of automatic backups',
      'backup.frequency.daily': 'Daily',
      'backup.frequency.weekly': 'Weekly',
      'backup.frequency.monthly': 'Monthly',
      'backup.retention': 'Backup Retention (days)',
      'backup.retention.description': 'Number of days to keep backups',
      'backup.encrypted': 'Encrypted Backup',
      'backup.encrypted.description': 'Encrypts backup files',
      
      // Company / white-label
      'empresa.panel.title': 'Company and brand (white-label)',
      'empresa.panel.intro':
        'Same data as the initial wizard. Saving updates the public branding API, emails, and commercial documents. Logo/wordmark uploads are stored on the server and use the public URL {{path}}.',
      'empresa.panel.readOnly':
        'Read-only. Ask a user with an administrative profile or Settings access.',
      'integrations.bling.title': 'Bling integration',
      'integrations.bling.intro':
        'Connect this company\'s Bling account to import contacts into commercial proposals. Authorization happens on Bling; tokens are stored securely per company.',
      'integrations.bling.platformDisabled': 'Bling integration is disabled on the platform (contact Aero Suite support).',
      'integrations.bling.oauthNotConfigured': 'OAuth is not configured on the server. Set CLIENT_ID, CLIENT_SECRET, and REDIRECT_URI.',
      'integrations.bling.notConnected': 'No Bling account connected for this company.',
      'integrations.bling.loadFailed': 'Could not load integration status. Check that the API is reachable.',
      'integrations.bling.retryBtn': 'Try again',
      'integrations.bling.connected': 'Bling account connected',
      'integrations.bling.connectedAt': 'Connected on {{date}}',
      'integrations.bling.legacyToken': 'Legacy global token active — we recommend migrating to OAuth per company.',
      'integrations.bling.connectBtn': 'Connect Bling',
      'integrations.bling.connection.title': 'Connection',
      'integrations.bling.connection.desc': 'Authorize the Bling account, test the API, and manage tokens per company.',
      'integrations.bling.testBtn': 'Test connection',
      'integrations.bling.disconnectBtn': 'Disconnect',
      'integrations.bling.disconnectConfirm': 'Disconnect this company\'s Bling account? Contact import will stop until you reconnect.',
      'integrations.bling.testOk': 'Bling API connection verified.',
      'integrations.bling.testFail': 'Connection check failed: {{message}}',
      'integrations.bling.toast.connected': 'Bling account connected successfully.',
      'integrations.bling.toast.connectError': 'Could not connect to Bling: {{message}}',
      'integrations.bling.toast.disconnected': 'Bling account disconnected.',
      'integrations.bling.toast.disconnectError': 'Error disconnecting Bling.',
      'integrations.bling.readOnly': 'Only an administrative profile can manage this integration.',
      'integrations.bling.syncTitle': 'Synchronization',
      'integrations.bling.syncDesc': 'Webhooks, queued jobs, and linked customers.',
      'integrations.bling.syncMapped': '{{count}} customers linked to Bling',
      'integrations.bling.syncPedidos': '{{count}} orders linked to proposals',
      'integrations.bling.syncNfe': '{{count}} invoices recorded',
      'integrations.bling.syncPending': '{{count}} jobs in queue',
      'integrations.bling.syncDead': '{{count}} permanently failed jobs',
      'integrations.bling.syncDeadShort': '{{count}} failed',
      'integrations.bling.syncLastWebhook': 'Last webhook: {{date}}',
      'integrations.bling.deadJobs.title': 'Permanently failed jobs',
      'integrations.bling.deadJobs.intro': 'These events exhausted automatic retries. Reprocess after fixing the connection or discard if no longer needed.',
      'integrations.bling.deadJobs.eventType': 'Event: {{type}}',
      'integrations.bling.deadJobs.attempts': '{{current}}/{{max}} attempts',
      'integrations.bling.deadJobs.reprocessBtn': 'Reprocess',
      'integrations.bling.deadJobs.discardBtn': 'Discard',
      'integrations.bling.deadJobs.reprocessAllBtn': 'Reprocess all',
      'integrations.bling.deadJobs.discardAllBtn': 'Discard all',
      'integrations.bling.deadJobs.discardConfirm': 'Discard this job? The event will not be processed automatically.',
      'integrations.bling.deadJobs.discardAllConfirm': 'Discard all permanently failed jobs for this company?',
      'integrations.bling.deadJobs.reprocessOk': 'Job(s) queued for processing.',
      'integrations.bling.deadJobs.discardOk': 'Job(s) removed.',
      'integrations.bling.deadJobs.error': 'Operation failed: {{message}}',
      'integrations.bling.webhookHint': 'In Bling, set POST URL /api/integracoes/bling/webhook (or /webhook/t/{tenant-code} if companyId is not mapped yet).',
      'integrations.bling.scopesTitle': 'API permissions (scopes)',
      'integrations.bling.bootstrapBtn': 'Prepare homologation data',
      'integrations.bling.bootstrapOk': 'Homologation data created (contact + tax defaults). Import the customer in a proposal.',
      'integrations.bling.bootstrapFail': 'Bootstrap failed: {{message}}',
      'integrations.bling.webhookHomologBtn': 'Test webhook',
      'integrations.bling.webhookHomologOk': 'Webhook validated. Configure in Bling: {{url}}',
      'integrations.bling.webhookHomologFail': 'Webhook test failed: {{message}}',
      'integrations.bling.fiscal.title': 'Tax configuration',
      'integrations.bling.fiscal.desc': 'CFOP, tax rates, digital certificate, and invoice automations.',
      'integrations.bling.fiscal.intro': 'Default CFOP, series and rates for Bling orders and invoices. The A1/A3 certificate is encrypted per company; install the same file in Bling for SEFAZ authorization.',
      'integrations.bling.fiscal.cfop': 'Default CFOP',
      'integrations.bling.fiscal.serie': 'Invoice series',
      'integrations.bling.fiscal.natureza': 'Operation nature',
      'integrations.bling.fiscal.ncm': 'Default NCM',
      'integrations.bling.fiscal.icms': 'ICMS rate',
      'integrations.bling.fiscal.pis': 'PIS rate',
      'integrations.bling.fiscal.cofins': 'COFINS rate',
      'integrations.bling.fiscal.autoOs': 'Auto-create work order when Bling order is linked',
      'integrations.bling.fiscal.autoNfe': 'Auto-issue invoice when the work order is completed (after Bling order)',
      'integrations.bling.fiscal.saveBtn': 'Save tax settings',
      'integrations.bling.fiscal.saved': 'Tax settings saved.',
      'integrations.bling.fiscal.saveError': 'Failed to save tax settings.',
      'integrations.bling.fiscal.certTitle': 'Digital certificate (A1 / A3)',
      'integrations.bling.fiscal.certHint': 'Upload .pfx/.p12 and password. Bling issuance requires the same certificate under Preferences > Digital certificate.',
      'integrations.bling.fiscal.certConfigured': 'Certificate configured',
      'integrations.bling.fiscal.certValidUntil': 'valid until {{date}}',
      'integrations.bling.fiscal.certTipo': 'Type',
      'integrations.bling.fiscal.certPassword': 'Certificate password',
      'integrations.bling.fiscal.certChoose': 'Choose file',
      'integrations.bling.fiscal.certUploadBtn': 'Upload certificate',
      'integrations.bling.fiscal.certRemoveBtn': 'Remove',
      'integrations.bling.fiscal.certRemoveConfirm': 'Remove this company\'s digital certificate?',
      'integrations.bling.fiscal.certRequired': 'Select the file and enter the certificate password.',
      'integrations.bling.fiscal.certOk': 'Certificate stored securely.',
      'integrations.bling.fiscal.certError': 'Failed to process certificate.',
      'integrations.bling.fiscal.certRemoved': 'Certificate removed.',
      'empresa.accordion.identity': 'Identity',
      'empresa.accordion.contacts': 'Contacts',
      'empresa.accordion.fiscal': 'Tax details and extras',
      'empresa.accordion.lgpd': 'Terms and privacy (LGPD)',
      'empresa.lgpd.intro': 'Public legal texts (/termos and /privacidade). When custom texts are enabled, they replace the platform defaults for your organization.',
      'empresa.lgpd.useCustom': 'Use custom legal texts for this organization',
      'empresa.lgpd.termos': 'Terms of use',
      'empresa.lgpd.termosPh': 'Plain text content (line breaks supported)…',
      'empresa.lgpd.privacidade': 'Privacy policy',
      'empresa.lgpd.privacidadePh': 'Plain text content…',
      'empresa.lgpd.defaultHint': 'Without customization, visitors see the platform default texts.',
      'empresa.field.displayName': 'Commercial name',
      'empresa.field.tagline': 'Tagline',
      'empresa.field.emailSubjectSuffix': 'Email subject suffix (optional)',
      'empresa.field.browserTitleSuffix': 'Browser title suffix',
      'empresa.field.copyrightEntity': 'Copyright entity (optional)',
      'empresa.field.logoUrl': 'Logo (URL or upload)',
      'empresa.field.wordmark': 'Wordmark',
      'empresa.field.primaryColor': 'Brand primary color',
      'empresa.field.primaryColor.hint': 'Used on login, commercial proposals, work order printouts and emails.',
      'empresa.field.primaryColor.ph': '#0ea5e9',
      'empresa.field.logoPlaceholder': '/api/public/empresa-asset/logo or assets/…',
      'empresa.upload.logo': 'Upload logo image',
      'empresa.upload.wordmark': 'Upload wordmark',
      'empresa.preview.logoAlt': 'Logo preview',
      'empresa.preview.wordmarkAlt': 'Wordmark preview',
      'empresa.field.supportEmail': 'Company contact email',
      'empresa.field.supportEmail.hint':
        'Enter your company\'s official contact email (or the organization you are setting up) — the one you would put in the footer of a proposal or commercial letter. This is not Aero Suite platform support.',
      'empresa.field.telefone': 'Phone',
      'empresa.field.siteUrl': 'Website (optional)',
      'empresa.field.razaoSocial': 'Legal name',
      'empresa.field.cnpj': 'Tax ID (CNPJ)',
      'empresa.field.inscricaoEstadual': 'State registration',
      'empresa.field.inscricaoMunicipal': 'Municipal registration',
      'empresa.field.emailNfe': 'NF-e email (optional)',
      'empresa.field.enderecoLogradouro': 'Street',
      'empresa.field.enderecoNumero': 'Number',
      'empresa.field.enderecoComplemento': 'Complement',
      'empresa.field.enderecoBairro': 'District',
      'empresa.field.cidade': 'City',
      'empresa.field.uf': 'State (UF)',
      'empresa.field.cep': 'ZIP',
      'empresa.confirmPublish': 'I confirm the data to publish the brand across the system',
      'empresa.action.saveDraft': 'Save draft',
      'empresa.action.publish': 'Finish and publish',
      'empresa.action.saveChanges': 'Save changes',
      'empresa.toast.loadError': 'Could not load company settings.',
      'empresa.toast.errorSummary': 'Error',
      'empresa.toast.saveError': 'Could not save. Check required fields.',
      'empresa.toast.savedPublish': 'Brand published.',
      'empresa.toast.savedOk': 'Saved',
      'empresa.toast.savedDraft': 'Changes saved.',
      'empresa.toast.uploadLogoOk': 'File uploaded.',
      'empresa.toast.uploadLogoErr': 'Upload failed.',
      'empresa.toast.uploadWmOk': 'File uploaded.',
      'empresa.toast.uploadWmErr': 'Upload failed.',
      'empresa.toast.summaryLogo': 'Logo',
      'empresa.toast.summaryWm': 'Wordmark',

      // Language / shell
      'language.switcher.aria': 'Choose interface language',
      'language.name.pt-BR': 'Portuguese (Brazil)',
      'language.name.en-US': 'English (US)',
      'language.name.es-ES': 'Spanish',
      'language.name.fr-FR': 'French',

      'login.email': 'Email',
      'login.password': 'Password',
      'login.placeholderEmail': 'Enter your email',
      'login.placeholderPassword': 'Enter your password',
      'login.forgotPassword': 'Forgot password',
      'login.submit': 'Sign in',
      'login.tagline': 'Management platform for MRO workshops',
      'login.trialCreated': 'Trial account created successfully. Sign in with the email and password you just registered.',
      'login.copyrightReserved': 'All rights reserved',
      'login.error.timeout': 'Sign-in timed out. Check your connection and try again.',
      'login.error.connection': 'Connection error. Check that the backend is running and try again.',
      'login.error.invalidCredentials': 'User not found or invalid credentials.',
      'login.error.serviceUnavailable': 'Service temporarily unavailable. Try again shortly.',
      'login.error.serverError': 'Internal server error. Please try again later.',
      'login.error.generic': 'Sign-in error. Check your credentials.',
      'login.tenant': 'Organization',
      'login.placeholderTenant': 'Select organization',
      'login.placeholderTenantCode': 'Organization code (e.g. default)',
      'login.tenantHintMulti': 'This email is registered in more than one organization. Choose by org code and creation date.',
      'login.tenantOptionLabel': '{{nome}} · {{codigo}} · {{criadoEm}} · #{{id}}',
      'login.tenantOptionLabelNoDate': '{{nome}} · {{codigo}} · #{{id}}',
      'login.error.tenantRequired': 'Enter the organization code for this email.',
      'login.error.tenantNotFound': 'Invalid organization code.',
      'login.mfaCode': 'Authenticator code',
      'login.mfaCodePlaceholder': '6 digits',
      'login.mfaHint': 'Open your authenticator app (Google Authenticator, Authy, etc.).',
      'login.error.mfaRequired': 'Enter your two-factor authentication code.',
      'login.error.mfaInvalid': 'Invalid or expired authentication code.',
      'mfaSetup.title': 'Set up two-factor authentication',
      'mfaSetup.subtitle': 'Scan the QR code or copy the secret into your authenticator app.',
      'mfaSetup.secretLabel': 'Secret (manual entry)',
      'mfaSetup.codeLabel': 'Verification code',
      'mfaSetup.submit': 'Enable and sign in',
      'mfaSetup.error.generic': 'Could not complete MFA enrollment.',

      'externo.portalSubtitle': 'Customer portal',
      'externo.menu': 'Menu',
      'externo.client': 'Customer',

      'layout.menu': 'Menu',
      'layout.expandSidebar': 'Expand menu',
      'layout.collapseSidebar': 'Collapse menu',
      'layout.closeMenu': 'Close menu',
      'layout.home': 'Home',
      'layout.logout': 'Sign out',
      'layout.user': 'User',
      'layout.profile': 'My profile',
      'layout.interfaceLanguage': 'Interface language',
      'layout.billing': 'Billing and plan',
      'layout.privacyData': 'Privacy and data',
      'layout.changePhoto': 'Change photo',
      'layout.navLoading': 'Loading menu...',
      'layout.navPrincipal': 'Main',
      'layout.navFlightDeck': 'Flight deck',
      'layout.navFlightDeckHint': 'Aero Suite modules and routes',
      'layout.navSearch': 'Search module…',
      'layout.navSearchClear': 'Clear search',
      'layout.navModuleCount': '{{count}} items',
      'layout.navModuleCountOne': '{{count}} item',
      'layout.navNoResults': 'No modules found.',
      'layout.clockAlt': 'Clock',
      'layout.brandLogoAlt': 'Company logo',
      'layout.routeLoading': 'Loading page…',

      'layout.nav.dashboard': 'Dashboard',
      'layout.nav.dashboardTooltip': 'Home page',
      'layout.nav.settings': 'Settings',
      'layout.nav.settingsTooltip': 'System settings',
      'layout.nav.osPendenciasTrocas': 'WO — pending exchanges',
      'layout.nav.osPendenciasTrocasTooltip':
        'Payment pending (Eventual Exchange Request on the work order)',

      'layout.troca.header.solicitacao': 'New Eventual Exchange Request',
      'layout.troca.header.deficit': 'Attention — Eventual Exchange Request and stock',
      'layout.troca.deficit.lead':
        'An Eventual Exchange Request was recorded on a work order and one or more products do not have enough stock (available less than requested).',
      'layout.troca.deficit.productsTitle': 'Products in shortfall:',
      'layout.troca.deficit.confirmFoot':
        'Confirm you acknowledge to stop receiving this notice. The work order record remains saved.',
      'layout.troca.solicitacao.ribbon': 'NEW EVENT',
      'layout.troca.solicitacao.title': 'Eventual Exchange Request',
      'layout.troca.solicitacao.sub':
        'A new request was opened on this work order and requires Supply attention to review the products listed below.',
      'layout.troca.solicitacao.listTitle': 'Products in the request',
      'layout.troca.solicitacao.foot':
        'Confirm you acknowledge to hide this alert. The work order is already saved in the system.',
      'layout.troca.btn.supply': 'Understood — Supply will review',
      'layout.troca.btn.ack': 'I acknowledge',
      'layout.troca.th.produto': 'Product',
      'layout.troca.th.pn': 'P/N',
      'layout.troca.th.solicitado': 'Requested',
      'layout.troca.th.disponivel': 'Available',
      'layout.troca.th.deficit': 'Shortfall',
      'layout.troca.th.qtd': 'Qty',
      'layout.troca.th.status': 'Status',
      'layout.troca.th.descricao': 'Description',
      'layout.troca.label.os': 'WO',
      'layout.troca.label.cliente': 'Customer',
      'layout.troca.status.pending': 'Pending',
      'layout.troca.status.paid': 'Paid',
      'layout.troca.status.refused': 'Refused',

      'layout.photo.header': 'Change profile photo',
      'layout.photo.previewNew': 'Preview',
      'layout.photo.current': 'Current photo',
      'layout.photo.previewAlt': 'Preview of the new photo',
      'layout.photo.zoomAlt': 'Enlarged profile photo',
      'layout.photo.avatarAlt': 'User profile photo',
      'layout.photo.removeSelection': 'Remove selection',
      'layout.photo.dropTitle': 'Drag an image here',
      'layout.photo.dropSubtitle': 'or click to choose from your computer',
      'layout.photo.hint': 'Accepted formats: JPG, PNG or GIF up to 5MB',
      'layout.photo.close': 'Close',
      'layout.photo.save': 'Save photo',
      'layout.photo.error.notImage': 'Select an image file (JPG, PNG or GIF).',
      'layout.photo.error.tooLarge': 'The image exceeds the 5MB limit ({{sizeMb}} MB).',

      'layout.toast.error': 'Error',
      'layout.toast.success': 'Success',
      'layout.toast.warn': 'Warning',
      'layout.toast.ackFail': 'Could not record your acknowledgment. Please try again.',
      'layout.toast.invalidFile': 'Invalid file',
      'layout.toast.selectPhotoFirst': 'Please select a photo before saving.',
      'layout.toast.userUnknown': 'User not identified. Please sign in again.',
      'layout.toast.photoOk': 'Photo updated successfully!',
      'layout.toast.uploadGeneric': 'Error uploading photo. Please try again.',
      'layout.toast.serverHtml':
        'The server returned an error page. Check that the backend is running correctly.',
      'layout.toast.endpoint404': 'Endpoint not found. Check that the backend is configured correctly.',
      'layout.toast.noConnection': 'Could not connect to the server. Check that the backend is running.',
      'layout.toast.fileTooLarge':
        'Upload exceeded the HTTP proxy limit (413). Try again after a server update, or use a smaller image.',

      'notifications.bell.tooltip': 'Notifications',
      'notifications.bell.title': 'Notifications',
      'notifications.bell.markAllRead': 'Mark all as read',
      'notifications.bell.empty': 'No notifications',
      'notifications.bell.viewAll': 'View all notifications',
      'notifications.relative.now': 'Just now',
      'notifications.relative.minutes': '{{n}} min ago',
      'notifications.relative.hours': '{{n}}h ago',
      'notifications.relative.days': '{{n}} days ago',

      'chat.notification.newMessage': 'New message',

      'footer.meta': 'Operations and compliance in real time',
      'footer.statusOnline': 'System online',
      'footer.statusDegraded': 'Services unavailable',
      'footer.navAria': 'Footer',
      'footer.preferences': 'Preferences',
      'footer.support': 'Support',
      'footer.home': 'Home',

      'estoque.item.loadDetailError': 'Error loading details',
      'estoque.item.minMaxUpdated': 'Minimum/ideal stock updated.',
      'estoque.item.saveError': 'Error saving.',
      'estoque.item.pnRequired': 'Part Number is required.',
      'estoque.item.qtyInvalid': 'Invalid quantity.',
      'estoque.item.updateOk': 'Item updated successfully.',
      'estoque.item.updateFail': 'Failed to update item.',
      'estoque.item.entryDeleted': 'Entry deleted successfully.',
      'estoque.item.deleteEntryFail': 'Failed to delete entry.',
      'estoque.item.osInvalid': 'Invalid work order.',
      'estoque.item.exitQtyInvalid': 'Invalid exit quantity.',
      'estoque.item.exitOk': 'Exit recorded successfully.',
      'estoque.item.exitFail': 'Failed to record exit.',
      
      // Common
      'common.toast.error': 'Error',
      'common.toast.success': 'Success',
      'common.toast.warn': 'Warning',
      'common.toast.info': 'Information',
      'common.required': '*',
      'common.enabled': 'Enabled',
      'common.disabled': 'Disabled'
    },
    'es-ES': {
      // Configuración
      'settings.title': 'Configuración',
      'settings.description': 'Gestionar la configuración del sistema',
      'settings.saveAll': 'Salvar tudo',
      'settings.restoreDefaults': 'Restaurar Predeterminados',
      'settings.saved': 'Configuración Guardada',
      'settings.savedDetail': 'Todas las configuraciones se han guardado correctamente',
      'settings.saveAllEmpresaFailed':
        'Se guardó la configuración del sistema, pero no fue posible guardar los datos de la empresa.',
      'settings.restored': 'Predeterminados Restaurados',
      'settings.restoredDetail': 'Configuraciones restauradas a los valores predeterminados',
      'settings.nav.aria': 'Ir a sección de configuración',
      'settings.section.bling.badge': 'Integración ERP',
      'settings.advanced.title': 'Configuración avanzada',
      'settings.advanced.description': 'Opciones técnicas para administradores',
      'settings.advanced.logsDetailed': 'Registros detallados',
      'settings.advanced.logsDetailedHint': 'Habilita registros detallados para depuración',
      'settings.advanced.autoBackup': 'Copia de seguridad automática',
      'settings.advanced.autoBackupHint': 'Realiza copia de seguridad automática de los datos',
      'settings.advanced.emailNotifications': 'Notificaciones por correo',
      'settings.advanced.emailNotificationsHint': 'Envía notificaciones por correo electrónico',
      'settings.emailTest.title': 'Prueba de correo (admin)',
      'settings.emailTest.hint': 'Envía un correo de prueba para validar SMTP en producción.',
      'settings.emailTest.placeholder': 'destino@empresa.com',
      'settings.emailTest.btn': 'Enviar prueba',
      'settings.emailTest.ok': 'Correo de prueba enviado.',
      'settings.emailTest.err': 'Error al enviar correo de prueba.',
      'settings.emailTest.forbidden': 'Solo administradores pueden probar el correo.',
      
      // Apariencia
      'appearance.title': 'Apariencia e Interfaz',
      'appearance.description': 'Personalizar la apariencia y el comportamiento de la interfaz',
      'appearance.theme': 'Tema',
      'appearance.theme.description': 'Elegir el tema visual de la aplicación',
      'appearance.theme.light': 'Claro',
      'appearance.theme.dark': 'Oscuro',
      'appearance.theme.auto': 'Automático (sigue el sistema)',
      'appearance.skin': 'Apariencia (skin)',
      'appearance.skin.description':
        'Tema completo de la interfaz. Solo se guarda en este navegador.',
      'appearance.language': 'Idioma Predeterminado del Sistema',
      'appearance.language.description': 'Idioma predeterminado de la interfaz',
      'settings.locale.ptBR': 'Português (pt-BR)',
      'settings.locale.enUS': 'English (en-US)',
      'settings.locale.esES': 'Español (es-ES)',
      'settings.locale.frFR': 'Français (fr-FR)',
      'appearance.density': 'Densidad de la Interfaz',
      'appearance.density.description': 'Espaciado entre elementos de la interfaz',
      'appearance.density.compact': 'Compacto',
      'appearance.density.normal': 'Normal',
      'appearance.density.spacious': 'Espacioso',
      'appearance.fontSize': 'Tamaño de Fuente Predeterminado',
      'appearance.fontSize.description': 'Tamaño predeterminado de la fuente en la interfaz',
      'appearance.fontSize.small': 'Pequeño',
      'appearance.fontSize.medium': 'Mediano',
      'appearance.fontSize.large': 'Grande',
      'appearance.animations': 'Animaciones',
      'appearance.animations.description': 'Habilitar o deshabilitar animaciones en la interfaz',
      'appearance.animations.enabled': 'Habilitado',
      'appearance.animations.disabled': 'Deshabilitado',
      
      // Sistema
      'system.title': 'Sistema',
      'system.description': 'Configuración general del sistema',
      'system.name': 'Nombre del Sistema',
      'system.name.description': 'Nombre mostrado en el sistema',
      'system.version': 'Versión del Sistema',
      'system.version.description': 'Versión actual del sistema',
      'system.sessionTimeout': 'Tiempo de Espera de Sesión (minutos)',
      'system.sessionTimeout.description': 'Límite de tiempo para sesión inactiva',
      'system.maintenanceMode': 'Modo de Mantenimiento',
      'system.maintenanceMode.description': 'Activa el modo de mantenimiento del sistema',
      
      // Seguridad
      'security.title': 'Seguridad',
      'security.description': 'Configuración de seguridad y acceso',
      'security.minPasswordLength': 'Longitud Mínima de Contraseña',
      'security.minPasswordLength.description': 'Número mínimo de caracteres para contraseña',
      'security.loginAttempts': 'Intentos de Inicio de Sesión',
      'security.loginAttempts.description': 'Número máximo de intentos de inicio de sesión',
      'security.twoFactor': 'Autenticación de Dos Factores',
      'security.twoFactor.description': 'Habilita la autenticación de dos factores',
      'security.logLevel': 'Nivel de Registro',
      'security.logLevel.description': 'Nivel de detalle de los registros',
      'security.logLevel.debug': 'Depuración (DEBUG)',
      'security.logLevel.info': 'Información (INFO)',
      'security.logLevel.warn': 'Advertencia (WARN)',
      'security.logLevel.error': 'Error (ERROR)',
      
      // Notificaciones
      'notifications.title': 'Notificaciones',
      'notifications.description': 'Configuración de notificaciones',
      'notifications.smtpServer': 'Servidor SMTP',
      'notifications.smtpServer.description': 'Servidor de correo para notificaciones',
      'notifications.smtpPort': 'Puerto SMTP',
      'notifications.smtpPort.description': 'Puerto del servidor SMTP',
      'notifications.push': 'Notificaciones Push',
      'notifications.push.description': 'Habilita notificaciones push en el navegador',
      
      // Respaldo
      'backup.title': 'Respaldo',
      'backup.description': 'Configuración de respaldo y restauración',
      'backup.frequency': 'Frecuencia de Respaldo',
      'backup.frequency.description': 'Frecuencia de los respaldos automáticos',
      'backup.frequency.daily': 'Diario',
      'backup.frequency.weekly': 'Semanal',
      'backup.frequency.monthly': 'Mensual',
      'backup.retention': 'Retención de Respaldo (días)',
      'backup.retention.description': 'Número de días para conservar respaldos',
      'backup.encrypted': 'Respaldo Cifrado',
      'backup.encrypted.description': 'Cifra los archivos de respaldo',
      
      'empresa.panel.title': 'Empresa y marca (white-label)',
      'empresa.panel.intro':
        'Los mismos datos del asistente inicial. Al guardar se actualizan la API pública de marca, correos y documentos comerciales. El envío de logo/wordmark guarda archivos en el servidor y fija la URL pública {{path}}.',
      'empresa.panel.readOnly':
        'Solo lectura. Solicite a un usuario con perfil administrativo o acceso a Configuración.',
      'integrations.bling.title': 'Integración Bling',
      'integrations.bling.intro':
        'Conecte la cuenta Bling de esta empresa para importar contactos en propuestas comerciales. La autorización se hace en Bling; los tokens se almacenan de forma segura por empresa.',
      'integrations.bling.platformDisabled': 'Integración Bling desactivada en la plataforma (contacte al soporte Aero Suite).',
      'integrations.bling.oauthNotConfigured': 'OAuth no configurado en el servidor. Defina CLIENT_ID, CLIENT_SECRET y REDIRECT_URI.',
      'integrations.bling.notConnected': 'Ninguna cuenta Bling conectada para esta empresa.',
      'integrations.bling.loadFailed': 'No se pudo cargar el estado de la integración. Compruebe que la API esté accesible.',
      'integrations.bling.retryBtn': 'Reintentar',
      'integrations.bling.connected': 'Cuenta Bling conectada',
      'integrations.bling.connectedAt': 'Conectado el {{date}}',
      'integrations.bling.legacyToken': 'Token global heredado activo — recomendamos migrar a OAuth por empresa.',
      'integrations.bling.connectBtn': 'Conectar Bling',
      'integrations.bling.connection.title': 'Conexión',
      'integrations.bling.connection.desc': 'Autorice la cuenta Bling, pruebe la API y gestione tokens por empresa.',
      'integrations.bling.testBtn': 'Probar conexión',
      'integrations.bling.disconnectBtn': 'Desconectar',
      'integrations.bling.disconnectConfirm': '¿Desconectar la cuenta Bling de esta empresa? La importación de contactos dejará de funcionar hasta reconectar.',
      'integrations.bling.testOk': 'Conexión con la API Bling verificada.',
      'integrations.bling.testFail': 'Error al verificar conexión: {{message}}',
      'integrations.bling.toast.connected': 'Cuenta Bling conectada correctamente.',
      'integrations.bling.toast.connectError': 'No fue posible conectar a Bling: {{message}}',
      'integrations.bling.toast.disconnected': 'Cuenta Bling desconectada.',
      'integrations.bling.toast.disconnectError': 'Error al desconectar Bling.',
      'integrations.bling.readOnly': 'Solo un perfil administrativo puede gestionar esta integración.',
      'integrations.bling.syncTitle': 'Sincronización',
      'integrations.bling.syncDesc': 'Webhooks, trabajos en cola y clientes vinculados.',
      'integrations.bling.syncMapped': '{{count}} clientes vinculados a Bling',
      'integrations.bling.syncPedidos': '{{count}} pedidos vinculados a propuestas',
      'integrations.bling.syncNfe': '{{count}} NF-e registradas',
      'integrations.bling.syncPending': '{{count}} trabajos en cola',
      'integrations.bling.syncDead': '{{count}} trabajos con fallo permanente',
      'integrations.bling.syncDeadShort': '{{count}} fallo(s)',
      'integrations.bling.syncLastWebhook': 'Último webhook: {{date}}',
      'integrations.bling.deadJobs.title': 'Trabajos con fallo permanente',
      'integrations.bling.deadJobs.intro': 'Estos eventos agotaron los reintentos automáticos. Reprocese tras corregir la conexión o descarte si ya no son necesarios.',
      'integrations.bling.deadJobs.eventType': 'Evento: {{type}}',
      'integrations.bling.deadJobs.attempts': '{{current}}/{{max}} intentos',
      'integrations.bling.deadJobs.reprocessBtn': 'Reprocesar',
      'integrations.bling.deadJobs.discardBtn': 'Descartar',
      'integrations.bling.deadJobs.reprocessAllBtn': 'Reprocesar todos',
      'integrations.bling.deadJobs.discardAllBtn': 'Descartar todos',
      'integrations.bling.deadJobs.discardConfirm': '¿Descartar este trabajo? El evento no se procesará automáticamente.',
      'integrations.bling.deadJobs.discardAllConfirm': '¿Descartar todos los trabajos con fallo permanente de esta empresa?',
      'integrations.bling.deadJobs.reprocessOk': 'Trabajo(s) en cola para procesamiento.',
      'integrations.bling.deadJobs.discardOk': 'Trabajo(s) eliminado(s).',
      'integrations.bling.deadJobs.error': 'Error en la operación: {{message}}',
      'integrations.bling.webhookHint': 'En Bling configure POST /api/integracoes/bling/webhook (o /webhook/t/{codigo-tenant} si companyId aún no está mapeado).',
      'integrations.bling.scopesTitle': 'Permisos de la API (ámbitos)',
      'integrations.bling.bootstrapBtn': 'Preparar homologación',
      'integrations.bling.bootstrapOk': 'Datos de homologación creados (contacto + fiscal). Importe el cliente en una propuesta.',
      'integrations.bling.bootstrapFail': 'Bootstrap falló: {{message}}',
      'integrations.bling.webhookHomologBtn': 'Probar webhook',
      'integrations.bling.webhookHomologOk': 'Webhook validado. Configure en Bling: {{url}}',
      'integrations.bling.webhookHomologFail': 'Prueba de webhook falló: {{message}}',
      'integrations.bling.fiscal.title': 'Configuración fiscal',
      'integrations.bling.fiscal.desc': 'CFOP, alícuotas, certificado digital y automatizaciones de factura.',
      'integrations.bling.fiscal.intro': 'CFOP, serie y alícuotas usados en pedidos y facturas Bling. El certificado A1/A3 se cifra por empresa; instale el mismo archivo en Bling para autorización SEFAZ.',
      'integrations.bling.fiscal.cfop': 'CFOP predeterminado',
      'integrations.bling.fiscal.serie': 'Serie NF-e',
      'integrations.bling.fiscal.natureza': 'Naturaleza de la operación',
      'integrations.bling.fiscal.ncm': 'NCM predeterminado',
      'integrations.bling.fiscal.icms': 'Alícuota ICMS',
      'integrations.bling.fiscal.pis': 'Alícuota PIS',
      'integrations.bling.fiscal.cofins': 'Alícuota COFINS',
      'integrations.bling.fiscal.autoOs': 'Generar OS automáticamente al vincular pedido Bling',
      'integrations.bling.fiscal.autoNfe': 'Emitir NF-e automáticamente al concluir la OS (tras pedido Bling)',
      'integrations.bling.fiscal.saveBtn': 'Guardar configuración fiscal',
      'integrations.bling.fiscal.saved': 'Configuración fiscal guardada.',
      'integrations.bling.fiscal.saveError': 'Error al guardar configuración fiscal.',
      'integrations.bling.fiscal.certTitle': 'Certificado digital (A1 / A3)',
      'integrations.bling.fiscal.certHint': 'Suba .pfx/.p12 y contraseña. La emisión en Bling requiere el mismo certificado en Preferencias > Certificado digital.',
      'integrations.bling.fiscal.certConfigured': 'Certificado configurado',
      'integrations.bling.fiscal.certValidUntil': 'válido hasta {{date}}',
      'integrations.bling.fiscal.certTipo': 'Tipo',
      'integrations.bling.fiscal.certPassword': 'Contraseña del certificado',
      'integrations.bling.fiscal.certChoose': 'Elegir archivo',
      'integrations.bling.fiscal.certUploadBtn': 'Enviar certificado',
      'integrations.bling.fiscal.certRemoveBtn': 'Eliminar',
      'integrations.bling.fiscal.certRemoveConfirm': '¿Eliminar el certificado digital de esta empresa?',
      'integrations.bling.fiscal.certRequired': 'Seleccione el archivo e indique la contraseña.',
      'integrations.bling.fiscal.certOk': 'Certificado almacenado de forma segura.',
      'integrations.bling.fiscal.certError': 'Error al procesar certificado.',
      'integrations.bling.fiscal.certRemoved': 'Certificado eliminado.',
      'empresa.accordion.identity': 'Identidad',
      'empresa.accordion.contacts': 'Contactos',
      'empresa.accordion.fiscal': 'Datos fiscales y extras',
      'empresa.accordion.lgpd': 'Términos y privacidad (LGPD)',
      'empresa.lgpd.intro': 'Textos legales públicos (/termos y /privacidade). Con textos personalizados activos, sustituyen los predeterminados de la plataforma para su organización.',
      'empresa.lgpd.useCustom': 'Usar textos legales personalizados de esta organización',
      'empresa.lgpd.termos': 'Términos de uso',
      'empresa.lgpd.termosPh': 'Contenido en texto plano (admite saltos de línea)…',
      'empresa.lgpd.privacidade': 'Política de privacidad',
      'empresa.lgpd.privacidadePh': 'Contenido en texto plano…',
      'empresa.lgpd.defaultHint': 'Sin personalización, los visitantes ven los textos predeterminados de la plataforma.',
      'empresa.field.displayName': 'Nombre comercial',
      'empresa.field.tagline': 'Eslogan',
      'empresa.field.emailSubjectSuffix': 'Sufijo asunto correo (opcional)',
      'empresa.field.browserTitleSuffix': 'Sufijo título del navegador',
      'empresa.field.copyrightEntity': 'Entidad © (opcional)',
      'empresa.field.logoUrl': 'Logo (URL o envío)',
      'empresa.field.wordmark': 'Wordmark',
      'empresa.field.primaryColor': 'Color primario de la marca',
      'empresa.field.primaryColor.hint': 'Se usa en login, propuestas comerciales, impresión de OS y correos.',
      'empresa.field.primaryColor.ph': '#0ea5e9',
      'empresa.field.logoPlaceholder': '/api/public/empresa-asset/logo o assets/…',
      'empresa.upload.logo': 'Enviar imagen del logo',
      'empresa.upload.wordmark': 'Enviar wordmark',
      'empresa.preview.logoAlt': 'Vista previa del logo',
      'empresa.preview.wordmarkAlt': 'Vista previa del wordmark',
      'empresa.field.supportEmail': 'Correo de contacto de la empresa',
      'empresa.field.supportEmail.hint':
        'Indique el correo oficial de contacto de su empresa (o de la organización que está configurando) — el que pondría al pie de una propuesta o carta comercial. No es el soporte de la plataforma Aero Suite.',
      'empresa.field.telefone': 'Teléfono',
      'empresa.field.siteUrl': 'Sitio web (opcional)',
      'empresa.field.razaoSocial': 'Razón social',
      'empresa.field.cnpj': 'CNPJ',
      'empresa.field.inscricaoEstadual': 'Inscripción estatal',
      'empresa.field.inscricaoMunicipal': 'Inscripción municipal',
      'empresa.field.emailNfe': 'Correo NF-e (opcional)',
      'empresa.field.enderecoLogradouro': 'Calle',
      'empresa.field.enderecoNumero': 'Número',
      'empresa.field.enderecoComplemento': 'Complemento',
      'empresa.field.enderecoBairro': 'Barrio',
      'empresa.field.cidade': 'Ciudad',
      'empresa.field.uf': 'UF',
      'empresa.field.cep': 'CEP',
      'empresa.confirmPublish': 'Confirmo los datos para publicar la marca en todo el sistema',
      'empresa.action.saveDraft': 'Guardar borrador',
      'empresa.action.publish': 'Concluir publicación',
      'empresa.action.saveChanges': 'Guardar cambios',
      'empresa.toast.loadError': 'No se pudo cargar la configuración de la empresa.',
      'empresa.toast.errorSummary': 'Error',
      'empresa.toast.saveError': 'No se pudo guardar. Revise los campos obligatorios.',
      'empresa.toast.savedPublish': 'Marca publicada.',
      'empresa.toast.savedOk': 'Guardado',
      'empresa.toast.savedDraft': 'Cambios guardados.',
      'empresa.toast.uploadLogoOk': 'Archivo enviado.',
      'empresa.toast.uploadLogoErr': 'Fallo en el envío.',
      'empresa.toast.uploadWmOk': 'Archivo enviado.',
      'empresa.toast.uploadWmErr': 'Fallo en el envío.',
      'empresa.toast.summaryLogo': 'Logo',
      'empresa.toast.summaryWm': 'Wordmark',

      'language.switcher.aria': 'Elegir idioma de la interfaz',
      'language.name.pt-BR': 'Portugués (Brasil)',
      'language.name.en-US': 'Inglés (EE. UU.)',
      'language.name.es-ES': 'Español',
      'language.name.fr-FR': 'Francés',

      'login.email': 'Correo electrónico',
      'login.password': 'Contraseña',
      'login.placeholderEmail': 'Introduzca su correo',
      'login.placeholderPassword': 'Introduzca su contraseña',
      'login.forgotPassword': 'Olvidé mi contraseña',
      'login.submit': 'Entrar',
      'login.tagline': 'Plataforma de gestión para talleres MRO',
      'login.trialCreated': 'Cuenta trial creada con éxito. Inicie sesión con el correo y la contraseña que acaba de registrar.',
      'login.copyrightReserved': 'Todos los derechos reservados',
      'login.error.timeout': 'Tiempo de espera al iniciar sesión. Compruebe su conexión e inténtelo de nuevo.',
      'login.error.connection': 'Error de conexión. Compruebe que el backend esté en ejecución e inténtelo de nuevo.',
      'login.error.invalidCredentials': 'Usuario no encontrado o credenciales inválidas.',
      'login.error.serviceUnavailable': 'Servicio temporalmente no disponible. Inténtelo de nuevo en unos instantes.',
      'login.error.serverError': 'Error interno del servidor. Inténtelo más tarde.',
      'login.error.generic': 'Error al iniciar sesión. Compruebe sus credenciales.',
      'login.tenant': 'Organización',
      'login.placeholderTenant': 'Seleccione la organización',
      'login.placeholderTenantCode': 'Código de organización (ej.: default)',
      'login.tenantHintMulti': 'Este correo pertenece a más de una organización. Elija por código y fecha de creación.',
      'login.tenantOptionLabel': '{{nome}} · {{codigo}} · {{criadoEm}} · #{{id}}',
      'login.tenantOptionLabelNoDate': '{{nome}} · {{codigo}} · #{{id}}',
      'login.error.tenantRequired': 'Indique el código de organización para este correo.',
      'login.error.tenantNotFound': 'Código de organización no válido.',
      'login.mfaCode': 'Código del autenticador',
      'login.mfaCodePlaceholder': '6 dígitos',
      'login.mfaHint': 'Abra su aplicación autenticadora (Google Authenticator, Authy, etc.).',
      'login.error.mfaRequired': 'Introduzca el código de autenticación de dos factores.',
      'login.error.mfaInvalid': 'Código de autenticación no válido o caducado.',
      'mfaSetup.title': 'Configurar autenticación de dos factores',
      'mfaSetup.subtitle': 'Escanee el código QR o copie el secreto en la aplicación autenticadora.',
      'mfaSetup.secretLabel': 'Secreto (entrada manual)',
      'mfaSetup.codeLabel': 'Código de verificación',
      'mfaSetup.submit': 'Activar y entrar',
      'mfaSetup.error.generic': 'No se pudo completar el registro MFA.',

      'externo.portalSubtitle': 'Portal del cliente',
      'externo.menu': 'Menú',
      'externo.client': 'Cliente',

      'layout.menu': 'Menú',
      'layout.expandSidebar': 'Expandir menú',
      'layout.collapseSidebar': 'Contraer menú',
      'layout.closeMenu': 'Cerrar menú',
      'layout.home': 'Inicio',
      'layout.logout': 'Salir',
      'layout.user': 'Usuario',
      'layout.profile': 'Mi perfil',
      'layout.interfaceLanguage': 'Idioma de la interfaz',
      'layout.billing': 'Facturación y plan',
      'layout.privacyData': 'Privacidad y datos',
      'layout.changePhoto': 'Cambiar foto',
      'layout.navLoading': 'Cargando menú...',
      'layout.navPrincipal': 'Principal',
      'layout.navFlightDeck': 'Panel de vuelo',
      'layout.navFlightDeckHint': 'Módulos y rutas de Aero Suite',
      'layout.navSearch': 'Buscar módulo…',
      'layout.navSearchClear': 'Limpiar búsqueda',
      'layout.navModuleCount': '{{count}} elementos',
      'layout.navModuleCountOne': '{{count}} elemento',
      'layout.navNoResults': 'Ningún módulo encontrado.',
      'layout.clockAlt': 'Reloj',
      'layout.brandLogoAlt': 'Logotipo de la empresa',
      'layout.routeLoading': 'Cargando página…',

      'layout.nav.dashboard': 'Panel',
      'layout.nav.dashboardTooltip': 'Página de inicio',
      'layout.nav.settings': 'Configuración',
      'layout.nav.settingsTooltip': 'Configuración del sistema',
      'layout.nav.osPendenciasTrocas': 'OT — pendientes de cambios',
      'layout.nav.osPendenciasTrocasTooltip':
        'Pendientes de pago (Solicitud de cambio eventual en la OT)',

      'layout.troca.header.solicitacion': 'Nueva solicitud de cambio eventual',
      'layout.troca.header.deficit': 'Atención — Solicitud de cambio eventual y stock',
      'layout.troca.deficit.lead':
        'Se registró una solicitud de cambio eventual en una OT y uno o más productos no tienen stock suficiente (disponible menor que lo solicitado).',
      'layout.troca.deficit.productsTitle': 'Productos en déficit:',
      'layout.troca.deficit.confirmFoot':
        'Confirme que está al tanto para dejar de recibir este aviso. El registro de la OT permanece guardado.',
      'layout.troca.solicitacao.ribbon': 'NUEVO EVENTO',
      'layout.troca.solicitacao.title': 'Solicitud de cambio eventual',
      'layout.troca.solicitacao.sub':
        'Se abrió una nueva solicitud en esta OT y requiere la atención de Abastecimiento para revisar los productos indicados abajo.',
      'layout.troca.solicitacao.listTitle': 'Productos en la solicitud',
      'layout.troca.solicitacao.foot':
        'Confirme que está al tanto para ocultar esta alerta. La OT ya está guardada en el sistema.',
      'layout.troca.btn.supply': 'Entendido — Abastecimiento lo revisará',
      'layout.troca.btn.ack': 'Estoy al tanto',
      'layout.troca.th.produto': 'Producto',
      'layout.troca.th.pn': 'P/N',
      'layout.troca.th.solicitado': 'Solicitado',
      'layout.troca.th.disponivel': 'Disponible',
      'layout.troca.th.deficit': 'Déficit',
      'layout.troca.th.qtd': 'Cant.',
      'layout.troca.th.status': 'Estado',
      'layout.troca.th.descricao': 'Descripción',
      'layout.troca.label.os': 'OT',
      'layout.troca.label.cliente': 'Cliente',
      'layout.troca.status.pending': 'Pendiente',
      'layout.troca.status.paid': 'Pagado',
      'layout.troca.status.refused': 'Rechazado',

      'layout.photo.header': 'Cambiar foto de perfil',
      'layout.photo.previewNew': 'Vista previa',
      'layout.photo.current': 'Foto actual',
      'layout.photo.previewAlt': 'Vista previa de la nueva foto',
      'layout.photo.zoomAlt': 'Foto de perfil ampliada',
      'layout.photo.avatarAlt': 'Foto de perfil del usuario',
      'layout.photo.removeSelection': 'Quitar selección',
      'layout.photo.dropTitle': 'Arrastre una imagen aquí',
      'layout.photo.dropSubtitle': 'o haga clic para elegir del equipo',
      'layout.photo.hint': 'Formatos aceptados: JPG, PNG o GIF hasta 5MB',
      'layout.photo.close': 'Cerrar',
      'layout.photo.save': 'Guardar foto',
      'layout.photo.error.notImage': 'Seleccione un archivo de imagen (JPG, PNG o GIF).',
      'layout.photo.error.tooLarge': 'La imagen supera el límite de 5MB ({{sizeMb}} MB).',

      'layout.toast.error': 'Error',
      'layout.toast.success': 'Éxito',
      'layout.toast.warn': 'Atención',
      'layout.toast.ackFail': 'No fue posible registrar que está al tanto. Inténtelo de nuevo.',
      'layout.toast.invalidFile': 'Archivo no válido',
      'layout.toast.selectPhotoFirst': 'Seleccione una foto antes de guardar.',
      'layout.toast.userUnknown': 'Usuario no identificado. Inicie sesión de nuevo.',
      'layout.toast.photoOk': '¡Foto actualizada con éxito!',
      'layout.toast.uploadGeneric': 'Error al subir la foto. Inténtelo de nuevo.',
      'layout.toast.serverHtml':
        'El servidor devolvió una página de error. Compruebe que el backend esté en ejecución.',
      'layout.toast.endpoint404': 'Endpoint no encontrado. Compruebe la configuración del backend.',
      'layout.toast.noConnection': 'No se pudo conectar al servidor. Compruebe que el backend esté en ejecución.',
      'layout.toast.fileTooLarge':
        'El envío superó el límite del proxy HTTP (413). Pruebe de nuevo tras actualizar el servidor o use una imagen más pequeña.',

      'notifications.bell.tooltip': 'Notificaciones',
      'notifications.bell.title': 'Notificaciones',
      'notifications.bell.markAllRead': 'Marcar todas como leídas',
      'notifications.bell.empty': 'Sin notificaciones',
      'notifications.bell.viewAll': 'Ver todas las notificaciones',
      'notifications.relative.now': 'Ahora mismo',
      'notifications.relative.minutes': 'Hace {{n}} min',
      'notifications.relative.hours': 'Hace {{n}}h',
      'notifications.relative.days': 'Hace {{n}} días',

      'chat.notification.newMessage': 'Nuevo mensaje',

      'footer.meta': 'Operación y cumplimiento en tiempo real',
      'footer.statusOnline': 'Sistema en línea',
      'footer.statusDegraded': 'Servicios no disponibles',
      'footer.navAria': 'Pie de página',
      'footer.preferences': 'Preferencias',
      'footer.support': 'Soporte',
      'footer.home': 'Inicio',

      'estoque.item.loadDetailError': 'Error al cargar detalles',
      'estoque.item.minMaxUpdated': 'Stock mínimo/ideal actualizado.',
      'estoque.item.saveError': 'Error al guardar.',
      'estoque.item.pnRequired': 'Part Number es obligatorio.',
      'estoque.item.qtyInvalid': 'Cantidad no válida.',
      'estoque.item.updateOk': 'Artículo actualizado correctamente.',
      'estoque.item.updateFail': 'Error al actualizar el artículo.',
      'estoque.item.entryDeleted': 'Entrada eliminada correctamente.',
      'estoque.item.deleteEntryFail': 'Error al eliminar la entrada.',
      'estoque.item.osInvalid': 'Orden de trabajo no válida.',
      'estoque.item.exitQtyInvalid': 'Cantidad de salida no válida.',
      'estoque.item.exitOk': 'Salida registrada correctamente.',
      'estoque.item.exitFail': 'Error al registrar la salida.',
      
      // Común
      'common.toast.error': 'Error',
      'common.toast.success': 'Éxito',
      'common.toast.warn': 'Atención',
      'common.toast.info': 'Información',
      'common.required': '*',
      'common.enabled': 'Habilitado',
      'common.disabled': 'Deshabilitado'
    },
    'fr-FR': {
      // Paramètres
      'settings.title': 'Paramètres',
      'settings.description': 'Gérer les paramètres du système',
      'settings.saveAll': 'Tout Enregistrer',
      'settings.restoreDefaults': 'Restaurer les Valeurs par Défaut',
      'settings.saved': 'Paramètres Enregistrés',
      'settings.savedDetail': 'Tous les paramètres ont été enregistrés avec succès',
      'settings.saveAllEmpresaFailed':
        'Les paramètres système ont été enregistrés, mais les données de l’entreprise n’ont pas pu l’être.',
      'settings.restored': 'Valeurs par Défaut Restaurées',
      'settings.restoredDetail': 'Paramètres restaurés aux valeurs par défaut',
      'settings.nav.aria': 'Aller à la section de paramètres',
      'settings.section.bling.badge': 'Intégration ERP',
      'settings.advanced.title': 'Paramètres avancés',
      'settings.advanced.description': 'Options techniques pour les administrateurs',
      'settings.advanced.logsDetailed': 'Journaux détaillés',
      'settings.advanced.logsDetailedHint': 'Active les journaux détaillés pour le débogage',
      'settings.advanced.autoBackup': 'Sauvegarde automatique',
      'settings.advanced.autoBackupHint': 'Effectue une sauvegarde automatique des données',
      'settings.advanced.emailNotifications': 'Notifications par e-mail',
      'settings.advanced.emailNotificationsHint': 'Envoie des notifications par e-mail',
      'settings.emailTest.title': 'Test e-mail (admin)',
      'settings.emailTest.hint': 'Envoie un e-mail de test pour valider le SMTP en production.',
      'settings.emailTest.placeholder': 'destinataire@entreprise.com',
      'settings.emailTest.btn': 'Envoyer le test',
      'settings.emailTest.ok': 'E-mail de test envoyé.',
      'settings.emailTest.err': 'Échec de l’envoi de l’e-mail de test.',
      'settings.emailTest.forbidden': 'Seuls les administrateurs peuvent tester l’e-mail.',
      
      // Apparence
      'appearance.title': 'Apparence et Interface',
      'appearance.description': 'Personnaliser l\'apparence et le comportement de l\'interface',
      'appearance.theme': 'Thème',
      'appearance.theme.description': 'Choisir le thème visuel de l\'application',
      'appearance.theme.light': 'Clair',
      'appearance.theme.dark': 'Sombre',
      'appearance.theme.auto': 'Automatique (suit le système)',
      'appearance.skin': 'Apparence (skin)',
      'appearance.skin.description':
        'Thème complet de l’interface. Enregistré uniquement dans ce navigateur.',
      'appearance.language': 'Langue par Défaut du Système',
      'appearance.language.description': 'Langue par défaut de l\'interface',
      'settings.locale.ptBR': 'Português (pt-BR)',
      'settings.locale.enUS': 'English (en-US)',
      'settings.locale.esES': 'Español (es-ES)',
      'settings.locale.frFR': 'Français (fr-FR)',
      'appearance.density': 'Densité de l\'Interface',
      'appearance.density.description': 'Espacement entre les éléments de l\'interface',
      'appearance.density.compact': 'Compact',
      'appearance.density.normal': 'Normal',
      'appearance.density.spacious': 'Spacieux',
      'appearance.fontSize': 'Taille de Police par Défaut',
      'appearance.fontSize.description': 'Taille par défaut de la police dans l\'interface',
      'appearance.fontSize.small': 'Petit',
      'appearance.fontSize.medium': 'Moyen',
      'appearance.fontSize.large': 'Grand',
      'appearance.animations': 'Animations',
      'appearance.animations.description': 'Activer ou désactiver les animations de l\'interface',
      'appearance.animations.enabled': 'Activé',
      'appearance.animations.disabled': 'Désactivé',
      
      // Système
      'system.title': 'Système',
      'system.description': 'Paramètres généraux du système',
      'system.name': 'Nom du Système',
      'system.name.description': 'Nom affiché dans le système',
      'system.version': 'Version du Système',
      'system.version.description': 'Version actuelle du système',
      'system.sessionTimeout': 'Délai d\'Expiration de Session (minutes)',
      'system.sessionTimeout.description': 'Limite de temps pour session inactive',
      'system.maintenanceMode': 'Mode Maintenance',
      'system.maintenanceMode.description': 'Active le mode maintenance du système',
      
      // Sécurité
      'security.title': 'Sécurité',
      'security.description': 'Paramètres de sécurité et d\'accès',
      'security.minPasswordLength': 'Longueur Minimale du Mot de Passe',
      'security.minPasswordLength.description': 'Nombre minimum de caractères pour le mot de passe',
      'security.loginAttempts': 'Tentatives de Connexion',
      'security.loginAttempts.description': 'Nombre maximum de tentatives de connexion',
      'security.twoFactor': 'Authentification à deux facteurs',
      'security.twoFactor.description': 'Active l\'authentification à deux facteurs',
      'security.logLevel': 'Niveau de journalisation',
      'security.logLevel.description': 'Niveau de détail des journaux',
      'security.logLevel.debug': 'Débogage (DEBUG)',
      'security.logLevel.info': 'Information (INFO)',
      'security.logLevel.warn': 'Avertissement (WARN)',
      'security.logLevel.error': 'Erreur (ERROR)',
      
      // Notifications
      'notifications.title': 'Notifications',
      'notifications.description': 'Paramètres de notification',
      'notifications.smtpServer': 'Serveur SMTP',
      'notifications.smtpServer.description': 'Serveur de messagerie pour les notifications',
      'notifications.smtpPort': 'Port SMTP',
      'notifications.smtpPort.description': 'Port du serveur SMTP',
      'notifications.push': 'Notifications push',
      'notifications.push.description': 'Active les notifications push dans le navigateur',
      
      // Sauvegarde
      'backup.title': 'Sauvegarde',
      'backup.description': 'Paramètres de sauvegarde et de restauration',
      'backup.frequency': 'Fréquence de sauvegarde',
      'backup.frequency.description': 'Fréquence des sauvegardes automatiques',
      'backup.frequency.daily': 'Quotidienne',
      'backup.frequency.weekly': 'Hebdomadaire',
      'backup.frequency.monthly': 'Mensuelle',
      'backup.retention': 'Rétention des sauvegardes (jours)',
      'backup.retention.description': 'Nombre de jours de conservation des sauvegardes',
      'backup.encrypted': 'Sauvegarde chiffrée',
      'backup.encrypted.description': 'Chiffre les fichiers de sauvegarde',
      
      'empresa.panel.title': 'Entreprise et marque (white-label)',
      'empresa.panel.intro':
        'Les mêmes données que l’assistant initial. Après enregistrement : API publique de marque, e-mails et documents commerciaux. L’envoi logo/wordmark enregistre les fichiers sur le serveur et définit l’URL publique {{path}}.',
      'empresa.panel.readOnly':
        'Lecture seule. Demandez à un utilisateur avec profil administratif ou accès Paramètres.',
      'integrations.bling.title': 'Intégration Bling',
      'integrations.bling.intro':
        'Connectez le compte Bling de cette entreprise pour importer des contacts dans les propositions commerciales. L\'autorisation se fait sur Bling ; les jetons sont stockés de façon sécurisée par entreprise.',
      'integrations.bling.platformDisabled': 'Intégration Bling désactivée sur la plateforme (contactez le support Aero Suite).',
      'integrations.bling.oauthNotConfigured': 'OAuth non configuré sur le serveur. Définissez CLIENT_ID, CLIENT_SECRET et REDIRECT_URI.',
      'integrations.bling.notConnected': 'Aucun compte Bling connecté pour cette entreprise.',
      'integrations.bling.loadFailed': 'Impossible de charger l’état de l’intégration. Vérifiez que l’API est accessible.',
      'integrations.bling.retryBtn': 'Réessayer',
      'integrations.bling.connected': 'Compte Bling connecté',
      'integrations.bling.connectedAt': 'Connecté le {{date}}',
      'integrations.bling.legacyToken': 'Jeton global hérité actif — nous recommandons de migrer vers OAuth par entreprise.',
      'integrations.bling.connectBtn': 'Connecter Bling',
      'integrations.bling.connection.title': 'Connexion',
      'integrations.bling.connection.desc': 'Autorisez le compte Bling, testez l’API et gérez les jetons par entreprise.',
      'integrations.bling.testBtn': 'Tester la connexion',
      'integrations.bling.disconnectBtn': 'Déconnecter',
      'integrations.bling.disconnectConfirm': 'Déconnecter le compte Bling de cette entreprise ? L\'import de contacts cessera jusqu\'à une nouvelle connexion.',
      'integrations.bling.testOk': 'Connexion à l\'API Bling vérifiée.',
      'integrations.bling.testFail': 'Échec de la vérification : {{message}}',
      'integrations.bling.toast.connected': 'Compte Bling connecté avec succès.',
      'integrations.bling.toast.connectError': 'Impossible de se connecter à Bling : {{message}}',
      'integrations.bling.toast.disconnected': 'Compte Bling déconnecté.',
      'integrations.bling.toast.disconnectError': 'Erreur lors de la déconnexion Bling.',
      'integrations.bling.readOnly': 'Seul un profil administratif peut gérer cette intégration.',
      'integrations.bling.syncTitle': 'Synchronisation',
      'integrations.bling.syncDesc': 'Webhooks, jobs en file d’attente et clients liés.',
      'integrations.bling.syncMapped': '{{count}} clients liés à Bling',
      'integrations.bling.syncPedidos': '{{count}} commandes liées aux propositions',
      'integrations.bling.syncNfe': '{{count}} factures enregistrées',
      'integrations.bling.syncPending': '{{count}} tâches en file d\'attente',
      'integrations.bling.syncDead': '{{count}} tâches en échec permanent',
      'integrations.bling.syncDeadShort': '{{count}} échec(s)',
      'integrations.bling.syncLastWebhook': 'Dernier webhook : {{date}}',
      'integrations.bling.deadJobs.title': 'Tâches en échec permanent',
      'integrations.bling.deadJobs.intro': 'Ces événements ont épuisé les tentatives automatiques. Reprocessez après correction de la connexion ou supprimez-les si inutiles.',
      'integrations.bling.deadJobs.eventType': 'Événement : {{type}}',
      'integrations.bling.deadJobs.attempts': '{{current}}/{{max}} tentatives',
      'integrations.bling.deadJobs.reprocessBtn': 'Retraiter',
      'integrations.bling.deadJobs.discardBtn': 'Supprimer',
      'integrations.bling.deadJobs.reprocessAllBtn': 'Tout retraiter',
      'integrations.bling.deadJobs.discardAllBtn': 'Tout supprimer',
      'integrations.bling.deadJobs.discardConfirm': 'Supprimer cette tâche ? L\'événement ne sera pas traité automatiquement.',
      'integrations.bling.deadJobs.discardAllConfirm': 'Supprimer toutes les tâches en échec permanent pour cette entreprise ?',
      'integrations.bling.deadJobs.reprocessOk': 'Tâche(s) remise(s) en file d\'attente.',
      'integrations.bling.deadJobs.discardOk': 'Tâche(s) supprimée(s).',
      'integrations.bling.deadJobs.error': 'Échec de l\'opération : {{message}}',
      'integrations.bling.webhookHint': 'Dans Bling, configurez POST /api/integracoes/bling/webhook (ou /webhook/t/{code-tenant} si companyId n\'est pas encore mappé).',
      'integrations.bling.scopesTitle': 'Permissions API (périmètres)',
      'integrations.bling.bootstrapBtn': 'Préparer homologation',
      'integrations.bling.bootstrapOk': 'Données d\'homologation créées (contact + fiscal). Importez le client dans une proposition.',
      'integrations.bling.bootstrapFail': 'Échec du bootstrap : {{message}}',
      'integrations.bling.webhookHomologBtn': 'Tester le webhook',
      'integrations.bling.webhookHomologOk': 'Webhook validé. Configurez dans Bling : {{url}}',
      'integrations.bling.webhookHomologFail': 'Échec du test webhook : {{message}}',
      'integrations.bling.fiscal.title': 'Configuration fiscale',
      'integrations.bling.fiscal.desc': 'CFOP, taux fiscaux, certificat numérique et automatisations de facture.',
      'integrations.bling.fiscal.intro': 'CFOP, série et taux utilisés pour les commandes et factures Bling. Le certificat A1/A3 est chiffré par entreprise ; installez le même fichier dans Bling pour l\'autorisation SEFAZ.',
      'integrations.bling.fiscal.cfop': 'CFOP par défaut',
      'integrations.bling.fiscal.serie': 'Série NF-e',
      'integrations.bling.fiscal.natureza': 'Nature de l\'opération',
      'integrations.bling.fiscal.ncm': 'NCM par défaut',
      'integrations.bling.fiscal.icms': 'Taux ICMS',
      'integrations.bling.fiscal.pis': 'Taux PIS',
      'integrations.bling.fiscal.cofins': 'Taux COFINS',
      'integrations.bling.fiscal.autoOs': 'Créer l\'OS automatiquement à la liaison du pedido Bling',
      'integrations.bling.fiscal.autoNfe': 'Émettre la NF-e automatiquement à la clôture de l’OS (après pedido Bling)',
      'integrations.bling.fiscal.saveBtn': 'Enregistrer la config fiscale',
      'integrations.bling.fiscal.saved': 'Configuration fiscale enregistrée.',
      'integrations.bling.fiscal.saveError': 'Échec de l\'enregistrement fiscal.',
      'integrations.bling.fiscal.certTitle': 'Certificat numérique (A1 / A3)',
      'integrations.bling.fiscal.certHint': 'Téléversez .pfx/.p12 et mot de passe. L\'émission Bling exige le même certificat dans Préférences > Certificat digital.',
      'integrations.bling.fiscal.certConfigured': 'Certificat configuré',
      'integrations.bling.fiscal.certValidUntil': 'valide jusqu\'au {{date}}',
      'integrations.bling.fiscal.certTipo': 'Type',
      'integrations.bling.fiscal.certPassword': 'Mot de passe du certificat',
      'integrations.bling.fiscal.certChoose': 'Choisir un fichier',
      'integrations.bling.fiscal.certUploadBtn': 'Envoyer le certificat',
      'integrations.bling.fiscal.certRemoveBtn': 'Supprimer',
      'integrations.bling.fiscal.certRemoveConfirm': 'Supprimer le certificat digital de cette entreprise ?',
      'integrations.bling.fiscal.certRequired': 'Sélectionnez le fichier et saisissez le mot de passe.',
      'integrations.bling.fiscal.certOk': 'Certificat stocké en toute sécurité.',
      'integrations.bling.fiscal.certError': 'Échec du traitement du certificat.',
      'integrations.bling.fiscal.certRemoved': 'Certificat supprimé.',
      'empresa.accordion.identity': 'Identité',
      'empresa.accordion.contacts': 'Contacts',
      'empresa.accordion.fiscal': 'Données fiscales et extras',
      'empresa.accordion.lgpd': 'Conditions et confidentialité (LGPD)',
      'empresa.lgpd.intro': 'Textes juridiques publics (/termos et /privacidade). Avec des textes personnalisés activés, ils remplacent les textes par défaut de la plateforme pour votre organisation.',
      'empresa.lgpd.useCustom': 'Utiliser des textes juridiques personnalisés pour cette organisation',
      'empresa.lgpd.termos': 'Conditions d’utilisation',
      'empresa.lgpd.termosPh': 'Contenu en texte brut (sauts de ligne acceptés)…',
      'empresa.lgpd.privacidade': 'Politique de confidentialité',
      'empresa.lgpd.privacidadePh': 'Contenu en texte brut…',
      'empresa.lgpd.defaultHint': 'Sans personnalisation, les visiteurs voient les textes par défaut de la plateforme.',
      'empresa.field.displayName': 'Nom commercial',
      'empresa.field.tagline': 'Slogan',
      'empresa.field.emailSubjectSuffix': 'Suffixe sujet e-mail (optionnel)',
      'empresa.field.browserTitleSuffix': 'Suffixe titre du navigateur',
      'empresa.field.copyrightEntity': 'Entité © (optionnel)',
      'empresa.field.logoUrl': 'Logo (URL ou envoi)',
      'empresa.field.wordmark': 'Wordmark',
      'empresa.field.primaryColor': 'Couleur primaire de la marque',
      'empresa.field.primaryColor.hint': 'Utilisée sur la connexion, les propositions commerciales, l’impression OS et les e-mails.',
      'empresa.field.primaryColor.ph': '#0ea5e9',
      'empresa.field.logoPlaceholder': '/api/public/empresa-asset/logo ou assets/…',
      'empresa.upload.logo': 'Envoyer l’image du logo',
      'empresa.upload.wordmark': 'Envoyer le wordmark',
      'empresa.preview.logoAlt': 'Aperçu du logo',
      'empresa.preview.wordmarkAlt': 'Aperçu du wordmark',
      'empresa.field.supportEmail': 'E-mail de contact de l\'entreprise',
      'empresa.field.supportEmail.hint':
        'Indiquez l\'e-mail officiel de contact de votre entreprise (ou de l\'organisation que vous configurez) — celui que vous mettriez en pied de page d\'une proposition ou lettre commerciale. Ce n\'est pas le support de la plateforme Aero Suite.',
      'empresa.field.telefone': 'Téléphone',
      'empresa.field.siteUrl': 'Site web (optionnel)',
      'empresa.field.razaoSocial': 'Raison sociale',
      'empresa.field.cnpj': 'CNPJ',
      'empresa.field.inscricaoEstadual': 'Inscription étatique',
      'empresa.field.inscricaoMunicipal': 'Inscription municipale',
      'empresa.field.emailNfe': 'E-mail NF-e (optionnel)',
      'empresa.field.enderecoLogradouro': 'Rue',
      'empresa.field.enderecoNumero': 'Numéro',
      'empresa.field.enderecoComplemento': 'Complément',
      'empresa.field.enderecoBairro': 'Quartier',
      'empresa.field.cidade': 'Ville',
      'empresa.field.uf': 'UF',
      'empresa.field.cep': 'Code postal',
      'empresa.confirmPublish': 'Je confirme les données pour publier la marque sur tout le système',
      'empresa.action.saveDraft': 'Enregistrer le brouillon',
      'empresa.action.publish': 'Terminer la publication',
      'empresa.action.saveChanges': 'Enregistrer les modifications',
      'empresa.toast.loadError': 'Impossible de charger la configuration de l’entreprise.',
      'empresa.toast.errorSummary': 'Erreur',
      'empresa.toast.saveError': 'Impossible d’enregistrer. Vérifiez les champs obligatoires.',
      'empresa.toast.savedPublish': 'Marque publiée.',
      'empresa.toast.savedOk': 'Enregistré',
      'empresa.toast.savedDraft': 'Modifications enregistrées.',
      'empresa.toast.uploadLogoOk': 'Fichier envoyé.',
      'empresa.toast.uploadLogoErr': 'Échec de l’envoi.',
      'empresa.toast.uploadWmOk': 'Fichier envoyé.',
      'empresa.toast.uploadWmErr': 'Échec de l’envoi.',
      'empresa.toast.summaryLogo': 'Logo',
      'empresa.toast.summaryWm': 'Wordmark',

      'language.switcher.aria': 'Choisir la langue de l’interface',
      'language.name.pt-BR': 'Portugais (Brésil)',
      'language.name.en-US': 'Anglais (États-Unis)',
      'language.name.es-ES': 'Espagnol',
      'language.name.fr-FR': 'Français',

      'login.email': 'E-mail',
      'login.password': 'Mot de passe',
      'login.placeholderEmail': 'Saisissez votre e-mail',
      'login.placeholderPassword': 'Saisissez votre mot de passe',
      'login.forgotPassword': 'Mot de passe oublié',
      'login.submit': 'Se connecter',
      'login.tagline': 'Plateforme de gestion pour ateliers MRO',
      'login.trialCreated': 'Compte d’essai créé avec succès. Connectez-vous avec l’e-mail et le mot de passe que vous venez d’enregistrer.',
      'login.copyrightReserved': 'Tous droits réservés',
      'login.error.timeout': 'Délai d’attente à la connexion. Vérifiez votre connexion et réessayez.',
      'login.error.connection': 'Erreur de connexion. Vérifiez que le backend est démarré et réessayez.',
      'login.error.invalidCredentials': 'Utilisateur introuvable ou identifiants invalides.',
      'login.error.serviceUnavailable': 'Service temporairement indisponible. Réessayez dans un instant.',
      'login.error.serverError': 'Erreur interne du serveur. Réessayez plus tard.',
      'login.error.generic': 'Erreur de connexion. Vérifiez vos identifiants.',
      'login.tenant': 'Organisation',
      'login.placeholderTenant': 'Sélectionnez l’organisation',
      'login.placeholderTenantCode': 'Code organisation (ex. default)',
      'login.tenantHintMulti': 'Cet e-mail est associé à plusieurs organisations. Choisissez par code et date de création.',
      'login.tenantOptionLabel': '{{nome}} · {{codigo}} · {{criadoEm}} · #{{id}}',
      'login.tenantOptionLabelNoDate': '{{nome}} · {{codigo}} · #{{id}}',
      'login.error.tenantRequired': 'Saisissez le code organisation pour cet e-mail.',
      'login.error.tenantNotFound': 'Code organisation invalide.',
      'login.mfaCode': 'Code authentificateur',
      'login.mfaCodePlaceholder': '6 chiffres',
      'login.mfaHint': 'Ouvrez votre application d’authentification (Google Authenticator, Authy, etc.).',
      'login.error.mfaRequired': 'Saisissez le code d’authentification à deux facteurs.',
      'login.error.mfaInvalid': 'Code d’authentification invalide ou expiré.',
      'mfaSetup.title': 'Configurer l’authentification à deux facteurs',
      'mfaSetup.subtitle': 'Scannez le QR code ou copiez le secret dans l’application authentificatrice.',
      'mfaSetup.secretLabel': 'Secret (saisie manuelle)',
      'mfaSetup.codeLabel': 'Code de vérification',
      'mfaSetup.submit': 'Activer et se connecter',
      'mfaSetup.error.generic': 'Impossible de terminer l’enregistrement MFA.',

      'externo.portalSubtitle': 'Portail client',
      'externo.menu': 'Menu',
      'externo.client': 'Client',

      'layout.menu': 'Menu',
      'layout.expandSidebar': 'Développer le menu',
      'layout.collapseSidebar': 'Réduire le menu',
      'layout.closeMenu': 'Fermer le menu',
      'layout.home': 'Accueil',
      'layout.logout': 'Se déconnecter',
      'layout.user': 'Utilisateur',
      'layout.profile': 'Mon profil',
      'layout.interfaceLanguage': 'Langue de l’interface',
      'layout.billing': 'Facturation et forfait',
      'layout.privacyData': 'Confidentialité et données',
      'layout.changePhoto': 'Changer la photo',
      'layout.navLoading': 'Chargement du menu...',
      'layout.navPrincipal': 'Principal',
      'layout.navFlightDeck': 'Poste de pilotage',
      'layout.navFlightDeckHint': 'Modules et routes Aero Suite',
      'layout.navSearch': 'Rechercher un module…',
      'layout.navSearchClear': 'Effacer la recherche',
      'layout.navModuleCount': '{{count}} éléments',
      'layout.navModuleCountOne': '{{count}} élément',
      'layout.navNoResults': 'Aucun module trouvé.',
      'layout.clockAlt': 'Horloge',
      'layout.brandLogoAlt': 'Logo de l’entreprise',
      'layout.routeLoading': 'Chargement de la page…',

      'layout.nav.dashboard': 'Tableau de bord',
      'layout.nav.dashboardTooltip': 'Page d’accueil',
      'layout.nav.settings': 'Paramètres',
      'layout.nav.settingsTooltip': 'Paramètres du système',
      'layout.nav.osPendenciasTrocas': 'OT — échanges en attente',
      'layout.nav.osPendenciasTrocasTooltip':
        'Paiements en attente (demande d’échange éventuelle sur l’OT)',

      'layout.troca.header.solicitacion': 'Nouvelle demande d’échange éventuel',
      'layout.troca.header.deficit': 'Attention — Demande d’échange éventuel et stock',
      'layout.troca.deficit.lead':
        'Une demande d’échange éventuel a été enregistrée sur une OT et un ou plusieurs produits n’ont pas assez de stock (disponible inférieur à la demande).',
      'layout.troca.deficit.productsTitle': 'Produits en déficit :',
      'layout.troca.deficit.confirmFoot':
        'Confirmez avoir pris connaissance pour ne plus recevoir cet avis. L’enregistrement de l’OT reste sauvegardé.',
      'layout.troca.solicitacao.ribbon': 'NOUVEL ÉVÉNEMENT',
      'layout.troca.solicitacao.title': 'Demande d’échange éventuel',
      'layout.troca.solicitacao.sub':
        'Une nouvelle demande a été ouverte sur cette OT et nécessite l’attention des Achats pour examiner les produits listés ci-dessous.',
      'layout.troca.solicitacao.listTitle': 'Produits dans la demande',
      'layout.troca.solicitacao.foot':
        'Confirmez avoir pris connaissance pour masquer cette alerte. L’OT est déjà enregistrée dans le système.',
      'layout.troca.btn.supply': 'Compris — Achats analysera',
      'layout.troca.btn.ack': 'J’ai pris connaissance',
      'layout.troca.th.produto': 'Produit',
      'layout.troca.th.pn': 'P/N',
      'layout.troca.th.solicitado': 'Demandé',
      'layout.troca.th.disponivel': 'Disponible',
      'layout.troca.th.deficit': 'Déficit',
      'layout.troca.th.qtd': 'Qté',
      'layout.troca.th.status': 'Statut',
      'layout.troca.th.descricao': 'Description',
      'layout.troca.label.os': 'OT',
      'layout.troca.label.cliente': 'Client',
      'layout.troca.status.pending': 'En attente',
      'layout.troca.status.paid': 'Payé',
      'layout.troca.status.refused': 'Refusé',

      'layout.photo.header': 'Changer la photo de profil',
      'layout.photo.previewNew': 'Aperçu',
      'layout.photo.current': 'Photo actuelle',
      'layout.photo.previewAlt': 'Aperçu de la nouvelle photo',
      'layout.photo.zoomAlt': 'Photo de profil agrandie',
      'layout.photo.avatarAlt': 'Photo de profil de l’utilisateur',
      'layout.photo.removeSelection': 'Retirer la sélection',
      'layout.photo.dropTitle': 'Glissez une image ici',
      'layout.photo.dropSubtitle': 'ou cliquez pour choisir sur l’ordinateur',
      'layout.photo.hint': 'Formats acceptés : JPG, PNG ou GIF jusqu’à 5 Mo',
      'layout.photo.close': 'Fermer',
      'layout.photo.save': 'Enregistrer la photo',
      'layout.photo.error.notImage': 'Sélectionnez un fichier image (JPG, PNG ou GIF).',
      'layout.photo.error.tooLarge': 'L’image dépasse la limite de 5 Mo ({{sizeMb}} Mo).',

      'layout.toast.error': 'Erreur',
      'layout.toast.success': 'Succès',
      'layout.toast.warn': 'Attention',
      'layout.toast.ackFail': 'Impossible d’enregistrer la prise de connaissance. Réessayez.',
      'layout.toast.invalidFile': 'Fichier invalide',
      'layout.toast.selectPhotoFirst': 'Veuillez sélectionner une photo avant d’enregistrer.',
      'layout.toast.userUnknown': 'Utilisateur non identifié. Veuillez vous reconnecter.',
      'layout.toast.photoOk': 'Photo mise à jour avec succès !',
      'layout.toast.uploadGeneric': 'Erreur lors de l’envoi de la photo. Réessayez.',
      'layout.toast.serverHtml':
        'Le serveur a renvoyé une page d’erreur. Vérifiez que le backend fonctionne correctement.',
      'layout.toast.endpoint404': 'Point de terminaison introuvable. Vérifiez la configuration du backend.',
      'layout.toast.noConnection': 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.',
      'layout.toast.fileTooLarge':
        'Envoi refusé par la limite du proxy HTTP (413). Réessayez après mise à jour du serveur ou réduisez l’image.',

      'notifications.bell.tooltip': 'Notifications',
      'notifications.bell.title': 'Notifications',
      'notifications.bell.markAllRead': 'Tout marquer comme lu',
      'notifications.bell.empty': 'Aucune notification',
      'notifications.bell.viewAll': 'Voir toutes les notifications',
      'notifications.relative.now': 'À l’instant',
      'notifications.relative.minutes': 'Il y a {{n}} min',
      'notifications.relative.hours': 'Il y a {{n}}h',
      'notifications.relative.days': 'Il y a {{n}} jours',

      'chat.notification.newMessage': 'Nouveau message',

      'footer.meta': 'Exploitation et conformité en temps réel',
      'footer.statusOnline': 'Système en ligne',
      'footer.statusDegraded': 'Services indisponibles',
      'footer.navAria': 'Pied de page',
      'footer.preferences': 'Préférences',
      'footer.support': 'Support',
      'footer.home': 'Accueil',

      'estoque.item.loadDetailError': 'Erreur lors du chargement des détails',
      'estoque.item.minMaxUpdated': 'Stock minimum/idéal mis à jour.',
      'estoque.item.saveError': 'Erreur lors de l’enregistrement.',
      'estoque.item.pnRequired': 'Le Part Number est obligatoire.',
      'estoque.item.qtyInvalid': 'Quantité invalide.',
      'estoque.item.updateOk': 'Article mis à jour avec succès.',
      'estoque.item.updateFail': 'Échec de la mise à jour de l’article.',
      'estoque.item.entryDeleted': 'Entrée supprimée avec succès.',
      'estoque.item.deleteEntryFail': 'Échec de la suppression de l’entrée.',
      'estoque.item.osInvalid': 'Ordre de travail invalide.',
      'estoque.item.exitQtyInvalid': 'Quantité de sortie invalide.',
      'estoque.item.exitOk': 'Sortie enregistrée avec succès.',
      'estoque.item.exitFail': 'Échec de l’enregistrement de la sortie.',
      
      // Commun
      'common.toast.error': 'Erreur',
      'common.toast.success': 'Succès',
      'common.toast.warn': 'Attention',
      'common.toast.info': 'Information',
      'common.required': '*',
      'common.enabled': 'Activé',
      'common.disabled': 'Désactivé'
    }
  };

  constructor() {
    Object.assign(this.translations['pt-BR'], MODULE_LAYOUT_PT_BR);
    Object.assign(this.translations['en-US'], MODULE_LAYOUT_EN_US);
    Object.assign(this.translations['es-ES'], MODULE_LAYOUT_ES_ES);
    Object.assign(this.translations['fr-FR'], MODULE_LAYOUT_FR_FR);
    Object.assign(
      this.translations['pt-BR'],
      AUTH_INTERNAL_PT_BR,
      CONFIRM_DIALOG_PT_BR,
      LISTING_COMERCIAL_PT_BR,
      LISTINGS_UI_PT_BR,
      LISTINGS_COMMON_PT_BR,
      LISTINGS_MODULES_PT_BR,
      LISTINGS_EXTENDED_PT_BR,
      MENU_I18N_PT_BR,
      OS_FORM_PT_BR,
      OS_AUDITORIA_PT_BR,
      OS_TOASTS_PT_BR,
      OS_PRINT_PT_BR,
      HOME_I18N_PT_BR,
      SYSTEM_LABELS_PT_BR,
      SCREENS_MISC_PT_BR,
      DEPLOYMENT_PT_BR,
      COMPONENT_TOASTS_PT_BR,
      RESOLVER_PENDENCIAS_PT_BR,
      ESTOQUE_CONSULTA_QR_PT_BR,
      ESTOQUE_SCREENS_PT_BR,
      ESTOQUE_CERTIFICADO_PT_BR,
      ESTOQUE_QUARENTENA_PT_BR,
      CONFORMIDADE_RETENCAO_PT_BR,
      HANGAR_JOB_CARD_PT_BR,
      TIPOS_SERVICO_PT_BR,
      FORMS_MISC_PT_BR,
      CAPACIDADE_QUADRO_PT_BR,
      SUPORTE_SCREENS_PT_BR,
      AERO_DIRETRIZ_PT_BR,
      CONFORMIDADE_HABILITACAO_PT_BR,
      CONFORMIDADE_SGQ_PT_BR,
      ESTOQUE_ETIQUETA_PRINT_PT_BR,
      THERMAL_PRINT_SETUP_PT_BR,
      UI_PREMIUM_PT_BR,
      BACKUP_CONFIG_PT_BR,
      CHAT_I18N_PT_BR,
      API_BACKEND_I18N_PT_BR,
      PROPOSTA_API_PT_BR,
      PAGE_HELP_I18N_PT_BR,
      FCU_ASSEMBLY_SHELL_PT_BR,
      ONBOARDING_I18N_PT_BR,
      CONFIGURACAO_EMPRESA_PT_BR,
      LOCALE_I18N_PT_BR,
      TENANTS_I18N_PT_BR,
      PLATFORM_OPS_I18N_PT_BR,
      ONBOARDING_PUBLIC_I18N_PT_BR,
      TENANT_FEATURES_I18N_PT_BR,
      P1_I18N_PT_BR,
      FOOTER_HEALTH_I18N_PT_BR,
      EXTERNO_PROPOSTAS_PT_BR,
      EXTERNO_OS_DETAIL_I18N_PT_BR,
      GO_LIVE_MIGRACAO_PT_BR,
      DOSSIE_AUDITORIA_PT_BR,
      OS_CRS_PT_BR,
      BLING_WIZARD_PT_BR,
      WHATSAPP_WIZARD_PT_BR,
      AERO_STUDIO_PT_BR,
      ESTOQUE_RASTREIO_PT_BR,
      VITRINE_I18N_PT_BR
    );
    Object.assign(
      this.translations['en-US'],
      AUTH_INTERNAL_EN_US,
      CONFIRM_DIALOG_EN_US,
      LISTING_COMERCIAL_EN_US,
      LISTINGS_UI_EN_US,
      LISTINGS_COMMON_EN_US,
      LISTINGS_MODULES_EN_US,
      LISTINGS_EXTENDED_EN_US,
      MENU_I18N_EN_US,
      OS_FORM_EN_US,
      OS_AUDITORIA_EN_US,
      OS_TOASTS_EN_US,
      OS_PRINT_EN_US,
      HOME_I18N_EN_US,
      SYSTEM_LABELS_EN_US,
      SCREENS_MISC_EN_US,
      DEPLOYMENT_EN_US,
      COMPONENT_TOASTS_EN_US,
      RESOLVER_PENDENCIAS_EN_US,
      ESTOQUE_CONSULTA_QR_EN_US,
      ESTOQUE_SCREENS_EN_US,
      ESTOQUE_CERTIFICADO_EN_US,
      ESTOQUE_QUARENTENA_EN_US,
      CONFORMIDADE_RETENCAO_EN_US,
      HANGAR_JOB_CARD_EN_US,
      TIPOS_SERVICO_EN_US,
      FORMS_MISC_EN_US,
      CAPACIDADE_QUADRO_EN_US,
      SUPORTE_SCREENS_EN_US,
      AERO_DIRETRIZ_EN_US,
      CONFORMIDADE_HABILITACAO_EN_US,
      CONFORMIDADE_SGQ_EN_US,
      ESTOQUE_ETIQUETA_PRINT_EN_US,
      THERMAL_PRINT_SETUP_EN_US,
      UI_PREMIUM_EN_US,
      BACKUP_CONFIG_EN_US,
      CHAT_I18N_EN_US,
      API_BACKEND_I18N_EN_US,
      PROPOSTA_API_EN_US,
      PAGE_HELP_I18N_EN_US,
      FCU_ASSEMBLY_SHELL_EN_US,
      ONBOARDING_I18N_EN_US,
      CONFIGURACAO_EMPRESA_EN_US,
      LOCALE_I18N_EN_US,
      TENANTS_I18N_EN_US,
      PLATFORM_OPS_I18N_EN_US,
      ONBOARDING_PUBLIC_I18N_EN_US,
      TENANT_FEATURES_I18N_EN_US,
      P1_I18N_EN_US,
      FOOTER_HEALTH_I18N_EN_US,
      EXTERNO_PROPOSTAS_EN_US,
      EXTERNO_OS_DETAIL_I18N_EN_US,
      GO_LIVE_MIGRACAO_EN_US,
      DOSSIE_AUDITORIA_EN_US,
      OS_CRS_EN_US,
      BLING_WIZARD_EN_US,
      WHATSAPP_WIZARD_EN_US,
      ESTOQUE_RASTREIO_EN_US,
      AERO_STUDIO_EN_US,
      VITRINE_I18N_EN_US
    );
    Object.assign(
      this.translations['es-ES'],
      AUTH_INTERNAL_ES_ES,
      CONFIRM_DIALOG_ES_ES,
      LISTING_COMERCIAL_ES_ES,
      LISTINGS_UI_ES_ES,
      LISTINGS_COMMON_ES_ES,
      LISTINGS_MODULES_ES_ES,
      LISTINGS_EXTENDED_ES_ES,
      MENU_I18N_ES_ES,
      OS_FORM_ES_ES,
      OS_AUDITORIA_ES_ES,
      OS_TOASTS_ES_ES,
      OS_CONSULTA_ES_ES,
      OS_PRINT_ES_ES,
      HOME_I18N_ES_ES,
      SYSTEM_LABELS_ES_ES,
      SCREENS_MISC_ES_ES,
      DEPLOYMENT_ES_ES,
      COMPONENT_TOASTS_ES_ES,
      RESOLVER_PENDENCIAS_ES_ES,
      ESTOQUE_CONSULTA_QR_ES_ES,
      ESTOQUE_SCREENS_ES_ES,
      ESTOQUE_CERTIFICADO_ES_ES,
      ESTOQUE_QUARENTENA_ES_ES,
      CONFORMIDADE_RETENCAO_ES_ES,
      HANGAR_JOB_CARD_ES_ES,
      TIPOS_SERVICO_ES_ES,
      FORMS_MISC_ES_ES,
      CAPACIDADE_QUADRO_ES_ES,
      SUPORTE_SCREENS_ES_ES,
      AERO_DIRETRIZ_ES_ES,
      CONFORMIDADE_HABILITACAO_ES_ES,
      CONFORMIDADE_SGQ_ES_ES,
      ESTOQUE_ETIQUETA_PRINT_ES_ES,
      THERMAL_PRINT_SETUP_ES_ES,
      UI_PREMIUM_ES_ES,
      BACKUP_CONFIG_ES_ES,
      CHAT_I18N_ES_ES,
      API_BACKEND_I18N_ES_ES,
      PROPOSTA_API_ES_ES,
      PAGE_HELP_I18N_ES_ES,
      FCU_ASSEMBLY_SHELL_ES_ES,
      ONBOARDING_I18N_ES_ES,
      CONFIGURACAO_EMPRESA_ES_ES,
      EXTERNO_PORTAL_ES_ES,
      EXTERNO_PROPOSTAS_ES_ES,
      EXTERNO_OS_DETAIL_I18N_ES_ES,
      GO_LIVE_MIGRACAO_ES_ES,
      DOSSIE_AUDITORIA_ES_ES,
      OS_CRS_ES_ES,
      BLING_WIZARD_ES_ES,
      WHATSAPP_WIZARD_ES_ES,
      ESTOQUE_RASTREIO_ES_ES,
      AERO_STUDIO_ES_ES,
      VITRINE_I18N_ES_ES,
      LOCALE_I18N_ES_ES,
      TENANTS_I18N_ES_ES,
      PLATFORM_OPS_I18N_ES_ES,
      ONBOARDING_PUBLIC_I18N_ES_ES,
      TENANT_FEATURES_I18N_ES_ES,
      P1_I18N_ES_ES,
      FOOTER_HEALTH_I18N_ES_ES
    );
    Object.assign(
      this.translations['fr-FR'],
      AUTH_INTERNAL_FR_FR,
      CONFIRM_DIALOG_FR_FR,
      LISTING_COMERCIAL_FR_FR,
      LISTINGS_UI_FR_FR,
      LISTINGS_COMMON_FR_FR,
      LISTINGS_MODULES_FR_FR,
      LISTINGS_EXTENDED_FR_FR,
      MENU_I18N_FR_FR,
      OS_FORM_FR_FR,
      OS_AUDITORIA_FR_FR,
      OS_TOASTS_FR_FR,
      OS_CONSULTA_FR_FR,
      OS_PRINT_FR_FR,
      HOME_I18N_FR_FR,
      SYSTEM_LABELS_FR_FR,
      SCREENS_MISC_FR_FR,
      DEPLOYMENT_FR_FR,
      COMPONENT_TOASTS_FR_FR,
      RESOLVER_PENDENCIAS_FR_FR,
      ESTOQUE_CONSULTA_QR_FR_FR,
      ESTOQUE_SCREENS_FR_FR,
      ESTOQUE_CERTIFICADO_FR_FR,
      ESTOQUE_QUARENTENA_FR_FR,
      CONFORMIDADE_RETENCAO_FR_FR,
      HANGAR_JOB_CARD_FR_FR,
      TIPOS_SERVICO_FR_FR,
      FORMS_MISC_FR_FR,
      CAPACIDADE_QUADRO_FR_FR,
      SUPORTE_SCREENS_FR_FR,
      AERO_DIRETRIZ_FR_FR,
      CONFORMIDADE_HABILITACAO_FR_FR,
      CONFORMIDADE_SGQ_FR_FR,
      ESTOQUE_ETIQUETA_PRINT_FR_FR,
      THERMAL_PRINT_SETUP_FR_FR,
      UI_PREMIUM_FR_FR,
      BACKUP_CONFIG_FR_FR,
      CHAT_I18N_FR_FR,
      API_BACKEND_I18N_FR_FR,
      PROPOSTA_API_FR_FR,
      PAGE_HELP_I18N_FR_FR,
      FCU_ASSEMBLY_SHELL_FR_FR,
      ONBOARDING_I18N_FR_FR,
      CONFIGURACAO_EMPRESA_FR_FR,
      EXTERNO_PORTAL_FR_FR,
      EXTERNO_PROPOSTAS_FR_FR,
      EXTERNO_OS_DETAIL_I18N_FR_FR,
      GO_LIVE_MIGRACAO_FR_FR,
      DOSSIE_AUDITORIA_FR_FR,
      OS_CRS_FR_FR,
      BLING_WIZARD_FR_FR,
      WHATSAPP_WIZARD_FR_FR,
      ESTOQUE_RASTREIO_FR_FR,
      AERO_STUDIO_FR_FR,
      VITRINE_I18N_FR_FR,
      LOCALE_I18N_FR_FR,
      TENANTS_I18N_FR_FR,
      PLATFORM_OPS_I18N_FR_FR,
      ONBOARDING_PUBLIC_I18N_FR_FR,
      TENANT_FEATURES_I18N_FR_FR,
      P1_I18N_FR_FR,
      FOOTER_HEALTH_I18N_FR_FR
    );

    // Carregar idioma salvo
    const prefs = this.appearanceService.getPreferences();
    const initialLang = prefs.language || 'pt-BR';
    this.currentLanguage$.next(initialLang);
    
    // Escutar mudanças no idioma
    this.appearanceService.preferences$.subscribe(prefs => {
      const newLang = prefs.language || 'pt-BR';
      if (newLang !== this.currentLanguage$.value) {
        this.currentLanguage$.next(newLang);
        this.updateDocumentLanguage(newLang);
      }
    });
    
    // Aplicar idioma inicial
    this.updateDocumentLanguage(initialLang);
  }

  /**
   * Toast PrimeNG com summary/detail traduzidos por chave.
   */
  addToast(
    messageService: MessageService,
    severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast',
    summaryKey: string,
    detailKey?: string,
    detailParams?: { [key: string]: string }
  ): void {
    const life = severity === 'error' ? 8000 : severity === 'warn' ? 5000 : 4000;
    messageService.add({
      severity,
      summary: this.translate(summaryKey),
      detail: detailKey != null ? this.translate(detailKey, detailParams) : undefined,
      life,
    });
  }

  /**
   * Summary por chave e texto de detail já resolvido (ex.: mensagem da API).
   */
  addToastLiteralDetail(
    messageService: MessageService,
    severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast',
    summaryKey: string,
    detail: string
  ): void {
    const life = severity === 'error' ? 8000 : severity === 'warn' ? 5000 : 4000;
    messageService.add({
      severity,
      summary: this.translate(summaryKey),
      detail,
      life,
    });
  }

  /**
   * Traduz textos de toast/confirmação: (1) chaves i18n segmentadas; (2) mapa PT→EN/ES/FR;
   * (3) texto literal. Para mensagens com variáveis use translate('chave', { param }) no call site
   * e passe o resultado em summary/detail (já localizado).
   */
  translateToastPhrase(text: string | null | undefined): string {
    if (text == null || text === '') {
      return '';
    }
    const trimmed = text.trim();
    if (this.looksLikeI18nKey(trimmed)) {
      const byKey = this.translate(trimmed);
      if (byKey !== trimmed) {
        return byKey;
      }
    }
    const lang = this.currentLanguage$.value;
    if (lang === 'pt-BR') {
      return text;
    }
    const row = TOAST_PHRASE_MAP[text];
    if (row) {
      if (lang === 'en-US') {
        return row.enUS;
      }
      if (lang === 'es-ES') {
        return row.esES;
      }
      if (lang === 'fr-FR') {
        return row.frFR;
      }
    }
    return text;
  }

  /**
   * Chave no estilo modulo.secao.campo (sem espaços), p.ex. common.toast.success
   */
  private looksLikeI18nKey(text: string): boolean {
    const s = text.trim();
    if (!s || /\s/.test(s)) {
      return false;
    }
    return /^([a-z][a-z0-9_-]*)(\.[a-z][a-z0-9_-]*)+$/i.test(s);
  }

  /** Normaliza texto de BD/enums para sufixo de chave i18n (ex.: "Mecânico" → MECANICO). */
  slugForI18n(value: string): string {
    return value
      .trim()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Traduz valor de catálogo (perfil.label, lote.status, ticket.status, …).
   * Tenta código e fallback (nome) antes de devolver o texto original.
   */
  translateCatalog(
    catalog: string,
    codeOrName?: string | null,
    fallback?: string | null
  ): string {
    const candidates = [codeOrName, fallback].filter(
      (v): v is string => typeof v === 'string' && v.trim().length > 0
    );
    for (const raw of candidates) {
      const slug = this.slugForI18n(raw);
      if (!slug) {
        continue;
      }
      const key = `${catalog}.${slug}`;
      const t = this.translate(key);
      if (t !== key) {
        return t;
      }
    }
    const fb = (fallback ?? codeOrName ?? '').trim();
    return fb;
  }

  /** Perfil/role exibido na UI (código, nome ou role legado). */
  translatePerfil(
    codigo?: string | null,
    nome?: string | null,
    role?: string | null
  ): string {
    for (const candidate of [codigo, nome, role]) {
      if (!candidate?.trim()) {
        continue;
      }
      const slug = this.slugForI18n(candidate);
      if (!slug) {
        continue;
      }
      const key = `perfil.label.${slug}`;
      const t = this.translate(key);
      if (t !== key) {
        return t;
      }
    }
    return (nome?.trim() || role?.trim() || codigo?.trim() || '');
  }

  translateBrandingTagline(): string {
    return this.translate('login.tagline');
  }

  /** Opções de dropdown/select com rótulos traduzidos por catálogo (ex.: lote.status). */
  buildTranslatedOptions<T extends string>(
    catalog: string,
    options: readonly { label: string; value: T }[]
  ): { label: string; value: T }[] {
    return options.map((o) => ({
      value: o.value,
      label: this.translateCatalog(catalog, String(o.value), o.label)
    }));
  }

  /** Rótulo do menu lateral por código de funcionalidade (fallback = nome da API). */
  translateMenuFunc(codigo: string | null | undefined, fallback: string): string {
    const variants = menuFuncCodigoVariants(codigo);
    if (variants.length === 0) {
      return looksLikeCorruptedMenuText(fallback) ? '' : fallback;
    }
    for (const c of variants) {
      const key = `menu.func.${c}`;
      const t = this.translate(key);
      if (t !== key) {
        return t;
      }
    }
    const legacy = `menu.func.${canonFuncionalidadeCodigo(codigo)}`;
    const tLegacy = this.translate(legacy);
    if (tLegacy !== legacy) {
      return tLegacy;
    }
    return looksLikeCorruptedMenuText(fallback) ? '' : fallback;
  }

  /** Título da secção do menu (fallback = nome da API). */
  translateMenuSecao(secao: string | null | undefined): string {
    if (!secao?.trim()) {
      return secao ?? '';
    }
    const slug = slugifyMenuSection(secao);
    const key = `menu.section.${slug}`;
    const t = this.translate(key);
    if (t !== key) {
      return t;
    }
    if (looksLikeCorruptedMenuText(secao) || looksLikeCorruptedMenuText(slug)) {
      return '';
    }
    // Evita exibir códigos SCREAMING_SNAKE crus quando não há chave i18n.
    if (/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(slug) && slug === secao.trim().toUpperCase()) {
      return slug.replace(/_/g, ' ');
    }
    return secao;
  }

  translate(key: string, params?: { [key: string]: string }): string {
    const lang = this.currentLanguage$.value;
    const translation = this.getTranslation(key, lang);
    
    if (translation === key && lang !== 'pt-BR' && this.looksLikeI18nKey(key)) {
      console.warn(`Translation not found for key "${key}" in locale "${lang}"`);
    }
    
    if (params) {
      return this.interpolate(translation, params);
    }
    
    return translation;
  }

  /** Traduz chave i18n vinda do corpo de erro HTTP (`error` / `message` / `code`). */
  translateApiError(errorBody: unknown, fallbackKey: string): string {
    if (errorBody && typeof errorBody === 'object') {
      const msg = (errorBody as Record<string, unknown>)['message'];
      if (typeof msg === 'string' && msg.length > 0) {
        const fromBackend = translateBackendI18nMessage(this, msg);
        if (fromBackend && fromBackend !== msg) {
          return fromBackend;
        }
      }
    }
    const key = extractApiErrorKey(errorBody);
    if (key) {
      const t = this.translate(key);
      if (t !== key) {
        return t;
      }
    }
    if (errorBody && typeof errorBody === 'object') {
      const status = (errorBody as { status?: number }).status;
      if (status === 401 || status === 403) {
        return this.translate('ui.error.unauthorized');
      }
      if (status === 404) {
        return this.translate('ui.error.notFound');
      }
      if (status != null && status >= 500) {
        return this.translate('ui.error.network');
      }
      if (status === 0) {
        return this.translate('ui.error.network');
      }
    }
    const fb = this.translate(fallbackKey);
    return fb !== fallbackKey ? fb : this.translate('ui.error.generic');
  }

  /**
   * Obtém o idioma atual
   */
  getCurrentLanguage(): string {
    return this.currentLanguage$.value;
  }

  /**
   * Observable do idioma atual
   */
  getCurrentLanguage$(): Observable<string> {
    return this.currentLanguage$.asObservable();
  }

  /**
   * Busca tradução no dicionário
   */
  private getTranslation(key: string, lang: string): string {
    const primary = this.translations[lang];
    if (primary && typeof primary === 'object' && key in primary) {
      const translation = primary[key];
      return typeof translation === 'string' ? translation : key;
    }

    const fallbackLocales: string[] =
      lang === 'es-ES' || lang === 'fr-FR'
        ? ['en-US', 'pt-BR']
        : lang === 'en-US'
          ? ['pt-BR']
          : ['en-US'];

    for (const fbLang of fallbackLocales) {
      if (fbLang === lang) {
        continue;
      }
      const fb = this.translations[fbLang];
      if (fb && typeof fb === 'object' && key in fb) {
        const translation = fb[key];
        return typeof translation === 'string' ? translation : key;
      }
    }

    return key;
  }

  /**
   * Interpola parâmetros na string de tradução
   */
  private interpolate(text: string, params: { [key: string]: string }): string {
    let result = text;
    for (const key in params) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), params[key]);
    }
    return result;
  }

  /**
   * Atualiza o atributo lang do documento HTML
   */
  private updateDocumentLanguage(lang: string): void {
    document.documentElement.lang = lang;
  }
}

