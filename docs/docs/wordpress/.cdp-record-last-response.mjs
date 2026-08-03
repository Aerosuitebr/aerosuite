import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const respPath = path.join(dir, '.cdp-last-mcp-response.json');
const resp = JSON.parse(fs.readFileSync(respPath, 'utf8'));
const val =
  resp?.result?.result?.value ??
  resp?.result?.value ??
  resp?.value;

function recordOne(step, value) {
  const payload = JSON.stringify({ result: { result: { value } } });
  const res = spawnSync(
    'node',
    ['.cdp-run-all-mcp-steps.mjs', 'record', String(step), payload],
    { cwd: dir, encoding: 'utf8' }
  );
  process.stdout.write(res.stdout || '');
  if (res.status !== 0) {
    process.stderr.write(res.stderr || '');
    process.exit(res.status ?? 1);
  }
}

if (val?.out && typeof val.out === 'object') {
  for (const [k, v] of Object.entries(val.out).sort((a, b) => Number(a) - Number(b))) {
    recordOne(Number(k), v);
  }
} else {
  const numeric = Object.keys(val || {}).filter((k) => /^\d+$/.test(k));
  if (numeric.length) {
    for (const k of numeric.sort((a, b) => Number(a) - Number(b))) {
      recordOne(Number(k), val[k]);
    }
  } else {
    const step = Number(process.argv[2]);
    if (!step && step !== 0) {
      console.error('usage: record-last <step> OR combined out object');
      process.exit(2);
    }
    recordOne(step, val);
  }
}
