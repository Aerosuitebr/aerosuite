import fs from 'fs';
const resp = fs.readFileSync(process.argv[2] || 0, 'utf8');
fs.writeFileSync('.cdp-mcp-current-response.json', resp);
