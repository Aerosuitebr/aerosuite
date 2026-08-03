import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.CDP_LIVE_PORT || 8769);

const server = http.createServer((req, res) => {
  const m = /^\/step\/(\d+)$/.exec(req.url || '');
  if (!m) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const n = m[1];
  const p = path.join(dir, `.cdp-step-${n}-live-args.json`);
  if (!fs.existsSync(p)) {
    res.writeHead(404);
    res.end('missing ' + n);
    return;
  }
  const args = JSON.parse(fs.readFileSync(p, 'utf8'));
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(args.params));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`live steps http://127.0.0.1:${port}/step/<n>`);
});
