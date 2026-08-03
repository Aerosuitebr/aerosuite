import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) {
  console.error('usage: node build-cdp-step.mjs <step-name>');
  process.exit(1);
}

const content = fs.readFileSync(path.join(dir, `${name}.js`), 'utf8').trim();
const isAsync = name.endsWith('-upload') || name === 'apply';
const expression = isAsync ? content : `(function(){ ${content} })()`;

const payload = {
  name,
  method: 'Runtime.evaluate',
  params: {
    expression,
    awaitPromise: isAsync,
    returnByValue: isAsync || name === 'init',
  },
};
const outPath = path.join(dir, '_current-step.json');
fs.writeFileSync(outPath, JSON.stringify(payload));
console.log(JSON.stringify({ name, exprLen: expression.length, awaitPromise: isAsync, outPath }));
