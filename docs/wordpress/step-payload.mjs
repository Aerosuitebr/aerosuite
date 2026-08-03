import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const idx = Number(process.argv[2]);
const viewId = process.argv[3] || '7c1495';
const src = path.join(dir, `.invoke-step-${idx}.json`);
const j = JSON.parse(fs.readFileSync(src, 'utf8'));
j.viewId = viewId;
const out = path.join(dir, '.cdp-step-payload.json');
fs.writeFileSync(out, JSON.stringify(j));
console.log(JSON.stringify({ idx, viewId, exprLen: j.params?.expression?.length ?? 0 }));
