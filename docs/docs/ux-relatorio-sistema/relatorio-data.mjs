/** Dados estruturados — Relatório Executivo UX Sistema (app). */
export const META = {
  title: 'Relatório Executivo de Adequação UX',
  subtitle: 'Aplicação app.aerosuite.com.br',
  reference: 'Relatório Técnico UX Aero Suite v1 — §3.5 e §7 (sistema)',
  version: '1.0',
  date: '09 de junho de 2026',
  site: 'https://app.aerosuite.com.br',
  analyst: 'Wellem Lyra',
  role: 'Analista responsável — UX & Produto',
  org: 'Aero Suite',
  verificationAt: '2026-06-09T21:43:56.282Z',
  score: { total: 12, adherent: 12, partial: 0, fail: 0 },
};

export const SECTIONS = [
  {
    id: '3.5',
    title: 'Dados, encoding e internacionalização (app)',
    intro:
      'Apontamentos visíveis nas telas do sistema em homologação/produção: nomes reais de clientes, registros smoke, chaves i18n expostas, ortografia pt-BR e encoding corrompido.',
  },
  {
    id: '7',
    title: 'Módulo Conformidade / SGQ',
    intro:
      'Rotas do painel de qualidade auditadas quanto a enums técnicos (CAPA, severidade) e chaves de tradução exibidas ao usuário final.',
  },
];

