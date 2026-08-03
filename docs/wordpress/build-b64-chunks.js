const fs = require('fs');
const path = require('path');
const dir = __dirname;
const viewId = process.argv[2] || '44c6d7';
const b64 = fs.readFileSync(path.join(dir, 'deploy-eval-all.b64.txt'), 'utf8').trim();
const chunkSize = 9000;
const parts = [];
for (let i = 0; i < b64.length; i += chunkSize) {
  parts.push(b64.slice(i, i + chunkSize));
}

const payloads = [
  {
    step: 'init',
    expression: `(async()=>{window.__homeb64='';window.__deployB64='';return{init:true};})()`,
  },
  ...parts.map((part, i) => ({
    step: `b64-${i}`,
    expression: `(async()=>{window.__deployB64=(window.__deployB64||'')+'${part}';return{part:${i},len:window.__deployB64.length};})()`,
  })),
  {
    step: 'run',
    expression: `(async()=>{return await eval(atob(window.__deployB64||''));})()`,
  },
];

for (const p of payloads) {
  const payload = {
    method: 'Runtime.evaluate',
    params: { expression: p.expression, awaitPromise: true, returnByValue: true },
    viewId,
  };
  fs.writeFileSync(
    path.join(dir, `deploy-b64-chunk-${p.step}.json`),
    JSON.stringify(payload)
  );
  console.log(p.step, p.expression.length);
}
