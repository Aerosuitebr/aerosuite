import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '754d2e';
const ready = path.join(dir, `.cdp-step-${n}.mcp-ready.json`);
const call = path.join(dir, `.cdp-call-${n}.json`);
const src = fs.existsSync(ready) ? ready : call;
const a = JSON.parse(fs.readFileSync(src, 'utf8'));
a.viewId = viewId;
fs.writeFileSync(path.join(dir, '.cdp-one-step-args.json'), JSON.stringify(a));
