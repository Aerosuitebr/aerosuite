(async () => {
  const css = window.__asFooterCss || '';
  const js = window.__asFooterJs || '';
  if (!css || !js) return { err: 'missing assets', css: css.length, js: js.length };
  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;
  footer = footer.replace(/<!-- wp:html -->[\s\S]*?aerosuite-premium[\s\S]*?<!-- \/wp:html -->/g, '');
  const block = '<!-- wp:html -->\n<style id="aerosuite-premium-css">' + css + '</style>\n<script id="aerosuite-phone-mask-js">' + js + '</script>\n<!-- /wp:html -->\n';
  if (!footer.includes('aerosuite-premium-css')) footer = block + footer;
  await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer', method: 'POST', data: { content: footer } });
  return { ok: true, footerLen: footer.length };
})()