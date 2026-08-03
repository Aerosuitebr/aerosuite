/**
 * Build grouped Runtime.evaluate expressions from cdp-invocations.jsonl.
 * Groups sync batches; keeps async batches separate with await.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const invocations = fs
  .readFileSync(path.join(dir, 'cdp-invocations.jsonl'), 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const start = Number(process.argv[2] || 0);
const end = Number(process.argv[3] || invocations.length);
const slice = invocations.slice(start, end);
const hasAsync = slice.some((s) => s.awaitPromise);

let body = slice
  .map((s, i) => {
    const expr = s.expression.trim();
    if (s.awaitPromise) {
      return `results.push({group:${start + i},batch:${JSON.stringify(s.batch)},value:await (${expr})});`;
    }
    return `results.push({group:${start + i},batch:${JSON.stringify(s.batch)},value:(${expr})});`;
  })
  .join('\n');

const expression = hasAsync
  ? `(async function(){const results=[];${body}return results;})()`
  : `(function(){const results=[];${body}return results;})()`;

const out = {
  start,
  end,
  awaitPromise: hasAsync,
  length: expression.length,
  expression,
};
fs.writeFileSync(path.join(dir, 'cdp-group-expr.json'), JSON.stringify(out));
console.log('GROUP', start, end, 'len', expression.length, 'async', hasAsync);
