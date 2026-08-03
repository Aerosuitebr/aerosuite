import { htmlBlock } from './aerosuite-html.mjs';
import {
  LINKS,
  PILLAR_PAGES,
  CALENDLY_EMBED_URL,
  isCalendlyConfigured,
  isTourVideoConfigured,
  TOUR_VIDEO,
  MEDIA,
} from './aerosuite-site-config.mjs';
import { schemaScriptBlock } from './aerosuite-schema.mjs';

export function schemaBlock(graph) {
  return htmlBlock(schemaScriptBlock(graph));
}

export function pageHeroBlock({ eyebrow, title, lead, image, imageAlt = '' }) {
  const img = image
    ? `<div class="as-page-hero__media as-page-hero__media--logo"><img src="${image}" alt="${imageAlt}" width="280" height="280" loading="eager" decoding="async"/></div>`
    : '';
  return htmlBlock(`
<section class="as-page-hero as-reveal">
  <div class="as-page-hero__inner">
    <div class="as-page-hero__copy">
      ${eyebrow ? `<p class="as-page-hero__eyebrow">${eyebrow}</p>` : ''}
      <h1>${title}</h1>
      ${lead ? `<p class="as-page-hero__lead">${lead}</p>` : ''}
      <div class="as-page-hero__actions">
        <a class="as-btn as-btn--gold as-track-demo" href="${LINKS.contatoAgendar}" data-as-event="cta_demo" data-as-location="page_hero">Agendar demonstração</a>
        <a class="as-btn as-btn--ghost as-btn-whatsapp as-track-whatsapp" href="${LINKS.whatsapp}" target="_blank" rel="noopener noreferrer" data-as-event="cta_whatsapp" data-as-location="page_hero">WhatsApp</a>
      </div>
    </div>
    ${img}
  </div>
</section>`);
}

export function demoCtaBlock({ title, text, location = 'inline' }) {
  return htmlBlock(`
<section class="as-cta-band as-cta-band--compact as-reveal" data-as-cta-location="${location}">
  <h2>${title}</h2>
  <p>${text}</p>
  <div class="as-btns">
    <a class="primary as-track-demo" href="${LINKS.contatoAgendar}" data-as-event="cta_demo" data-as-location="${location}">Agendar demonstração gratuita</a>
    <a class="ghost as-btn-whatsapp as-track-whatsapp" href="${LINKS.whatsapp}" target="_blank" rel="noopener noreferrer" data-as-event="cta_whatsapp" data-as-location="${location}">Falar pelo WhatsApp</a>
  </div>
</section>`);
}

export function knowledgeHubBlock() {
  const cards = PILLAR_PAGES.map(
    (p) => `
    <a class="as-hub-card" href="${p.url}">
      <span class="as-hub-card__tag">Guia</span>
      <h3>${p.title}</h3>
      <p>${p.focus}</p>
      <span class="as-hub-card__link">Ler guia <span aria-hidden="true">→</span></span>
    </a>`
  ).join('');
  return htmlBlock(`
<section class="as-knowledge-hub as-reveal" aria-labelledby="as-hub-title">
  <div class="as-knowledge-hub__inner">
    <header class="as-section-head">
      <p class="as-section-head__eyebrow">Conteúdo para gestores MRO</p>
      <h2 id="as-hub-title">Guias sobre gestão aeronáutica, estoque e conformidade</h2>
      <p class="as-section-head__sub">Material objetivo para oficinas, MROs e organizações de manutenção que buscam software, rastreabilidade e controle operacional no Brasil.</p>
    </header>
    <div class="as-knowledge-hub__grid">${cards}</div>
  </div>
</section>`);
}

export function relatedPillarsBlock(currentSlug) {
  const others = PILLAR_PAGES.filter((p) => p.slug !== currentSlug).slice(0, 3);
  const links = others
    .map((p) => `<li><a href="${p.url}">${p.title}</a></li>`)
    .join('');
  return htmlBlock(`
<nav class="as-related-pillars as-reveal" aria-label="Guias relacionados">
  <h2>Continue explorando</h2>
  <ul>${links}</ul>
  <p><a class="as-text-link" href="${LINKS.home}">Voltar à página inicial</a></p>
</nav>`);
}

export function proseSection(title, paragraphs) {
  const ps = paragraphs.map((p) => `<p>${p}</p>`).join('');
  return htmlBlock(`
<section class="as-prose-section as-reveal">
  <h2>${title}</h2>
  ${ps}
</section>`);
}

export function bulletSection(title, items) {
  const lis = items.map((i) => `<li>${i}</li>`).join('');
  return htmlBlock(`
<section class="as-prose-section as-reveal">
  <h2>${title}</h2>
  <ul class="as-check-list">${lis}</ul>
</section>`);
}

