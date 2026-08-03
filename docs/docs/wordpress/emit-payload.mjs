import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const idx = Number(process.argv[2] || 0);
const all = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-all-payloads.json'), 'utf8'));
const item = all[idx];
if (!item) {
  console.error('no payload', idx);
  process.exit(1);
}
fs.writeFileSync(path.join(dir, '.cdp-mcp-args-only.json'), JSON.stringify(item.payload), 'utf8');
console.log(item.name, idx);
