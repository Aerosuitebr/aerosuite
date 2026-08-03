#!/usr/bin/env node
/**
 * Runs all invoke steps by reading JSON and printing progress.
 * MCP calls must be done by agent via CallMcpTool — this script only records.
 * Usage: node run-all-mcp-steps.sh <viewId>
 *        node run-all-mcp-steps.sh record <index>  (after agent writes .cdp-mcp-result.json)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '5c671d';
const manifest = JSON.parse(fs.readFileSync(path.join(dir, '.invoke-steps-manifest.json'), 'utf8'));

if (process.argv[2] === 'record') {
  const idx = Number(process.argv[3]);
  const out = execSync(`node record-step-result.mjs ${idx}`, { cwd: dir, encoding: 'utf8' });
  console.log(out.trim());
  const next = idx + 1;
  if (next >= manifest.count) {
    console.log(execSync(`node agent-cdp-step.mjs summary ${viewId}`, { cwd: dir, encoding: 'utf8' }).trim());
    process.exit(0);
  }
  console.log(`NEXT ${next}`);
  process.exit(0);
}

for (let i = 0; i < manifest.count; i++) {
  const argsPath = path.join(dir, `.invoke-step-${i}.json`);
  const args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(args));
  console.log(`AWAIT ${i} ${manifest.steps[i]} exprLen=${args.params?.expression?.length ?? 0}`);
  process.exit(0);
}
