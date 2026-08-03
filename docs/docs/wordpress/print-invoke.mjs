/** Print MCP browser_cdp arguments JSON for a label (e.g. 0-1). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const label = process.argv[2];
process.stdout.write(fs.readFileSync(path.join(dir, `.mcp-invoke-${label}.json`), 'utf8'));
