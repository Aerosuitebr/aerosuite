import fs from 'fs';
const n = process.argv[2];
const raw = fs.readFileSync(0, 'utf8');
const j = JSON.parse(raw);
const value = j?.result?.value ?? j?.value ?? j;
fs.writeFileSync(`.cdp-step-${n}.mcp-out.json`, JSON.stringify({ result: { type: 'object', value } }));
console.log(JSON.stringify({ step: Number(n), saved: true }));
