import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));
const port = process.env.STEPS_PORT || '8765';
const base = `http://127.0.0.1:${port}`;

const steps = order.map((name) => {
  const awaitPromise = name.endsWith('-upload') || name === 'apply-pages-footer';
  const wrap = awaitPromise
    ? `(async()=>{const s=await fetch('${base}/${name}.js').then(r=>r.text());return eval(s);})()`
    : `(async()=>{const s=await fetch('${base}/${name}.js').then(r=>r.text());return new Function(s)();})()`;
  return { name, awaitPromise, expression: wrap };
});

fs.writeFileSync(path.join(dir, 'fetch-invocations.json'), JSON.stringify(steps, null, 2));
console.log('built', steps.length, 'fetch wrappers');
