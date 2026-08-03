import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || '258c93';
const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${step}.json`), 'utf8'));
const payload = { method: 'Runtime.evaluate', params, viewId };
fs.writeFileSync(path.join(dir, '.mcp-call-payload.json'), JSON.stringify(payload));
console.log(JSON.stringify({ step, viewId, exprLen: params.expression?.length ?? 0 }));
