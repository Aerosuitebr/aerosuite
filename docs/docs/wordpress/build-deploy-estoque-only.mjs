/**
 * Gera deploy CDP só da imagem estoque-fifo-web.webp (páginas 21 e 20).
 * Uso: node build-deploy-estoque-only.mjs
 * Depois: wp-admin logado → executar .cdp-estoque-deploy-chunks.json via CDP.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const webp = path.join(dir, 'screenshots', 'web', 'estoque-fifo-web.webp');
if (!fs.existsSync(webp)) {
  console.error('Missing', webp, '— run: node recapture-estoque-pipeline.mjs');
  process.exit(1);
}

const b64 = fs.readFileSync(webp).toString('base64');
const CHUNK = 18000;
const chunks = [];
for (let i = 0; i < b64.length; i += CHUNK) chunks.push(b64.slice(i, i + CHUNK));

const uploadScript = `(async()=>{
  const b64=(window.__estB64||[]).join('');
  const bin=atob(b64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  const fd=new FormData();
  fd.append('file',new Blob([bytes],{type:'image/webp'}),'estoque-fifo-web.webp');
  fd.append('title','Aero Suite — Estoque FIFO');
  fd.append('alt_text','Itens em estoque com rastreio FIFO');
  const m=await wp.apiFetch({path:'/wp/v2/media',method:'POST',body:fd});
  window.__estUrl=m.source_url;
  return m.source_url;
})()`;

const applyScript = `(async()=>{
  const est=window.__estUrl;
  const results=[];
  for(const id of [21,20]){
    const page=await wp.apiFetch({path:'/wp/v2/pages/'+id+'?context=edit'});
    let c=page.content.raw||'';
    c=c.replace(/https:\\/\\/aerosuite\\.com\\.br\\/wp-content\\/uploads\\/[^"'\\s]*estoque-(fifo|itens)[^"'\\s]*/gi,est);
    await wp.apiFetch({path:'/wp/v2/pages/'+id,method:'POST',data:{content:c}});
    results.push({id,est});
  }
  return {ok:true,est,results};
})()`;

const out = {
  init: '(async()=>{window.__estB64=[];return{ok:1}})()',
  chunks: chunks.map(
    (x, i) =>
      `(async()=>{window.__estB64=window.__estB64||[];window.__estB64[${i}]=${JSON.stringify(x)};return{i:${i},n:${chunks.length}}})()`
  ),
  upload: uploadScript,
  apply: applyScript,
};

fs.writeFileSync(path.join(dir, '.cdp-estoque-deploy-chunks.json'), JSON.stringify(out));
console.log('chunks', chunks.length, 'b64', b64.length);
