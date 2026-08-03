const fs = require('fs');
const p = __dirname + '/';
let t = 0;
for (let i = 1; i <= 6; i++) {
  const c = fs.readFileSync(p + 'deploy-css-step-' + i + '.js', 'utf8');
  const m = c.match(/\+\"([^\"]+)\"/);
  if (m) {
    t += m[1].length;
    console.log('step', i, 'add', m[1].length, 'total', t);
    fs.writeFileSync(p + '_css-expr' + i + '.txt', c.trim());
  }
}
console.log('total', t, 'mod4', t % 4);
