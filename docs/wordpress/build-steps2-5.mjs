import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

const mk = (from, to) => {
  const parts = [];
  for (let i = from; i <= to; i++) {
    parts.push(fs.readFileSync(path.join(dir, `deploy-css-step-${i}.js`), 'utf8').trim());
  }
  const ex = `(async()=>{const steps=${JSON.stringify(parts)};for(const s of steps){const m=s.match(/\\+\"([\\s\\S]*)\";return\\{chunk/);if(!m)throw new Error('bad');window.__cssb64=(window.__cssb64||'')+m[1];}return{from:${from},to:${to},len:window.__cssb64.length}})()`;
  return ex;
};

const a = mk(2, 3);
const b = mk(4, 5);
fs.writeFileSync(path.join(dir, '.steps2-3.txt'), a);
fs.writeFileSync(path.join(dir, '.steps4-5.txt'), b);
console.log('a', a.length, 'b', b.length);
