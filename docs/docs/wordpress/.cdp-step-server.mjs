/** Serve step expressions from .cdp-step-N.mcp-ready.json for in-browser fetch loop. */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8769;

const server = http.createServer((req, res) => {
  const m = req.url?.match(/^\/step\/(\d+)$/);
  if (!m) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const n = Number(m[1]);
  const p = path.join(dir, `.cdp-step-${n}.mcp-ready.json`);
  if (!fs.existsSync(p)) {
    res.writeHead(404);
    res.end('missing');
    return;
  }
  const call = JSON.parse(fs.readFileSync(p, 'utf8'));
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ expression: call.params.expression, awaitPromise: true }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(JSON.stringify({ port: PORT }));
});

setTimeout(() => server.close(), 600000);
