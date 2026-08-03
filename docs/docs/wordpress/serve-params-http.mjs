/**
 * Serves .params-*.json and .mcp-step-css-q1.json for in-browser fetch+eval.
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PARAMS_PORT || 8765);

const files = {
  'css-preload': '.params-css-preload-17354.json',
  'css-q1': '.mcp-step-css-q1.json',
  'css-q2': '.params-css-q2.json',
  'css-q3': '.params-css-q3.json',
  'css-q4': '.params-css-q4.json',
  'css-verify': '.params-css-verify.json',
  'css-finalize': '.params-css-finalize.json',
  'enc-init': '.params-enc-init.json',
  'enc-0': '.params-enc-0.json',
  'enc-1': '.params-enc-1.json',
  'enc-2': '.params-enc-2.json',
  'enc-3': '.params-enc-3.json',
  'enc-run': '.params-enc-run.json',
};

function load(name) {
  const rel = files[name];
  if (!rel) return null;
  const raw = fs.readFileSync(path.join(dir, rel), 'utf8');
  if (name === 'css-q1') return JSON.parse(raw).params;
  return JSON.parse(raw);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const name = (req.url || '/').replace(/^\//, '').split('?')[0];
  if (!name) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Object.keys(files)));
    return;
  }
  try {
    const data = load(name);
    if (!data) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(JSON.stringify({ ok: true, port, steps: Object.keys(files) }));
});
