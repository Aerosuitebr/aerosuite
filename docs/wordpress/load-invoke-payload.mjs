/**
 * Load invoke step payload for MCP (no shared handshake race).
 * Usage: node load-invoke-payload.mjs <step> [viewId]
 * Writes .mcp-step-<step>-payload.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'bb8370';
const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${step}.json`), 'utf8'));
const payload = { method: 'Runtime.evaluate', viewId, params };
const out = path.join(dir, `.mcp-step-${step}-payload.json`);
fs.writeFileSync(out, JSON.stringify(payload));
console.log(out);
