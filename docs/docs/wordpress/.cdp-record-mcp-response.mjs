import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const raw = process.argv[3] || fs.readFileSync(path.join(dir, `.cdp-step-${n}-mcp-response.json`), 'utf8');
execSync(`node .cdp-mcp-sequential-run.mjs record ${n} ${JSON.stringify(raw)}`, {
  cwd: dir,
  stdio: 'inherit',
});
