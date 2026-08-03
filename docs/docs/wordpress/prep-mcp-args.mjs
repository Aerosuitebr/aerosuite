import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2];
const rel = process.argv[3];
const src = path.isAbsolute(rel) ? rel : path.join(dir, rel);
const j = JSON.parse(fs.readFileSync(src, 'utf8'));
const args = j.arguments || j;
args.viewId = viewId;
const out = path.join(dir, '.cdp-pending-args.json');
fs.writeFileSync(out, JSON.stringify(args));
const exprLen = args.params?.expression?.length ?? 0;
console.log(JSON.stringify({ file: rel, exprLen, method: args.method }));
