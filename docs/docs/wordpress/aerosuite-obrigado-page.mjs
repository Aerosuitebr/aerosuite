import { LINKS } from './aerosuite-site-config.mjs';
import { schemaBlock, demoCtaBlock } from './aerosuite-shared-blocks.mjs';
import { breadcrumbSchema, organizationSchema, webPageSchema, webSiteSchema } from './aerosuite-schema.mjs';
import { htmlBlock } from './aerosuite-html.mjs';

export const OBRIGADO_SEO = {
  slug: 'obrigado',
  title: 'Obrigado, recebemos seu contato | Aero Suite',
  excerpt: 'Sua solicitação foi registrada. Nossa equipe retorna em até um dia útil.',
};

export function buildObrigadoContent() {
  const url = LINKS.obrigado;
  return [
    schemaBlock([
      organizationSchema(),
      webSiteSchema(),
      breadcrumbSchema([
        { name: 'Início', url: LINKS.home },
        { name: 'Obrigado', url },
      ]),
      webPageSchema({
        url,
        name: OBRIGADO_SEO.title,
        description: OBRIGADO_SEO.excerpt,
      }),
    ]),
    htmlBlock(`
<section class="as-thank-you as-reveal" aria-labelledby="as-thank-title">
  <div class="as-thank-you__inner">
    <p class="as-thank-you__eyebrow">Contato recebido</p>
    <h1 id="as-thank-title">Obrigado!</h1>
    <p class="as-thank-you__lead">Registramos sua solicitação. Em até <strong>um dia útil</strong> retornamos com horários ou material da suíte.</p>
    <p class="as-thank-you__hint" data-as-thank-hint="form">Envio pelo formulário confirmado.</p>
    <p class="as-thank-you__hint" data-as-thank-hint="calendly">Demonstração agendada no calendário.</p>
    <div class="as-thank-you__actions">
      <a class="as-btn as-btn--gold" href="${LINKS.home}">Voltar ao início</a>
      <a class="as-btn as-btn--ghost as-btn-whatsapp as-track-whatsapp" href="${LINKS.whatsapp}" target="_blank" rel="noopener noreferrer" data-as-event="cta_whatsapp" data-as-location="thank_you">WhatsApp</a>
    </div>
  </div>
</section>`),
    demoCtaBlock({
      title: 'Enquanto isso, explore os guias MRO',
      text: 'Artigos sobre estoque FIFO, OS, portal do cliente e substituição de planilhas.',
      location: 'thank_you_guides',
    }),
    htmlBlock(`<p class="as-blog-back"><a href="${LINKS.blog}">Ir ao blog</a></p>`),
  ].join('\n');
}
