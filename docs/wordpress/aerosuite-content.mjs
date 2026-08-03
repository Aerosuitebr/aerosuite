import { htmlBlock, WPFORMS_CONTACT_BLOCK } from './aerosuite-html.mjs';
import { schemaBlock, tourVideoShowcaseBlock } from './aerosuite-shared-blocks.mjs';
import { MEDIA, WHATSAPP_PHONE, LINKS, isTourVideoConfigured } from './aerosuite-site-config.mjs';
import { complianceHeroStrip } from './aerosuite-compliance-blocks.mjs';
import { clientsPortfolioBlock } from './aerosuite-portfolio.mjs';
import { homeSchemaGraph, knowledgeHubItemListSchema } from './aerosuite-schema.mjs';
import { HOME_SEO, buildHomeExploreBlock } from './aerosuite-seo.mjs';

export { MEDIA, WHATSAPP_PHONE, LINKS };

const IMG_LOGO = ' width="320" height="80" loading="eager" fetchpriority="high" decoding="sync" sizes="(max-width:768px) 58vw, 220px"';
const IMG_HERO_ACTIVE = ' width="1280" height="800" loading="eager" fetchpriority="high" decoding="async" sizes="(max-width:768px) 92vw, 560px"';
const IMG_HERO_IDLE = ' width="1280" height="800" loading="lazy" decoding="async" fetchpriority="low" sizes="(max-width:768px) 92vw, 560px"';
const IMG_SHOWCASE = ' width="640" height="400" loading="lazy" decoding="async" fetchpriority="low" sizes="(max-width:768px) 92vw, (max-width:1100px) 48vw, 520px"';

export const SEO = {
  title: HOME_SEO.title,
  excerpt: HOME_SEO.description,
};



