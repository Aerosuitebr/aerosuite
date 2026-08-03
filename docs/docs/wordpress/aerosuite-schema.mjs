import { SITE, LINKS, MEDIA, PILLAR_PAGES } from './aerosuite-site-config.mjs';
import {
  HOME_SEO,
  HOME_SITE_SECTIONS,
  SOLUCOES_SEO,
  SOLUCOES_SITE_SECTIONS,
  CONFORMIDADE_SEO,
  CONTATO_SEO,
  CONTATO_SITE_SECTIONS,
  ORGANIZATION_LOGO,
  pageSectionsItemListSchema,
} from './aerosuite-seo.mjs';

function jsonLd(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** Bloco JSON-LD injetado no conteúdo da página. */
export function schemaScriptBlock(graph) {
  const payload = Array.isArray(graph) ? { '@context': 'https://schema.org', '@graph': graph } : graph;
  return `<script type="application/ld+json">${jsonLd(payload)}</script>`;
}

function organizationLogoImageObject() {
  return {
    '@type': 'ImageObject',
    '@id': `${SITE.origin}/#logo`,
    url: ORGANIZATION_LOGO.url,
    contentUrl: ORGANIZATION_LOGO.url,
    width: ORGANIZATION_LOGO.width,
    height: ORGANIZATION_LOGO.height,
    caption: `${SITE.brand}, logotipo`,
  };
}

export function organizationSchema() {
  const logo = organizationLogoImageObject();
  return {
    '@type': 'Organization',
    '@id': `${SITE.origin}/#organization`,
    name: SITE.brand,
    url: SITE.origin,
    logo,
    image: { '@id': logo['@id'] },
    email: SITE.email,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: SITE.email,
      areaServed: 'BR',
      availableLanguage: ['Portuguese'],
    },
    areaServed: { '@type': 'Country', name: 'Brasil' },
    knowsAbout: [
      'Manutenção aeronáutica',
      'MRO',
      'Gestão de ordens de serviço',
      'Estoque de peças aeronáuticas',
      'Software SaaS',
    ],
  };
}

export function softwareApplicationSchema() {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${SITE.origin}/#software`,
    name: SITE.brand,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      description: 'Demonstração e proposta comercial sob consulta.',
    },
    description:
      'Plataforma SaaS para oficinas aeronáuticas e MRO: ordens de serviço, estoque FIFO de peças, propostas comerciais e portal do cliente.',
    url: SITE.origin,
    provider: { '@id': `${SITE.origin}/#organization` },
    featureList: [
      'Ordens de serviço com histórico auditável',
      'Estoque aeronáutico FIFO e rastreabilidade',
      'Propostas comerciais integradas',
      'Portal do cliente',
      'Dashboard operacional',
      'Controle de acesso por perfil (RBAC)',
    ],
  };
}

export function webSiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.origin}/#website`,
    url: SITE.origin,
    name: SITE.brand,
    description: HOME_SEO.description,
    publisher: { '@id': `${SITE.origin}/#organization` },
    inLanguage: 'pt-BR',
  };
}

/** Lista de seções principais, apoia sitelinks e navegação estruturada. */
export function homeSiteSectionsItemListSchema() {
  return {
    '@type': 'ItemList',
    '@id': `${SITE.origin}/#site-sections`,
    name: 'Seções principais | Aero Suite',
    itemListElement: HOME_SITE_SECTIONS.map((section, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: section.name,
      description: section.description,
      url: section.url,
    })),
  };
}

export function homePageSchema() {
  return {
    '@type': 'WebPage',
    '@id': `${SITE.origin}/#webpage`,
    url: LINKS.home,
    name: HOME_SEO.title,
    description: HOME_SEO.description,
    isPartOf: { '@id': `${SITE.origin}/#website` },
    about: { '@id': `${SITE.origin}/#software` },
    primaryImageOfPage: { '@id': `${SITE.origin}/#logo` },
    inLanguage: 'pt-BR',
  };
}

