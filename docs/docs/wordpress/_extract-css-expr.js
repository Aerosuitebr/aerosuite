const fs = require('fs');
const path = require('path');
const dir = __dirname;
const step = parseInt(process.argv[2], 10);
if (!step || step < 1 || step > 6) {
  console.error('Usage: node _extract-css-expr.js <1-6>');
  process.exit(1);
}
const expr = fs.readFileSync(path.join(dir, `_css-expr${step}.txt`), 'utf8').trim();
process.stdout.write(expr);
