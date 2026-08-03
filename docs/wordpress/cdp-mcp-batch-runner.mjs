/**
 * Execute one invoke step via chunked MCP-sized CDP calls.
 * Writes .cdp-mcp-batch.json { step, calls[] } and waits for .cdp-mcp-batch-results.json
 * Agent: for each call in batch, browser_cdp -> append results -> write batch-results when done
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[4] || '7c1495';

function loadArgs(n) {
  const p = path.join(dir, `.cdp-step-${n}-args.json`);
  if (!fs.existsSync(p)) {
    execSync(`node .cdp-agent-one-mcp.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  }
  const a = JSON.parse(fs.readFileSync(p, 'utf8'));
  a.viewId = viewId;
  return a;
}

function buildCalls(n) {
  const args = loadArgs(n);
  const expr = args.params.expression;
  if (expr.length <= 3500) {
    return [{ viewId, method: args.method, params: args.params }];
  }
  execSync(`node mcp-chunk-exec.mjs emit-chunks ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const plan = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-chunk-plan-${n}.json`), 'utf8'));
  const fin = JSON.parse(execSync(`node mcp-chunk-exec.mjs emit-final ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' }));
  return [...plan.calls, fin];
}

if (cmd === 'emit') {
  const n = Number(process.argv[3]);
  const calls = buildCalls(n);
  fs.writeFileSync(path.join(dir, '.cdp-mcp-batch.json'), JSON.stringify({ step: n, calls }, null, 0));
  console.log(JSON.stringify({ step: n, calls: calls.length, exprLen: loadArgs(n).params.expression.length }));
  process.exit(0);
}

if (cmd === 'finalize') {
  const n = Number(process.argv[3]);
  const raw = fs.readFileSync(path.join(dir, '.cdp-mcp-batch-results.json'), 'utf8');
  const results = JSON.parse(raw);
  const last = results[results.length - 1];
  const value = last?.result?.value ?? last?.value;
  const out = { result: { type: 'object', value } };
  fs.writeFileSync(path.join(dir, '.cdp-mcp-result.json'), JSON.stringify(out));
  console.log(JSON.stringify({ step: n, value }));
  process.exit(0);
}

if (cmd === 'run') {
  const start = Number(process.argv[3] ?? 1);
  const end = Number(process.argv[4] ?? 29);
  const vid = viewId;
  const batchPath = path.join(dir, '.cdp-mcp-batch.json');
  const batchResultsPath = path.join(dir, '.cdp-mcp-batch-results.json');
  const resultPath = path.join(dir, '.cdp-mcp-result.json');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  (async () => {
    for (let n = start; n <= end; n++) {
      if (fs.existsSync(batchResultsPath)) fs.unlinkSync(batchResultsPath);
      if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
      const calls = buildCalls(n);
      fs.writeFileSync(batchPath, JSON.stringify({ step: n, calls, index: 0 }, null, 0));
      fs.writeFileSync(path.join(dir, '.cdp-needs-mcp-step'), String(n));
      console.log(`AWAIT_BATCH ${n} calls=${calls.length}`);

      let ok = false;
      for (let t = 0; t < 900; t++) {
        if (fs.existsSync(batchResultsPath)) {
          try {
            const br = JSON.parse(fs.readFileSync(batchResultsPath, 'utf8'));
            if (Array.isArray(br) && br.length === calls.length) {
              ok = true;
              break;
            }
          } catch {
            /* partial */
          }
        }
        await sleep(200);
      }
      if (!ok) {
        console.log(JSON.stringify({ error: 'timeout', step: n }));
        process.exit(1);
      }
      const results = JSON.parse(fs.readFileSync(batchResultsPath, 'utf8'));
      const last = results[results.length - 1];
      const value = last?.result?.value ?? last?.value;
      fs.writeFileSync(resultPath, JSON.stringify({ result: { type: 'object', value } }));
      const rec = execSync(`node apply-step-result.mjs ${n} "${resultPath.replace(/\\/g, '/')}"`, {
        cwd: dir,
        encoding: 'utf8',
      });
      console.log(`DONE ${n} ${rec.trim()}`);
      if (rec.includes('"stopped":true') || (rec.includes('"ok":false') && !rec.includes('"ok":true'))) {
        process.exit(1);
      }
      fs.unlinkSync(batchResultsPath);
    }
    console.log('ALL_DONE');
  })();
}
