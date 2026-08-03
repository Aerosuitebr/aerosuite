import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const batchFile = process.argv[2];
const viewId = process.argv[3] || '6115f3';
const outFile = process.argv[4] || path.join(dir, '.cdp-temp-args.json');
const j = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
fs.writeFileSync(outFile, JSON.stringify({ viewId, method: j.method, params: j.params }));
