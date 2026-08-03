/** Resposta técnica — Relatório de Homologação 5 / Sessão 3 (18/jun/2026) */
export const META = {
  title: 'Resposta Técnica — Homologação UX Relatório 5',
  subtitle: 'Retorno formal aos 13 achados (R-02 a R-14) da Sessão 3 — Relatórios, Dashboard e Conformidade Técnica',
  reference:
    'Relatório Técnico de Homologação UX — Sessão 3 · Rafaella Nottes Consultoria (18/jun/2026)',
  reportPath: 'D:/Desenvolvimento/homologacao/relatorio 5/Relatório Homologação AeroSuite Sessão 3.pdf',
  version: '1.0',
  date: '18 de junho de 2026',
  site: 'https://app.aerosuite.com.br',
  analyst: 'Wellem Lyra',
  role: 'Diretor de TI',
  org: 'Aero Suite',
  consultant: 'Rafaella Nottes — Rafaella Nottes Consultoria',
  verificationAt: '2026-06-18',
  score: { total: 13, corrected: 13, positive: 0, pending: 0 },
};

export const SECTIONS = [
  {
    id: '1',
    title: 'Achados críticos (R-10, R-13)',
    intro: 'Bloqueadores de Conformidade Técnica e checklist Go-live.',
  },
  {
    id: '2',
    title: 'Achados de severidade alta (R-06, R-08)',
    intro: 'Modais de preview de relatórios — i18n e dados por tipo.',
  },
  {
    id: '3',
    title: 'Achados de severidade média (R-02, R-05)',
    intro: 'Mensagens de estado e arquitetura de informação do menu.',
  },
  {
    id: '4',
    title: 'Achados de severidade baixa (R-03, R-04, R-07, R-09, R-11, R-12, R-14)',
    intro: 'Polimento de UX, i18n e microcopy.',
  },
];

