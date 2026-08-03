import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.CDP_INVOKE_PORT || 8768);

const server = http.createServer((req, res) => {
  const m = /^\/step\/([a-z0-9-]+)$/.exec(req.url || '');
  if (!m) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const name = m[1];
  const exprPath = path.join(dir, `step-${name}.expr.txt`);
  const invokePath = path.join(dir, `.invoke-${name}.json`);
  let body;
  if (fs.existsSync(exprPath)) {
    body = fs.readFileSync(exprPath, 'utf8').trim();
  } else if (fs.existsSync(invokePath)) {
    body = JSON.parse(fs.readFileSync(invokePath, 'utf8')).expression;
  } else {
    res.writeHead(404);
    res.end('missing ' + name);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`named steps http://127.0.0.1:${port}/step/<name>`);
});
