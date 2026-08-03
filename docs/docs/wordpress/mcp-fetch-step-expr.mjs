/**
 * Build short browser_cdp expression that fetches step payload from local server.
 * node mcp-fetch-step-expr.mjs <step> <port> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = Number(process.argv[2]);
const port = Number(process.argv[3] || 18765);
const viewId = process.argv[4] || 'bba9a4';
const expression = `(async()=>{const r=await fetch('http://127.0.0.1:${port}/step/${step}');const j=await r.json();const inner=(j.arguments?.params??j.params).expression;return await eval(inner);})()`;
const args = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression, awaitPromise: true, returnByValue: true },
};
const out = path.join(dir, '.mcp-cdp-args-only.json');
fs.writeFileSync(out, JSON.stringify(args));
console.log(JSON.stringify({ step, port, exprLen: expression.length, viewId }));
