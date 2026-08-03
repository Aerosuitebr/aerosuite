import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'bb8370';
const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${step}.json`), 'utf8'));
const payload = { method: 'Runtime.evaluate', viewId, params };
fs.writeFileSync(path.join(dir, '.cdp-mcp-invoke-now.json'), JSON.stringify(payload, null, 2));
console.log(JSON.stringify({ step, viewId, exprLen: params.expression?.length ?? 0 }));
