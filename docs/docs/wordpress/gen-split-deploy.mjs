import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const text = JSON.parse(fs.readFileSync(path.join(dir, 'eval-chunks/text.json'), 'utf8'));

function htmlBlock(inner) {
  return '<!-- wp:html -->\n' + inner.trim() + '\n<!-- /wp:html -->';
}

const showcase = text.showcase;
const cta = text.cta;

const pages = {
  home: [
    '<!-- wp:cover {"dimRatio":88,"minHeight":72,"minHeightUnit":"vh","align":"full","className":"as-hero-cover"} -->',
    '<div class="wp-block-cover alignfull as-hero-cover" style="min-height:72vh"><span class="wp-block-cover__background has-background-dim-88"></span><div class="wp-block-cover__inner-container">',
    '<!-- wp:group {"layout":{"type":"constrained","contentSize":"1100px"}} --><div class="wp-block-group">',
    '<!-- wp:columns {"verticalAlignment":"center"} --><div class="wp-block-columns are-vertically-aligned-center">',
    '<!-- wp:column {"width":"58%"} --><div class="wp-block-column" style="flex-basis:58%">',
    '<!-- wp:heading {"level":1} --><h1>Gestão MRO completa.<br>Do hangar ao cliente.</h1><!-- /wp:heading -->',
    '<!-- wp:paragraph --><p>OS, estoque FIFO, propostas comerciais e portal do cliente — SaaS para oficinas MRO no Brasil.</p><!-- /wp:paragraph -->',
    '<!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://aerosuite.com.br/contato/">Agendar demonstração</a></div><!-- /wp:button --><!-- wp:button {"className":"is-style-outline"} --><div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="#recursos">Ver módulos</a></div><!-- /wp:button --></div><!-- /wp:buttons -->',
    '</div><!-- /wp:column -->',
    '<!-- wp:column {"width":"42%"} --><div class="wp-block-column" style="flex-basis:42%"><!-- wp:image {"id":0,"sizeSlug":"large"} --><figure class="wp-block-image size-large"><img src="{{HERO_LOGO}}" alt="Aero Suite — plataforma MRO"/></figure><!-- /wp:image --></div><!-- /wp:column -->',
    '</div><!-- /wp:columns --></div><!-- /wp:group --></div></div><!-- /wp:cover -->',
    '<!-- wp:group {"tagName":"section","anchor":"recursos","layout":{"type":"constrained","contentSize":"1200px"}} -->',
    '<section id="recursos" class="wp-block-group">',
    '<!-- wp:heading {"textAlign":"center"} --><h2 class="has-text-align-center">Por que oficinas MRO escolhem a Aero Suite</h2><!-- /wp:heading -->',
    '<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">Menos planilha, mais rastreio: do job card ao portal do cliente.</p><!-- /wp:paragraph -->',
    htmlBlock(showcase),
    '</section><!-- /wp:group -->',
    htmlBlock(cta),
    '<!-- wp:group {"layout":{"type":"constrained","contentSize":"720px"}} --><div class="wp-block-group">',
    '<!-- wp:heading {"textAlign":"center","level":3} --><h3 class="has-text-align-center">Solicitar proposta comercial</h3><!-- /wp:heading -->',
    '<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">Demonstramos a plataforma e montamos proposta alinhada à sua operação.</p><!-- /wp:paragraph -->',
    '<!-- wp:wpforms/form {"formId":"12"} /--></div><!-- /wp:group -->',
  ].join('\n'),
  solucoes: [
    '<!-- wp:cover {"dimRatio":90,"minHeight":40,"minHeightUnit":"vh","align":"full"} -->',
    '<div class="wp-block-cover alignfull" style="min-height:40vh"><span class="wp-block-cover__background has-background-dim-90"></span><div class="wp-block-cover__inner-container">',
    '<!-- wp:heading {"textAlign":"center","level":1} --><h1 class="has-text-align-center">Soluções para operação MRO</h1><!-- /wp:heading -->',
    '<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">Hangar, estoque, comercial e portal integrados.</p><!-- /wp:paragraph -->',
    '</div></div><!-- /wp:cover -->',
    htmlBlock(showcase),
    htmlBlock(cta),
    '<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://aerosuite.com.br/contato/">Falar com especialista</a></div><!-- /wp:button --></div><!-- /wp:buttons -->',
  ].join('\n'),
  sobre: [
    '<!-- wp:columns {"align":"wide"} --><div class="wp-block-columns alignwide">',
    '<!-- wp:column {"width":"40%"} --><div class="wp-block-column" style="flex-basis:40%"><!-- wp:image --><figure class="wp-block-image"><img src="{{MARK_LOGO}}" alt="Aero Suite"/></figure><!-- /wp:image --></div><!-- /wp:column -->',
    '<!-- wp:column {"width":"60%"} --><div class="wp-block-column" style="flex-basis:60%">',
    '<!-- wp:heading {"level":1} --><h1>Sobre a Aero Suite</h1><!-- /wp:heading -->',
    '<!-- wp:paragraph --><p>Plataforma SaaS de gestão para manutenção aeronáutica (MRO e OM), desenvolvida no Brasil.</p><!-- /wp:paragraph -->',
    '<!-- wp:paragraph --><p>RBAC, nuvem e evolução contínua — sem ERP genérico.</p><!-- /wp:paragraph -->',
    '</div><!-- /wp:column --></div><!-- /wp:columns -->',
    htmlBlock('<div class="as-kpi-strip"><div class="as-kpi"><div class="as-kpi__val">MRO</div><div class="as-kpi__label">Foco aeronáutico</div></div><div class="as-kpi"><div class="as-kpi__val gold">RBAC</div><div class="as-kpi__label">Perfis</div></div><div class="as-kpi"><div class="as-kpi__val">SaaS</div><div class="as-kpi__label">Atualizado</div></div><div class="as-kpi"><div class="as-kpi__val gold">BR</div><div class="as-kpi__label">Suporte local</div></div></div>'),
    htmlBlock(cta),
  ].join('\n'),
  contato: [
    '<!-- wp:heading {"level":1} --><h1>Contato</h1><!-- /wp:heading -->',
    '<!-- wp:paragraph --><p>Agende demonstração ou solicite proposta. Respondemos em até um dia útil.</p><!-- /wp:paragraph -->',
    '<!-- wp:wpforms/form {"formId":"12"} /-->',
  ].join('\n'),
};

