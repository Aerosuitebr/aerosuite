import fs from 'fs';
const chunks = [];
for (let s = 0; s <= 2; s++) {
  const plan = JSON.parse(fs.readFileSync(`.cdp-chunk-plan-${s}.json`, 'utf8'));
  plan.calls.forEach((c, i) => chunks.push({ step: s, chunk: i, call: c }));
  chunks.push({
    step: s,
    chunk: 'final',
    call: {
      viewId: '6ee02c',
      method: 'Runtime.evaluate',
      params: {
        expression:
          "(async()=>{const e=(window.__exprParts||[]).join('');window.__exprParts=null;let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()",
        awaitPromise: true,
        returnByValue: true,
      },
    },
  });
}
fs.writeFileSync('.cdp-all-chunk-queue.json', JSON.stringify({ total: chunks.length, chunks }, null, 2));
console.log(JSON.stringify({ total: chunks.length }));