export const ITEMS = [
  {
    id: 'R-10',
    section: '1',
    sev: 'CRITICO',
    module: 'Conformidade Técnica (5 submódulos)',
    title: 'Falha sistêmica ao salvar qualquer registro no bloco Conformidade Técnica',
    observation:
      'Em AD/SB, Calibração, Documentos controlados, Habilitações e Não conformidades, salvar retornava "Ocorreu um erro inesperado" — 8 tentativas, 100% de reprodução.',
    resolution:
      'ConformidadeNaoConformidadeService e SgqDocumentoService: entityManager.flush() após persist antes de operações dependentes do id; FieldLengthValidator nos campos de texto; revisão padrão "00" em documentos SGQ.',
    verify: 'POST API nos 5 módulos — status 201, sem erro inesperado (reteste pós-deploy).',
  },
  {
    id: 'R-13',
    section: '1',
    sev: 'CRITICO',
    module: 'Kit Go-live (30 dias)',
    title: 'Checklist 100% concluído sem tarefas reais + falha ao salvar progresso',
    observation:
      '15/15 itens marcados sem atividade real; "Salvar progresso" retornava "Falha ao salvar checklist".',
    resolution:
      'GoLiveMigracaoService.sanitizarProgressoInflado() reseta progresso inflado em tenants sem atividade; flush() no save; translateApiError no frontend.',
    verify: 'API tenant default: 0/15 concluídos; PUT save 200; UI salvar progresso OK.',
  },
  {
    id: 'R-06',
    section: '2',
    sev: 'ALTO',
    module: 'Modal compartilhado (Relatórios)',
    title: 'Chave i18n common.actions.close exposta ao usuário',
    observation: 'Botão de fechar exibia literalmente "common.actions.close" em 3 modais de preview.',
    resolution: 'listings-common-i18n.ts: chave common.actions.close nas 4 línguas; botão usa pipe translate.',
    verify: 'UI — botão "Fechar" traduzido; chave crua ausente nos 4 modais de preview.',
  },
  {
    id: 'R-08',
    section: '2',
    sev: 'ALTO',
    module: 'Relatórios — preview (ícone olho)',
    title: 'Modais de preview com conteúdo genérico idêntico',
    observation: 'Produtos, OS e Fabricantes exibiam as mesmas métricas independentemente do tipo.',
    resolution:
      'relatorios.component.ts buildViewStats() por tipo; RelatorioAnalyticsService com query params tipo/dataInicio/dataFim; totalFcu no DTO.',
    verify: 'UI — previews distintos: Produtos 835, OS 2102, Fabricantes 21, FCUs 666.',
  },
  {
    id: 'R-02',
    section: '3',
    sev: 'MEDIO',
    module: 'Relatórios — Ordens de Serviço por Mês',
    title: 'Mensagem de vazio não reflete filtros aplicados',
    observation: '"Sem dados no período" sem indicar tipo de relatório nem datas do filtro.',
    resolution:
      'chartEmptyMessage contextual em relatorios.component.ts (reports.chart.emptyFor com tipo e datas).',
    verify: 'API resumo filtrado OK; mensagem contextual implementada no frontend.',
  },
  {
    id: 'R-05',
    section: '3',
    sev: 'MEDIO',
    module: 'Navegação — menu lateral',
    title: 'Menu sem agrupamento "Conformidade Técnica" conforme manual',
    observation: 'Itens SGQ dispersos em "Administração" sem rótulo Conformidade/SGQ.',
    resolution:
      'Migration V73__menu_conformidade_tecnica_secao.sql: seção Conformidade Técnica; Go-live e Portal externo em seções dedicadas; menu-i18n.ts.',
    verify: 'API meu-menu e UI — seção "Conformidade Técnica" com 10 itens.',
  },
  {
    id: 'R-03',
    section: '4',
    sev: 'BAIXO',
    module: 'Home — Dashboard',
    title: 'Excesso de espaço vazio acima dos KPIs',
    observation: 'Grande área vazia entre cabeçalho e cards de KPI na primeira impressão.',
    resolution: 'home.component.scss: align-content start para aproximar KPIs do topo.',
    verify: 'UI — KPIs visíveis com dados (Catálogo, Parceiros, Oficina, Equipe, SGQ).',
  },
  {
    id: 'R-04',
    section: '4',
    sev: 'BAIXO',
    module: 'Relatórios — tabela Dados Detalhados',
    title: 'Texto longo sem truncamento na tabela',
    observation: 'Nome com 280+ caracteres quebrava linha sem reticências nem tooltip.',
    resolution: 'Classe cell-truncate + pTooltip no nome; coluna com ellipsis.',
    verify: 'UI — cell-truncate presente na tabela de relatórios.',
  },
  {
    id: 'R-07',
    section: '4',
    sev: 'BAIXO',
    module: 'Modal preview de relatório',
    title: 'Botão "Ver gráficos" redundante',
    observation: 'Botão apenas fechava modal e rolava até gráfico já visível.',
    resolution: 'Botão removido do diálogo de preview; gráficos permanecem na página principal.',
    verify: 'UI — "Ver gráficos" ausente na página de relatórios.',
  },
  {
    id: 'R-09',
    section: '4',
    sev: 'BAIXO',
    module: 'Modal Nova AD/SB',
    title: 'Campo "Part number" em inglês',
    observation: 'Label em inglês enquanto demais campos em português.',
    resolution: 'aero-diretriz-i18n.ts: label "Número de peça (P/N)" nas 4 línguas.',
    verify: 'UI — formulário AD/SB com label pt-BR correto.',
  },
  {
    id: 'R-11',
    section: '4',
    sev: 'BAIXO',
    module: 'AD/SB — bloco explicativo',
    title: 'Microcopy do bloco "Para que serve"',
    observation: 'Texto repetitivo, sem paralelismo entre as três colunas.',
    resolution: 'aero-diretriz-i18n.ts: reescrita com papéis claros (registro, cards, consulta na OS).',
    verify: 'UI — bloco "Para que serve" com microcopy revisado em pt-BR.',
  },
  {
    id: 'R-12',
    section: '4',
    sev: 'BAIXO',
    module: 'Documentos controlados / NC',
    title: 'Fluxo de anexo PDF pouco visível',
    observation: 'Upload só após salvar, indicado por frase discreta; inalcançável com R-10 aberto.',
    resolution:
      'sgq-documento-list: callout arquivo-hint-callout; diálogo permanece aberto após criar para upload.',
    verify: 'UI — callout "Salve o documento antes de anexar o PDF (máx. 25 MB)."',
  },
  {
    id: 'R-14',
    section: '4',
    sev: 'BAIXO',
    module: 'Modal Nova ocorrência — OS vinculada',
    title: '"No results found" em inglês no autocomplete',
    observation: 'Mensagem de vazio do autocomplete em inglês em formulário pt-BR.',
    resolution:
      'nao-conformidade-list emptyMessage i18n; prime-ng-i18n.service.ts sincroniza PrimeNG com idioma ativo.',
    verify: 'UI — autocomplete exibe "Nenhum resultado encontrado".',
  },
];
