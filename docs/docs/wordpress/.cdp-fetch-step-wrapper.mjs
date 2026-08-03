/**
 * Emit tiny Runtime.evaluate that loads step N expression from local HTTP server.
 * Usage: node .cdp-fetch-step-wrapper.mjs <n> [viewId] [port]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'b45110';
const port = Number(process.argv[4] || 8769);
const expr = `(async()=>{const p=await fetch('http://127.0.0.1:${port}/step/${n}').then(r=>r.json());let v=eval(p.expression);if(p.awaitPromise&&v&&typeof v.then==='function')v=await v;return v;})()`;
const args = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: expr, awaitPromise: true, returnByValue: true },
};
const out = path.join(dir, `.cdp-step-${n}-fetch-args.json`);
fs.writeFileSync(out, JSON.stringify(args), 'utf8');
process.stdout.write(JSON.stringify(args));
