import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'f488e5';
const readyPath = path.join(dir, `.cdp-step-${n}.mcp-ready.json`);
const a = JSON.parse(fs.readFileSync(readyPath, 'utf8'));
a.viewId = viewId;
fs.writeFileSync(path.join(dir, '.cdp-mcp-invoke-now.json'), JSON.stringify({ step: n, ...a }));
console.log(JSON.stringify({ step: n, exprLen: a.params?.expression?.length ?? 0 }));
