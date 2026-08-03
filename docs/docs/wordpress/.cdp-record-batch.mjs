/** Record each step value from batch MCP result object. */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
const raw = fs.readFileSync(path.join(dir, '.cdp-mcp-last-result.json'), 'utf8');
const resp = JSON.parse(raw);
const val = resp?.result?.value ?? resp?.result?.result?.value ?? resp?.value;
const out = val?.out ?? val;
if (val?.stopped != null) {
  console.log(JSON.stringify({ stopped: val.stopped, out }));
}
for (let n = start; n <= end; n++) {
  if (out?.[n] === undefined) continue;
  const stepResp = JSON.stringify({ result: { type: 'object', value: out[n] } });
  fs.writeFileSync(path.join(dir, '.cdp-mcp-last-result.json'), stepResp);
  const rec = spawnSync('node', ['.cdp-run-all-mcp-steps.mjs', 'record', String(n), stepResp], {
    cwd: dir,
    encoding: 'utf8',
  });
  process.stdout.write(rec.stdout || '');
  if (rec.status !== 0) {
    process.stderr.write(rec.stderr || '');
    process.exit(rec.status ?? 0);
  }
}
if (val?.stopped != null) process.exit(1);
console.log(JSON.stringify({ ok: true, start, end }));
