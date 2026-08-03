/**
 * Execute no wp-admin: await window.aerosuiteDeploy()
 * Requer: http://127.0.0.1:8765/deploy-payload.json
 */
window.aerosuiteDeploy = async function aerosuiteDeploy() {
  const PAYLOAD_URL = 'http://127.0.0.1:8765/deploy-payload.json';

  async function uploadB64({ name, mime, b64 }) {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    const fd = new FormData();
    fd.append('file', blob, name);
    fd.append('title', name.replace(/\.[^.]+$/, ''));
    const media = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
    return media.source_url;
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function htmlBlock(inner) {
    return (
      '<!-- wp:html -->\n' +
      inner.trim() +
      '\n<!-- /wp:html -->'
    );
  }

  const payload = await fetch(PAYLOAD_URL).then((r) => {
    if (!r.ok) throw new Error('Payload fetch failed: ' + r.status);
    return r.json();
  });

  const urls = {};
  for (const key of ['css', 'js', 'logo', 'logoMark', 'bg']) {
    if (!payload[key]) continue;
    urls[key] = await uploadB64(payload[key]);
  }

  const showcase = payload.showcase
    ? atob(payload.showcase.b64)
    : '';
  const cta = payload.cta ? atob(payload.cta.b64) : '';

  // Footer: assets globais
  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' }))
    .content.raw;
  footer = footer.replace(
    /<!-- wp:html -->[\s\S]*?aerosuite-premium[\s\S]*?<!-- \/wp:html -->/g,
    ''
  );
  const assetBlock =
    '<!-- wp:html -->\n' +
    '<link rel="stylesheet" href="' +
    urls.css +
    '" id="aerosuite-premium-css" />\n' +
    '<script src="' +
    urls.js +
    '" id="aerosuite-phone-mask-js" defer></script>\n' +
    '<!-- /wp:html -->\n';
  if (!footer.includes('aerosuite-premium-css')) {
    footer = assetBlock + footer;
  }
  await wp.apiFetch({
    path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer',
    method: 'POST',
    data: { content: footer },
  });

  const heroImg = urls.logo || urls.logoMark;
  const markImg = urls.logoMark || urls.logo;

  const homeContent = [
    '<!-- wp:cover {"url":"' +
      (urls.bg || '') +
      '","dimRatio":88,"overlayColor":"contrast","isUserOverlayColor":true,"minHeight":72,"minHeightUnit":"vh","align":"full","style":{"spacing":{"padding":{"top":"4rem","bottom":"4rem"}}}} -->',
    '<div class="wp-block-cover alignfull" style="min-height:72vh;padding-top:4rem;padding-bottom:4rem">',
    '<span aria-hidden="true" class="wp-block-cover__background has-contrast-background-color has-background-dim-88 has-background-dim"></span>',
    urls.bg
      ? '<img class="wp-block-cover__image-background" alt="" src="' + urls.bg + '" data-object-fit="cover"/>'
      : '',
    '<div class="wp-block-cover__inner-container">',
    '<!-- wp:group {"layout":{"type":"constrained","contentSize":"1100px"}} -->',
    '<div class="wp-block-group">',
    '<!-- wp:columns {"verticalAlignment":"center"} -->',
    '<div class="wp-block-columns are-vertically-aligned-center">',
    '<!-- wp:column {"verticalAlignment":"center","width":"58%"} -->',
    '<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:58%">',
    '<!-- wp:heading {"level":1,"fontSize":"xx-large"} -->',
    '<h1 class="wp-block-heading has-xx-large-font-size">Gestão MRO completa.<br>Do hangar ao cliente.</h1>',
    '<!-- /wp:heading -->',
    '<!-- wp:paragraph {"fontSize":"medium"} -->',
    '<p class="has-medium-font-size">OS, estoque FIFO, propostas comerciais e portal do cliente — uma plataforma SaaS pensada para oficinas de manutenção aeronáutica no Brasil.</p>',
    '<!-- /wp:paragraph -->',
    '<!-- wp:buttons -->',
    '<div class="wp-block-buttons">',
    '<!-- wp:button -->',
    '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://aerosuite.com.br/contato/">Agendar demonstração</a></div>',
    '<!-- /wp:button -->',
    '<!-- wp:button {"className":"is-style-outline"} -->',
    '<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="#recursos">Ver módulos</a></div>',
    '<!-- /wp:button -->',
    '</div>',
    '<!-- /wp:buttons -->',
    '</div>',
    '<!-- /wp:column -->',
    '<!-- wp:column {"verticalAlignment":"center","width":"42%"} -->',
    '<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:42%">',
    heroImg
      ? '<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->\n<figure class="wp-block-image size-large"><img src="' +
        heroImg +
        '" alt="Aero Suite"/></figure>\n<!-- /wp:image -->'
      : '',
    '</div>',
    '<!-- /wp:column -->',
    '</div>',
    '<!-- /wp:columns -->',
    '</div>',
    '<!-- /wp:group -->',
    '</div></div>',
    '<!-- /wp:cover -->',
    '',
    '<!-- wp:group {"tagName":"section","anchor":"recursos","layout":{"type":"constrained","contentSize":"1200px"},"style":{"spacing":{"padding":{"top":"2rem","bottom":"1rem"}}}} -->',
    '<section id="recursos" class="wp-block-group" style="padding-top:2rem;padding-bottom:1rem">',
    '<!-- wp:heading {"textAlign":"center"} -->',
    '<h2 class="wp-block-heading has-text-align-center">Por que oficinas MRO escolhem a Aero Suite</h2>',
    '<!-- /wp:heading -->',
    '<!-- wp:paragraph {"align":"center"} -->',
    '<p class="has-text-align-center">Menos planilha, mais rastreio: do job card ao portal do cliente, tudo conectado.</p>',
    '<!-- /wp:paragraph -->',
    htmlBlock(showcase),
    '</section>',
    '<!-- /wp:group -->',
    '',
    htmlBlock(cta),
    '',
    '<!-- wp:group {"layout":{"type":"constrained","contentSize":"720px"},"style":{"spacing":{"padding":{"top":"2rem","bottom":"4rem"}}}} -->',
    '<div class="wp-block-group" style="padding-top:2rem;padding-bottom:4rem">',
    '<!-- wp:heading {"textAlign":"center","level":3} -->',
    '<h3 class="wp-block-heading has-text-align-center">Solicitar proposta comercial</h3>',
    '<!-- /wp:heading -->',
    '<!-- wp:paragraph {"align":"center"} -->',
    '<p class="has-text-align-center">Cada oficina tem escopo, usuários e módulos diferentes. Demonstramos a plataforma e montamos uma proposta alinhada à sua operação.</p>',
    '<!-- /wp:paragraph -->',
    '<!-- wp:wpforms/form {"formId":"12"} /-->',
    '</div>',
    '<!-- /wp:group -->',
  ].join('\n');

  const solucoesContent = [
    '<!-- wp:cover {"dimRatio":90,"overlayColor":"contrast","minHeight":40,"minHeightUnit":"vh","align":"full"} -->',
    '<div class="wp-block-cover alignfull" style="min-height:40vh"><span aria-hidden="true" class="wp-block-cover__background has-contrast-background-color has-background-dim-90 has-background-dim"></span><div class="wp-block-cover__inner-container">',
    '<!-- wp:heading {"textAlign":"center","level":1} -->',
    '<h1 class="wp-block-heading has-text-align-center">Soluções para operação MRO</h1>',
    '<!-- /wp:heading -->',
    '<!-- wp:paragraph {"align":"center"} -->',
    '<p class="has-text-align-center">Módulos integrados: hangar, estoque, comercial e portal — sem silos entre equipes.</p>',
    '<!-- /wp:paragraph -->',
    '</div></div>',
    '<!-- /wp:cover -->',
    htmlBlock(showcase.replace(/as-showcase-grid/g, 'as-showcase-grid as-showcase-grid--solo')),
    htmlBlock(cta),
    '<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->',
    '<div class="wp-block-buttons">',
    '<!-- wp:button -->',
    '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://aerosuite.com.br/contato/">Falar com especialista</a></div>',
    '<!-- /wp:button -->',
    '</div>',
    '<!-- /wp:buttons -->',
  ].join('\n');

  const sobreContent = [
    '<!-- wp:columns {"align":"wide","style":{"spacing":{"padding":{"top":"2rem","bottom":"2rem"}}}} -->',
    '<div class="wp-block-columns alignwide" style="padding-top:2rem;padding-bottom:2rem">',
    '<!-- wp:column {"width":"40%"} -->',
    '<div class="wp-block-column" style="flex-basis:40%">',
    markImg
      ? '<!-- wp:image --><figure class="wp-block-image"><img src="' +
        markImg +
        '" alt="Aero Suite"/></figure><!-- /wp:image -->'
      : '',
    '</div>',
    '<!-- /wp:column -->',
    '<!-- wp:column {"width":"60%"} -->',
    '<div class="wp-block-column" style="flex-basis:60%">',
    '<!-- wp:heading {"level":1} -->',
    '<h1 class="wp-block-heading">Sobre a Aero Suite</h1>',
    '<!-- /wp:heading -->',
    '<!-- wp:paragraph -->',
    '<p>Plataforma SaaS de gestão para manutenção aeronáutica (MRO e OM), desenvolvida no Brasil para oficinas que precisam de rastreabilidade, controle de estoque e relacionamento comercial profissional.</p>',
    '<!-- /wp:paragraph -->',
    '<!-- wp:paragraph -->',
    '<p>Segurança com perfis RBAC, dados em nuvem e evolução contínua — sem a complexidade de ERP genérico.</p>',
    '<!-- /wp:paragraph -->',
    '</div>',
    '<!-- /wp:column -->',
    '</div>',
    '<!-- /wp:columns -->',
    htmlBlock(
      '<div class="as-kpi-strip"><div class="as-kpi"><div class="as-kpi__val">MRO</div><div class="as-kpi__label">Foco aeronáutico</div></div><div class="as-kpi"><div class="as-kpi__val gold">RBAC</div><div class="as-kpi__label">Perfis e permissões</div></div><div class="as-kpi"><div class="as-kpi__val">SaaS</div><div class="as-kpi__label">Sempre atualizado</div></div><div class="as-kpi"><div class="as-kpi__val gold">BR</div><div class="as-kpi__label">Suporte local</div></div></div>'
    ),
    htmlBlock(cta),
  ].join('\n');

  const contatoContent = [
    '<!-- wp:heading {"level":1} -->',
    '<h1 class="wp-block-heading">Contato</h1>',
    '<!-- /wp:heading -->',
    '<!-- wp:paragraph -->',
    '<p>Agende uma demonstração ou solicite proposta comercial. Respondemos em até um dia útil.</p>',
    '<!-- /wp:paragraph -->',
    '<!-- wp:wpforms/form {"formId":"12"} /-->',
  ].join('\n');

  await wp.apiFetch({
    path: '/wp/v2/pages/21',
    method: 'POST',
    data: { content: homeContent, status: 'publish' },
  });
  await wp.apiFetch({
    path: '/wp/v2/pages/20',
    method: 'POST',
    data: { content: solucoesContent, title: 'Soluções', status: 'publish' },
  });
  await wp.apiFetch({
    path: '/wp/v2/pages/16',
    method: 'POST',
    data: { content: sobreContent, status: 'publish' },
  });
  await wp.apiFetch({
    path: '/wp/v2/pages/18',
    method: 'POST',
    data: { content: contatoContent, status: 'publish' },
  });

  return { ok: true, urls };
};
