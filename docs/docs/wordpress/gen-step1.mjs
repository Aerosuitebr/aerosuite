import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const text = JSON.parse(fs.readFileSync(path.join(dir, 'eval-chunks/text.json'), 'utf8'));

const pages = fs.readFileSync(path.join(dir, 'browser-deploy.js'), 'utf8');
// Extract page building - duplicate minimal inline

function htmlBlock(inner) {
  return '<!-- wp:html -->\n' + inner.trim() + '\n<!-- /wp:html -->';
}

const showcase = text.showcase;
const cta = text.cta;

const homeContent = [
  '<!-- wp:cover {"dimRatio":88,"overlayColor":"contrast","minHeight":72,"minHeightUnit":"vh","align":"full"} -->',
  '<div class="wp-block-cover alignfull" style="min-height:72vh"><span aria-hidden="true" class="wp-block-cover__background has-contrast-background-color has-background-dim-88 has-background-dim"></span><div class="wp-block-cover__inner-container">',
  '<!-- wp:group {"layout":{"type":"constrained","contentSize":"1100px"}} --><div class="wp-block-group">',
  '<!-- wp:columns {"verticalAlignment":"center"} --><div class="wp-block-columns are-vertically-aligned-center">',
  '<!-- wp:column {"width":"58%"} --><div class="wp-block-column" style="flex-basis:58%">',
  '<!-- wp:heading {"level":1} --><h1 class="wp-block-heading">Gestão MRO completa.<br>Do hangar ao cliente.</h1><!-- /wp:heading -->',
  '<!-- wp:paragraph --><p>OS, estoque FIFO, propostas comerciais e portal do cliente — uma plataforma SaaS para oficinas MRO no Brasil.</p><!-- /wp:paragraph -->',
  '<!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://aerosuite.com.br/contato/">Agendar demonstração</a></div><!-- /wp:button --><!-- wp:button {"className":"is-style-outline"} --><div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="#recursos">Ver módulos</a></div><!-- /wp:button --></div><!-- /wp:buttons -->',
  '</div><!-- /wp:column -->',
  '<!-- wp:column {"width":"42%"} --><div class="wp-block-column" style="flex-basis:42%"><figure class="wp-block-image as-hero-logo" id="as-hero-logo"></figure></div><!-- /wp:column -->',
  '</div><!-- /wp:columns --></div><!-- /wp:group --></div></div><!-- /wp:cover -->',
  '<!-- wp:group {"tagName":"section","anchor":"recursos","layout":{"type":"constrained","contentSize":"1200px"}} -->',
  '<section id="recursos" class="wp-block-group">',
  '<!-- wp:heading {"textAlign":"center"} --><h2 class="wp-block-heading has-text-align-center">Por que oficinas MRO escolhem a Aero Suite</h2><!-- /wp:heading -->',
  '<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">Menos planilha, mais rastreio: do job card ao portal do cliente, tudo conectado.</p><!-- /wp:paragraph -->',
  htmlBlock(showcase),
  '</section><!-- /wp:group -->',
  htmlBlock(cta),
  '<!-- wp:group {"layout":{"type":"constrained","contentSize":"720px"}} --><div class="wp-block-group">',
  '<!-- wp:heading {"textAlign":"center","level":3} --><h3 class="wp-block-heading has-text-align-center">Solicitar proposta comercial</h3><!-- /wp:heading -->',
  '<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">Demonstramos a plataforma e montamos proposta alinhada à sua operação.</p><!-- /wp:paragraph -->',
  '<!-- wp:wpforms/form {"formId":"12"} /--></div><!-- /wp:group -->',
].join('\n');

