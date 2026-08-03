const fs = require('fs');
const path = require('path');
const dir = __dirname;

fs.writeFileSync(
  path.join(dir, 'deploy-expr-init.txt'),
  `(async()=>{window.__homeb64='';return{init:true,len:window.__homeb64.length};})()`
);

for (const n of [0, 1, 2, 3, 4, 'run']) {
  const b64 = fs.readFileSync(path.join(dir, `deploy-eval-${n}.b64.txt`), 'utf8').trim();
  const expr = `(async()=>{return await eval(atob('${b64}'));})()`;
  fs.writeFileSync(path.join(dir, `deploy-expr-${n}.txt`), expr);
}

console.log('done');
