import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { AuthExternoGuard } from './auth/auth-externo.guard';
import { FuncionalidadeGuard } from './auth/funcionalidade.guard';
import { PlatformOperatorGuard } from './auth/platform-operator.guard';
import { platformOpsGuard } from './platform-ops/platform-ops.guard';
import { empresaOnboardingGuard } from './auth/empresa-onboarding.guard';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  // ========================================
  // Rotas Públicas - Usuário Interno
  // ========================================
  {
    path: 'login',
    loadComponent: () =>
      import(/* webpackChunkName: "auth-internal" */ './auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import(/* webpackChunkName: "auth-internal" */ './auth/forgot-password/forgot-password.component').then(
        m => m.ForgotPasswordComponent
      )
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import(/* webpackChunkName: "auth-internal" */ './auth/reset-password/reset-password.component').then(
        m => m.ResetPasswordComponent
      )
  },
  {
    path: 'setup-password',
    loadComponent: () =>
      import(/* webpackChunkName: "auth-internal" */ './auth/setup-password/setup-password.component').then(
        m => m.SetupPasswordComponent
      )
  },
  {
    path: 'cadastro-trial',
    loadComponent: () => import('./p1/trial-signup.component').then(m => m.TrialSignupComponent)
  },
  {
    path: 'onboarding/:token',
    loadComponent: () =>
      import('./onboarding-public/public-onboarding-form.component').then(m => m.PublicOnboardingFormComponent)
  },
  {
    path: 'termos',
    loadComponent: () => import('./p1/public-legal.component').then(m => m.PublicLegalComponent),
    data: { legalTipo: 'termos' }
  },
  {
    path: 'privacidade',
    loadComponent: () => import('./p1/public-legal.component').then(m => m.PublicLegalComponent),
    data: { legalTipo: 'privacidade' }
  },
  {
    path: 'rastreio/:codigo',
    loadComponent: () =>
      import('./estoque/estoque-item-peek-public/estoque-item-peek-public.component').then(
        m => m.EstoqueItemPeekPublicComponent
      )
  },
  {
    path: 'change-password-first-login',
    loadComponent: () =>
      import(
        /* webpackChunkName: "auth-internal" */ './auth/change-password-first-login/change-password-first-login.component'
      ).then(m => m.ChangePasswordFirstLoginComponent)
  },
  {
    path: 'mfa-setup',
    loadComponent: () =>
      import(/* webpackChunkName: "auth-internal" */ './auth/mfa-setup/mfa-setup.component').then(
        m => m.MfaSetupComponent
      )
  },
  {
    path: 'plataforma/acesso',
    loadComponent: () =>
      import('./platform-ops/platform-ops-login.component').then(m => m.PlatformOpsLoginComponent)
  },
  {
    path: 'plataforma',
    loadComponent: () =>
      import('./platform-ops/platform-ops-shell.component').then(m => m.PlatformOpsShellComponent),
    canActivate: [platformOpsGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'console' },
      {
        path: 'console',
        loadComponent: () =>
          import('./platform-ops/platform-ops-console.component').then(m => m.PlatformOpsConsoleComponent)
      },
      {
        path: 'auditoria',
        loadComponent: () =>
          import('./organizacoes/access-audit-page.component').then(m => m.AccessAuditPageComponent)
      },
      {
        path: 'pagamentos',
        loadComponent: () =>
          import('./platform-ops/platform-ops-billing.component').then(m => m.PlatformOpsBillingComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./platform-ops/platform-ops-users.component').then(m => m.PlatformOpsUsersComponent)
      },
      {
        path: 'operadores',
        loadComponent: () =>
          import('./platform-ops/platform-ops-operators.component').then(m => m.PlatformOpsOperatorsComponent)
      },
      {
        path: 'boas-vindas',
        loadComponent: () =>
          import('./platform-ops/platform-ops-onboarding.component').then(m => m.PlatformOpsOnboardingComponent)
      },
      {
        path: 'backup',
        loadComponent: () =>
          import('./platform-ops/platform-ops-backup.component').then(m => m.PlatformOpsBackupComponent)
      },
      {
        path: 'configuracoes-sistema',
        loadComponent: () =>
          import('./platform-ops/platform-ops-system-settings.component').then(
            m => m.PlatformOpsSystemSettingsComponent
          )
      },
      {
        path: 'organizacoes',
        loadComponent: () =>
          import('./organizacoes/organizacoes.component').then(m => m.OrganizacoesComponent),
        canActivate: [PlatformOperatorGuard],
        data: { perm: { funcionalidadesAny: ['GERENCIAR_PERMISSOES'] } }
      }
    ]
  },
  {
    path: 'configuracao-empresa-inicial',
    loadComponent: () =>
      import('./configuracao-empresa/configuracao-empresa-inicial.component').then(m => m.ConfiguracaoEmpresaInicialComponent),
    canActivate: [AuthGuard],
  },

  // ========================================
  // Rotas do Portal Externo (Clientes)
  // ========================================
  {
    path: 'externo/login',
    loadComponent: () =>
      import(/* webpackChunkName: "externo-auth" */ './externo/externo-login/externo-login.component').then(
        m => m.ExternoLoginComponent
      )
  },
  {
    path: 'externo/setup-password',
    loadComponent: () =>
      import(/* webpackChunkName: "externo-auth" */ './externo/externo-setup-password/externo-setup-password.component').then(
        m => m.ExternoSetupPasswordComponent
      )
  },
  {
    path: 'externo/forgot-password',
    loadComponent: () =>
      import(/* webpackChunkName: "externo-auth" */ './externo/externo-forgot-password/externo-forgot-password.component').then(
        m => m.ExternoForgotPasswordComponent
      )
  },
  {
    path: 'externo/change-password',
    loadComponent: () =>
      import(/* webpackChunkName: "externo-auth" */ './externo/externo-change-password/externo-change-password.component').then(
        m => m.ExternoChangePasswordComponent
      )
  },
  {
    path: 'externo',
    loadComponent: () => import('./externo/externo-layout/externo-layout.component').then(m => m.ExternoLayoutComponent),
    canActivate: [AuthExternoGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./externo/externo-home/externo-home.component').then(m => m.ExternoHomeComponent)
      },
      {
        path: 'os',
        loadComponent: () => import('./externo/externo-os/externo-os-list.component').then(m => m.ExternoOSListComponent)
      },
      {
        path: 'os/:id',
        loadComponent: () => import('./externo/externo-os/externo-os-detail.component').then(m => m.ExternoOSDetailComponent)
      },
      {
        path: 'capacidade',
        loadComponent: () =>
          import('./externo/externo-capacidade/externo-capacidade.component').then(m => m.ExternoCapacidadeComponent)
      },
      {
        path: 'propostas',
        loadComponent: () =>
          import('./externo/externo-propostas/externo-propostas-list.component').then(m => m.ExternoPropostasListComponent)
      },
      {
        path: 'propostas/:id',
        loadComponent: () =>
          import('./externo/externo-propostas/externo-proposta-detail.component').then(m => m.ExternoPropostaDetailComponent)
      },
      {
        path: 'documentos',
        loadComponent: () => import('./externo/externo-documentos/externo-documentos.component').then(m => m.ExternoDocumentosComponent)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./externo/externo-perfil/externo-perfil.component').then(m => m.ExternoPerfilComponent)
      }
    ]
  },
  
  // ========================================
  // Rotas Protegidas - Usuário Interno
  // ========================================
  {
    path: '',
    loadComponent: () => import('./app-layout/app-layout.component').then(m => m.AppLayoutComponent),
    canActivate: [AuthGuard, empresaOnboardingGuard],
    children: [
      {
        path: '',
        // Home eager: evita lazy chunk inconsistente (runtime .call em módulo undefined).
        component: HomeComponent,
      },
      {
        path: 'perfil',
        loadComponent: () => import('./perfil/perfil.component').then(m => m.PerfilUsuarioComponent)
      },
      {
        path: 'fcu-assembly',
        loadComponent: () => import('./fcu-assembly/fcu-assembly-editor.component').then(m => m.FcuAssemblyEditorComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['EDITOR_DOCUMENTOS'] } }
      },
      {
        path: 'products/new',
        loadComponent: () => import('./products/product-new.component').then(m => m.ProductNewComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['PRODUTOS'] } }
      },
      {
        path: 'products/edit/:id',
        loadComponent: () => import('./products/product-new.component').then(m => m.ProductNewComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['PRODUTOS'] } }
      },
      {
        path: 'products',
        loadComponent: () => import('./products/product-list.component').then(m => m.ProductListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['PRODUTOS'] } }
      },
      {
        path: 'fcu/new',
        loadComponent: () => import('./fcu/fcu-new.component').then(m => m.FcuNewComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['FCU'] } }
      },
      {
        path: 'fcu/edit/:id',
        loadComponent: () => import('./fcu/fcu-new.component').then(m => m.FcuNewComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['FCU'] } }
      },
      {
        path: 'fcu',
        loadComponent: () => import('./fcu/fcu-list.component').then(m => m.FcuListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['FCU'] } }
      },
      {
        path: 'os',
        loadComponent: () => import('./os/os-list.component').then(m => m.OSListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['ORDEM_SERVICO'] } }
      },
      {
        path: 'capacidade',
        loadComponent: () =>
          import('./capacidade/capacidade-quadro.component').then(m => m.CapacidadeQuadroComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['QUADRO_CAPACIDADE', 'ORDEM_SERVICO'] } }
      },
      {
        path: 'capacidade/hangares',
        loadComponent: () =>
          import('./capacidade/capacidade-hangares.component').then(m => m.CapacidadeHangaresComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['QUADRO_CAPACIDADE', 'ORDEM_SERVICO'] } }
      },
      {
        path: 'hangar',
        loadComponent: () => import('./hangar/hangar-job-card.component').then(m => m.HangarJobCardComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['HANGAR_JOB_CARD', 'ORDEM_SERVICO'] } }
      },
      {
        path: 'hangar/:osId',
        loadComponent: () => import('./hangar/hangar-job-card.component').then(m => m.HangarJobCardComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['HANGAR_JOB_CARD', 'ORDEM_SERVICO'] } }
      },
      {
        path: 'aero/diretrizes',
        loadComponent: () =>
          import('./aero/diretrizes/aero-diretriz-list.component').then(m => m.AeroDiretrizListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['AD_SB_ALERTAS', 'ORDEM_SERVICO', 'FCU'] } }
      },
      {
        path: 'conformidade/painel',
        loadComponent: () =>
          import('./conformidade/painel/conformidade-painel.component').then(m => m.ConformidadePainelComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['CONFORMIDADE_PAINEL', 'SGQ_DOCUMENTO_CONTROLADO', 'CONFORMIDADE_NC'] } }
      },
      {
        path: 'conformidade/treinamentos-obrigatorios',
        loadComponent: () =>
          import('./conformidade/treinamentos-obrigatorios/treinamento-obrigatorio-list.component').then(
            m => m.TreinamentoObrigatorioListComponent
          ),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['CONFORMIDADE_TREINAMENTO_OBRIG', 'CONFORMIDADE_TREINAMENTO'] } }
      },
      {
        path: 'conformidade/habilitacoes',
        loadComponent: () =>
          import('./conformidade/habilitacoes/habilitacao-list.component').then(m => m.HabilitacaoListComponent),
        canActivate: [FuncionalidadeGuard],
        data: {
          perm: { funcionalidadesAny: ['HABILITACAO_TECNICA', 'GERENCIAR_PERMISSOES', 'USUARIOS'] }
        }
      },
      {
        path: 'conformidade/documentos',
        loadComponent: () =>
          import('./conformidade/documentos/sgq-documento-list.component').then(m => m.SgqDocumentoListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['SGQ_DOCUMENTO_CONTROLADO', 'GERENCIAR_PERMISSOES', 'DOSSIE_AUDITORIA'] } }
      },
      {
        path: 'conformidade/treinamentos',
        loadComponent: () =>
          import('./conformidade/treinamentos/treinamento-list.component').then(m => m.TreinamentoListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['CONFORMIDADE_TREINAMENTO', 'GERENCIAR_PERMISSOES', 'USUARIOS'] } }
      },
      {
        path: 'conformidade/calibracao',
        loadComponent: () =>
          import('./conformidade/calibracao/calibracao-list.component').then(m => m.CalibracaoListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['CONFORMIDADE_CALIBRACAO', 'GERENCIAR_PERMISSOES', 'DOSSIE_AUDITORIA'] } }
      },
      {
        path: 'conformidade/nao-conformidades',
        loadComponent: () =>
          import('./conformidade/nao-conformidades/nao-conformidade-list.component').then(m => m.NaoConformidadeListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['CONFORMIDADE_NC', 'GERENCIAR_PERMISSOES', 'DOSSIE_AUDITORIA'] } }
      },
      {
        path: 'conformidade/subcontratacao',
        loadComponent: () =>
          import('./conformidade/subcontratacao/subcontratacao-list.component').then(m => m.SubcontratacaoListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['CONFORMIDADE_SUBCONTRATACAO', 'GERENCIAR_PERMISSOES', 'DOSSIE_AUDITORIA'] } }
      },
      {
        path: 'conformidade/contingencia',
        loadComponent: () =>
          import('./conformidade/contingencia/contingencia-reconciliacao.component').then(
            m => m.ContingenciaReconciliacaoComponent
          ),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['CONFORMIDADE_PAINEL', 'CONFORMIDADE_NC', 'GERENCIAR_PERMISSOES', 'DOSSIE_AUDITORIA'] } }
      },
      {
        path: 'conformidade/releases',
        loadComponent: () =>
          import('./conformidade/releases/release-aceite.component').then(m => m.ReleaseAceiteComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['CONFORMIDADE_PAINEL', 'GERENCIAR_PERMISSOES', 'DOSSIE_AUDITORIA'] } }
      },
      {
        path: 'os-auditoria',
        loadComponent: () => import('./os/os-auditoria/os-auditoria-list.component').then(m => m.OSAuditoriaListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['ORDEM_SERVICO', 'CONSULTA_TROCAS_EVENTUAIS'] } }
      },
      {
        path: 'os/pendentes-pagamento-trocas',
        loadComponent: () => import('./os/os-pendentes-trocas-pagamento.component').then(m => m.OsPendentesTrocasPagamentoComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['ORDEM_SERVICO'] } }
      },
      {
        path: 'os/consulta-trocas-eventuais',
        loadComponent: () =>
          import('./os/os-consulta-trocas-eventuais.component').then(m => m.OsConsultaTrocasEventuaisComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['ORDEM_SERVICO', 'CONSULTA_TROCAS_EVENTUAIS'] } }
      },
      {
        path: 'tipos-servico/new',
        loadComponent: () => import('./tipos-servico/tipo-servico-new.component').then(m => m.TipoServicoNewComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['TIPOS_SERVICO'] } }
      },
      {
        path: 'tipos-servico/edit/:id',
        loadComponent: () => import('./tipos-servico/tipo-servico-new.component').then(m => m.TipoServicoNewComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['TIPOS_SERVICO'] } }
      },
      {
        path: 'tipos-servico',
        loadComponent: () => import('./tipos-servico/tipos-servico-list.component').then(m => m.TipoServicoListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['TIPOS_SERVICO'] } }
      },
      {
        path: 'usuarios/new',
        loadComponent: () => import('./usuarios/usuario-new.component').then(m => m.UsuarioNewComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['USUARIOS'] } }
      },
      {
        path: 'usuarios/edit/:id',
        loadComponent: () => import('./usuarios/usuario-new.component').then(m => m.UsuarioNewComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['USUARIOS'] } }
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./usuarios/usuario-list.component').then(m => m.UsuarioListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['USUARIOS'] } }
      },
      {
        path: 'tpfiles',
        loadComponent: () => import('./tpfiles/tpfiles-list.component').then(m => m.TpFilesListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['ARQUIVOS_TIPO_SERVICO'] } }
      },
      {
        path: 'fabricantes/new',
        loadComponent: () => import('./fabricantes/fabricante-new.component').then(m => m.FabricanteNewComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['FABRICANTES'] } }
      },
      {
        path: 'fabricantes/edit/:id',
        loadComponent: () => import('./fabricantes/fabricante-new.component').then(m => m.FabricanteNewComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['FABRICANTES'] } }
      },
      {
        path: 'fabricantes',
        loadComponent: () => import('./fabricantes/fabricante-list.component').then(m => m.FabricanteListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['FABRICANTES'] } }
      },
      {
        path: 'associacao-fcu',
        loadComponent: () => import('./associacao-fcu/associacao-fcu.component').then(m => m.AssociacaoFcuComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['ASSOCIACAO_FCU'] } }
      },
      {
        path: 'controle-acesso',
        loadComponent: () => import('./controle-acesso/controle-acesso.component').then(m => m.ControleAcessoComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['GERENCIAR_PERMISSOES'] } }
      },
      {
        path: 'go-live-migracao',
        loadComponent: () =>
          import('./go-live/go-live-migracao.component').then(m => m.GoLiveMigracaoComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['GO_LIVE_MIGRACAO', 'GERENCIAR_PERMISSOES'] } }
      },
      {
        path: 'dossie-auditoria',
        loadComponent: () =>
          import('./dossie-auditoria/dossie-auditoria.component').then(m => m.DossieAuditoriaComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['DOSSIE_AUDITORIA', 'ORDEM_SERVICO', 'GERENCIAR_PERMISSOES'] } }
      },
      {
        path: 'studio',
        loadComponent: () => import('./studio/aero-studio.component').then(m => m.AeroStudioComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['STUDIO_MARCA', 'CONFIGURACOES', 'GERENCIAR_PERMISSOES'] } }
      },
      {
        path: 'organizacoes',
        redirectTo: '/plataforma/organizacoes',
        pathMatch: 'full'
      },
      {
        path: 'auditoria-acesso',
        redirectTo: '/plataforma/auditoria',
        pathMatch: 'full'
      },
      {
        path: 'billing',
        loadComponent: () => import('./p1/billing-page.component').then(m => m.BillingPageComponent)
      },
      {
        path: 'privacidade-dados',
        loadComponent: () =>
          import('./p1/privacidade-portal.component').then(m => m.PrivacidadePortalComponent)
      },
      {
        path: 'funcionalidades',
        loadComponent: () => import('./funcionalidades/funcionalidade-list.component').then(m => m.FuncionalidadeListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['GERENCIAR_PERMISSOES', 'FUNCIONALIDADES'] } }
      },
      {
        path: 'perfis',
        loadComponent: () => import('./perfis/perfil-list.component').then(m => m.PerfilListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['GERENCIAR_PERMISSOES', 'PERFIS'] } }
      },
      {
        path: 'biblioteca',
        loadComponent: () => import('./biblioteca/biblioteca.component').then(m => m.BibliotecaComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['BIBLIOTECA'] } }
      },
      {
        path: 'relatorios',
        loadComponent: () => import('./relatorios/relatorios.component').then(m => m.RelatoriosComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['RELATORIO'] } }
      },
      {
        path: 'configuracoes',
        loadComponent: () => import('./configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['CONFIGURACOES'] } }
      },
      {
        path: 'integracoes/bling',
        loadComponent: () => import('./integracoes/integracoes-bling-page.component').then(m => m.IntegracoesBlingPageComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['CONFIGURACOES'] } }
      },
      {
        path: 'integracoes/whatsapp',
        loadComponent: () => import('./integracoes/integracoes-whatsapp-page.component').then(m => m.IntegracoesWhatsappPageComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['CONFIGURACOES'] } }
      },
      {
        path: 'settings/backup',
        redirectTo: '/plataforma/backup',
        pathMatch: 'full'
      },
      {
        path: 'associacao-usuario-perfil',
        loadComponent: () => import('./associacao-usuario-perfil/associacao-usuario-perfil.component').then(m => m.AssociacaoUsuarioPerfilComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['USUARIOS', 'GERENCIAR_PERMISSOES'] } }
      },
      {
        path: 'consulta-funcionalidades-usuario',
        loadComponent: () => import('./consulta-funcionalidades-usuario/consulta-funcionalidades-usuario.component').then(m => m.ConsultaFuncionalidadesUsuarioComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['GERENCIAR_PERMISSOES', 'USUARIOS'] } }
      },
      // ========================================
      // Seção Comercial
      // ========================================
      {
        path: 'propostas-comerciais',
        loadComponent: () => import('./comercial/proposta-comercial-list.component').then(m => m.PropostaComercialListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['propostas-comerciais'] } }
      },
      {
        path: 'propostas-comerciais/new',
        loadComponent: () => import('./comercial/proposta-comercial.component').then(m => m.PropostaComercialComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['propostas-comerciais'] } }
      },
      {
        path: 'propostas-comerciais/:id',
        loadComponent: () => import('./comercial/proposta-comercial.component').then(m => m.PropostaComercialComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['propostas-comerciais'] } }
      },
      {
        path: 'templates-proposta',
        loadComponent: () => import('./comercial/template-list.component').then(m => m.TemplateListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['templates-proposta'] } }
      },
      
      // Gestão de Usuários Externos (Admin)
      {
        path: 'usuarios-externos',
        loadComponent: () => import('./usuarios-externos/usuarios-externos-list.component').then(m => m.UsuariosExternosListComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['usuarios-externos'] } }
      },
      {
        path: 'usuarios-externos/new',
        loadComponent: () => import('./usuarios-externos/usuario-externo-form.component').then(m => m.UsuarioExternoFormComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['usuarios-externos'] } }
      },
      {
        path: 'usuarios-externos/:id',
        loadComponent: () => import('./usuarios-externos/usuario-externo-form.component').then(m => m.UsuarioExternoFormComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['usuarios-externos'] } }
      },
      {
        path: 'usuarios-externos/:id/permissoes',
        loadComponent: () => import('./usuarios-externos/usuario-externo-permissoes.component').then(m => m.UsuarioExternoPermissoesComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesAny: ['usuarios-externos'] } }
      },
      
      // ========================================
      // Seção Publicações Técnicas
      // ========================================
      {
        path: 'publicacoes-tecnicas/cadastro',
        loadComponent: () => import('./publicacoes-tecnicas/publicacao-tecnica-list.component').then(m => m.PublicacaoTecnicaListComponent),
        canActivate: [FuncionalidadeGuard],
        data: {
          perm: {
            funcionalidadesAny: [
              'PUBLICACOES_TECNICAS',
              'PUBLICACAO_CADASTRO',
              'PUBLICACAO_ASSOCIAR_PN',
            ],
          },
        },
      },
      {
        path: 'publicacoes-tecnicas/associar-pn',
        loadComponent: () => import('./publicacoes-tecnicas/associar-pn.component').then(m => m.AssociarPnComponent),
        canActivate: [FuncionalidadeGuard],
        data: {
          perm: {
            funcionalidadesAny: [
              'PUBLICACOES_TECNICAS',
              'PUBLICACAO_CADASTRO',
              'PUBLICACAO_ASSOCIAR_PN',
            ],
          },
        },
      },
      {
        path: 'vitrine',
        loadComponent: () => import('./vitrine/vitrine.component').then(m => m.VitrineComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesPrefix: ['VITRINE'] } }
      },
      {
        path: 'vitrine/:id',
        loadComponent: () =>
          import('./vitrine/vitrine-player.component').then(m => m.VitrinePlayerComponent),
        canActivate: [FuncionalidadeGuard],
        data: { perm: { funcionalidadesPrefix: ['VITRINE'] } }
      },
      
    ]
  },
  
  // ========================================
  // Módulo Suporte - Central de Chamados
  // ========================================
  {
    path: 'suporte',
    loadComponent: () => import('./suporte/suporte-layout.component').then(m => m.SuporteLayoutComponent),
    canActivate: [AuthGuard, FuncionalidadeGuard],
    data: {
      perm: {
        funcionalidadesAny: ['suporte', 'suporte-chamados', 'suporte-novo', 'suporte-atendimento'],
      },
    },
    children: [
      {
        path: '',
        loadComponent: () => import('./suporte/ticket-list.component').then(m => m.TicketListComponent)
      },
      {
        path: 'chamados',
        loadComponent: () => import('./suporte/ticket-list.component').then(m => m.TicketListComponent)
      },
      {
        path: 'novo',
        loadComponent: () => import('./suporte/ticket-new.component').then(m => m.TicketNewComponent)
      },
      {
        path: 'chamados/:id',
        loadComponent: () => import('./suporte/ticket-detail.component').then(m => m.TicketDetailComponent)
      },
      {
        path: 'atendimento',
        loadComponent: () => import('./suporte/ticket-atendimento-list.component').then(m => m.TicketAtendimentoListComponent)
      },
      {
        path: 'atendimento/:id',
        loadComponent: () => import('./suporte/ticket-atendimento.component').then(m => m.TicketAtendimentoComponent)
      }
    ]
  },
  
  // ========================================
  // Módulo Chat - Comunicação Interna
  // ========================================
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat-layout.component').then(m => m.ChatLayoutComponent),
    canActivate: [AuthGuard, FuncionalidadeGuard],
    data: { perm: { funcionalidadesAny: ['chat'] } }
  },
  
  // ========================================
  // Módulo Estoque - Layout Exclusivo
  // ========================================
  {
    path: 'estoque',
    loadComponent: () => import('./estoque/estoque-layout/estoque-layout.component').then(m => m.EstoqueLayoutComponent),
    canActivate: [AuthGuard, FuncionalidadeGuard],
    data: { perm: { funcionalidadesPrefix: ['ESTOQUE'] } },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./estoque/dashboard/estoque-dashboard.component').then(m => m.EstoqueDashboardComponent)
      },
      {
        path: 'consulta-qr',
        loadComponent: () => import('./estoque/consulta-qr/consulta-qr.component').then(m => m.ConsultaQrComponent)
      },
      {
        path: 'rastreio',
        loadComponent: () =>
          import('./estoque/rastreio-peca/rastreio-peca.component').then(m => m.RastreioPecaComponent)
      },
      {
        path: 'rastreio/:codigo',
        loadComponent: () =>
          import('./estoque/rastreio-peca/rastreio-peca.component').then(m => m.RastreioPecaComponent)
      },
      {
        path: 'entrada',
        loadComponent: () => import('./estoque/entrada/entrada-mercadoria.component').then(m => m.EntradaMercadoriaComponent)
      },
      {
        path: 'itens',
        loadComponent: () => import('./estoque/itens/item-estoque-list.component').then(m => m.ItemEstoqueListComponent)
      },
      {
        path: 'quarentena',
        loadComponent: () => import('./estoque/quarentena/quarentena-list.component').then(m => m.QuarentenaListComponent)
      },
      {
        path: 'saidas',
        loadComponent: () => import('./estoque/saidas/saida-estoque.component').then(m => m.SaidaEstoqueComponent)
      },
      {
        path: 'estoque-minimo-lote',
        loadComponent: () => import('./estoque/estoque-minimo-lote/estoque-minimo-lote.component').then(m => m.EstoqueMinimoLoteComponent)
      },
      {
        path: 'invoices',
        loadComponent: () => import('./estoque/invoices/invoice-list.component').then(m => m.InvoiceListComponent)
      },
      {
        path: 'invoices/:id',
        loadComponent: () => import('./estoque/invoices/invoice-detail.component').then(m => m.InvoiceDetailComponent)
      },
      {
        path: 'fornecedores',
        loadComponent: () => import('./estoque/fornecedores/fornecedor-list.component').then(m => m.FornecedorListComponent)
      },
      {
        path: 'lotes',
        loadComponent: () => import('./estoque/lotes/lote-list.component').then(m => m.LoteListComponent)
      },
      {
        path: 'movimentacoes',
        loadComponent: () => import('./estoque/movimentacoes/movimentacao-list.component').then(m => m.MovimentacaoListComponent)
      },
      {
        path: 'rastreio-saidas-automaticas',
        loadComponent: () =>
          import('./estoque/rastreio-saidas-automaticas/rastreio-saidas-automaticas.component').then(
            m => m.RastreioSaidasAutomaticasComponent
          )
      }
    ]
  },
  {
    path: 'dashboard',
    pathMatch: 'full',
    redirectTo: '',
  },
  {
    path: '**',
    loadComponent: () => import('./auth/redirect-handler/redirect-handler.component').then(m => m.RedirectHandlerComponent)
  }
];
