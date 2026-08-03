import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2];
const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
const out = path.join(dir, '.cdp-mcp-result.json');
if (fs.existsSync(out)) fs.unlinkSync(out);
fs.writeFileSync(path.join(dir, '.cdp-current-call.json'), JSON.stringify(j));
console.log(JSON.stringify({ ready: true, file, exprLen: j.params?.expression?.length ?? 0 }));
