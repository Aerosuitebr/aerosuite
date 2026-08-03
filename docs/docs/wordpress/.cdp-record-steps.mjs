import { spawnSync } from 'child_process';
import fs from 'fs';

const dir = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1').replace(/\//g, '\\');
const cwd = process.cwd();
const results = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const [step, value] of Object.entries(results)) {
  const r = spawnSync('node', ['.cdp-agent-mcp-runner.mjs', 'record', step, JSON.stringify({ result: { value } })], {
    cwd,
    encoding: 'utf8',
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.status !== 0) {
    if (r.stderr) process.stderr.write(r.stderr);
    process.exit(r.status ?? 1);
  }
}
