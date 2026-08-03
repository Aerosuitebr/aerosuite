/** Print MCP args JSON from .cdp-current-mcp-args.json to stdout (for agent piping). */
import fs from 'fs';
process.stdout.write(fs.readFileSync('.cdp-current-mcp-args.json', 'utf8'));
