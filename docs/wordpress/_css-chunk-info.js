const fs = require('fs');
const chunk = process.argv[2];
const expr = fs.readFileSync(__dirname + '/_css-expr' + chunk + '.txt', 'utf8').trim();
console.log(JSON.stringify({ len: expr.length, chunk: Number(chunk) }));
