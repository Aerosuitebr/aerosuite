/**
 * Run one batch via expr-server bootstrap (full expr from .cdp-mcp-call.json, no MCP truncation).
 * Usage: node .cdp-run-batch-via-server.mjs prep <start> <end> [buildViewId] [mcpViewId]
 *        node .cdp-run-batch-via-server.mjs bootstrap
 *        node .cdp-run-batch-via-server.mjs save
 */
import fs from 'fs';
import { execSync } from 'child_process';

const cmd = process.argv[2];
const buildViewId = process.argv[5] || '379d4b';
const mcpViewId = process.argv[6] || 'f8a339';

if (cmd === 'prep') {
  const start = process.argv[3];
  const end = process.argv[4];
  execSync(`node .cdp-build-full-runner.mjs ${start} ${end} ${buildViewId}`, { stdio: 'inherit' });
  const a = JSON.parse(fs.readFileSync('.cdp-full-runner.mcp-ready.json', 'utf8'));
  a.viewId = mcpViewId;
  fs.writeFileSync('.cdp-mcp-call.json', JSON.stringify(a));
  execSync(`node .cdp-expr-server.mjs set .cdp-mcp-call.json ${mcpViewId}`, { stdio: 'inherit' });
  console.log(JSON.stringify({ start, end, viewId: mcpViewId, exprLen: a.params.expression.length }));
  process.exit(0);
}

if (cmd === 'bootstrap') {
  execSync('node .cdp-expr-server.mjs bootstrap', { stdio: 'inherit' });
  process.exit(0);
}

if (cmd === 'save') {
  execSync('node .cdp-split-batch-out.mjs', { stdio: 'inherit' });
  process.exit(0);
}

console.error('usage: prep|bootstrap|save');
process.exit(2);
