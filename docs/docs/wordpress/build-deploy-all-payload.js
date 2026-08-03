const fs = require('fs');
const path = require('path');
const dir = __dirname;
const viewId = process.argv[2] || '44c6d7';
const src = fs.readFileSync(path.join(dir, 'deploy-encoding-all.js'), 'utf8').trim();
const b64 = Buffer.from(src, 'utf8').toString('base64');
const expression = `(async()=>{return await eval(atob('${b64}'));})()`;
const payload = {
  method: 'Runtime.evaluate',
  params: { expression, awaitPromise: true, returnByValue: true },
  viewId,
};
fs.writeFileSync(path.join(dir, 'deploy-step-all.json'), JSON.stringify(payload));
fs.writeFileSync(path.join(dir, 'deploy-expr-all-oneline.txt'), expression);
console.log('src', src.length, 'expr', expression.length, 'json', fs.statSync(path.join(dir, 'deploy-step-all.json')).size);
