/**
 * Emit steps to run; agent must call browser_cdp per step and run:
 *   node .cdp-run-steps-mcp-batch.mjs apply <n> <resultFile>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = '51e397';

if (cmd === 'emit') {
  const start = Number(process.argv[3]);
  const end = Number(process.argv[4]);
  for (let n = start; n <= end; n++) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-live-step-${n}.json`), 'utf8'));
    fs.writeFileSync(path.join(dir, `.cdp-mcp-call-${n}.json`), JSON.stringify({ viewId, method: j.method, params: j.params }));
  }
  console.log(JSON.stringify({ start, end, viewId, count: end - start + 1 }));
  process.exit(0);
}

if (cmd === 'apply') {
  const n = Number(process.argv[3]);
  const f = process.argv[4] || path.join(dir, '.cdp-temp-resp.json');
  const raw = fs.readFileSync(f, 'utf8');
  execFileSync('node', ['.cdp-mcp-exec-loop.mjs', 'record', String(n), raw], { cwd: dir, stdio: 'inherit' });
  process.exit(0);
}

console.error('usage: emit|apply');
process.exit(2);
