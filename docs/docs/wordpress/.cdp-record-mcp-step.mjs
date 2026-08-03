import fs from 'fs';
const n = process.argv[2];
const src = process.argv[3] || '.cdp-last-mcp-response.json';
const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
const value = raw.result?.value ?? raw.value ?? raw;
fs.writeFileSync(`.cdp-step-${n}.mcp-out.json`, JSON.stringify({ result: { type: 'object', value } }));
console.log(JSON.stringify({ step: Number(n), value }));
