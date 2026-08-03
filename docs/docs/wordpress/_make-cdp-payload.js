const fs = require('fs');
const path = require('path');
const chunk = process.argv[2];
const expr = fs.readFileSync(path.join(__dirname, `_expr${chunk}.txt`), 'utf8').trim();
const payload = {
  method: 'Runtime.evaluate',
  params: { awaitPromise: true, expression: expr, returnByValue: true },
  viewId: 'a5e786'
};
fs.writeFileSync(path.join(__dirname, `_cdp-chunk${chunk}.json`), JSON.stringify(payload));
