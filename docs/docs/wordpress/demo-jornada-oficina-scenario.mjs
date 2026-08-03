/**
 * Roteiro da jornada: oficina → cadastro → onboarding → módulos.
 * Usado por apresentacao-jornada-oficina.html (referência) e record-demo-jornada-oficina.mjs.
 */

export const JORNADA_META = {
  title: 'Jornada da oficina na Aero Suite',
  subtitle: 'Do primeiro contato ao hangar digital',
  appBase: 'https://app.aerosuite.com.br',
  siteBase: 'https://aerosuite.com.br',
};

/** Slides / capítulos para apresentação e guia de edição de vídeo. */
export const JORNADA_SLIDES = [
  {
    id: 'capa',
    act: 1,
    title: 'Jornada da oficina',
    headline: 'Do site ao hangar digital em poucos passos',
    narrative:
      'Apresentação da jornada completa: como uma oficina MRO entra em contato com a Aero Suite, cria sua organização e passa a operar OS, estoque e comercial na mesma plataforma.',
    onScreen: 'Logo Aero Suite + título',
    clipHint: '3–5 s · fade in',
    route: null,
  },
  {
    id: 'descoberta',
    act: 1,
    title: '1 · Primeiro contato',
    headline: 'Site, demonstração ou trial de 7 dias',
    narrative:
      'A oficina conhece a Aero Suite pelo site institucional (aerosuite.com.br), agenda demonstração em /contato ou inicia direto o trial em app.aerosuite.com.br/cadastro-trial.',
    onScreen: 'Home do site ou página Contato com Calendly',
    clipHint: '5–8 s · mostrar CTA “Agendar demonstração”',
    route: '/contato/',
    external: true,
  },
  {
    id: 'cadastro-trial',
    act: 2,
    title: '2 · Cadastro da organização',
    headline: 'Trial 7 dias — nome, admin e módulos',
    narrative:
      'No cadastro trial a oficina informa o nome da organização, e-mail e senha do administrador, e escolhe os módulos: MRO (ordens de serviço), Estoque e Comercial. Aceita termos e cria a conta.',
    onScreen: '/cadastro-trial — formulário completo',
    clipHint: '12–18 s · scroll suave pelos campos; destacar checkboxes de módulos',
    route: '/cadastro-trial',
    formFields: ['nome', 'adminEmail', 'adminNome', 'adminSenha', 'modMro', 'modEstoque', 'modComercial', 'aceito'],
  },
  {
    id: 'login',
    act: 2,
    title: '3 · Primeiro acesso',
    headline: 'Login com e-mail, senha e código da organização',
    narrative:
      'Após criar a conta, o administrador entra em /login com as credenciais definidas no cadastro. O tenant fica isolado — dados só daquela oficina.',
    onScreen: 'Tela de login → redirecionamento para home',
    clipHint: '8–10 s · submit e transição para cockpit',
    route: '/login',
  },
  {
    id: 'wizard-empresa',
    act: 3,
    title: '4 · Configuração inicial',
    headline: 'Marca, contatos e dados da empresa',
    narrative:
      'Assistente em 4 passos: (1) marca — nome na interface, logo e tagline; (2) contatos — e-mail de suporte, telefone, site; (3) empresa — razão social, CNPJ, endereço; (4) revisão e confirmação.',
    onScreen: '/configuracao-empresa/inicial — stepper 1→4',
    clipHint: '20–30 s · 4–6 s por passo do wizard (pode acelerar 1,5× no corte)',
    route: '/configuracao-empresa/inicial',
  },
  {
    id: 'home',
    act: 4,
    title: '5 · Painel de comando',
    headline: 'Home — visão do hangar',
    narrative:
      'Cockpit operacional com indicadores, atalhos e wordmark da oficina. Primeira impressão após onboarding — tudo centralizado.',
    onScreen: '/home — cockpit e cards',
    clipHint: '8–12 s · pan lento ou zoom no cockpit',
    route: '/home',
  },
  {
    id: 'dashboard',
    act: 4,
    title: '6 · Dashboard operacional',
    headline: 'KPIs e visão gerencial',
    narrative:
      'Dashboard com métricas de operação: volume de OS, estoque, pendências. Gestor acompanha o hangar sem planilha paralela.',
    onScreen: '/dashboard',
    clipHint: '8–10 s',
    route: '/dashboard',
  },
  {
    id: 'os',
    act: 5,
    title: '7 · Ordens de serviço',
    headline: 'Job card digital e auditável',
    narrative:
      'Lista de OS com filtros, status, apontamentos e histórico. Cada ordem concentra serviços, peças, anexos e liberação — pronta para auditoria RBAC 145.',
    onScreen: '/os — lista; opcional abrir 1ª OS',
    clipHint: '12–15 s · clicar em uma OS se houver dados',
    route: '/os',
    interaction: 'openFirstRow',
  },
  {
    id: 'estoque',
    act: 5,
    title: '8 · Estoque rastreável',
    headline: 'Peças, lote, certificado e FIFO',
    narrative:
      'Itens de estoque com rastreio por lote e certificado, vínculo com OS e política FIFO. Substituir planilha de peças com trilha auditável.',
    onScreen: '/estoque/itens',
    clipHint: '10–12 s · scroll na tabela',
    route: '/estoque/itens',
    waitFor: '.itens-stock-table tbody tr, .empty-state',
  },
  {
    id: 'propostas',
    act: 5,
    title: '9 · Comercial integrado',
    headline: 'Propostas que viram OS',
    narrative:
      'Propostas comerciais alinhadas ao hangar: escopo técnico conversa com a ordem de serviço antes da execução — menos retrabalho entre comercial e manutenção.',
    onScreen: '/propostas-comerciais',
    clipHint: '8–10 s',
    route: '/propostas-comerciais',
  },
  {
    id: 'suporte',
    act: 6,
    title: '10 · Suporte e continuidade',
    headline: 'Tickets, backup e evolução',
    narrative:
      'Suporte via tickets na plataforma, configuração de backup e dicas contextuais em cada módulo. A oficina não fica sozinha após o go-live.',
    onScreen: '/suporte/tickets ou banner onboarding',
    clipHint: '5–8 s · opcional',
    route: '/suporte/tickets',
    optional: true,
  },
  {
    id: 'cta',
    act: 6,
    title: 'Próximo passo',
    headline: 'Demonstração de 30 min com cenário real',
    narrative:
      'CTA final: agendar demo em aerosuite.com.br/contato ou continuar trial. Mensagem: hangar, estoque e OS na mesma base — audit-ready.',
    onScreen: 'Logo + aerosuite.com.br/contato',
    clipHint: '5 s · card CTA ou site',
    route: null,
    externalCta: 'https://aerosuite.com.br/contato/?utm_source=demo&utm_medium=presentation&utm_campaign=jornada_oficina',
  },
];

