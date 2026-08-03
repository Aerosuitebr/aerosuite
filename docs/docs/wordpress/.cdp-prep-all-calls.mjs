import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'd0bf03';
for (let n = 0; n <= 29; n++) {
  const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, {
    cwd: dir,
    encoding: 'utf8',
  }).trim();
  fs.writeFileSync(path.join(dir, `.cdp-call-${n}.json`), out);
}
console.log(JSON.stringify({ ok: true, viewId, count: 30 }));
