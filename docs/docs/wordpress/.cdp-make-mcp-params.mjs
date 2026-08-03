import fs from 'fs';
const exprFile = process.argv[2];
const out = process.argv[3];
const expr = fs.readFileSync(exprFile, 'utf8');
const args = {
  viewId: 'e3527b',
  method: 'Runtime.evaluate',
  params: { expression: expr, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync(out, JSON.stringify(args));
console.log(out, expr.length);
