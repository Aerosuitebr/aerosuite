import { MEDIA, LINKS, SITE } from './aerosuite-site-config.mjs';
import { sobrePageSchema } from './aerosuite-schema.mjs';
import {
  schemaBlock,
  pageHeroBlock,
  demoCtaBlock,
  proseSection,
  bulletSection,
  flexibilityValueBlock,
} from './aerosuite-shared-blocks.mjs';
import { complianceRegulatorsBlock, complianceDisclaimerBlock } from './aerosuite-compliance-blocks.mjs';
import { htmlBlock } from './aerosuite-html.mjs';
import { PORTFOLIO_CLIENTS } from './aerosuite-clients.mjs';

export const SOBRE_SEO = {
  title: 'Sobre a Aero Suite, conformidade e gestão MRO no Brasil',
  excerpt:
    'Plataforma SaaS brasileira para oficinas MRO: conformidade regulatória integrada, evidências SGQ, rastreabilidade e RBAC, sem a complexidade de ERP genérico.',
};

export function buildSobreContent() {
  return [
    schemaBlock(sobrePageSchema()),
    pageHeroBlock({
      eyebrow: 'Quem somos · Conformidade primeiro',
      title: 'Gestão aeronáutica e conformidade regulatória para o hangar brasileiro',
      lead:
        'A Aero Suite nasceu para oficinas e MROs que operam sob pressão de ANAC, RBAC 145 e auditorias, com ferramentas que organizam a rotina, poupam tempo da equipe e apoiam evidências operacionais integradas.',
      image: MEDIA.logoLight,
    }),
    proseSection('Nossa missão', [
      'Centralizar ordens de serviço, estoque, qualidade (SGQ), propostas e portal do cliente em um único ambiente em nuvem, com trilha auditável, export de evidências e perfis de acesso claros.',
      'Acreditamos que aderência regulatória e produtividade vêm de processo visível: cada movimentação de peça, cada alerta SGQ na OS, cada CRS emitido e cada export de dossiê deve estar a um clique de distância na hora da fiscalização.',
    ]),
    bulletSection('Por que a Aero Suite', [
      'Conformidade regulatória integrada | SMS, export SGQ, dossiê, CRS, certificados e quarentena',
      'Foco exclusivo em manutenção aeronáutica e MRO, não é ERP genérico adaptado',
      '100% nuvem: sem instalação local, atualizações contínuas com novas ferramentas SGQ',
      'RBAC Part 145, segregação CRS e isolamento por organização',
      'Flexibilidade: análise de adequação à operação e customizações em ciclos ágeis',
      'Suporte e evolução alinhados ao mercado brasileiro',
      'Demonstração personalizada com foco em auditoria e fiscalização',
    ]),
    complianceRegulatorsBlock(),
    htmlBlock(`
<section class="as-prose-section as-reveal" aria-labelledby="as-sobre-casos">
  <h2 id="as-sobre-casos">Operações que utilizam a suíte</h2>
  <p>Trabalhamos com oficinas, MROs e distribuidoras brasileiras em produção, como <strong><a href="${LINKS.casoBellows}">${PORTFOLIO_CLIENTS[0]?.name || 'Bellows'}</a></strong> e <strong><a href="${LINKS.casoKingDoRio}">${PORTFOLIO_CLIENTS[1]?.name || 'King do Rio'}</a></strong>, cada uma com módulos e extensões alinhados à sua rotina e exigências regulatórias.</p>
  <p><a class="as-text-link" href="${LINKS.casos}">Ver portfólio de casos →</a> · <a class="as-text-link" href="${LINKS.conformidade}">Conformidade regulatória →</a></p>
</section>
<section class="as-prose-section as-reveal" aria-labelledby="as-sobre-confianca">
  <h2 id="as-sobre-confianca">Confiança perante reguladores e clientes</h2>
  <p>Trabalhamos com oficinas que operam sob exigências de rastreabilidade (incluindo contextos RBAC 145). Na demonstração mostramos dossiê, export SGQ, indicadores SMS e fluxo real do hangar, sem promessas genéricas.</p>
  <div class="as-kpi-strip as-reveal">
    <div class="as-kpi"><div class="as-kpi__val">SGQ</div><div class="as-kpi__label">SMS · export ZIP</div></div>
    <div class="as-kpi"><div class="as-kpi__val gold">145</div><div class="as-kpi__label">Perfis · CRS</div></div>
    <div class="as-kpi"><div class="as-kpi__val">MRO</div><div class="as-kpi__label">Foco aeronáutico</div></div>
    <div class="as-kpi"><div class="as-kpi__val gold">BR</div><div class="as-kpi__label">ANAC · RBAC</div></div>
  </div>
  <p>E-mail: <a href="mailto:${SITE.email}">${SITE.email}</a> · <a class="as-text-link" href="${LINKS.blog}">Blog e guias MRO</a></p>
</section>`),
    complianceDisclaimerBlock(),
    flexibilityValueBlock(),
    demoCtaBlock({
      title: 'Conheça conformidade e módulos na prática',
      text: 'Agende uma demonstração gratuita com foco em evidências SGQ, dossiê auditoria e operação integrada.',
      location: 'sobre_footer',
    }),
  ].join('\n');
}
