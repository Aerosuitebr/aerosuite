import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));
const results = [];

for (let i = 0; i < order.length; i++) {
  const invoke = JSON.parse(
    fs.readFileSync(path.join(dir, `_fetch-invoke-${i}.json`), 'utf8')
  );
  results.push({ i, name: order[i], invoke: invoke.params });
}

fs.writeFileSync(path.join(dir, '_all-fetch-invokes.json'), JSON.stringify(results, null, 2));
console.log('written', results.length);
