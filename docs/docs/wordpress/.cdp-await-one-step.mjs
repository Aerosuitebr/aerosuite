/**
 * Run steps start..end via browser_cdp file handshake.
 * Writes .cdp-current-mcp-args.json, waits for .cdp-current-mcp-result.json
 * Agent: read args -> CallMcpTool browser_cdp -> write result JSON
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'c8305f';
const argsOut = path.join(dir, '.cdp-current-mcp-args.json');
const resultPath = path.join(dir, '.cdp-current-mcp-result.json');
const statePath = path.join(dir, '.cdp-run-all-state.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

for (let n = start; n <= end; n++) {
  const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, {
    cwd: dir,
    encoding: 'utf8',
  }).trim();
  const args = JSON.parse(out);
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  fs.writeFileSync(argsOut, JSON.stringify(args));
  console.log(`AWAIT ${n} exprLen=${args.params?.expression?.length ?? 0}`);
  process.stdout.write(JSON.stringify(args));
  process.exit(0);
}
console.log('DONE');
process.exit(0);
