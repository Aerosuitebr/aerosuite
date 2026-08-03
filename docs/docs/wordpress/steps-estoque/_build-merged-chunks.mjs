/** Merge pairs of chunk steps into single CDP expressions. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const steps = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));

function extractB64(name) {
  const raw = fs.readFileSync(path.join(dir, name), 'utf8').trim();
  const m = raw.match(/window\.__b64buf\+="([^"]+)"/);
  if (!m) throw new Error('no b64 in ' + name);
  return m[1];
}

const pairs = [];
for (let i = 2; i <= 13; i += 2) {
  const a = steps[i];
  const b = steps[i + 1];
  let merged = extractB64(a.name);
  if (b) merged += extractB64(b.name);
  const expression = `new Function("window.__b64buf+=\\"${merged}\\";return window.__b64buf.length;")()`;
  pairs.push({ indices: b ? [i, i + 1] : [i], expression, len: expression.length });
}

pairs.forEach((p, idx) => {
  const payload = {
    method: 'Runtime.evaluate',
    params: { expression: p.expression, returnByValue: true, awaitPromise: false },
    viewId: process.argv[2] || 'd9c791',
  };
  fs.writeFileSync(path.join(dir, `_mcp-merged-${idx}.json`), JSON.stringify(payload));
});
fs.writeFileSync(path.join(dir, '_merged-chunks.json'), JSON.stringify(pairs, null, 2));
console.log(JSON.stringify(pairs.map((p) => ({ indices: p.indices, len: p.len }))));
