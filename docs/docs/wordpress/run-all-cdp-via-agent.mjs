/**
 * Prints step list; agent runs: node cdp-bridge.mjs prep <file> <viewId>
 * then CallMcpTool, writes .cdp-mcp-result.json, node cdp-bridge.mjs save <file>
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '5c671d';
const steps = JSON.parse(execSync(`node cdp-bridge.mjs steps ${viewId}`, { cwd: dir, encoding: 'utf8' }));

for (const rel of steps) {
  const norm = rel.replace(/\\/g, '/');
  console.log(`STEP ${norm}`);
  const prep = JSON.parse(execSync(`node cdp-bridge.mjs prep "${norm}" ${viewId}`, { cwd: dir, encoding: 'utf8' }));
  const args = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-last-args.json'), 'utf8'));
  fs.writeFileSync(path.join(dir, '.cdp-pending-invoke.json'), JSON.stringify({ file: norm, prep, args }));
  console.log(`INVOKE ${norm} exprLen=${prep.exprLen}`);
  // Agent must: CallMcpTool browser_cdp with args, write full response to .cdp-mcp-result.json
  // Then: node cdp-bridge.mjs save "${norm}"
  process.exit(0); // one step per invocation; agent passes --continue
}
