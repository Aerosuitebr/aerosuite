/** Resposta técnica — Relatório de Homologação 6 / Sessão 4 (19/jun/2026) */
export const META = {
  title: 'Resposta Técnica — Homologação UX Relatório 6',
  subtitle:
    'Retorno formal aos 28 achados (S4-01 a S4-36) da Sessão 4 — Produtos, Fabricantes, Relatórios, Usuários Externos, OS e Conformidade Técnica',
  reference:
    'Relatório Técnico de Homologação UX — Sessão 4 · Rafaella Nottes Consultoria (19/jun/2026)',
  reportPath: 'D:/Desenvolvimento/homologacao/relatorio 6/Relatório Sessão4 Aero Suite.pdf',
  version: '1.0',
  date: '21 de junho de 2026',
  site: 'https://app.aerosuite.com.br',
  analyst: 'Wellem Lyra',
  role: 'Diretor de TI',
  org: 'Aero Suite',
  consultant: 'Rafaella Nottes — Rafaella Nottes Consultoria',
  verificationAt: '2026-06-21',
  score: { total: 28, corrected: 28, positive: 0, pending: 0 },
};

export const SECTIONS = [
  {
    id: '1',
    title: 'Achados críticos (S4-07, S4-24, S4-34, S4-36)',
    intro: 'Contrato de dados, health check, isolamento multi-tenant e AD/SB — inclui reincidências F04 e R-10.',
  },
  {
    id: '2',
    title: 'Achados de severidade alta (S4-06, S4-22)',
    intro: 'Feedback de formulário de produto e paginação FCU na associação aeronáutica.',
  },
  {
    id: '3',
    title: 'Achados de severidade média (S4-17, S4-20, S4-25, S4-27, S4-29)',
    intro: 'Segurança de e-mail, encoding UTF-8, i18n de OS e validação visual.',
  },
  {
    id: '4',
    title: 'Achados de severidade baixa (demais S4-xx)',
    intro: 'Produtos, relatórios, usuários externos e alertas operacionais.',
  },
];

