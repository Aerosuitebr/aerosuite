/**
 * Deploy: CSS cards + screenshot estoque com dados + home.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHomeContent, SEO } from './aerosuite-content.mjs';
import { WP_PAGE_IDS } from './aerosuite-site-config.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const homeContent = buildHomeContent();
const webpPath = path.join(dir, 'screenshots', 'web', 'estoque-fifo-web.webp');
const webpB64 = fs.readFileSync(webpPath).toString('base64');

const deployScript = `(async()=>{
  const css=${JSON.stringify(css)};
  const homeContent=${JSON.stringify(homeContent)};
  const b64=${JSON.stringify(webpB64)};
  const bin=atob(b64);
  const arr=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
  const fd=new FormData();
  fd.append('file',new Blob([arr],{type:'image/webp'}),'estoque-fifo-web-v2.webp');
  fd.append('title','Aero Suite — Estoque FIFO (itens)');
  fd.append('alt_text','Itens em estoque aeronáutico com rastreio FIFO');
  const media=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
  const estUrl=media.source_url;

  let home=homeContent.replace(/https:\\/\\/aerosuite\\.com\\.br\\/wp-content\\/uploads\\/[^"'\\s]*estoque-(fifo|itens)[^"'\\s]*/gi,estUrl);
  await wp.apiFetch({path:'/wp/v2/pages/${WP_PAGE_IDS.home}',method:'POST',data:{
    content:home,
    title:${JSON.stringify(SEO.title)},
    excerpt:${JSON.stringify(SEO.excerpt)},
    status:'publish'
  }});

  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  const cssRe=/<style id="aerosuite-premium-css">[\\s\\S]*?<\\/style>/;
  if(!cssRe.test(footer)) throw new Error('aerosuite-premium-css missing');
  footer=footer.replace(cssRe,'<style id="aerosuite-premium-css">'+css+'</style>');
  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});

  return{ok:true,estUrl,mediaId:media.id,hasPremiumCss:css.includes('align-items: start')};
})()`;

fs.writeFileSync(path.join(dir, '.deploy-fix-cards-estoque-once.js'), deployScript);
console.log('deploy script', deployScript.length, 'bytes');
console.log('webp b64', webpB64.length);
