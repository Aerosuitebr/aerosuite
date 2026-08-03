(async () => {
  const fixed =
    '<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">Respondemos em at&eacute; um dia &uacute;til. Demonstramos a plataforma e montamos proposta alinhada &agrave; sua opera&ccedil;&atilde;o.</p><!-- /wp:paragraph -->';
  const bad = /<!-- wp:paragraph \{"align":"center"\} --><p class="has-text-align-center">[\s\S]*?Respondemos[\s\S]*?<\/p><!-- \/wp:paragraph -->/;
  const page = await wp.apiFetch({ path: '/wp/v2/pages/21?context=edit' });
  let content = page.content.raw;
  if (!bad.test(content)) {
    return { ok: false, reason: 'paragraph block not found' };
  }
  content = content.replace(bad, fixed);
  await wp.apiFetch({
    path: '/wp/v2/pages/21',
    method: 'POST',
    data: { content, status: 'publish' },
  });
  const check = content.includes('plataforma e montamos') && content.includes('&atilde;');
  return { ok: true, check, snippet: content.match(/Respondemos[^<]+/)?.[0] };
})();
