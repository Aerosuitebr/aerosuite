import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHomeContent, SEO } from './aerosuite-content.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const phoneJs = fs.readFileSync(path.join(dir, 'aerosuite-phone-mask.js'), 'utf8');
const zoomJs = fs.readFileSync(path.join(dir, 'aerosuite-showcase-zoom.js'), 'utf8');
const heroJs = fs.readFileSync(path.join(dir, 'aerosuite-hero.js'), 'utf8');
const homeContent = buildHomeContent();

const deploy = `(async () => {
  const css = ${JSON.stringify(css)};
  const phoneJs = ${JSON.stringify(phoneJs)};
  const zoomJs = ${JSON.stringify(zoomJs)};
  const heroJs = ${JSON.stringify(heroJs)};
  const homeContent = ${JSON.stringify(homeContent)};
  const seo = ${JSON.stringify(SEO)};

  let footer = (await wp.apiFetch({ path: '/wp/v2/template-parts/extendable//footer?context=edit' })).content.raw;

  footer = footer.replace(/<!-- wp:html -->[\\s\\S]*?<!-- \\/wp:html -->\\n(?=<!-- wp:group)/, '');
  footer = footer.replace(/<style id="aerosuite-premium-css">[\\s\\S]*?<\\/style>\\n?/g, '');
  footer = footer.replace(/<style id="aerosuite-hero-logo-pos">[\\s\\S]*?<\\/style>\\n?/g, '');
  footer = footer.replace(/<script id="aerosuite-phone-mask-js">[\\s\\S]*?<\\/script>\\n?/g, '');
  footer = footer.replace(/<script id="aerosuite-showcase-zoom-js">[\\s\\S]*?<\\/script>\\n?/g, '');
  footer = footer.replace(/<script id="aerosuite-hero-js">[\\s\\S]*?<\\/script>\\n?/g, '');

  const block =
    '<!-- wp:html -->\\n' +
    '<style id="aerosuite-premium-css">' + css + '</style>\\n' +
    '<script id="aerosuite-phone-mask-js">' + phoneJs + '</script>\\n' +
    '<script id="aerosuite-showcase-zoom-js">' + zoomJs + '</script>\\n' +
    '<script id="aerosuite-hero-js">' + heroJs + '</script>\\n' +
    '<!-- /wp:html -->\\n';

  if (!footer.includes('aerosuite-premium-css')) {
    footer = block + footer;
  } else {
    footer = footer.replace(
      /<!-- wp:html -->[\\s\\S]*?aerosuite-premium-css[\\s\\S]*?<!-- \\/wp:html -->/,
      block.trim()
    );
  }

  await wp.apiFetch({
    path: '/wp/v2/template-parts/extendable//footer?id=extendable//footer',
    method: 'POST',
    data: { content: footer },
  });

  await wp.apiFetch({
    path: '/wp/v2/pages/21',
    method: 'POST',
    data: {
      content: homeContent,
      title: seo.title,
      excerpt: seo.excerpt,
      status: 'publish',
    },
  });

  return { ok: true, footerLen: footer.length, homeLen: homeContent.length, title: seo.title };
})()`;

fs.writeFileSync(path.join(dir, 'deploy-irresistible.js'), deploy);
console.log('deploy size:', deploy.length);
console.log('home size:', homeContent.length);
