/**
 * Agent helper: prep step N, print args file path. After MCP, run:
 *   node .cdp-mcp-step.mjs done <step> [batch]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[5] || '847540';

const batches = {
  '4-7': '.cdp-batch-4-7-call.json',
  '8-13': '.cdp-batch-8-13-call.json',
  '14-19': '.cdp-batch-14-19-call.json',
  '20-25': '.cdp-batch-20-25-call.json',
  '26-29': '.cdp-batch-26-29-call.json',
};

function prepStep(n) {
  execSync(`node .cdp-prep-invoke.mjs step ${n} ${viewId}`, { cwd: dir, stdio: 'inherit' });
}

function prepBatch(name) {
  const file = batches[name];
  const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  j.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-mcp-args-only.json'), JSON.stringify({ viewId: j.viewId, method: j.method, params: j.params }));
  console.log(JSON.stringify({ batch: name, file, exprLen: j.params?.expression?.length ?? 0 }));
}

if (cmd === 'prep') {
  const target = process.argv[3];
  if (batches[target]) prepBatch(target);
  else prepStep(Number(target));
  const args = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-mcp-args-only.json'), 'utf8'));
  fs.writeFileSync(path.join(dir, '.cdp-agent-next-call.json'), JSON.stringify(args));
  console.log('ARGS .cdp-agent-next-call.json');
  process.exit(0);
}

if (cmd === 'done') {
  const target = process.argv[3];
  const isBatch = batches[target];
  if (isBatch) {
    execSync('node .cdp-record-batch.mjs .cdp-last-mcp-response.json', { cwd: dir, stdio: 'inherit' });
  } else {
    execSync(`node .cdp-save-record.mjs ${target} .cdp-last-mcp-response.json`, { cwd: dir, stdio: 'inherit' });
  }
  process.exit(0);
}

if (cmd === 'diag') {
  execSync(`node .cdp-prep-invoke.mjs step 4 ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const expr = `(async()=>{window.__cssb64=(window.__cssParts||[]).join('');return{len:window.__cssb64.length,ok:window.__cssb64.length===34708,indices:Object.keys(window.__cssParts||{}).length}})()`;
  fs.writeFileSync(path.join(dir, '.cdp-agent-next-call.json'), JSON.stringify({
    viewId,
    method: 'Runtime.evaluate',
    params: { expression: expr, awaitPromise: true, returnByValue: true },
  }));
  console.log('DIAG .cdp-agent-next-call.json');
  process.exit(0);
}

console.error('usage: prep <step|batch> | done <step|batch> | diag');
process.exit(2);
