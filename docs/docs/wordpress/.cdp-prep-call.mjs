import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '51e397';
const j = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-live-step-${n}.json`), 'utf8'));
const call = { viewId, method: j.method, params: j.params };
fs.writeFileSync(path.join(dir, '.cdp-temp-call.json'), JSON.stringify(call));
console.log(JSON.stringify({ step: n, exprLen: call.params?.expression?.length ?? 0 }));
