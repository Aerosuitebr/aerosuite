import fs from 'fs';
const raw = process.argv[2] || fs.readFileSync(0, 'utf8');
const j = typeof raw === 'string' && raw.trim().startsWith('{') ? JSON.parse(raw) : JSON.parse(fs.readFileSync(raw, 'utf8'));
fs.writeFileSync('.cdp-last-mcp-response.json', JSON.stringify(j));
const v = j?.result?.result?.value ?? j?.result?.value ?? null;
console.log(JSON.stringify({ value: v }));
