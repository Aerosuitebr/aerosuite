import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'split-invokes/manifest.json'), 'utf8'));
const out = [];
for (let i = 4; i <= 11; i++) {
  const file = manifest[i];
  const inv = JSON.parse(fs.readFileSync(path.join(dir, 'split-invokes', file), 'utf8'));
  out.push({
    i,
    file,
    step: inv.step,
    awaitPromise: inv.params.awaitPromise,
    returnByValue: inv.params.returnByValue,
    expression: inv.params.expression,
  });
}
fs.writeFileSync(path.join(dir, 'splits-4-11.json'), JSON.stringify(out));
