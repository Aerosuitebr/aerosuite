/**
 * Emit AWAIT_STEP for steps start..end; agent CallMcpTool then: node run-steps-mcp-batch.mjs save <n> <resultFile>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[5] || '5f37a3';

if (cmd === 'emit') {
  const n = Number(process.argv[3]);
  execSync(`node mcp-step-bridge.mjs prepare ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const args = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-current.json'), 'utf8'));
  fs.writeFileSync(path.join(dir, '.mcp-await-args.json'), JSON.stringify(args));
  console.log(JSON.stringify({ await: n, exprLen: args.params.expression.length }));
} else if (cmd === 'save') {
  const n = Number(process.argv[3]);
  const resultFile = process.argv[4];
  const raw = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  const value = raw?.result?.value ?? raw?.value ?? raw;
  execSync(`node mcp-step-bridge.mjs record ${n} ${JSON.stringify(JSON.stringify(value))}`, {
    cwd: dir,
    stdio: 'inherit',
  });
  console.log(JSON.stringify({ saved: n, value }));
} else if (cmd === 'emit-batch') {
  const label = process.argv[3];
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.mcp-invoke-${label}.json`), 'utf8'));
  fs.writeFileSync(path.join(dir, '.mcp-await-args.json'), JSON.stringify(args));
  console.log(JSON.stringify({ awaitBatch: label, exprLen: args.params.expression.length }));
} else if (cmd === 'save-batch') {
  const start = Number(process.argv[3]);
  const end = Number(process.argv[4]);
  const resultFile = process.argv[5];
  const raw = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  fs.writeFileSync(path.join(dir, '.cdp-mcp-result.json'), JSON.stringify(raw));
  execSync(`node record-invoke-batch.mjs ${start} ${end}`, { cwd: dir, stdio: 'inherit' });
} else {
  console.error('usage: emit|save|emit-batch|save-batch');
  process.exit(2);
}
