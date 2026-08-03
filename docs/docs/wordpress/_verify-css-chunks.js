const fs = require('fs');
const path = require('path');
const dir = __dirname;
let total = 0;
for (let i = 1; i <= 6; i++) {
  const e = fs.readFileSync(path.join(dir, `_css-expr${i}.txt`), 'utf8').trim();
  const m = e.match(/\+\"([^\"]+)\"/);
  const len = m ? m[1].length : 0;
  total += len;
  console.log('step', i, 'appendLen', len, 'runningTotal', total);
}
console.log('total', total, 'mod4', total % 4);
