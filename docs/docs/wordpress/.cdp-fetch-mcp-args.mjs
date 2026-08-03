/** Short fetch-wrapper MCP args for step N via http bridge. Usage: node .cdp-fetch-mcp-args.mjs N viewId */
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '2effaf';
const PORT = 8765;
const expr = `(async()=>{const r=await fetch('http://127.0.0.1:${PORT}/step/${n}');if(!r.ok)throw new Error('fetch step ${n}');const {expression}=await r.json();let v=eval(expression);return await v;})()`;
process.stdout.write(JSON.stringify({
  method: 'Runtime.evaluate',
  params: { expression: expr, awaitPromise: true, returnByValue: true },
  viewId,
}));
