import fs from 'fs';
const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
const parts = [];
for (let i = start; i <= end; i++) {
  const call = JSON.parse(fs.readFileSync(`.cdp-up-${i}.json`, 'utf8'));
  const m = call.params.expression.match(/window\.__b64\+='([^']+)'/);
  if (!m) throw new Error(`no b64 in upload ${i}`);
  parts.push(m[1]);
}
const expr = `(()=>{window.__b64+='${parts.join('')}';return{phase:'chunk',len:window.__b64.length}})()`;
fs.writeFileSync('.cdp-expr-only.txt', expr, 'utf8');
console.log(JSON.stringify({ start, end, exprLen: expr.length }));
