import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];

if (cmd === 'prep') {
  const rel = process.argv[3];
  const viewId = process.argv[4] || '5c671d';
  const args = execSync(`node agent-cdp-step.mjs emit "${rel}" ${viewId}`, { cwd: dir, encoding: 'utf8' });
  fs.writeFileSync(path.join(dir, '.cdp-last-args.json'), args);
  const j = JSON.parse(args);
  console.log(JSON.stringify({ file: rel, exprLen: j.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'save') {
  const rel = process.argv[3];
  const resultPath = path.join(dir, '.cdp-mcp-result.json');
  const out = execSync(`node agent-cdp-step.mjs record "${rel}" "${resultPath}"`, { cwd: dir, encoding: 'utf8' });
  console.log(out.trim());
  process.exit(0);
}

if (cmd === 'steps') {
  const viewId = process.argv[3] || '5c671d';
  const j = JSON.parse(execSync(`node mcp-deploy-runner.mjs list-steps ${viewId}`, { cwd: dir, encoding: 'utf8' }));
  console.log(JSON.stringify(j.steps));
  process.exit(0);
}

console.error('usage: prep|save|steps');
process.exit(2);
