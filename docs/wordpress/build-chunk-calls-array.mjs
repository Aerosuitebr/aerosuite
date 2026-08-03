import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const chunks = [];
for (let i = 1; i <= 5; i++) {
  chunks.push(fs.readFileSync(path.join(dir, `.expr-chunk-${i}.txt`), 'utf8'));
}
const calls = [
  {
    method: 'Runtime.evaluate',
    viewId: '7b8d4e',
    params: { expression: "window.__batchB64='';", returnByValue: true },
  },
  ...chunks.map((e) => ({
    method: 'Runtime.evaluate',
    viewId: '7b8d4e',
    params: { expression: e, returnByValue: true },
  })),
  {
    method: 'Runtime.evaluate',
    viewId: '7b8d4e',
    params: {
      expression: fs.readFileSync(path.join(dir, '.expr-chunk-6.txt'), 'utf8'),
      awaitPromise: true,
      returnByValue: true,
    },
  },
];
fs.writeFileSync(path.join(dir, 'cdp-chunk-calls-array.json'), JSON.stringify(calls));
console.log('calls', calls.length);
