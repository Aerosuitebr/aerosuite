import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const exprPath = path.join(dir, `step-${step}.expr.txt`);
const invokePath = path.join(dir, `.invoke-${step}.json`);
let inner;
if (fs.existsSync(exprPath)) {
  inner = fs.readFileSync(exprPath, 'utf8').trim();
} else if (fs.existsSync(invokePath)) {
  inner = JSON.parse(fs.readFileSync(invokePath, 'utf8')).expression;
} else {
  console.error('missing', step);
  process.exit(1);
}
const b64 = Buffer.from(inner, 'utf8').toString('base64');
const wrapper = `(async()=>{const expr=atob('${b64}');let v=eval(expr);if(v&&typeof v.then==='function')v=await v;return v})()`;
const out = { expression: wrapper, awaitPromise: true, returnByValue: true };
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(dir, `cdp-b64-${step}.json`), JSON.stringify(out));
}
console.log(JSON.stringify(out));
