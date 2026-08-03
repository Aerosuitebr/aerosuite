import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const steps = JSON.parse(fs.readFileSync(path.join(dir, 'deploy-steps.json'), 'utf8'));

const body = `(async () => {
  const steps = ${JSON.stringify(steps.map((s) => ({ expr: s.expr, await: !!s.await })))};
  const out = [];
  for (const s of steps) {
    const fn = eval(s.expr);
    const v = s.await ? await fn() : fn();
    out.push(v);
  }
  return out;
})()`;

const outPath = path.join(dir, 'deploy-runner-eval.js');
fs.writeFileSync(outPath, body);
console.log('runner bytes', body.length);
