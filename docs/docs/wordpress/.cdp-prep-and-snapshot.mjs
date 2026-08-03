import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const viewId = process.argv[3] || '3a0808';
execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
const src = path.join(dir, '.cdp-current-mcp-args.json');
const snap = path.join(dir, `.cdp-snap-${n}.json`);
const args = JSON.parse(fs.readFileSync(src, 'utf8'));
fs.writeFileSync(snap, JSON.stringify(args));
console.log(JSON.stringify({ step: Number(n), snap, viewId: args.viewId, exprLen: args.params?.expression?.length ?? 0 }));
