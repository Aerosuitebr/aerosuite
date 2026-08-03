import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b83599';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 29);

const BOOT =
  "(async()=>{const e=await(await fetch('http://127.0.0.1:18765/expr')).text();let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()";

for (let n = start; n <= end; n++) {
  execSync(`node prep-expr-bootstrap.mjs ${viewId} ${n}`, { cwd: dir, stdio: 'pipe' });
  fs.writeFileSync(
    path.join(dir, '.cdp-bootstrap-call.json'),
    JSON.stringify({
      viewId,
      method: 'Runtime.evaluate',
      params: { expression: BOOT, awaitPromise: true, returnByValue: true },
    })
  );
  fs.writeFileSync(path.join(dir, '.cdp-current-step.txt'), String(n));
  console.log(JSON.stringify({ awaitStep: n, viewId }));
  process.exit(0);
}
console.log(JSON.stringify({ done: true }));