export function heroBlock() {

  const { logoLight, os, estoque, propostas, dashboard } = MEDIA;

  const { contatoAgendar, recursos } = LINKS;

  return htmlBlock(`

<section class="as-hero-v2" aria-label="Aero Suite, gestão aeronáutica">

  <div class="as-hero-v2__panel as-reveal">

    <div class="as-hero-v2__grain" aria-hidden="true"></div>

    <div class="as-hero-v2__glow" aria-hidden="true"></div>

    <div class="as-hero-v2__panel-inner">

      <header class="as-section-head as-section-head--light as-section-head--compact as-hero-v2__head">

        <img class="as-hero-v2__logo" src="${logoLight}" alt="Aero Suite"${IMG_LOGO}/>

        <h1 class="as-hero-v2__title">
          <span class="as-pulse-dot" aria-hidden="true"></span>
          <span class="as-hero-v2__title-text">
            <span class="as-hero-v2__title-main">Conformidade · Gestão MRO</span>
            <span class="as-hero-v2__title-sep" aria-hidden="true">·</span>
            <span class="as-hero-v2__title-accent">Brasil</span>
          </span>
        </h1>

        <h2 class="as-hero-v2__headline">
          <span class="as-hero-v2__headline-line">A suíte que prepara sua oficina</span>
          <span class="as-hero-v2__headline-line">para auditores, fiscalizadores</span>
          <span class="as-hero-v2__headline-line">e <strong class="as-hero-v2__headline-strong">órgãos reguladores</strong> com evidências integradas.</span>
        </h2>

        <p class="as-section-head__sub as-section-head__sub--light as-hero-v2__lead">A Aero Suite organiza ordens de serviço, estoque FIFO, SGQ, CRS e comercial em uma plataforma poderosa, que <strong>facilita a vida de toda a equipe</strong>, <strong>poupa tempo</strong> em auditorias e fiscalizações e apoia a <strong>aderência às normas</strong> dos órgãos controladores. MRO, estoque e conformidade no mesmo lugar.</p>

        <div class="as-hero-v2__actions">
          <a class="as-btn as-btn--gold as-track-demo" href="${LINKS.conformidade}" data-as-event="cta_demo" data-as-location="home_hero">Ver conformidade regulatória</a>
          <a class="as-btn as-btn--ghost" href="${contatoAgendar}">Agendar demonstração</a>
          ${isTourVideoConfigured() ? `<a class="as-btn as-btn--ghost as-btn--video" href="${LINKS.videoTour}" data-as-event="video_tour_cta" data-as-location="home_hero">Assistir tour em vídeo</a>` : ''}
        </div>

      </header>

      <div class="as-hero-v2__body">

        <div class="as-hero-v2__preview-band as-reveal as-reveal--delay" data-as-hero-preview>

          <div class="as-hero-device">

            <div class="as-hero-device__bar" aria-hidden="true">
              <span></span><span></span><span></span>
              <span class="as-hero-device__url">app.aerosuite.com.br</span>
            </div>

            <div class="as-hero-device__screen">

              <figure class="as-hero-slide is-active" data-label="Dashboard operacional">
                <img src="${dashboard}" alt="Dashboard operacional Aero Suite"${IMG_HERO_ACTIVE}/>
              </figure>

              <figure class="as-hero-slide" data-label="Ordens de serviço">
                <img src="${os}" alt="Gestão de ordens de serviço integradas"${IMG_HERO_IDLE}/>
              </figure>

              <figure class="as-hero-slide" data-label="Estoque FIFO">
                <img src="${estoque}" alt="Estoque aeronáutico com rastreio FIFO"${IMG_HERO_IDLE}/>
              </figure>

              <figure class="as-hero-slide" data-label="Comercial integrado">
                <img src="${propostas}" alt="Comercial integrado à oficina"${IMG_HERO_IDLE}/>
              </figure>

            </div>

          </div>

          <div class="as-hero-device__status" role="status" aria-live="polite" aria-atomic="true">
            <span class="as-hero-device__status-kicker">Tela no preview</span>
            <strong class="as-hero-device__status-title" data-as-hero-caption>Dashboard operacional</strong>
            <div class="as-hero-device__status-progress" aria-hidden="true"><span style="width:25%"></span></div>
          </div>

        </div>

        <div class="as-hero-v2__steps">

        <article class="as-hero-v2__card as-reveal">
          <span class="as-hero-v2__card-num" aria-hidden="true">1</span>
          <strong>Conformidade SGQ</strong>
          <p>Indicadores SMS, export ZIP, NC/CAPA e alertas na home e na OS.</p>
        </article>

        <article class="as-hero-v2__card as-reveal">
          <span class="as-hero-v2__card-num" aria-hidden="true">2</span>
          <strong>Dossiê em minutos</strong>
          <p>Pacote auditoria multi-OS, CRS e evidências, prontos para o fiscal.</p>
        </article>

        <article class="as-hero-v2__card as-reveal">
          <span class="as-hero-v2__card-num" aria-hidden="true">3</span>
          <strong>Rastreio + certificados</strong>
          <p>FIFO na OS, linha do tempo da peça, quarentena e FAA/EASA/ANAC.</p>
        </article>

        <article class="as-hero-v2__card as-reveal">
          <span class="as-hero-v2__card-num" aria-hidden="true">4</span>
          <strong>Hangar organizado</strong>
          <p>Job cards, enforcement, RBAC Part 145 e portal do cliente integrados.</p>
        </article>

        </div>

      </div>

    </div>

  </div>

</section>`);

}



