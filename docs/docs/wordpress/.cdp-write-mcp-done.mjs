import fs from 'fs';
const raw = process.argv[2] || fs.readFileSync(0, 'utf8');
fs.writeFileSync('.cdp-mcp-done.json', raw);
console.log('written');
