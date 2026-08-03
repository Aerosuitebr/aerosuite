import fs from 'fs';
const a = JSON.parse(fs.readFileSync('.cdp-current-mcp-args.json', 'utf8'));
process.stdout.write(JSON.stringify(a.params));
