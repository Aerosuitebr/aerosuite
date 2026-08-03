import fs from 'fs';
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '4d6eae';
const half = Number(process.argv[4] ?? 0); // 0 or 1
const j = JSON.parse(fs.readFileSync(`.mcp-payload-${n}.json`, 'utf8'));
const expr = (j.arguments?.params ?? j.params).expression;
const mid = Math.ceil(expr.length / 2);
const parts = [expr.slice(0, mid), expr.slice(mid)];
const chunk = parts[half];
const wrapper =
  half === 0
    ? `(async()=>{window.__partialExpr=${JSON.stringify(chunk)};return{half:0,len:window.__partialExpr.length};})()`
    : `(async()=>{const full=(window.__partialExpr||'')+${JSON.stringify(chunk)};window.__partialExpr=null;let v=eval(full);if(v&&typeof v.then==='function')v=await v;return v;})()`;
const out = `.mcp-split-${n}-${half}.json`;
fs.writeFileSync(
  out,
  JSON.stringify({
    viewId,
    method: 'Runtime.evaluate',
    params: { expression: wrapper, awaitPromise: true, returnByValue: true },
  })
);
console.log(JSON.stringify({ n, half, chunkLen: chunk.length, wrapperLen: wrapper.length, out }));
