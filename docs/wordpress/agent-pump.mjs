/**
 * Agent pump: read .cdp-mcp-current-call.json, agent CallMcpTool, write .cdp-mcp-current-response.json
 * This script loops until deploy runner finishes or timeout.
 * Run: node agent-pump.mjs (agent must watch and call MCP when NEED_MCP printed)
 *
 * Self-contained pump using dynamic import of call file + subprocess to node mcp-bridge if exists.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callPath = path.join(dir, '.cdp-mcp-current-call.json');
const respPath = path.join(dir, '.cdp-mcp-current-response.json');
const termPath = path.join(dir, '.cdp-deploy-terminal.log');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readCall() {
  if (!fs.existsSync(callPath)) return null;
  return JSON.parse(fs.readFileSync(callPath, 'utf8'));
}

function hasResponse() {
  return fs.existsSync(respPath);
}

// Export call for external MCP execution
const cmd = process.argv[2];
if (cmd === 'call') {
  const c = readCall();
  if (!c) {
    console.log(JSON.stringify({ idle: true }));
    process.exit(0);
  }
  process.stdout.write(JSON.stringify(c));
  process.exit(0);
}

if (cmd === 'respond') {
  const raw = fs.readFileSync(process.argv[3] || respPath, 'utf8');
  fs.writeFileSync(respPath, raw);
  console.log('OK');
  process.exit(0);
}

if (cmd === 'wait-next') {
  (async () => {
    let last = '';
    for (let t = 0; t < 1200; t++) {
      const need = fs.existsSync(path.join(dir, '.cdp-needs-mcp-call'))
        ? fs.readFileSync(path.join(dir, '.cdp-needs-mcp-call'), 'utf8')
        : '';
      if (need && need !== last && !hasResponse()) {
        last = need;
        const c = readCall();
        console.log(JSON.stringify({ need, call: c }));
        process.exit(0);
      }
      if (fs.existsSync(path.join(dir, '.cdp-deploy-done'))) {
        console.log(JSON.stringify({ allDone: true }));
        process.exit(0);
      }
      await sleep(100);
    }
    console.log(JSON.stringify({ timeout: true }));
    process.exit(1);
  })();
}

console.error('usage: call|respond|wait-next');
process.exit(2);
