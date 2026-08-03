/**
 * Agent helper: process one AWAIT from mcp-runner-loop.mjs
 * node mcp-runner-process-one.mjs
 * Reads .mcp-runner-await.json, prints idx + exprLen (args in await file for agent)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const awaitPath = path.join(dir, '.mcp-runner-await.json');
if (!fs.existsSync(awaitPath)) {
  console.log(JSON.stringify({ ready: false }));
  process.exit(0);
}
const { idx, args } = JSON.parse(fs.readFileSync(awaitPath, 'utf8'));
console.log(JSON.stringify({ ready: true, idx, exprLen: args.params?.expression?.length ?? 0 }));
