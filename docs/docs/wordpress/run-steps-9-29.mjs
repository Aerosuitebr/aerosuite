/**
 * Prints steps 9-29 to run; agent must MCP bootstrap after each prep output.
 * Usage: node run-steps-9-29.mjs drive
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = '807f76';
const BOOT =
  '(async()=>{const e=await(await fetch(\'http://127.0.0.1:18765/expr\')).text();let v=eval(e);if(v&&typeof v.then===\'function\')v=await v;return v;})()';

for (let n = 9; n <= 29; n++) {
  execSync(`node prep-step.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  console.log(`RUN_MCP ${n}`);
  // Agent fills .cdp-mcp-result.json then runs: node agent-mcp-step-loop.mjs record N
  const resultPath = path.join(dir, '.cdp-mcp-result.json');
  let ok = false;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(resultPath)) {
      try {
        JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        ok = true;
        break;
      } catch {
        /* */
      }
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!ok) {
    console.error(JSON.stringify({ error: 'timeout', step: n }));
    process.exit(1);
  }
  const out = execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, encoding: 'utf8' });
  console.log(`DONE ${n} ${out.trim()}`);
  fs.unlinkSync(resultPath);
}
console.log('ALL_OK');
