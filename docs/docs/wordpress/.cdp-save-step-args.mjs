import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'd0bf03';
const out = path.join(dir, `.cdp-step-${n}-args.json`);
const raw = execFileSync(process.execPath, ['.cdp-exec-invoke-step.mjs', String(n), viewId], {
  cwd: dir,
  encoding: 'utf8',
});
fs.writeFileSync(out, raw, 'utf8');
console.log(JSON.stringify({ step: n, len: raw.length }));