/** Tour em vídeo — home (poster + modal com player, tela cheia e compartilhar). */
export function tourVideoShowcaseBlock() {
  if (!isTourVideoConfigured() || !TOUR_VIDEO) return '';

  const { videoMp4, poster, durationLabel, title } = TOUR_VIDEO;
  const previewThumb = MEDIA.dashboard || poster;
  const shareUrl = LINKS.videoTour;
  const shareMessage =
    'Conheça a Aero Suite: tour em vídeo da plataforma de gestão MRO, estoque e conformidade para oficinas aeronáuticas.';
  const waShare = `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${shareUrl}`)}`;
  const liShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  return htmlBlock(`
<section class="as-tour-video as-reveal" id="video-tour" aria-labelledby="as-tour-video-title" data-as-tour-video-root data-as-share-url="${shareUrl}" data-as-share-text="${shareMessage}">
  <div class="as-tour-video__inner">
    <header class="as-section-head as-section-head--light as-section-head--compact as-tour-video__head">
      <p class="as-section-head__eyebrow">Tour em vídeo</p>
      <h2 id="as-tour-video-title">Veja a Aero Suite em ação</h2>
      <p class="as-section-head__sub as-section-head__sub--light">Do hangar ao painel: OS, estoque FIFO, SGQ e portal do cliente em um tour cinematográfico da plataforma.</p>
    </header>
    <div class="as-tour-video__stage">
      <button type="button" class="as-tour-video__poster" data-as-tour-video-open aria-label="Reproduzir tour em vídeo da Aero Suite">
        <span class="as-tour-video__thumb-wrap">
          <img src="${previewThumb}" alt="Prévia do dashboard Aero Suite no tour em vídeo" width="1280" height="720" loading="lazy" decoding="async" sizes="(max-width:768px) 96vw, 960px"/>
          <span class="as-tour-video__overlay" aria-hidden="true"></span>
        </span>
        <span class="as-tour-video__play" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="64" height="64" focusable="false"><circle cx="32" cy="32" r="31" fill="rgba(5,26,61,.55)" stroke="rgba(255,255,255,.85)" stroke-width="1.5"/><path d="M26 20v24l22-12z" fill="#fff"/></svg>
        </span>
        <span class="as-tour-video__badge">${durationLabel}</span>
      </button>
      <p class="as-tour-video__hint">Clique para assistir em tela ampla — com controles, tela cheia e opções de compartilhar.</p>
    </div>
  </div>
  <div class="as-tour-video-modal" data-as-tour-video-modal hidden aria-hidden="true">
    <div class="as-tour-video-modal__backdrop" data-as-tour-video-close tabindex="-1" aria-hidden="true"></div>
    <div class="as-tour-video-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="as-tour-video-modal-title">
      <header class="as-tour-video-modal__bar">
        <h3 id="as-tour-video-modal-title" class="as-tour-video-modal__title">${title}</h3>
        <div class="as-tour-video-modal__actions">
          <div class="as-tour-video-modal__share-wrap">
            <button type="button" class="as-tour-video-modal__btn" data-as-tour-video-share aria-expanded="false" aria-controls="as-tour-video-share-menu">
              <span aria-hidden="true">⎘</span> Compartilhar
            </button>
            <div class="as-tour-video-modal__share-menu" id="as-tour-video-share-menu" data-as-tour-video-share-menu hidden>
              <button type="button" data-as-tour-video-copy-link>Copiar link</button>
              <a href="${waShare}" target="_blank" rel="noopener noreferrer" data-as-event="cta_whatsapp" data-as-location="video_tour_share">WhatsApp</a>
              <a href="${liShare}" target="_blank" rel="noopener noreferrer" data-as-location="video_tour_share">LinkedIn</a>
            </div>
          </div>
          <button type="button" class="as-tour-video-modal__btn" data-as-tour-video-fullscreen aria-label="Tela cheia">
            <span aria-hidden="true">⛶</span> Tela cheia
          </button>
          <button type="button" class="as-tour-video-modal__btn as-tour-video-modal__btn--close" data-as-tour-video-close aria-label="Fechar vídeo">
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </header>
      <div class="as-tour-video-modal__player-wrap" data-as-tour-video-player-wrap>
        <video class="as-tour-video-modal__video" data-as-tour-video-player controls playsinline preload="metadata" poster="${poster}" title="${title}">
          <source src="${videoMp4}" type="video/mp4"/>
          Seu navegador não suporta reprodução de vídeo HTML5.
        </video>
      </div>
    </div>
  </div>
</section>`);
}

export function calendlyEmbedBlock() {
  if (!isCalendlyConfigured()) {
    return htmlBlock(`
