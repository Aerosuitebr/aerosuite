/**
 * Run all .mcp-* deploy steps: writes args, waits for .cdp-mcp-result.json, records state.
 * Usage: node run-mcp-cdp-all.mjs <viewId>
 * Agent must call browser_cdp with .cdp-current-mcp-args.json after each AWAIT line.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '5c671d';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function orderedSteps() {
  const list = [
    '.mcp-cssfull-batch-0.json',
    '.mcp-cssfull-batch-1.json',
    '.mcp-cssfull-batch-2.json',
    '.mcp-cssfull-batch-3.json',
    '.mcp-cssfull-run.json',
    '.mcp-css-verify.json',
    '.mcp-css-finalize.json',
    '.mcp-enc-init.json',
  ];
  for (const enc of ['enc-0', 'enc-1', 'enc-2', 'enc-3']) {
    const encDir = path.join(dir, `.mcp-${enc}`);
    if (!fs.existsSync(encDir)) {
      execSync(`node emit-mcp-chunks.mjs ${enc} ${viewId}`, { cwd: dir, stdio: 'inherit' });
    }
    const uploads = fs
      .readdirSync(encDir)
      .filter((f) => /^upload-\d+\.json$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    for (const u of uploads) list.push(path.join(`.mcp-${enc}`, u));
    list.push(path.join(`.mcp-${enc}`, 'run.json'));
  }
  list.push('.mcp-enc-run.json');
  return list;
}

const steps = orderedSteps();
const argsPath = path.join(dir, '.cdp-current-mcp-args.json');
const resultPath = path.join(dir, '.cdp-mcp-result.json');

for (const rel of steps) {
  const norm = rel.replace(/\\/g, '/');
  const payload = JSON.parse(
    execSync(`node agent-cdp-step.mjs emit "${norm}" ${viewId}`, { cwd: dir, encoding: 'utf8' })
  );
  fs.writeFileSync(argsPath, JSON.stringify(payload));
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  console.log(`AWAIT ${norm} exprLen=${payload.params?.expression?.length ?? 0}`);
  let result = null;
  for (let t = 0; t < 900; t++) {
    if (fs.existsSync(resultPath)) {
      result = fs.readFileSync(resultPath, 'utf8');
      break;
    }
    await sleep(200);
  }
  if (!result) {
    console.log(JSON.stringify({ error: 'timeout', file: norm }));
    process.exit(1);
  }
  const rec = execSync(`node agent-cdp-step.mjs record "${norm}" "${resultPath}"`, {
    cwd: dir,
    encoding: 'utf8',
  });
  console.log(`DONE ${norm} ${rec.trim()}`);
  if (rec.includes('"stopped":true')) {
    process.exit(1);
  }
}

const summary = execSync(`node agent-cdp-step.mjs summary ${viewId}`, { cwd: dir, encoding: 'utf8' });
console.log('FINAL', summary.trim());
