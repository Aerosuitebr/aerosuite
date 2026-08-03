import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(__dirname, '..', 'src', 'app');

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && ent.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

const re = /^\s*providers:\s*\[\s*ConfirmationService\s*\],?\s*$/gm;

for (const file of walk(appDir)) {
  let s = fs.readFileSync(file, 'utf8');
  const next = s.replace(re, '');
  if (next !== s) {
    fs.writeFileSync(file, next, 'utf8');
    console.log('stripped:', path.relative(path.join(__dirname, '..'), file));
  }
}
