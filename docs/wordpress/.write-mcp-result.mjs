import fs from 'fs';
const result = JSON.parse(fs.readFileSync(process.argv[2] ?? '.cdp-last-mcp-raw.json', 'utf8'));
fs.writeFileSync('.cdp-current-mcp-result.json', JSON.stringify(result));
