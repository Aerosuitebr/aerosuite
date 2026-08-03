import fs from 'fs';
const n = process.argv[2];
const viewId = process.argv[3] || '9e0614';
const src = `.cdp-step-${n}-mcp.json`;
const j = JSON.parse(fs.readFileSync(src, 'utf8'));
const expression = j.params.expression;
const b64 = Buffer.from(expression, 'utf8').toString('base64');
const wrapper = `(async()=>{const e=atob('${b64}');let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()`;
const out = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: wrapper, awaitPromise: true, returnByValue: true },
};
const outFile = `.cdp-mcp-b64-step-${n}.json`;
fs.writeFileSync(outFile, JSON.stringify(out));
console.log(JSON.stringify({ step: Number(n), wrapperLen: wrapper.length, origLen: expression.length, outFile }));
