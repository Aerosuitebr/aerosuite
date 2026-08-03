import fs from 'fs';
const n = process.argv[2];
const inFile = process.argv[3] || `.cdp-step-${n}.mcp-in.json`;
const raw = JSON.parse(fs.readFileSync(inFile, 'utf8'));
fs.writeFileSync(`.cdp-step-${n}.mcp-out.json`, JSON.stringify(raw));
const v = raw?.result?.value ?? raw?.result?.result?.value ?? raw?.value;
console.log(JSON.stringify({ step: Number(n), value: v, hasException: !!raw?.exceptionDetails }));
