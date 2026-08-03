/**
 * Local server for WP deploy payloads (agent browser fetch).
 * node serve-mcp-payloads.mjs [port]
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || 18765);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const m = /^\/step\/(\d+)$/.exec(req.url || '');
  if (!m) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const p = path.join(dir, `.mcp-payload-${m[1]}.json`);
  if (!fs.existsSync(p)) {
    res.writeHead(404);
    res.end('missing');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(fs.readFileSync(p, 'utf8'));
});

server.listen(port, '127.0.0.1', () => {
  console.log(JSON.stringify({ ok: true, port, base: `http://127.0.0.1:${port}/step/` }));
});
