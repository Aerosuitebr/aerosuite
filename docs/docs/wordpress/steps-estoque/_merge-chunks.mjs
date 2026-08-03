/** Merge chunk steps into single Runtime.evaluate expression(s). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 4);
const end = Number(process.argv[3] ?? 13);

function extractChunk(raw) {
  const m = raw.match(/window\.__b64buf\+="([^"]+)"/);
  if (!m) throw new Error('no chunk in: ' + raw.slice(0, 80));
  return m[1];
}

const manifest = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));
let merged = '';
for (let i = start; i <= end; i++) {
  const raw = fs.readFileSync(path.join(dir, manifest[i].name), 'utf8').trim();
  merged += extractChunk(raw);
}

const expression = `new Function("window.__b64buf+=\\"${merged}\\";return window.__b64buf.length;")()`;
const out = path.join(dir, '_merged-chunks-expr.txt');
fs.writeFileSync(out, expression);
console.log(JSON.stringify({ start, end, mergedLen: merged.length, exprLen: expression.length, out }));
