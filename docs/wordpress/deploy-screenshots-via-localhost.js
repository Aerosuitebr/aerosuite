(async () => {
  const base = 'http://127.0.0.1:8877/';
  const css = `__CSS__`;
  const js = `__JS__`;
  const showcaseTpl = `__SHOWCASE__`;

  const items = [
    { file: 'os-list-web.webp', urlKey: 'URL_OS', title: 'Aero Suite — Ordens de serviço' },
    { file: 'estoque-itens-web.webp', urlKey: 'URL_ESTOQUE', title: 'Aero Suite — Estoque' },
    { file: 'propostas-comerciais-web.webp', urlKey: 'URL_COMERCIAL', title: 'Aero Suite — Propostas comerciais' },
    { file: 'dashboard-web.webp', urlKey: 'URL_DASHBOARD', title: 'Aero Suite — Painel operacional' },
  ];

  async function uploadFromLocal(item) {
    const r = await fetch(base + item.file);
    if (!r.ok) throw new Error('fetch ' + item.file + ' ' + r.status);
    const blob = await r.blob();
    const fd = new FormData();
    fd.append('file', blob, item.file);
    fd.append('title', item.title);
    fd.append('alt_text', item.title);
    const m = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
    return m.source_url;
  }

  const urls = {};
  for (const item of items) {
    urls[item.urlKey] = await uploadFromLocal(item);
  }

  let showcase = showcaseTpl
    .replace('{{URL_OS}}', urls.URL_OS)
    .replace('{{URL_ESTOQUE}}', urls.URL_ESTOQUE)
    .replace('{{URL_COMERCIAL}}', urls.URL_COMERCIAL)
    .replace('{{URL_DASHBOARD}}', urls.URL_DASHBOARD);

  const pageResults = [];
  for (const id of [21, 20]) {
    const page = await wp.apiFetch({ path: '/wp/v2/pages/' + id + '?context=edit' });
    let content = page.content.raw || '';
    if (!content.includes('as-showcase')) {
      pageResults.push({ id, skip: true });
      continue;
    }
    content = content.replace(/<section class="as-showcase"[\s\S]*?<\/section>/, showcase);
    await wp.apiFetch({ path: '/wp/v2/pages/' + id, method: 'POST', data: { content } });
    pageResults.push({ id, ok: true });
  }

  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  footer = footer.replace(/<link[^>]*aerosuite-premium[^>]*>\s*/gi, '');
  footer = footer.replace(/<!-- wp:html -->[\s\S]*?aerosuite-premium[\s\S]*?<!-- \/wp:html -->/g, '');
  const block =
    '<!-- wp:html -->\n<style id="aerosuite-premium-css">' +
    css +
    '</style>\n<script id="aerosuite-phone-mask-js">' +
    js +
    '</script>\n<!-- /wp:html -->\n';
  footer = block + footer;
  await wp.apiFetch({
    path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer',
    method: 'POST',
    data: { content: footer },
  });

  const media = await wp.apiFetch({ path: '/wp/v2/media?search=aerosuite-premium&per_page=50' });
  const deleted = [];
  for (const m of media) {
    if (/\.txt$/i.test(m.source_url || '') || m.mime_type === 'text/plain') {
      await wp.apiFetch({ path: '/wp/v2/media/' + m.id + '?force=true', method: 'DELETE' });
      deleted.push({ id: m.id, url: m.source_url });
    }
  }

  return { urls, pageResults, deleted };
})();
