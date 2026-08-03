/**
 * Execute .cdp-step-*.args.json via Cursor browser MCP (stdio JSON-RPC).
 * Reads manifest from run-mcp-cdp-loop.mjs output.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] || 0);
const end = Number(process.argv[3] || 999);
const viewId = process.argv[4] || 'c11c39';

const manifest = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-step-manifest.json'), 'utf8'));
const results = {};
const errors = [];

function callMcp(args) {
  const payload = {
    server: 'cursor-ide-browser',
    toolName: 'browser_cdp',
    arguments: args,
  };
  const r = spawnSync(
    'node',
    [path.join(dir, 'call-mcp-tool.mjs'), JSON.stringify(payload)],
    { cwd: dir, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || `exit ${r.status}`);
  }
  return JSON.parse(r.stdout);
}

for (const item of manifest) {
  if (item.i < start || item.i > end) continue;
  const args = JSON.parse(fs.readFileSync(item.argsPath, 'utf8'));
  args.viewId = viewId;
  try {
    const out = callMcp(args);
    const value = out?.result?.value ?? out?.result ?? out;
    results[item.step] = value;
    console.error(`OK ${item.i} ${item.step}`, JSON.stringify(value).slice(0, 120));
  } catch (e) {
    errors.push({ step: item.step, i: item.i, error: String(e) });
    console.error(`FAIL ${item.i} ${item.step}`, e.message || e);
    break;
  }
}

const summaryPath = path.join(dir, `.cdp-results-${start}-${end}.json`);
fs.writeFileSync(summaryPath, JSON.stringify({ results, errors }, null, 2));
console.log(JSON.stringify({ summaryPath, ok: errors.length === 0, steps: Object.keys(results).length }));
