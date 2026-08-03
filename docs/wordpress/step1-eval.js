(async () => {
  const css = `/* Aero Suite — estilos premium (site WordPress) */
:root {
  --as-navy: #051a3d;
  --as-blue: #0a2f6b;
  --as-blue-mid: #0b3d91;
  --as-gold: #c9a227;
  --as-gold-bright: #e8c547;
  --as-surface: #f4f6fa;
  --as-card: #ffffff;
  --as-text: #161b22;
  --as-muted: #5c6670;
  --as-radius: 14px;
  --as-shadow: 0 12px 40px rgba(5, 26, 61, 0.12);
  --as-shadow-lg: 0 24px 64px rgba(5, 26, 61, 0.18);
}

body {
  background: var(--as-surface) !important;
  color: var(--as-text);
}

/* Tipografia */
.wp-block-post-content h1,
.wp-block-post-content h2,
.wp-block-post-content h3 {
  letter-spacing: -0.02em;
  color: var(--as-navy);
}

.wp-block-post-content h1 {
  font-weight: 800 !important;
  line-height: 1.08 !important;
}

/* Botões */
.wp-block-button__link,
.wp-element-button {
  border-radius: 10px !important;
  font-weight: 700 !important;
  transition: transform 0.15s ease, box-shadow 0.15s ease !important;
}

.wp-block-button__link:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(201, 162, 39, 0.35);
}

.is-style-ext-preset--button--natural-1--button-1 .wp-block-button__link,
.wp-block-button.is-style-fill .wp-block-button__link {
  background: linear-gradient(135deg, var(--as-gold), var(--as-gold-bright)) !important;
  color: var(--as-navy) !important;
}

/* Hero premium */
.ext-hero-section,
.wp-block-cover.alignfull {
  border-radius: 0 0 24px 24px;
  overflow: hidden;
}

.ext-hero-section h1,
.wp-block-cover h1 {
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.35);
}

/* Secções */
.wp-block-group.is-style-ext-preset--group--natural-1--section {
  border-radius: var(--as-radius);
  margin-top: 2rem !important;
  margin-bottom: 2rem !important;
  box-shadow: var(--as-shadow);
}

/* Cards módulos */
.wp-block-media-text,
.wp-block-group.is-style-ext-preset--group--natural-1--item-card-1--align-center {
  border-radius: var(--as-radius);
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.wp-block-media-text:hover,
.wp-block-group.is-style-ext-preset--group--natural-1--item-card-1--align-center:hover {
  box-shadow: var(--as-shadow-lg);
  transform: translateY(-4px);
}

/* Showcase Aero Suite (blocos HTML) */
.as-showcase {
  margin: 3rem 0;
}

.as-showcase-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

@media (max-width: 900px) {
  .as-showcase-grid {
    grid-template-columns: 1fr;
  }
}

.as-ui-card {
  background: var(--as-card);
  border-radius: 16px;
  border: 1px solid rgba(5, 26, 61, 0.08);
  box-shadow: var(--as-shadow);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.as-ui-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--as-shadow-lg);
}

.as-ui-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 1rem 1.25rem 0;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: rgba(201, 162, 39, 0.15);
  color: #7a5f0a;
  border: 1px solid rgba(201, 162, 39, 0.35);
}

.as-ui-card__body {
  padding: 1rem 1.25rem 1.25rem;
}

.as-ui-card__body h3 {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
  color: var(--as-navy);
}

.as-ui-card__body p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--as-muted);
  line-height: 1.55;
}

.as-ui-frame {
  background: linear-gradient(160deg, #0d1117 0%, #051a3d 100%);
  padding: 12px 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.as-ui-frame__bar {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.as-ui-frame__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.as-ui-frame__dot:first-child {
  background: #ff5f57;
}
.as-ui-frame__dot:nth-child(2) {
  background: #febc2e;
}
.as-ui-frame__dot:nth-child(3) {
  background: #28c840;
}

.as-ui-mock {
  padding: 14px;
  min-height: 160px;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 11px;
  color: #e6edf3;
}

.as-ui-mock .row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  border-left: 3px solid var(--as-gold);
}

.as-ui-mock .row strong {
  color: #fff;
  font-size: 12px;
}

.as-ui-mock .tag {
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(201, 162, 39, 0.25);
  color: var(--as-gold-bright);
}

/* Faixa KPI */
.as-kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  max-width: 1100px;
  margin: 2.5rem auto;
  padding: 0 1.5rem;
}

@media (max-width: 768px) {
  .as-kpi-strip {
    grid-template-columns: repeat(2, 1fr);
  }
}

.as-kpi {
  text-align: center;
  padding: 1.5rem 1rem;
  background: var(--as-card);
  border-radius: var(--as-radius);
  border: 1px solid rgba(5, 26, 61, 0.06);
  box-shadow: var(--as-shadow);
}

.as-kpi__val {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--as-blue);
  line-height: 1;
}

.as-kpi__val.gold {
  color: var(--as-gold);
}

.as-kpi__label {
  margin-top: 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--as-muted);
}

/* CTA band */
.as-cta-band {
  margin: 3rem auto;
  max-width: 1100px;
  padding: 2.5rem 2rem;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--as-navy), var(--as-blue-mid));
  color: #fff;
  text-align: center;
  box-shadow: var(--as-shadow-lg);
}

.as-cta-band h2 {
  color: #fff !important;
  margin: 0 0 0.75rem;
}

.as-cta-band p {
  opacity: 0.9;
  max-width: 560px;
  margin: 0 auto 1.5rem;
}

.as-cta-band .as-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.as-cta-band a {
  display: inline-flex;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.15s;
}

.as-cta-band a.primary {
  background: linear-gradient(135deg, var(--as-gold), var(--as-gold-bright));
  color: var(--as-navy);
}

.as-cta-band a.ghost {
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff;
}

.as-cta-band a:hover {
  transform: translateY(-2px);
}

/* WPForms */
.wpforms-form input[type='text'],
.wpforms-form input[type='email'],
.wpforms-form textarea {
  border-radius: 10px !important;
  border-color: #d0d7de !important;
}

.wpforms-form input:focus,
.wpforms-form textarea:focus {
  border-color: var(--as-blue) !important;
  box-shadow: 0 0 0 3px rgba(10, 47, 107, 0.12) !important;
}

.wpforms-submit {
  background: linear-gradient(135deg, var(--as-gold), var(--as-gold-bright)) !important;
  color: var(--as-navy) !important;
  border-radius: 10px !important;
  font-weight: 700 !important;
}

/* Header refinado */
.wp-block-site-title a {
  font-weight: 800 !important;
  letter-spacing: 0.04em;
}

/* Hero com logo real */
.wp-block-cover .wp-block-image img {
  filter: drop-shadow(0 20px 48px rgba(0, 0, 0, 0.45));
  max-height: 280px;
  width: auto;
  margin: 0 auto;
}

.wp-block-cover.alignfull {
  background: linear-gradient(135deg, var(--as-navy) 0%, var(--as-blue) 55%, #0b3d91 100%) !important;
}

html {
  scroll-behavior: smooth;
}

/* Navegação sticky feel */
header.wp-block-template-part {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.92) !important;
  border-bottom: 1px solid rgba(5, 26, 61, 0.06);
}

/* Formulários — destaque */
.wp-block-wpforms-form {
  padding: 1.5rem;
  background: var(--as-card);
  border-radius: var(--as-radius);
  box-shadow: var(--as-shadow);
}

/* Secção recursos */
#recursos {
  scroll-margin-top: 5rem;
}
`;
  const js = `/**
 * Máscara telefone BR — WPForms (Aero Suite)
 * Campos: input com name*="telefone" ou placeholder com (00)
 */
(function () {
  'use strict';

  function digits(v) {
    return String(v || '').replace(/\\D/g, '').slice(0, 11);
  }

  function formatBR(d) {
    if (!d) return '';
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) {
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    }
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7, 11);
  }

  function bind(input) {
    if (!input || input.dataset.asPhoneMask === '1') return;
    input.dataset.asPhoneMask = '1';
    input.setAttribute('inputmode', 'tel');
    input.setAttribute('autocomplete', 'tel');

    input.addEventListener('input', function () {
      const d = digits(input.value);
      const formatted = formatBR(d);
      if (input.value !== formatted) input.value = formatted;
    });

    input.addEventListener('blur', function () {
      const d = digits(input.value);
      if (d.length > 0 && d.length < 10) {
        input.setCustomValidity('Informe um telefone válido com DDD.');
      } else {
        input.setCustomValidity('');
      }
    });
  }

  function scan() {
    document.querySelectorAll('.wpforms-form input[type="text"], .wpforms-form input[type="tel"]').forEach(function (el) {
      const name = (el.getAttribute('name') || '').toLowerCase();
      const label = (el.getAttribute('aria-label') || '').toLowerCase();
      const ph = (el.getAttribute('placeholder') || '').toLowerCase();
      if (
        name.includes('telefone') ||
        label.includes('telefone') ||
        ph.includes('00000') ||
        el.id && el.id.toLowerCase().includes('telefone')
      ) {
        bind(el);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }
  document.addEventListener('wpformsReady', scan);
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
`;
  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  footer = footer.replace(/<!-- wp:html -->[\s\S]*?aerosuite-premium[\s\S]*?<!-- \/wp:html -->/g, '');
  const block = '<!-- wp:html -->\n<style id="aerosuite-premium-css">' + css + '</style>\n<script id="aerosuite-phone-mask-js">' + js + '</script>\n<!-- /wp:html -->\n';
  if (!footer.includes('aerosuite-premium-css')) footer = block + footer;
  await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer', method: 'POST', data: { content: footer } });
  const home = "<!-- wp:cover {\"dimRatio\":88,\"overlayColor\":\"contrast\",\"minHeight\":72,\"minHeightUnit\":\"vh\",\"align\":\"full\"} -->\n<div class=\"wp-block-cover alignfull\" style=\"min-height:72vh\"><span aria-hidden=\"true\" class=\"wp-block-cover__background has-contrast-background-color has-background-dim-88 has-background-dim\"></span><div class=\"wp-block-cover__inner-container\">\n<!-- wp:group {\"layout\":{\"type\":\"constrained\",\"contentSize\":\"1100px\"}} --><div class=\"wp-block-group\">\n<!-- wp:columns {\"verticalAlignment\":\"center\"} --><div class=\"wp-block-columns are-vertically-aligned-center\">\n<!-- wp:column {\"width\":\"58%\"} --><div class=\"wp-block-column\" style=\"flex-basis:58%\">\n<!-- wp:heading {\"level\":1} --><h1 class=\"wp-block-heading\">Gestão MRO completa.<br>Do hangar ao cliente.</h1><!-- /wp:heading -->\n<!-- wp:paragraph --><p>OS, estoque FIFO, propostas comerciais e portal do cliente — uma plataforma SaaS para oficinas MRO no Brasil.</p><!-- /wp:paragraph -->\n<!-- wp:buttons --><div class=\"wp-block-buttons\"><!-- wp:button --><div class=\"wp-block-button\"><a class=\"wp-block-button__link wp-element-button\" href=\"https://aerosuite.com.br/contato/\">Agendar demonstração</a></div><!-- /wp:button --><!-- wp:button {\"className\":\"is-style-outline\"} --><div class=\"wp-block-button is-style-outline\"><a class=\"wp-block-button__link wp-element-button\" href=\"#recursos\">Ver módulos</a></div><!-- /wp:button --></div><!-- /wp:buttons -->\n</div><!-- /wp:column -->\n<!-- wp:column {\"width\":\"42%\"} --><div class=\"wp-block-column\" style=\"flex-basis:42%\"><figure class=\"wp-block-image as-hero-logo\" id=\"as-hero-logo\"></figure></div><!-- /wp:column -->\n</div><!-- /wp:columns --></div><!-- /wp:group --></div></div><!-- /wp:cover -->\n<!-- wp:group {\"tagName\":\"section\",\"anchor\":\"recursos\",\"layout\":{\"type\":\"constrained\",\"contentSize\":\"1200px\"}} -->\n<section id=\"recursos\" class=\"wp-block-group\">\n<!-- wp:heading {\"textAlign\":\"center\"} --><h2 class=\"wp-block-heading has-text-align-center\">Por que oficinas MRO escolhem a Aero Suite</h2><!-- /wp:heading -->\n<!-- wp:paragraph {\"align\":\"center\"} --><p class=\"has-text-align-center\">Menos planilha, mais rastreio: do job card ao portal do cliente, tudo conectado.</p><!-- /wp:paragraph -->\n<!-- wp:html -->\n<!-- Cole como bloco HTML personalizado no WordPress -->\r\n<section class=\"as-showcase\" aria-label=\"Módulos Aero Suite\">\r\n  <div class=\"as-kpi-strip\">\r\n    <div class=\"as-kpi\"><div class=\"as-kpi__val\">OS</div><div class=\"as-kpi__label\">Ordens de serviço</div></div>\r\n    <div class=\"as-kpi\"><div class=\"as-kpi__val gold\">FIFO</div><div class=\"as-kpi__label\">Estoque rastreável</div></div>\r\n    <div class=\"as-kpi\"><div class=\"as-kpi__val\">CRM</div><div class=\"as-kpi__label\">Propostas comerciais</div></div>\r\n    <div class=\"as-kpi\"><div class=\"as-kpi__val gold\">Portal</div><div class=\"as-kpi__label\">Cliente externo</div></div>\r\n  </div>\r\n  <div class=\"as-showcase-grid\">\r\n    <article class=\"as-ui-card\">\r\n      <span class=\"as-ui-card__badge\">Ponto forte</span>\r\n      <div class=\"as-ui-frame\">\r\n        <div class=\"as-ui-frame__bar\"><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span></div>\r\n        <div class=\"as-ui-mock\">\r\n          <div class=\"row\"><strong>OS-2026-0142</strong><span class=\"tag\">Em execução</span></div>\r\n          <div class=\"row\"><strong>Job card · HB-ZXY</strong><span class=\"tag\">Hangar 2</span></div>\r\n          <div class=\"row\"><strong>Peças reservadas</strong><span class=\"tag\">FIFO OK</span></div>\r\n        </div>\r\n      </div>\r\n      <div class=\"as-ui-card__body\">\r\n        <h3>Ordens de serviço integradas</h3>\r\n        <p>Da abertura ao fechamento: status, job cards, histórico e vínculo com peças — sem planilha paralela.</p>\r\n      </div>\r\n    </article>\r\n    <article class=\"as-ui-card\">\r\n      <span class=\"as-ui-card__badge\">Ponto forte</span>\r\n      <div class=\"as-ui-frame\">\r\n        <div class=\"as-ui-frame__bar\"><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span></div>\r\n        <div class=\"as-ui-mock\">\r\n          <div class=\"row\"><strong>Lote PN-8842-A</strong><span class=\"tag\">Rastreado</span></div>\r\n          <div class=\"row\"><strong>Movimentação</strong><span class=\"tag\">OS-0142</span></div>\r\n          <div class=\"row\"><strong>Saldo hangar</strong><span class=\"tag\">Atualizado</span></div>\r\n        </div>\r\n      </div>\r\n      <div class=\"as-ui-card__body\">\r\n        <h3>Estoque com rastreio FIFO</h3>\r\n        <p>Peças ligadas à OS certa, movimentações auditáveis e visibilidade para compras e qualidade.</p>\r\n      </div>\r\n    </article>\r\n    <article class=\"as-ui-card\">\r\n      <span class=\"as-ui-card__badge\">Ponto forte</span>\r\n      <div class=\"as-ui-frame\">\r\n        <div class=\"as-ui-frame__bar\"><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span></div>\r\n        <div class=\"as-ui-mock\">\r\n          <div class=\"row\"><strong>Proposta #1089</strong><span class=\"tag\">Enviada</span></div>\r\n          <div class=\"row\"><strong>Revisão v3</strong><span class=\"tag\">Rastreada</span></div>\r\n          <div class=\"row\"><strong>Aprovação cliente</strong><span class=\"tag\">Pendente</span></div>\r\n        </div>\r\n      </div>\r\n      <div class=\"as-ui-card__body\">\r\n        <h3>Comercial com histórico</h3>\r\n        <p>Propostas versionadas, rastreio e aprovação — acaba com PDF perdido no e-mail.</p>\r\n      </div>\r\n    </article>\r\n    <article class=\"as-ui-card\">\r\n      <span class=\"as-ui-card__badge\">Ponto forte</span>\r\n      <div class=\"as-ui-frame\">\r\n        <div class=\"as-ui-frame__bar\"><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span></div>\r\n        <div class=\"as-ui-mock\">\r\n          <div class=\"row\"><strong>Cliente OM Beta</strong><span class=\"tag\">Portal</span></div>\r\n          <div class=\"row\"><strong>Status serviço</strong><span class=\"tag\">Transparente</span></div>\r\n          <div class=\"row\"><strong>Documentos</strong><span class=\"tag\">Disponíveis</span></div>\r\n        </div>\r\n      </div>\r\n      <div class=\"as-ui-card__body\">\r\n        <h3>Portal do cliente</h3>\r\n        <p>Seu cliente acompanha o serviço com transparência, sem ruído na comunicação.</p>\r\n      </div>\r\n    </article>\r\n  </div>\r\n</section>\n<!-- /wp:html -->\n</section><!-- /wp:group -->\n<!-- wp:html -->\n<section class=\"as-cta-band\">\r\n  <h2>Pronto para ver a Aero Suite na sua operação?</h2>\r\n  <p>Demonstração guiada para oficinas MRO e OMs — sem compromisso. Mostramos OS, estoque, comercial e portal no fluxo real do hangar.</p>\r\n  <div class=\"as-btns\">\r\n    <a class=\"primary\" href=\"https://aerosuite.com.br/contato/\">Agendar demonstração</a>\r\n    <a class=\"ghost\" href=\"https://aerosuite.com.br/solucoes/\">Ver todos os módulos</a>\r\n  </div>\r\n</section>\n<!-- /wp:html -->\n<!-- wp:group {\"layout\":{\"type\":\"constrained\",\"contentSize\":\"720px\"}} --><div class=\"wp-block-group\">\n<!-- wp:heading {\"textAlign\":\"center\",\"level\":3} --><h3 class=\"wp-block-heading has-text-align-center\">Solicitar proposta comercial</h3><!-- /wp:heading -->\n<!-- wp:paragraph {\"align\":\"center\"} --><p class=\"has-text-align-center\">Demonstramos a plataforma e montamos proposta alinhada à sua operação.</p><!-- /wp:paragraph -->\n<!-- wp:wpforms/form {\"formId\":\"12\"} /--></div><!-- /wp:group -->";
  const sol = "<!-- wp:cover {\"dimRatio\":90,\"minHeight\":40,\"minHeightUnit\":\"vh\",\"align\":\"full\"} -->\n<div class=\"wp-block-cover alignfull\" style=\"min-height:40vh\"><span class=\"wp-block-cover__background has-background-dim-90\"></span><div class=\"wp-block-cover__inner-container\">\n<!-- wp:heading {\"textAlign\":\"center\",\"level\":1} --><h1 class=\"wp-block-heading has-text-align-center\">Soluções para operação MRO</h1><!-- /wp:heading -->\n<!-- wp:paragraph {\"align\":\"center\"} --><p class=\"has-text-align-center\">Hangar, estoque, comercial e portal — sem silos entre equipes.</p><!-- /wp:paragraph -->\n</div></div><!-- /wp:cover -->\n<!-- wp:html -->\n<!-- Cole como bloco HTML personalizado no WordPress -->\r\n<section class=\"as-showcase\" aria-label=\"Módulos Aero Suite\">\r\n  <div class=\"as-kpi-strip\">\r\n    <div class=\"as-kpi\"><div class=\"as-kpi__val\">OS</div><div class=\"as-kpi__label\">Ordens de serviço</div></div>\r\n    <div class=\"as-kpi\"><div class=\"as-kpi__val gold\">FIFO</div><div class=\"as-kpi__label\">Estoque rastreável</div></div>\r\n    <div class=\"as-kpi\"><div class=\"as-kpi__val\">CRM</div><div class=\"as-kpi__label\">Propostas comerciais</div></div>\r\n    <div class=\"as-kpi\"><div class=\"as-kpi__val gold\">Portal</div><div class=\"as-kpi__label\">Cliente externo</div></div>\r\n  </div>\r\n  <div class=\"as-showcase-grid\">\r\n    <article class=\"as-ui-card\">\r\n      <span class=\"as-ui-card__badge\">Ponto forte</span>\r\n      <div class=\"as-ui-frame\">\r\n        <div class=\"as-ui-frame__bar\"><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span></div>\r\n        <div class=\"as-ui-mock\">\r\n          <div class=\"row\"><strong>OS-2026-0142</strong><span class=\"tag\">Em execução</span></div>\r\n          <div class=\"row\"><strong>Job card · HB-ZXY</strong><span class=\"tag\">Hangar 2</span></div>\r\n          <div class=\"row\"><strong>Peças reservadas</strong><span class=\"tag\">FIFO OK</span></div>\r\n        </div>\r\n      </div>\r\n      <div class=\"as-ui-card__body\">\r\n        <h3>Ordens de serviço integradas</h3>\r\n        <p>Da abertura ao fechamento: status, job cards, histórico e vínculo com peças — sem planilha paralela.</p>\r\n      </div>\r\n    </article>\r\n    <article class=\"as-ui-card\">\r\n      <span class=\"as-ui-card__badge\">Ponto forte</span>\r\n      <div class=\"as-ui-frame\">\r\n        <div class=\"as-ui-frame__bar\"><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span></div>\r\n        <div class=\"as-ui-mock\">\r\n          <div class=\"row\"><strong>Lote PN-8842-A</strong><span class=\"tag\">Rastreado</span></div>\r\n          <div class=\"row\"><strong>Movimentação</strong><span class=\"tag\">OS-0142</span></div>\r\n          <div class=\"row\"><strong>Saldo hangar</strong><span class=\"tag\">Atualizado</span></div>\r\n        </div>\r\n      </div>\r\n      <div class=\"as-ui-card__body\">\r\n        <h3>Estoque com rastreio FIFO</h3>\r\n        <p>Peças ligadas à OS certa, movimentações auditáveis e visibilidade para compras e qualidade.</p>\r\n      </div>\r\n    </article>\r\n    <article class=\"as-ui-card\">\r\n      <span class=\"as-ui-card__badge\">Ponto forte</span>\r\n      <div class=\"as-ui-frame\">\r\n        <div class=\"as-ui-frame__bar\"><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span></div>\r\n        <div class=\"as-ui-mock\">\r\n          <div class=\"row\"><strong>Proposta #1089</strong><span class=\"tag\">Enviada</span></div>\r\n          <div class=\"row\"><strong>Revisão v3</strong><span class=\"tag\">Rastreada</span></div>\r\n          <div class=\"row\"><strong>Aprovação cliente</strong><span class=\"tag\">Pendente</span></div>\r\n        </div>\r\n      </div>\r\n      <div class=\"as-ui-card__body\">\r\n        <h3>Comercial com histórico</h3>\r\n        <p>Propostas versionadas, rastreio e aprovação — acaba com PDF perdido no e-mail.</p>\r\n      </div>\r\n    </article>\r\n    <article class=\"as-ui-card\">\r\n      <span class=\"as-ui-card__badge\">Ponto forte</span>\r\n      <div class=\"as-ui-frame\">\r\n        <div class=\"as-ui-frame__bar\"><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span><span class=\"as-ui-frame__dot\"></span></div>\r\n        <div class=\"as-ui-mock\">\r\n          <div class=\"row\"><strong>Cliente OM Beta</strong><span class=\"tag\">Portal</span></div>\r\n          <div class=\"row\"><strong>Status serviço</strong><span class=\"tag\">Transparente</span></div>\r\n          <div class=\"row\"><strong>Documentos</strong><span class=\"tag\">Disponíveis</span></div>\r\n        </div>\r\n      </div>\r\n      <div class=\"as-ui-card__body\">\r\n        <h3>Portal do cliente</h3>\r\n        <p>Seu cliente acompanha o serviço com transparência, sem ruído na comunicação.</p>\r\n      </div>\r\n    </article>\r\n  </div>\r\n</section>\n<!-- /wp:html -->\n<!-- wp:html -->\n<section class=\"as-cta-band\">\r\n  <h2>Pronto para ver a Aero Suite na sua operação?</h2>\r\n  <p>Demonstração guiada para oficinas MRO e OMs — sem compromisso. Mostramos OS, estoque, comercial e portal no fluxo real do hangar.</p>\r\n  <div class=\"as-btns\">\r\n    <a class=\"primary\" href=\"https://aerosuite.com.br/contato/\">Agendar demonstração</a>\r\n    <a class=\"ghost\" href=\"https://aerosuite.com.br/solucoes/\">Ver todos os módulos</a>\r\n  </div>\r\n</section>\n<!-- /wp:html -->\n<!-- wp:buttons {\"layout\":{\"type\":\"flex\",\"justifyContent\":\"center\"}} --><div class=\"wp-block-buttons\"><!-- wp:button --><div class=\"wp-block-button\"><a class=\"wp-block-button__link wp-element-button\" href=\"https://aerosuite.com.br/contato/\">Falar com especialista</a></div><!-- /wp:button --></div><!-- /wp:buttons -->";
  const sobre = "<!-- wp:columns {\"align\":\"wide\"} --><div class=\"wp-block-columns alignwide\">\n<!-- wp:column {\"width\":\"40%\"} --><div class=\"wp-block-column\" style=\"flex-basis:40%\"><figure class=\"wp-block-image\" id=\"as-about-logo\"></figure></div><!-- /wp:column -->\n<!-- wp:column {\"width\":\"60%\"} --><div class=\"wp-block-column\" style=\"flex-basis:60%\">\n<!-- wp:heading {\"level\":1} --><h1>Sobre a Aero Suite</h1><!-- /wp:heading -->\n<!-- wp:paragraph --><p>Plataforma SaaS de gestão para manutenção aeronáutica (MRO e OM), desenvolvida no Brasil.</p><!-- /wp:paragraph -->\n<!-- wp:paragraph --><p>RBAC, nuvem e evolução contínua — sem a complexidade de ERP genérico.</p><!-- /wp:paragraph -->\n</div><!-- /wp:column --></div><!-- /wp:columns -->\n<!-- wp:html -->\n<div class=\"as-kpi-strip\"><div class=\"as-kpi\"><div class=\"as-kpi__val\">MRO</div><div class=\"as-kpi__label\">Foco aeronáutico</div></div><div class=\"as-kpi\"><div class=\"as-kpi__val gold\">RBAC</div><div class=\"as-kpi__label\">Perfis</div></div><div class=\"as-kpi\"><div class=\"as-kpi__val\">SaaS</div><div class=\"as-kpi__label\">Atualizado</div></div><div class=\"as-kpi\"><div class=\"as-kpi__val gold\">BR</div><div class=\"as-kpi__label\">Suporte local</div></div></div>\n<!-- /wp:html -->\n<!-- wp:html -->\n<section class=\"as-cta-band\">\r\n  <h2>Pronto para ver a Aero Suite na sua operação?</h2>\r\n  <p>Demonstração guiada para oficinas MRO e OMs — sem compromisso. Mostramos OS, estoque, comercial e portal no fluxo real do hangar.</p>\r\n  <div class=\"as-btns\">\r\n    <a class=\"primary\" href=\"https://aerosuite.com.br/contato/\">Agendar demonstração</a>\r\n    <a class=\"ghost\" href=\"https://aerosuite.com.br/solucoes/\">Ver todos os módulos</a>\r\n  </div>\r\n</section>\n<!-- /wp:html -->";
  const contato = "<!-- wp:heading {\"level\":1} --><h1>Contato</h1><!-- /wp:heading -->\n<!-- wp:paragraph --><p>Agende demonstração ou solicite proposta. Respondemos em até um dia útil.</p><!-- /wp:paragraph -->\n<!-- wp:wpforms/form {\"formId\":\"12\"} /-->";
  await wp.apiFetch({ path: '/wp/v2/pages/21', method: 'POST', data: { content: home, status: 'publish' } });
  await wp.apiFetch({ path: '/wp/v2/pages/20', method: 'POST', data: { content: sol, title: 'Soluções', status: 'publish' } });
  await wp.apiFetch({ path: '/wp/v2/pages/16', method: 'POST', data: { content: sobre, status: 'publish' } });
  await wp.apiFetch({ path: '/wp/v2/pages/18', method: 'POST', data: { content: contato, status: 'publish' } });
  return { ok: true };
})()