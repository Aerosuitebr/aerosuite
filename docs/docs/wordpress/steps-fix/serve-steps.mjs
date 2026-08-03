import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.STEPS_PORT || 8765);

const server = http.createServer((req, res) => {
  const name = decodeURIComponent((req.url || '/').replace(/^\//, ''));
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
  res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end(fs.readFileSync(file, 'utf8'));
});

server.listen(port, '127.0.0.1', () => {
  console.log('steps-fix server http://127.0.0.1:' + port);
});
