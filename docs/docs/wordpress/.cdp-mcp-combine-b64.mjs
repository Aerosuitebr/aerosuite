import fs from 'fs';
const calls = JSON.parse(fs.readFileSync('.mcp-b64-calls-99.json', 'utf8'));
let b64 = '';
for (let i = 0; i < calls.length - 1; i++) {
  const m = calls[i].params.expression.match(/window\.__b64\+='([^']*)'/);
  if (!m) throw new Error('no match ' + i);
  b64 += m[1];
}
const wrapper =
  "(async()=>{window.__b64=null;const e=atob('" +
  b64 +
  "');let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()";
const out = {
  viewId: process.argv[2] || '4da845',
  method: 'Runtime.evaluate',
  params: { expression: wrapper, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync('.cdp-mcp-active-args.json', JSON.stringify(out));
console.log(JSON.stringify({ b64Len: b64.length, wrapperLen: wrapper.length }));