fs.writeFileSync(path.join(dir, 'pages-data.json'), JSON.stringify(pages));

const cssEsc = text.css.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
const jsEsc = text.js.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

const footerExpr = `(async () => {
  const css = \`${cssEsc}\`;
  const js = \`${jsEsc}\`;
  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  footer = footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium[\\s\\S]*?<!-- \\/wp:html -->/g, '');
  const block = '<!-- wp:html -->\\n<style id="aerosuite-premium-css">' + css + '</style>\\n<script id="aerosuite-phone-mask-js">' + js + '</script>\\n<!-- /wp:html -->\\n';
  if (!footer.includes('aerosuite-premium-css')) footer = block + footer;
  await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer', method: 'POST', data: { content: footer } });
  return { ok: true, footerLen: footer.length };
})()`;

fs.writeFileSync(path.join(dir, 'deploy-footer.js'), footerExpr);
console.log('footer', footerExpr.length);

// Upload mark only (smaller) + pages with placeholder replaced in step2
const markB64 = JSON.parse(fs.readFileSync(path.join(dir, 'eval-chunks/mark-0.json'), 'utf8'));
const uploadMark = `(async () => {
  const b64 = ${JSON.stringify(markB64)};
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const fd = new FormData();
  fd.append('file', new Blob([arr], { type: 'image/png' }), 'aerosuite-logo-aero.png');
  const m = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
  window.__asUrls = window.__asUrls || {};
  window.__asUrls.mark = m.source_url;
  return { mark: m.source_url, id: m.id };
})()`;
fs.writeFileSync(path.join(dir, 'deploy-mark.js'), uploadMark);
console.log('mark', uploadMark.length);

// logo chunks init
const logoChunks = [];
for (let i = 0; i < 6; i++) {
  logoChunks.push(JSON.parse(fs.readFileSync(path.join(dir, `eval-chunks/logo-${i}.json`), 'utf8')));
}
fs.writeFileSync(
  path.join(dir, 'deploy-logo-parts.json'),
  JSON.stringify({ parts: logoChunks.length, sizes: logoChunks.map((c) => c.length) })
);

logoChunks.forEach((chunk, i) => {
  const expr = `(async () => { window.__logoB64 = (window.__logoB64 || '') + ${JSON.stringify(chunk)}; return { part: ${i}, len: window.__logoB64.length }; })()`;
  fs.writeFileSync(path.join(dir, `deploy-logo-${i}.js`), expr);
  console.log(`logo-${i}`, expr.length);
});

const finalizeLogo = `(async () => {
  const b64 = window.__logoB64;
  if (!b64 || b64.length < 1000) return { err: 'missing b64', len: (b64||'').length };
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const fd = new FormData();
  fd.append('file', new Blob([arr], { type: 'image/png' }), 'aerosuite-pictureandletter.png');
  const m = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
  window.__asUrls = window.__asUrls || {};
  window.__asUrls.hero = m.source_url;
  return { hero: m.source_url };
})()`;
fs.writeFileSync(path.join(dir, 'deploy-logo-final.js'), finalizeLogo);

const publishPages = `(async () => {
  const pages = ${JSON.stringify(pages)};
  const hero = (window.__asUrls && window.__asUrls.hero) || (window.__asUrls && window.__asUrls.mark) || '';
  const mark = (window.__asUrls && window.__asUrls.mark) || hero;
  const home = pages.home.replace('{{HERO_LOGO}}', hero).replace('{{MARK_LOGO}}', mark);
  const sobre = pages.sobre.replace('{{MARK_LOGO}}', mark).replace('{{HERO_LOGO}}', hero);
  await wp.apiFetch({ path: '/wp/v2/pages/21', method: 'POST', data: { content: home, status: 'publish' } });
  await wp.apiFetch({ path: '/wp/v2/pages/20', method: 'POST', data: { content: pages.solucoes, title: 'Soluções', status: 'publish' } });
  await wp.apiFetch({ path: '/wp/v2/pages/16', method: 'POST', data: { content: sobre, status: 'publish' } });
  await wp.apiFetch({ path: '/wp/v2/pages/18', method: 'POST', data: { content: pages.contato, status: 'publish' } });
  return { ok: true, hero, mark };
})()`;
fs.writeFileSync(path.join(dir, 'deploy-pages.js'), publishPages);
console.log('pages', publishPages.length);
