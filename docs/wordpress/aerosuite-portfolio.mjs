import { SITE, LINKS } from './aerosuite-site-config.mjs';
import { PORTFOLIO_CLIENTS, getClientBySlug } from './aerosuite-clients.mjs';
import {
  articleSchema,
  breadcrumbSchema,
  organizationSchema,
  webSiteSchema,
  webPageSchema,
} from './aerosuite-schema.mjs';
import { schemaBlock, pageHeroBlock, demoCtaBlock, proseSection, bulletSection } from './aerosuite-shared-blocks.mjs';
import { htmlBlock } from './aerosuite-html.mjs';

export const PORTFOLIO_INDEX_SEO = {
  slug: 'casos',
  title: 'Casos e operações | Aero Suite',
  excerpt:
    'Oficinas MRO e distribuidoras de peças aeronáuticas que utilizam a Aero Suite para OS, estoque, propostas e rastreabilidade no Brasil.',
};

export const BELLOWS_CASE_SEO = {
  slug: 'bellows-servicos-aeronauticos',
  title: 'Bellows | Serviços Aeronáuticos | Caso Aero Suite',
  excerpt:
    'Como a Bellows (Bellows Controls) utiliza a Aero Suite na gestão MRO: ordens de serviço, estoque e rastreabilidade em nuvem.',
};

export const KING_DO_RIO_CASE_SEO = {
  slug: 'king-do-rio-pecas-aeronauticas',
  title: 'King do Rio | Peças Aeronáuticas | Caso Aero Suite',
  excerpt:
    'Como a King do Rio utiliza propostas comerciais e controle de estoque da Aero Suite na distribuição de peças aeronáuticas.',
};

function clientCaseUrl(client) {
  if (client.slug === 'bellows-servicos-aeronauticos') return LINKS.casoBellows;
  if (client.slug === 'king-do-rio-pecas-aeronauticas') return LINKS.casoKingDoRio;
  return `${LINKS.casos}${client.slug}/`;
}

function clientLogoHtml(client, size = 'card') {
  if (!client.logoUrl) return '';
  const dim = size === 'featured' ? 140 : 96;
  return `<div class="as-portfolio-logo as-portfolio-logo--${size}">
    <img src="${client.logoUrl}" alt="${client.logoAlt || client.name}" width="${dim}" height="${dim}" loading="lazy" decoding="async"/>
  </div>`;
}

const PORTFOLIO_AUTH_NOTE =
  'Caso publicado com autorização formal de uso de nome e marca pelo cliente (junho/2026).';

function portfolioAuthNotice() {
  return htmlBlock(
    `<p class="as-portfolio-auth-note" role="note"><small>${PORTFOLIO_AUTH_NOTE}</small></p>`
  );
}

function clientCard(client) {
  const caseUrl = clientCaseUrl(client);
  return `
  <article class="as-portfolio-card as-reveal">
    ${clientLogoHtml(client, 'card')}
    <p class="as-portfolio-card__eyebrow">${client.segment}</p>
    <h3><a href="${caseUrl}">${client.name}</a></h3>
    <p class="as-portfolio-card__loc">${client.location}</p>
    <p>${client.summary}</p>
    <ul class="as-portfolio-card__tags">
      ${client.modules.map((m) => `<li>${m}</li>`).join('')}
    </ul>
    <a class="as-text-link" href="${caseUrl}">Ver caso completo →</a>
    <a class="as-portfolio-card__external" href="${client.website}" target="_blank" rel="noopener noreferrer">Site da operação ↗</a>
  </article>`;
}

function portfolioShowcaseMetrics(client) {
  const metrics = client.outcomeMetrics || [];
  return metrics
    .map(
      (m) => `<li class="as-portfolio-showcase__metric">
        <span class="as-portfolio-showcase__metric-value">${m.value}</span>
        <span class="as-portfolio-showcase__metric-label">${m.label}</span>
      </li>`
    )
    .join('');
}