export const ITEMS = [
  {
    id: '3.5.1',
    section: '3.5',
    sev: 'CRITICO',
    item: 'Dados reais de clientes na lista de OS',
    observation:
      'Listagem de ordens de serviço exibia nomes reais de clientes (ex.: GRUPO FARROUPILHA, QUICK MNT, AXIAL AVIATION) no tenant de demonstração.',
    resolution:
      'Script db/scripts/sanitize-demo-tenant-homologacao.sql renomeia clientes sensíveis para "Cliente Demo NN", corrige encoding VOAR Táxi Aéreo e deve ser executado antes de demos/capturas. Pipeline verify-system-ux-report.mjs bloqueia regressão.',
    evidence:
      'Playwright em /os após sanitização: zero ocorrências de FARROUPIL, QUICK MNT, AXIAL ou ?? — scripts/.verify-system-ux-report.json.',
    verify: 'Automático — scripts/verify-system-ux-report.mjs + SQL sanitize',
  },
  {
    id: '3.5.2',
    section: '3.5',
    sev: 'CRITICO',
    item: 'Smoke / Serviço smoke (Propostas)',
    observation:
      'Propostas comerciais de teste ("Cliente Smoke", "Servico smoke P4.1") visíveis na listagem comercial.',
    resolution:
      'Sanitização SQL substitui nomenclatura smoke por "Serviço demonstração P4.1" e clientes fictícios; catálogo tipo_servico/template atualizado em cascata.',
    evidence: 'Regex cliente smoke / servico smoke ausentes em /propostas-comerciais na verificação automatizada.',
    verify: 'Automático — verify-system-ux-report.mjs',
  },
  {
    id: '3.5.3',
    section: '3.5',
    sev: 'CRITICO',
    item: 'Chave i18n common.actions.refresh visível (Painel SGQ)',
    observation:
      'Botão "Atualizar" do painel de conformidade exibia a chave técnica common.actions.refresh em vez do rótulo traduzido.',
    resolution:
      'Entradas common.actions.refresh adicionadas em listings-common-i18n.ts (pt-BR, en-US, es-ES, fr-FR). Template usa pipe translate no conformidade-painel.component.ts.',
    evidence: 'Pattern common.actions. ausente em /conformidade/painel; botão exibe "Atualizar" ou equivalente i18n.',
    verify: 'Automático — verify-system-ux-report.mjs',
  },
  {
    id: '3.5.4',
    section: '3.5',
    sev: 'ALTO',
    item: "Erro ortográfico 'Servico' sem cedilha (Propostas)",
    observation: 'Texto "Servico" sem acentuação pt-BR em tipos de serviço e propostas.',
    resolution:
      'REPLACE Servico→Serviço no script SQL de sanitização (proposta_comercial, tipo_servico, template_produto_servico, os).',
    evidence: 'Pattern \\bservico\\b ausente na listagem de propostas após deploy.',
    verify: 'Automático — verify-system-ux-report.mjs',
  },
  {
    id: '3.5.5',
    section: '3.5',
    sev: 'ALTO',
    item: 'Enum CAPA CONTENCAO sem tradução (NC)',
    observation:
      'Fase CAPA exibia enums crus (CONTENCAO, VERIFICACAO) na listagem de não conformidades e nos chips SMS do painel SGQ.',
    resolution:
      'Chaves conformidade.nc.capa.* em conformidade-sgq-i18n.ts; labelCapa() no stepper NC; painel SGQ traduz porCapaFase/porSeveridade e categorias de alerta (commit ed9cb0d).',
    evidence: 'CONTENCAO e VERIFICACAO ausentes em /conformidade/nao-conformidades e /conformidade/painel.',
    verify: 'Automático — verify-system-ux-report.mjs',
  },
  {
    id: '3.5.6',
    section: '3.5',
    sev: 'ALTO',
    item: 'Encoding corrompido (??) em textos visíveis',
    observation: 'Mojibake em nomes (ex.: VOAR T??XI / A??RE) nas telas de OS.',
    resolution:
      'Correção pontual no SQL sanitize-demo-tenant-homologacao.sql; charset UTF-8 na conexão JDBC e SET NAMES utf8mb4 nos scripts.',
    evidence: 'Pattern ?? ausente na rota /os na verificação pós-deploy.',
    verify: 'Automático — verify-system-ux-report.mjs',
  },
  {
    id: 'conf.documentos',
    section: '7',
    sev: 'ALTO',
    item: 'Enums/i18n vazados (Documentos SGQ)',
    observation: 'Risco de exibir identificadores técnicos ou chaves i18n na gestão documental SGQ.',
    resolution:
      'Telas em conformidade/documentos usam TranslatePipe e dicionário conformidade-sgq-i18n / sgq.documento.* nas quatro locales.',
    evidence: 'Rota /conformidade/documentos sem CONTENCAO, common.actions.* ou ?? na auditoria Playwright.',
    verify: 'Automático — verify-system-ux-report.mjs',
  },
  {
    id: 'conf.treinamentos',
    section: '7',
    sev: 'ALTO',
    item: 'Enums/i18n vazados (Treinamentos)',
    observation: 'Mesmo risco de vazamento de enums na listagem de treinamentos SGQ.',
    resolution: 'Componente treinamento-list.component.ts com labels via i18n; severidade via translateCatalog.',
    evidence: 'Auditoria automatizada /conformidade/treinamentos — sem ocorrências proibidas.',
    verify: 'Automático — verify-system-ux-report.mjs',
  },
  {
    id: 'conf.calibracao',
    section: '7',
    sev: 'ALTO',
    item: 'Enums/i18n vazados (Calibração)',
    observation: 'Tipos de instrumento e alertas poderiam exibir códigos internos.',
    resolution: 'calibracao-list.component.ts com conformidade.calibracao.tipo.* traduzido.',
    evidence: 'Rota /conformidade/calibracao aderente na verificação.',
    verify: 'Automático — verify-system-ux-report.mjs',
  },
  {
    id: 'conf.subcontratacao',
    section: '7',
    sev: 'ALTO',
    item: 'Enums/i18n vazados (Subcontratação)',
    observation: 'Status ASL/subcontratação sem camada i18n consistente.',
    resolution: 'subcontratacao-list.component.ts com conformidade.subcontratacao.status.*.',
    evidence: 'Rota /conformidade/subcontratacao aderente.',
    verify: 'Automático — verify-system-ux-report.mjs',
  },
  {
    id: 'conf.habilitacoes',
    section: '7',
    sev: 'MEDIO',
    item: 'Enums/i18n vazados (Habilitações)',
    observation: 'Listagem de habilitações técnicas exposta em demos comerciais.',
    resolution: 'habilitacao-list.component.ts alinhado ao padrão i18n do módulo conformidade.',
    evidence: 'Rota /conformidade/habilitacoes aderente.',
    verify: 'Automático — verify-system-ux-report.mjs',
  },
  {
    id: 'conf.treinObrig',
    section: '7',
    sev: 'MEDIO',
    item: 'Enums/i18n vazados (Treinamentos obrigatórios)',
    observation: 'Cadastro de treinamentos obrigatórios por função sem auditoria UX dedicada.',
    resolution:
      'Rota incluída no verify-system-ux-report.mjs; copy via conformidade.treinObrig.* em conformidade-sgq-i18n.ts.',
    evidence: 'Rota /conformidade/treinamentos-obrigatorios aderente na verificação pós-deploy.',
    verify: 'Automático — verify-system-ux-report.mjs',
  },
];

export const SUPPLEMENTARY = [
  {
    title: 'Verificação automatizada contínua',
    body: 'Script scripts/verify-system-ux-report.mjs (Playwright + login API) cobre 12 rotas do app. Fluxo recomendado: scripts/run-homologacao-ux-sistema.ps1 (SQL sanitize + verify). Documentação: docs/HOMOLOGACAO-UX-SISTEMA.md.',
  },
  {
    title: 'Dados vs código',
    body: 'Itens 3.5.1, 3.5.2, 3.5.4 e 3.5.6 dependem do tenant sanitizado (db/scripts/sanitize-demo-tenant-homologacao.sql). Itens 3.5.3, 3.5.5 e rotas §7 dependem de build frontend/backend deployado.',
  },
  {
    title: 'Escopo complementar (fora deste relatório)',
    body: 'Moeda BRL/USD/EUR em propostas comerciais, branding dinâmico e site WordPress possuem relatório executivo próprio (32 itens — aerosuite.com.br). WCAG 2.1 AA completo segue roteiro docs/wcag quando aplicável.',
  },
];
