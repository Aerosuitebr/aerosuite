import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.CDP_INVOKE_PORT || 8768);

const server = http.createServer((req, res) => {
  const m = /^\/step\/(\d+)\.js$/.exec(req.url || '');
  if (!m) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const n = m[1];
  const invoke = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-step-${n}.invoke.json`), 'utf8'));
  let expr = invoke.params.expression;
  if (expr.startsWith('(async()=>') && expr.endsWith('})()')) {
    expr = expr.slice('(async()=>'.length, -4);
  }
  res.writeHead(200, { 'Content-Type': 'application/javascript' });
  res.end(expr);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`invoke server http://127.0.0.1:${port}/step/N.js`);
});
