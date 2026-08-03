import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const chunkFiles = Array.from({ length: 14 }, (_, i) => `deploy-manifest-${i}.js`);
const chunks = chunkFiles.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').trim());
const run = fs.readFileSync(path.join(dir, 'deploy-manifest-run.js'), 'utf8').trim();

const expr = `(async()=>{
  window.__manifestb64='';
  const chunkResults=[];
  ${chunks.map((c, i) => `chunkResults.push(await (${c}));`).join('\n  ')}
  const deploy=await (${run});
  return {chunkResults,deploy};
})()`;

const out = path.join(dir, 'exec-all-chunks-expr.js');
fs.writeFileSync(out, expr);
console.log(JSON.stringify({ out, len: expr.length }));
