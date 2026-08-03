import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 20);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '1031af';
const batch = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-batch-${start}-${end}-args.json`), 'utf8'));
batch.viewId = viewId;
fs.writeFileSync(path.join(dir, '.cdp-mcp-call-next.json'), JSON.stringify(batch));
console.log(JSON.stringify({ viewId, exprLen: batch.params.expression.length, file: '.cdp-mcp-call-next.json' }));
