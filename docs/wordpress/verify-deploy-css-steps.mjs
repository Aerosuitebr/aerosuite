import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
let b64 = '';
for (let i = 1; i <= 5; i++) {
  const s = fs.readFileSync(path.join(dir, `deploy-css-step-${i}.js`), 'utf8');
  const m = s.match(/\+\"([\s\S]*)\";return\{chunk/);
  if (!m) throw new Error('fail ' + i);
  b64 += m[1];
}
const css = Buffer.from(b64, 'base64').toString('utf8');
const ref = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
console.log('b64', b64.length, 'css', css.length, 'ref', ref.length);
console.log('grid', css.includes('as-hero-v2__grid'), 'match', css === ref);
