import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../src');

const BROKEN = /transition:\s*color\s*,\s*background-color\s*,\s*border-color\s*,\s*box-shadow\s*,\s*transform\s*,\s*opacity\s*;/g;
const FIXED =
  'transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;';

let count = 0;
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!['node_modules', 'dist', '.angular'].includes(ent.name)) walk(p);
    } else if (/\.(scss|ts|css)$/.test(ent.name)) {
      let c = fs.readFileSync(p, 'utf8');
      if (BROKEN.test(c)) {
        BROKEN.lastIndex = 0;
        c = c.replace(BROKEN, FIXED);
        fs.writeFileSync(p, c);
        count++;
        console.log(p);
      }
    }
  }
}
walk(root);
console.log('Fixed files:', count);
