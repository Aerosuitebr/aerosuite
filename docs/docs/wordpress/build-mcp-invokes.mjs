/**
 * Build batched CDP runner: steps 0-1 then batches 2-10, 11-20, 21-29.
 * Writes .mcp-invoke-{label}.json for CallMcpTool arguments.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] ?? 'd79a58';

function loadStep(n) {
  const file =
    n === 0
      ? path.join(dir, '.step-0-args.json')
      : path.join(dir, `.step-out-${n}.json`);
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  j.viewId = viewId;
  return j.params.expression;
}

function writeBatch(label, stepNums) {
  const steps = stepNums.map((n) => ({ n, expr: loadStep(n) }));
  const payload = {
    viewId,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async()=>{const steps=${JSON.stringify(steps)};const out={};for(const s of steps){out[s.n]=await eval(s.expr);}return out;})()`,
      awaitPromise: true,
      returnByValue: true,
    },
  };
  fs.writeFileSync(path.join(dir, `.mcp-invoke-${label}.json`), JSON.stringify(payload));
  console.log(label, 'steps', stepNums.join(','), 'exprLen', payload.params.expression.length);
}

writeBatch('0-1', [0, 1]);
writeBatch('2-10', [2, 3, 4, 5, 6, 7, 8, 9, 10]);
writeBatch('11-20', Array.from({ length: 10 }, (_, i) => i + 11));
writeBatch('21-29', Array.from({ length: 9 }, (_, i) => i + 21));