export function pillarsBlock() {

  return htmlBlock(`

<section class="as-pillars as-reveal" aria-labelledby="as-pillars-title">

  <div class="as-pillars__inner">

    <div class="as-pillars__panel">

      <header class="as-pillars__head">
        <h2 id="as-pillars-title" class="as-pillars__title">
          <span class="as-pillars__title-main">Suíte de gestão aeronáutica</span>
          <span class="as-pillars__title-accent">· Brasil</span>
        </h2>
        <p class="as-pillars__lead">Os pilares que sustentam cada módulo da operação no hangar</p>
      </header>

      <div class="as-pillars__grid">

        <article class="as-pillar as-pillar--trace">
          <span class="as-pillar__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
          </span>
          <div class="as-pillar__copy">
            <h3>Rastreabilidade operacional</h3>
            <p>Peças e movimentações ligadas à OS, trilha clara para auditoria interna.</p>
          </div>
        </article>

        <article class="as-pillar as-pillar--audit">
          <span class="as-pillar__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          </span>
          <div class="as-pillar__copy">
            <h3>Histórico auditável de OS e peças</h3>
            <p>Ordens, job cards e documentos técnicos centralizados no mesmo registro.</p>
          </div>
        </article>

        <article class="as-pillar as-pillar--br">
          <span class="as-pillar__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </span>
          <div class="as-pillar__copy">
            <h3>Suporte e operação no Brasil</h3>
            <p>Time comercial e suporte alinhados à rotina das oficinas brasileiras.</p>
          </div>
        </article>

        <article class="as-pillar as-pillar--rbac">
          <span class="as-pillar__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          </span>
          <div class="as-pillar__copy">
            <h3>Controle por perfil no hangar</h3>
            <p>RBAC define quem vê, altera e aprova, do hangar ao escritório.</p>
          </div>
        </article>

      </div>

    </div>

  </div>

</section>`);

}

export function commandCenterBlock() {

  const { contatoAgendar, prontidaoRegulatoria, recursos } = LINKS;

  return htmlBlock(`

<section class="as-command-center as-reveal" aria-labelledby="as-command-title">

  <div class="as-command-center__inner">

    <div class="as-command-center__copy">

      <p class="as-command-center__eyebrow">Vis&atilde;o executiva</p>

      <h2 id="as-command-title">Uma camada premium para transformar rotina t&eacute;cnica em comando operacional</h2>

      <p>Dashboard, hangar, estoque e conformidade em uma vis&atilde;o &uacute;nica para gest&atilde;o e qualidade decidirem com dados da opera&ccedil;&atilde;o, n&atilde;o com planilhas desconectadas.</p>

      <div class="as-command-center__actions as-btns as-btns--left">
        <a class="as-btn as-btn--gold as-track-demo" href="${contatoAgendar}" data-as-event="cta_demo" data-as-location="home_command_center">Agendar demonstra&ccedil;&atilde;o</a>
        <a class="as-btn as-btn--ghost as-command-center__ghost" href="${recursos}">Ver m&oacute;dulos</a>
      </div>

    </div>

    <div class="as-command-center__board" aria-label="Camadas da su&iacute;te Aero Suite">

      <article class="as-command-tile as-command-tile--primary">
        <span class="as-command-tile__kicker">01</span>
        <h3>Controle do hangar</h3>
        <p>OS, job cards, status e respons&aacute;veis em uma trilha operacional &uacute;nica.</p>
      </article>

      <article class="as-command-tile">
        <span class="as-command-tile__kicker">02</span>
        <h3>Rastreabilidade</h3>
        <p>Estoque FIFO, pe&ccedil;as aplicadas e hist&oacute;rico para auditoria.</p>
      </article>

      <article class="as-command-tile">
        <span class="as-command-tile__kicker">03</span>
        <h3>Comercial conectado</h3>
        <p>Propostas e aprova&ccedil;&otilde;es alinhadas ao servi&ccedil;o t&eacute;cnico.</p>
      </article>

      <article class="as-command-tile as-command-tile--accent">
        <span class="as-command-tile__kicker">04</span>
        <h3>Prontid&atilde;o regulat&oacute;ria</h3>
        <p>Dossi&ecirc;s, checklists e evid&ecirc;ncias sem reconstruir tudo na v&eacute;spera.</p>
        <a href="${prontidaoRegulatoria}">Explorar diferencial</a>
      </article>

    </div>

  </div>

</section>`);

}



