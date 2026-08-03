const fs = require('fs');
const path = require('path');
const dir = __dirname;
const chunks = [];
for (let i = 1; i <= 6; i++) {
  const e = fs.readFileSync(path.join(dir, `_css-expr${i}.txt`), 'utf8').trim();
  const m = e.match(/\+\"([^\"]+)\"/);
  if (!m) throw new Error('no chunk in step ' + i);
  chunks.push(m[1]);
}
const total = chunks.reduce((s, c) => s + c.length, 0);
const expr = `(async()=>{window.__cssb64='';const cs=${JSON.stringify(chunks)};for(const c of cs)window.__cssb64+=c;return{len:window.__cssb64.length,mod4:window.__cssb64.length%4,expected:${total}};})()`;
fs.writeFileSync(path.join(dir, '_css-load-all-expr.txt'), expr);
console.log('exprLen', expr.length, 'totalB64', total, 'mod4', total % 4);