<div class="as-calendly-fallback as-reveal" id="agendar-demo">
  <h2 class="as-calendly-wrap__title">Agendar demonstração</h2>
  <p class="as-calendly-wrap__sub">Envie o formulário abaixo ou fale pelo WhatsApp. Retornamos em até um dia útil com horários para uma demo de 30 minutos (OS, estoque e portal do cliente).</p>
  <div class="as-btns">
    <a class="as-btn as-btn--gold as-track-demo" href="#formulario-contato" data-as-event="cta_demo" data-as-location="contact_fallback">Ir para o formulário</a>
    <a class="as-btn as-btn--ghost as-btn-whatsapp as-track-whatsapp" href="${LINKS.whatsapp}" target="_blank" rel="noopener noreferrer" data-as-event="cta_whatsapp" data-as-location="contact_fallback">WhatsApp comercial</a>
  </div>
</div>`);
  }
  const url = CALENDLY_EMBED_URL;
  return htmlBlock(`
<div class="as-calendly-wrap as-reveal" id="agendar-demo">
  <h2 class="as-calendly-wrap__title">Escolha o melhor horário</h2>
  <p class="as-calendly-wrap__sub">Demonstração online de 30 minutos, fluxo real de OS, estoque e portal do cliente.</p>
  <div class="calendly-inline-widget" data-url="${url}" data-as-calendly-url="${url}" style="min-width:280px;height:700px;"></div>
</div>`);
}

/** Flexibilidade, adequação e customização ágil, home, soluções, sobre. */
export function flexibilityValueBlock() {
  return htmlBlock(`
<section class="as-flexibility as-reveal" id="flexibilidade" aria-labelledby="as-flexibility-title">
  <div class="as-flexibility__inner">
    <header class="as-section-head as-section-head--compact">
      <p class="as-section-head__eyebrow">Flexibilidade operacional</p>
      <h2 id="as-flexibility-title">Adequação à sua operação, com evolução ágil</h2>
      <p class="as-section-head__sub">A suíte não é um pacote engessado: avaliamos juntos o que faz sentido para o seu hangar ou distribuidora e evoluímos o sistema com implementações customizadas em prazos curtos.</p>
    </header>
    <div class="as-flexibility__grid">
      <article class="as-premium-card as-flexibility__card as-flexibility__card--analysis">
        <span class="as-flexibility__step" aria-hidden="true">1</span>
        <h3>Análise de adequação</h3>
        <p>Mapeamos processos, módulos em uso e lacunas, propostas, estoque, OS, portal ou combinações, para alinhar expectativa e escopo antes de customizar.</p>
      </article>
      <article class="as-premium-card as-flexibility__card as-flexibility__card--roadmap">
        <span class="as-flexibility__step" aria-hidden="true">2</span>
        <h3>Roadmap sob medida</h3>
        <p>Priorizamos o que destrava valor na sua operação: fluxos, campos, relatórios ou integrações, sem obrigar adotar o que você não precisa agora.</p>
      </article>
      <article class="as-premium-card as-flexibility__card as-flexibility__card--delivery">
        <span class="as-flexibility__step" aria-hidden="true">3</span>
        <h3>Customização em tempo ágil</h3>
        <p>Implementações customizadas com ciclos curtos de entrega e validação, sua equipe acompanha e a operação não fica parada esperando um “big bang”.</p>
      </article>
    </div>
    <p class="as-flexibility__note">Na demonstração, discutimos o que é padrão da suíte e o que pode ser estendido para o seu caso, como nas operações em <a class="as-text-link" href="${LINKS.casos}">produção no portfólio</a>.</p>
    <div class="as-btns as-flexibility__cta">
      <a class="as-btn as-btn--gold as-track-demo" href="${LINKS.contatoAgendar}" data-as-event="cta_demo" data-as-location="flexibility">Falar sobre adequação</a>
    </div>
  </div>
</section>`);
}

export function blogDemoCtaBlock() {
  return htmlBlock(`
<aside class="as-blog-cta as-reveal" aria-label="Agendar demonstração">
  <div class="as-blog-cta__inner">
    <p class="as-blog-cta__eyebrow">Próximo passo</p>
    <h2>Veja a Aero Suite na sua operação</h2>
    <p>Agende uma demonstração guiada e avalie OS, estoque FIFO, propostas e portal do cliente no contexto da sua oficina.</p>
    <div class="as-btns">
      <a class="as-btn as-btn--gold as-track-demo" href="${LINKS.contatoAgendar}" data-as-event="cta_demo" data-as-location="blog_cta">Agendar demonstração</a>
      <a class="as-btn as-btn--ghost as-track-whatsapp" href="${LINKS.whatsapp}" target="_blank" rel="noopener noreferrer" data-as-event="cta_whatsapp" data-as-location="blog_cta">WhatsApp</a>
    </div>
  </div>
</aside>`);
}
