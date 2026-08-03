/**
 * Serve .cdp-step-N-mcp.json expressions; browser fetches via Runtime.evaluate loop.
 * Usage: node .cdp-http-bridge-mcp.mjs start <start> <end>
 *        node .cdp-http-bridge-mcp.mjs stop
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8765;

if (process.argv[2] === 'stop') {
  try {
    await fetch(`http://127.0.0.1:${PORT}/shutdown`);
  } catch {
    /* server may already be down */
  }
  process.exit(0);
}

const cmd = process.argv[2];
const start = Number(cmd === 'start' ? process.argv[3] : process.argv[2]) || 0;
const end = Number(cmd === 'start' ? process.argv[4] : process.argv[3]) || 29;
const viewId = (cmd === 'start' ? process.argv[5] : process.argv[4]) ?? '9e0614';

let server;

const createServer = () =>
  http.createServer((req, res) => {
    if (req.url === '/shutdown') {
      res.writeHead(200);
      res.end('ok');
      setImmediate(() => server?.close());
      return;
    }
    const m = req.url?.match(/^\/step\/(\d+)$/);
    if (!m) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const n = Number(m[1]);
    const p = path.join(dir, `.cdp-step-${n}-mcp.json`);
    if (!fs.existsSync(p)) {
      res.writeHead(404);
      res.end('missing');
      return;
    }
    const call = JSON.parse(fs.readFileSync(p, 'utf8'));
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(
      JSON.stringify({
        expression: call.params.expression,
        awaitPromise: call.params.awaitPromise ?? true,
      })
    );
  });

server = createServer();
await new Promise((resolve, reject) => {
  server.on('error', reject);
  server.listen(PORT, '127.0.0.1', resolve);
});

const loopExpr = `(async()=>{
  const out={};
  for(let n=${start};n<=${end};n++){
    const r=await fetch('http://127.0.0.1:${PORT}/step/'+n);
    if(!r.ok) throw new Error('fetch step '+n+' status '+r.status);
    const {expression}=await r.json();
    out[n]=await eval(expression);
  }
  return out;
})()`;

const mcpArgs = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: loopExpr, awaitPromise: true, returnByValue: true },
};

fs.writeFileSync(path.join(dir, '.cdp-loop-mcp-args.json'), JSON.stringify(mcpArgs));
console.log(JSON.stringify({ ready: true, port: PORT, start, end, viewId, exprLen: loopExpr.length }));

setTimeout(() => {
  server?.close();
  process.exit(0);
}, 300000);
