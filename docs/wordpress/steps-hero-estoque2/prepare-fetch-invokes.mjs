import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));
const port = Number(process.env.STEPS_PORT || 8766);
const base = `http://127.0.0.1:${port}`;

for (let i = 0; i < order.length; i++) {
  const name = order[i];
  const awaitPromise = name.endsWith('-upload') || name === 'apply';
  const expression = awaitPromise
    ? `(async()=>{const t=await fetch('${base}/${name}.js').then(r=>r.text());return eval(t);})()`
    : `(async()=>{const t=await fetch('${base}/${name}.js').then(r=>r.text());return new Function(t)();})()`;
  fs.writeFileSync(
    path.join(dir, `_fetch-invoke-${i}.json`),
    JSON.stringify({
      method: 'Runtime.evaluate',
      params: {
        expression,
        awaitPromise: true,
        returnByValue: awaitPromise || name === 'init',
      },
    })
  );
}
console.log('prepared', order.length, 'fetch invoke files on port', port);
