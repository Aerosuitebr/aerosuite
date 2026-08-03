import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SITE, LINKS, MEDIA } from './aerosuite-site-config.mjs';

const _dir = path.dirname(fileURLToPath(import.meta.url));
const _criticalCss = fs.readFileSync(path.join(_dir, 'aerosuite-critical.css'), 'utf8');

/** Barra institucional global (legal, blog, comparativo). */
export const FOOTER_CHROME_BLOCK = `<!-- wp:html -->
<footer class="as-site-chrome" role="contentinfo" aria-label="Rodapé institucional">
  <div class="as-site-chrome__inner">
    <div class="as-site-chrome__brand">
      <a href="${LINKS.home}"><img src="${MEDIA.logoLight}" alt="${SITE.brand}" width="160" height="40" loading="lazy" decoding="async"/></a>
      <p>Gestão aeronáutica e conformidade regulatória para oficinas MRO no Brasil.</p>
    </div>
    <nav class="as-site-chrome__nav" aria-label="Links do site">
      <div class="as-site-chrome__col">
        <strong>Produto</strong>
        <a href="${LINKS.conformidade}">Conformidade</a>
        <a href="${LINKS.solucoes}">Soluções</a>
        <a href="${LINKS.recursos}">Módulos</a>
        <a href="${LINKS.comparativo}">vs Planilhas</a>
        <a href="${LINKS.contatoAgendar}" class="as-track-demo" data-as-event="cta_demo" data-as-location="footer_nav">Demonstração</a>
      </div>
      <div class="as-site-chrome__col">
        <strong>Conteúdo</strong>
        <a href="${LINKS.blog}">Blog</a>
        <a href="${LINKS.casos}">Casos</a>
        <a href="${LINKS.casoBellows}">Bellows</a>
        <a href="${LINKS.casoKingDoRio}">King do Rio</a>
        <a href="${LINKS.sobre}">Sobre</a>
      </div>
      <div class="as-site-chrome__col">
        <strong>Legal</strong>
        <a href="${LINKS.privacidade}">Privacidade</a>
        <a href="${LINKS.termos}">Termos de uso</a>
        <a href="mailto:${SITE.email}">E-mail comercial</a>
        <a href="${SITE.origin}/seguranca-e-dados/">Segurança e dados</a>
      </div>
    </nav>
  </div>
  <p class="as-site-chrome__copy">© ${new Date().getFullYear()} ${SITE.legalName} · Software SaaS para manutenção aeronáutica</p>
</footer>
<!-- /wp:html -->`;

export const FAVICON_LINKS_BLOCK = `<!-- wp:html -->
<link rel="icon" id="as-favicon-aerosuite" href="${MEDIA.favicon}" sizes="any" type="image/png"/>
<link rel="apple-touch-icon" href="${MEDIA.favicon}"/>
<meta name="theme-color" content="#051a3d"/>
<!-- /wp:html -->`;

/** Dashboard preload fica no plugin aerosuite-performance (evita duplicata OG/LCP). */
export const HEADER_PRELOAD_BLOCK = `<!-- wp:html -->
<link rel="preconnect" href="${SITE.origin}" crossorigin/>
<link rel="dns-prefetch" href="${SITE.origin}"/>
<link rel="preload" as="image" href="${MEDIA.logoLight}" fetchpriority="high" id="as-preload-hero-logo"/>
<!-- /wp:html -->`;

export const CRITICAL_CSS_BLOCK = `<!-- wp:html -->
<style id="aerosuite-critical-css">${_criticalCss}</style>
<!-- /wp:html -->`;

/** Tag crua (header WP às vezes guarda só o &lt;style&gt;, sem bloco wp:html). */
export const CRITICAL_CSS_STYLE_TAG = `<style id="aerosuite-critical-css">${_criticalCss}</style>`;

export function appendFooterChrome(footerRaw) {
  const cleaned = footerRaw
    .replace(/<!-- wp:site-title[^>]*\/-->\n?/g, '')
    .replace(/<!-- wp:site-title[\s\S]*?<!-- \/wp:site-title -->\n?/g, '')
    .replace(/<!-- wp:site-logo[^>]*\/-->\n?/g, '');
  if (cleaned.includes('as-site-chrome')) return cleaned;
  return cleaned + '\n' + FOOTER_CHROME_BLOCK;
}

export function prependHeaderExtras(headerRaw) {
  let header = headerRaw;
  if (!header.includes('as-favicon-aerosuite')) {
    header = FAVICON_LINKS_BLOCK + '\n' + header;
  }
  if (!header.includes('as-preload-hero-logo')) {
    header = HEADER_PRELOAD_BLOCK + '\n' + header;
  }
  return header;
}
