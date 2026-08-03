/**
 * Run one CDP step: prep await args, read payload for MCP agent.
 * Usage: node .cdp-mcp-step-runner.mjs prep <n> [viewId]
 *        node .cdp-mcp-step-runner.mjs save-result <rawJsonFile>
 *        node .cdp-mcp-step-runner.mjs record <n>
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = process.argv[3];
const viewId = process.argv[4] || 'bfb4f3';

if (cmd === 'prep') {
  const r = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-step-${n}.mcp-ready.json`), 'utf8'));
  const payload = { viewId, method: r.method, params: r.params };
  fs.writeFileSync(path.join(dir, `.cdp-await-${n}-args.json`), JSON.stringify(payload));
  console.log(JSON.stringify({ step: Number(n), exprLen: payload.params.expression.length, viewId }));
  process.exit(0);
}

if (cmd === 'save-result') {
  const src = process.argv[4];
  const raw = src ? fs.readFileSync(src, 'utf8') : fs.readFileSync(0, 'utf8');
  fs.writeFileSync(path.join(dir, '.cdp-mcp-last-result.json'), raw);
  process.exit(0);
}

if (cmd === 'read-args') {
  const p = path.join(dir, `.cdp-await-${n}-args.json`);
  process.stdout.write(fs.readFileSync(p, 'utf8'));
  process.exit(0);
}

if (cmd === 'record') {
  const raw = fs.readFileSync(path.join(dir, '.cdp-mcp-last-result.json'), 'utf8');
  const rec = spawnSync('node', ['.cdp-run-all-mcp-steps.mjs', 'record', n, raw], { cwd: dir, encoding: 'utf8' });
  process.stdout.write(rec.stdout || '');
  process.stderr.write(rec.stderr || '');
  process.exit(rec.status ?? 0);
}

console.error('usage: prep <n> [viewId] | save-result <file> | record <n>');
process.exit(2);
