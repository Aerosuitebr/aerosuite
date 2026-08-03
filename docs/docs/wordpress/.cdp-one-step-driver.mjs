/**
 * One-step-at-a-time driver for agent MCP loop.
 * prep <n> [viewId]  -> writes .cdp-await-N-args.json + .cdp-current-mcp-args.json
 * record <n>         -> reads .cdp-mcp-last-result.json, records, returns next step
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = process.argv[3];
const viewId = process.argv[4] || '868beb';

if (cmd === 'prep') {
  spawnSync('node', ['.cdp-prep-ready.mjs', n, viewId], { cwd: dir, stdio: 'pipe' });
  const ready = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-step-${n}.mcp-ready.json`), 'utf8'));
  const payload = { viewId, method: ready.method, params: ready.params };
  fs.writeFileSync(path.join(dir, `.cdp-await-${n}-args.json`), JSON.stringify(payload));
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(payload));
  console.log(JSON.stringify({ step: Number(n), viewId, exprLen: payload.params.expression.length }));
  process.exit(0);
}

if (cmd === 'record') {
  const raw = fs.readFileSync(path.join(dir, '.cdp-mcp-last-result.json'), 'utf8');
  const rec = spawnSync('node', ['.cdp-run-all-mcp-steps.mjs', 'record', n, raw], {
    cwd: dir,
    encoding: 'utf8',
  });
  process.stdout.write(rec.stdout || '');
  process.stderr.write(rec.stderr || '');
  process.exit(rec.status ?? 0);
}

console.error('usage: prep <n> [viewId] | record <n>');
process.exit(2);
