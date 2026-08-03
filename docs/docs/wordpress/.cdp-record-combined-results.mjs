/** Record steps 2-29 from combined eval result file. Usage: node .cdp-record-combined-results.mjs <combinedRespFile> */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const results = raw?.result?.value ?? raw?.value ?? raw;
const start = Number(process.argv[3] ?? 2);
const end = Number(process.argv[4] ?? 29);

for (let n = start; n <= end; n++) {
  const value = results[n] ?? results[String(n)];
  if (value === undefined) {
    console.error(`missing result for step ${n}`);
    process.exit(1);
  }
  const out = { result: { type: 'object', value } };
  fs.writeFileSync(path.join(dir, `.cdp-mcp-resp-${n}.json`), JSON.stringify(out));
  const proc = spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'record', String(n)], {
    cwd: dir,
    input: JSON.stringify(out),
    encoding: 'utf8',
  });
  process.stdout.write(proc.stdout || '');
  if (proc.status !== 0) {
    process.stderr.write(proc.stderr || '');
    process.exit(proc.status ?? 1);
  }
}
console.log(JSON.stringify({ ok: true, from: start, to: end }));
