/**
 * Build fetch-wrapper MCP args from .cdp-call-N.json (same expression, served locally).
 * Usage: node .cdp-exec-remaining-via-fetch.mjs build <n> <viewId> <port>
 */
import fs from 'fs';
const n = Number(process.argv[3]);
const viewId = process.argv[4] || 'a3746c';
const port = Number(process.argv[5] || 8769);
const call = JSON.parse(fs.readFileSync(`.cdp-call-${n}.json`, 'utf8'));
fs.writeFileSync(`.cdp-step-${n}-live-args.json`, JSON.stringify({ method: call.method, params: call.params }));
const expr = `(async()=>{const p=await fetch('http://127.0.0.1:${port}/step/${n}').then(r=>r.json());let v=eval(p.expression);if(p.awaitPromise&&v&&typeof v.then==='function')v=await v;return v;})()`;
const args = { viewId, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } };
process.stdout.write(JSON.stringify(args));
