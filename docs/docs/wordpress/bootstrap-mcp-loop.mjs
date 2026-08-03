import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] || '807f76';
const awaitFile = path.join(dir, '.cdp-await-step.txt');
const resultPath = path.join(dir, '.cdp-mcp-result.json');
const bootPath = path.join(dir, '.cdp-bootstrap-now.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const BOOTSTRAP = {
  viewId,
  method: 'Runtime.evaluate',
  params: {
    expression: `(async()=>{const e=await(await fetch('http://127.0.0.1:18765/expr')).text();let v=eval(e);if(v&&typeof v.then==='function')v=await v;return v;})()`,
    awaitPromise: true,
    returnByValue: true,
  },
};

for (let n = start; n <= end; n++) {
  execSync(`node agent-mcp-step-loop.mjs prep ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  execSync(`node .cdp-expr-server.mjs set .cdp-mcp-args-current.json ${viewId}`, { cwd: dir, stdio: 'pipe' });
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  fs.writeFileSync(bootPath, JSON.stringify(BOOTSTRAP));
  fs.writeFileSync(awaitFile, String(n));
  console.error(`AWAIT_MCP ${n}`);
  let ok = false;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(resultPath)) {
      try {
        JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        ok = true;
        break;
      } catch {
        /* retry */
      }
    }
    await sleep(200);
  }
  if (!ok) {
    console.error(JSON.stringify({ error: 'timeout', step: n }));
    process.exit(1);
  }
  try {
    const out = execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, encoding: 'utf8' });
    console.error(`DONE ${n} ${out.trim()}`);
  } catch (e) {
    console.error(JSON.stringify({ error: 'record', step: n, detail: String(e) }));
    process.exit(1);
  }
}
if (fs.existsSync(awaitFile)) fs.unlinkSync(awaitFile);
console.error('LOOP_OK');
