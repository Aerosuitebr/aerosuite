/**
 * Agent helper: run one CDP step via file handshake with orchestrator.
 * Reads .cdp-current-mcp-args.json, agent must call browser_cdp and write result.
 * This script prints args summary and waits for result.
 */
import fs from 'fs';

const argsPath = '.cdp-current-mcp-args.json';
const resultPath = '.cdp-current-mcp-result.json';
const args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
console.log(JSON.stringify({
  viewId: args.viewId,
  method: args.method,
  exprLen: args.params?.expression?.length ?? 0,
  expression: args.params?.expression,
  awaitPromise: args.params?.awaitPromise,
  returnByValue: args.params?.returnByValue,
}));
