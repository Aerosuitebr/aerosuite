/** Load JSON invoke file and print for MCP (agent reads stdout). */
import fs from 'fs';
const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
process.stdout.write(JSON.stringify(j));
