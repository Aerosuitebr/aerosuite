import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
let b64 = '';
for (let i = 0; i < 4; i++) {
  const j = fs.readFileSync(path.join(dir, `deploy-encoding-${i}.js`), 'utf8');
  const m = j.match(/\+("(?:\\.|[^"\\])+")/);
  if (m) b64 += JSON.parse(m[1]);
}
const t = Buffer.from(b64, 'base64').toString('utf8');
console.log('len', t.length);
console.log('O dia a dia do hangar', t.includes('O dia a dia do hangar'));
console.log('Um fio só', t.includes('Um fio só'));
console.log('O caos', t.includes('O caos que você conhece'));
