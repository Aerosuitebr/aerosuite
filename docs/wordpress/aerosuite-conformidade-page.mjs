import { LINKS } from './aerosuite-site-config.mjs';
import { CONFORMIDADE_SEO } from './aerosuite-seo.mjs';
import { conformidadePageSchema } from './aerosuite-schema.mjs';
import {
  schemaBlock,
  pageHeroBlock,
  demoCtaBlock,
  knowledgeHubBlock,
} from './aerosuite-shared-blocks.mjs';
import {
  complianceBlock,
  complianceNewToolsBlock,
  complianceTeamBenefitsBlock,
  complianceRegulatorsBlock,
  complianceDisclaimerBlock,
} from './aerosuite-compliance-blocks.mjs';
import { htmlBlock } from './aerosuite-html.mjs';

export { CONFORMIDADE_SEO };

export function buildConformidadeContent() {
  return [
    schemaBlock(conformidadePageSchema()),
    htmlBlock(`
<section class="as-conformidade-hero as-reveal" aria-labelledby="as-conf-hero-title">
  <div class="as-conformidade-hero__inner">
    <p class="as-conformidade-hero__eyebrow"><span class="as-pulse-dot" aria-hidden="true"></span> Aero Compliance · Maturidade regulatória</p>
    <h1 id="as-conf-hero-title">Conformidade operacional para oficinas que respondem a <em>ANAC</em>, <em>RBAC 145</em> e auditores</h1>
    <p class="as-conformidade-hero__lead">A Aero Suite integra hangar, estoque, qualidade e evidências SGQ em uma plataforma poderosa, que <strong>organiza a rotina de toda a equipe</strong>, <strong>poupa tempo</strong> em fiscalizações e <strong>facilita a demonstração de controle</strong> perante os órgãos reguladores.</p>
    <div class="as-conformidade-hero__tags">
      <span>Indicadores SMS</span><span>Export SGQ ZIP</span><span>Dossiê multi-OS</span><span>CRS · Certificados</span><span>Enforcement</span>
    </div>
    <div class="as-conformidade-hero__actions">
      <a class="as-btn as-btn--gold as-track-demo" href="${LINKS.contatoAgendar}" data-as-event="cta_demo" data-as-location="conformidade_hero">Agendar demo de conformidade</a>
      <a class="as-btn as-btn--ghost" href="${LINKS.prontidaoRegulatoria}">Ver na página inicial</a>
    </div>
  </div>
</section>`),
    complianceNewToolsBlock({ id: 'ferramentas-sgq' }),
    complianceBlock({ showFootCta: false, linkToPage: false }),
    complianceTeamBenefitsBlock(),
    complianceRegulatorsBlock(),
    htmlBlock(`
<section class="as-prose-section as-reveal" aria-labelledby="as-conf-workflow">
  <h2 id="as-conf-workflow">Do dia a dia à fiscalização, sem correria</h2>
  <p>Cada movimentação registrada no hangar alimenta automaticamente a base de evidências. Quando chega a inspeção, a equipe exporta dossiê, pacote SGQ ou ZIP multi-OS, em vez de remontar histórico manualmente.</p>
  <ol class="as-compliance-workflow">
    <li><strong>Operação normal</strong> | OS, FIFO, certificados, CRS e alertas SGQ na rotina.</li>
    <li><strong>Preparação contínua</strong>, indicadores SMS, checklists e trilha RBAC acompanham qualidade.</li>
    <li><strong>Inspeção ou auditoria</strong>, export consolidado, linha do tempo da peça e dossiê por OS.</li>
    <li><strong>Demonstração ao regulador</strong>, evidências estruturadas, rastreáveis e auditáveis.</li>
  </ol>
  <p><a class="as-text-link" href="${LINKS.solucoes}">Ver todos os módulos da suíte →</a></p>
</section>`),
    complianceDisclaimerBlock(),
    knowledgeHubBlock(),
    demoCtaBlock({
      title: 'Veja conformidade na sua operação',
      text: 'Demonstração guiada com dossiê, export SGQ, indicadores SMS e fluxo real de OS, alinhada ao contexto Part 145 / MRO.',
      location: 'conformidade_footer',
    }),
  ].join('\n');
}
