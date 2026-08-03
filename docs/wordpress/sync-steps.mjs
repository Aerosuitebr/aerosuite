import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
const viewId = process.argv[4] || '807f76';
const pending = path.join(dir, '.cdp-mcp-pending-step');
const resultPath = path.join(dir, '.cdp-mcp-result.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let n = start; n <= end; n++) {
  execSync(`node prep-step.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  fs.writeFileSync(pending, String(n));
  console.error(`NEED_MCP ${n}`);
  let ok = false;
  for (let t = 0; t < 900; t++) {
    if (fs.existsSync(resultPath)) {
      try {
        JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        ok = true;
        break;
      } catch {
        /* */
      }
    }
    await sleep(200);
  }
  if (!ok) {
    console.error(JSON.stringify({ error: 'timeout', step: n }));
    process.exit(1);
  }
  const out = execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, encoding: 'utf8' });
  console.error(`DONE ${n} ${out.trim()}`);
}
if (fs.existsSync(pending)) fs.unlinkSync(pending);
console.error('ALL_OK');
