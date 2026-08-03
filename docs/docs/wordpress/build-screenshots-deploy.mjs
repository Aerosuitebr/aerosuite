import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(dir, 'screenshots', 'web');
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'aerosuite-phone-mask.js'), 'utf8');
let showcaseTpl = fs.readFileSync(
  path.join(dir, 'snippets', 'showcase-modules-screenshots.html'),
  'utf8'
);

const files = [
  { key: 'os', file: 'os-list-web.webp', urlKey: 'URL_OS', title: 'Aero Suite — Ordens de serviço' },
  { key: 'estoque', file: 'estoque-itens-web.webp', urlKey: 'URL_ESTOQUE', title: 'Aero Suite — Estoque' },
  {
    key: 'comercial',
    file: 'propostas-comerciais-web.webp',
    urlKey: 'URL_COMERCIAL',
    title: 'Aero Suite — Propostas comerciais',
  },
  {
    key: 'dashboard',
    file: 'dashboard-web.webp',
    urlKey: 'URL_DASHBOARD',
    title: 'Aero Suite — Painel operacional',
  },
];

const uploads = files.map((f) => ({
  ...f,
  b64: fs.readFileSync(path.join(webDir, f.file)).toString('base64'),
}));

const ex = `(async () => {
  const css = ${JSON.stringify(css)};
  const js = ${JSON.stringify(js)};
  const uploads = ${JSON.stringify(uploads)};
  const showcaseTpl = ${JSON.stringify(showcaseTpl)};

  async function uploadWebp(item) {
    const bin = atob(item.b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const fd = new FormData();
    fd.append('file', new Blob([arr], { type: 'image/webp' }), item.file);
    fd.append('title', item.title);
    fd.append('alt_text', item.title);
    const m = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
    return m.source_url;
  }

  const urls = {};
  for (const u of uploads) {
    urls[u.urlKey] = await uploadWebp(u);
  }

  let showcase = showcaseTpl
    .replace('{{URL_OS}}', urls.URL_OS)
    .replace('{{URL_ESTOQUE}}', urls.URL_ESTOQUE)
    .replace('{{URL_COMERCIAL}}', urls.URL_COMERCIAL)
    .replace('{{URL_DASHBOARD}}', urls.URL_DASHBOARD);

  const pageIds = [21, 20];
  const pageResults = [];
  for (const id of pageIds) {
    const page = await wp.apiFetch({ path: '/wp/v2/pages/' + id + '?context=edit' });
    let content = page.content.raw || '';
    if (!content.includes('as-showcase')) {
      pageResults.push({ id, skip: true });
      continue;
    }
    content = content.replace(/<section class="as-showcase"[\\s\\S]*?<\\/section>/, showcase);
    await wp.apiFetch({
      path: '/wp/v2/pages/' + id,
      method: 'POST',
      data: { content },
    });
    pageResults.push({ id, ok: true, len: content.length });
  }

  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  footer = footer.replace(/<link[^>]*aerosuite-premium[^>]*>\\s*/gi, '');
  footer = footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium[\\s\\S]*?<!-- \\/wp:html -->/g, '');
  const block =
    '<!-- wp:html -->\\n<style id="aerosuite-premium-css">' +
    css +
    '</style>\\n<script id="aerosuite-phone-mask-js">' +
    js +
    '</script>\\n<!-- /wp:html -->\\n';
  footer = block + footer;
  await wp.apiFetch({
    path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer',
    method: 'POST',
    data: { content: footer },
  });

  const media = await wp.apiFetch({ path: '/wp/v2/media?search=aerosuite-premium&per_page=50' });
  const deleted = [];
  for (const m of media) {
    if (/\\.txt$/i.test(m.source_url || '') || m.mime_type === 'text/plain') {
      await wp.apiFetch({ path: '/wp/v2/media/' + m.id + '?force=true', method: 'DELETE' });
      deleted.push({ id: m.id, url: m.source_url });
    }
  }

  return { urls, pageResults, deleted, footerHasLink: footer.includes('<link'), footerHasStyle: footer.includes('aerosuite-premium-css') };
})()`;

const outPath = path.join(dir, 'deploy-screenshots-eval.js');
fs.writeFileSync(outPath, ex);
console.log('written', outPath, 'bytes', ex.length);
