(async()=>{
  const css=atob(window.__cssb64||window.__cssfixb64||'');
  if(!css) throw new Error('css buffer missing');
  const j={};
  const pick=(id)=>{const m=(window.__footerRaw||'').match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'));return m?m[1]:'';};
  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  window.__footerRaw=footer;
  j.hero=pick('aerosuite-hero-js');
  j.phone=pick('aerosuite-phone-mask-js');
  j.zoom=pick('aerosuite-showcase-zoom-js');
  footer=footer.replace(/<style id="aerosuite-hero-logo-pos">[\s\S]*?<\/style>\n?/g,'');
  const block='<!-- wp:html -->\n<style id="aerosuite-premium-css">'+css+'</style>\n<script id="aerosuite-phone-mask-js">'+j.phone+'</script>\n<script id="aerosuite-showcase-zoom-js">'+j.zoom+'</script>\n<script id="aerosuite-hero-js">'+j.hero+'</script>\n<!-- /wp:html -->\n';
  if(footer.includes('aerosuite-premium-css')){
    footer=footer.replace(/<!-- wp:html -->[\s\S]*?aerosuite-premium-css[\s\S]*?<!-- \/wp:html -->/,block.trim());
  } else { footer=block+footer; }
  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
  return{ok:true,cssLen:css.length,hasHeroV2:css.includes('as-hero-v2__grid'),footerLen:footer.length};
})()