const solucoesContent = [
  '<!-- wp:cover {"dimRatio":90,"minHeight":40,"minHeightUnit":"vh","align":"full"} -->',
  '<div class="wp-block-cover alignfull" style="min-height:40vh"><span class="wp-block-cover__background has-background-dim-90"></span><div class="wp-block-cover__inner-container">',
  '<!-- wp:heading {"textAlign":"center","level":1} --><h1 class="wp-block-heading has-text-align-center">Soluções para operação MRO</h1><!-- /wp:heading -->',
  '<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">Hangar, estoque, comercial e portal — sem silos entre equipes.</p><!-- /wp:paragraph -->',
  '</div></div><!-- /wp:cover -->',
  htmlBlock(showcase),
  htmlBlock(cta),
  '<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://aerosuite.com.br/contato/">Falar com especialista</a></div><!-- /wp:button --></div><!-- /wp:buttons -->',
].join('\n');

const sobreContent = [
  '<!-- wp:columns {"align":"wide"} --><div class="wp-block-columns alignwide">',
  '<!-- wp:column {"width":"40%"} --><div class="wp-block-column" style="flex-basis:40%"><figure class="wp-block-image" id="as-about-logo"></figure></div><!-- /wp:column -->',
  '<!-- wp:column {"width":"60%"} --><div class="wp-block-column" style="flex-basis:60%">',
  '<!-- wp:heading {"level":1} --><h1>Sobre a Aero Suite</h1><!-- /wp:heading -->',
  '<!-- wp:paragraph --><p>Plataforma SaaS de gestão para manutenção aeronáutica (MRO e OM), desenvolvida no Brasil.</p><!-- /wp:paragraph -->',
  '<!-- wp:paragraph --><p>RBAC, nuvem e evolução contínua — sem a complexidade de ERP genérico.</p><!-- /wp:paragraph -->',
  '</div><!-- /wp:column --></div><!-- /wp:columns -->',
  htmlBlock('<div class="as-kpi-strip"><div class="as-kpi"><div class="as-kpi__val">MRO</div><div class="as-kpi__label">Foco aeronáutico</div></div><div class="as-kpi"><div class="as-kpi__val gold">RBAC</div><div class="as-kpi__label">Perfis</div></div><div class="as-kpi"><div class="as-kpi__val">SaaS</div><div class="as-kpi__label">Atualizado</div></div><div class="as-kpi"><div class="as-kpi__val gold">BR</div><div class="as-kpi__label">Suporte local</div></div></div>'),
  htmlBlock(cta),
].join('\n');

const contatoContent = [
  '<!-- wp:heading {"level":1} --><h1>Contato</h1><!-- /wp:heading -->',
  '<!-- wp:paragraph --><p>Agende demonstração ou solicite proposta. Respondemos em até um dia útil.</p><!-- /wp:paragraph -->',
  '<!-- wp:wpforms/form {"formId":"12"} /-->',
].join('\n');

const cssEsc = text.css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
const jsEsc = text.js.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

const expr = `(async () => {
  const css = \`${cssEsc}\`;
  const js = \`${jsEsc}\`;
  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  footer = footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium[\\s\\S]*?<!-- \\/wp:html -->/g, '');
  const block = '<!-- wp:html -->\\n<style id="aerosuite-premium-css">' + css + '</style>\\n<script id="aerosuite-phone-mask-js">' + js + '</script>\\n<!-- /wp:html -->\\n';
  if (!footer.includes('aerosuite-premium-css')) footer = block + footer;
  await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer', method: 'POST', data: { content: footer } });
  const home = ${JSON.stringify(homeContent)};
  const sol = ${JSON.stringify(solucoesContent)};
  const sobre = ${JSON.stringify(sobreContent)};
  const contato = ${JSON.stringify(contatoContent)};
  await wp.apiFetch({ path: '/wp/v2/pages/21', method: 'POST', data: { content: home, status: 'publish' } });
  await wp.apiFetch({ path: '/wp/v2/pages/20', method: 'POST', data: { content: sol, title: 'Soluções', status: 'publish' } });
  await wp.apiFetch({ path: '/wp/v2/pages/16', method: 'POST', data: { content: sobre, status: 'publish' } });
  await wp.apiFetch({ path: '/wp/v2/pages/18', method: 'POST', data: { content: contato, status: 'publish' } });
  return { ok: true };
})()`;

fs.writeFileSync(path.join(dir, 'step1-eval.js'), expr);
console.log('step1 size', expr.length);
