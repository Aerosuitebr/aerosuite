import fs from 'fs';
const chain = process.argv[2] || '.cdp-chain-21-29.json';
const out = process.argv[3] || '.cdp-expr-only.js';
const { expression } = JSON.parse(fs.readFileSync(chain, 'utf8'));
fs.writeFileSync(out, expression);
console.log(expression.length);
