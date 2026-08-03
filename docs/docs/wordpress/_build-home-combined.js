const fs = require('fs');
const p = __dirname + '/';
const parts = [];
for (let i = 0; i < 5; i++) {
  const c = fs.readFileSync(p + 'deploy-encoding-' + i + '.js', 'utf8');
  const m = c.match(/\+\"([^\"]+)\"/);
  if (!m) throw new Error('no b64 in chunk ' + i);
  parts.push(m[1]);
}
const total = parts.reduce((s, x) => s + x.length, 0);
const expr = `(async()=>{window.__homeb64='${parts.join('')}';return{ok:true,len:window.__homeb64.length,mod4:window.__homeb64.length%4,expected:${total}};})()`;
fs.writeFileSync(p + '_home-combined-expr.js', expr);
console.log(JSON.stringify({ total, mod4: total % 4, exprLen: expr.length }));
