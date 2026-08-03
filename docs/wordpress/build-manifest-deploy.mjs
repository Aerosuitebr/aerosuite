import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const steps = [];
for (let i = 0; i < 12; i++) {
  steps.push(fs.readFileSync(path.join(dir, `deploy-run-${i}.js`), 'utf8'));
}

const manifest = JSON.stringify(steps);
const b64 = Buffer.from(manifest).toString('base64');
const chunkSize = 6000;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) chunks.push(b64.slice(i, i + chunkSize));

const init = `(async()=>{window.__manifestb64='';return{ok:true};})()`;
const chunkExprs = chunks.map(
  (c, i) =>
    `(async()=>{window.__manifestb64=(window.__manifestb64||'')+${JSON.stringify(c)};return{chunk:${i},len:window.__manifestb64.length};})()`
);
const run = `(async()=>{
  const steps=JSON.parse(atob(window.__manifestb64));
  const results=[];
  for(let i=0;i<steps.length;i++){
    const fn=new Function('return ('+steps[i]+')')();
    results.push({step:i,result:await fn()});
  }
  return {ok:true,results,last:results[results.length-1]?.result};
})()`;

fs.writeFileSync(path.join(dir, 'deploy-manifest-init.js'), init);
chunkExprs.forEach((c, i) => fs.writeFileSync(path.join(dir, `deploy-manifest-${i}.js`), c));
fs.writeFileSync(path.join(dir, 'deploy-manifest-run.js'), run);
console.log('manifest b64', b64.length, 'chunks', chunks.length, 'chunk sizes', chunkExprs.map((c) => c.length), 'run', run.length);
