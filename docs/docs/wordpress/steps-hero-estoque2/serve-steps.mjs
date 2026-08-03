/**
 * Serve steps-hero-estoque2/*.js for in-browser fetch+eval during CDP deploy.
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.STEPS_PORT || 8766);

const server = http.createServer((req, res) => {
  const name = decodeURIComponent((req.url || '/').replace(/^\//, '').split('?')[0]);
  if (!name.endsWith('.js')) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const file = path.join(dir, name);
  if (!file.startsWith(dir) || !fs.existsSync(file)) {
    res.writeHead(404);
    res.end('missing');
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(fs.readFileSync(file, 'utf8'));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`steps server http://127.0.0.1:${port}/`);
});
