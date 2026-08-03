import { LINKS, MEDIA } from './aerosuite-site-config.mjs';

/**
 * Remove navegação padrão do tema Extendable (evita duplicar a barra Aero Suite).
 */
export function stripExtendableThemeNav(headerRaw) {
  if (!headerRaw) return headerRaw;
  let header = headerRaw;
  header = header.replace(/<!-- wp:site-title[^>]*\/-->\n?/g, '');
  header = header.replace(/<!-- wp:site-title[\s\S]*?<!-- \/wp:site-title -->\n?/g, '');
  header = header.replace(/<!-- wp:site-logo[^>]*\/-->\n?/g, '');
  header = header.replace(/<!-- wp:navigation[\s\S]*?<!-- \/wp:navigation -->\n?/g, '');
  header = header.replace(/<!-- wp:page-list[\s\S]*?<!-- \/wp:page-list -->\n?/g, '');
  header = header.replace(
    /<nav[^>]*class="[^"]*wp-block-navigation[^"]*"[^>]*>[\s\S]*?<\/nav>\n?/gi,
    ''
  );
  return header;
}

/** Barra unificada: logo + links (única navegação do site). */
export const SUPPLEMENTAL_NAV_BLOCK = `<!-- wp:html -->
<nav class="as-supplemental-nav as-supplemental-nav--v5" aria-label="Navegação principal Aero Suite">
  <div class="as-supplemental-nav__inner">
    <a class="as-site-header-logo" href="${LINKS.home}" aria-label="Aero Suite — início">
      <img src="${MEDIA.logoLight}" alt="Aero Suite" width="160" height="48" loading="eager" decoding="async"/>
    </a>
    <div class="as-supplemental-nav__links">
      <a href="${LINKS.conformidade}">Conformidade</a>
      <a href="${LINKS.solucoes}">Soluções</a>
      <a href="${LINKS.casos}">Casos</a>
      <a href="${LINKS.blog}">Blog</a>
      <a href="${LINKS.comparativo}">Comparativo</a>
      <a href="${LINKS.sobre}">Sobre</a>
    </div>
  </div>
</nav>
<!-- /wp:html -->`;
