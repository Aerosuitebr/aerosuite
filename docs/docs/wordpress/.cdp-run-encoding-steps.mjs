import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const steps = ['enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run'];
const out = [];
for (const step of steps) {
  const expression = fs.readFileSync(path.join(dir, `.expr-only-${step}.txt`), 'utf8').trim();
  out.push({ step, len: expression.length, expression });
}
fs.writeFileSync(path.join(dir, 'cdp-encoding-steps.json'), JSON.stringify(out), 'utf8');
console.log('wrote', out.map((o) => `${o.step}:${o.len}`).join(' '));
