import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const idx = Number(process.argv[2] ?? 0);
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'split-invokes/manifest.json'), 'utf8'));
const file = manifest[idx];
if (!file) {
  console.error('NO_FILE', idx);
  process.exit(1);
}
const j = JSON.parse(fs.readFileSync(path.join(dir, 'split-invokes', file), 'utf8'));
const out = { file, step: j.step, method: j.method, params: j.params, viewId: '097ced' };
fs.writeFileSync(path.join(dir, 'mcp-one.json'), JSON.stringify(out));
console.log(file, j.step);
