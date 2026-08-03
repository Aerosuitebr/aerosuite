/** Serve chunk/base64 append payloads for in-page fetch. */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));

function extractChunk(raw) {
  const m = raw.match(/window\.__b64buf\+="([^"]+)"/);
  if (!m) throw new Error('no chunk');
  return m[1];
}

const chunks = {};
for (let i = 4; i <= 13; i++) {
  const raw = fs.readFileSync(path.join(dir, manifest[i].name), 'utf8').trim();
  chunks[String(i)] = extractChunk(raw);
}

const port = Number(process.env.CHUNK_PORT || 8765);
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const m = req.url?.match(/^\/chunk\/(\d+)$/);
  if (!m) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const body = chunks[m[1]];
  if (!body) {
    res.writeHead(404);
    res.end('missing');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(body);
});

server.listen(port, '127.0.0.1', () => {
  console.log(JSON.stringify({ port, chunks: Object.keys(chunks) }));
});
