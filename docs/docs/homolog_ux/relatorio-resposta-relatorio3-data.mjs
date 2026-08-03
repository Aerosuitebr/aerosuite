/** Dados estruturados — Relatório 3 / Onboarding Sessão 2 (F01–F14, 16/jun/2026). */
export const META = {
  title: 'Resposta Técnica — Homologação UX Onboarding (Relatório 3)',
  subtitle: 'Retorno formal aos 14 findings do fluxo de onboarding completo',
  reference: 'Relatório Técnico de Análise de Usabilidade — Sessão 2 · Onboarding (16/jun/2026)',
  reportPath: 'D:/Desenvolvimento/homologacao/relatorio 3/Relatorio AeroSuite.pdf',
  version: '1.0',
  date: '16 de junho de 2026',
  site: 'https://app.aerosuite.com.br',
  analyst: 'Wellem Lyra',
  role: 'Diretor de TI',
  org: 'Aero Suite',
  consultant: 'Rafaella Nottes — Rafaella Nottes Consultoria',
  verificationAt: '2026-06-16',
  score: { total: 14, corrected: 14, positive: 0, pending: 0 },
};

export const SECTIONS = [
  {
    id: '1',
    title: 'Onboarding — Cadastro, Login e Assistente da Empresa',
    intro: 'Findings F01–F14 sobre trial expirado, LGPD, marca, contatos, endereço, revisão e aceite de termos.',
  },
];