function portfolioShowcaseArticle(client) {
  const caseUrl = clientCaseUrl(client);
  const highlight = client.highlight || client.summary;
  const modulePills = (client.modules || []).map((m) => `<li>${m}</li>`).join('');
  const regionBadge = client.badgeRegion || 'Brasil';

  return `
    <article class="as-portfolio-showcase as-reveal" aria-label="Caso em destaque: ${client.name}">
      <div class="as-portfolio-showcase__backdrop" aria-hidden="true"></div>
      <div class="as-portfolio-showcase__glow" aria-hidden="true"></div>
      <div class="as-portfolio-showcase__grid">
        <div class="as-portfolio-showcase__media">
          <div class="as-portfolio-showcase__logo-ring">
            ${clientLogoHtml(client, 'featured')}
          </div>
          <p class="as-portfolio-showcase__live">
            <span class="as-portfolio-showcase__live-dot" aria-hidden="true"></span>
            Cliente em operação
          </p>
        </div>
        <div class="as-portfolio-showcase__body">
          <div class="as-portfolio-showcase__badges">
            <span class="as-portfolio-showcase__badge">${regionBadge}</span>
            <span class="as-portfolio-showcase__badge as-portfolio-showcase__badge--gold">${client.segment.split('(')[0].trim()}</span>
          </div>
          <h3 class="as-portfolio-showcase__title"><a href="${caseUrl}">${client.name}</a></h3>
          <p class="as-portfolio-showcase__meta">${client.tradeName} · ${client.location}</p>
          <p class="as-portfolio-showcase__lead">${highlight}</p>
          <ul class="as-portfolio-showcase__metrics" aria-label="Destaques da operação">
            ${portfolioShowcaseMetrics(client)}
          </ul>
          <ul class="as-portfolio-showcase__pills">
            ${modulePills}
          </ul>
          <div class="as-btns as-btns--left as-portfolio-showcase__actions">
            <a class="as-btn as-btn--gold" href="${caseUrl}">Ler caso completo</a>
            <a class="as-btn as-btn--ghost" href="${client.website}" target="_blank" rel="noopener noreferrer">Site da operação ↗</a>
          </div>
        </div>
      </div>
    </article>`;
}

/** Teaser curto para páginas pilares / comparativo. */
export function portfolioTeaserBlock() {
  const names = PORTFOLIO_CLIENTS.slice(0, 2)
    .map((c) => `<a href="${clientCaseUrl(c)}">${c.tradeName || c.name}</a>`)
    .join(' e ');
  if (!names) return '';

  return htmlBlock(`
<aside class="as-portfolio-teaser as-reveal" aria-label="Clientes em operação">
  <div class="as-portfolio-teaser__copy">
    <p class="as-portfolio-teaser__label">Operações em produção</p>
    <p><strong>${names}</strong> utilizam a Aero Suite no dia a dia.</p>
    <a class="as-text-link" href="${LINKS.casos}">Ver portfólio de casos →</a>
  </div>
</aside>`);
}

/** Bloco na home, cards compactos (evita repetir o mesmo texto do showcase completo). */
export function clientsPortfolioBlock() {
  if (!PORTFOLIO_CLIENTS.length) return '';

  const cards = PORTFOLIO_CLIENTS.map((c) => clientCard(c)).join('');

  return htmlBlock(`
<section class="as-portfolio as-portfolio--home as-reveal" id="casos" aria-labelledby="as-portfolio-title">
  <div class="as-portfolio__inner">
    <header class="as-section-head as-section-head--portfolio">
      <p class="as-section-head__eyebrow">Operações em produção</p>
      <h2 id="as-portfolio-title">Quem já confia na Aero Suite</h2>
      <p class="as-section-head__sub as-portfolio-head__lead">
        <span class="as-portfolio-head__text">Oficinas MRO e distribuidoras de peças no Brasil.</span>
        <a class="as-text-link as-portfolio-head__link" href="${LINKS.casos}">Ver todos os casos</a>
      </p>
    </header>
    <div class="as-portfolio__grid as-portfolio__grid--home">
      ${cards}
    </div>
  </div>
</section>`);
}

export function buildPortfolioIndexContent() {
  const url = LINKS.casos;
  const cards = PORTFOLIO_CLIENTS.map((c) => clientCard(c)).join('');

  return [
    schemaBlock([
      organizationSchema(),
      webSiteSchema(),
      breadcrumbSchema([
        { name: 'Início', url: LINKS.home },
        { name: 'Casos', url },
      ]),
      webPageSchema({
        url,
        name: PORTFOLIO_INDEX_SEO.title,
        description: PORTFOLIO_INDEX_SEO.excerpt,
      }),
    ]),
    pageHeroBlock({
      eyebrow: 'Portfólio',
      title: 'Operações que utilizam a Aero Suite',
      lead: 'Casos reais de oficinas MRO e distribuidoras de peças aeronáuticas com gestão integrada de OS, estoque, propostas e rastreabilidade.',
    }),
    htmlBlock(`<section class="as-portfolio__grid as-portfolio__grid--page as-reveal">${cards}</section>`),
    portfolioAuthNotice(),
    demoCtaBlock({
      title: 'Sua operação pode ser a próxima',
      text: 'Agende uma demonstração e veja propostas, estoque ou OS no contexto do seu negócio.',
      location: 'portfolio_index',
    }),
  ].join('\n');
}

