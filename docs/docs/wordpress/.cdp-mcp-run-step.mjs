import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const argsPath = path.join(dir, `.cdp-call-${n}.json`);
const args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
// stdout: single line for agent to pass to CallMcpTool arguments (no wrapper)
process.stdout.write(JSON.stringify(args));
