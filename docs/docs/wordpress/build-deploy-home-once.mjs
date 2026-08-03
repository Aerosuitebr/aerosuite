import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const chunks = [];
for (let i = 0; i < 5; i++) {
  chunks.push(fs.readFileSync(path.join(dir, `deploy-encoding-${i}.js`), 'utf8').trim());
}
const run = fs.readFileSync(path.join(dir, 'deploy-encoding-run.js'), 'utf8').trim();
const script = `(async()=>{
  window.__homeb64='';
  const steps=${JSON.stringify(chunks)};
  for(let i=0;i<steps.length;i++){
    const r=await eval(steps[i]);
    if(!r||typeof r.len!=='number') return{ok:false,stage:'chunk',i};
  }
  const got=(window.__homeb64||'').length;
  if(got!==26780) return{ok:false,stage:'b64',got};
  return await eval(${JSON.stringify(run)});
})()`;
fs.writeFileSync(path.join(dir, '.deploy-home-once.js'), script);
console.log('len', script.length);
