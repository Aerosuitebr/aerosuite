import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
let b64 = '';
for (let i = 0; i < 14; i++) {
  const expr = fs.readFileSync(path.join(dir, `deploy-manifest-${i}.js`), 'utf8');
  const m = expr.match(/\+"([^"]+)"/);
  if (!m) throw new Error('chunk ' + i);
  b64 += m[1];
}

const combined = `(async()=>{
  window.__manifestb64=${JSON.stringify(b64)};
  const steps=JSON.parse(atob(window.__manifestb64));
  const results=[];
  for(let i=0;i<steps.length;i++){
    const fn=new Function('return ('+steps[i]+')')();
    results.push({step:i,result:await fn()});
  }
  return {ok:true,results,last:results[results.length-1]?.result};
})()`;

fs.writeFileSync(path.join(dir, 'deploy-manifest-combined.js'), combined);
console.log('combined length', combined.length, 'b64', b64.length);
