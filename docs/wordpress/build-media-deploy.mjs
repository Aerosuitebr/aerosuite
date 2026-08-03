import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHomeContent, SEO } from './aerosuite-content.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, 'dist');
fs.mkdirSync(out, { recursive: true });

fs.writeFileSync(path.join(out, 'home-content.txt'), buildHomeContent(), 'utf8');
fs.copyFileSync(path.join(dir, 'aerosuite-premium.css'), path.join(out, 'aerosuite-premium.css'));
fs.copyFileSync(path.join(dir, 'aerosuite-hero.js'), path.join(out, 'aerosuite-hero.js'));
fs.copyFileSync(path.join(dir, 'aerosuite-phone-mask.js'), path.join(out, 'aerosuite-phone-mask.js'));
fs.copyFileSync(path.join(dir, 'aerosuite-showcase-zoom.js'), path.join(out, 'aerosuite-showcase-zoom.js'));

const uploadDeploy = `(async()=>{
  async function uploadText(name, mime, b64){
    const bin=atob(b64);const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    const fd=new FormData();
    fd.append('file',new Blob([arr],{type:mime}),name);
    fd.append('title',name);
    const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
    return m.source_url;
  }
  const files=${JSON.stringify({
    home: Buffer.from(fs.readFileSync(path.join(out, 'home-content.txt'))).toString('base64'),
    css: Buffer.from(fs.readFileSync(path.join(out, 'aerosuite-premium.css'))).toString('base64'),
    hero: Buffer.from(fs.readFileSync(path.join(out, 'aerosuite-hero.js'))).toString('base64'),
    phone: Buffer.from(fs.readFileSync(path.join(out, 'aerosuite-phone-mask.js'))).toString('base64'),
    zoom: Buffer.from(fs.readFileSync(path.join(out, 'aerosuite-showcase-zoom.js'))).toString('base64'),
  })};
  window.__asDeploy=window.__asDeploy||{};
  window.__asDeploy.home=await uploadText('aerosuite-home-content.txt','text/plain',files.home);
  window.__asDeploy.css=await uploadText('aerosuite-premium.css','text/css',files.css);
  window.__asDeploy.hero=await uploadText('aerosuite-hero.js','application/javascript',files.hero);
  window.__asDeploy.phone=await uploadText('aerosuite-phone-mask.js','application/javascript',files.phone);
  window.__asDeploy.zoom=await uploadText('aerosuite-showcase-zoom.js','application/javascript',files.zoom);
  return window.__asDeploy;
})()`;

// Split upload into per-file scripts (each ~30-40kb b64 max)
function uploadOne(key, filename, mime, filepath) {
  const b64 = Buffer.from(fs.readFileSync(filepath)).toString('base64');
  return `(async()=>{
    const b64=${JSON.stringify(b64)};
    const bin=atob(b64);const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    const fd=new FormData();
    fd.append('file',new Blob([arr],{type:'${mime}'}),'${filename}');
    fd.append('title','${filename}');
    const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
    window.__asDeploy=window.__asDeploy||{};
    window.__asDeploy['${key}']=m.source_url;
    return {key:'${key}',url:m.source_url};
  })()`;
}

fs.writeFileSync(path.join(dir, 'deploy-upload-home.js'), uploadOne('home', 'aerosuite-home-content.txt', 'text/plain', path.join(out, 'home-content.txt')));
fs.writeFileSync(path.join(dir, 'deploy-upload-css.js'), uploadOne('css', 'aerosuite-premium.css', 'text/css', path.join(out, 'aerosuite-premium.css')));
fs.writeFileSync(path.join(dir, 'deploy-upload-hero.js'), uploadOne('hero', 'aerosuite-hero.js', 'application/javascript', path.join(out, 'aerosuite-hero.js')));
fs.writeFileSync(path.join(dir, 'deploy-upload-phone.js'), uploadOne('phone', 'aerosuite-phone-mask.js', 'application/javascript', path.join(out, 'aerosuite-phone-mask.js')));
fs.writeFileSync(path.join(dir, 'deploy-upload-zoom.js'), uploadOne('zoom', 'aerosuite-showcase-zoom.js', 'application/javascript', path.join(out, 'aerosuite-showcase-zoom.js')));

const finalize = `(async()=>{
  const u=window.__asDeploy;
  if(!u||!u.home||!u.css) throw new Error('upload missing '+JSON.stringify(u));
  const [homeContent,css,heroJs,phoneJs,zoomJs]=await Promise.all([
    fetch(u.home).then(r=>r.text()),
    fetch(u.css).then(r=>r.text()),
    fetch(u.hero).then(r=>r.text()),
    fetch(u.phone).then(r=>r.text()),
    fetch(u.zoom).then(r=>r.text()),
  ]);
  const seo=${JSON.stringify(SEO)};
  let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  footer=footer.replace(/<style id="aerosuite-hero-logo-pos">[\\s\\S]*?<\\/style>\\n?/g,'');
  const block='<!-- wp:html -->\\n<style id="aerosuite-premium-css">'+css+'</style>\\n<script id="aerosuite-phone-mask-js">'+phoneJs+'</script>\\n<script id="aerosuite-showcase-zoom-js">'+zoomJs+'</script>\\n<script id="aerosuite-hero-js">'+heroJs+'</script>\\n<!-- /wp:html -->\\n';
  if(footer.includes('aerosuite-premium-css')){
    footer=footer.replace(/<!-- wp:html -->[\\s\\S]*?aerosuite-premium-css[\\s\\S]*?<!-- \\/wp:html -->/,block.trim());
  } else {
    footer=block+footer;
  }
  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
  await wp.apiFetch({path:'/wp/v2/pages/21',method:'POST',data:{content:homeContent,title:seo.title,excerpt:seo.excerpt,status:'publish'}});
  return {ok:true,urls:u,homeLen:homeContent.length,footerLen:footer.length};
})()`;

fs.writeFileSync(path.join(dir, 'deploy-finalize.js'), finalize);
console.log('upload home', fs.readFileSync(path.join(dir, 'deploy-upload-home.js'), 'utf8').length);
console.log('upload css', fs.readFileSync(path.join(dir, 'deploy-upload-css.js'), 'utf8').length);
console.log('finalize', finalize.length);
