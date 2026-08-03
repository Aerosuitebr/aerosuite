import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));

function extractChunk(raw) {
  const m = raw.match(/window\.__b64buf\+="([^"]+)"/);
  if (!m) throw new Error('no chunk');
  return m[1];
}

function merge(a, b, out) {
  let merged = '';
  for (let i = a; i <= b; i++) {
    merged += extractChunk(fs.readFileSync(path.join(dir, manifest[i].name), 'utf8').trim());
  }
  const expression = `new Function("window.__b64buf+=\\"${merged}\\";return window.__b64buf.length;")()`;
  fs.writeFileSync(path.join(dir, out), expression);
  console.log(JSON.stringify({ out, mergedLen: merged.length, exprLen: expression.length, expectedBuf: (b + 1) * 18000 }));
}

merge(4, 6, '_batch-4-6-expr.txt');
merge(7, 9, '_batch-7-9-expr.txt');
merge(10, 12, '_batch-10-12-expr.txt');
