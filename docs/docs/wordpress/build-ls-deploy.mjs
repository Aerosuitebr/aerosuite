import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHomeContent } from './aerosuite-content.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const b64 = Buffer.from(buildHomeContent(), 'utf8').toString('base64');
const chunkSize = 6000;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) chunks.push(b64.slice(i, i + chunkSize));

for (let i = 0; i < chunks.length; i++) {
  const expr = `(async()=>{localStorage.setItem('as_home_b64_${i}',${JSON.stringify(chunks[i])});return{ok:${i},len:localStorage.getItem('as_home_b64_${i}').length};})()`;
  fs.writeFileSync(path.join(dir, `.ls-chunk-${i}.txt`), expr);
  console.log(i, chunks[i].length, expr.length);
}

const seo = {
  title: 'Aero Suite — Gestão aeronáutica para oficinas MRO | Rastreabilidade e conformidade',
  excerpt:
    'Plataforma SaaS para oficinas, MROs e OMs: OS, estoque FIFO, propostas, documentos e portal do cliente com rastreabilidade e controle operacional. Agende uma demonstração.',
};

const pub = `(async()=>{
  let b64='';
  for(let i=0;i<${chunks.length};i++) b64+=localStorage.getItem('as_home_b64_'+i)||'';
  if(b64.length!==${b64.length}) return{ok:false,stage:'b64',got:b64.length,expected:${b64.length}};
  const bin=atob(b64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  const home=new TextDecoder('utf-8').decode(bytes);
  if(!home.includes('5521990403514')) return{ok:false,err:'whatsapp'};
  if(!home.includes('Integrações podem ser avaliadas na demo')) return{ok:false,err:'faq'};
  const seo=${JSON.stringify(seo)};
  await wp.apiFetch({path:'/wp/v2/pages/21',method:'POST',data:{content:home,title:seo.title,excerpt:seo.excerpt,status:'publish'}});
  return{ok:true,homeLen:home.length,wa:true,hero:home.includes('rastreabilidade'),title:seo.title};
})()`;

fs.writeFileSync(path.join(dir, '.ls-publish.txt'), pub);
console.log('pub', pub.length, 'b64Total', b64.length);
