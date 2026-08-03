import { LINKS } from './aerosuite-site-config.mjs';
import { SOLUCOES_SEO, buildSolucoesExploreBlock } from './aerosuite-seo.mjs';
import { solucoesPageSchema } from './aerosuite-schema.mjs';
import {
  schemaBlock,
  pageHeroBlock,
  demoCtaBlock,
  knowledgeHubBlock,
  flexibilityValueBlock,
} from './aerosuite-shared-blocks.mjs';
import {
  complianceNewToolsBlock,
  complianceTeamBenefitsBlock,
  complianceDisclaimerBlock,
} from './aerosuite-compliance-blocks.mjs';
import { showcaseBlock } from './aerosuite-content.mjs';
import { htmlBlock } from './aerosuite-html.mjs';

export { SOLUCOES_SEO };

export function buildSolucoesContent() {
  return [
    schemaBlock(solucoesPageSchema()),
    pageHeroBlock({
      eyebrow: 'Suíte integrada · Conformidade + MRO',
      title: 'Soluções que unem operação, estoque e conformidade regulatória',
      lead:
        'Hangar, almoxarifado, qualidade e comercial na mesma plataforma, com SGQ operacional, dossiê auditoria, CRS, certificados e rastreio FIFO para oficinas sob exigência de ANAC e RBAC 145.',
    }),
    complianceNewToolsBlock({ id: 'solucoes-conformidade' }),
    showcaseBlock(),
    htmlBlock(`
<section class="as-prose-section as-reveal" aria-labelledby="as-sol-integracao">
  <h2 id="as-sol-integracao">Uma operação, um fluxo, com evidências para auditores</h2>
  <p>Cada módulo conversa com os demais e alimenta a base de conformidade: peça reservada na OS, CRS emitido com segregação, export SGQ consolidado, cliente acompanhando no portal, sem planilhas paralelas nem retrabalho entre equipes.</p>
  <ul class="as-check-list">
    <li><strong>Conformidade SGQ</strong>, painel qualidade, indicadores SMS, export ZIP e enforcement na OS</li>
    <li>Ordem de serviço como eixo (status, job cards, CRS, documentos, alertas regulatórios)</li>
    <li>Estoque aeronáutico com FIFO, certificado de peça, quarentena e linha do tempo</li>
    <li>Dossiê e pacote auditoria multi-OS (PDF + ZIP com anexos e pasta SGQ)</li>
    <li>Propostas comerciais ligadas ao escopo técnico da OS</li>
    <li>Portal externo para transparência com o proprietário da aeronave</li>
    <li>Perfis Part 145, RBAC e trilha auditável por função no hangar</li>
  </ul>
  <p><a class="as-text-link" href="${LINKS.conformidade}">Página completa de conformidade →</a> · <a class="as-text-link" href="${LINKS.recursos}">Ver módulos na home</a> · <a class="as-text-link" href="${LINKS.contatoAgendar}">Agendar demonstração</a></p>
</section>`),
    complianceTeamBenefitsBlock(),
    flexibilityValueBlock(),
    buildSolucoesExploreBlock(),
    complianceDisclaimerBlock(),
    knowledgeHubBlock(),
    demoCtaBlock({
      title: 'Veja conformidade e módulos na sua oficina',
      text: 'Demonstração guiada de 30 minutos com OS, estoque FIFO, export SGQ, dossiê e portal, no contexto da sua operação MRO.',
      location: 'solucoes_footer',
    }),
  ].join('\n');
}
