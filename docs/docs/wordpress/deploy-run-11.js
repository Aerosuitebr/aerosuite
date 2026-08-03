(async()=>{
    const seo={"title":"Aero Suite — Gestão MRO | OS, Estoque FIFO e Portal do Cliente","excerpt":"Plataforma SaaS para oficinas MRO no Brasil: ordens de serviço, estoque FIFO, propostas comerciais e portal do cliente integrados. Agende uma demonstração."};
    const css=atob(window.__cssb64||'');
    const homeContent=window.__homebuf||'';
    const j=window.__jsBundle||{};
    if(!css||!homeContent||!j.hero) throw new Error('missing buffers');
    let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
    footer=footer.replace(/<style id="aerosuite-hero-logo-pos">[\s\S]*?<\/style>\n?/g,'');
    const block='<!-- wp:html -->\n<style id="aerosuite-premium-css">'+css+'</style>\n<script id="aerosuite-phone-mask-js">'+j.phone+'</script>\n<script id="aerosuite-showcase-zoom-js">'+j.zoom+'</script>\n<script id="aerosuite-hero-js">'+j.hero+'</script>\n<!-- /wp:html -->\n';
    if(footer.includes('aerosuite-premium-css')){
      footer=footer.replace(/<!-- wp:html -->[\s\S]*?aerosuite-premium-css[\s\S]*?<!-- \/wp:html -->/,block.trim());
    } else { footer=block+footer; }
    await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
    await wp.apiFetch({path:'/wp/v2/pages/21',method:'POST',data:{content:homeContent,title:seo.title,excerpt:seo.excerpt,status:'publish'}});
    return {ok:true,homeLen:homeContent.length,footerLen:footer.length,title:seo.title,hasHeroV2:homeContent.includes('as-hero-v2')};
  })()