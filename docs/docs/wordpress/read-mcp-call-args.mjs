/**
 * Agent helper: read .mcp-call-args.json and emit as single-line JSON for MCP.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const args = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '.mcp-call-args.json'), 'utf8'));
process.stdout.write(JSON.stringify(args));
