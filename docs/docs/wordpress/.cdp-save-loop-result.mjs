import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const raw = fs.readFileSync(0, 'utf8');
const j = JSON.parse(raw);
const val = j?.result?.value ?? j?.value;
const outDir = path.join(dir, '.cdp-mcp-results');
fs.mkdirSync(outDir, { recursive: true });

if (val?.stopped != null) {
  for (const [k, v] of Object.entries(val.out || {})) {
    fs.writeFileSync(path.join(outDir, `${k}.json`), JSON.stringify({ result: { value: v } }));
  }
  console.log(JSON.stringify({ stopped: val.stopped, saved: Object.keys(val.out || {}).length }));
  process.exit(1);
}

for (const [k, v] of Object.entries(val?.out || {})) {
  fs.writeFileSync(path.join(outDir, `${k}.json`), JSON.stringify({ result: { value: v } }));
}
console.log(JSON.stringify({ stopped: null, saved: Object.keys(val?.out || {}).length }));
