import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
let total = '';
for (let i = 0; i <= 4; i++) {
  const s = fs.readFileSync(path.join(dir, `deploy-encoding-${i}.js`), 'utf8');
  const m = s.match(/\+\"([^\"]+)\"/);
  if (!m) {
    console.error('no match', i);
    process.exit(1);
  }
  try {
    atob(m[1]);
    console.log('chunk', i, 'part', m[1].length, 'ok');
  } catch (e) {
    console.error('chunk', i, 'invalid b64', e.message);
    process.exit(1);
  }
  total += m[1];
}
try {
  const decoded = atob(total);
  console.log('total b64', total.length, 'decoded', decoded.length, 'hasHero', decoded.includes('as-hero-v2'));
} catch (e) {
  console.error('total invalid', e.message);
  process.exit(1);
}
