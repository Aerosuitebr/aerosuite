/**
 * Execute .cdp-step-N.mcp-args.json or combined invoke via node reading JSON.
 * Agent: node .exec-one-mcp-json.mjs <jsonfile> -> prints result path
 * Uses dynamic import of JSON and writes to .last-mcp-result.json
 * NOTE: This script only validates JSON; agent must CallMcpTool separately.
 */
import fs from 'fs';
const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
j.viewId = process.argv[3] || j.viewId || '46863b';
fs.writeFileSync(new URL('./.last-mcp-call.json', import.meta.url), JSON.stringify(j));
console.log(JSON.stringify({ ready: true, viewId: j.viewId, exprLen: j.params?.expression?.length }));
