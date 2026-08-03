import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const paramsDir = path.join(dir, 'mcp-params');
const files = fs.readdirSync(paramsDir).sort();
const steps = files.map((f) => {
  const p = JSON.parse(fs.readFileSync(path.join(paramsDir, f), 'utf8'));
  return { expr: p.expression, awaitPromise: p.awaitPromise };
});

const upload = steps.find((s) => s.awaitPromise);
const syncSteps = steps.filter((s) => !s.awaitPromise);

let body = 'window.__b64buf="";\n';
for (const s of syncSteps) {
  body += `eval(${JSON.stringify(s.expr)});\n`;
}
body += `return await eval(${JSON.stringify(upload.expr)});`;

const combined = `(async()=>{${body}})()`;
const out = {
  expression: combined,
  awaitPromise: true,
  returnByValue: true,
  len: combined.length,
};
fs.writeFileSync(path.join(dir, 'combined-eval.json'), JSON.stringify(out));
console.log('len', out.len);
