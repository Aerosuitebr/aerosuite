import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 4);
const parts = [];
for (let n = start; n <= end; n++) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-live-step-${n}.json`), 'utf8'));
  let ex = j.params.expression;
  ex = ex.replace(/^\(async\(\)=>\{/, '').replace(/\}\)\(\)$/, '');
  ex = ex.replace(/return\s*\{batch:\d+,from:\d+,to:\d+\};?/g, '');
  parts.push(ex);
}
const chain = `(async()=>{${parts.join('')}window.__cssb64=(window.__cssParts||[]).join('');window.__cssParts=null;return{len:window.__cssb64.length,ok:window.__cssb64.length===34708}})()`;
const out = { viewId: process.argv[4] || '51e397', method: 'Runtime.evaluate', params: { expression: chain, awaitPromise: true, returnByValue: true } };
fs.writeFileSync(path.join(dir, '.cdp-chain-call.json'), JSON.stringify(out));
console.log(JSON.stringify({ exprLen: chain.length }));
