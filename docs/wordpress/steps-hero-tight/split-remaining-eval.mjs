import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const { expression } = JSON.parse(fs.readFileSync(path.join(dir, 'remaining-chunks-eval.json'), 'utf8'));
const chunkSize = 5500;
const parts = [];
for (let i = 0; i < expression.length; i += chunkSize) {
  parts.push(expression.slice(i, i + chunkSize));
}
parts.forEach((p, i) => {
  const expr = i === 0
    ? `(function(){var s=${JSON.stringify(p)};eval(s);return window.__b64buf.length;})()`
    : `(function(){var s=${JSON.stringify(p)};eval(s);return window.__b64buf.length;})()`;
  fs.writeFileSync(path.join(dir, `remaining-part-${i}.json`), JSON.stringify({ expression: expr, awaitPromise: false, returnByValue: true, len: expr.length }));
  console.log(i, expr.length);
});
