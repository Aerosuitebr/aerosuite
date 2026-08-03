/**
 * One-shot MCP step: prints args JSON path, waits for result file.
 * Usage: node mcp-single-step.mjs prepare <index> [viewId]
 *        node mcp-single-step.mjs finish <index> <resultJsonPath>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const seq = path.join(dir, 'run-prepared-mcp-sequence.mjs');
const cmd = process.argv[2];

if (cmd === 'prepare') {
  const idx = process.argv[3];
  const viewId = process.argv[4] || 'f29abe';
  execSync(`node "${seq}" args ${idx} ${viewId}`, { stdio: 'inherit' });
  const argsPath = path.join(dir, '.mcp-call-args.json');
  console.log(JSON.stringify({ index: Number(idx), argsPath, args: JSON.parse(fs.readFileSync(argsPath, 'utf8')) }));
  process.exit(0);
}

if (cmd === 'finish') {
  const idx = process.argv[3];
  const resultPath = process.argv[4];
  execSync(`node "${seq}" record ${idx} "${resultPath}"`, { stdio: 'inherit' });
  process.exit(0);
}

process.exit(2);
