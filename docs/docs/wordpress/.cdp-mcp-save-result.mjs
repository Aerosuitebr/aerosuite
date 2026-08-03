import fs from 'fs';
const n = process.argv[2];
const respPath = process.argv[3] || '.cdp-mcp-last-resp.json';
const raw = fs.readFileSync(respPath, 'utf8');
fs.mkdirSync('.cdp-mcp-results', { recursive: true });
fs.writeFileSync(`.cdp-mcp-results/${n}.json`, raw);
const j = JSON.parse(raw);
const val = j?.result?.value ?? j?.value;
console.log(JSON.stringify({ step: Number(n), ok: !j?.exceptionDetails, value: val }));
