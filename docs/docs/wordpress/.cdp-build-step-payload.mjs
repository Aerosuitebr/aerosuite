import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'd0bf03';
const src = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-step-${n}.json`), 'utf8'));
const payload = {
  method: src.method,
  params: src.params,
  viewId,
};
fs.writeFileSync(path.join(dir, '.cdp-step-payload.json'), JSON.stringify(payload));
console.log(JSON.stringify({ ok: true, step: n, exprLen: src.params?.expression?.length ?? 0 }));
