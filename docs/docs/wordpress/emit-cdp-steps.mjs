/**
 * Emits deploy steps as JSON lines for browser_cdp Runtime.evaluate.
 * Usage: node emit-cdp-steps.mjs | node run-from-stdin.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const steps = [
  'enc-init',
  ...fs
    .readdirSync(dir)
    .filter((f) => /^deploy-encoding-\d+\.js$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map((f) => 'enc-' + f.match(/\d+/)[0]),
  'enc-run',
];

for (const name of steps) {
  let expression;
  if (name === 'enc-init') {
    expression = `(async()=>{window.__homeb64='';return{ok:true};})()`;
  } else if (name === 'enc-run') {
    expression = fs.readFileSync(path.join(dir, 'deploy-encoding-run.js'), 'utf8').trim();
  } else {
    const n = name.replace('enc-', '');
    expression = fs.readFileSync(path.join(dir, `deploy-encoding-${n}.js`), 'utf8').trim();
  }
  console.log(JSON.stringify({ step: name, expression }));
}
