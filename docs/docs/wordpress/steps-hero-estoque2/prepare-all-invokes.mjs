import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));

for (let i = 0; i < order.length; i++) {
  const name = order[i];
  const content = fs.readFileSync(path.join(dir, `${name}.js`), 'utf8').trim();
  const awaitPromise = name.endsWith('-upload') || name === 'apply';
  const expression = awaitPromise
    ? content
    : `new Function(${JSON.stringify(content)})()`;
  fs.writeFileSync(
    path.join(dir, `_invoke-${i}.json`),
    JSON.stringify({
      method: 'Runtime.evaluate',
      params: {
        expression,
        awaitPromise,
        returnByValue: awaitPromise || name === 'init',
      },
    })
  );
}
console.log('prepared', order.length, 'invoke files');