export const ITEMS = [
  {
    id: 'F01',
    section: '1',
    sev: 'ALTO',
    module: 'Login pós-trial',
    title: 'Trial expirado bloqueia acesso sem CTA de conversão',
    observation:
      'Após expiração do trial, o sistema exibe mensagem de assinatura inativa sem botão de renovação ou contratação.',
    resolution:
      'login.component.ts exibe CTA "Assinar agora" (/billing) e link comercial quando code=SUBSCRIPTION_INACTIVE.',
    verify: 'Manual — login com tenant expirado exibe CTA de conversão.',
  },
  {
    id: 'F02',
    section: '1',
    sev: 'ALTO',
    module: 'Pós-cadastro trial',
    title: 'E-mail do usuário exposto em query string na URL pós-cadastro (risco LGPD)',
    observation: 'URL de redirecionamento continha email= em texto plano após criar conta trial.',
    resolution:
      'trial-signup grava e-mail em sessionStorage (aerosuite.trialSignupEmail); login consome e remove; URL só trialCreated=1.',
    verify: 'Código — ausência de queryParam email no navigate pós-signup.',
  },
  {
    id: 'F03',
    section: '1',
    sev: 'MEDIO',
    module: 'Assistente — Etapa Marca',
    title: 'Tagline/slogan pré-preenchida com o nome da organização',
    observation: 'Campo tagline era inferido automaticamente do nome comercial.',
    resolution:
      'TenantSignupService e wizard mantêm tagline vazia por padrão; placeholder orientativo sem inferência do nome.',
    verify: 'Código — tagline default vazio em createDefaultEmpresaConfig e draft.',
  },
  {
    id: 'F04',
    section: '1',
    sev: 'CRITICO',
    module: 'Assistente — Etapa Marca',
    title: 'Logo e wordmark carregam assets de outro tenant — falha multi-tenant',
    observation: 'URLs globais /api/public/empresa-asset/logo|wordmark serviam assets compartilhados entre organizações.',
    resolution:
      'Uploads por tenant (saveLogoForTenant/saveWordmarkForTenant); endpoints públicos por tenantCodigo; globais retornam 404; wizard inicia sem URL de asset alheio.',
    verify: 'API — GET /api/public/empresa-asset/logo retorna 404; upload grava em tenant-{id}.',
  },
  {
    id: 'F05',
    section: '1',
    sev: 'ALTO',
    module: 'Assistente — Etapa Marca',
    title: 'Cor primária alterada para preto (#000000) sem ação do usuário',
    observation: 'Color picker nativo podia emitir #000000 por race condition na inicialização.',
    resolution:
      'brand-primary-color-input ignora #000000 espúrio do input nativo quando a cor atual não é preta.',
    verify: 'Código — guard #000000 em onNativeInput.',
  },
  {
    id: 'F06',
    section: '1',
    sev: 'MEDIO',
    module: 'Assistente — Etapas 2 e 4',
    title: 'Elementos não interativos recebem borda de foco de formulário',
    observation: 'Blocos descritivos e área de botões exibiam outline verde indevido.',
    resolution:
      'SCSS do wizard remove outline/box-shadow de .form-hint, .wizard-header__sub, .wizard-review__intro e .wizard-actions.',
    verify: 'Código — regras outline: none nos elementos informativos.',
  },
  {
    id: 'F07',
    section: '1',
    sev: 'ALTO',
    module: 'Assistente — Etapa Contatos',
    title: 'E-mail de contato pré-preenchido com domínio .local inválido',
    observation: 'Sistema gerava contato@org.local automaticamente no signup.',
    resolution:
      'createDefaultEmpresaConfig usa e-mail do administrador do trial; sem domínio .local; validação isValidBusinessEmail no wizard.',
    verify: 'Código — TenantSignupService sem ".local" em supportEmail.',
  },
  {
    id: 'F08',
    section: '1',
    sev: 'ALTO',
    module: 'Assistente — Etapa Contatos',
    title: 'Campo telefone aceita texto livre e não valida em tempo real',
    observation: 'Campo aceitava letras; validação só no avanço de etapa.',
    resolution: 'onTelefoneInput + formatPhoneBr restringe a dígitos com máscara BR; validação isValidPhoneBr na etapa 2.',
    verify: 'Código — formatPhoneBr e onTelefoneInput no wizard.',
  },
  {
    id: 'F09',
    section: '1',
    sev: 'ALTO',
    module: 'Assistente — Etapa Contatos',
    title: 'Campo telefone não limita quantidade de dígitos',
    observation: 'Sequência de dígitos acima de 11 caracteres era aceita.',
    resolution: 'formatPhoneBr limita a 11 dígitos; maxlength=15 no input (máscara formatada).',
    verify: 'Código — slice(0, 11) em br-input.util.ts.',
  },
  {
    id: 'F10',
    section: '1',
    sev: 'MEDIO',
    module: 'Assistente — Etapa Contatos',
    title: 'Toast de erro sem auto-dismiss adequado',
    observation: 'Toasts de validação permaneciam indefinidamente na tela.',
    resolution:
      'TranslationService.addToast define life 5000ms (warn) / 4000ms (success); clearFieldError limpa toasts ao corrigir campo.',
    verify: 'Código — life em addToast e messages.clear em clearFieldError.',
  },
  {
    id: 'F11',
    section: '1',
    sev: 'MEDIO',
    module: 'Assistente — Dados da Empresa',
    title: 'Campo Complemento de endereço sem limite de caracteres',
    observation: 'Complemento aceitava strings excessivamente longas.',
    resolution: 'maxlength=60 no frontend; trimMax(60) no backend SistemaEmpresaConfigService.',
    verify: 'Código — maxlength complemento + trimMax backend.',
  },
  {
    id: 'F12',
    section: '1',
    sev: 'MEDIO',
    module: 'Assistente — Etapa Revisão',
    title: 'Botões da revisão desalinhados e com borda visual indevida',
    observation: 'Botão principal em linha separada; classe login-button causava layout inconsistente.',
    resolution:
      'Botões do wizard usam p-button-primary wizard-btn-primary em linha única; outline removido da barra de ações.',
    verify: 'Código — wizard-actions sem login-button no primário.',
  },
  {
    id: 'F13',
    section: '1',
    sev: 'MEDIO',
    module: 'Assistente — Etapa Revisão',
    title: 'Resumo exibe tagline idêntica ao nome e swatch de cor sem contexto',
    observation: 'Revisão não rotulava cor primária nem alertava tagline duplicada.',
    resolution:
      'Label i18n "Cor primária: {{color}}"; aviso quando tagline === displayName; tagline omitida se vazia.',
    verify: 'Código — wizard-review__color-label e taglineDuplicatesName.',
  },
  {
    id: 'F14',
    section: '1',
    sev: 'MEDIO',
    module: 'Cadastro Trial',
    title: 'Checkbox de aceite permite marcação sem abertura dos documentos',
    observation: 'Aceite podia ser marcado sem clicar em Termos e Privacidade.',
    resolution:
      'markLegalDocOpened rastreia abertura; checkbox desabilitado até ambos lidos; mensagem p1.signup.legalRequired.',
    verify: 'Código — legalDocsOpened e markLegalDocOpened em trial-signup.',
  },
];
