/**
 * Prepare MCP args for step N; save MCP response and record.
 * Usage: node .cdp-agent-mcp-loop.mjs prep <n> <viewId>
 *        node .cdp-agent-mcp-loop.mjs save <n> <responseJsonFile>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = Number(process.argv[3]);
const viewId = process.argv[4] || 'dc48c3';

if (cmd === 'prep') {
  const callPath = path.join(dir, `.cdp-call-${n}.json`);
  if (!fs.existsSync(callPath)) {
    spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'prep', String(n), viewId], { cwd: dir, stdio: 'inherit' });
  }
  const c = JSON.parse(fs.readFileSync(callPath, 'utf8'));
  const out = { method: c.method, params: c.params, viewId };
  fs.writeFileSync(path.join(dir, '.cdp-mcp-args-now.json'), JSON.stringify(out));
  console.log(JSON.stringify({ step: n, exprLen: c.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'save') {
  const raw = fs.readFileSync(process.argv[4], 'utf8');
  const resp = JSON.parse(raw);
  const out = resp.result ? { result: resp.result } : resp;
  fs.writeFileSync(path.join(dir, `.cdp-mcp-resp-${n}.json`), JSON.stringify(out));
  const proc = spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'record', String(n)], {
    cwd: dir,
    input: JSON.stringify(out),
    encoding: 'utf8',
  });
  process.stdout.write(proc.stdout || '');
  process.stderr.write(proc.stderr || '');
  process.exit(proc.status ?? 0);
}

console.error('usage: prep N [viewId] | save N responseFile');
process.exit(2);
