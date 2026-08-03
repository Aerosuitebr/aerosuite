import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
let total = 0;
for (let i = 1; i <= 4; i++) {
  const e = fs.readFileSync(path.join(dir, `.cdp-css-b64-q${i}-expr.txt`), 'utf8');
  const m = e.match(/__cssb64\+="([^"]+)"/);
  if (!m) throw new Error('no chunk q' + i);
  total += m[1].length;
  console.log('q' + i, m[1].length);
}
console.log('total', total);