function buildCaseContent(client, seo, options) {
  if (!client) return '';

  const url = clientCaseUrl(client);
  const published = options.datePublished || '2026-06-02';
  const locationTag = options.locationTag || 'case_portfolio';
  const operationParagraphs = options.operationParagraphs || [];
  const contextParagraphs = options.contextParagraphs || [];
  const benefitParagraphs = options.benefitParagraphs || [];

  return [
    schemaBlock([
      organizationSchema(),
      webSiteSchema(),
      breadcrumbSchema([
        { name: 'Início', url: LINKS.home },
        { name: 'Casos', url: LINKS.casos },
        { name: client.name, url },
      ]),
      webPageSchema({ url, name: seo.title, description: seo.excerpt }),
      articleSchema({
        url,
        title: seo.title,
        description: seo.excerpt,
        datePublished: published,
      }),
    ]),
    pageHeroBlock({
      eyebrow: 'Caso de sucesso',
      title: client.name,
      lead: client.summary,
      image: client.logoUrl,
      imageAlt: client.logoAlt || client.name,
    }),
    proseSection('A operação', operationParagraphs),
    proseSection('Contexto', contextParagraphs),
    bulletSection(`Como a Aero Suite apoia a ${client.tradeName}`, client.modules),
    portfolioAuthNotice(),
    proseSection('Benefícios na rotina', benefitParagraphs),
    htmlBlock(`
<p class="as-blog-back"><a href="${LINKS.casos}">← Todos os casos</a> · <a href="${LINKS.contatoAgendar}" class="as-track-demo" data-as-event="cta_demo" data-as-location="${locationTag}">Agendar demonstração</a></p>`),
    demoCtaBlock({
      title: 'Avalie na sua operação',
      text: 'Demonstração de 30 minutos com os módulos que fazem sentido para você, sem compromisso.',
      location: `${locationTag}_footer`,
    }),
  ].join('\n');
}

export function buildBellowsCaseContent() {
  const client = getClientBySlug('bellows-servicos-aeronauticos');
  return buildCaseContent(client, BELLOWS_CASE_SEO, {
    locationTag: 'case_bellows',
    operationParagraphs: [
      `<strong>${client.tradeName}</strong> (${client.name}) atua em <strong>manutenção aeronáutica</strong> no Rio de Janeiro, com foco em serviços para componentes e turbinas, incluindo linhas como PT6, conforme o escopo da oficina.`,
      `Site institucional: <a href="${client.website}" target="_blank" rel="noopener noreferrer">${client.website.replace(/^https:\/\//, '')}</a> (informações públicas da operação).`,
    ],
    contextParagraphs: [
      'Oficinas com manutenção especializada precisam demonstrar rastreio de peças, histórico de OS e documentos técnicos, especialmente sob pressão de auditoria ou retrabalho entre hangar e almoxarifado.',
      'Planilhas e arquivos soltos dificultam manter uma única versão da ordem de serviço e do estoque vinculado ao serviço em execução.',
    ],
    benefitParagraphs: [
      'Centralização da OS como eixo da manutenção, com status, responsáveis e anexos consultáveis.',
      'Movimentações de estoque e peças com contexto operacional, menos divergência entre o que está no hangar e o que está registrado.',
      'Ambiente em nuvem com perfis de acesso (RBAC), alinhado a operações que exigem controle e trilha auditável.',
    ],
  });
}

export function buildKingDoRioCaseContent() {
  const client = getClientBySlug('king-do-rio-pecas-aeronauticas');
  return buildCaseContent(client, KING_DO_RIO_CASE_SEO, {
    locationTag: 'case_king_do_rio',
    datePublished: '2026-06-03',
    operationParagraphs: [
      `<strong>${client.name}</strong> atua na <strong>distribuição de peças e componentes aeronáuticos</strong> no Rio de Janeiro, com foco em atendimento ágil a oficinas, operadores e demandas de reposição.`,
      `Site institucional: <a href="${client.website}" target="_blank" rel="noopener noreferrer">${client.website.replace(/^https:\/\//, '')}</a>.`,
    ],
    contextParagraphs: [
      'Distribuidoras precisam alinhar proposta comercial, disponibilidade real e reserva de peças, sem depender de planilhas desconectadas do estoque.',
      'Quando orçamento e almoxarifado não conversam, aumentam retrabalho, ruptura de linha e risco em auditorias de rastreabilidade.',
    ],
    benefitParagraphs: [
      'Propostas comerciais amarradas ao estoque, o que foi cotado reflete o que pode ser reservado e entregue.',
      'Controle de estoque com rastreabilidade e visão de movimentação para equipe comercial e almoxarifado.',
      'Menos versões paralelas de preço e saldo: um fluxo único da cotação à saída da peça.',
    ],
  });
}

