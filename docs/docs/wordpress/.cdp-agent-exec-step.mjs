/**
 * Execute one orchestrator step via args file + MCP result file.
 * Usage: node .cdp-agent-exec-step.mjs <viewId> <step>
 * Prints MCP args JSON to stdout; writes nothing (agent calls browser_cdp).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2];
const step = Number(process.argv[3]);
const args = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-args-${step}.json`), 'utf8'));
args.viewId = viewId;
process.stdout.write(JSON.stringify(args));
