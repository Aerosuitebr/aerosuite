/** Print one upload call JSON to stdout. Usage: node .cdp-mcp-upload-one.mjs <index> */
import fs from 'fs';
const i = Number(process.argv[2] || 0);
const p = `.cdp-upload-call-${i}.json`;
process.stdout.write(fs.readFileSync(p, 'utf8'));
