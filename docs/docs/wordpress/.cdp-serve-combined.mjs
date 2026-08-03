/** Serve combined expression; agent runs small browser_cdp fetch+eval */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.CDP_HTTP_PORT || 8766);
const combined = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-combined-0-29-mcp.json'), 'utf8'));

const server = http.createServer((req, res) => {
  if (req.url === '/combined') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ expression: combined.params.expression }));
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  const small = `(async()=>{const r=await fetch('http://127.0.0.1:${PORT}/combined');const j=await r.json();return await eval(j.expression);})()`;
  fs.writeFileSync(
    path.join(dir, '.cdp-combined-fetch-mcp.json'),
    JSON.stringify({
      method: 'Runtime.evaluate',
      params: { expression: small, awaitPromise: true, returnByValue: true },
      viewId: combined.viewId,
    })
  );
  console.log(JSON.stringify({ port: PORT, smallLen: small.length, viewId: combined.viewId }));
});

setTimeout(() => server.close(), 300000);
