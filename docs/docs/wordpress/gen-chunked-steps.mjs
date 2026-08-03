/**
 * Split invoke JSON expressions into small Runtime.evaluate chunks for browser_cdp.
 * Usage: node gen-chunked-steps.mjs > chunked-manifest.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const CHUNK = 1800;
const steps = [
  'css-q1',
  'css-q2',
  'css-q3',
  'css-q4',
  'css-verify',
  'css-finalize',
  'enc-init',
  'enc-0',
  'enc-1',
  'enc-2',
  'enc-3',
  'enc-run',
];

const manifest = [];
for (const name of steps) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${name}.json`), 'utf8'));
  const expr = p.expression;
  const calls = [];
  calls.push({
    step: name,
    phase: 'init',
    params: {
      expression: `(async()=>{window.__expr='';return{step:'${name}',phase:'init'}})()`,
      awaitPromise: true,
      returnByValue: true,
    },
  });
  for (let i = 0; i < expr.length; i += CHUNK) {
    const part = expr.slice(i, i + CHUNK).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    calls.push({
      step: name,
      phase: `chunk-${i}`,
      params: {
        expression: `(async()=>{window.__expr+='${part}';return{step:'${name}',len:window.__expr.length}})()`,
        awaitPromise: true,
        returnByValue: true,
      },
    });
  }
  calls.push({
    step: name,
    phase: 'run',
    params: {
      expression: `(async()=>{let v=eval(window.__expr);if(true)v=await v;return v;})()`,
      awaitPromise: true,
      returnByValue: true,
    },
  });
  manifest.push({ name, calls: calls.length, items: calls });
}

fs.writeFileSync(path.join(dir, '.chunked-manifest.json'), JSON.stringify(manifest));
console.log(JSON.stringify({ steps: manifest.length, totalCalls: manifest.reduce((a, s) => a + s.calls, 0) }));
