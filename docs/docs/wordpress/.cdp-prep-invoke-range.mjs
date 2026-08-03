/** Generate .cdp-step-N-invoke.json for steps start..end */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] || '2effaf';

for (let n = start; n <= end; n++) {
  execSync(`node .cdp-mcp-run-step.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const c = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-call-now.json'), 'utf8'));
  fs.writeFileSync(
    path.join(dir, `.cdp-step-${n}-invoke.json`),
    JSON.stringify({ method: c.method, params: c.params, viewId }),
  );
  process.stderr.write(`prep ${n} exprLen=${c.params.expression.length}\n`);
}
console.log(JSON.stringify({ ok: true, start, end, viewId }));
