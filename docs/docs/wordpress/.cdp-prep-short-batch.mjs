import fs from 'fs';
const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
const viewId = process.argv[4] || '9e0614';
const expr = fs.readFileSync('.cdp-combined-expr.txt', 'utf8').trim();
if (!expr && start !== undefined) {
  const { execSync } = await import('child_process');
  fs.writeFileSync('.cdp-combined-expr.txt', execSync(`node .cdp-build-combined-expr.mjs ${start} ${end}`, { encoding: 'utf8' }));
}
const fullExpr = fs.readFileSync('.cdp-combined-expr.txt', 'utf8').trim();
const b64 = Buffer.from(fullExpr, 'utf8').toString('base64');
const shortExpr = `(async()=>{const src=atob(${JSON.stringify(b64)});return await eval(src);})()`;
const payload = {
  method: 'Runtime.evaluate',
  params: { expression: shortExpr, awaitPromise: true, returnByValue: true },
  viewId,
};
fs.writeFileSync('.cdp-batch-call-short.json', JSON.stringify(payload));
console.log(JSON.stringify({ start, end, fullLen: fullExpr.length, shortLen: shortExpr.length, viewId }));
