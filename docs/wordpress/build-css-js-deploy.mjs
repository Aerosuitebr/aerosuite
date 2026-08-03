import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const b64 = Buffer.from(css).toString('base64');
const chunkSize = 7000;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) chunks.push(b64.slice(i, i + chunkSize));

const steps = [
  `(async()=>{window.__cssb64='';return{ok:true};})()`,
  ...chunks.map(
    (c, i) =>
      `(async()=>{window.__cssb64=(window.__cssb64||'')+${JSON.stringify(c)};return{chunk:${i},len:window.__cssb64.length};})()`
  ),
  `(async()=>{
    const css=atob(window.__cssb64);
    let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
    footer=footer.replace(/<style id="aerosuite-hero-logo-pos">[\\s\\S]*?<\\/style>\\n?/g,'');
    const re=/<style id="aerosuite-premium-css">[\\s\\S]*?<\\/style>/;
    if(!re.test(footer)) throw new Error('css missing');
    footer=footer.replace(re,'<style id="aerosuite-premium-css">'+css+'</style>');
    await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
    return{ok:true,cssLen:css.length};
  })()`,
];

steps.forEach((s, i) => fs.writeFileSync(path.join(dir, `deploy-css-step-${i}.js`), s));
console.log('css chunks', chunks.length, 'step sizes', steps.map((s) => s.length));

for (const [id, file] of [
  ['aerosuite-hero-js', 'aerosuite-hero.js'],
  ['aerosuite-phone-mask-js', 'aerosuite-phone-mask.js'],
  ['aerosuite-showcase-zoom-js', 'aerosuite-showcase-zoom.js'],
]) {
  const js = fs.readFileSync(path.join(dir, file), 'utf8');
  const expr = `(async()=>{
    const js=${JSON.stringify(js)};
    let footer=(await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
    const id='${id}';
    const tag='<script id="'+id+'">';
    if(footer.includes(tag)){
      footer=footer.replace(new RegExp('<script id="'+id+'">[\\\\s\\\\S]*?<\\\\/script>\\\\n?'),tag+js+'</script>\\n');
    } else {
      footer=footer.replace('</style>','</style>\\n'+tag+js+'</script>\\n');
    }
    await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
    return{ok:true,id};
  })()`;
  fs.writeFileSync(path.join(dir, `deploy-js-${id}.js`), expr);
  console.log(id, expr.length);
}
