import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const b64 = Buffer.from(css, 'utf8').toString('base64');
const chunkSize = 7000;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) chunks.push(b64.slice(i, i + chunkSize));

const finalize = fs.readFileSync(path.join(dir, 'deploy-css-fix-finalize.js'), 'utf8').trim();
const finalizeBody = finalize.replace(/^\(async\(\)=>\{/, '').replace(/\}\)\(\)$/, '').trim();

const script = `(async()=>{
  window.__cssb64='';
  const parts=${JSON.stringify(chunks)};
  for(const p of parts) window.__cssb64+=p;
  if(window.__cssb64.length!==${b64.length}) return{ok:false,stage:'b64',got:window.__cssb64.length,expected:${b64.length}};
  ${finalizeBody}
})()`;

fs.writeFileSync(path.join(dir, '.deploy-css-once.js'), script);
console.log('css once', script.length, 'chunks', chunks.length, 'b64', b64.length);
