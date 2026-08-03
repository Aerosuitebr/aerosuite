import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(dir, 'mcp-params');
fs.mkdirSync(outDir, { recursive: true });
const manifest = JSON.parse(
  fs.readFileSync(path.join(dir, 'split-invokes', 'manifest.json'), 'utf8')
);
let i = 0;
for (const f of manifest) {
  if (f === 'split-000-init.json') continue;
  const inv = JSON.parse(fs.readFileSync(path.join(dir, 'split-invokes', f), 'utf8'));
  fs.writeFileSync(
    path.join(outDir, `p-${String(i).padStart(2, '0')}.json`),
    JSON.stringify(inv.params)
  );
  i++;
}
console.log('wrote', i);
