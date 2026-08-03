/**
 * Agent helper: for steps start..end, print NEXT_STEP with call JSON on stdout;
 * after agent writes .cdp-mcp-resp-N.json, run: node .cdp-run-mcp-loop.mjs done <n>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = Number(process.argv[3]);
const viewId = process.argv[4] || 'a3746c';
const start = Number(process.argv[5] ?? 2);
const end = Number(process.argv[6] ?? 29);

if (cmd === 'done') {
  const respPath = path.join(dir, `.cdp-mcp-resp-${n}.json`);
  if (!fs.existsSync(respPath)) {
    console.error(`missing ${respPath}`);
    process.exit(1);
  }
  const proc = spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'record', String(n)], {
    cwd: dir,
    input: fs.readFileSync(respPath, 'utf8'),
    encoding: 'utf8',
  });
  process.stdout.write(proc.stdout || '');
  process.stderr.write(proc.stderr || '');
  process.exit(proc.status ?? 1);
}

if (cmd === 'next') {
  const step = Number(process.argv[3]);
  const callPath = path.join(dir, `.cdp-call-${step}.json`);
  if (!fs.existsSync(callPath)) {
    spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'prep', String(step), viewId], {
      cwd: dir,
      stdio: 'inherit',
    });
  }
  const call = fs.readFileSync(callPath, 'utf8');
  console.log(`NEXT_STEP ${step}`);
  console.log(call);
  process.exit(0);
}

if (cmd === 'all-calls') {
  const calls = [];
  for (let i = start; i <= end; i++) {
    const p = path.join(dir, `.cdp-call-${i}.json`);
    if (!fs.existsSync(p)) {
      spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'prep', String(i), viewId], {
        cwd: dir,
        stdio: 'pipe',
      });
    }
    calls.push({ step: i, call: JSON.parse(fs.readFileSync(p, 'utf8')) });
  }
  fs.writeFileSync(path.join(dir, '.cdp-all-calls.json'), JSON.stringify(calls));
  console.log(JSON.stringify({ count: calls.length, file: '.cdp-all-calls.json' }));
}
