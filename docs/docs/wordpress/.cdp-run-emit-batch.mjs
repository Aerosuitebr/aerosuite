/**
 * Usage: node .cdp-run-emit-batch.mjs <emit-file> <viewId>
 * Prints MCP browser_cdp arguments JSON to stdout.
 */
import fs from 'fs';
const args = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
args.viewId = process.argv[3];
process.stdout.write(JSON.stringify(args));
