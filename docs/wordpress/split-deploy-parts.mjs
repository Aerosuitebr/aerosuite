import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const ex = fs.readFileSync(path.join(dir, 'deploy-hero-logo-eval.js'), 'utf8');
const m = ex.match(/atob\("([^"]+)"\)/);
const b64 = m[1];
const mid = Math.floor(b64.length / 2);
fs.writeFileSync(
  path.join(dir, 'deploy-hero-logo-parts.json'),
  JSON.stringify({ p1: b64.slice(0, mid), p2: b64.slice(mid) })
);
console.log('parts', mid, b64.length - mid);
