/**
 * Serve .mcp-step-N-payload.json expressions for in-browser fetch loop.
 * Usage: node serve-step-payloads.mjs start [port]
 *        node serve-step-payloads.mjs stop
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[3] || 8766);
const pidFile = path.join(dir, '.serve-step-payloads.pid');

if (process.argv[2] === 'stop') {
  if (fs.existsSync(pidFile)) {
    try {
      process.kill(Number(fs.readFileSync(pidFile, 'utf8').trim()));
    } catch {
      /* gone */
    }
    fs.unlinkSync(pidFile);
  }
  process.exit(0);
}

const server = http.createServer((req, res) => {
  const m = req.url?.match(/^\/step\/(\d+)$/);
  if (!m) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const n = Number(m[1]);
  const p = path.join(dir, `.mcp-step-${n}-payload.json`);
  if (!fs.existsSync(p)) {
    res.writeHead(404);
    res.end('missing');
    return;
  }
  const payload = JSON.parse(fs.readFileSync(p, 'utf8'));
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ expression: payload.params.expression, awaitPromise: true }));
});

server.listen(PORT, '127.0.0.1', () => {
  fs.writeFileSync(pidFile, String(process.pid));
  console.log(JSON.stringify({ port: PORT, pid: process.pid }));
});

setTimeout(() => {
  server.close();
  if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
  process.exit(0);
}, 300000);
