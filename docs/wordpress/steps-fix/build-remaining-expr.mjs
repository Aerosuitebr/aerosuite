import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8')).slice(2);
const port = process.env.STEPS_PORT || '9876';
const base = `http://127.0.0.1:${port}`;

const expr = `(async()=>{
  const order=${JSON.stringify(order)};
  const base='${base}';
  const results=[];
  for(const name of order){
    const s=await fetch(base+'/'+name+'.js').then(r=>r.text());
    const ap=name.endsWith('-upload')||name==='apply-pages-footer';
    let v=ap?eval(s):new Function(s)();
    if(v&&typeof v.then==='function')v=await v;
    results.push({name,value:v});
  }
  return results;
})()`;

fs.writeFileSync(path.join(dir, 'run-remaining-expr.txt'), expr);
console.log('steps', order.length, 'bytes', expr.length);
