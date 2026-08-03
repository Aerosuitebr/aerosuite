(async()=>{
    const css=atob(window.__cssb64);
    let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
    footer=footer.replace(/<style id="aerosuite-hero-logo-pos">[\s\S]*?<\/style>\n?/g,'');
    const re=/<style id="aerosuite-premium-css">[\s\S]*?<\/style>/;
    if(!re.test(footer)) throw new Error('css missing');
    footer=footer.replace(re,'<style id="aerosuite-premium-css">'+css+'</style>');
    await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
    return{ok:true,cssLen:css.length};
  })()