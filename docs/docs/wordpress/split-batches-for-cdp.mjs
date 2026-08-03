import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const SLICE = 5000;
const batchDir = path.join(dir, 'batch-evals');
const outDir = path.join(dir, 'cdp-slices');
fs.mkdirSync(outDir, { recursive: true });

const manifest = [];
for (const file of fs.readdirSync(batchDir).filter((f) => f.startsWith('batch-') && f.endsWith('.js')).sort()) {
  const code = fs.readFileSync(path.join(batchDir, file), 'utf8');
  const base = file.replace('.js', '');
  const parts = [];
  for (let i = 0; i < code.length; i += SLICE) parts.push(code.slice(i, i + SLICE));
  parts.forEach((part, idx) => {
    const esc = part.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const expr =
      idx === 0
        ? `window.__batch='${esc}';'ok'`
        : `window.__batch+='${esc}';'ok'`;
    const name = `${base}-slice-${idx}.js`;
    fs.writeFileSync(path.join(outDir, name), expr);
    manifest.push({ name, expr, awaitPromise: false });
  });
  manifest.push({
    name: `${base}-eval.js`,
    expr: `eval(window.__batch)`,
    awaitPromise: true,
  });
}
fs.writeFileSync(path.join(dir, 'cdp-slices-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('slices', manifest.length);
