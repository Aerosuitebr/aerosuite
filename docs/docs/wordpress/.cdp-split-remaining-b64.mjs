import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const { calls } = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-upload-0-4-calls.json'), 'utf8'));
let full = '';
for (let i = 1; i <= 13; i++) {
  const m = calls[i].params.expression.match(/__b64\+='([\s\S]*)';return/);
  if (!m) throw new Error('no match ' + i);
  full += m[1];
}
const currentLen = Number(process.argv[2] || 15472);
full = full.slice(currentLen);
const CH = Number(process.argv[3] || 4000);
const out = [];
for (let i = 0; i < full.length; i += CH) {
  const part = full.slice(i, i + CH);
  out.push({
    viewId: '265634',
    method: 'Runtime.evaluate',
    params: {
      expression: `(()=>{window.__b64+='${part}';return{len:window.__b64.length}})()`,
      returnByValue: true,
    },
  });
}
out.forEach((c, i) => fs.writeFileSync(path.join(dir, `.cdp-rem-chunk-${i}.json`), JSON.stringify(c)));
console.log(JSON.stringify({ remaining: full.length, chunks: out.length }));
