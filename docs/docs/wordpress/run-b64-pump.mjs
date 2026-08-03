/**
 * B64 chunk pump: AWAIT .cdp-b64-next.json -> agent MCP -> .cdp-mcp-result.json
 * Usage: node run-b64-pump.mjs <viewId> <start> <end>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '37aca3';
const start = Number(process.argv[3] ?? 3);
const end = Number(process.argv[4] ?? 29);
const nextPath = path.join(dir, '.cdp-b64-next.json');
const resultPath = path.join(dir, '.cdp-mcp-result.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

if (!process.argv.includes('--continue')) {
  execSync(`node run-b64-steps.mjs reset ${viewId} ${start} ${end}`, { cwd: dir, stdio: 'pipe' });
  execSync(`node run-b64-steps.mjs go ${viewId} ${start} ${end}`, { cwd: dir, stdio: 'pipe' });
}

while (true) {
  const next = JSON.parse(fs.readFileSync(nextPath, 'utf8'));
  const exprLen = next.params?.expression?.length ?? 0;
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  console.log(`AWAIT step exprLen=${exprLen}`);
  let raw = null;
  for (let t = 0; t < 900; t++) {
    if (fs.existsSync(resultPath)) {
      raw = fs.readFileSync(resultPath, 'utf8');
      break;
    }
    await sleep(200);
  }
  if (!raw) {
    console.log(JSON.stringify({ error: 'timeout' }));
    process.exit(1);
  }
  try {
    JSON.parse(raw);
  } catch (e) {
    console.log(JSON.stringify({ error: 'invalid JSON in result', head: raw.slice(0, 80) }));
    process.exit(1);
  }
  const out = execSync(`node run-b64-steps.mjs ack ${viewId} ${start} ${end}`, { cwd: dir, encoding: 'utf8' }).trim();
  console.log(`DONE ${out}`);
  if (out.startsWith('FINAL')) {
    console.log(out);
    process.exit(0);
  }
}
