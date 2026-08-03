import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2];
const raw = src ? fs.readFileSync(src, 'utf8') : fs.readFileSync(0, 'utf8');
fs.writeFileSync(path.join(dir, '.cdp-mcp-result.json'), raw);
const j = JSON.parse(raw);
const value = j?.result?.value ?? j?.value ?? j;
console.log(JSON.stringify(value));
