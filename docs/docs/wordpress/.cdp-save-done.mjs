import fs from 'fs';
const raw = process.argv[2] || fs.readFileSync('.cdp-last-mcp-raw.json', 'utf8');
const parsed = typeof raw === 'string' && raw.trim().startsWith('{') ? JSON.parse(raw) : JSON.parse(fs.readFileSync(raw, 'utf8'));
fs.writeFileSync('.cdp-mcp-done-now.json', JSON.stringify(parsed));
console.log('saved done');
