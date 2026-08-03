/**
 * Deploy das lacunas restantes: blog, legal, comparativo, obrigado, home, footer completo.
 * Uso: node build-gaps-deploy.mjs && node run-gaps-deploy-inline.mjs
 * (executa build-seo-php.mjs e build-critical-css.mjs antes do bundle)
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { buildHomeContent, SEO as HOME_SEO } from './aerosuite-content.mjs';
import { buildBlogIndexContent, BLOG_INDEX_SEO, ALL_BLOG_POSTS } from './aerosuite-blog.mjs';
import {
  buildPrivacidadeContent,
  buildTermosContent,
  PRIVACIDADE_SEO,
  TERMOS_SEO,
} from './aerosuite-legal-pages.mjs';
import { buildObrigadoContent, OBRIGADO_SEO } from './aerosuite-obrigado-page.mjs';
import { buildComparativoContent, COMPARATIVO_SEO } from './aerosuite-comparativo-page.mjs';
import { buildSegurancaContent, SEGURANCA_SEO } from './aerosuite-seguranca-page.mjs';
import { buildSolucoesContent, SOLUCOES_SEO } from './aerosuite-solucoes-page.mjs';
import { buildConformidadeContent, CONFORMIDADE_SEO } from './aerosuite-conformidade-page.mjs';
import { buildContactContent, CONTACT_SEO } from './aerosuite-contact-page.mjs';
import { buildSobreContent, SOBRE_SEO } from './aerosuite-sobre-page.mjs';
import {
  buildPortfolioIndexContent,
  buildBellowsCaseContent,
  buildKingDoRioCaseContent,
  PORTFOLIO_INDEX_SEO,
  BELLOWS_CASE_SEO,
  KING_DO_RIO_CASE_SEO,
} from './aerosuite-portfolio.mjs';
import {
  FOOTER_CHROME_BLOCK,
  FAVICON_LINKS_BLOCK,
  HEADER_PRELOAD_BLOCK,
  CRITICAL_CSS_BLOCK,
  CRITICAL_CSS_STYLE_TAG,
} from './aerosuite-footer-template.mjs';
import { SUPPLEMENTAL_NAV_BLOCK } from './aerosuite-header-template.mjs';
import { getAllPillarPages } from './aerosuite-pillar-pages.mjs';
import { WP_PAGE_IDS } from './aerosuite-site-config.mjs';
import {
  buildSiteConfigSnippet,
  FOOTER_LEGACY_SCRIPT_IDS,
  loadFooterJsParts,
  readPremiumCss,
} from './aerosuite-footer-bundle.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));

for (const step of ['build-seo-php.mjs', 'verify-seo-php-sync.mjs', 'build-critical-css.mjs']) {
  const r = spawnSync(process.execPath, [step], { cwd: dir, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`FAIL ${step}`);
    process.exit(r.status || 1);
  }
}

const css = readPremiumCss();
const jsParts = loadFooterJsParts();
const siteConfigSnippet = buildSiteConfigSnippet();

const payload = {
  home: { id: WP_PAGE_IDS.home, ...HOME_SEO, content: buildHomeContent() },
  solucoes: { id: WP_PAGE_IDS.solucoes, ...SOLUCOES_SEO, content: buildSolucoesContent() },
  contato: { id: WP_PAGE_IDS.contato, ...CONTACT_SEO, content: buildContactContent() },
  sobre: { id: WP_PAGE_IDS.sobre, ...SOBRE_SEO, content: buildSobreContent() },
  blog: { slug: 'blog', ...BLOG_INDEX_SEO, content: buildBlogIndexContent() },
  posts: ALL_BLOG_POSTS,
  pages: [
    { slug: PRIVACIDADE_SEO.slug, ...PRIVACIDADE_SEO, content: buildPrivacidadeContent() },
    { slug: TERMOS_SEO.slug, ...TERMOS_SEO, content: buildTermosContent() },
    { slug: OBRIGADO_SEO.slug, ...OBRIGADO_SEO, content: buildObrigadoContent() },
    { slug: COMPARATIVO_SEO.slug, ...COMPARATIVO_SEO, content: buildComparativoContent() },
    { slug: CONFORMIDADE_SEO.slug, ...CONFORMIDADE_SEO, content: buildConformidadeContent() },
    { slug: SEGURANCA_SEO.slug, ...SEGURANCA_SEO, content: buildSegurancaContent() },
    { slug: PORTFOLIO_INDEX_SEO.slug, ...PORTFOLIO_INDEX_SEO, content: buildPortfolioIndexContent() },
    {
      ...BELLOWS_CASE_SEO,
      parentSlug: PORTFOLIO_INDEX_SEO.slug,
      content: buildBellowsCaseContent(),
    },
    {
      ...KING_DO_RIO_CASE_SEO,
      parentSlug: PORTFOLIO_INDEX_SEO.slug,
      content: buildKingDoRioCaseContent(),
    },
  ],
};

const footerChrome = FOOTER_CHROME_BLOCK;
const headerPreload = HEADER_PRELOAD_BLOCK;
const supplementalNav = SUPPLEMENTAL_NAV_BLOCK;
const pillars = getAllPillarPages();

fs.writeFileSync(path.join(dir, '.gaps-manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), ...payload }, null, 2));

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

  const homeContent=${JSON.stringify(payload.home.content)};
  const solucoesContent=${JSON.stringify(payload.solucoes.content)};
  const contatoContent=${JSON.stringify(payload.contato.content)};
  const sobreContent=${JSON.stringify(payload.sobre.content)};
  const blogContent=${JSON.stringify(payload.blog.content)};
  const posts=${JSON.stringify(payload.posts)};
  const extraPages=${JSON.stringify(payload.pages)};
  const pillars=${JSON.stringify(pillars)};
  const css=${JSON.stringify(css)};
  const siteCfg=${JSON.stringify(siteConfigSnippet)};
  const jsParts=${JSON.stringify(jsParts)};
  const legacyScriptIds=${JSON.stringify(FOOTER_LEGACY_SCRIPT_IDS)};

  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  legacyScriptIds.forEach(function(legacyId){
    const legacyRe=new RegExp('<script id="'+legacyId+'">[\\\\s\\\\S]*?<\\\\/script>\\\\n?','g');
    footer=footer.replace(legacyRe,'');
  });
  footer=footer.replace(/<!-- wp:html -->[\\s\\S]*?<script id="aerosuite-site-config">[\\s\\S]*?<\\/script>[\\s\\S]*?<!-- \\/wp:html -->/g,'');
  const cfgBlock='<!-- wp:html -->\\n<script id="aerosuite-site-config">'+siteCfg+'</script>\\n<!-- /wp:html -->\\n';
  footer=cfgBlock+footer;

  const cssRe=/<style id="aerosuite-premium-css">[\\s\\S]*?<\\/style>/;
  if(cssRe.test(footer)) footer=footer.replace(cssRe,'<style id="aerosuite-premium-css">'+css+'</style>');
  else footer='<!-- wp:html -->\\n<style id="aerosuite-premium-css">'+css+'</style>\\n<!-- /wp:html -->\\n'+footer;

  for(const j of jsParts){
    const tag='<script id="'+j.id+'">';
    const full=tag+j.body+'</script>';
    const re=new RegExp('<script id="'+j.id+'">[\\\\s\\\\S]*?<\\\\/script>\\\\n?');
    if(re.test(footer)) footer=footer.replace(re,full+'\\n');
    else footer=footer.replace(/(<script id="aerosuite-site-config">[\\s\\S]*?<\\/script>)/, '$1\\n'+full);
  }

  const footerChrome=${JSON.stringify(footerChrome)};
  footer=footer.replace(/<p class="has-text-align-right[^"]*"[^>]*>© Aero Suite[\\s\\S]*?<\\/p>\\s*/gi,'');
  const footerChromeRe=/<footer class="as-site-chrome"[\\s\\S]*?<\\/footer>\\s*/;
  if(footerChromeRe.test(footer)) footer=footer.replace(footerChromeRe, footerChrome.trim()+'\\n');
  else footer=footer+'\\n'+footerChrome;

  function stripExtendableThemeNav(headerRaw){
    if(!headerRaw) return headerRaw;
    let h=headerRaw;
    h=h.replace(/<!-- wp:site-title[^>]*\\/-->\\n?/g,'');
    h=h.replace(/<!-- wp:site-title[\\s\\S]*?<!-- \\/wp:site-title -->\\n?/g,'');
    h=h.replace(/<!-- wp:site-logo[^>]*\\/-->\\n?/g,'');
    h=h.replace(/<!-- wp:navigation[\\s\\S]*?<!-- \\/wp:navigation -->\\n?/g,'');
    h=h.replace(/<!-- wp:page-list[\\s\\S]*?<!-- \\/wp:page-list -->\\n?/g,'');
    h=h.replace(/<nav[^>]*class="[^"]*wp-block-navigation[^"]*"[^>]*>[\\s\\S]*?<\\/nav>\\n?/gi,'');
    return h;
  }

  footer=stripExtendableThemeNav(footer);

  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});

  let headerPatched=false;
  try{
    const headerPart=await wp.apiFetch({path:'/wp/v2/template-parts/extendable//header?context=edit'});
    let header=stripExtendableThemeNav(headerPart.content.raw);
    const faviconBlock=${JSON.stringify(FAVICON_LINKS_BLOCK)};
    const headerPreloadBlock=${JSON.stringify(HEADER_PRELOAD_BLOCK)};
    const criticalCssBlock=${JSON.stringify(CRITICAL_CSS_BLOCK)};
    const criticalCssStyleTag=${JSON.stringify(CRITICAL_CSS_STYLE_TAG)};
    const supplementalNavBlock=${JSON.stringify(supplementalNav)};
    let headerChanged=header!==headerPart.content.raw;
    if(header.includes('as-seo-meta-home')){
      header=header.replace(/<!-- wp:html -->[\\s\\S]*?as-seo-meta-home[\\s\\S]*?<!-- \\/wp:html -->\\n?/g,'');
      headerChanged=true;
    }
    if(!header.includes('as-favicon-aerosuite')){ header=faviconBlock+'\\n'+header; headerChanged=true; }
    if(!header.includes('as-preload-hero-logo')){ header=headerPreloadBlock+'\\n'+header; headerChanged=true; }
    else if(!header.includes('preconnect')){
      header=header.replace(/<!-- wp:html -->[\\s\\S]*?as-preload-hero-logo[\\s\\S]*?<!-- \\/wp:html -->/, headerPreloadBlock);
      headerChanged=true;
    }
    if(header.includes('as-preload-hero-dashboard')){
      header=header.replace(/<link[^>]*id="as-preload-hero-dashboard"[^>]*>\\s*/g,'');
      headerChanged=true;
    }
    if(!header.includes('aerosuite-critical-css')){
      header=criticalCssBlock+'\\n'+header;
      headerChanged=true;
    } else {
      const criticalWrappedRe=/<!-- wp:html -->\\s*<style id="aerosuite-critical-css">[\\s\\S]*?<\\/style>\\s*<!-- \\/wp:html -->/;
      const criticalBareRe=/<style id="aerosuite-critical-css">[\\s\\S]*?<\\/style>/;
      if(criticalWrappedRe.test(header)){
        header=header.replace(criticalWrappedRe, criticalCssBlock);
        headerChanged=true;
      } else if(criticalBareRe.test(header)){
        header=header.replace(criticalBareRe, criticalCssStyleTag);
        headerChanged=true;
      }
    }
    if(header.includes('vs Planilhas')){ header=header.replace(/>vs Planilhas<\\/a>/g,'>Comparativo</a>'); headerChanged=true; }
    const supplementalNavRe=/<!-- wp:html -->\\s*<nav class="as-supplemental-nav[\\s\\S]*?<!-- \\/wp:html -->/;
    if(supplementalNavRe.test(header)){
      header=header.replace(supplementalNavRe, supplementalNavBlock.trim());
      headerChanged=true;
    } else if(!header.includes('as-supplemental-nav')){
      header=header+'\\n'+supplementalNavBlock;
      headerChanged=true;
    }
    if(headerChanged){
      await wp.apiFetch({path:'/wp/v2/template-parts/extendable//header?id=extendable//header',method:'POST',data:{content:header}});
      headerPatched=true;
    } else headerPatched='already';
  }catch(headerErr){
    headerPatched='skip:'+String(headerErr.message||headerErr);
  }

  await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.home}',method:'POST',data:{content:homeContent,title:${JSON.stringify(payload.home.title)},excerpt:${JSON.stringify(payload.home.excerpt)},status:'publish'}});
  await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.solucoes}',method:'POST',data:{content:solucoesContent,title:${JSON.stringify(payload.solucoes.title)},excerpt:${JSON.stringify(payload.solucoes.excerpt)},status:'publish'}});
  await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.contato}',method:'POST',data:{content:contatoContent,title:${JSON.stringify(payload.contato.title)},excerpt:${JSON.stringify(payload.contato.excerpt)},status:'publish'}});
  await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.sobre}',method:'POST',data:{content:sobreContent,title:${JSON.stringify(payload.sobre.title)},excerpt:${JSON.stringify(payload.sobre.excerpt)},status:'publish'}});

  const cachePurge='deploy-only';

  const blogPage=await upsertPage('blog',{content:blogContent,title:${JSON.stringify(payload.blog.title)},excerpt:${JSON.stringify(payload.blog.excerpt)}});

  const postResults=[];
  for(const post of posts){
    const r=await upsertPost(post.slug,{content:post.content,title:post.title,excerpt:post.excerpt});
    postResults.push({slug:post.slug,id:r.id});
  }

  const pageResults=[];
  const parentIds={};
  for(const p of extraPages){
    if(p.parentSlug){
      if(!parentIds[p.parentSlug]){
        const par=await wp.apiFetch({path:'/wp/v2/pages?slug='+encodeURIComponent(p.parentSlug)+'&per_page=1'});
        if(par&&par.length) parentIds[p.parentSlug]=par[0].id;
      }
      const parentId=parentIds[p.parentSlug]||0;
      const found=await wp.apiFetch({path:'/wp/v2/pages?slug='+encodeURIComponent(p.slug)+'&parent='+parentId+'&per_page=1'});
      const data={content:p.content,title:p.title,excerpt:p.excerpt,status:'publish',parent:parentId};
      const r=found&&found.length
        ? await wp.apiFetch({path:'/wp/v2/pages/'+found[0].id,method:'POST',data})
        : await wp.apiFetch({path:'/wp/v2/pages',method:'POST',data:{...data,slug:p.slug}});
      pageResults.push({slug:p.slug,id:r.id,parent:parentId});
    } else {
      const r=await upsertPage(p.slug,{content:p.content,title:p.title,excerpt:p.excerpt});
      pageResults.push({slug:p.slug,id:r.id});
      parentIds[p.slug]=r.id;
    }
  }

  const pillarResults=[];
  for(const p of pillars){
    const r=await upsertPage(p.slug,{content:p.content,title:p.seo.title,excerpt:p.seo.description});
    pillarResults.push({slug:p.slug,id:r.id});
  }

  return{
    ok:true,
    homeLen:homeContent.length,
    blogId:blogPage.id,
    postCount:postResults.length,
    postResults,
    pillarResults,
    pageResults,
    hasConsent:footer.includes('as-consent'),
    hasSticky:footer.includes('as-sticky-cta'),
    hasFooterChrome:footer.includes('as-site-chrome'),
    headerPatched:headerPatched,
    cachePurge:cachePurge,
    noAmpAmp:!footer.includes('&#038;&#038;')
  };
})()`;

fs.writeFileSync(path.join(dir, '.deploy-gaps-once.js'), deployScript);
console.log('gaps deploy', deployScript.length, 'bytes', 'posts', payload.posts.length, 'pages', payload.pages.length);
