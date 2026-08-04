/**
 * Gera manifesto e script único de deploy (marketing + SEO) para wp-admin.
 * Uso: node build-marketing-deploy.mjs
 * Depois: servir docs/wordpress e eval do .deploy-marketing-once.js no console wp-admin.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHomeContent, SEO as HOME_SEO } from './aerosuite-content.mjs';
import { buildContactContent, CONTACT_SEO } from './aerosuite-contact-page.mjs';
import { buildSolucoesContent, SOLUCOES_SEO } from './aerosuite-solucoes-page.mjs';
import { buildSobreContent, SOBRE_SEO } from './aerosuite-sobre-page.mjs';
import { getAllPillarPages } from './aerosuite-pillar-pages.mjs';
import { buildBlogIndexContent, BLOG_INDEX_SEO, ALL_BLOG_POSTS } from './aerosuite-blog.mjs';
import { GA4_MEASUREMENT_ID, CALENDLY_EMBED_URL, WP_PAGE_IDS } from './aerosuite-site-config.mjs';
import { buildSiteConfigSnippet, loadFooterJsParts, readPremiumCss } from './aerosuite-footer-bundle.mjs';
import {
  buildPrivacidadeContent,
  buildTermosContent,
  PRIVACIDADE_SEO,
  TERMOS_SEO,
} from './aerosuite-legal-pages.mjs';
import { buildObrigadoContent, OBRIGADO_SEO } from './aerosuite-obrigado-page.mjs';
import { buildComparativoContent, COMPARATIVO_SEO } from './aerosuite-comparativo-page.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));

// Páginas criadas via REST usam o título do WordPress, que o tema completa
// com o nome do site. Evita "| Aero Suite | Aero Suite" no <title> público.
function wordpressTitle(title) {
  return title.replace(/\s*\|\s*Aero Suite\s*$/i, '').trim();
}

const css = readPremiumCss();
const jsParts = loadFooterJsParts();
const siteConfigSnippet = buildSiteConfigSnippet();

const manifest = {
  generatedAt: new Date().toISOString(),
  pages: {
    home: { id: WP_PAGE_IDS.home, ...HOME_SEO, content: buildHomeContent() },
    solucoes: { id: WP_PAGE_IDS.solucoes, ...SOLUCOES_SEO, content: buildSolucoesContent() },
    sobre: { id: WP_PAGE_IDS.sobre, ...SOBRE_SEO, content: buildSobreContent() },
    contato: { id: WP_PAGE_IDS.contato, ...CONTACT_SEO, content: buildContactContent() },
    blog: { slug: 'blog', ...BLOG_INDEX_SEO, content: buildBlogIndexContent() },
    pillars: getAllPillarPages(),
  },
  posts: ALL_BLOG_POSTS,
  extraPages: [
    { slug: PRIVACIDADE_SEO.slug, ...PRIVACIDADE_SEO, content: buildPrivacidadeContent() },
    { slug: TERMOS_SEO.slug, ...TERMOS_SEO, content: buildTermosContent() },
    { slug: OBRIGADO_SEO.slug, ...OBRIGADO_SEO, content: buildObrigadoContent() },
    { slug: COMPARATIVO_SEO.slug, ...COMPARATIVO_SEO, content: buildComparativoContent() },
  ],
  ga4: GA4_MEASUREMENT_ID,
  calendly: CALENDLY_EMBED_URL,
};

fs.writeFileSync(path.join(dir, '.marketing-manifest.json'), JSON.stringify(manifest, null, 2));

const pillarsPayload = JSON.stringify(manifest.pages.pillars);
const postsPayload = JSON.stringify(
  manifest.posts.map((post) => ({ ...post, title: wordpressTitle(post.title) }))
);
const extraPagesPayload = JSON.stringify(
  manifest.extraPages.map((page) => ({ ...page, title: wordpressTitle(page.title) }))
);

const deployScript = `(async()=>{
  async function upsertPage(slug,data){
    const found=await wp.apiFetch({path:'/wp/v2/pages?slug='+encodeURIComponent(slug)+'&per_page=1'});
    if(found&&found.length)return wp.apiFetch({path:'/wp/v2/pages/'+found[0].id,method:'POST',data:{...data,status:'publish'}});
    return wp.apiFetch({path:'/wp/v2/pages',method:'POST',data:{...data,slug,status:'publish'}});
  }
  async function upsertPost(slug,data){
    const found=await wp.apiFetch({path:'/wp/v2/posts?slug='+encodeURIComponent(slug)+'&per_page=1'});
    if(found&&found.length)return wp.apiFetch({path:'/wp/v2/posts/'+found[0].id,method:'POST',data:{...data,status:'publish'}});
    return wp.apiFetch({path:'/wp/v2/posts',method:'POST',data:{...data,slug,status:'publish'}});
  }
  const homeContent=${JSON.stringify(manifest.pages.home.content)};
  const solucoesContent=${JSON.stringify(manifest.pages.solucoes.content)};
  const sobreContent=${JSON.stringify(manifest.pages.sobre.content)};
  const contatoContent=${JSON.stringify(manifest.pages.contato.content)};
  const blogContent=${JSON.stringify(manifest.pages.blog.content)};
  const pillars=${pillarsPayload};
  const posts=${postsPayload};
  const extraPages=${extraPagesPayload};
  const css=${JSON.stringify(css)};
  const siteCfg=${JSON.stringify(siteConfigSnippet)};
  const jsParts=${JSON.stringify(jsParts)};

  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  footer=footer.replace(/<!-- wp:html -->[\\s\\S]*?<script id="aerosuite-site-config">[\\s\\S]*?<\\/script>[\\s\\S]*?<!-- \\/wp:html -->/g,'');
  const cfgBlock='<!-- wp:html -->\\n<script id="aerosuite-site-config">'+siteCfg+'</script>\\n<!-- /wp:html -->\\n';
  if(!footer.includes('aerosuite-site-config')) footer=cfgBlock+footer;

  const cssRe=/<style id="aerosuite-premium-css">[\\s\\S]*?<\\/style>/;
  if(cssRe.test(footer)) footer=footer.replace(cssRe,'<style id="aerosuite-premium-css">'+css+'</style>');
  else footer='<!-- wp:html -->\\n<style id="aerosuite-premium-css">'+css+'</style>\\n<!-- /wp:html -->\\n'+footer;

  for(const j of jsParts){
    const tag='<script id="'+j.id+'">';
    const full=tag+j.body+'</script>';
    const re=new RegExp('<script id="'+j.id+'">[\\\\s\\\\S]*?<\\\\/script>\\\\n?');
    if(re.test(footer)) footer=footer.replace(re,full+'\\n');
    else footer=footer.replace('</style>','</style>\\n'+full+'\\n');
  }

  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});

  await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.home}',method:'POST',data:{content:homeContent,title:${JSON.stringify(manifest.pages.home.title)},excerpt:${JSON.stringify(manifest.pages.home.excerpt)},status:'publish'}});
  await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.solucoes}',method:'POST',data:{content:solucoesContent,title:${JSON.stringify(manifest.pages.solucoes.title)},excerpt:${JSON.stringify(manifest.pages.solucoes.excerpt)},status:'publish'}});
  await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.sobre}',method:'POST',data:{content:sobreContent,title:${JSON.stringify(manifest.pages.sobre.title)},excerpt:${JSON.stringify(manifest.pages.sobre.excerpt)},status:'publish'}});
  await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.contato}',method:'POST',data:{content:contatoContent,title:${JSON.stringify(manifest.pages.contato.title)},excerpt:${JSON.stringify(manifest.pages.contato.excerpt)},status:'publish'}});

  const blogPage=await upsertPage('blog',{content:blogContent,title:${JSON.stringify(wordpressTitle(manifest.pages.blog.title))},excerpt:${JSON.stringify(manifest.pages.blog.excerpt)}});
  const pillarResults=[];
  for(const p of pillars){
    const r=await upsertPage(p.slug,{content:p.content,title:p.title,excerpt:p.seo.description});
    pillarResults.push({slug:p.slug,id:r.id});
  }
  const postResults=[];
  for(const post of posts){
    const r=await upsertPost(post.slug,{content:post.content,title:post.title,excerpt:post.excerpt});
    postResults.push({slug:post.slug,id:r.id});
  }
  const pageResults=[];
  for(const p of extraPages){
    const r=await upsertPage(p.slug,{content:p.content,title:p.title,excerpt:p.excerpt});
    pageResults.push({slug:p.slug,id:r.id});
  }

  return{ok:true,homeLen:homeContent.length,solucoesLen:solucoesContent.length,sobreLen:sobreContent.length,hasSchema:homeContent.includes('application/ld+json'),hasCalendly:contatoContent.includes('calendly'),pillarResults,postResults,pageResults,blogId:blogPage.id};
})()`;

fs.writeFileSync(path.join(dir, '.deploy-marketing-once.js'), deployScript);
console.log('manifest + deploy script', deployScript.length, 'bytes');
console.log('pillars', manifest.pages.pillars.length, 'posts', manifest.posts.length);
