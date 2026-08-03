const fs = require('fs');
const path = require('path');
const dir = __dirname;
const viewId = process.argv[2] || '44c6d7';

function chunkExpr(n) {
  const file = path.join(dir, `deploy-encoding-${n}.js`);
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/\+\s*"([\s\S]*?)"\s*;/);
  if (!m) throw new Error(`chunk ${n} not found`);
  const chunk = m[1];
  return `(async()=>{window.__homeb64=(window.__homeb64||'')+"${chunk}";return{chunk:${n},len:window.__homeb64.length};})()`;
}

const runSrc = fs.readFileSync(path.join(dir, 'deploy-encoding-run.js'), 'utf8').trim();
const runExpr = `(async()=>{${runSrc.replace(/^\(async\(\)=>\{|\}\)\(\)$/g, '')}})()`;
// run file is (async()=>{ ... })() - use as-is
const runFinal = runSrc.startsWith('(async') ? runSrc : `(async()=>{${runSrc}})()`;

for (const n of [0, 1, 2, 3, 4]) {
  const expression = chunkExpr(n);
  const payload = {
    method: 'Runtime.evaluate',
    params: { expression, awaitPromise: true, returnByValue: true },
    viewId,
  };
  fs.writeFileSync(path.join(dir, `deploy-chunk-payload-${n}.json`), JSON.stringify(payload));
  console.log(n, expression.length);
}

const runPayload = {
  method: 'Runtime.evaluate',
  params: { expression: runFinal, awaitPromise: true, returnByValue: true },
  viewId,
};
fs.writeFileSync(path.join(dir, 'deploy-chunk-payload-run.json'), JSON.stringify(runPayload));
console.log('run', runFinal.length);
