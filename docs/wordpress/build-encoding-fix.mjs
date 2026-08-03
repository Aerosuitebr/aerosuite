import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHomeContent, SEO } from './aerosuite-content.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const home = buildHomeContent();
const b64 = Buffer.from(home, 'utf8').toString('base64');

const chunkSize = 6000;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) chunks.push(b64.slice(i, i + chunkSize));

fs.writeFileSync(
  path.join(dir, 'deploy-encoding-init.js'),
  `(async()=>{window.__homeb64='';return{ok:true};})()`
);

chunks.forEach((c, i) => {
  fs.writeFileSync(
    path.join(dir, `deploy-encoding-${i}.js`),
    `(async()=>{window.__homeb64=(window.__homeb64||'')+${JSON.stringify(c)};return{chunk:${i},len:window.__homeb64.length};})()`
  );
});

const finalize = `(async()=>{
  const expectedB64=${b64.length};
  const got=(window.__homeb64||'').length;
  if(got!==expectedB64){
    return{ok:false,error:'b64 length mismatch',got,expectedB64};
  }
  const bin=atob(window.__homeb64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  const homeContent=new TextDecoder('utf-8').decode(bytes);
  if(!homeContent.includes('Integrações podem ser avaliadas na demo')){
    return{ok:false,error:'content integrity check failed',homeLen:homeContent.length,tail:homeContent.slice(-120)};
  }
  const seo=${JSON.stringify(SEO)};
  const sample=homeContent.match(/demonstra[^<]{0,12}/)?.[0]||'';
  await wp.apiFetch({path:'/wp/v2/pages/21',method:'POST',data:{content:homeContent,title:seo.title,excerpt:seo.excerpt,status:'publish'}});
  return{ok:true,homeLen:homeContent.length,sample,hasHeroV2:homeContent.includes('as-hero-v2'),title:seo.title,b64Len:got};
})()`;

fs.writeFileSync(path.join(dir, 'deploy-encoding-run.js'), finalize);

console.log('home utf8 bytes', Buffer.byteLength(home, 'utf8'), 'b64', b64.length, 'chunks', chunks.length);
console.log('sample local:', home.match(/demonstra[^<]{0,12}/)?.[0]);
