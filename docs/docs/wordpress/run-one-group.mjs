import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2] ?? 0);
const viewId = process.argv[3] || 'a52ddb';
const g = JSON.parse(
  fs.readFileSync(path.join(dir, 'cdp-groups', `group-${String(n).padStart(2, '0')}.json`), 'utf8')
);
const payload = {
  method: 'Runtime.evaluate',
  params: {
    expression: g.expression,
    returnByValue: true,
    awaitPromise: g.awaitPromise,
  },
  viewId,
  meta: { group: g.group, indexes: g.indexes },
};
fs.writeFileSync(path.join(dir, 'cdp-eval-params.json'), JSON.stringify(payload));
console.log('GROUP', g.group, 'indexes', g.indexes.join(','), 'len', g.length, 'async', g.awaitPromise);
