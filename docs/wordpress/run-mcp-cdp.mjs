/**
 * Prints MCP browser_cdp payload JSON to stdout for a step expression file.
 * Usage: node run-mcp-cdp.mjs .cdp-step3-expr.txt 483e84
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const exprFile = process.argv[2];
const viewId = process.argv[3] || '483e84';
const expr = fs.readFileSync(path.join(dir, exprFile), 'utf8');
process.stdout.write(
  JSON.stringify({
    server: 'cursor-ide-browser',
    toolName: 'browser_cdp',
    arguments: {
      method: 'Runtime.evaluate',
      params: { expression: expr, awaitPromise: true, returnByValue: true },
      viewId,
    },
  })
);
