(async()=>{
  const base='http://127.0.0.1:8765';
  const seo={"title":"Aero Suite — Gestão MRO | OS, Estoque FIFO e Portal do Cliente","excerpt":"Plataforma SaaS para oficinas MRO no Brasil: ordens de serviço, estoque FIFO, propostas comerciais e portal do cliente integrados. Agende uma demonstração."};
  async function load(p){const r=await fetch(base+p);if(!r.ok)throw new Error('fetch failed '+p+' '+r.status);return r.text();}
  const [homeContent,css,heroJs,phoneJs,zoomJs]=await Promise.all([
    load('/home-content.txt'),
    load('/aerosuite-premium.css'),
    load('/aerosuite-hero.js'),
    load('/aerosuite-phone-mask.js'),
    load('/aerosuite-showcase-zoom.js'),
  ]);
  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  footer=footer.replace(/<style id="aerosuite-hero-logo-pos">[\s\S]*?<\/style>\n?/g,'');
  const block='<!-- wp:html -->\n<style id="aerosuite-premium-css">'+css+'</style>\n<script id="aerosuite-phone-mask-js">'+phoneJs+'</script>\n<script id="aerosuite-showcase-zoom-js">'+zoomJs+'</script>\n<script id="aerosuite-hero-js">'+heroJs+'</script>\n<!-- /wp:html -->\n';
  if(footer.includes('aerosuite-premium-css')){
    footer=footer.replace(/<!-- wp:html -->[\s\S]*?aerosuite-premium-css[\s\S]*?<!-- \/wp:html -->/,block.trim());
  } else { footer=block+footer; }
  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
  await wp.apiFetch({path:'/wp/v2/pages/21',method:'POST',data:{content:homeContent,title:seo.title,excerpt:seo.excerpt,status:'publish'}});
  return {ok:true,homeLen:homeContent.length,footerLen:footer.length,title:seo.title,hasHeroV2:homeContent.includes('as-hero-v2')};
})()