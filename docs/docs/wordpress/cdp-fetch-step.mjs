/** Print short Runtime.evaluate wrapper that loads step body from local server. */
const step = process.argv[2];
const port = process.env.CDP_INVOKE_PORT || 8768;
const expr = `(async()=>{const expr=await fetch('http://127.0.0.1:${port}/step/${step}').then(r=>r.text());let v=eval(expr);if(v&&typeof v.then==='function')v=await v;return v})()`;
console.log(JSON.stringify({ expression: expr, awaitPromise: true, returnByValue: true }));
