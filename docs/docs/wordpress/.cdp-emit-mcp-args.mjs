/**
 * Agent helper: emit exact browser_cdp args for step N (stdout = JSON only).
 * Agent must CallMcpTool with stdout verbatim, then:
 *   node .cdp-run-mcp-step.mjs save <n>  (pipe MCP response JSON to stdin)
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const viewId = process.argv[3] || '1031af';
const out = execSync(`node .cdp-agent-one-mcp.mjs ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' });
process.stdout.write(out);
