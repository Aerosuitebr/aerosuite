import fs from 'fs';
const viewId = process.argv[2] || '4da845';
const p = JSON.parse(fs.readFileSync('.cdp-mcp-pending.json', 'utf8'));
const expr = p.args.params.expression;
const b64 = Buffer.from(expr, 'utf8').toString('base64');
const wrapper = `(async()=>{const e=atob('${b64}');let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()`;
const out = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: wrapper, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync('.cdp-mcp-active-args.json', JSON.stringify(out));
console.log(JSON.stringify({ batch: p.batch, origLen: expr.length, wrapperLen: wrapper.length }));
