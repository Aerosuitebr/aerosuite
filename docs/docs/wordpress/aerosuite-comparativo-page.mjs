import { LINKS } from './aerosuite-site-config.mjs';
import { schemaBlock, pageHeroBlock, demoCtaBlock, bulletSection, knowledgeHubBlock } from './aerosuite-shared-blocks.mjs';
import { portfolioTeaserBlock } from './aerosuite-portfolio.mjs';
import { breadcrumbSchema, organizationSchema, softwareApplicationSchema, webPageSchema, webSiteSchema } from './aerosuite-schema.mjs';
import { htmlBlock } from './aerosuite-html.mjs';

export const COMPARATIVO_SEO = {
  slug: 'aero-suite-vs-planilhas',
  title: 'Aero Suite vs planilhas na gestão MRO | Comparativo',
  excerpt:
    'Compare planilhas e WhatsApp com software MRO: rastreabilidade, OS, estoque FIFO e portal do cliente em uma única plataforma.',
};

export function buildComparativoContent() {
  const url = LINKS.comparativo;
  return [
    schemaBlock([
      organizationSchema(),
      softwareApplicationSchema(),
      webSiteSchema(),
      breadcrumbSchema([
        { name: 'Início', url: LINKS.home },
        { name: 'Aero Suite vs planilhas', url },
      ]),
      webPageSchema({ url, name: COMPARATIVO_SEO.title, description: COMPARATIVO_SEO.excerpt }),
    ]),
    pageHeroBlock({
      eyebrow: 'Comparativo',
      title: 'Planilhas vs software MRO: o que muda na oficina',
      lead:
        'Planilhas funcionam até o primeiro desvio de peça, versão conflitante de OS ou auditoria pedindo rastreio. Veja quando faz sentido centralizar na Aero Suite.',
    }),
    htmlBlock(`
<section class="as-comparison-table as-reveal" aria-label="Comparativo planilhas e Aero Suite">
  <table>
    <thead>
      <tr><th scope="col">Critério</th><th scope="col">Planilhas / grupos</th><th scope="col">Aero Suite</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">Ordem de serviço</th><td>Versões paralelas, histórico frágil</td><td>OS única com status, job cards e documentos</td></tr>
      <tr><th scope="row">Estoque de peças</th><td>Saldo sem vínculo claro à OS</td><td>FIFO, movimentações e reserva na OS</td></tr>
      <tr><th scope="row">Proposta comercial</th><td>Desconectada do hangar</td><td>Proposta alinhada ao escopo técnico</td></tr>
      <tr><th scope="row">Cliente externo</th><td>Ligações e prints</td><td>Portal com status e documentos</td></tr>
      <tr><th scope="row">Auditoria / RBAC</th><td>Difícil reconstruir trilha</td><td>RBAC, histórico e ambiente por organização</td></tr>
    </tbody>
  </table>
</section>`),
    bulletSection('Quando migrar', [
      'Mais de uma planilha “oficial” para OS ou estoque',
      'Peça sem rastreio confiável até a aeronave',
      'Cliente cobrando transparência que a equipe não consegue dar em tempo real',
      'Auditoria ou conformidade exigindo demonstrar movimentações',
    ]),
    knowledgeHubBlock(),
    portfolioTeaserBlock(),
    demoCtaBlock({
      title: 'Valide na sua operação em 30 minutos',
      text: 'Demonstração gratuita com cenário real do seu hangar, sem compromisso.',
      location: 'comparativo_footer',
    }),
  ].join('\n');
}
