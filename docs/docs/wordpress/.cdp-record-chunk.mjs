import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const respPath = process.argv[2];
const steps = process.argv.slice(3).map(Number);
const raw = fs.readFileSync(respPath, 'utf8');
const resp = JSON.parse(raw);
const out = resp?.result?.value ?? resp?.value;
if (!out || typeof out !== 'object') {
  console.error(JSON.stringify({ error: 'BAD_RESPONSE', keys: Object.keys(resp || {}) }));
  process.exit(2);
}
for (const step of steps) {
  const v = out[step] ?? out[String(step)];
  if (v === undefined) {
    console.error(JSON.stringify({ error: 'MISSING_STEP', step, keys: Object.keys(out) }));
    process.exit(2);
  }
  const tmp = path.join(dir, `.cdp-rec-${step}.json`);
  fs.writeFileSync(tmp, JSON.stringify({ result: { value: v } }));
  const r = spawnSync('node', ['.cdp-finish-step.mjs', String(step), tmp], {
    cwd: dir,
    encoding: 'utf8',
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log(JSON.stringify({ ok: true, recorded: steps }));
