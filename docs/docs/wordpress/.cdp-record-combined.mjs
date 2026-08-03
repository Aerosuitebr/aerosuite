/**
 * Record combined runner results into agent state.
 * Usage: node .cdp-record-combined.mjs <mcp-response-json-file> <step>...
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const respPath = process.argv[2];
const steps = process.argv.slice(3).map(Number);
const raw = fs.readFileSync(respPath, 'utf8');
const resp = JSON.parse(raw);
const value = resp?.result?.value ?? resp?.value ?? resp?.result ?? resp;
const out = value?.out ?? value;

for (const step of steps) {
  const v = out?.[step] ?? out?.[String(step)] ?? (step === steps[0] && !out ? value : undefined);
  if (v === undefined) {
    console.error(JSON.stringify({ error: 'MISSING_STEP', step, keys: Object.keys(out || {}) }));
    process.exit(2);
  }
  const r = spawnSync('node', ['.cdp-agent-mcp-runner.mjs', 'record', String(step), JSON.stringify({ result: { value: v } })], {
    cwd: dir,
    encoding: 'utf8',
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log(JSON.stringify({ recorded: steps }));
