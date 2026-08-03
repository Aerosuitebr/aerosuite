import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 9876);
const file = path.join(dir, 'cdp-batch-mcp-args-only.json');

const server = http.createServer((req, res) => {
  if (req.url === '/batch.json') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(fs.readFileSync(file));
    return;
  }
  res.writeHead(404);
  res.end();
});
server.listen(port, '127.0.0.1', () => {
  console.log('http://127.0.0.1:' + port + '/batch.json');
});
