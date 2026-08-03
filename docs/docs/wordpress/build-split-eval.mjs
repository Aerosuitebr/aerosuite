import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const expr = fs.readFileSync(path.join(dir, 'mega-eval.js'), 'utf8');
const PART = 48000;
const parts = [];
for (let i = 0; i < expr.length; i += PART) {
  parts.push(expr.slice(i, i + PART));
}
const outDir = path.join(dir, 'mega-eval-parts');
fs.mkdirSync(outDir, { recursive: true });
parts.forEach((p, i) => {
  const wrap =
    i === 0
      ? `window.__mega='${p.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}';'ok'`
      : `window.__mega+='${p.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}';'ok'`;
  fs.writeFileSync(path.join(outDir, `part-${i}.js`), wrap);
});
const final = `eval(window.__mega)`;
fs.writeFileSync(path.join(outDir, 'part-final.js'), final);
console.log('parts', parts.length, 'sizes', parts.map((p) => p.length), 'final', final.length);
