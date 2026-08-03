import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const parts = [];
for (let i = 1; i <= 10; i++) {
  const j = JSON.parse(
    fs.readFileSync(path.join(dir, `cdp-cssfix-step-${i}.json`), 'utf8')
  );
  const m = j.params.expression.match(/\+(.+);return\{chunk/);
  if (!m) throw new Error('parse ' + i);
  parts.push(JSON.parse(m[1]));
}

const mk = (from, to) => {
  const slice = parts.slice(from, to + 1);
  return `(async()=>{const parts=${JSON.stringify(slice)};for(const c of parts)window.__deployB64=(window.__deployB64||'')+c;return{from:${from},to:${to},len:window.__deployB64.length}})()`;
};

const a = mk(0, 4);
const b = mk(5, 9);
for (const [name, ex] of [
  ['.cdp-cssfix-batch-a.json', a],
  ['.cdp-cssfix-batch-b.json', b],
]) {
  fs.writeFileSync(
    path.join(dir, name),
    JSON.stringify({
      method: 'Runtime.evaluate',
      params: { expression: ex, awaitPromise: true, returnByValue: true },
    })
  );
}
console.log('a', a.length, 'b', b.length);
