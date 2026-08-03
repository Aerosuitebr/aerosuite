/**
 * SEO institucional: meta tags, logo para Google e mapa de seções (schema + HTML).
 * Meta no <head>: plugin aerosuite-performance carrega PAGE_SEO via build-seo-php.mjs.
 */
import { SITE, LINKS, MEDIA, PILLAR_PAGES } from './aerosuite-site-config.mjs';

/** Logo quadrado, requisito Google Organization logo (≥112×112, preferência 1:1). */
export const ORGANIZATION_LOGO = {
  url: MEDIA.logoBrand,
  width: 512,
  height: 512,
};

const homeDescription =
  'Software MRO para oficinas aeronáuticas: OS, estoque FIFO, SMS, SGQ e prontidão regulatória com evidências para ANAC e RBAC 145. Agende uma demonstração.';

export const HOME_SEO = {
  title: 'Software MRO para oficinas aeronáuticas | Aero Suite',
  description: homeDescription,
  excerpt: homeDescription,
  path: '/',
};

const solucoesDescription =
  'Conheça os módulos Aero Suite para oficinas MRO: OS, estoque FIFO, SGQ, dossiê de auditoria, propostas e portal do cliente.';

const contatoDescription =
  'Agende uma demonstração da Aero Suite por Calendly, formulário ou WhatsApp e conheça o software MRO em uma sessão online de 30 minutos.';

export const SOLUCOES_SEO = {
  title: 'Soluções para oficinas MRO | Aero Suite',
  description: solucoesDescription,
  excerpt: solucoesDescription,
  path: '/solucoes/',
};

export const CONTATO_SEO = {
  title: 'Agende uma demonstração do Aero Suite',
  description: contatoDescription,
  excerpt: contatoDescription,
  path: '/contato/',
};

/** Alias legado nos scripts de deploy de contato. */
export const CONTACT_SEO = CONTATO_SEO;

const conformidadeDescription =
  'Conformidade regulatória Aero Suite: indicadores SMS, export SGQ ZIP, dossiê auditoria multi-OS, ' +
  'CRS, certificados de peça, quarentena, enforcement na OS e perfis Part 145. ' +
  'Apoia evidências para ANAC, RBAC 145 e auditorias, poupa tempo da equipe em fiscalizações.';

export const CONFORMIDADE_SEO = {
  title: 'Conformidade regulatória | Aero Suite | ANAC, RBAC 145 e evidências SGQ',
  description: conformidadeDescription,
  excerpt: conformidadeDescription,
  slug: 'conformidade-regulatoria',
  path: '/conformidade-regulatoria/',
};

/** Config por slug WP, fonte única; rode `node build-seo-php.mjs` após alterar. */
export const PAGE_SEO = {
  home: HOME_SEO,
  solucoes: SOLUCOES_SEO,
  contato: CONTATO_SEO,
};

/** Seções com âncoras e páginas, alimenta ItemList schema e bloco “Explore”. */
export const HOME_SITE_SECTIONS = [
  {
    name: 'Conformidade regulatória',
    url: LINKS.conformidade,
    description: 'SGQ, SMS, dossiê auditoria e evidências para ANAC / RBAC 145',
  },
  {
    name: 'Prontidão regulatória (home)',
    url: `${LINKS.home}#prontidao-regulatoria`,
    description: 'Painel de adequação operacional com evidências integradas',
  },
  {
    name: 'Módulos da suíte',
    url: LINKS.recursos,
    description: 'OS, estoque, propostas, portal e dashboard na prática',
  },
  {
    name: 'Soluções e funcionalidades',
    url: LINKS.solucoes,
    description: 'Visão completa dos módulos para oficinas MRO',
  },
  {
    name: 'Agendar demonstração',
    url: LINKS.contatoAgendar,
    description: 'Demo guiada alinhada à operação do seu hangar',
  },
  {
    name: 'Casos de clientes',
    url: LINKS.casos,
    description: 'Operações aeronáuticas que usam a Aero Suite',
  },
  {
    name: 'Blog e guias MRO',
    url: LINKS.blog,
    description: 'Artigos sobre gestão, estoque, OS e conformidade',
  },
  {
    name: 'Comparativo vs planilhas',
    url: LINKS.comparativo,
    description: 'Por que sair de planilhas e WhatsApp para um sistema MRO',
  },
  {
    name: 'Sobre a Aero Suite',
    url: LINKS.sobre,
    description: 'Plataforma brasileira SaaS para manutenção aeronáutica',
  },
];