export function audienceBlock() {

  return htmlBlock(`

<section class="as-audience as-reveal" aria-labelledby="as-audience-title">

  <div class="as-audience__inner">

    <header class="as-section-head as-section-head--compact">
      <p class="as-section-head__eyebrow">Posicionamento</p>
      <h2 id="as-audience-title" class="as-audience__title">Uma suíte pensada para a operação aeronáutica real</h2>
    </header>

    <div class="as-audience__grid">

      <article class="as-audience-card as-premium-card as-premium-card--suite">
        <div class="as-premium-card__glow" aria-hidden="true"></div>
        <div class="as-premium-card__top">
          <span class="as-premium-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
          </span>
          <span class="as-premium-card__tag">Suíte integrada</span>
        </div>
        <h3>O que é?</h3>
        <p>Uma suíte de gestão aeronáutica para oficinas, MROs e organizações de manutenção | OS, peças, estoque, comercial, documentos e portal em um só lugar.</p>
      </article>

      <article class="as-audience-card as-premium-card as-premium-card--audience">
        <div class="as-premium-card__glow" aria-hidden="true"></div>
        <div class="as-premium-card__top">
          <span class="as-premium-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </span>
          <span class="as-premium-card__tag">Público-alvo</span>
        </div>
        <h3>Para quem é?</h3>
        <p>Oficinas aeronáuticas, manutenção de aeronaves como King Air e Air Tractor, operadores e gestores técnicos que precisam de controle profissional.</p>
      </article>

      <article class="as-audience-card as-premium-card as-premium-card--problem">
        <div class="as-premium-card__glow" aria-hidden="true"></div>
        <div class="as-premium-card__top">
          <span class="as-premium-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </span>
          <span class="as-premium-card__tag">Dor operacional</span>
        </div>
        <h3>Qual dor resolve?</h3>
        <p>Falta de rastreabilidade, OS descentralizada, peças sem vínculo claro, documentos espalhados e dificuldade de demonstrar controle operacional.</p>
      </article>

      <article class="as-audience-card as-premium-card as-premium-card--gain">
        <div class="as-premium-card__glow" aria-hidden="true"></div>
        <div class="as-premium-card__top">
          <span class="as-premium-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </span>
          <span class="as-premium-card__tag">Resultado</span>
        </div>
        <h3>Qual ganho entrega?</h3>
        <p>Mais controle, menos retrabalho, histórico auditável, gestão mais profissional e melhor experiência para o cliente final.</p>
      </article>

    </div>

  </div>

</section>`);

}



export function painBlock() {

  return htmlBlock(`

<section class="as-pain as-reveal" aria-labelledby="as-pain-title">

  <div class="as-pain__inner">

    <header class="as-section-head">

      <p class="as-section-head__eyebrow">Risco operacional</p>

      <h2 id="as-pain-title">Quando a oficina depende de planilhas, WhatsApp e arquivos soltos, a gestão vira risco</h2>

      <p class="as-section-head__sub">Sem registro centralizado, cada área trabalha com sua própria versão da verdade, e a conformidade operacional fica difícil de demonstrar.</p>

    </header>

    <div class="as-pain__grid as-pain__grid--4">

      <article class="as-pain-card as-premium-card as-premium-card--risk">
        <div class="as-premium-card__glow" aria-hidden="true"></div>
        <span class="as-pain-card__watermark" aria-hidden="true">01</span>
        <div class="as-premium-card__top">
          <span class="as-pain-card__num" aria-hidden="true">01</span>
          <span class="as-premium-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          </span>
        </div>
        <h3>OS sem histórico centralizado</h3>
        <p>Status, job cards, responsáveis e documentos ficam espalhados, a versão oficial da ordem de serviço nem sempre está clara.</p>
      </article>

      <article class="as-pain-card as-premium-card as-premium-card--risk">
        <div class="as-premium-card__glow" aria-hidden="true"></div>
        <span class="as-pain-card__watermark" aria-hidden="true">02</span>
        <div class="as-premium-card__top">
          <span class="as-pain-card__num" aria-hidden="true">02</span>
          <span class="as-premium-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          </span>
        </div>
        <h3>Peças sem rastreabilidade operacional clara</h3>
        <p>Entrada, saída, reserva, aplicação e vínculo com a OS precisam estar documentados, não só na memória da equipe.</p>
      </article>

      <article class="as-pain-card as-premium-card as-premium-card--risk">
        <div class="as-premium-card__glow" aria-hidden="true"></div>
        <span class="as-pain-card__watermark" aria-hidden="true">03</span>
        <div class="as-premium-card__top">
          <span class="as-pain-card__num" aria-hidden="true">03</span>
          <span class="as-premium-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3 14 10"/><path d="M3 21l7-7"/></svg>
          </span>
        </div>
        <h3>Comercial desconectado da manutenção</h3>
        <p>Propostas, aprovações e escopo técnico nem sempre caminham junto com a execução no hangar.</p>
      </article>

      <article class="as-pain-card as-premium-card as-premium-card--risk">
        <div class="as-premium-card__glow" aria-hidden="true"></div>
        <span class="as-pain-card__watermark" aria-hidden="true">04</span>
        <div class="as-premium-card__top">
          <span class="as-pain-card__num" aria-hidden="true">04</span>
          <span class="as-premium-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </span>
        </div>
        <h3>Cliente sem visibilidade</h3>
        <p>A oficina perde tempo respondendo status que poderiam estar disponíveis em um portal dedicado ao cliente.</p>
      </article>

    </div>

  </div>

</section>`);

}



