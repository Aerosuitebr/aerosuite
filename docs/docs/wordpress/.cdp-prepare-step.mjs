import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const viewId = process.argv[3] || 'ae099b';
const args = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-live-step-${n}.json`), 'utf8'));
args.viewId = viewId;
const out = path.join(dir, '.cdp-current-mcp-args.json');
fs.writeFileSync(out, JSON.stringify(args));
console.log(JSON.stringify({ step: Number(n), exprLen: args.params?.expression?.length ?? 0 }));
