/**
 * Serve step call expressions; browser fetches via Runtime.evaluate per step.
 * Agent runs: node .cdp-http-bridge.mjs start
 * Then for each step N: browser_cdp eval fetch('http://127.0.0.1:8765/step/N')...
 * This script runs all steps 2-29 via single browser_cdp loop expression.
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8765;
const viewId = process.argv[3] || 'f8a339';
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[4] ?? 29);

const server = http.createServer((req, res) => {
  const m = req.url?.match(/^\/step\/(\d+)$/);
  if (!m) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const n = Number(m[1]);
  const p = path.join(dir, `.cdp-step-${n}.call.json`);
  if (!fs.existsSync(p)) {
    res.writeHead(404);
    res.end('missing');
    return;
  }
  const call = JSON.parse(fs.readFileSync(p, 'utf8'));
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ expression: call.params.expression, awaitPromise: true }));
});

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const loopExpr = `(async()=>{
  const out={};
  for(let n=${start};n<=${end};n++){
    const r=await fetch('http://127.0.0.1:${PORT}/step/'+n);
    if(!r.ok) throw new Error('fetch step '+n);
    const {expression}=await r.json();
    out[n]=await eval(expression);
  }
  return out;
})()`;

fs.writeFileSync(path.join(dir, '.cdp-loop-expr.json'), JSON.stringify({
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: loopExpr, awaitPromise: true, returnByValue: true },
}));

console.log(JSON.stringify({ ready: true, port: PORT, start, end, exprPath: '.cdp-loop-expr.json' }));
console.error('Run ONE browser_cdp with .cdp-loop-expr.json then node .cdp-http-bridge.mjs stop');

if (process.argv[2] === 'stop') {
  server.close();
  process.exit(0);
}

// keep alive 120s max
setTimeout(() => { server.close(); process.exit(0); }, 120000);