export function faqPageSchema(items) {
  return {
    '@type': 'FAQPage',
    '@id': `${SITE.origin}/#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export const HOME_FAQ_ITEMS = [
  {
    q: 'É só para oficinas grandes?',
    a: 'Não. A Aero Suite escala de operações enxutas a hangares com múltiplas equipes, com o mesmo padrão de rastreabilidade e controle.',
  },
  {
    q: 'Substitui meu ERP?',
    a: 'Focamos no que ERP genérico não resolve bem: MRO aeronáutico com rastreio FIFO, job cards, documentos e portal do cliente. Integrações podem ser avaliadas na demo.',
  },
  {
    q: 'Como ficam rastreabilidade e segurança?',
    a: 'Plataforma em nuvem com controle de acesso por perfil (RBAC), trilha de movimentações, histórico de OS e ambiente isolado por organização.',
  },
  {
    q: 'Quanto tempo para começar?',
    a: 'Na demonstração mostramos o fluxo real do seu hangar e montamos proposta alinhada à operação, onboarding guiado após contratação.',
  },
  {
    q: 'O cliente final vê o andamento?',
    a: 'Sim. O portal externo dá transparência sobre status, documentos e comunicação, menos ligação perguntando como está a aeronave.',
  },
];

export function homeSchemaGraph() {
  return [
    organizationSchema(),
    softwareApplicationSchema(),
    webSiteSchema(),
    homePageSchema(),
    homeSiteSectionsItemListSchema(),
    faqPageSchema(HOME_FAQ_ITEMS),
  ];
}

export function breadcrumbSchema(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function webPageSchema({ url, name, description }) {
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { '@id': `${SITE.origin}/#website` },
    inLanguage: 'pt-BR',
  };
}

export function articleSchema({ url, title, description, datePublished, dateModified }) {
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: title,
    description,
    datePublished,
    dateModified: dateModified || datePublished,
    author: { '@id': `${SITE.origin}/#organization` },
    publisher: { '@id': `${SITE.origin}/#organization` },
    mainEntityOfPage: { '@id': `${url}#webpage` },
    inLanguage: 'pt-BR',
  };
}

export function pillarPageSchema(pillar, description) {
  return [
    organizationSchema(),
    webSiteSchema(),
    breadcrumbSchema([
      { name: 'Início', url: LINKS.home },
      { name: pillar.title, url: pillar.url },
    ]),
    webPageSchema({ url: pillar.url, name: pillar.title, description }),
  ];
}

export function contactPageSchema() {
  return [
    organizationSchema(),
    webSiteSchema(),
    breadcrumbSchema([
      { name: 'Início', url: LINKS.home },
      { name: 'Contato e demonstração', url: LINKS.contato },
    ]),
    webPageSchema({
      url: LINKS.contato,
      name: CONTATO_SEO.title,
      description: CONTATO_SEO.description,
    }),
    pageSectionsItemListSchema(CONTATO_SITE_SECTIONS, '/contato/#page-sections'),
  ];
}

export function knowledgeHubItemListSchema() {
  return {
    '@type': 'ItemList',
    name: 'Guias Aero Suite, gestão aeronáutica',
    itemListElement: PILLAR_PAGES.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: p.url,
      name: p.title,
    })),
  };
}

export function solucoesPageSchema() {
  return [
    organizationSchema(),
    softwareApplicationSchema(),
    webSiteSchema(),
    breadcrumbSchema([
      { name: 'Início', url: LINKS.home },
      { name: 'Soluções', url: LINKS.solucoes },
    ]),
    webPageSchema({
      url: LINKS.solucoes,
      name: SOLUCOES_SEO.title,
      description: SOLUCOES_SEO.description,
    }),
    pageSectionsItemListSchema(SOLUCOES_SITE_SECTIONS, '/solucoes/#page-sections'),
  ];
}

export function conformidadePageSchema() {
  return [
    organizationSchema(),
    webSiteSchema(),
    breadcrumbSchema([
      { name: 'Início', url: LINKS.home },
      { name: 'Conformidade regulatória', url: LINKS.conformidade },
    ]),
    webPageSchema({
      url: LINKS.conformidade,
      name: CONFORMIDADE_SEO.title,
      description: CONFORMIDADE_SEO.description,
    }),
  ];
}

export function sobrePageSchema() {
  return [
    organizationSchema(),
    webSiteSchema(),
    breadcrumbSchema([
      { name: 'Início', url: LINKS.home },
      { name: 'Sobre', url: LINKS.sobre },
    ]),
    webPageSchema({
      url: LINKS.sobre,
      name: 'Sobre a Aero Suite, software MRO no Brasil',
      description:
        'Conheça a Aero Suite: plataforma SaaS brasileira de gestão para manutenção aeronáutica, MRO e organizações de manutenção com rastreabilidade e RBAC.',
    }),
  ];
}
