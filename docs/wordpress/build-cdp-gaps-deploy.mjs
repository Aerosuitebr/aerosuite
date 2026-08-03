import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'a51b7f';
const code = fs.readFileSync(path.join(dir, '.deploy-gaps-once.js'), 'utf8');
const b64 = Buffer.from(code, 'utf8').toString('base64');
const chunkSize = 20000;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) chunks.push(b64.slice(i, i + chunkSize));

const steps = [];
steps.push({
  name: 'init',
  expr: `(async()=>{window.__deployB64='';return{ok:true,phase:'init',expectLen:${b64.length}}})()`,
});
for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i];
  const expr = `(async()=>{window.__deployB64=(window.__deployB64||'')+${JSON.stringify(c)};return{chunk:${i},len:window.__deployB64.length}})()`;
  steps.push({ name: `chunk-${i}`, expr });
}
steps.push({
  name: 'run',
  expr: `(async()=>{try{const r=await eval(atob(window.__deployB64));return r}catch(e){return{ok:false,error:String(e&&e.message||e),len:window.__deployB64.length}}})()`,
});

const outDir = path.join(dir, '.mcp-gaps-deploy');
fs.mkdirSync(outDir, { recursive: true });
const manifest = [];
for (const s of steps) {
  const payload = {
    method: 'Runtime.evaluate',
    params: { expression: s.expr, awaitPromise: true, returnByValue: true },
    viewId,
  };
  const rel = `.mcp-gaps-deploy/${s.name}.json`;
  fs.writeFileSync(path.join(dir, rel), JSON.stringify(payload));
  manifest.push({ name: s.name, file: rel, exprLen: s.expr.length });
}
fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify({ viewId, b64Len: b64.length, chunks: chunks.length, steps: manifest.length, manifest }, null, 2)
);
console.log(JSON.stringify({ b64Len: b64.length, chunks: chunks.length, steps: steps.length, viewId }));