/** Passos executáveis pelo Playwright (subset com ações). */
export function buildRecordingSteps(opts = {}) {
  const { includeSignup = false, includeWizard = false, skipOptional = true } = opts;
  const steps = [];

  steps.push({
    id: 'intro-login',
    slideId: 'descoberta',
    action: 'goto',
    path: '/login',
    pauseMs: 2000,
    title: 'Tela de login',
    description: 'Ponto de entrada do app. Link “Iniciar trial” leva ao cadastro.',
    voiceover:
      'A oficina acessa app.aerosuite.com.br. Quem ainda não tem conta segue para o cadastro trial de sete dias.',
    clipSuggestion: 'Mostrar login + link para cadastro trial.',
  });

  steps.push({
    id: 'cadastro-trial',
    slideId: 'cadastro-trial',
    action: includeSignup ? 'signupTrial' : 'showSignupForm',
    path: '/cadastro-trial',
    pauseMs: includeSignup ? 4000 : 3500,
    title: 'Cadastro da organização',
    description: includeSignup
      ? 'Preenche e submete formulário trial (nome, admin, módulos MRO/Estoque/Comercial).'
      : 'Exibe formulário trial preenchido (modo demo — não submete).',
    voiceover:
      'No cadastro, a oficina define nome, administrador e quais módulos quer: MRO, estoque e comercial.',
    clipSuggestion: 'Destacar checkboxes de módulos e aceite dos termos.',
  });

  if (includeSignup) {
    steps.push({
      id: 'login-pos-signup',
      slideId: 'login',
      action: 'loginAfterSignup',
      path: '/login',
      pauseMs: 3000,
      title: 'Primeiro login',
      description: 'Entrada com credenciais recém-criadas.',
      voiceover: 'Com a organização criada, o administrador faz o primeiro login.',
      clipSuggestion: 'Transição login → home ou wizard.',
    });
  } else {
    steps.push({
      id: 'login',
      slideId: 'login',
      action: 'login',
      path: '/login',
      pauseMs: 3000,
      title: 'Login',
      description: 'Autenticação com tenant demo existente.',
      voiceover: 'Login com e-mail, senha e código da organização — dados isolados por tenant.',
      clipSuggestion: '8 s do submit até cockpit.',
    });
  }

  if (includeWizard) {
    steps.push({
      id: 'wizard-empresa',
      slideId: 'wizard-empresa',
      action: 'showWizard',
      path: '/configuracao-empresa/inicial',
      pauseMs: 5000,
      title: 'Wizard de configuração',
      description: 'Assistente marca → contatos → empresa → revisão (visualização).',
      voiceover:
        'Assistente inicial: marca da oficina, contatos comerciais e dados fiscais antes de operar.',
      clipSuggestion: 'Montagem rápida dos 4 passos (4–6 s cada).',
    });
  }

  for (const slide of JORNADA_SLIDES) {
    if (!slide.route || slide.optional && skipOptional) continue;
    if (['descoberta', 'cadastro-trial', 'login', 'wizard-empresa', 'cta'].includes(slide.id)) continue;

    steps.push({
      id: slide.id,
      slideId: slide.id,
      action: 'goto',
      path: slide.route,
      pauseMs: slide.id === 'os' ? 4500 : 3500,
      waitFor: slide.waitFor ?? null,
      interaction: slide.interaction ?? null,
      title: slide.title,
      description: slide.narrative,
      voiceover: slide.narrative,
      clipSuggestion: slide.clipHint,
    });
  }

  steps.push({
    id: 'cta-final',
    slideId: 'cta',
    action: 'pause',
    path: '/home',
    pauseMs: 3000,
    title: 'Encerramento',
    description: 'Pausa no cockpit para overlay de CTA no editor.',
    voiceover: 'Agende uma demonstração com cenário real do seu hangar em aerosuite.com.br/contato.',
    clipSuggestion: 'Overlay: logo + URL + “Demonstração 30 min”.',
  });

  return steps;
}
