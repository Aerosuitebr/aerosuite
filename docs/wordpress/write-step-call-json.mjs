import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '807f76';
const mcp = path.join(dir, `.mcp-step-${n}-payload.json`);
const inv = path.join(dir, `.invoke-step-${n}.json`);
let payload;
if (fs.existsSync(mcp)) {
  payload = JSON.parse(fs.readFileSync(mcp, 'utf8'));
} else {
  payload = JSON.parse(fs.readFileSync(inv, 'utf8'));
}
payload.viewId = viewId;
const out = path.join(dir, `.cdp-mcp-call-${n}.json`);
fs.writeFileSync(out, JSON.stringify(payload));
fs.writeFileSync(path.join(dir, '.cdp-mcp-call.json'), JSON.stringify(payload));
