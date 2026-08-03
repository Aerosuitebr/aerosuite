/**
 * Serves current CDP expression for browser fetch (avoids huge MCP payloads).
 * Usage: node .cdp-expr-server.mjs start
 *        node .cdp-expr-server.mjs set <argsJsonPath> [viewId]
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = 18765;
const exprPath = path.join(dir, '.cdp-expr-current.txt');
const metaPath = path.join(dir, '.cdp-expr-meta.json');

const cmd = process.argv[2];

if (cmd === 'set') {
  const src = process.argv[3] || path.join(dir, '.cdp-mcp-args-current.json');
  const viewId = process.argv[4] || '807f76';
  const args = JSON.parse(fs.readFileSync(src, 'utf8'));
  args.viewId = viewId;
  fs.writeFileSync(exprPath, args.params.expression, 'utf8');
  fs.writeFileSync(metaPath, JSON.stringify({ viewId: args.viewId }), 'utf8');
  console.log(JSON.stringify({ ok: true, exprLen: args.params.expression.length, viewId: args.viewId }));
  process.exit(0);
}

const bootstrap = `(async()=>{const e=await(await fetch('http://127.0.0.1:${PORT}/expr')).text();let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()`;

if (cmd === 'bootstrap') {
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : { viewId: '807f76' };
  console.log(
    JSON.stringify({
      viewId: meta.viewId,
      method: 'Runtime.evaluate',
      params: { expression: bootstrap, awaitPromise: true, returnByValue: true },
    })
  );
  process.exit(0);
}

if (cmd !== 'start') {
  console.error('usage: start | set <argsJson> [viewId] | bootstrap');
  process.exit(2);
}

const server = http.createServer((req, res) => {
  if (req.url === '/expr' || req.url === '/expr/') {
    const body = fs.existsSync(exprPath) ? fs.readFileSync(exprPath, 'utf8') : '';
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(body);
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(JSON.stringify({ listening: PORT }));
});
