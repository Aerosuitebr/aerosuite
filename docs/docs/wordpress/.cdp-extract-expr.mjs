import fs from 'fs';
const i = Number(process.argv[2]);
const call = JSON.parse(fs.readFileSync(`.cdp-up-${i}.json`, 'utf8'));
fs.writeFileSync('.cdp-expr-only.txt', call.params.expression, 'utf8');
console.log(JSON.stringify({ i, len: call.params.expression.length }));
