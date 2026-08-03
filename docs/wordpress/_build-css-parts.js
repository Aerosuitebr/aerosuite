const fs = require('fs');
const p = __dirname + '/';
const parts = [];
for (let i = 1; i <= 6; i++) {
  const c = fs.readFileSync(p + 'deploy-css-step-' + i + '.js', 'utf8');
  const m = c.match(/\+\"([^\"]+)\"/);
  parts.push(m[1]);
}
for (let i = 0; i < 6; i++) {
  const expr = `(async()=>{window.__cssParts=window.__cssParts||[];window.__cssParts[${i}]='${parts[i]}';return{part:${i},len:window.__cssParts[${i}].length};})()`;
  fs.writeFileSync(p + '_css-part-expr-' + i + '.js', expr);
  console.log('part', i, 'exprLen', expr.length, 'b64Len', parts[i].length);
}
const joinExpr = `(async()=>{window.__cssb64=(window.__cssParts||[]).join('');return{len:window.__cssb64.length,mod4:window.__cssb64.length%4,expected:38728};})()`;
fs.writeFileSync(p + '_css-join-expr.js', joinExpr);
console.log('join exprLen', joinExpr.length);
