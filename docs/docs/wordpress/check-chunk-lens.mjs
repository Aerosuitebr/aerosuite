import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
let total = 0;
for (let i = 0; i <= 4; i++) {
  const s = fs.readFileSync(path.join(dir, `deploy-encoding-${i}.js`), 'utf8');
  const m = s.match(/\+\"([^\"]+)\"/);
  const part = m ? m[1].length : 0;
  total += part;
  console.log('chunk', i, 'append', part);
}
console.log('expected total', total);
