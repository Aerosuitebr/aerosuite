/**
 * Write MCP runner result from step value JSON.
 * Usage: node write-step-result.mjs '{"ok":true}'
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const value = JSON.parse(process.argv[2]);
const raw = { result: { type: 'object', value } };
fs.writeFileSync(path.join(dir, '.mcp-runner-result.json'), JSON.stringify(raw));
console.log(JSON.stringify({ written: true, value }));
