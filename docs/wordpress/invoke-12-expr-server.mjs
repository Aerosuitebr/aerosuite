/**
 * Dedicated expr server for invoke-12 run (port 18766).
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
export const PORT = 18780;
const exprPath = path.join(dir, '.invoke-12-expr.txt');

export function setExprFromStep(step, viewId = 'bb8370') {
  const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${step}.json`), 'utf8'));
  fs.writeFileSync(exprPath, params.expression, 'utf8');
  fs.writeFileSync(path.join(dir, '.invoke-12-expr-meta.json'), JSON.stringify({ step, viewId, exprLen: params.expression.length }));
  return { step, viewId, exprLen: params.expression.length };
}

export function bootstrapCall(viewId = 'bb8370') {
  const expr = `(async()=>{const e=await(await fetch('http://127.0.0.1:${PORT}/expr')).text();let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()`;
  return {
    method: 'Runtime.evaluate',
    viewId,
    params: { expression: expr, awaitPromise: true, returnByValue: true },
  };
}

const cmd = process.argv[2];
if (cmd === 'set') {
  console.log(JSON.stringify(setExprFromStep(process.argv[3], process.argv[4] || 'bb8370')));
  process.exit(0);
}
if (cmd === 'bootstrap') {
  const meta = fs.existsSync(path.join(dir, '.invoke-12-expr-meta.json'))
    ? JSON.parse(fs.readFileSync(path.join(dir, '.invoke-12-expr-meta.json'), 'utf8'))
    : { viewId: 'bb8370' };
  console.log(JSON.stringify(bootstrapCall(meta.viewId)));
  process.exit(0);
}
if (cmd === 'start') {
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
  server.listen(PORT, '127.0.0.1', () => console.log(JSON.stringify({ listening: PORT })));
}
