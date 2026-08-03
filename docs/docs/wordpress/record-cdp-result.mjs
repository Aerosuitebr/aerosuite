import fs from 'fs';
const n = process.argv[2];
const raw = process.argv[3];
const result = JSON.parse(raw);
fs.writeFileSync(`.cdp-step-${n}.mcp-out.json`, JSON.stringify(result));
const value = result?.result?.value ?? result?.value ?? result;
console.log(JSON.stringify({ step: Number(n), value }));
