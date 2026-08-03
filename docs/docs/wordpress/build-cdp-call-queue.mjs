import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b83599';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);

const queue = [];

for (let n = start; n <= end; n++) {
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-step-${n}.json`), 'utf8'));
  const exprLen = args.params?.expression?.length ?? 0;
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, '.invoke-steps-manifest.json'), 'utf8'));
  const rel = manifest.steps[n];

  if (exprLen > 3500) {
    execSync(`node mcp-chunk-exec.mjs emit-chunks ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
    const plan = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-chunk-plan-${n}.json`), 'utf8'));
    for (const call of plan.calls) queue.push({ step: n, rel, type: 'chunk', call });
    const fin = JSON.parse(execSync(`node mcp-chunk-exec.mjs emit-final ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' }));
    queue.push({ step: n, rel, type: 'final', call: fin });
  } else {
    const call = { viewId, method: args.method || 'Runtime.evaluate', params: args.params };
    queue.push({ step: n, rel, type: 'single', call });
  }
}

fs.writeFileSync(path.join(dir, '.cdp-call-queue.json'), JSON.stringify({ viewId, start, end, count: queue.length, queue }), 'utf8');
console.log(JSON.stringify({ viewId, count: queue.length, steps: `${start}-${end}` }));
