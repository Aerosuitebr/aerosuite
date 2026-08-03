import fs from 'fs';
const n = process.argv[2];
const raw = fs.readFileSync(process.argv[3] || 0, 'utf8');
fs.writeFileSync(`.cdp-step-${n}-result.json`, raw);
const value = JSON.parse(raw)?.result?.value;
console.log(JSON.stringify({ step: Number(n), value }));