export function flowBlock() {

  return htmlBlock(`

<section class="as-flow as-reveal" aria-labelledby="as-flow-title">

  <div class="as-flow__inner">

    <div class="as-section-head as-section-head--light">

      <p class="as-section-head__eyebrow">Operação integrada</p>

      <h2 id="as-flow-title">Do hangar ao cliente, com rastreabilidade em cada passo</h2>

      <p class="as-section-head__sub as-section-head__sub--light">Quatro etapas que já existem na sua oficina, aqui conectadas com histórico, documentação e controle.</p>

    </div>

    <ol class="as-flow__steps">

      <li><span class="as-flow__num">1</span><strong>Abre a OS</strong><p>Equipe, status, job cards e documentos no mesmo registro auditável.</p></li>

      <li><span class="as-flow__num">2</span><strong>Reserva e movimenta peças</strong><p>FIFO amarrado à OS, com trilha para compras, qualidade e conformidade.</p></li>

      <li><span class="as-flow__num">3</span><strong>Comercial alinhado</strong><p>Proposta versionada, aprovação e escopo técnico ligados à execução.</p></li>

      <li><span class="as-flow__num">4</span><strong>Cliente acompanha</strong><p>Portal com status e documentos, menos ligações e mais transparência.</p></li>

    </ol>

  </div>

</section>`);

}



export function statsBlock() {

  return htmlBlock(`

<section class="as-stats as-reveal" aria-label="Números da plataforma">

  <div class="as-stats__inner">

    <div class="as-stats__item"><span class="as-stats__val">5</span><span class="as-stats__label">áreas integradas (OS, estoque, CRM, SGQ, painel)</span></div>

    <div class="as-stats__item"><span class="as-stats__val as-stats__val--compact">ANAC</span><span class="as-stats__label">aderência operacional RBAC 145</span></div>

    <div class="as-stats__item"><span class="as-stats__val">100</span><span class="as-stats__suffix">%</span><span class="as-stats__label">SaaS em nuvem</span></div>

    <div class="as-stats__item"><span class="as-stats__val as-stats__val--compact">1</span><span class="as-stats__suffix as-stats__suffix--compact">dia útil</span><span class="as-stats__label">retorno comercial</span></div>

  </div>

</section>`);

}



