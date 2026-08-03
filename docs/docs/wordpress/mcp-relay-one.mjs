/**
 * Agent-driven MCP relay: processes one step at a time from stdin commands.
 * Usage: node mcp-relay-one.mjs <index> [viewId]
 * Prints args to .mcp-invoke-payload.json and waits for .mcp-relay-result.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const idx = Number(process.argv[2]);
const viewId = process.argv[3] || 'f29abe';
const seq = path.join(dir, 'run-prepared-mcp-sequence.mjs');
const resultPath = path.join(dir, '.mcp-relay-result.json');
const payloadPath = path.join(dir, '.mcp-invoke-payload.json');

execSync(`node "${seq}" args ${idx} ${viewId}`, { stdio: 'pipe' });
const args = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-call-args.json'), 'utf8'));
fs.writeFileSync(payloadPath, JSON.stringify(args));
if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
console.log(JSON.stringify({ index: idx, payloadPath, resultPath, exprLen: args.params?.expression?.length ?? 0 }));
