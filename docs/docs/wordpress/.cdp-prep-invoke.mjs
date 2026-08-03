import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2];
const viewId = process.argv[3] || 'dab36f';
const a = JSON.parse(fs.readFileSync(path.join(dir, src), 'utf8'));
const out = { viewId, method: a.method, params: a.params };
fs.writeFileSync(path.join(dir, '.cdp-mcp-invoke-now.json'), JSON.stringify(out));
console.log(JSON.stringify({ src, exprLen: a.params?.expression?.length ?? 0 }));
