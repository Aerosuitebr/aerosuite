/**
 * Agent helper: prep step N, print args path; after MCP, pass result path as argv[3].
 * Usage:
 *   node .cdp-agent-one-step.mjs prep 0 868beb
 *   node .cdp-agent-one-step.mjs save 0 <path-to-mcp-json>
 *   node .cdp-agent-one-step.mjs record 0
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
process.chdir(dir);

const cmd = process.argv[2];
const n = process.argv[3];
const viewId = process.argv[4] || '868beb';
const extra = process.argv[5];

if (cmd === 'prep') {
  const r = JSON.parse(fs.readFileSync(`.cdp-step-${n}.mcp-ready.json`, 'utf8'));
  const payload = { viewId, method: r.method, params: r.params };
  fs.writeFileSync(`.cdp-await-${n}-args.json`, JSON.stringify(payload));
  console.log(JSON.stringify({ step: Number(n), exprLen: payload.params.expression.length }));
  process.exit(0);
}

if (cmd === 'save') {
  const raw = fs.readFileSync(extra, 'utf8');
  fs.writeFileSync('.cdp-mcp-last-result.json', raw);
  console.log('saved');
  process.exit(0);
}

if (cmd === 'record') {
  const raw = fs.readFileSync('.cdp-mcp-last-result.json', 'utf8');
  const r = spawnSync('node', ['.cdp-run-all-mcp-steps.mjs', 'record', n, raw], {
    cwd: dir,
    encoding: 'utf8',
  });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  process.exit(r.status ?? 0);
}

console.error('usage: prep|save|record');
process.exit(1);
