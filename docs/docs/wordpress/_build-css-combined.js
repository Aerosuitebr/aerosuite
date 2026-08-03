const fs = require('fs');
const p = __dirname + '/';
const parts = [];
for (let i = 1; i <= 6; i++) {
  const c = fs.readFileSync(p + 'deploy-css-step-' + i + '.js', 'utf8');
  const m = c.match(/\+\"([^\"]+)\"/);
  if (!m) throw new Error('no b64 in step ' + i);
  parts.push(m[1]);
}
const total = parts.reduce((s, x) => s + x.length, 0);
const expr = `(async()=>{window.__cssb64='${parts.join('')}';return{ok:true,len:window.__cssb64.length,mod4:window.__cssb64.length%4,expected:${total}};})()`;
fs.writeFileSync(p + '_css-combined-expr.js', expr);
console.log(JSON.stringify({ total, mod4: total % 4, exprLen: expr.length }));
