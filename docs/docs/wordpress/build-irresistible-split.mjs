import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHomeContent, SEO } from './aerosuite-content.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const homeContent = buildHomeContent();

const pageDeploy = `(async()=>{
  const homeContent = ${JSON.stringify(homeContent)};
  const seo = ${JSON.stringify(SEO)};
  await wp.apiFetch({path:'/wp/v2/pages/21',method:'POST',data:{content:homeContent,title:seo.title,excerpt:seo.excerpt,status:'publish'}});
  return {ok:true,len:homeContent.length,title:seo.title};
})()`;

fs.writeFileSync(path.join(dir, 'deploy-irresistible-page.js'), pageDeploy);

const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const b64 = Buffer.from(css).toString('base64');
const cssDeploy = `(async()=>{
  const css = atob(${JSON.stringify(b64)});
  let footer = (await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
  footer = footer.replace(/<style id="aerosuite-hero-logo-pos">[\\s\\S]*?<\\/style>\\n?/g,'');
  const re = /<style id="aerosuite-premium-css">[\\s\\S]*?<\\/style>/;
  if(!re.test(footer)) throw new Error('css block missing');
  footer = footer.replace(re,'<style id="aerosuite-premium-css">'+css+'</style>');
  await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
  return {ok:true,cssLen:css.length};
})()`;

fs.writeFileSync(path.join(dir, 'deploy-irresistible-css.js'), cssDeploy);

for (const [id, file] of [
  ['aerosuite-phone-mask-js', 'aerosuite-phone-mask.js'],
  ['aerosuite-showcase-zoom-js', 'aerosuite-showcase-zoom.js'],
  ['aerosuite-hero-js', 'aerosuite-hero.js'],
]) {
  const js = fs.readFileSync(path.join(dir, file), 'utf8');
  const expr = `(async()=>{
    const js = ${JSON.stringify(js)};
    let footer = (await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?context=edit'})).content.raw;
    const re = new RegExp('<script id="${id}">[\\\\s\\\\S]*?<\\\\/script>\\\\n?','g');
    if(!footer.includes('id="${id}"')){
      const ins = '</style>\\n<script id="${id}">' + js + '</script>\\n<script id=';
      footer = footer.replace('</style>\\n<script id=','</style>\\n<script id="${id}">' + js + '</script>\\n<script id=');
    } else {
      footer = footer.replace(re,'<script id="${id}">' + js + '</script>\\n');
    }
    await wp.apiFetch({path:'/wp/v2/template-parts/extendable//footer?id=extendable//footer',method:'POST',data:{content:footer}});
    return {ok:true,id:'${id}'};
  })()`;
  fs.writeFileSync(path.join(dir, `deploy-irresistible-${id}.js`), expr);
  console.log(id, expr.length);
}

console.log('page', pageDeploy.length);
console.log('css', cssDeploy.length);