export function showcaseBlock() {

  const { os, estoque, propostas, dashboard, conformidade, portal } = MEDIA;

  return htmlBlock(`

<section class="as-showcase" aria-label="Módulos da suíte Aero Suite">

  <div class="as-kpi-strip as-reveal as-kpi-strip--5" role="tablist" aria-label="Módulos da suíte">

    <button type="button" class="as-kpi is-active" role="tab" aria-selected="true" data-as-showcase-index="0" id="as-showcase-tab-0" aria-controls="as-showcase-panel-0"><div class="as-kpi__val">OS</div><div class="as-kpi__label">Ordens de serviço</div></button>

    <button type="button" class="as-kpi" role="tab" aria-selected="false" data-as-showcase-index="1" id="as-showcase-tab-1" aria-controls="as-showcase-panel-1"><div class="as-kpi__val gold">FIFO</div><div class="as-kpi__label">Estoque aeronáutico</div></button>

    <button type="button" class="as-kpi" role="tab" aria-selected="false" data-as-showcase-index="2" id="as-showcase-tab-2" aria-controls="as-showcase-panel-2"><div class="as-kpi__val">CRM</div><div class="as-kpi__label">Comercial integrado</div></button>

    <button type="button" class="as-kpi" role="tab" aria-selected="false" data-as-showcase-index="3" id="as-showcase-tab-3" aria-controls="as-showcase-panel-3"><div class="as-kpi__val gold">SGQ</div><div class="as-kpi__label">Conformidade</div></button>

    <button type="button" class="as-kpi" role="tab" aria-selected="false" data-as-showcase-index="4" id="as-showcase-tab-4" aria-controls="as-showcase-panel-4"><div class="as-kpi__val">Painel</div><div class="as-kpi__label">Dashboard operacional</div></button>

  </div>

  <div class="as-showcase-grid as-showcase-grid--5">

    <article class="as-ui-card as-reveal is-active" role="tabpanel" id="as-showcase-panel-0" aria-labelledby="as-showcase-tab-0" data-as-showcase-index="0">

      <span class="as-ui-card__badge">Módulo</span>

      <span class="as-ui-shot__hint">Passe o mouse · clique para ampliar</span>

      <div class="as-ui-shot"><img src="${os}" alt="Gestão de ordens de serviço na Aero Suite"${IMG_SHOWCASE}/></div>

      <div class="as-ui-card__body">

        <h3>Gestão de Ordens de Serviço</h3>

        <p>Controle da abertura ao fechamento: status, job cards, responsáveis, histórico e documentos, tudo centralizado.</p>

      </div>

    </article>

    <article class="as-ui-card as-reveal" role="tabpanel" id="as-showcase-panel-1" aria-labelledby="as-showcase-tab-1" data-as-showcase-index="1" hidden>

      <span class="as-ui-card__badge">Módulo</span>

      <span class="as-ui-shot__hint">Passe o mouse · clique para ampliar</span>

      <div class="as-ui-shot"><img src="${estoque}" alt="Estoque aeronáutico com FIFO"${IMG_SHOWCASE}/></div>

      <div class="as-ui-card__body">

        <h3>Estoque Aeronáutico com FIFO</h3>

        <p>Entrada, saída, reserva, movimentações e vínculo das peças com a OS, rastreabilidade para compras e conformidade.</p>

      </div>

    </article>

    <article class="as-ui-card as-reveal" role="tabpanel" id="as-showcase-panel-2" aria-labelledby="as-showcase-tab-2" data-as-showcase-index="2" hidden>

      <span class="as-ui-card__badge">Módulo</span>

      <span class="as-ui-shot__hint">Passe o mouse · clique para ampliar</span>

      <div class="as-ui-shot"><img src="${propostas}" alt="Comercial integrado à oficina"${IMG_SHOWCASE}/></div>

      <div class="as-ui-card__body">

        <h3>Comercial Integrado à Oficina</h3>

        <p>Propostas versionadas, aprovações, histórico comercial e conexão com o serviço técnico em execução.</p>

      </div>

    </article>

    <article class="as-ui-card as-reveal" role="tabpanel" id="as-showcase-panel-3" aria-labelledby="as-showcase-tab-3" data-as-showcase-index="3" hidden>

      <span class="as-ui-card__badge">Módulo</span>

      <span class="as-ui-shot__hint">Passe o mouse · clique para ampliar</span>

      <div class="as-ui-shot"><img src="${conformidade}" alt="Painel de conformidade regulatória"${IMG_SHOWCASE}/></div>

      <div class="as-ui-card__body">

        <h3>Conformidade e SGQ</h3>

        <p>Indicadores SMS, export SGQ, alertas na OS e painel qualidade, evidências integradas para auditores e fiscalizações.</p>

      </div>

    </article>

    <article class="as-ui-card as-reveal" role="tabpanel" id="as-showcase-panel-4" aria-labelledby="as-showcase-tab-4" data-as-showcase-index="4" hidden>

      <span class="as-ui-card__badge">Módulo</span>

      <span class="as-ui-shot__hint">Passe o mouse · clique para ampliar</span>

      <div class="as-ui-shot"><img src="${dashboard}" alt="Dashboard operacional da oficina"${IMG_SHOWCASE}/></div>

      <div class="as-ui-card__body">

        <h3>Dashboard Operacional</h3>

        <p>Visão gerencial da oficina: produtividade, gargalos, status das OS e indicadores para o gestor.</p>

      </div>

    </article>

  </div>

</section>`);

}



