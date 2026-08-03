/**
 * Build one sequential Runtime.evaluate from .cdp-snap-*.json (steps 0,2..29).
 * Agent: browser_cdp with .cdp-combined-run-args.json then record each key from result.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '3a0808';
const order = [];
for (let n = 0; n <= 29; n++) if (n !== 1) order.push(n);

const parts = [];
for (const n of order) {
  const snapPath = path.join(dir, `.cdp-snap-${n}.json`);
  if (!fs.existsSync(snapPath)) throw new Error(`missing ${snapPath}`);
  const snap = JSON.parse(fs.readFileSync(snapPath, 'utf8'));
  let expr = snap.params.expression.trim();
  if (expr.startsWith('(async()=>{') && expr.endsWith('})()')) {
    expr = expr.slice('(async()=>{'.length, -'})()'.length);
  }
  parts.push(`__out[${n}]=await (async()=>{${expr}})();`);
}

const combined = `(async()=>{const __out={};${parts.join('')}return __out;})()`;
const payload = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: combined, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync(path.join(dir, '.cdp-combined-run-args.json'), JSON.stringify(payload));
console.log(JSON.stringify({ order, exprLen: combined.length }));
