/** Build fetch+eval wrapper for batch MCP call. */
import fs from 'fs';
const port = Number(process.argv[2] || 9876);
const viewId = process.argv[3] || 'f8a339';
const expr = `(async()=>{
  const r=await fetch('http://127.0.0.1:${port}/expr');
  if(!r.ok) return {ok:false,error:'fetch '+r.status};
  const j=await r.json();
  let v=eval(j.params.expression);
  if(v&&typeof v.then==='function') v=await v;
  return v;
})()`;
const out = { viewId, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } };
fs.writeFileSync('.cdp-fetch-wrapper.json', JSON.stringify(out));
console.log(JSON.stringify({ viewId, wrapperLen: expr.length }));