export function trustSignalsBlock() {
  return htmlBlock(`
<section class="as-trust-signals as-reveal" aria-labelledby="as-trust-title">
  <div class="as-trust-signals__inner">
    <header class="as-section-head as-section-head--compact">
      <p class="as-section-head__eyebrow">Por que gestores avaliam a suíte</p>
      <h2 id="as-trust-title">Feita para MRO no Brasil, não ERP genérico</h2>
    </header>
    <div class="as-trust-signals__grid">
      <article class="as-premium-card as-trust-signals__card">
        <span class="as-trust-signals__icon" aria-hidden="true">◎</span>
        <h3>Prontidão regulatória</h3>
        <p>Dossiês, checklists e trilha auditável para apoiar fiscalizações, com tempo consideravelmente menor de preparação.</p>
      </article>
      <article class="as-premium-card as-trust-signals__card">
        <span class="as-trust-signals__icon" aria-hidden="true">☁</span>
        <h3>100% nuvem</h3>
        <p>Sem instalação local. Atualizações contínuas e acesso seguro por perfil (RBAC).</p>
      </article>
      <article class="as-premium-card as-trust-signals__card">
        <span class="as-trust-signals__icon" aria-hidden="true">✓</span>
        <h3>Demo personalizada</h3>
        <p>~30 minutos com fluxo real do seu hangar. Retorno comercial em até um dia útil.</p>
      </article>
      <article class="as-premium-card as-trust-signals__card">
        <span class="as-trust-signals__icon" aria-hidden="true">↗</span>
        <h3>Do comercial ao hangar</h3>
        <p>Proposta, estoque e portal do cliente na mesma operação, <a class="as-text-link" href="${LINKS.comparativo}">compare com planilhas</a>.</p>
      </article>
      <article class="as-premium-card as-trust-signals__card">
        <span class="as-trust-signals__icon" aria-hidden="true">⚙</span>
        <h3>Flexível e customizável</h3>
        <p>Receptiva à análise de adequação da sua operação, <a class="as-text-link" href="#flexibilidade">implementações ágeis sob medida</a>.</p>
      </article>
    </div>
  </div>
</section>`);
}

