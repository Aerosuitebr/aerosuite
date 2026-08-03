import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const files = [
  ...Array.from({ length: 14 }, (_, i) => `deploy-manifest-${i}.js`),
  'deploy-manifest-run.js',
];

for (const f of files) {
  const expr = fs.readFileSync(path.join(dir, f), 'utf8');
  console.log(JSON.stringify({ file: f, len: expr.length, expr }));
}
