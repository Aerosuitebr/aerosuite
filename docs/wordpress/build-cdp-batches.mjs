import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const list = JSON.parse(fs.readFileSync(path.join(dir, 'cdp-step-list.json'), 'utf8'));
const outDir = path.join(dir, 'cdp-batches');
fs.mkdirSync(outDir, { recursive: true });

const MAX = 20000;
const batches = [];
let cur = [];
let size = 0;

for (const step of list) {
  const add = step.expression.length + 80;
  const mustFlush =
    (step.awaitPromise && cur.length) ||
    (cur.length && size + add > MAX) ||
    (cur.some((s) => s.awaitPromise) && !step.awaitPromise);
  if (mustFlush) {
    batches.push(cur);
    cur = [];
    size = 0;
  }
  cur.push(step);
  size += add;
}
if (cur.length) batches.push(cur);

batches.forEach((steps, i) => {
  const syncSteps = steps.filter((s) => !s.awaitPromise);
  const asyncSteps = steps.filter((s) => s.awaitPromise);
  if (asyncSteps.length > 1) throw new Error(`batch ${i} has ${asyncSteps.length} async steps`);

  let expression;
  if (syncSteps.length) {
    const body = syncSteps
      .map(
        (s) =>
          `results.push({name:${JSON.stringify(s.name)},value:(function(){try{return ${s.expression}}catch(e){return {error:String(e)}}})()});`
      )
      .join('');
    expression = `(function(){const results=[];${body}return results;})()`;
  }

  const meta = {
    index: i,
    names: steps.map((s) => s.name),
    awaitPromise: !!asyncSteps.length,
    asyncExpression: asyncSteps[0]?.expression,
  };

  if (asyncSteps.length) {
    fs.writeFileSync(
      path.join(outDir, `batch-${String(i).padStart(2, '0')}-meta.json`),
      JSON.stringify(meta)
    );
    fs.writeFileSync(
      path.join(outDir, `batch-${String(i).padStart(2, '0')}-async.js`),
      asyncSteps[0].expression
    );
    if (syncSteps.length) {
      fs.writeFileSync(path.join(outDir, `batch-${String(i).padStart(2, '0')}-sync.js`), expression);
    }
  } else {
    fs.writeFileSync(path.join(outDir, `batch-${String(i).padStart(2, '0')}.js`), expression);
    fs.writeFileSync(path.join(outDir, `batch-${String(i).padStart(2, '0')}-meta.json`), JSON.stringify(meta));
  }
});

console.log('batches', batches.length);
