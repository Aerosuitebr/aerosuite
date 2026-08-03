import http from 'http';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.STEP_EXPR_PORT || 18766);
const viewId = process.argv[2] || '6eb035';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const n = (req.url || '/').replace(/^\//, '').split('?')[0];
  if (!n || !/^\d+$/.test(n)) {
    res.writeHead(404);
    res.end('use /N');
    return;
  }
  try {
    const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, {
      cwd: dir,
      encoding: 'utf8',
    }).trim();
    const args = JSON.parse(out);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ step: Number(n), expr: args.params.expression }));
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.error(`step-expr http://127.0.0.1:${port}/{step}`);
});
