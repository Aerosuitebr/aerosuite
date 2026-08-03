const fs = require('fs');
const p = __dirname + '/';
let t = 0;
for (let i = 0; i < 5; i++) {
  const c = fs.readFileSync(p + 'deploy-encoding-' + i + '.js', 'utf8');
  const m = c.match(/\+\"([^\"]+)\"/);
  t += m[1].length;
  console.log('chunk', i, 'add', m[1].length, 'total', t);
}
console.log('expected total', t, 'mod4', t % 4);