export const SOLUCOES_SITE_SECTIONS = [
  {
    name: 'Ordens de serviço',
    url: PILLAR_PAGES[2].url,
    description: 'OS para manutenção de aeronaves com status e documentos',
  },
  {
    name: 'Estoque FIFO',
    url: PILLAR_PAGES[1].url,
    description: 'Peças aeronáuticas com rastreabilidade e movimentações',
  },
  {
    name: 'Propostas comerciais',
    url: PILLAR_PAGES[4].url,
    description: 'Comercial integrado ao escopo técnico da manutenção',
  },
  {
    name: 'Portal do cliente',
    url: PILLAR_PAGES[3].url,
    description: 'Transparência para o proprietário da aeronave',
  },
  {
    name: 'Módulos na home',
    url: LINKS.recursos,
    description: 'Telas reais de OS, estoque, propostas e dashboard',
  },
  {
    name: 'Prontidão regulatória',
    url: LINKS.conformidade,
    description: 'Ferramentas SGQ, dossiê e evidências para fiscalizações',
  },
  {
    name: 'Agendar demonstração',
    url: LINKS.contatoAgendar,
    description: 'Demo guiada de 30 minutos na sua operação',
  },
  {
    name: 'Casos de clientes',
    url: LINKS.casos,
    description: 'Oficinas que operam com a Aero Suite',
  },
];

export const CONTATO_SITE_SECTIONS = [
  {
    name: 'Agendar no Calendly',
    url: LINKS.contatoAgendar,
    description: 'Escolha horário para demonstração online',
  },
  {
    name: 'Formulário de contato',
    url: `${LINKS.contato}#formulario-contato`,
    description: 'Envie mensagem e receba retorno em até 1 dia útil',
  },
  {
    name: 'WhatsApp comercial',
    url: LINKS.whatsapp,
    description: 'Fale direto com a equipe comercial',
  },
  {
    name: 'Soluções e módulos',
    url: LINKS.solucoes,
    description: 'Visão completa da suíte MRO',
  },
  {
    name: 'Software MRO (guia)',
    url: PILLAR_PAGES[0].url,
    description: 'Gestão de oficina aeronáutica no Brasil',
  },
  {
    name: 'Comparativo vs planilhas',
    url: LINKS.comparativo,
    description: 'Por que sair de planilhas e WhatsApp',
  },
  {
    name: 'Página inicial',
    url: LINKS.home,
    description: 'Visão geral, FAQ e portfólio',
  },
];

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

export function pageSectionsItemListSchema(sections, listId) {
  return {
    '@type': 'ItemList',
    '@id': `${SITE.origin}${listId}`,
    name: 'Seções da página',
    itemListElement: sections.map((section, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: section.name,
      description: section.description,
      url: section.url,
    })),
  };
}

/** Navegação visível, reforça sitelinks e links diretos. */
export function buildExploreSiteBlock(
  sections,
  { title = 'Explore a Aero Suite', lead = 'Acesso rápido às seções desta página e ao restante do site.', id = 'as-explore-site' } = {}
) {
  const items = sections
    .map(
      (s) =>
        `<li><a href="${s.url}"><strong>${s.name}</strong><span>${s.description}</span></a></li>`
    )
    .join('\n    ');
  return `<!-- wp:html -->
<nav class="as-explore-site as-reveal" aria-labelledby="${id}-title">
  <div class="as-explore-site__inner">
    <h2 id="${id}-title" class="as-explore-site__title">${title}</h2>
    <p class="as-explore-site__lead">${lead}</p>
    <ul class="as-explore-site__list">
    ${items}
    </ul>
  </div>
</nav>
<!-- /wp:html -->`;
}

export const buildHomeExploreBlock = () =>
  buildExploreSiteBlock(HOME_SITE_SECTIONS, {
    title: 'Explore a Aero Suite',
    lead: 'Acesso rápido aos módulos, demonstração, regulatório, casos e conteúdo técnico.',
    id: 'as-explore-home',
  });

export const buildSolucoesExploreBlock = () =>
  buildExploreSiteBlock(SOLUCOES_SITE_SECTIONS, {
    title: 'Navegue pelas soluções',
    lead: 'Módulos, guias técnicos, demonstração e demais áreas do site institucional.',
    id: 'as-explore-solucoes',
  });

export const buildContatoExploreBlock = () =>
  buildExploreSiteBlock(CONTATO_SITE_SECTIONS, {
    title: 'Como falar com a Aero Suite',
    lead: 'Agendamento, formulário, WhatsApp e páginas relacionadas.',
    id: 'as-explore-contato',
  });
