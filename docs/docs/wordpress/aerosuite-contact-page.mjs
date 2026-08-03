import { LINKS, isCalendlyConfigured } from './aerosuite-site-config.mjs';
import { CONTATO_SEO, buildContatoExploreBlock } from './aerosuite-seo.mjs';
import { contactPageSchema } from './aerosuite-schema.mjs';
import { schemaBlock, pageHeroBlock, calendlyEmbedBlock } from './aerosuite-shared-blocks.mjs';
import { htmlBlock, WPFORMS_CONTACT_BLOCK } from './aerosuite-html.mjs';

export { CONTACT_SEO } from './aerosuite-seo.mjs';

export function buildContactContent() {
  const formHeading = isCalendlyConfigured() ? 'Ou envie uma mensagem' : 'Solicite sua demonstração';

  return [
    schemaBlock(contactPageSchema()),
    pageHeroBlock({
      eyebrow: 'Demonstração gratuita',
      title: 'Agende uma demonstração da Aero Suite',
      lead: 'Mostramos OS, estoque FIFO, propostas e portal do cliente no fluxo real de uma oficina MRO. Resposta em até um dia útil.',
    }),
    calendlyEmbedBlock(),
    `<!-- wp:group {"tagName":"section","anchor":"formulario-contato","className":"as-contact-grid as-reveal","layout":{"type":"default"}} -->
<section id="formulario-contato" class="wp-block-group as-contact-grid as-reveal" aria-label="Formulário e contato">
<!-- wp:group {"className":"as-contact-grid__col","layout":{"type":"constrained"}} -->
<div class="wp-block-group as-contact-grid__col">
<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">${formHeading}</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Preencha o formulário e nossa equipe retorna com proposta de horário e material da suíte.</p>
<!-- /wp:paragraph -->

${WPFORMS_CONTACT_BLOCK}
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"as-contact-grid__col as-contact-grid__aside","layout":{"type":"constrained"}} -->
<div class="wp-block-group as-contact-grid__col as-contact-grid__aside">
<!-- wp:html -->
<h2>Contato direto</h2>
<ul class="as-contact-list">
  <li><strong>WhatsApp comercial</strong><br/><a class="as-btn-whatsapp as-track-whatsapp" href="${LINKS.whatsapp}" target="_blank" rel="noopener noreferrer" data-as-event="cta_whatsapp" data-as-location="contact_aside">Iniciar conversa</a></li>
  <li><strong>Retorno</strong><br/>Até 1 dia útil em dias de expediente</li>
  <li><strong>Demonstração</strong><br/>Online · ~30 min · sem compromisso</li>
</ul>
<p class="as-contact-note">Preferimos entender sua operação (tipo de aeronave, volume de OS, estoque) para personalizar a demo.</p>
<!-- /wp:html -->
</div>
<!-- /wp:group -->
</section>
<!-- /wp:group -->`,
    htmlBlock(`
<section class="as-trust-bar as-reveal" aria-label="Garantias">
  <div class="as-trust-bar__inner">
    <span class="as-trust-bar__item">Sem instalação local, 100% nuvem</span>
    <span class="as-trust-bar__item">Foco em oficinas e MRO no Brasil</span>
    <span class="as-trust-bar__item">RBAC e rastreabilidade operacional</span>
  </div>
</section>`),
    buildContatoExploreBlock(),
  ].join('\n');
}
