/**
 * Build sequential CDP invocations from order.json (for agent batching).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));
const invocations = order.map((name, index) => {
  const content = fs.readFileSync(path.join(dir, `${name}.js`), 'utf8').trim();
  const awaitPromise =
    name.endsWith('-upload') || name === 'apply-pages-footer';
  const expression = awaitPromise
    ? content
    : `new Function(${JSON.stringify(content)})()`;
  return { name, index, awaitPromise, expression };
});
fs.writeFileSync(
  path.join(dir, 'all-invocations.json'),
  JSON.stringify(invocations)
);
console.log('wrote', invocations.length, 'steps');
