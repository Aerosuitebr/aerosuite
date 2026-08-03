import fs from 'fs';
const n = process.argv[2];
const raw = fs.readFileSync(0, 'utf8');
fs.writeFileSync(`.cdp-mcp-results/${n}.json`, raw);
const j = JSON.parse(raw);
const v = j?.result?.value ?? j?.value;
const ex = j?.exceptionDetails;
console.log(JSON.stringify({ step: Number(n), value: v, exception: ex || null }));
