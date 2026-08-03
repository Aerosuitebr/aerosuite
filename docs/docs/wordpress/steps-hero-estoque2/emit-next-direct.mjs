import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));
const start = Number(process.argv[2] || 0);
const end = Number(process.argv[3] ?? order.length - 1);

for (let i = start; i <= end; i++) {
  const name = order[i];
  const content = fs.readFileSync(path.join(dir, `${name}.js`), 'utf8').trim();
  const awaitPromise = name.endsWith('-upload') || name === 'apply';
  const expression = awaitPromise
    ? content
    : `new Function(${JSON.stringify(content)})()`;
  fs.writeFileSync(
    path.join(dir, '_next-mcp.json'),
    JSON.stringify({
      step: i,
      name,
      method: 'Runtime.evaluate',
      params: {
        expression,
        awaitPromise,
        returnByValue: awaitPromise || name === 'init',
      },
    })
  );
  console.log(JSON.stringify({ step: i, name, awaitPromise, exprLen: expression.length }));
  process.exit(0);
}

console.log('DONE');
