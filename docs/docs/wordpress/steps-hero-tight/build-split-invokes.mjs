import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));
const outDir = path.join(dir, 'split-invokes');
fs.mkdirSync(outDir, { recursive: true });
const max = 6000;
const list = [];

function splitChunk(name) {
  const content = fs.readFileSync(path.join(dir, `${name}.js`), 'utf8').trim();
  const m = content.match(/^window\.__b64buf\+="([\s\S]*)";return window\.__b64buf\.length;$/);
  if (!m) throw new Error('unexpected chunk: ' + name);
  const b64 = m[1];
  const parts = [];
  for (let i = 0; i < b64.length; i += max) parts.push(b64.slice(i, i + max));
  return parts.map((p) => {
    const body = `window.__b64buf+="${p}";return window.__b64buf.length;`;
    return `new Function(${JSON.stringify(body)})()`;
  });
}

let seq = 0;
for (const name of order) {
  if (name === 'init') {
    const expression = `new Function(${JSON.stringify('window.__b64buf="";return {ok:true};')})()`;
    const file = `split-${String(seq++).padStart(3, '0')}-${name}.json`;
    fs.writeFileSync(
      path.join(outDir, file),
      JSON.stringify({
        step: name,
        method: 'Runtime.evaluate',
        params: { expression, awaitPromise: false, returnByValue: true },
      })
    );
    list.push(file);
    continue;
  }
  if (name.startsWith('chunk-')) {
    for (const expression of splitChunk(name)) {
      const file = `split-${String(seq++).padStart(3, '0')}-${name}.json`;
      fs.writeFileSync(
        path.join(outDir, file),
        JSON.stringify({
          step: name,
          method: 'Runtime.evaluate',
          params: { expression, awaitPromise: false, returnByValue: true },
        })
      );
      list.push(file);
    }
    continue;
  }
  if (name === 'upload-apply') {
    const expression = fs.readFileSync(path.join(dir, `${name}.js`), 'utf8').trim();
    const file = `split-${String(seq++).padStart(3, '0')}-${name}.json`;
    fs.writeFileSync(
      path.join(outDir, file),
      JSON.stringify({
        step: name,
        method: 'Runtime.evaluate',
        params: { expression, awaitPromise: true, returnByValue: true },
      })
    );
    list.push(file);
  }
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(list, null, 2));
console.log('WROTE', list.length, 'invokes to', outDir);
