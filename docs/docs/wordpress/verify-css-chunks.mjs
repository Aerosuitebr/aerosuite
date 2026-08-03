import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
let b64 = '';
for (let i = 1; i <= 5; i++) {
  const s = fs.readFileSync(path.join(dir, `deploy-run-${i}.js`), 'utf8');
  const m = s.match(/\+\"([^"]+)\"/);
  if (m) b64 += m[1];
}
const css = Buffer.from(b64, 'base64').toString('utf8');
console.log('decoded', css.length, 'has hero-v2', css.includes('as-hero-v2'), 'has grid', css.includes('as-hero-v2__grid'));
