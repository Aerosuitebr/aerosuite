/**
 * Build small browser_cdp calls: upload b64 parts then eval.
 * node mcp-b64-parts.mjs emit <step> [viewId] [partSize]
 * node mcp-b64-parts.mjs invoke <step> <partIdx> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const partSize = Number(process.argv[5] || 1200);

function loadExpr(step) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, `.mcp-payload-${step}.json`), 'utf8'));
  return (j.arguments?.params ?? j.params).expression;
}

function buildCalls(step, viewId) {
  const b64 = Buffer.from(loadExpr(step), 'utf8').toString('base64');
  const calls = [];
  for (let i = 0, p = 0; i < b64.length; i += partSize, p++) {
    const part = b64.slice(i, i + partSize);
    calls.push({
      viewId,
      method: 'Runtime.evaluate',
      params: {
        expression: `(function(){window.__b64=window.__b64||'';window.__b64+='${part}';return{part:${p},len:window.__b64.length};})()`,
        awaitPromise: false,
        returnByValue: true,
      },
    });
  }
  calls.push({
    viewId,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async()=>{const e=atob(window.__b64||'');window.__b64=null;const v=eval(e);return await v;})()`,
      awaitPromise: true,
      returnByValue: true,
    },
  });
  return calls;
}

const cmd = process.argv[2];

if (cmd === 'emit') {
  const step = Number(process.argv[3]);
  const viewId = process.argv[4] || '4efe11';
  const calls = buildCalls(step, viewId);
  const out = path.join(dir, `.mcp-b64-calls-${step}.json`);
  fs.writeFileSync(out, JSON.stringify(calls));
  console.log(JSON.stringify({ step, parts: calls.length, sizes: calls.map((c) => c.params.expression.length) }));
  process.exit(0);
}

if (cmd === 'invoke') {
  const stepN = Number(process.argv[3]);
  const idx = Number(process.argv[4]);
  const vid = process.argv[5] || '4efe11';
  const file = path.join(dir, `.mcp-b64-calls-${stepN}.json`);
  const calls = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, 'utf8')).map((c) => ({ ...c, viewId: vid }))
    : buildCalls(stepN, vid);
  const call = calls[idx];
  if (!call) process.exit(1);
  fs.writeFileSync(path.join(dir, '.mcp-chunk-invoke.json'), JSON.stringify(call));
  process.stdout.write(JSON.stringify(call));
  process.exit(0);
}

console.error('emit <step> [viewId] | invoke <step> <idx> [viewId]');
process.exit(2);
