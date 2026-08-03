/**
 * Execute deploy step payloads sequentially via stdin/stdout protocol.
 * Reads payload JSON path from argv, prints result JSON to stdout.
 * Used with agent MCP browser_cdp loop.
 */
import fs from 'fs';

const payloadPath = process.argv[2];
if (!payloadPath) {
  console.error('usage: node exec-cdp-payload.mjs <payload.json>');
  process.exit(1);
}
const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
process.stdout.write(JSON.stringify(payload));