export function faqBlock() {

  return htmlBlock(`

<section class="as-faq as-reveal" aria-labelledby="as-faq-title">

  <div class="as-faq__inner">

    <header class="as-section-head">

      <p class="as-section-head__eyebrow">Perguntas frequentes</p>

      <h2 id="as-faq-title">O que gestores e donos de oficina perguntam antes da demo</h2>

    </header>

    <div class="as-faq__list">

      <details class="as-faq__item" open>

        <summary>A suíte ajuda em fiscalizações ANAC, RBAC 145 e auditorias?</summary>

        <p>Sim. este é o diferencial central da Aero Suite. Indicadores SMS, export SGQ (ZIP), dossiê multi-OS, CRS, certificados de peça, quarentena e enforcement na OS apoiam a demonstração de controle perante órgãos reguladores. O software apoia evidências operacionais; não substitui o SGQ certificado da organização.</p>

      </details>

      <details class="as-faq__item">

        <summary>É só para oficinas grandes?</summary>

        <p>Não. A Aero Suite escala de operações enxutas a hangares com múltiplas equipes, com o mesmo padrão de rastreabilidade e controle.</p>

      </details>

      <details class="as-faq__item">

        <summary>Substitui meu ERP?</summary>

        <p>Focamos no que ERP genérico não resolve bem: MRO aeronáutico com conformidade SGQ, rastreio FIFO, CRS, dossiê auditoria e portal do cliente. Integrações podem ser avaliadas na demo.</p>

      </details>

      <details class="as-faq__item">

        <summary>Como ficam rastreabilidade e segurança?</summary>

        <p>Plataforma em nuvem com controle de acesso por perfil (RBAC), trilha de movimentações, histórico de OS e ambiente isolado por organização.</p>

      </details>

      <details class="as-faq__item">

        <summary>Quanto tempo para começar?</summary>

        <p>Na demonstração mostramos o fluxo real do seu hangar e montamos proposta alinhada à operação, onboarding guiado após contratação.</p>

      </details>

      <details class="as-faq__item">

        <summary>O cliente final vê o andamento?</summary>

        <p>Sim. O portal externo dá transparência sobre status, documentos e comunicação, menos ligação perguntando &ldquo;como est&aacute; minha aeronave?&rdquo;.</p>

      </details>

      <details class="as-faq__item">

        <summary>Dá para customizar fluxos e campos?</summary>

        <p>Sim. Fazemos análise de adequação às necessidades da sua empresa e priorizamos implementações customizadas em ciclos ágeis, sem exigir que você adote tudo de uma vez.</p>

      </details>

    </div>

  </div>

</section>`);

}



export function ctaBlock() {

  const { contatoAgendar, recursos, whatsapp } = LINKS;

  return htmlBlock(`

<section class="as-cta-band as-reveal">

  <h2>Veja como a Aero Suite organiza sua oficina de ponta a ponta</h2>

  <p>Agende uma demonstração e veja na prática como OS, peças, estoque, propostas, documentos e portal do cliente funcionam dentro de uma operação aeronáutica real.</p>

  <div class="as-btns">

    <a class="primary as-track-demo" href="${contatoAgendar}" data-as-event="cta_demo" data-as-location="home_cta">Agendar demonstração agora</a>

    <a class="ghost as-btn-whatsapp as-track-whatsapp" href="${whatsapp}" target="_blank" rel="noopener noreferrer" data-as-event="cta_whatsapp" data-as-location="home_cta">Falar pelo WhatsApp</a>

    <a class="ghost" href="${recursos}">Ver módulos da suíte</a>

  </div>

</section>`);

}



export function buildHomeContent() {

  return [

    schemaBlock([...homeSchemaGraph(), knowledgeHubItemListSchema()]),

    heroBlock(),

    tourVideoShowcaseBlock(),

    audienceBlock(),

    commandCenterBlock(),

    '<!-- wp:group {"tagName":"section","anchor":"recursos","layout":{"type":"constrained","contentSize":"100%"}} -->',

    '<section id="recursos" class="wp-block-group">',

    '<!-- wp:heading {"textAlign":"center"} --><h2 class="has-text-align-center as-reveal">Módulos da suíte na prática</h2><!-- /wp:heading -->',

    '<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center as-reveal">Telas reais da rotina aeronáutica. Amplie cada módulo e veja como OS, estoque, comercial, portal e painel se complementam com rastreabilidade.</p><!-- /wp:paragraph -->',

    showcaseBlock(),

    '</section><!-- /wp:group -->',

    complianceHeroStrip(),

    statsBlock(),

    clientsPortfolioBlock(),

    trustSignalsBlock(),

    buildHomeExploreBlock(),

    faqBlock(),

    ctaBlock(),

    htmlBlock(`
<section class="as-form-section as-reveal" id="formulario-contato" aria-labelledby="as-form-section-title">
  <div class="as-form-section__inner">
    <div class="as-form-card">
      <h3 class="as-form-card__title" id="as-form-section-title">Solicitar proposta comercial</h3>
      <p class="as-form-card__lead">Respondemos em até um dia útil. Demonstramos a plataforma e montamos proposta alinhada à sua operação.</p>
      <div class="as-form-card__fields">`),

    WPFORMS_CONTACT_BLOCK,

    htmlBlock(`
      </div>
    </div>
  </div>
</section>`),

  ].join('\n');

}


