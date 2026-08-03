/**
 * Run steps start..end via browser_cdp args from .cdp-mcp-b64-step-N.json
 * Prints one step payload path at a time for agent; or run all if CURSOR_MCP=1 with fetch to local bridge.
 * Usage: node .cdp-run-steps-from-b64.mjs <start> <end> <viewId>
 */
import fs from 'fs';
import { execSync } from 'child_process';

const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '9e0614';

for (let n = start; n <= end; n++) {
  if (!fs.existsSync(`.cdp-mcp-b64-step-${n}.json`)) {
    execSync(`node .cdp-b64-from-mcp-step.mjs ${n} ${viewId}`, { stdio: 'inherit' });
  }
}

const stateFile = '.cdp-run-steps-state.json';
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : { done: [], results: {}, errors: [] };

for (let n = start; n <= end; n++) {
  if (state.done.includes(n)) continue;
  const args = JSON.parse(fs.readFileSync(`.cdp-mcp-b64-step-${n}.json`, 'utf8'));
  args.viewId = viewId;
  fs.writeFileSync('.cdp-mcp-b64-now.json', JSON.stringify(args));
  console.log(`NEED_MCP ${n}`);
  process.exit(0);
}

console.log(JSON.stringify({ complete: true, state }));
