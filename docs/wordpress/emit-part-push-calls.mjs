import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(
  fs.readFileSync(path.join(dir, 'cdp-batch-invoke.json'), 'utf8')
);
const expr = j.params.expression;
const viewId = process.env.CDP_VIEW_ID || '7b8d4e';
const CHUNK = 9000;
const parts = [];
for (let i = 0; i < expr.length; i += CHUNK) {
  parts.push(expr.slice(i, i + CHUNK));
}

const calls = [
  {
    method: 'Runtime.evaluate',
    viewId,
    params: {
      expression: 'window.__batchParts=[];',
      returnByValue: true,
    },
  },
];

parts.forEach((part, idx) => {
  calls.push({
    method: 'Runtime.evaluate',
    viewId,
    params: {
      expression: `window.__batchParts[${idx}]=${JSON.stringify(part)};`,
      returnByValue: true,
    },
  });
});

calls.push({
  method: 'Runtime.evaluate',
  viewId,
  params: {
    expression:
      "(async()=>{const code=window.__batchParts.join('');return await eval(code);})()",
    awaitPromise: true,
    returnByValue: true,
  },
});

fs.writeFileSync(
  path.join(dir, 'cdp-part-push-calls.json'),
  JSON.stringify(calls, null, 2)
);
console.log('calls', calls.length, 'parts', parts.length);
parts.forEach((p, i) => console.log(' part', i, p.length));
