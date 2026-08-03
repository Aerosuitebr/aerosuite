import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const base = path.dirname(fileURLToPath(import.meta.url));
const chunks = [];
for (let i = 0; i <= 13; i++) {
  chunks.push({
    file: `deploy-manifest-${i}.js`,
    expression: fs.readFileSync(path.join(base, `deploy-manifest-${i}.js`), 'utf8').trim(),
  });
}
chunks.push({
  file: 'deploy-manifest-run.js',
  expression: fs.readFileSync(path.join(base, 'deploy-manifest-run.js'), 'utf8').trim(),
});
const out = path.join(base, '.cdp-chunk-payloads.json');
fs.writeFileSync(out, JSON.stringify(chunks));
console.log('wrote', out, 'chunks', chunks.length);
