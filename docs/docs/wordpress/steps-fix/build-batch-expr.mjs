import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));
const port = process.env.STEPS_PORT || '9876';
const base = `http://127.0.0.1:${port}`;
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? order.length - 1);
const slice = order.slice(start, end + 1);

function stepCode(name) {
  const ap = name.endsWith('-upload') || name === 'apply-pages-footer';
  if (ap) {
    return `{
      const s=await fetch(base+'/${name}.js').then(r=>r.text());
      const trimmed=s.trim();
      let v;
      if(trimmed.startsWith('(async')){
        const only=trimmed.replace(/;\\s*return\\s+window\\.__last\\w+;?\\s*$/i,'');
        v=await eval(only);
      } else v=await eval(s);
      results.push({name:'${name}',value:v});
    }`;
  }
  return `{
    const s=await fetch(base+'/${name}.js').then(r=>r.text());
    const v=new Function(s)();
    results.push({name:'${name}',value:v});
  }`;
}

const expr = `(async()=>{
  const base='${base}';
  const results=[];
  ${slice.map((n) => stepCode(n)).join('')}
  return results;
})()`;

const out = process.argv[4] || `batch-${start}-${end}.txt`;
fs.writeFileSync(path.join(dir, out), expr);
console.log(out, slice.length, 'steps', expr.length, 'bytes');
