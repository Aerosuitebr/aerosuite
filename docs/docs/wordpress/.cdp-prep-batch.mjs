/** Prep batch for MCP: build runner, write .cdp-mcp-call.json with live tab viewId */
import fs from 'fs';
import { execSync } from 'child_process';

const [start, end, buildViewId = '379d4b', mcpViewId = 'f8a339'] = process.argv.slice(2);
execSync(`node .cdp-build-full-runner.mjs ${start} ${end} ${buildViewId}`, { stdio: 'inherit' });
const a = JSON.parse(fs.readFileSync('.cdp-full-runner.mcp-ready.json', 'utf8'));
a.viewId = mcpViewId;
fs.writeFileSync('.cdp-mcp-call.json', JSON.stringify(a));
console.log(JSON.stringify({ start, end, viewId: a.viewId, exprLen: a.params.expression.length }));
