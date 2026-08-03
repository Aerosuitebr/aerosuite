import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = [
  'init.js',
  ...fs
    .readdirSync(dir)
    .filter((f) => /^chunk-\d+\.js$/.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10)),
  'upload-replace.js',
];

const steps = order.map((name) => {
  const content = fs.readFileSync(path.join(dir, name), 'utf8').trim();
  const awaitPromise = name === 'upload-replace.js';
  const expression = awaitPromise ? content : `(function(){${content}})()`;
  return { name, expression, awaitPromise };
});

fs.writeFileSync(path.join(dir, '_manifest.json'), JSON.stringify(steps));
for (const s of steps) console.log(s.name, s.expression.length, s.awaitPromise);