export const ITEMS = [
  {
    id: 'S4-07',
    section: '1',
    sev: 'CRITICO',
    module: 'Cadastro — Novo Produto',
    title: 'Falha ao salvar produto com nome de 255 caracteres (limite do frontend)',
    observation:
      'Frontend anunciava limite de 255 caracteres no contador, mas o backend falhava com erro genérico ao persistir.',
    resolution:
      'Migration V77: product.name VARCHAR(255); Product.java @Column(length=255); mensagens de erro descritivas via API i18n.',
    verify: 'POST /products com name 255 chars — status 201 após deploy (verify-relatorio6 S4-07-api).',
  },
  {
    id: 'S4-24',
    section: '1',
    sev: 'CRITICO',
    module: 'Infraestrutura / indicador de status',
    title: 'Degradação sistêmica com indicador SISTEMA ONLINE verde',
    observation:
      'Múltiplos endpoints falharam enquanto o rodapé permanecia verde — health check apenas de conectividade.',
    resolution:
      'PublicHealthResource GET /api/public/health (ping DB); AppHealthService no footer com estado degradado e i18n footer.statusDegraded.',
    verify: 'GET /public/health retorna ok/database; footer exibe estado degradado quando API falha.',
  },
  {
    id: 'S4-34',
    section: '1',
    sev: 'CRITICO',
    module: 'Autenticação / branding multi-tenant',
    title: 'Reincidência F04 — identidade visual de outro tenant ao duplicar aba',
    observation:
      'Nova aba na tela de login exibiu branding completo do tenant BELLOWS (vetor diferente do F04 original).',
    resolution:
      'BrandingService: allowSessionTenant explícito; login público sem hidratar tenant de sessão; SistemaEmpresaConfigService.publicBranding() sem inferir tenant de JWT/sessão.',
    verify: 'GET /public/sistema-empresa/branding sem tenant → configured=false; reteste manual duplicar aba pós-deploy.',
  },
  {
    id: 'S4-36',
    section: '1',
    sev: 'CRITICO',
    module: 'Conformidade Técnica — AD/SB',
    title: 'Reincidência R-10 — erro inesperado ao salvar Nova AD/SB',
    observation:
      'Formulário AD/SB retornava "ocorreu um erro inesperado" com campos obrigatórios preenchidos.',
    resolution:
      'AeroDiretrizService: entityManager.flush() após persist; validação fcuId e mensagens domain aero.diretriz.error.*.',
    verify: 'POST /aero/diretrizes — status 201 sem erro inesperado (verify-relatorio6 S4-36-api).',
  },
  {
    id: 'S4-06',
    section: '2',
    sev: 'ALTO',
    module: 'Cadastro — Novo Produto',
    title: 'Botão Salvar desabilitado sem indicação de campo inválido',
    observation:
      'Formulário longo travava salvamento silenciosamente sem highlight nos campos bloqueantes.',
    resolution:
      'Botão salvar sempre clicável; formAttempted + fieldInvalid() destaca campos em vermelho; toast descritivo.',
    verify: 'UI — tentar salvar incompleto exibe bordas p-invalid nos campos obrigatórios.',
  },
  {
    id: 'S4-22',
    section: '2',
    sev: 'ALTO',
    module: 'Cadastro — Associação FCU',
    title: 'Erro 502 ao carregar FCUs com size=1000',
    observation:
      'GET /api/fcu?isActive=true&size=1000 causava timeout/sobrecarga; tela inutilizável.',
    resolution:
      'associacao-fcu.component.ts: paginação size=200; FcuService MAX_PAGE_SIZE=200 no backend.',
    verify: 'GET /fcu?size=200 status 200; tela associação carrega sem erro.',
  },
  {
    id: 'S4-17',
    section: '3',
    sev: 'MEDIO',
    module: 'E-mail transacional — usuário externo',
    title: 'Senha temporária exposta em texto claro no e-mail',
    observation:
      'Senha temporária visível no corpo e preview do e-mail de boas-vindas.',
    resolution:
      'TransactionalEmailMessages.passwordSetupInvite: senha só quando setupUrl ausente; com link seguro, corpo sem credencial.',
    verify: 'Template e-mail externo — link de definição de senha; sem senha em claro quando há setupUrl.',
  },
  {
    id: 'S4-20',
    section: '3',
    sev: 'MEDIO',
    module: 'Administração — Permissões portal externo',
    title: 'Encoding corrompido nos cards de funcionalidades (Servi??o, P?gina)',
    observation:
      'Caracteres acentuados substituídos por interrogações nos cards de permissões.',
    resolution:
      'Migration V77: UPDATE funcionalidade_externa com textos UTF-8 corretos (Minhas Ordens de Serviço, Página inicial promocional).',
    verify: 'GET /funcionalidades-externas — sem ?? nos nomes/descrições.',
  },
  {
    id: 'S4-25',
    section: '3',
    sev: 'MEDIO',
    module: 'Cadastro — Nova OS',
    title: 'Labels e placeholders em inglês no formulário de OS',
    observation:
      'TIME SINCE NEW, SERIAL NUMBER, Part Number etc. em locale pt-BR.',
    resolution:
      'os-form-i18n.ts OS_FORM_PT_BR completo; auditoria anti-inglês no verify-relatorio6; ph.engineSn separado.',
    verify: 'UI pt-BR — Tempo desde novo (TSN), Número de série, P/N do manual; script auditOsFormPtBr OK.',
  },
  {
    id: 'S4-27',
    section: '3',
    sev: 'MEDIO',
    module: 'Cadastro — Nova OS',
    title: 'Título de seção "Serviço" sem cedilha',
    observation:
      'Accordion exibia "Serviço" corrompido — mesmo padrão de encoding do S4-20.',
    resolution:
      'Chave os.form.accordion.service = "Serviço" em UTF-8 no dicionário pt-BR.',
    verify: 'UI — seção Serviço com cedilha correta.',
  },
  {
    id: 'S4-29',
    section: '3',
    sev: 'MEDIO',
    module: 'Cadastro — Nova OS',
    title: 'Campo obrigatório com borda verde em erro de validação',
    observation:
      'Dropdown Produto Aeronáutico com borda verde e mensagem vermelha — contradição semântica.',
    resolution:
      'styles.scss global: .p-dropdown.p-invalid com borda vermelha e focus ring vermelho.',
    verify: 'UI — tentar salvar OS sem FCU exibe borda vermelha no dropdown.',
  },
  {
    id: 'S4-01',
    section: '4',
    sev: 'BAIXO',
    module: 'Cadastro — Fabricante / Novo Produto',
    title: 'Nome de fabricante sem limite — overflow em cascata',
    observation:
      'Nome longo no seletor invadia área do seletor de moeda.',
    resolution:
      'FABRICANTE_NAME_MAX=100; FabricanteService validação; contador no dialog; truncamento fabricante-label-truncate.',
    verify: 'UI — nome fabricante truncado com tooltip; máximo 100 caracteres.',
  },
  {
    id: 'S4-02',
    section: '4',
    sev: 'BAIXO',
    module: 'Cadastro — Novo Produto',
    title: 'Troca de moeda não intencional por colisão com overflow',
    observation: 'Derivado do S4-01 — clique involuntário na moeda.',
    resolution: 'Correção do truncamento S4-01 elimina colisão de área clicável.',
    verify: 'UI — dropdown fabricante não sobrepõe seletor de moeda.',
  },
  {
    id: 'S4-03',
    section: '4',
    sev: 'BAIXO',
    module: 'Cadastro — Novo Produto',
    title: 'Preço zero exige interação desnecessária',
    observation: 'Campo Preço com 0,00 parecia inválido até o usuário interagir.',
    resolution:
      'formularioValido aceita preco >= 0 sem precoTouched; InputNumber sem estado de erro inicial.',
    verify: 'UI — salvar produto novo com preço 0,00 sem tocar no campo.',
  },
  {
    id: 'S4-04',
    section: '4',
    sev: 'BAIXO',
    module: 'Cadastro — Novo Produto',
    title: 'Observações sem contador de caracteres',
    observation: 'Inconsistência com campo Descrição que exibe contador.',
    resolution: 'PRODUCT_NOTES_MAX=2000; contador observacoes.length/productNotesMax no template.',
    verify: 'UI — contador visível no campo Observações.',
  },
  {
    id: 'S4-05',
    section: '4',
    sev: 'BAIXO',
    module: 'Cadastro — Especificações Técnicas',
    title: 'Campos numéricos e textuais sem validação de limites',
    observation: 'Valores absurdos (999.999 kg) aceitos sem aviso.',
    resolution:
      'PRODUCT_WEIGHT_MAX, PRODUCT_SPEC_TEXT_MAX; max nos InputNumber e maxlength em Material/Cor.',
    verify: 'UI — limites nos campos de peso, dimensões, material e cor.',
  },
  {
    id: 'S4-08',
    section: '4',
    sev: 'BAIXO',
    module: 'Cadastro — Listagem Produtos',
    title: 'Ausência de truncamento na coluna Nome (reincidência R-04)',
    observation: 'Nomes longos desequilibravam a tabela — correção só em Relatórios.',
    resolution: 'cell-truncate + pTooltip na listagem de produtos; classe global em styles.scss.',
    verify: 'UI — nomes longos com reticências e tooltip na grid de produtos.',
  },
  {
    id: 'S4-09',
    section: '4',
    sev: 'BAIXO',
    module: 'Cadastro — Listagem Produtos',
    title: 'Coluna Status ausente',
    observation: 'Status só visível via filtro, não na grid.',
    resolution: 'Coluna Status com badge Ativo/Inativo; chaves listings-ui-i18n nas 4 línguas.',
    verify: 'UI — coluna Status visível na listagem de produtos.',
  },
  {
    id: 'S4-11',
    section: '4',
    sev: 'BAIXO',
    module: 'Cadastro — Listagem Produtos',
    title: 'Coluna Fabricante ausente',
    observation: 'Fabricante obrigatório no cadastro mas ausente na grid.',
    resolution: 'ProductDto.fabricanteNome; coluna Fabricante na product-list com truncamento.',
    verify: 'UI — coluna Fabricante após Nome na listagem.',
  },
  {
    id: 'S4-12',
    section: '4',
    sev: 'BAIXO',
    module: 'Cadastro — Listagem Produtos',
    title: 'Duplo clique não abre edição',
    observation: 'Usuário precisava rolar até coluna Ações.',
    resolution: '(dblclick)="initRowEdit(row)" na linha da tabela.',
    verify: 'UI — duplo clique na linha abre edição do produto.',
  },
  {
    id: 'S4-13',
    section: '4',
    sev: 'BAIXO',
    module: 'Relatórios — exportação CSV',
    title: 'Cabeçalho "data" ambíguo no CSV',
    observation: 'Coluna data sem especificar tipo (cadastro vs atualização).',
    resolution:
      'Cabeçalhos i18n descritivos: ID, Nome, Fabricante, Status, Data de cadastro (reports.csv.col.*).',
    verify: 'Export CSV — cabeçalho "Data de cadastro" em pt-BR.',
  },
  {
    id: 'S4-14',
    section: '4',
    sev: 'BAIXO',
    module: 'Relatórios — modal preview',
    title: 'Preview esparso — apenas contagem única',
    observation: 'Modal com uma linha não agregava valor para decidir download.',
    resolution:
      'buildViewStats enriquecido: produtos ativos/inativos, fabricantes distintos; métricas por tipo.',
    verify: 'UI — preview de produtos com múltiplas métricas.',
  },
  {
    id: 'S4-15',
    section: '4',
    sev: 'BAIXO',
    module: 'Administração — Usuário Externo',
    title: 'Máscara de telefone exclusivamente brasileira',
    observation: 'Placeholder (00) 00000-0000 impedia formatos internacionais.',
    resolution:
      'Campo texto livre; placeholder internacional (+55… ou +1…) em forms-misc-i18n nas 4 línguas.',
    verify: 'UI — cadastro externo aceita telefone internacional.',
  },
  {
    id: 'S4-16',
    section: '4',
    sev: 'BAIXO',
    module: 'Administração — Usuários Externos',
    title: 'Último Acesso sem distinguir convite enviado vs pendente',
    observation: 'Traço para todos sem acesso — admin não sabia se e-mail foi enviado.',
    resolution:
      'Coluna convite_enviado_em; formatLastAccess: "Convite enviado em …" / "Convite pendente".',
    verify: 'UI — listagem distingue convite enviado de nunca acessou.',
  },
  {
    id: 'S4-18',
    section: '4',
    sev: 'BAIXO',
    module: 'E-mail transacional',
    title: 'Rodapé do e-mail sem link de portal ou suporte',
    observation: 'Rodapé apenas "E-mail automático" sem caminhos para o usuário.',
    resolution: 'portalSupportFooter() com links para portal e suporte em TransactionalEmailMessages.',
    verify: 'E-mail externo — rodapé com portal e contato.',
  },
  {
    id: 'S4-26',
    section: '4',
    sev: 'BAIXO',
    module: 'Cadastro — Nova OS',
    title: 'Número da OS exibe traço sem explicação',
    observation: 'Usuário não sabia se número era manual ou automático.',
    resolution: 'Placeholder os.form.numberGeneratedOnSave = "Será gerado ao salvar".',
    verify: 'UI — campo Número da OS com texto explicativo antes de salvar.',
  },
  {
    id: 'S4-33',
    section: '4',
    sev: 'BAIXO',
    module: 'Nova OS — alerta disponibilidade',
    title: 'Itens de estoque insuficiente sem quebra de linha',
    observation: 'Múltiplos produtos em linha corrida ilegível no confirm.',
    resolution: 'styles.scss: .p-confirm-dialog-message { white-space: pre-line }; join com \\n no os-list.',
    verify: 'UI — alerta de disponibilidade com um produto por linha.',
  },
  {
    id: 'S4-35',
    section: '4',
    sev: 'BAIXO',
    module: 'Formulários — validação PrimeNG',
    title: 'Borda verde em erro (escopo sistêmico — mesma causa S4-29)',
    observation: 'Recomendação do relatório para padronizar borda vermelha em todos os formulários.',
    resolution: 'Mesma correção global S4-29 em styles.scss para p-dropdown.p-invalid.',
    verify: 'UI — dropdowns inválidos com borda vermelha em OS e demais telas.',
  },
];
